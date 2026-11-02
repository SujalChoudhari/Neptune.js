import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
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