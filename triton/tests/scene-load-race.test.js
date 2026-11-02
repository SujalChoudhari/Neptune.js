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
        'Entities', 'EntityDataCache', 'SelectedIds'
    ].map(name => [`set${name}`, value => { state[name] = value; }]));
    const code = transformSync(`${handler}\nloadScene`, { loader: 'tsx', format: 'cjs' }).code;
    const loadScene = vm.runInNewContext(code, {
        useCallback: fn => fn,
        sceneLoadSequence: { current: 0 },
        readScene: path => reads.get(path).promise,
        EditorGameRunner: { validateScene: value => value },
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
    assert.equal(state.CurrentScenePayload.name, 'New');
    assert.ok(state.Entities['new-entity']);
    assert.equal(state.Entities['old-entity'], undefined);
    assert.deepEqual(notifications.map(message => message.payload.path), ['new.scene']);
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
        EditorGameRunner: { validateScene: value => value },
        notifyGame() {},
        console: { log() {}, error: (...args) => errors.push(args) },
        ...Object.fromEntries(['CurrentSceneName', 'CurrentScenePath', 'CurrentScenePayload', 'Entities', 'EntityDataCache', 'SelectedIds']
            .map(name => [`set${name}`, value => { state[name] = value; }]))
    });
    const oldLoad = loadScene('old.scene');
    await loadScene('new.scene');
    old.reject(new Error('stale read failed'));
    await oldLoad;
    assert.equal(state.CurrentScenePath, 'new.scene');
    assert.equal(errors.length, 0);
});
