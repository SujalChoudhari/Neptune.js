import { useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
// Vite supplies a bundled runtime URL in production and a source URL in development.
import neptuneEntryUrl from "virtual:neptune-runtime-url";
import projectResourceBridgeUrl from "@/lib/projectResourceBridge.mjs?url";
import { runtimeSelectionBridgeScript } from "@/lib/runtimeSelectionBridge.mjs";
import { runtimeComponentBridgeScript } from "@/lib/runtimeComponentBridge.mjs";
import { runtimeConsoleBridgeScript } from "@/lib/runtimeConsoleBridge.mjs";
import { runtimeControlBridgeScript } from "@/lib/runtimeControlBridge.mjs";
import { runtimeEntityBridgeScript } from "@/lib/runtimeEntityBridge.mjs";

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

    // Module imports in srcdoc resolve against an opaque document in WebKit,
    // so use the editor's absolute origin rather than Vite's root-relative URL.
    const runtimeUrl = new URL(neptuneEntryUrl, window.location.href).href;
    const baseUrl = runtimeUrl.substring(0, runtimeUrl.lastIndexOf('/') + 1);

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
        const projectResources = installProjectResourceBridge();
        ${runtimeSelectionBridgeScript}
        ${runtimeComponentBridgeScript}
        ${runtimeConsoleBridgeScript}
        ${runtimeControlBridgeScript}
        ${runtimeEntityBridgeScript}

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
                let sceneLoad = Promise.resolve(true);
                let playbackGeneration = 0;
                let projectGeneration = 0;
                let playbackRestore = null;
                let authoredSceneSnapshot = null;
                const cloneScene = game => {
                    const scene = game.scene;
                    if (!scene || typeof scene.serialize !== 'function') return null;
                    return JSON.parse(JSON.stringify(scene.serialize()));
                };
                window.addEventListener('message', (e) => {
                    const { type, payload, projectSession } = e.data;
                    const game = window.game;
                    const reportControlState = state => window.parent.postMessage({ type: 'game:state-update', payload: state, projectSession }, '*');

                    if (type === 'editor:reset-project') {
                        playbackGeneration++;
                        projectGeneration++;
                        playbackRestore = null;
                        authoredSceneSnapshot = null;
                        sceneLoad = Promise.resolve(false);
                        game.resetProject();
                        projectResources.setScenePath('');
                        return;
                    }

                    if (type === 'editor:restore-playback') {
                        const generation = ++playbackGeneration;
                        sceneLoad.then(loaded => {
                            if (!loaded || generation !== playbackGeneration) return;
                            if (!game.isRunning) authoredSceneSnapshot = cloneScene(game);
                            runRuntimeControl(game, 'editor:play', null, reportControlState);
                            if (payload?.paused) runRuntimeControl(game, 'editor:pause', { paused: true }, reportControlState);
                        });
                        return;
                    }

                    if (type === 'editor:stop') {
                        playbackGeneration++;
                        runRuntimeControl(game, type, payload, reportControlState);
                        if (!playbackRestore && authoredSceneSnapshot) {
                            const generation = projectGeneration;
                            const snapshot = authoredSceneSnapshot;
                            const restore = sceneLoad.then(async loaded => {
                                if (!loaded || generation !== projectGeneration) return false;
                                try {
                                    const restored = await game.loadScene(snapshot);
                                    if (restored && generation === projectGeneration) {
                                        window.dispatchEvent(new Event('neptune:editor-selection-ready'));
                                    }
                                    return restored;
                                } catch (error) {
                                    reportRuntimeError('GAME_SCENE_RESTORE_ERROR', describeRuntimeFailure(error));
                                    return false;
                                }
                            });
                            playbackRestore = restore;
                            sceneLoad = restore;
                            void restore.finally(() => { if (playbackRestore === restore) playbackRestore = null; });
                        }
                        return;
                    }

                    if (type === 'editor:play') {
                        playbackGeneration++;
                        if (game.isRunning) {
                            runRuntimeControl(game, type, payload, reportControlState);
                            return;
                        }
                        if (playbackRestore) {
                            const generation = playbackGeneration;
                            const project = projectGeneration;
                            const restore = playbackRestore;
                            void restore.then(loaded => {
                                if (!loaded || generation !== playbackGeneration || project !== projectGeneration || game.isRunning) return;
                                authoredSceneSnapshot = cloneScene(game);
                                runRuntimeControl(game, 'editor:play', payload, reportControlState);
                            });
                            return;
                        }
                        authoredSceneSnapshot = cloneScene(game);
                    } else if (type === 'editor:load-scene') {
                        projectGeneration++;
                        playbackRestore = null;
                        authoredSceneSnapshot = null;
                    }

                    const controlHandled = runRuntimeControl(game, type, payload, state => {
                        window.parent.postMessage({ type: 'game:state-update', payload: state, projectSession }, '*');
                    });
                    if (controlHandled) return;

                    if (type === 'editor:load-scene' && game.loadScene) {
                         if (typeof payload.path === 'string') projectResources.setScenePath(payload.path);
                         sceneLoad = game.loadScene(payload.data || payload.path)
                             .then(loaded => { if (loaded === false) return false; window.dispatchEvent(new Event('neptune:editor-selection-ready')); return true; })
                             .catch(error => { reportRuntimeError('GAME_SCENE_LOAD_ERROR', describeRuntimeFailure(error), payload?.path); return Boolean(game.scene); });
                    }
                    else if (type === 'editor:rename') {
                         if (typeof payload?.name !== 'string') return;
                         const entity = findEntity(game.scene, payload.id);
                         if (entity) entity.name = payload.name;
                    }
                });
            } else {
                requestAnimationFrame(wait);
            }
        };
        import("${runtimeUrl}").then(engine => { window.__neptuneEngineModule = engine; wait(); }).catch((error) => {
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
