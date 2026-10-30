import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import { buildSync } from 'esbuild';

const src = path.resolve('triton/src');
const code = buildSync({
    entryPoints: [path.join(src, 'components/panels/ConsolePanel.tsx')],
    alias: { '@': src }, bundle: true, platform: 'node', format: 'cjs', write: false,
    external: ['react', 'react/jsx-runtime', 'lucide-react', path.join(src, 'components/library'), path.join(src, 'lib/utils')]
}).outputFiles[0].text;

function mountConsole() {
    const listeners = new Map();
    const frames = [{ contentWindow: {} }, { contentWindow: {} }];
    let logs = [];
    let stateIndex = 0;
    const react = {
        useState(initial) {
            const index = stateIndex++;
            if (index === 0) return [logs, next => { logs = typeof next === 'function' ? next(logs) : next; }];
            return [initial, () => {}];
        },
        useEffect(effect) { effect(); }
    };
    const modules = {
        react,
        'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
        'lucide-react': {},
        '@/components/library': {},
        '@/lib/utils': { cn: (...parts) => parts.join(' ') }
    };
    const mod = { exports: {} };
    vm.runInNewContext(code, {
        React: { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) },
        module: mod, exports: mod.exports, require(id) {
            const key = id.startsWith(src) ? `@${id.slice(src.length)}` : id;
            if (!(key in modules)) throw new Error(`Unexpected import: ${id}`);
            return modules[key];
        },
        window: { addEventListener(type, handler) { listeners.set(type, [...(listeners.get(type) || []), handler]); }, removeEventListener() {} },
        document: { querySelectorAll: () => frames }, console, Date, Math
    });
    mod.exports.ConsolePanel({});
    return { frames, logs: () => logs, message: event => listeners.get('message').forEach(handler => handler(event)),
        diagnostic: detail => listeners.get('editor:diagnostic').forEach(handler => handler({ detail })) };
}

test('Console accepts runtime logs and diagnostics but rejects foreign or malformed messages', () => {
    const panel = mountConsole();
    const [game, scene] = panel.frames;
    panel.message({ source: {}, data: { type: 'editor:log', detail: { type: 'error', message: 'forged' } } });
    panel.message({ source: {}, data: { type: 'editor:diagnostic', payload: { code: 'FORGED', message: 'fake' } } });
    panel.message({ source: game.contentWindow, data: { type: 'editor:log', detail: { type: 'info', message: 'real log' } } });
    panel.message({ source: scene.contentWindow, data: { type: 'editor:diagnostic', payload: { code: 'SCENE_FAIL', message: 'real error' } } });
    panel.message({ source: game.contentWindow, data: { type: 'editor:log', detail: { type: 'bogus', message: 'invalid' } } });
    panel.message({ source: game.contentWindow, data: { type: 'editor:log', detail: null } });
    panel.diagnostic({ code: 'EDITOR_FAIL', message: 'local error' });
    assert.deepEqual(Array.from(panel.logs(), entry => entry.message), [
        'real log', '[SCENE_FAIL] real error.', '[EDITOR_FAIL] local error.'
    ]);
});
