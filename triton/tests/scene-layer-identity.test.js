import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { buildSync, transformSync } from 'esbuild';

const source = fs.readFileSync('triton/src/context/GameContext.tsx', 'utf8');
const handler = source.match(/    const loadScene = useCallback\(async \(path: string\) => \{[\s\S]*?\n    \}, \[readScene, notifyGame\]\);/)?.[0];
assert.ok(handler);
const runnerSource = fs.readFileSync('triton/src/lib/editorGameRunner.ts', 'utf8');
const module = { exports: {} };
vm.runInNewContext(buildSync({ stdin: { contents: runnerSource, loader: 'ts' }, bundle: true, format: 'cjs', platform: 'node', write: false }).outputFiles[0].text, {
    module, exports: module.exports, console, window: { dispatchEvent() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
});
const Runner = module.exports.EditorGameRunner;

test('scene switch and reopen retain layer/entity hierarchy IDs and native save path', async () => {
    const scenes = new Map([
        ['scenes/level.scene', { name: 'Level', layers: [{ id: 'foreground', name: 'Foreground', type: 'folder', entities: [
            { id: 'actor', name: 'Actor', children: [{ id: 'child', name: 'Child' }] }
        ] }], entities: [] }],
        ['scenes/other.scene', { name: 'Other', layers: [{ id: 'background', name: 'Background' }], entities: [] }]
    ]);
    const state = {};
    const notifications = [];
    const loadScene = vm.runInNewContext(transformSync(`${handler}\nloadScene`, { loader: 'tsx', format: 'cjs' }).code, {
        useCallback: fn => fn, sceneLoadSequence: { current: 0 },
        readScene: async path => { if (!scenes.has(path)) throw Error('missing scene'); return scenes.get(path); },
        EditorGameRunner: Runner,
        notifyGame: (type, payload) => { if (type === 'editor:load-scene') notifications.push(payload.path); },
        console: { log() {}, error() {} },
        ...Object.fromEntries(['CurrentSceneName', 'CurrentScenePath', 'CurrentScenePayload', 'Entities', 'EntityDataCache', 'SelectedIds', 'SelectedEntitiesData']
            .map(name => [`set${name}`, value => { state[name] = value; }]))
    });
    await loadScene('scenes/level.scene');
    assert.deepEqual(Array.from(state.Entities.root.children), ['foreground']);
    assert.deepEqual(Array.from(state.Entities.foreground.children), ['actor']);
    assert.deepEqual(Array.from(state.Entities.actor.children), ['child']);
    await loadScene('scenes/other.scene');
    assert.equal(state.Entities.foreground, undefined);
    await loadScene('scenes/level.scene');
    assert.deepEqual(Array.from(state.Entities.root.children), ['foreground']);
    assert.equal(state.CurrentScenePath, 'scenes/level.scene');
    assert.deepEqual(notifications, ['scenes/level.scene', 'scenes/other.scene', 'scenes/level.scene']);
    Runner.openScene(state.CurrentScenePayload, state.CurrentScenePath);
    let savedPath;
    await Runner.saveScene(async (path, content) => {
        savedPath = path;
        scenes.set(path, JSON.parse(content));
        return true;
    });
    assert.equal(savedPath, 'scenes/level.scene');
    await loadScene(savedPath);
    assert.deepEqual(Array.from(state.Entities.root.children), ['foreground']);
});

test('colliding layer and entity IDs reject before replacing the open scene', () => {
    Runner.openScene({ name: 'Good', entities: [] }, 'scenes/good.scene');
    assert.throws(() => Runner.openScene({ layers: [{ id: 'same' }], entities: [{ id: 'same' }] }, 'scenes/bad.scene'), /Duplicate hierarchy ID/);
    assert.equal(Runner.currentScenePath, 'scenes/good.scene');
    assert.throws(() => Runner.validateScene({ entities: [{ id: 'root' }] }), /Duplicate hierarchy ID/);
});
