import { useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
// We use the ?url suffix to get the URL of the module script
// This requires Vite to solve the path.
// Path: src/components/panels/GameViewPanel.tsx -> ../../../.. -> root
import neptuneEntryUrl from "../../../../src/neptune.js?url";
import projectResourceBridgeUrl from "@/lib/projectResourceBridge.mjs?url";
import { runtimeSelectionBridgeScript } from "@/lib/runtimeSelectionBridge.mjs";
import { runtimeConsoleBridgeScript } from "@/lib/runtimeConsoleBridge.mjs";
import { runtimeControlBridgeScript } from "@/lib/runtimeControlBridge.mjs";

export function GameViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleResourceRequest = (event: MessageEvent) => {
            const { type, payload } = event.data || {};
            if (type !== 'editor:project-resource-request' || typeof payload?.id !== 'string') return;
            if (event.source !== iframeRef.current?.contentWindow) return;
            const command = payload.kind === 'image' ? 'read_image_asset' : payload.kind === 'audio' ? 'read_audio_asset' : payload.kind === 'text' ? 'read_file' : null;
            const reply = (content: string | null, error: string | null) => {
                (event.source as WindowProxy).postMessage({
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
        };
        window.addEventListener('message', handleResourceRequest);
        return () => window.removeEventListener('message', handleResourceRequest);
    }, []);

    const baseUrl = neptuneEntryUrl.substring(0, neptuneEntryUrl.lastIndexOf('/') + 1);

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
        import { installProjectResourceBridge } from "${projectResourceBridgeUrl}";
        installProjectResourceBridge();
        ${runtimeSelectionBridgeScript}
        ${runtimeConsoleBridgeScript}
        ${runtimeControlBridgeScript}

        const reportRuntimeError = (code, message, source) => {
            window.parent.postMessage({
                type: 'editor:diagnostic',
                payload: {
                    code,
                    severity: 'error',
                    message,
                    source,
                    action: 'Fix the game runtime error and retry.'
                }
            }, '*');
        };
        const describeRuntimeFailure = (reason) => {
            if (reason && typeof reason === 'object' && typeof reason.message === 'string' && reason.message.trim()) {
                return reason.message;
            }
            return String(reason);
        };

        window.addEventListener('error', (event) => {
            reportRuntimeError('GAME_RUNTIME_ERROR', event.message || describeRuntimeFailure(event.error), event.filename || undefined);
        });
        window.addEventListener('unhandledrejection', (event) => {
            reportRuntimeError('GAME_UNHANDLED_REJECTION', describeRuntimeFailure(event.reason));
        });

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
                window.dispatchEvent(new Event('neptune:editor-selection-ready'));
                // Notify parent we are ready to receive scene load commands
                window.parent.postMessage({ type: 'game:ready' }, '*');
                
                // Basic Listener for Scene Loading (Minimal Bridge)
                window.addEventListener('message', (e) => {
                    const { type, payload } = e.data;
                    const game = window.game;

                    const controlHandled = runRuntimeControl(game, type, payload, state => {
                        window.parent.postMessage({ type: 'game:state-update', payload: state }, '*');
                    });
                    if (controlHandled) return;

                    if (type === 'editor:load-scene' && game.loadScene) {
                         game.loadScene(payload.data || payload.path)
                             .then(() => window.dispatchEvent(new Event('neptune:editor-selection-ready')))
                             .catch(error => reportRuntimeError('GAME_SCENE_LOAD_ERROR', describeRuntimeFailure(error), payload?.path));
                    }
                    else if (type === 'editor:rename') {
                         if (typeof payload?.name !== 'string') return;
                         const entity = findEntity(game.scene, payload.id);
                         if (entity) entity.name = payload.name;
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
        import("${neptuneEntryUrl}").then(wait).catch((error) => {
            reportRuntimeError('GAME_BOOT_ERROR', error instanceof Error ? error.message : String(error));
        });
    </script>
</body>
</html>
    `;

    return (
        <div ref={containerRef} className="w-full h-full bg-[#111] relative overflow-hidden flex items-center justify-center border-t border-black">
            <iframe
                ref={iframeRef}
                className="w-full h-full border-0 block"
                srcDoc={iframeContent}
                title="Game View"
                sandbox="allow-scripts allow-same-origin allow-modals"
            />
        </div>
    );
}
