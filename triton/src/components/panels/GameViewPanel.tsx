import { useRef } from 'react';
// We use the ?url suffix to get the URL of the module script
// This requires Vite to solve the path.
// Path: src/components/panels/GameViewPanel.tsx -> ../../../.. -> root
import gameMainUrl from "../../../../debug_project/main.js?url";

export function GameViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);

    const baseUrl = gameMainUrl.substring(0, gameMainUrl.lastIndexOf('/') + 1);

    const iframeContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="${baseUrl}" />
    <style>
        body { margin: 0; overflow: hidden; background-color: #000; }
        canvas { display: block; width: 100%; height: 100%; }
    </style>
</head>
<body>
    <canvas id="neptune-canvas"></canvas>
    <script type="module">
        // Basic Game Loader
        import "${gameMainUrl}";
        
        // Helper to find deep entities
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
        
        const wait = () => {
            if (window.game) {
                console.log("[GameView] Game Loaded");
                // Notify parent we are ready to receive scene load commands
                window.parent.postMessage({ type: 'game:ready' }, '*');
                
                // Basic Listener for Scene Loading (Minimal Bridge)
                window.addEventListener('message', (e) => {
                    const { type, payload } = e.data;
                    const game = window.game;

                    if (type === 'editor:load-scene' && game.loadScene) {
                         game.loadScene(payload.data || payload.path).catch(console.error);
                    }
                    else if (type === 'editor:update-component') {
                         // Inspector Update Logic
                         const ent = findEntity(game.scene, payload.id);
                         if (ent) {
                             const compName = payload.component;
                             let comp = ent.components.find(c => c.constructor.name.toLowerCase() === compName.toLowerCase());
                             
                             // Handle Transform special case
                             if (!comp && compName.toLowerCase() === 'transform' && ent.transform) {
                                 comp = ent.transform;
                             }
                             
                             if (comp) {
                                 if (comp.deserialize) {
                                     comp.deserialize(payload.data);
                                 } else {
                                     Object.assign(comp, payload.data);
                                 }
                             }
                         }
                    }
                });
            } else {
                requestAnimationFrame(wait);
            }
        };
        wait();
    </script>
</body>
</html>
    `;

    return (
        <div ref={containerRef} className="w-full h-full bg-[#111] relative overflow-hidden flex items-center justify-center border-t border-black">
            <iframe
                className="w-full h-full border-0 block"
                srcDoc={iframeContent}
                title="Game View"
                sandbox="allow-scripts allow-same-origin allow-modals"
            />
        </div>
    );
}
