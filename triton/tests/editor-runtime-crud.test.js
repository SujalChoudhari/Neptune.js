import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { SceneLoader } from '../../src/core/sceneLoader.js';
import { ComponentRegistry } from '../../src/core/componentRegistry.js';
import { Shape } from '../../src/rendering/shape.js';
import { Transform } from '../../src/components/transform.js';
import { Behaviour } from '../../src/scripts/script.js';
import { ScriptManager } from '../../src/scripts/scriptManager.js';
import { Entity } from '../../src/core/entity.js';
import { Scene } from '../../src/core/scene.js';
import { SceneManager } from '../../src/core/sceneManager.js';
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
    send.pointer = (x, y, modifiers = {}) => listeners.get('pointerdown')({ target: canvas, button: 0, clientX: x, clientY: y, ...modifiers });
    send.messages = messages;
    return send;
}

test('deleting a live scripted subtree stops and destroys its behaviours without stopping siblings', () => {
    const scene = new Scene('Delete lifecycle');
    const parent = new Entity('Parent'), child = new Entity('Child'), sibling = new Entity('Sibling');
    scene.AddChildren(parent, sibling);
    parent.AddChild(child);
    const ticks = [0, 0, 0];
    const scripts = [parent, child, sibling].map((entity, index) => {
        const script = new Behaviour('Delete counter', () => {}, () => ticks[index]++);
        entity.AddComponent(script);
        return script;
    });
    const send = connect({ scene });
    SceneManager.LoadScene(scene.id);
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(ticks, [1, 1, 1]);
    send('editor:delete', { id: parent.id });
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(ticks, [1, 1, 2]);
    assert.equal(scripts[0].entity, null);
    assert.equal(scripts[1].entity, null);
    sibling.destroy();
});

test('navigating scenes stops unloaded behaviours while retaining additive scene behaviours', () => {
    SceneManager.removeAllScenes();
    const scenes = [new Scene('First'), new Scene('Second'), new Scene('Overlay')];
    const ticks = [0, 0, 0];
    const scripts = scenes.map((scene, index) => {
        const entity = new Entity(`Actor ${index}`);
        scene.AddChild(entity);
        const script = new Behaviour('Navigation counter', () => {}, () => ticks[index]++);
        entity.AddComponent(script);
        return script;
    });
    SceneManager.LoadScene(scenes[0].id);
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(ticks, [1, 0, 0]);
    SceneManager.LoadScene(scenes[1].id);
    SceneManager.LoadSceneAdditive(scenes[2].id);
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(ticks, [1, 1, 1]);
    scripts.forEach(script => script.destroy());
    SceneManager.removeAllScenes();
});

test('late scene and newly created behaviours initialize exactly once before their first update', t => {
    SceneManager.removeAllScenes();
    const scene = new Scene('Late scene');
    SceneManager.LoadScene(scene.id);
    const events = [];
    const actor = new Entity('Late actor');
    scene.AddChild(actor);
    const script = new Behaviour('Late script', () => events.push('init'), () => events.push('update'));
    actor.AddComponent(script);
    t.after(() => { actor.destroy(); SceneManager.removeAllScenes(); });
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(events, ['init', 'update'], 'new scripts must initialize even after Application startup');
    ScriptManager.behaviourInit();
    ScriptManager.behaviourInit();
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(events, ['init', 'update', 'update'], 'stop/restart must not rerun Init on the same script');
    actor.destroy();
    SceneManager.removeAllScenes();
});

test('lifecycle passes skip removed scripts and defer scripts created during the pass', t => {
    const events = [];
    let second, spawned;
    const first = new Behaviour('First script', () => {}, () => {
        events.push('first');
        second.destroy();
        if (!spawned) spawned = new Behaviour('Spawned script', () => events.push('spawn-init'), () => events.push('spawn-update'));
    });
    second = new Behaviour('Removed script', () => {}, () => events.push('removed'));
    t.after(() => { first.destroy(); second.destroy(); spawned?.destroy(); });
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(events, ['first']);
    ScriptManager.behaviourUpdate(1);
    assert.deepEqual(events, ['first', 'first', 'spawn-init', 'spawn-update']);
    first.destroy();
    spawned.destroy();
});

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

test('Game View additive pointer selection toggles rendered entities and survives hierarchy moves and reopen', async () => {
    ComponentRegistry.register('Shape', Shape);
    ComponentRegistry.register('Transform', Transform);
    const fixture = JSON.parse(fs.readFileSync('triton/tests/fixtures/native-smoke/scenes/main.scene', 'utf8'));
    const second = structuredClone(fixture.layers[0].entities[0]);
    second.id = 'smoke-partner';
    second.name = 'Partner';
    second.components[0].id = 'partner-shape';
    second.transform.pos.x = 4;
    fixture.layers[0].entities.push(second);
    Runner.openScene(fixture, 'scenes/main.scene');
    const game = { scene: SceneLoader.parse(Runner.currentScene) };
    const send = connect(game);
    send('editor:select', { ids: ['smoke-hero'] });
    send.pointer(256, 128, { ctrlKey: true });
    assert.deepEqual(Array.from(game.editorSelection), ['smoke-hero', 'smoke-partner']);
    assert.deepEqual(Array.from(send.messages.at(-1).payload.ids), ['smoke-hero', 'smoke-partner']);
    send.pointer(128, 128, { metaKey: true });
    assert.deepEqual(Array.from(game.editorSelection), ['smoke-partner']);
    send.pointer(400, 400, { ctrlKey: true });
    assert.deepEqual(Array.from(game.editorSelection), ['smoke-partner']);
    assert.equal(Runner.moveEntities(['smoke-partner'], 'root'), true);
    send('editor:move-entities', { ids: ['smoke-partner'], targetParentId: 'root' });
    send.pointer(256, 128, { ctrlKey: true });
    assert.deepEqual(Array.from(game.editorSelection), []);
    send.pointer(256, 128);
    assert.deepEqual(Array.from(game.editorSelection), ['smoke-partner']);
    let saved;
    await Runner.saveScene(async (_path, content) => { saved = content; return true; });
    Runner.closeScene();
    const reopened = SceneLoader.parse(Runner.openScene(JSON.parse(saved), 'scenes/main.scene'));
    assert.equal(pickRuntimeEntityAt(reopened, 256, 128), 'smoke-partner');
    assert.deepEqual(reopened.children.map(entity => entity.id), ['smoke-layer', 'smoke-partner']);
});
