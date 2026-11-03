import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const source = fs.readFileSync(path.resolve(process.env.SCENE_LOAD_SOURCE || 'triton/src/context/GameContext.tsx'), 'utf8');
const handler = source.match(/    const loadScene = useCallback\(async \(path: string\) => \{[\s\S]*?\n    \}, \[readScene, notifyGame\]\);/)?.[0];
assert.ok(handler, 'exercise the production scene-loading handler');

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

test('a slower scene read cannot replace a newer opened scene or its save target', async () => {
    const reads = new Map([['old.scene', deferred()], ['new.scene', deferred()]]);
    const state = {};
    const notifications = [];
    const errors = [];
    const setters = Object.fromEntries([
        'CurrentSceneName', 'CurrentScenePath', 'CurrentScenePayload',
        'Entities', 'EntityDataCache', 'SelectedIds', 'SelectedEntitiesData'
    ].map(name => [`set${name}`, value => { state[name] = value; }]));
    const code = transformSync(`${handler}\nloadScene`, { loader: 'tsx', format: 'cjs' }).code;
    const loadScene = vm.runInNewContext(code, {
        useCallback: fn => fn,
        sceneLoadSequence: { current: 0 },
        readScene: path => reads.get(path).promise,
        EditorGameRunner: { validateScene: value => value, openScene(value, path) { state.canonical = { value, path }; } },
        notifyGame: (type, payload) => notifications.push({ type, payload }),
        console: { log() {}, error: (...args) => errors.push(args) },
        ...setters
    });
    const oldLoad = loadScene('old.scene');
    const newLoad = loadScene('new.scene');
    reads.get('new.scene').resolve({ name: 'New', entities: [{ id: 'new-entity', name: 'New entity' }] });
    await newLoad;
    reads.get('old.scene').resolve({ name: 'Old', entities: [{ id: 'old-entity', name: 'Old entity' }] });
    await oldLoad;
    assert.equal(state.CurrentScenePath, 'new.scene');
    assert.equal(state.canonical.path, 'new.scene');
    assert.equal(state.CurrentScenePayload.name, 'New');
    assert.ok(state.Entities['new-entity']);
    assert.equal(state.Entities['old-entity'], undefined);
    assert.deepEqual(notifications.filter(message => message.type === 'editor:load-scene').map(message => message.payload.path), ['new.scene']);
    assert.equal(errors.length, 0);
});

test('an older rejected read cannot report an error after a newer scene opens', async () => {
    const old = deferred();
    const state = {};
    const errors = [];
    const code = transformSync(`${handler}\nloadScene`, { loader: 'tsx', format: 'cjs' }).code;
    const loadScene = vm.runInNewContext(code, {
        useCallback: fn => fn,
        sceneLoadSequence: { current: 0 },
        readScene: path => path === 'old.scene' ? old.promise : Promise.resolve({ name: 'New', entities: [] }),
        EditorGameRunner: { validateScene: value => value, openScene(value, path) { state.canonical = { value, path }; } },
        notifyGame() {},
        console: { log() {}, error: (...args) => errors.push(args) },
        ...Object.fromEntries(['CurrentSceneName', 'CurrentScenePath', 'CurrentScenePayload', 'Entities', 'EntityDataCache', 'SelectedIds', 'SelectedEntitiesData']
            .map(name => [`set${name}`, value => { state[name] = value; }]))
    });
    const oldLoad = loadScene('old.scene');
    await loadScene('new.scene');
    old.reject(new Error('stale read failed'));
    await oldLoad;
    assert.equal(state.CurrentScenePath, 'new.scene');
    assert.equal(state.canonical.path, 'new.scene');
    assert.equal(errors.length, 0);
});

test('a rejected scene read leaves the last valid save target intact and reports the failure', async () => {
    const state = {};
    const diagnostics = [];
    const errors = [];
    const code = transformSync(`${handler}\nloadScene`, { loader: 'tsx', format: 'cjs' }).code;
    const loadScene = vm.runInNewContext(code, {
        useCallback: fn => fn,
        sceneLoadSequence: { current: 0 },
        readScene: path => path === 'broken.scn' ? Promise.reject(new Error('bad scene')) : Promise.resolve({ name: 'Good', entities: [] }),
        EditorGameRunner: {
            validateScene: value => value,
            openScene(value, path) { state.canonical = { value, path }; },
            report(error) { diagnostics.push(error.message); }
        },
        notifyGame() {},
        console: { log() {}, error: (...args) => errors.push(args) },
        ...Object.fromEntries(['CurrentSceneName', 'CurrentScenePath', 'CurrentScenePayload', 'Entities', 'EntityDataCache', 'SelectedIds', 'SelectedEntitiesData']
            .map(name => [`set${name}`, value => { state[name] = value; }]))
    });
    await loadScene('good.scn');
    await assert.rejects(loadScene('broken.scn'), /bad scene/);
    assert.equal(state.CurrentScenePath, 'good.scn');
    assert.equal(state.canonical.path, 'good.scn');
    assert.deepEqual(diagnostics, ['bad scene']);
    assert.equal(errors.length, 1);
});

test('a remounted game view receives unsaved scene edits without rereading disk', async () => {
    const state = {};
    const runner = {
        currentScene: null, currentScenePath: null,
        validateScene: value => value,
        openScene(value, path) { this.currentScene = structuredClone(value); this.currentScenePath = path; }
    };
    const notifications = [];
    let reads = 0;
    const loadScene = vm.runInNewContext(transformSync(`${handler}\nloadScene`, { loader: 'tsx', format: 'cjs' }).code, {
        useCallback: fn => fn, sceneLoadSequence: { current: 0 }, EditorGameRunner: runner,
        readScene: async () => { reads++; return { name: 'Main', entities: [{ id: 'hero', name: 'Hero' }] }; },
        notifyGame: (type, payload) => notifications.push({ type, payload }),
        console: { log() {}, error() {} },
        ...Object.fromEntries(['CurrentSceneName', 'CurrentScenePath', 'CurrentScenePayload', 'Entities', 'EntityDataCache', 'SelectedIds', 'SelectedEntitiesData']
            .map(name => [`set${name}`, value => { state[name] = value; }]))
    });
    await loadScene('scenes/main.scene');
    runner.currentScene.entities[0].name = 'Unsaved Hero';
    const ready = source.match(/                case 'game:ready':[\s\S]*?                    break;/)?.[0];
    assert.ok(ready);
    vm.runInNewContext(transformSync(`switch ('game:ready') { ${ready} }`, { loader: 'tsx', format: 'cjs' }).code, {
        notifyGame: (type, payload) => notifications.push({ type, payload }),
        currentScenePath: state.CurrentScenePath, selectedIds: ['hero'], EditorGameRunner: runner,
        isPlaying: false, document: { querySelector: () => null }, event: { source: null }
    });
    assert.equal(reads, 1);
    assert.equal(notifications.at(-2).payload.data.entities[0].name, 'Unsaved Hero');
    assert.equal(notifications.at(-2).payload.path, 'scenes/main.scene');
    assert.deepEqual(Array.from(notifications.at(-1).payload.ids), ['hero']);
    assert.equal(runner.currentScenePath, 'scenes/main.scene');
});
