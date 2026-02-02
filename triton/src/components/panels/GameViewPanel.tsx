import { useRef, useEffect, useState } from 'react';
// We use the ?url suffix to get the URL of the module script
// This requires Vite to solve the path.
// Path: src/components/panels/GameViewPanel.tsx -> ../../../.. -> root
import gameMainUrl from "../../../../debug_project/main.js?url";

export function GameViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const onPlay = () => {
            setIsPlaying(true);
        };

        const onStop = () => {
            setIsPlaying(false);
        };

        window.addEventListener('editor:play', onPlay);
        window.addEventListener('editor:stop', onStop);

        return () => {
            window.removeEventListener('editor:play', onPlay);
            window.removeEventListener('editor:stop', onStop);
        };
    }, []);

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

        // Error Handler
        window.addEventListener('error', (event) => {
            emitLog('error', [event.message]);
        });

        // Import the Game Logic
        // The URL is injected from the React component
        import "${gameMainUrl}";
    </script>
</body>
</html>
    `;

    return (
        <div ref={containerRef} className="w-full h-full bg-[#111] relative overflow-hidden flex items-center justify-center border-t border-black">
            {isPlaying ? (
                <iframe
                    className="w-full h-full border-0 block"
                    srcDoc={iframeContent}
                    title="Game View"
                    sandbox="allow-scripts allow-same-origin allow-modals"
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 font-mono select-none pointer-events-none">
                    <div className="text-4xl mb-2">▶</div>
                    <div>Press Play to Start</div>
                </div>
            )}
        </div>
    );
}
