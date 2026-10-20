import { useRef, useState, useCallback, useEffect } from 'react';
import neptuneEntryUrl from "../../../../src/neptune.js?url";
import cameraUrl from "../../../../src/thalassa/camera.js?url";
import scenePickingUrl from "@/lib/scenePicking.mjs?url";
import projectResourceBridgeUrl from "@/lib/projectResourceBridge.mjs?url";
import { translateOnAxis, getColliderOverlayBounds } from "@/lib/scenePicking.mjs";
import { invoke } from "@tauri-apps/api/core";
import { ThemedIconButton } from "@/components/library";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { useGameContext } from '@/context/GameContext';
import { EditorGameRunner } from '@/lib/editorGameRunner';

export function SceneViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { notifyGame, updateComponent, selectedEntityData, selectedIds } = useGameContext();
    const [gizmoPosition, setGizmoPosition] = useState<{ x: number; y: number } | null>(null);
    const gizmoDragRef = useRef<{
        operation: 'translate-x' | 'translate-y' | 'rotate' | 'scale';
        id: string;
        startX: number;
        startY: number;
        position: { x: number; y: number };
        rotation: number;
        scale: { x: number; y: number };
    } | null>(null);
    const suppressClickRef = useRef(false);

    useEffect(() => {
        const position = selectedEntityData?.transform.position;
        setGizmoPosition(position ? { x: position.x, y: position.y } : null);
    }, [selectedEntityData]);

    useEffect(() => {
        const handleBridgeMessage = (event: MessageEvent) => {
            const { type, payload } = event.data || {};
            if (type === 'editor:project-resource-request' && payload?.id) {
                if (event.source !== iframeRef.current?.contentWindow) return;
                const command = payload.kind === 'image' ? 'read_image_asset' : payload.kind === 'audio' ? 'read_audio_asset' : payload.kind === 'text' ? 'read_file' : null;
                const reply = (content: string | null, error: string | null) => {
                    (event.source as WindowProxy | null)?.postMessage({
                        type: 'editor:project-resource-response',
                        payload: { id: payload.id, content, error }
                    }, '*');
                };
                if (!command || typeof payload.path !== 'string') {
                    reply(null, 'Invalid project resource request');
                    return;
                }
                void invoke<string>(command, { path: payload.path })
                    .then(content => reply(content, null))
                    .catch(error => reply(null, String(error)));
            } else if (type === 'editor:scene-loaded' && payload?.data) {
                try {
                    EditorGameRunner.openScene(payload.data, payload.path);
                } catch {
                    // openScene emits the actionable diagnostic for the Console panel.
                }
            } else if (type === 'editor:scene-diagnostic' && payload) {
                EditorGameRunner.report(payload);
            }
        };

        window.addEventListener('message', handleBridgeMessage);
        return () => window.removeEventListener('message', handleBridgeMessage);
    }, []);

    // Editor Camera State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const baseUrl = neptuneEntryUrl.substring(0, neptuneEntryUrl.lastIndexOf('/') + 1);

    const applyTransformEdit = useCallback((id: string, data: Record<string, unknown>) => {
        Object.entries(data).forEach(([field, value]) => updateComponent(id, 'transform', field, value));
        EditorGameRunner.updateEntity(id, 'transform', data);
    }, [updateComponent]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Zoom
        const zoomSpeed = 0.1;
        const delta = e.deltaY < 0 ? zoomSpeed : -zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta));

        // Calculate new Pan to keep (mx, my) at the same World Position
        const newPanX = pan.x + (mx / zoom) - (mx / newZoom);
        const newPanY = pan.y + (my / zoom) - (my / newZoom);

        const newPan = { x: newPanX, y: newPanY };

        setZoom(newZoom);
        setPan(newPan);
        notifyGame('editor:camera-update', { zoom: newZoom, x: newPanX, y: newPanY });
    }, [zoom, pan, notifyGame]);

    const beginGizmoDrag = (operation: 'translate-x' | 'translate-y' | 'rotate' | 'scale', event: React.MouseEvent<SVGCircleElement>) => {
        if (event.button !== 0 || selectedIds.length !== 1 || !selectedEntityData) return;
        const position = gizmoPosition || selectedEntityData.transform.position;
        gizmoDragRef.current = {
            operation,
            id: selectedIds[0],
            startX: event.clientX,
            startY: event.clientY,
            position: { x: position.x, y: position.y },
            rotation: selectedEntityData.transform.rotation,
            scale: { ...selectedEntityData.transform.scale }
        };
        event.preventDefault();
        event.stopPropagation();
    };

    const handleViewportClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }
        if (e.button !== 0 || e.altKey) return;
        const rect = e.currentTarget.getBoundingClientRect();
        notifyGame('editor:viewport-select', {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }, [notifyGame]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const drag = gizmoDragRef.current;
        if (drag) {
            const deltaX = e.clientX - drag.startX;
            const deltaY = e.clientY - drag.startY;
            if (drag.operation === 'rotate') {
                applyTransformEdit(drag.id, { rotation: drag.rotation + deltaX * 0.01 });
                return;
            }
            if (drag.operation === 'scale') {
                const factor = Math.max(0.01, 1 + (deltaX - deltaY) / 100);
                applyTransformEdit(drag.id, { scale: { x: drag.scale.x * factor, y: drag.scale.y * factor } });
                return;
            }
            const nextPosition = translateOnAxis(drag.position, deltaX, deltaY, zoom, drag.operation === 'translate-x' ? 'x' : 'y');
            setGizmoPosition(nextPosition);
            applyTransformEdit(drag.id, { position: nextPosition });
            return;
        }
        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;

            // Pan in World Space depends on Zoom
            const worldDx = dx / zoom;
            const worldDy = dy / zoom;

            const newPan = { x: pan.x - worldDx, y: pan.y - worldDy };
            setPan(newPan);
            setLastMousePos({ x: e.clientX, y: e.clientY });

            notifyGame('editor:camera-update', { zoom, x: newPan.x, y: newPan.y });
        }
    }, [isPanning, lastMousePos, pan, zoom, notifyGame, applyTransformEdit]);

    const handleMouseUp = useCallback(() => {
        if (gizmoDragRef.current) {
            gizmoDragRef.current = null;
            suppressClickRef.current = true;
        }
        setIsPanning(false);
    }, []);

    const resetCamera = () => {
        setPan({ x: 0, y: 0 });
        setZoom(1);
        notifyGame('editor:camera-update', { zoom: 1, x: 0, y: 0 });
    };

    // --- Bridge Script ---
    // Inject Editor Camera logic
    const iframeContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="${baseUrl}" />
    <style>
        body { margin: 0; overflow: hidden; background-color: #000; width: 100vw; height: 100vh; }
        canvas { display: block; width: 100%; height: 100%; }
        .grid {
            position: absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; opacity:0.5;
            background-image: linear-gradient(to right, #222 1px, transparent 1px), linear-gradient(to bottom, #222 1px, transparent 1px);
            background-size: 50px 50px;
        }
        #neptune-play, #neptune-gamepage { display: none !important; }
        #neptune-canvas { display: block !important; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <canvas id="neptune-canvas"></canvas>
    
    <script type="module">
        import { Camera } from "${cameraUrl}";
        import { pickEntityAt } from "${scenePickingUrl}";
        import { installProjectResourceBridge } from "${projectResourceBridgeUrl}";
        const projectResourceBridge = installProjectResourceBridge();
        await import("${neptuneEntryUrl}");
        
        const findEntity = (root, id) => {
             if (!root) return null;
             if (root.id === id) return root;
             if (root.children) {
                 for (const child of root.children) {
                     const found = findEntity(child, id);
                     if (found) return found;
                 }
             }
             return null;
        };
        
        const waitForEngine = () => new Promise(r => {
             const c = () => window.game ? r(window.game) : requestAnimationFrame(c);
             c();
        });

        waitForEngine().then(game => {
             console.log("[SceneView] Game Connected");
             window.parent.postMessage({ type: 'game:ready' }, '*');
             
             // Cleanup UI
             const cleanup = () => {
                 document.getElementById("neptune-play")?.remove();
                 document.getElementById("neptune-gamepage")?.remove();
                 const c = document.getElementById("neptune-canvas");
                 if(c) c.style.display = 'block';
                 if(document.getElementById("neptune-play")) requestAnimationFrame(cleanup);
             };
             cleanup();

             // Start Game
             if (game.start) {
                 // Render editor previews without running gameplay behaviors.
                 if (game.pause) game.pause();
                 game.start();
             }

             // Editor Camera
             const editorCamera = new Camera(window.innerWidth, window.innerHeight);
             editorCamera.zoom = 1;
             
             // Camera Update Listener
             window.addEventListener('message', (e) => {
                 const { type, payload } = e.data;
                 if (type === 'editor:camera-update') {
                     editorCamera.position.x = payload.x;
                     editorCamera.position.y = payload.y;
                     editorCamera.setZoom(payload.zoom);
                 }
                 else if (type === 'editor:viewport-select') {
                     const world = editorCamera.screenToWorld(payload.x, payload.y);
                     const selected = game.scene && pickEntityAt(game.scene, world.x, world.y);
                     window.parent.postMessage({
                         type: 'game:selection-changed',
                         payload: { ids: selected ? [selected.id] : [] }
                     }, '*');
                 }
                 else if (type === 'editor:load-scene' && game.loadScene) {
                     if (typeof payload.path === 'string') projectResourceBridge.setScenePath(payload.path);
                     game.loadScene(payload.data || payload.path)
                         .then(() => {
                             window.parent.postMessage({ type: 'editor:scene-loaded', payload }, '*');
                             if(game.scene) game.scene.activeCamera = editorCamera; 
                         })
                         .catch((error) => {
                             window.parent.postMessage({
                                 type: 'editor:scene-diagnostic',
                                 payload: {
                                     code: error?.code || 'EDITOR_DATA_INVALID',
                                     severity: 'error',
                                     message: error?.message || String(error),
                                     source: error?.sourceLocation,
                                     action: 'Fix the reported data and reopen the scene.'
                                 }
                             }, '*');
                         });
                 }
                 else if (type === 'editor:update-component') {
                     if (!game.scene) return;
                     const ent = findEntity(game.scene, payload.id);
                     if (ent) {
                         const compName = payload.component;
                         let comp = ent.components.find(c => c.constructor.name.toLowerCase() === compName.toLowerCase());
                         if (!comp && compName.toLowerCase() === 'transform' && ent.transform) comp = ent.transform;
                         
                         if (comp) {
                             if (comp.deserialize) comp.deserialize(payload.data);
                             else Object.assign(comp, payload.data);
                         }
                     }
                 }
             });
             
             // Initial Hook
             const hook = () => {
                 if (game.scene) game.scene.activeCamera = editorCamera;
                 requestAnimationFrame(hook);
             };
             hook();
             
             // Resize
             window.addEventListener('resize', () => {
                 editorCamera.viewWidth = window.innerWidth;
                 editorCamera.viewHeight = window.innerHeight;
             });
        });
    </script>
</body>
</html>
    `;

    const colliderOverlays = getColliderOverlayBounds(selectedEntityData);
    const activeGizmoPosition = gizmoPosition || selectedEntityData?.transform.position;
    const gizmoX = activeGizmoPosition ? (activeGizmoPosition.x - pan.x) * zoom : 0;
    const gizmoY = activeGizmoPosition ? (activeGizmoPosition.y - pan.y) * zoom : 0;

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-[#111] relative overflow-hidden flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Floating Controls */}
            <div className="absolute bottom-4 right-4 flex flex-row gap-2 z-20 pointer-events-auto items-center">
                <div className="bg-black/50 backdrop-blur-md text-xs text-white px-2 py-1 rounded text-center select-none mr-2">
                    {Math.round(zoom * 100)}%
                </div>
                <ThemedIconButton size="sm" onClick={() => {
                    const newZoom = Math.min(5, zoom + 0.1);
                    setZoom(newZoom);
                    notifyGame('editor:camera-update', { zoom: newZoom, x: pan.x, y: pan.y });
                }} title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={() => {
                    const newZoom = Math.max(0.1, zoom - 0.1);
                    setZoom(newZoom);
                    notifyGame('editor:camera-update', { zoom: newZoom, x: pan.x, y: pan.y });
                }} title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={resetCamera} title="Reset View">
                    <Maximize className="w-4 h-4" />
                </ThemedIconButton>
            </div>

            <div
                className="flex-1 relative cursor-crosshair"
                onMouseDown={handleMouseDown}
                onClick={handleViewportClick}
                onWheel={handleWheel}
            >
                <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0 block pointer-events-none select-none"
                    srcDoc={iframeContent}
                    title="Scene View"
                    sandbox="allow-scripts allow-same-origin allow-modals"
                />
                {selectedEntityData && selectedIds.length === 1 && activeGizmoPosition && (
                    <svg
                        aria-label="Move selected entity"
                        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                    >
                        {colliderOverlays.map((bounds) => (
                            <rect
                                key={bounds.type}
                                aria-label={`Selected ${bounds.type} bounds`}
                                data-collider-role={bounds.type}
                                x={(bounds.x - pan.x) * zoom}
                                y={(bounds.y - pan.y) * zoom}
                                width={bounds.width * zoom}
                                height={bounds.height * zoom}
                                fill={bounds.color}
                                fillOpacity={0.12}
                                stroke={bounds.color}
                                strokeWidth={1.5}
                                strokeDasharray={bounds.type === 'TriggerCollider' ? '5 3' : undefined}
                            >
                                <title>{bounds.type} bounds</title>
                            </rect>
                        ))}
                        <line x1={gizmoX} y1={gizmoY} x2={gizmoX + 56} y2={gizmoY} stroke="#ff5b5b" strokeWidth="3" />
                        <line x1={gizmoX} y1={gizmoY} x2={gizmoX} y2={gizmoY + 56} stroke="#55c878" strokeWidth="3" />
                        <circle
                            cx={gizmoX + 56}
                            cy={gizmoY}
                            r="7"
                            fill="#ff5b5b"
                            className="pointer-events-auto cursor-ew-resize"
                            aria-label="Translate on X axis"
                            onMouseDown={(event) => beginGizmoDrag('translate-x', event)}
                        />
                        <circle
                            cx={gizmoX}
                            cy={gizmoY + 56}
                            r="7"
                            fill="#55c878"
                            className="pointer-events-auto cursor-ns-resize"
                            aria-label="Translate on Y axis"
                            onMouseDown={(event) => beginGizmoDrag('translate-y', event)}
                        />
                        <circle
                            cx={gizmoX}
                            cy={gizmoY}
                            r="34"
                            fill="none"
                            stroke="#6e8bff"
                            strokeWidth="3"
                            className="pointer-events-auto cursor-grab"
                            aria-label="Rotate selected entity"
                            onMouseDown={(event) => beginGizmoDrag('rotate', event)}
                        />
                        <circle
                            cx={gizmoX + 48}
                            cy={gizmoY + 48}
                            r="7"
                            fill="#6e8bff"
                            className="pointer-events-auto cursor-nwse-resize"
                            aria-label="Scale selected entity"
                            onMouseDown={(event) => beginGizmoDrag('scale', event)}
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}
