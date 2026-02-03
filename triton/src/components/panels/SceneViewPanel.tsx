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

    // --- Interaction Handlers ---

    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Zoom
        const zoomSpeed = 0.1;
        const newZoom = Math.max(0.1, Math.min(5, zoom + (e.deltaY < 0 ? zoomSpeed : -zoomSpeed)));
        setZoom(newZoom);
        notifyGame('editor:camera-update', { zoom: newZoom, x: pan.x, y: pan.y });
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
            /* Grid Overlay (Optional CSS grid) */
        .grid {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            background-image:
                linear-gradient(to right, #222 1px, transparent 1px),
                linear-gradient(to bottom, #222 1px, transparent 1px);
            background-size: 50px 50px;
            opacity: 0.5;
        }
        /* Hide Game UI default */
        #neptune-play, #neptune-gamepage { display: none !important; }
        #neptune-canvas { display: block !important; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <canvas id="neptune-canvas"></canvas>
    <script type="module">
        // Import generic bridge setup (logging, error handling)
        // ... (We can duplicate for now to ensure isolation)
        
        // --- BRIDGE START ---
        const emitLog = (type, args) => {
             // ... same as GameView ...
             const message = args.map(arg => String(arg)).join(' '); 
             window.parent.postMessage({ type: 'editor:log', detail: { type, message } }, '*');
        };
        console.log = (...args) => emitLog('info', args);
        console.error = (...args) => emitLog('error', args);

        import { Camera } from "${cameraUrl}";

        const waitForEngine = () => {
             return new Promise(resolve => {
                 const check = () => window.game ? resolve(window.game) : requestAnimationFrame(check);
                 check();
             });
        };

        waitForEngine().then(game => {
             console.log("[SceneView] Engine Connected");
             window.parent.postMessage({ type: 'game:ready' }, '*');
             
             // Force remove play button and overlay with polling
             const forceInit = () => {
                 const playBtn = document.getElementById("neptune-play");
                 if (playBtn) playBtn.remove();
                 
                 const gamePage = document.getElementById("neptune-gamepage");
                 if (gamePage) gamePage.remove();

                 const canvas = document.getElementById("neptune-canvas");
                 if (canvas) canvas.style.display = "block";
                 
                 // Keep checking until they are gone
                 if (document.getElementById("neptune-play") || document.getElementById("neptune-gamepage")) {
                     requestAnimationFrame(forceInit);
                 }
             };
             forceInit();

             if (game.start) {
                 game.start();
                 // Slight delay to ensure init frame runs before pausing
                 setTimeout(() => { if (game.pause) game.pause(); }, 50);
             } else {
                 console.warn("[SceneView] game.start() not found, attempting legacy start");
                 setTimeout(() => { if (game.pause) game.pause(); }, 100);
             }
             
             // Create Editor Camera
             const editorCamera = new Camera(window.innerWidth, window.innerHeight);
             editorCamera.zoom = 1;
             
             // Inject into Scene
             // We need to wait for scene load or hook it
             const hookScene = () => {
                 if (game.scene) {
                     game.scene.activeCamera = editorCamera;
                     // console.log("[SceneView] Editor Camera Activated");
                 }
                 requestAnimationFrame(hookScene);
             };
             hookScene();

             // Resize logic
             window.addEventListener('resize', () => {
                 editorCamera.viewWidth = window.innerWidth;
                 editorCamera.viewHeight = window.innerHeight;
             });

             // Listen for Updates
             window.addEventListener('message', (event) => {
                 const { type, payload } = event.data;
                 if (type === 'editor:camera-update') {
                     editorCamera.position.x = payload.x;
                     editorCamera.position.y = payload.y;
                     editorCamera.setZoom(payload.zoom);
                 } else if (type === 'editor:load-scene') {
                     console.log("[SceneView] Loading scene:", payload.path);
                     if (game.loadScene) {
                         game.loadScene(payload.path).catch(e => console.error(e));
                     }
                 }
             });
        });

        import "${gameMainUrl}";
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
