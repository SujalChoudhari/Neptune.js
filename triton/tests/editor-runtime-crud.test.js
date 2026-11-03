import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { SceneLoader } from '../../src/core/sceneLoader.js';
import { ComponentRegistry } from '../../src/core/componentRegistry.js';
import { Shape } from '../../src/rendering/shape.js';
import { Transform } from '../../src/components/transform.js';
import { runtimeSelectionBridgeScript, pickRuntimeEntityAt } from '../src/lib/runtimeSelectionBridge.mjs';

const source = fs.readFileSync('triton/src/components/panels/SceneViewPanel.tsx', 'utf8');
assert.match(source, /\$\{runtimeSelectionBridgeScript\}/, 'the real Scene View installs the CRUD/selection bridge');
assert.match(source, /new Event\('neptune:editor-selection-ready'\)/, 'scene reload retries selection');
const module = { exports: {} };
vm.runInNewContext(buildSync({ stdin: { contents: fs.readFileSync('triton/src/lib/editorGameRunner.ts', 'utf8'), loader: 'ts' }, bundle: true, format: 'cjs', platform: 'node', write: false }).outputFiles[0].text, {
    module, exports: module.exports, console, window: { dispatchEvent() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
});
const Runner = module.exports.EditorGameRunner;

function connect(game) {
    const listeners = new Map();
    const messages = [];
    const parent = { postMessage(message) { messages.push(message); } };
    const canvas = { width: 512, height: 512, getBoundingClientRect: () => ({ left: 0, top: 0, width: 512, height: 512 }) };
    const window = {
        game, parent, document: { getElementById(id) { return id === 'neptune-canvas' ? canvas : null; } },
        addEventListener(type, listener) { listeners.set(type, listener); },
        dispatchEvent(event) { listeners.get(event.type)?.(event); }
    };
    vm.runInNewContext(runtimeSelectionBridgeScript, { window, CustomEvent: class {
        constructor(type, options) { this.type = type; this.detail = options.detail; }
    } });
    const send = (type, payload) => listeners.get('message')({ source: parent, data: { type, payload } });
    send.pointer = (x, y) => listeners.get('pointerdown')({ target: canvas, button: 0, clientX: x, clientY: y });
    send.messages = messages;
    return send;
}

test('hierarchy selection and CRUD keep the live scene and saved/reopened scene in sync', async () => {
    Runner.openScene({ id: 'scene-crud', name: 'CRUD', layers: [{ id: 'group', type: 'main', name: 'Group', entities: [
        { id: 'parent', name: 'Parent', children: [{ id: 'child', name: 'Child' }] },
        { id: 'sibling', name: 'Sibling' }
    ] }] }, 'scenes/crud.scene');
    const game = { scene: SceneLoader.parse(Runner.currentScene) };
    const send = connect(game);
    const group = game.scene.children.find(entity => entity.id === 'group');
    send('editor:select', { ids: ['parent', 'child'] });
    assert.deepEqual(Array.from(game.editorSelection), ['parent', 'child']);
    assert.equal(Runner.updateEntity('parent', 'name', { value: 'Renamed' }), true);
    send('editor:rename', { id: 'parent', name: 'Renamed' });
    assert.equal(group.children[0].name, 'Renamed');
    assert.equal(Runner.moveEntities(['child'], 'group', 2), true);
    send('editor:move-entities', { ids: ['child'], targetParentId: 'group', index: 2 });
    assert.deepEqual(group.children.map(entity => entity.id), ['parent', 'sibling', 'child']);
    assert.equal(Runner.deleteEntity('parent'), true);
    send('editor:delete', { id: 'parent' });
    assert.deepEqual(Array.from(game.editorSelection), ['child']);
    const duplicate = Runner.duplicateEntity('child');
    assert.ok(duplicate);
    // The hierarchy's Duplicate command reloads the canonical scene into both views.
    game.scene = SceneLoader.parse(Runner.currentScene);
    send('editor:select', { ids: ['child', duplicate.id] });
    assert.deepEqual(Array.from(game.editorSelection), ['child', duplicate.id]);
    const saved = await Runner.saveScene(async (path, content) => {
        assert.equal(path, 'scenes/crud.scene');
        return (Runner.savedContent = content, true);
    });
    assert.deepEqual(Array.from(saved.layers[0].entities, entity => entity.id), ['sibling', 'child', duplicate.id]);
    Runner.closeScene();
    const reopened = Runner.openScene(JSON.parse(Runner.savedContent), 'scenes/crud.scene');
    const hydrated = SceneLoader.parse(reopened).children.find(entity => entity.id === 'group');
    assert.deepEqual(hydrated.children.map(entity => entity.id), ['sibling', 'child', duplicate.id]);
    assert.equal(hydrated.children[2].name, 'Child');
});

test('versioned project Shape remains pickable after hierarchy rename, move, save and reopen', async () => {
    ComponentRegistry.register('Shape', Shape);
    ComponentRegistry.register('Transform', Transform);
    const fixture = JSON.parse(fs.readFileSync('triton/tests/fixtures/native-smoke/scenes/main.scene', 'utf8'));
    Runner.openScene(fixture, 'scenes/main.scene');
    const game = { scene: SceneLoader.parse(Runner.currentScene) };
    const send = connect(game);
    assert.deepEqual(game.scene.children[0].children[0].components.map(component => component.constructor.name), ['Transform', 'Shape']);
    assert.equal(game.scene.children[0].children[0].components[0].position.x, 2);
    const hit = () => pickRuntimeEntityAt(game.scene, 128, 128);
    assert.equal(hit(), 'smoke-hero');
    send.pointer(128, 128);
    assert.deepEqual(Array.from(send.messages.at(-1).payload.ids), ['smoke-hero']);
    assert.deepEqual(Array.from(game.editorSelection), ['smoke-hero']);
    assert.equal(Runner.updateEntity('smoke-hero', 'name', { value: 'Renamed Hero' }), true);
    send('editor:rename', { id: 'smoke-hero', name: 'Renamed Hero' });
    assert.equal(Runner.moveEntities(['smoke-hero'], 'root'), true);
    send('editor:move-entities', { ids: ['smoke-hero'], targetParentId: 'root' });
    assert.equal(hit(), 'smoke-hero');
    assert.equal(game.scene.children.find(entity => entity.id === 'smoke-hero').name, 'Renamed Hero');
    let content;
    await Runner.saveScene(async (path, payload) => { assert.equal(path, 'scenes/main.scene'); content = payload; return true; });
    Runner.closeScene();
    Runner.openScene(JSON.parse(content), 'scenes/main.scene');
    const reopened = SceneLoader.parse(Runner.currentScene);
    assert.equal(reopened.children.at(-1).id, 'smoke-hero');
    assert.equal(reopened.children.at(-1).name, 'Renamed Hero');
    assert.equal(pickRuntimeEntityAt(reopened, 128, 128), 'smoke-hero');
});
