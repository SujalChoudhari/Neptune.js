import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { EditorGameRunner } from '../src/lib/editorGameRunner.ts';
import { SceneLoader } from '../../src/core/sceneLoader.js';
import { ComponentRegistry } from '../../src/core/componentRegistry.js';
import { Transform } from '../../src/components/transform.js';
import { Sprite } from '../../src/rendering/sprite.js';
import { EnemyConfig } from '../../src/components/enemyConfig.js';
import { Renderable, collectRenderableRoots } from '../../src/rendering/renderable.js';
import { Entity } from '../../src/core/entity.js';
import { Behaviour } from '../../src/scripts/script.js';
import { ScriptManager } from '../../src/scripts/scriptManager.js';
import { Hitbox, Hurtbox } from '../../src/nereid/collider.js';
import { CollisionSystem } from '../../src/nereid/collisionSystem.js';

const src = path.resolve('triton/src');
const jsx = (type, props) => ({ type, props: props || {} });
const react = { createElement: (type, props, ...children) => jsx(type, { ...(props || {}), children: children.length > 1 ? children : children[0] }),
    cloneElement: (element, props) => jsx(element.type, { ...element.props, ...props }),
    useState: value => [value, () => {}], useMemo: fn => fn(), useCallback: fn => fn, useEffect() {} };
const icon = new Proxy({}, { get: (_, key) => key });
const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === 'object'
    ? [node, ...visit(node.props?.children)] : [];

function inspectorHarness(scene) {
    const code = buildSync({
        entryPoints: [path.join(src, 'components/panels/InspectorPanel.tsx')],
        alias: { '@': src }, bundle: true, platform: 'node', format: 'cjs', write: false,
        external: ['react', 'react/jsx-runtime', 'lucide-react', path.join(src, 'components/library'),
            path.join(src, 'context/*'), path.join(src, 'lib/editorGameRunner')]
    }).outputFiles[0].text;
    const selected = { id: 'sprite-1', name: 'Sprite', active: true,
        transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
        components: Object.fromEntries(scene.entities[0].components.map(({ type, props }) => [type, { ...props }])) };
    const notices = [];
    let saved;
    const game = {
        selectedEntityData: selected, selectedIds: ['sprite-1'], currentScenePath: 'scenes/main.scene',
        updateComponent(id, component, field, value) {
            const key = Object.keys(selected.components).find(key => key.toLowerCase() === component.toLowerCase());
            if (key) selected.components[key] = { ...selected.components[key], [field]: value };
            notices.push(['editor:update-component', { id, component, data: { [field]: value } }]);
        },
        notifyGame: (...args) => notices.push(args),
        renameEntityInHierarchy() {}, setEntityActiveInHierarchy() {}
    };
    const modules = {
        react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': icon,
        '@/components/library': new Proxy({}, { get: (_, key) => key }),
        '@/context/GameContext': { useGameContext: () => game },
        '@/context/FileSystemContext': { useFileSystem: () => ({ writeScene: async (_, value) => { saved = value; return true; } }) },
        '@/lib/editorGameRunner': { EditorGameRunner }
    };
    const mod = { exports: {} };
    vm.runInNewContext(code, { React: react, module: mod, exports: mod.exports, require: id => {
        const key = id.startsWith(src) ? `@${id.slice(src.length)}` : id;
        if (!(key in modules)) throw new Error(`Unexpected Inspector import: ${id}`);
        return modules[key];
    }, window: { addEventListener() {}, removeEventListener() {} }, console });
    EditorGameRunner.openScene(scene, 'scenes/main.scene');
    const render = () => visit(mod.exports.InspectorPanel({}));
    const section = (type) => render().find(node => node.props?.type === type);
    return { selected, notices, render, section, enabled: mod.exports.inspectorComponentEnabled, saved: () => saved };
}

function sceneFixture() {
    return { name: 'Main', entities: [{ id: 'sprite-1', name: 'Sprite',
        transform: { pos: { x: 0, y: 0 }, rot: 0, scale: { x: 1, y: 1 } },
        components: [{ type: 'Sprite', props: { path: 'assets/hero.png', enabled: true } },
            { type: 'EnemyConfig', props: { enabled: true } }] }] };
}

test('Inspector reflects mixed-case component state and saves toggles that disable rendering after reopen', async () => {
    ComponentRegistry.register('Transform', Transform);
    ComponentRegistry.register('Sprite', Sprite);
    ComponentRegistry.register('EnemyConfig', EnemyConfig);
    const previousImage = globalThis.Image;
    globalThis.Image = class { src = ''; };
    try {
        const harness = inspectorHarness(sceneFixture());
        assert.equal(harness.section('Sprite').props.isActive, true);
        harness.section('Sprite').props.onToggleActive();
        assert.equal(harness.section('Sprite').props.isActive, false);
        assert.equal(harness.selected.components.Sprite.enabled, false);
        assert.equal(EditorGameRunner.currentScene.entities[0].components[0].props.enabled, false);
        await EditorGameRunner.saveScene(async (_, content) => { harness.savedContent = content; return true; });
        const reopened = EditorGameRunner.openScene(JSON.parse(harness.savedContent), 'scenes/main.scene');
        const runtime = SceneLoader.parse(reopened);
        assert.equal(runtime.children[0].GetComponent(Sprite).properties.enabled, false);
        assert.deepEqual(collectRenderableRoots(runtime), []);
        let draws = 0;
        const ctx = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() { draws++; } };
        runtime.draw(ctx);
        assert.equal(draws, 0);
        assert.equal(harness.notices.some(([type, payload]) => type === 'editor:update-component' && payload.data.enabled === false), true);
        const reloaded = inspectorHarness(reopened);
        assert.equal(reloaded.section('Sprite').props.isActive, false);
        reloaded.section('Sprite').props.onToggleActive();
        assert.equal(reloaded.section('Sprite').props.isActive, true);
        assert.equal(EditorGameRunner.currentScene.entities[0].components[0].props.enabled, true);
        SceneLoader.parse(EditorGameRunner.currentScene).draw(ctx);
        assert.equal(draws, 1);
    } finally {
        globalThis.Image = previousImage;
        EditorGameRunner.closeScene();
    }
});

test('Inspector resolves enabled for component names regardless of scene type casing', () => {
    const harness = inspectorHarness(sceneFixture());
    harness.selected.components.Sprite.enabled = false;
    assert.equal(harness.enabled(harness.selected, 'sprite'), false);
    assert.equal(harness.enabled(harness.selected, 'SPRITE'), false);
    assert.equal(harness.enabled(harness.selected, 'missing'), true);
    EditorGameRunner.closeScene();
});

test('Inspector does not offer nonfunctional Transform, unsupported generic, or indexed script toggles', () => {
    const harness = inspectorHarness(sceneFixture());
    const transform = harness.render().find(node => node.props?.entity === harness.selected && node.type?.name === 'TransformSection');
    assert.ok(transform);
    assert.equal(transform.props.onToggleActive, undefined);
    const transformSection = transform.type(transform.props);
    const transformHeader = transformSection.type(transformSection.props);
    assert.equal(visit(transformHeader).some(node => node.props?.title === 'Disable component'), false);
    const sprite = harness.section('Sprite');
    const spriteHeader = sprite.type(sprite.props);
    assert.equal(visit(spriteHeader.type(spriteHeader.props)).some(node => node.props?.title === 'Disable component'), true);
    assert.equal(harness.section('EnemyConfig').props.onToggleActive, undefined);
    const generic = harness.section('EnemyConfig');
    assert.equal(visit(generic.type(generic.props)).some(node => node.props?.label === 'enabled'), false);
    assert.equal(harness.render().some(node => node.type?.name === 'ScriptsGroup'), false);
    EditorGameRunner.closeScene();
});

test('unsupported component enabled data is not presented as a disabled editor control', () => {
    const scene = sceneFixture();
    scene.entities[0].components[1].props.enabled = false;
    const harness = inspectorHarness(scene);
    assert.equal(harness.section('EnemyConfig').props.isActive, true);
    assert.equal(harness.section('EnemyConfig').props.onToggleActive, undefined);
    EditorGameRunner.closeScene();
});

test('saved Hitbox enabled=false is ignored by collision runtime until re-enabled', async () => {
    ComponentRegistry.register('Hitbox', Hitbox);
    ComponentRegistry.register('Hurtbox', Hurtbox);
    EditorGameRunner.openScene({ name: 'Combat', entities: [
        { id: 'attacker', components: [{ type: 'Hitbox', props: { width: 1, height: 1, enabled: true } }] },
        { id: 'target', components: [{ type: 'Hurtbox', props: { width: 1, height: 1 } }] }
    ] }, 'scenes/combat.scene');
    assert.equal(EditorGameRunner.updateEntity('attacker', 'Hitbox', { enabled: false }), true);
    let saved;
    await EditorGameRunner.saveScene(async (_, content) => { saved = content; return true; });
    const scene = SceneLoader.parse(EditorGameRunner.openScene(JSON.parse(saved), 'scenes/combat.scene'));
    const hitbox = scene.children[0].GetComponent(Hitbox);
    const hurtbox = scene.children[1].GetComponent(Hurtbox);
    const collision = new CollisionSystem();
    const entries = [{ collider: hitbox, x: 0, y: 0 }, { collider: hurtbox, x: 0, y: 0 }];
    assert.equal(hitbox.enabled, false);
    assert.equal(collision.step(entries), 0);
    hitbox.deserialize({ enabled: true });
    assert.equal(collision.step(entries), 1);
    EditorGameRunner.closeScene();
});

test('serialized script enabled=false survives save/reopen and suppresses Behaviour updates', async () => {
    let updates = 0;
    class CounterBehaviour extends Behaviour {
        Init() {}
        Update() { updates++; }
    }
    ComponentRegistry.register('CounterBehaviour', CounterBehaviour);
    const scene = { name: 'Scripts', entities: [{ id: 'script-1', name: 'Scripted',
        components: [{ type: 'CounterBehaviour', props: { enabled: true } }] }] };
    EditorGameRunner.openScene(scene, 'scenes/scripts.scene');
    assert.equal(EditorGameRunner.updateEntity('script-1', 'CounterBehaviour', { enabled: false }), true);
    let saved;
    await EditorGameRunner.saveScene(async (_, content) => { saved = content; return true; });
    const reopened = EditorGameRunner.openScene(JSON.parse(saved), 'scenes/scripts.scene');
    const runtime = SceneLoader.parse(reopened);
    const behaviour = runtime.children[0].GetComponent(CounterBehaviour);
    assert.equal(behaviour.properties.enabled, false);
    ScriptManager.behaviourUpdate(0.1);
    assert.equal(updates, 0);
    behaviour.deserialize({ enabled: true });
    ScriptManager.behaviourUpdate(0.1);
    assert.equal(updates, 1);
    EditorGameRunner.closeScene();
});

test('Inspector toggles a registered Behaviour through save/reopen and runtime lifecycle', async () => {
    let inits = 0;
    let updates = 0;
    class InspectorCounterBehaviour extends Behaviour {
        Init() { inits++; }
        Update() { updates++; }
    }
    ComponentRegistry.register('InspectorCounterBehaviour', InspectorCounterBehaviour);
    const scene = { name: 'Scripts', entities: [{ id: 'sprite-1', name: 'Scripted',
        components: [{ type: 'InspectorCounterBehaviour', props: { enabled: true } }] }] };
    try {
        const harness = inspectorHarness(scene);
        const section = harness.section('InspectorCounterBehaviour');
        assert.equal(section.props.isActive, true);
        assert.equal(typeof section.props.onToggleActive, 'function');
        section.props.onToggleActive();
        assert.equal(harness.section('InspectorCounterBehaviour').props.isActive, false);
        let saved;
        await EditorGameRunner.saveScene(async (_, content) => { saved = content; return true; });
        const reopened = EditorGameRunner.openScene(JSON.parse(saved), 'scenes/main.scene');
        const runtime = SceneLoader.parse(reopened);
        assert.equal(runtime.children[0].GetComponent(InspectorCounterBehaviour).properties.enabled, false);
        ScriptManager.behaviourInit();
        ScriptManager.behaviourUpdate(0.1);
        assert.equal(inits, 0);
        assert.equal(updates, 0);
        const reloaded = inspectorHarness(reopened);
        assert.equal(reloaded.section('InspectorCounterBehaviour').props.isActive, false);
        reloaded.section('InspectorCounterBehaviour').props.onToggleActive();
        assert.equal(reloaded.section('InspectorCounterBehaviour').props.isActive, true);
        const enabled = SceneLoader.parse(EditorGameRunner.currentScene);
        assert.equal(enabled.children[0].GetComponent(InspectorCounterBehaviour).properties.enabled, true);
        ScriptManager.behaviourInit();
        ScriptManager.behaviourUpdate(0.1);
        assert.ok(inits > 0);
        assert.ok(updates > 0);
    } finally {
        EditorGameRunner.closeScene();
    }
});

test('disabled renderable does not hide enabled descendants', () => {
    const root = new Entity('Root');
    const parent = new Entity('Disabled parent renderable');
    const child = new Entity('Visible child');
    root.AddChild(parent);
    parent.AddChild(child);
    class TestRenderable extends Renderable {}
    const disabled = new TestRenderable();
    disabled.deserialize({ enabled: false });
    parent.AddComponent(disabled);
    const visible = new TestRenderable();
    child.AddComponent(visible);
    assert.deepEqual(collectRenderableRoots(root), [visible]);
});

test('ScriptManager skips a disabled Behaviour and resumes after enabling', () => {
    const entity = new Entity('Scripted');
    let updates = 0;
    const behaviour = new Behaviour('Counter', () => {}, () => { updates++; });
    entity.AddComponent(behaviour);
    behaviour.deserialize({ enabled: false });
    ScriptManager.behaviourUpdate(0.1);
    assert.equal(updates, 0);
    behaviour.deserialize({ enabled: true });
    ScriptManager.behaviourUpdate(0.1);
    assert.equal(updates, 1);
});
