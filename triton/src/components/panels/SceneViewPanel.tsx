import { useRef, useState, useCallback } from 'react';
import gameMainUrl from "../../../../debug_project/main.js?url";
import cameraUrl from "../../../../src/thalassa/camera.js?url";
import { ThemedIconButton } from "@/components/library";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { useGameContext } from '@/context/GameContext';

export function SceneViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { notifyGame } = useGameContext();

    // Editor Camera State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const baseUrl = gameMainUrl.substring(0, gameMainUrl.lastIndexOf('/') + 1);

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

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
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
    }, [isPanning, lastMousePos, pan, zoom, notifyGame]);

    const handleMouseUp = useCallback(() => {
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
        import "${gameMainUrl}";
        
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
                 game.start();
                 setTimeout(() => { if (game.pause) game.pause(); }, 50);
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
                 else if (type === 'editor:load-scene' && game.loadScene) {
                     game.loadScene(payload.data || payload.path)
                         .then(() => { 
                             if(game.scene) game.scene.activeCamera = editorCamera; 
                         })
                         .catch(console.error);
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
                onWheel={handleWheel}
            >
                <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0 block pointer-events-none select-none"
                    srcDoc={iframeContent}
                    title="Scene View"
                    sandbox="allow-scripts allow-same-origin allow-modals"
                />
            </div>
        </div>
    );
}
