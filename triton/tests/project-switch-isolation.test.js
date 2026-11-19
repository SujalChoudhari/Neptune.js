import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const source = fs.readFileSync('triton/src/context/GameContext.tsx', 'utf8');
const effect = source.match(/    \/\/ Auto-load main scene\n    useEffect\(\(\) => \{[\s\S]*?\n    \}, \[rootPath, loadMainScene, notifyGame, history\]\);/)?.[0];
const main = source.match(/    const loadMainScene = useCallback\(async \(\) => \{[\s\S]*?\n    \}, \[rootPath, readProject, loadScene, toProjectRelativePath\]\);/)?.[0];
assert.ok(effect && main, 'exercise production project-switch and main-scene handlers');
const compile = text => transformSync(text, { loader: 'tsx', format: 'cjs' }).code;

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

test('switching projects clears scene/save state and ignores the old pending project read', async () => {
    const pending = deferred();
    const state = { CurrentScenePath: 'scenes/old.scene', Entities: { old: {} }, IsPlaying: true, IsPaused: true };
    const messages = [];
    const activities = [];
    const runner = { currentScene: { name: 'Old' }, currentScenePath: 'scenes/old.scene',
        closeScene() { this.currentScene = null; this.currentScenePath = null; } };
    const sequence = { current: 0 };
    const sceneSequence = { current: 4 };
    const loads = [];
    let rootPath = '/old';
    const context = {
        history: { clear() { state.historyClears = (state.historyClears || 0) + 1; } }, entityDataCacheRef: { current: { old: {} } },
        useCallback: callback => callback,
        useEffect: callback => callback(),
        get rootPath() { return rootPath; },
        projectSequence: sequence, sceneLoadSequence: sceneSequence,
        EditorGameRunner: runner,
        readProject: () => pending.promise,
        loadScene: async path => loads.push(path),
        toProjectRelativePath: path => path,
        notifyGame: type => messages.push(type),
        reportActivity: (message, type) => activities.push({ message, type }),
        console: { log() {}, error() {} },
        ...Object.fromEntries(['IsPlaying', 'IsPaused', 'CurrentSceneName', 'CurrentScenePath', 'CurrentScenePayload', 'MainScenePath', 'Entities', 'EntityDataCache', 'SelectedIds', 'SelectedEntitiesData'].map(name => [`set${name}`, value => { state[name] = value; }]))
    };
    const code = compile(`{ ${main}\n${effect} }`);
    const run = () => vm.runInNewContext(code, context);
    run();
    rootPath = null;
    run();
    assert.equal(state.IsPlaying, false, 'project switch must end the old play session');
    assert.equal(state.IsPaused, false);
    assert.ok(messages.includes('editor:stop'), 'the real runtime must stop, not just the toolbar');
    assert.ok(messages.includes('editor:reset-project'), 'project switches must invalidate pending runtime parses even without a new main scene');
    assert.equal(state.CurrentScenePath, null);
    assert.deepEqual(activities.map(activity => activity.type), ['ready', 'ready']);
    assert.equal(state.historyClears, 2);
    assert.deepEqual(Object.keys(context.entityDataCacheRef.current), []);
    assert.equal(state.MainScenePath, null);
    assert.deepEqual(Object.keys(state.Entities), []);
    assert.equal(runner.currentScene, null);
    assert.equal(runner.currentScenePath, null);
    assert.equal(sceneSequence.current, 6);
    pending.resolve({ mainScene: 'scenes/old.scene' });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(loads, []);
    assert.equal(state.CurrentScenePath, null);
});
