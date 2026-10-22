import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import neptuneEntryUrl from "../../../../src/neptune.js?url";
import cameraUrl from "../../../../src/thalassa/camera.js?url";
import scenePickingUrl from "@/lib/scenePicking.mjs?url";
import projectResourceBridgeUrl from "@/lib/projectResourceBridge.mjs?url";
import { runtimeEntityBridgeScript } from "../../lib/runtimeEntityBridge.mjs";
import { translateOnAxis, resizeColliderBounds, getColliderOverlayBounds, getEntitySelectionBounds, isSceneViewBridgeMessageSource } from "@/lib/scenePicking.mjs";
import { invoke } from "@tauri-apps/api/core";
import { ThemedIconButton } from "@/components/library";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { useGameContext } from '@/context/GameContext';
import { EditorGameRunner } from '@/lib/editorGameRunner';

type SpawnPointFacing = 'right' | 'down' | 'left' | 'up';

type SpawnPointOverlayEntity = {
    transform?: { position?: { x?: number; y?: number } };
    components?: Record<string, { facing?: unknown }>;
} | null | undefined;

export function getSpawnPointOverlay(entity: SpawnPointOverlayEntity) {
    const position = entity?.transform?.position;
    const facing = entity?.components?.SpawnPoint?.facing;
    const directions: Record<SpawnPointFacing, { x: number; y: number }> = {
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        up: { x: 0, y: -1 }
    };
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number'
        || !Number.isFinite(position.x) || !Number.isFinite(position.y)
        || typeof facing !== 'string' || !Object.hasOwn(directions, facing)) return null;
    const supportedFacing = facing as SpawnPointFacing;
    return { x: position.x, y: position.y, facing: supportedFacing, direction: directions[supportedFacing] };
}

export function SceneViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { notifyGame, updateComponent, selectedEntityData, selectedEntitiesData, selectedIds } = useGameContext();
    const [gizmoPosition, setGizmoPosition] = useState<{ x: number; y: number } | null>(null);
    const gizmoDragRef = useRef<{
        operation: 'translate-x' | 'translate-y' | 'rotate' | 'scale';
        id: string;
        ids: string[];
        startPositions: Record<string, { x: number; y: number }>;
        startX: number;
        startY: number;
        position: { x: number; y: number };
        rotation: number;
        scale: { x: number; y: number };
    } | null>(null);
    const colliderResizeDragRef = useRef<{
        id: string;
        type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider';
        startX: number;
        startY: number;
        width: number;
        height: number;
    } | null>(null);
    const suppressClickRef = useRef(false);
    const selectionOverlays = useMemo(() => selectedIds
        .map(id => getEntitySelectionBounds(selectedEntitiesData[id]))
        .filter((bounds): bounds is NonNullable<typeof bounds> => bounds !== null), [selectedIds, selectedEntitiesData]);
    const groupGizmoPosition = useMemo(() => selectionOverlays.length > 0 ? {
        x: (Math.min(...selectionOverlays.map(bounds => bounds.x))
            + Math.max(...selectionOverlays.map(bounds => bounds.x + bounds.width))) / 2,
        y: (Math.min(...selectionOverlays.map(bounds => bounds.y))
            + Math.max(...selectionOverlays.map(bounds => bounds.y + bounds.height))) / 2
    } : null, [selectionOverlays]);

    useEffect(() => {
        const position = selectedIds.length > 1
            ? groupGizmoPosition
            : selectedEntityData?.transform.position;
        setGizmoPosition(current => {
            if (!position) return current === null ? current : null;
            if (current?.x === position.x && current.y === position.y) return current;
            return { x: position.x, y: position.y };
        });
    }, [selectedEntityData, selectedIds, selectedEntitiesData, groupGizmoPosition]);

    useEffect(() => {
        const handleBridgeMessage = (event: MessageEvent) => {
            if (!isSceneViewBridgeMessageSource(event.source, iframeRef.current?.contentWindow)) return;
            const { type, payload } = event.data || {};
            if (type === 'editor:project-resource-request' && payload?.id) {
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

    const applyColliderResizeEdit = useCallback((id: string, type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider', width: number, height: number) => {
        const data = type === 'BoxCollider' ? { size: { x: width, y: height } } : { width, height };
        Object.entries(data).forEach(([field, value]) => updateComponent(id, type, field, value));
        EditorGameRunner.updateEntity(id, type, data);
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
        if (event.button !== 0 || selectedIds.length === 0 || !selectedEntityData) return;
        if (selectedIds.length > 1 && operation !== 'translate-x' && operation !== 'translate-y') return;
        const startPositions: Record<string, { x: number; y: number }> = {};
        for (const id of selectedIds) {
            const start = selectedEntitiesData[id]?.transform.position;
            if (!start || !Number.isFinite(start.x) || !Number.isFinite(start.y)) return;
            startPositions[id] = { x: start.x, y: start.y };
        }
        const position = selectedIds.length > 1
            ? groupGizmoPosition
            : gizmoPosition || selectedEntityData.transform.position;
        if (!position) return;
        gizmoDragRef.current = {
            operation,
            id: selectedIds[selectedIds.length - 1],
            ids: [...selectedIds],
            startPositions,
            startX: event.clientX,
            startY: event.clientY,
            position: { x: position.x, y: position.y },
            rotation: selectedEntityData.transform.rotation,
            scale: { ...selectedEntityData.transform.scale }
        };
        event.preventDefault();
        event.stopPropagation();
    };

    const beginColliderResize = (type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider', event: React.MouseEvent<SVGCircleElement>) => {
        if (event.button !== 0 || selectedIds.length !== 1 || !selectedEntityData) return;
        const component = selectedEntityData.components?.[type];
        const width = component?.width ?? component?.size?.x;
        const height = component?.height ?? component?.size?.y;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
        colliderResizeDragRef.current = {
            id: selectedIds[0],
            type,
            startX: event.clientX,
            startY: event.clientY,
            width,
            height
        };
        event.preventDefault();
        event.stopPropagation();
    };

    const resizeColliderWithKeyboard = (
        type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider',
        event: React.KeyboardEvent<SVGCircleElement>
    ) => {
        if (selectedIds.length !== 1 || !selectedEntityData) return;
        const component = selectedEntityData.components?.[type];
        const width = component?.width ?? component?.size?.x;
        const height = component?.height ?? component?.size?.y;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;

        const step = event.shiftKey ? 1 : 0.1;
        let deltaX = 0;
        let deltaY = 0;
        switch (event.key) {
            case 'ArrowLeft': deltaX = -step; break;
            case 'ArrowRight': deltaX = step; break;
            case 'ArrowUp': deltaY = step; break;
            case 'ArrowDown': deltaY = -step; break;
            default: return;
        }

        event.preventDefault();
        event.stopPropagation();
        const size = resizeColliderBounds({ width, height }, deltaX, deltaY, 1);
        applyColliderResizeEdit(selectedIds[0], type, size.width, size.height);
    };

    const adjustGizmoWithKeyboard = (
        operation: 'translate-x' | 'translate-y' | 'rotate' | 'scale',
        event: React.KeyboardEvent<SVGCircleElement>
    ) => {
        if (selectedIds.length > 1) {
            if (operation !== 'translate-x' && operation !== 'translate-y') return;
            const isX = operation === 'translate-x';
            const validKeys = isX ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
            if (!validKeys.includes(event.key)) return;
            const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1;
            const delta = direction * (event.shiftKey ? 1 : 0.1);
            event.preventDefault();
            event.stopPropagation();
            selectedIds.forEach(id => {
                const position = selectedEntitiesData[id]?.transform.position;
                if (!position) return;
                applyTransformEdit(id, {
                    position: { ...position, [isX ? 'x' : 'y']: position[isX ? 'x' : 'y'] + delta }
                });
            });
            if (groupGizmoPosition) {
                setGizmoPosition({
                    x: groupGizmoPosition.x + (isX ? delta : 0),
                    y: groupGizmoPosition.y + (isX ? 0 : delta)
                });
            }
            return;
        }
        if (selectedIds.length !== 1 || !selectedEntityData) return;

        const transform = selectedEntityData.transform;
        const step = event.shiftKey ? 1 : 0.1;
        let data: Record<string, unknown>;
        if (operation === 'translate-x') {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            data = { position: { ...transform.position, x: transform.position.x + direction * step } };
        } else if (operation === 'translate-y') {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            const direction = event.key === 'ArrowUp' ? 1 : -1;
            data = { position: { ...transform.position, y: transform.position.y + direction * step } };
        } else if (operation === 'rotate') {
            const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp'
                ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
            if (!direction) return;
            data = { rotation: transform.rotation + direction * step };
        } else {
            const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp'
                ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
            if (!direction) return;
            const scaleFactor = Math.max(0.01, 1 + direction * (event.shiftKey ? 0.5 : 0.1));
            data = { scale: { x: transform.scale.x * scaleFactor, y: transform.scale.y * scaleFactor } };
        }

        event.preventDefault();
        event.stopPropagation();
        applyTransformEdit(selectedIds[0], data);
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
            y: e.clientY - rect.top,
            multi: Boolean(e.shiftKey || e.ctrlKey || e.metaKey)
        });
    }, [notifyGame]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const colliderDrag = colliderResizeDragRef.current;
        if (colliderDrag) {
            const size = resizeColliderBounds(
                { width: colliderDrag.width, height: colliderDrag.height },
                e.clientX - colliderDrag.startX,
                e.clientY - colliderDrag.startY,
                zoom
            );
            applyColliderResizeEdit(colliderDrag.id, colliderDrag.type, size.width, size.height);
            return;
        }
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
            const moveX = nextPosition.x - drag.position.x;
            const moveY = nextPosition.y - drag.position.y;
            drag.ids.forEach(id => {
                const start = drag.startPositions[id];
                applyTransformEdit(id, { position: { x: start.x + moveX, y: start.y + moveY } });
            });
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
    };

    const handleMouseUp = () => {
        if (gizmoDragRef.current || colliderResizeDragRef.current) {
            gizmoDragRef.current = null;
            colliderResizeDragRef.current = null;
            suppressClickRef.current = true;
        }
        setIsPanning(false);
    };

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
        import { pickEntityAt, updateSelection } from "${scenePickingUrl}";
        import { installProjectResourceBridge } from "${projectResourceBridgeUrl}";
        const projectResourceBridge = installProjectResourceBridge();
        const engineModule = await import("${neptuneEntryUrl}");
        window.__neptuneEngineModule = engineModule;
        ${runtimeEntityBridgeScript}
        
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

             // Editor Camera
            const editorCamera = new Camera(window.innerWidth, window.innerHeight);
            editorCamera.zoom = 1;
            let editorSelection = [];
             
             // Camera Update Listener
             window.addEventListener('message', (e) => {
                 const { type, payload } = e.data;
                if (type === 'editor:select') {
                    editorSelection = updateSelection(payload?.ids, null, true);
                }
                else if (type === 'editor:camera-update') {
                     editorCamera.position.x = payload.x;
                     editorCamera.position.y = payload.y;
                     editorCamera.setZoom(payload.zoom);
                 }
                 else if (type === 'editor:viewport-select') {
                     const world = editorCamera.screenToWorld(payload.x, payload.y);
                     const selected = game.scene && pickEntityAt(game.scene, world.x, world.y);
                     editorSelection = updateSelection(editorSelection, selected?.id, Boolean(payload.multi));
                     window.parent.postMessage({
                         type: 'game:selection-changed',
                         payload: { ids: editorSelection }
                     }, '*');
                 }
                 else if (type === 'editor:load-scene' && game.loadScene) {
                     if (typeof payload.path === 'string') projectResourceBridge.setScenePath(payload.path);
                     game.loadScene(payload.data || payload.path)
                         .then(() => {
                             if (!game.isRunning && game.start) {
                                 // Start only after a scene exists, and keep gameplay behaviors paused in the editor preview.
                                 if (game.pause) game.pause();
                                 game.start();
                             }
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
    const spawnFacingMarker = getSpawnPointOverlay(selectedEntityData);
    const activeGizmoPosition = gizmoPosition || (selectedIds.length > 1
        ? groupGizmoPosition
        : selectedEntityData?.transform.position);
    const gizmoX = activeGizmoPosition ? (activeGizmoPosition.x - pan.x) * zoom : 0;
    const gizmoY = activeGizmoPosition ? (activeGizmoPosition.y - pan.y) * zoom : 0;
    const spawnMarkerX = spawnFacingMarker ? (spawnFacingMarker.x - pan.x) * zoom : 0;
    const spawnMarkerY = spawnFacingMarker ? (spawnFacingMarker.y - pan.y) * zoom : 0;
    const spawnMarkerTipX = spawnMarkerX + (spawnFacingMarker?.direction.x || 0) * 24 * zoom;
    const spawnMarkerTipY = spawnMarkerY + (spawnFacingMarker?.direction.y || 0) * 24 * zoom;
    const spawnArrowBaseX = spawnMarkerTipX - (spawnFacingMarker?.direction.x || 0) * 7 * zoom;
    const spawnArrowBaseY = spawnMarkerTipY - (spawnFacingMarker?.direction.y || 0) * 7 * zoom;
    const spawnArrowPerpendicularX = -(spawnFacingMarker?.direction.y || 0) * 5 * zoom;
    const spawnArrowPerpendicularY = (spawnFacingMarker?.direction.x || 0) * 5 * zoom;
    const spawnArrowPath = `M ${spawnMarkerTipX} ${spawnMarkerTipY} L ${spawnArrowBaseX + spawnArrowPerpendicularX} ${spawnArrowBaseY + spawnArrowPerpendicularY} L ${spawnArrowBaseX - spawnArrowPerpendicularX} ${spawnArrowBaseY - spawnArrowPerpendicularY} Z`;

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
                {selectionOverlays.length > 0 && (
                    <svg
                        aria-label="Selected entities"
                        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                    >
                        {selectionOverlays.map(bounds => (
                            <rect
                                key={bounds.id}
                                aria-label={`Selected ${bounds.name || bounds.id}`}
                                data-selection-outline={bounds.id}
                                x={(bounds.x - pan.x) * zoom}
                                y={(bounds.y - pan.y) * zoom}
                                width={bounds.width * zoom}
                                height={bounds.height * zoom}
                                fill="rgba(56, 189, 248, 0.12)"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                strokeDasharray={selectedIds.length > 1 ? '5 3' : undefined}
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                    </svg>
                )}
                {selectedIds.length > 0 && activeGizmoPosition && (
                    <svg
                        aria-label={selectedIds.length > 1 ? 'Move selected entities' : 'Move selected entity'}
                        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                    >
                        {selectedIds.length === 1 && spawnFacingMarker && (
                            <g
                                role="img"
                                aria-label={`Selected Spawn Point facing ${spawnFacingMarker.facing}`}
                                data-spawn-facing={spawnFacingMarker.facing}
                                pointerEvents="none"
                            >
                                <circle
                                    cx={spawnMarkerX}
                                    cy={spawnMarkerY}
                                    r={7 * zoom}
                                    fill="#fbbf24"
                                    stroke="#111"
                                    strokeWidth={1.5 * zoom}
                                />
                                <line
                                    data-spawn-facing-arrow="shaft"
                                    x1={spawnMarkerX}
                                    y1={spawnMarkerY}
                                    x2={spawnMarkerTipX}
                                    y2={spawnMarkerTipY}
                                    stroke="#fbbf24"
                                    strokeWidth={3 * zoom}
                                />
                                <path d={spawnArrowPath} fill="#fbbf24" />
                            </g>
                        )}
                        {selectedIds.length === 1 && colliderOverlays.map((bounds) => (
                            <g key={bounds.type}>
                                <rect
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
                                <circle
                                    aria-label={`Resize ${bounds.type} bounds`}
                                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
                                    data-collider-resize-handle={bounds.type}
                                    cx={(bounds.x + bounds.width - pan.x) * zoom}
                                    cy={(bounds.y + bounds.height - pan.y) * zoom}
                                    r="5"
                                    fill={bounds.color}
                                    stroke="#111"
                                    strokeWidth="1.5"
                                    className="pointer-events-auto cursor-nwse-resize"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => beginColliderResize(bounds.type, event)}
                                    onKeyDown={(event) => resizeColliderWithKeyboard(bounds.type, event)}
                                />
                            </g>
                        ))}
                        <line x1={gizmoX} y1={gizmoY} x2={gizmoX + 56} y2={gizmoY} stroke="#ff5b5b" strokeWidth="3" />
                        <line x1={gizmoX} y1={gizmoY} x2={gizmoX} y2={gizmoY + 56} stroke="#55c878" strokeWidth="3" />
                        <circle
                            cx={gizmoX + 56}
                            cy={gizmoY}
                            r="7"
                            fill="#ff5b5b"
                            className="pointer-events-auto cursor-ew-resize focus-visible:stroke-white focus-visible:stroke-[5px]"
                            aria-label="Translate on X axis"
                            aria-description="Arrow Left/Right move 0.1 world units; hold Shift to move 1 world unit."
                            aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => beginGizmoDrag('translate-x', event)}
                            onKeyDown={(event) => adjustGizmoWithKeyboard('translate-x', event)}
                        />
                        <circle
                            cx={gizmoX}
                            cy={gizmoY + 56}
                            r="7"
                            fill="#55c878"
                            className="pointer-events-auto cursor-ns-resize focus-visible:stroke-white focus-visible:stroke-[5px]"
                            aria-label="Translate on Y axis"
                            aria-description="Arrow Up/Down move 0.1 world units; hold Shift to move 1 world unit."
                            aria-keyshortcuts="ArrowUp ArrowDown Shift+ArrowUp Shift+ArrowDown"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => beginGizmoDrag('translate-y', event)}
                            onKeyDown={(event) => adjustGizmoWithKeyboard('translate-y', event)}
                        />
                        {selectedIds.length === 1 && (
                            <>
                                <circle
                                    cx={gizmoX}
                                    cy={gizmoY}
                                    r="34"
                                    fill="none"
                                    stroke="#6e8bff"
                                    strokeWidth="3"
                                    className="pointer-events-auto cursor-grab focus-visible:stroke-white focus-visible:stroke-[5px]"
                                    aria-label="Rotate selected entity"
                                    aria-description="Arrow keys rotate 0.1 radians; hold Shift to rotate 1 radian."
                                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => beginGizmoDrag('rotate', event)}
                                    onKeyDown={(event) => adjustGizmoWithKeyboard('rotate', event)}
                                />
                                <circle
                                    cx={gizmoX + 48}
                                    cy={gizmoY + 48}
                                    r="7"
                                    fill="#6e8bff"
                                    className="pointer-events-auto cursor-nwse-resize focus-visible:stroke-white focus-visible:stroke-[5px]"
                                    aria-label="Scale selected entity"
                                    aria-description="Arrow keys change scale by 10%; hold Shift to change scale by 50%."
                                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => beginGizmoDrag('scale', event)}
                                    onKeyDown={(event) => adjustGizmoWithKeyboard('scale', event)}
                                />
                            </>
                        )}
                    </svg>
                )}
            </div>
        </div>
    );
}
