import { useRef } from 'react';
// We use the ?url suffix to get the URL of the module script
// This requires Vite to solve the path.
// Path: src/components/panels/GameViewPanel.tsx -> ../../../.. -> root
import gameMainUrl from "../../../../debug_project/main.js?url";

export function GameViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);
    // Remove local isPlaying state usage for unmounting. 
    // We want iframe always there.

    // Compute the base URL for the Iframe
    // gameMainUrl is something like /@fs/path/to/debug_project/main.js
    // We want /@fs/path/to/debug_project/
    const baseUrl = gameMainUrl.substring(0, gameMainUrl.lastIndexOf('/') + 1);

    // Construct the Iframe Content
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
    </style>
</head>
<body>
    <canvas id="neptune-canvas"></canvas>
    <script type="module">
        // --- BRIDGE START ---
        
        // Console Bridge
        const emitLog = (type, args) => {
            const safeStringify = (obj) => {
                const cache = new Set();
                return JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (cache.has(value)) {
                            return '[Circular]';
                        }
                        cache.add(value);
                    }
                    return value;
                });
            };

            const message = args.map(arg => 
                typeof arg === 'object' ? safeStringify(arg) : String(arg)
            ).join(' ');
            
            // Send to parent window
            window.parent.postMessage({
                type: 'editor:log',
                detail: { type, message }
            }, '*');
        };

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            emitLog('info', args);
        };
        console.warn = (...args) => {
            originalWarn(...args);
            emitLog('warn', args);
        };
        console.error = (...args) => {
            originalError(...args);
            emitLog('error', args);
        };

        window.addEventListener('error', (event) => {
            emitLog('error', [event.message]);
        });

        // --- EDITOR COMMUNICATION BRIDGE ---
        
        // Wait for Engine
        const waitForEngine = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (window.game) {
                        resolve(window.game);
                    } else {
                        requestAnimationFrame(check);
                    }
                };
                check();
            });
        };

        waitForEngine().then((game) => {
            console.log("[Bridge] Engine Connected");
            
            // Notify Editor
            window.parent.postMessage({ type: 'game:ready' }, '*');
            
            // 1. Hook into Scene Changes / Creation
            // We assume the game has a way to get the current scene entities
            // For now, let's Poll or Hook
            
            // Override or Hook game.loadScene or similar if available
            
            // --- OUTGOING (Game -> Editor) ---
            
            const sendHierarchy = () => {
                if (!game.scene || !game.scene.entities) return;
                
                // Convert Game Entities to SceneEntity format
                // This assumes game.scene.entities is a Map or Array
                const entities = {};
                
                // Add Root
                entities['root'] = {
                    id: 'root',
                    parentId: null,
                    name: 'Main Scene',
                    type: 'group',
                    children: [],
                    active: true,
                    locked: false,
                    expanded: true
                };

                // Traverse
                game.scene.entities.forEach(entity => {
                    entities[entity.id] = {
                        id: entity.id,
                        parentId: entity.parent ? entity.parent.id : 'root',
                        name: entity.name || 'GameObject',
                        type: entity.type || 'cube', // Need mapping
                        children: entity.children ? entity.children.map(c => c.id) : [],
                        active: entity.active !== false,
                        locked: entity.locked || false,
                        expanded: false
                    };
                    
                    // Add to parent's children list
                    const pid = entity.parent ? entity.parent.id : 'root';
                    if (entities[pid]) {
                        entities[pid].children.push(entity.id);
                    }
                });
                
                window.parent.postMessage({ type: 'game:hierarchy-update', payload: entities }, '*');
            };

            const sendSelection = () => {
                 // Check game.selection array/set
                 const selection = game.selection ? Array.from(game.selection) : [];
                 const ids = selection.map(e => e.id);
                 const data = {};
                 
                 // Collect data directly from selection objects
                 selection.forEach(ent => {
                     if (ent) {
                         const entData = {
                             id: ent.id,
                             name: ent.name,
                             active: ent.active,
                             transform: ent.transform || { position: {x:0,y:0}, rotation:0, scale: {x:1,y:1} },
                         };
                         // Try to serialize other components dynamically if possible
                         ['sprite', 'collider', 'body', 'stats', 'animator', 'sound'].forEach(compName => {
                             if (ent[compName]) {
                                 entData[compName] = ent[compName];
                             }
                         });
                         data[ent.id] = entData;
                     }
                 });
                 
                 window.parent.postMessage({ type: 'game:selection-changed', payload: { ids, data } }, '*');
            };
            
            // --- INCOMING (Editor -> Game) ---
            
            window.addEventListener('message', (event) => {
                const { type, payload } = event.data;
                if (!type) return;
                
                // Debug log for incoming messages
                if(type !== 'editor:request-state') console.log("[Bridge] Received:", type, payload);

                switch (type) {
                    case 'editor:request-state':
                        sendHierarchy();
                        sendSelection();
                        break;
                        
                    case 'editor:select':
                        // payload.ids
                        if (game.selection) {
                            game.selection.clear();
                            payload.ids.forEach(id => {
                                const ent = game.scene.getEntity(id);
                                if (ent) game.selection.add(ent);
                            });
                        }
                        break;
                        
                    case 'editor:update-component':
                        // payload: { id, component, data }
                        const ent = game.scene.getEntity(payload.id);
                        if (ent) {
                            if (payload.component === 'transform' && ent.transform) {
                                Object.assign(ent.transform, payload.data); // Careful with nested props
                            } else if (payload.component === 'transform' && payload.key) {
                                // Direct key update for transform might be passed as data={key, val} or specific structure
                                // Inspector currently sends: updateComponent(id, 'transform', key, value)
                                // Which arrives as { id, component:'transform', data: ??? }
                                // Wait, GameContext sends: notifyGame('editor:update-component', { id, component, [key?]: value, data })
                                // Let's check GameContext dispatch logic.
                                // It seems flexible. Let's assume payload matches.
                            } else if (ent[payload.component]) {
                                Object.assign(ent[payload.component], payload.data);
                            }
                        }
                        break;
                        
                     case 'editor:move-entities':
                        // payload: { ids, targetParentId, index }
                        // Implement parenting logic in game
                        break;
                        
                     case 'editor:pause':
                        if (payload.paused) {
                            if (game.pause) game.pause();
                        } else {
                            if (game.resume) game.resume();
                        }
                        break;
                        
                     case 'editor:play':
                        if (game.start) game.start();
                        break;
                        
                     case 'editor:stop':
                        if (game.stop) game.stop();
                        // Reload scene to reset state?
                        if (game.scene && game.scene.reload) game.scene.reload();
                        break;
                        
                     case 'editor:load-scene':
                        console.log("[Bridge] Loading scene:", payload.path);
                        if (game.loadScene) {
                            game.loadScene(payload.path).catch(e => console.error(e));
                        }
                        break;
                }
            });

            // --- CLICK PICKING ---
            
            const canvas = document.getElementById('neptune-canvas');
            if (canvas) {
                canvas.addEventListener('mousedown', (e) => {
                    // Simple picking if Engine supports it
                    // const picked = game.pick(e.offsetX, e.offsetY);
                    // if (picked) ... notify editor
                });
            }
            
            // Periodic Sync (Temporary until events are fully hooked)
            setInterval(() => {
                sendHierarchy();
                sendSelection();
            }, 500); // 2fps sync for responsiveness
            
        });


        // Import the Game Logic
        import "${gameMainUrl}";
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
