import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { transformSync } from 'esbuild';
import { readRuntimeSelection } from '../src/lib/runtimeSelectionBridge.mjs';
import { runtimeSelectionBridgeScript } from '../src/lib/runtimeSelectionBridge.mjs';

test('editor selection sent during a scene swap is restored when the new scene loads', () => {
    const listeners = new Map();
    const parent = { postMessage() {} };
    const game = { scene: { children: [{ id: 'old', children: [] }] } };
    const window = {
        game, parent, document: { getElementById() { return null; } },
        addEventListener(type, listener) { listeners.set(type, listener); },
        dispatchEvent(event) { listeners.get(event.type)?.(event); }
    };
    vm.runInNewContext(runtimeSelectionBridgeScript, { window, CustomEvent: class {
        constructor(type, options) { this.type = type; this.detail = options.detail; }
    } });
    listeners.get('message')({ source: parent, data: { type: 'editor:select', payload: { ids: ['new'] } } });
    assert.deepEqual(Array.from(game.editorSelection), []);
    game.scene = { children: [{ id: 'new', children: [] }] };
    window.dispatchEvent({ type: 'neptune:editor-selection-ready' });
    assert.deepEqual(Array.from(game.editorSelection), ['new']);
    listeners.get('message')({ source: parent, data: { type: 'editor:select', payload: { ids: ['missing'] } } });
    listeners.get('message')({ source: parent, data: { type: 'editor:select', payload: { ids: [] } } });
    game.scene = { children: [{ id: 'missing', children: [] }] };
    window.dispatchEvent({ type: 'neptune:editor-selection-ready' });
    assert.deepEqual(Array.from(game.editorSelection), [], 'a later clear must cancel the pending selection');
});

test('runtime-origin selection is relayed to both runtime views', () => {
    const source = fs.readFileSync('triton/src/context/GameContext.tsx', 'utf8');
    const branch = source.match(/case 'game:selection-changed':[\s\S]*?break;\n                case 'game:component-updated'/)?.[0]
        .replace(/\n                case 'game:component-updated'$/, '');
    assert.ok(branch);
    const notifications = [];
    const code = transformSync(`switch ('game:selection-changed') { ${branch} }`, { loader: 'tsx' }).code;
    vm.runInNewContext(code, { payload: { ids: ['hero'] }, readRuntimeSelection,
        entities: { hero: {} }, entityDataCache: {}, isPlaying: false,
        setSelectedIds() {}, setSelectedEntitiesData() {},
        notifyGame: (type, payload) => notifications.push({ type, ids: Array.from(payload.ids) }) });
    assert.deepEqual(notifications, [{ type: 'editor:select', ids: ['hero'] }]);
});

test('selection during play keeps the authored inspector data', () => {
    const source = fs.readFileSync('triton/src/context/GameContext.tsx', 'utf8');
    const branch = source.match(/case 'game:selection-changed':[\s\S]*?break;\n                case 'game:component-updated'/)?.[0]
        .replace(/\n                case 'game:component-updated'$/, '');
    assert.ok(branch);
    const authored = { id: 'hero', name: 'Authored' };
    let selected;
    vm.runInNewContext(transformSync(`switch ('game:selection-changed') { ${branch} }`, { loader: 'tsx' }).code, {
        payload: { ids: ['hero'], data: { hero: { id: 'hero', name: 'Runtime' } } }, readRuntimeSelection,
        entities: { hero: {} }, entityDataCache: { hero: authored }, isPlaying: true,
        setSelectedIds() {}, setSelectedEntitiesData: value => { selected = value; }, notifyGame() {}
    });
    assert.equal(selected.hero, authored);
    assert.equal(authored.name, 'Authored');
});
