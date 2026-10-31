import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { runtimeSelectionBridgeScript } from '../src/lib/runtimeSelectionBridge.mjs';

test('canvas picking updates runtime selection as well as the editor', () => {
    const listeners = new Map();
    const messages = [];
    const canvas = {
        width: 128, height: 128,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 128, height: 128 })
    };
    const sprite = { constructor: { name: 'Sprite' }, renderOrder: 0, width: 2, height: 2, draw() {} };
    const selected = { id: 'picked', components: [sprite], children: [] };
    const game = { scene: { children: [selected] }, editorSelection: [] };
    const parent = { postMessage: message => messages.push(message) };
    const window = {
        parent, game, document: { getElementById: () => canvas },
        addEventListener: (name, callback) => listeners.set(name, callback),
        dispatchEvent: event => listeners.get(event.type)?.(event)
    };
    class CustomEvent {
        constructor(type, options) { this.type = type; this.detail = options.detail; }
    }
    vm.runInNewContext(runtimeSelectionBridgeScript, { window, CustomEvent });
    listeners.get('pointerdown')({ target: canvas, button: 0, clientX: 0, clientY: 0 });
    assert.equal(messages.at(-1).type, 'game:selection-changed');
    assert.deepEqual(Array.from(messages.at(-1).payload.ids), ['picked']);
    assert.deepEqual(Array.from(game.editorSelection), ['picked']);
    listeners.get('pointerdown')({ target: canvas, button: 0, clientX: 120, clientY: 120 });
    assert.deepEqual(Array.from(game.editorSelection), []);
});
