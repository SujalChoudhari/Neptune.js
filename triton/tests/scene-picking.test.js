import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { pickEntityAt, translateOnAxis, getColliderOverlayBounds, isSceneViewBridgeMessageSource } from '../src/lib/scenePicking.mjs';

const entity = (id, x, y, children = []) => ({
    id,
    components: [{ position: { x, y }, scale: { x: 1, y: 1 } }, { width: 32, height: 24 }],
    children
});

test('Scene View bridge trusts only its own live iframe for all message types', () => {
    const trustedWindow = {};
    assert.equal(isSceneViewBridgeMessageSource(trustedWindow, trustedWindow), true);
    assert.equal(isSceneViewBridgeMessageSource({}, trustedWindow), false);
    assert.equal(isSceneViewBridgeMessageSource(trustedWindow, null), false);
    const source = fs.readFileSync(path.resolve('triton/src/components/panels/SceneViewPanel.tsx'), 'utf8');
    assert.match(source, /if \(!isSceneViewBridgeMessageSource\(event\.source, iframeRef\.current\?\.contentWindow\)\) return/);
});

function createSceneViewHarness() {
    const sourcefile = path.resolve('triton/src/components/panels/SceneViewPanel.tsx');
    const external = [
        'react', 'react/jsx-runtime', 'lucide-react', '@/components/library', '@/context/GameContext',
        '@/lib/editorGameRunner', '@/lib/scenePicking.mjs', '../../../../src/neptune.js?url',
        '../../../../src/thalassa/camera.js?url', '@/lib/scenePicking.mjs?url',
        '@/lib/projectResourceBridge.mjs?url', '@tauri-apps/api/core'
    ];
    const bundle = buildSync({
        bundle: true, format: 'cjs', platform: 'node', write: false,
        stdin: { contents: fs.readFileSync(sourcefile, 'utf8'), loader: 'tsx', sourcefile }, external
    }).outputFiles[0].text;
    const slots = [];
    let hookIndex = 0;
    const notifications = [];
    const canonicalEdits = [];
    const componentEdits = [];
    const react = {
        createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children: children.length > 1 ? children : children[0] } }),
        useRef(initial) { const index = hookIndex++; return slots[index] ||= { current: initial }; },
        useState(initial) {
            const index = hookIndex++;
            slots[index] ||= { value: initial };
            return [slots[index].value, value => {
                slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
            }];
        },
        useCallback(callback) { hookIndex++; return callback; },
        useEffect() { hookIndex++; }
    };
    const jsx = (type, props) => ({ type, props: props || {} });
    const modules = {
        react,
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
        'lucide-react': { Maximize: 'Maximize', ZoomIn: 'ZoomIn', ZoomOut: 'ZoomOut' },
        '@/components/library': { ThemedIconButton: 'ThemedIconButton' },
        '@/context/GameContext': { useGameContext: () => ({
            notifyGame: (type, payload) => notifications.push({ type, payload }),
            updateComponent: (id, component, field, value) => {
                componentEdits.push({ id, component, field, value });
                notifications.push({ type: 'editor:update-component', payload: { id, component, data: { [field]: value } } });
            },
            selectedEntityData: {
                transform: { position: { x: 2, y: 3 }, rotation: 0.5, scale: { x: 1, y: 2 } },
                components: {
                    Hitbox: { width: 2, height: 1, offsetX: -1, offsetY: 0.5 },
                    Hurtbox: { width: 1, height: 2, offsetX: 0.25, offsetY: -1 },
                    TriggerCollider: { width: 3, height: 1, offsetX: -2, offsetY: 2 }
                }
            },
            selectedIds: ['entity-1']
        }) },
        '@/lib/editorGameRunner': { EditorGameRunner: {
            updateEntity: (id, component, data) => canonicalEdits.push({ id, component, data })
        } },
        '@/lib/scenePicking.mjs': { translateOnAxis, getColliderOverlayBounds },
        '@tauri-apps/api/core': { invoke: async () => '' },
        '../../../../src/neptune.js?url': '/neptune.js',
        '../../../../src/thalassa/camera.js?url': '/camera.js',
        '@/lib/scenePicking.mjs?url': '/scenePicking.js',
        '@/lib/projectResourceBridge.mjs?url': '/projectResourceBridge.js'
    };
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        React: react,
        module,
        exports: module.exports,
        require: id => {
            if (!(id in modules)) throw new Error(`Unexpected SceneViewPanel dependency: ${id}`);
            return modules[id];
        }
    });
    const render = () => {
        hookIndex = 0;
        const tree = module.exports.SceneViewPanel();
        tree.props.ref.current = { getBoundingClientRect: () => ({ left: 10, top: 20 }) };
        return tree;
    };
    return { render, notifications, canonicalEdits, componentEdits };
}

function findNode(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = findNode(child, predicate);
            if (found) return found;
        }
        return null;
    }
    if (predicate(node)) return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
        const found = findNode(child, predicate);
        if (found) return found;
    }
    return null;
}

test('gizmo drag converts screen deltas to world units and constrains movement to its axis', () => {
    assert.deepEqual(translateOnAxis({ x: 10, y: 20 }, 30, 24, 2, 'x'), { x: 25, y: 20 });
    assert.deepEqual(translateOnAxis({ x: 10, y: 20 }, 30, 24, 2, 'y'), { x: 10, y: 32 });
    assert.throws(() => translateOnAxis({ x: 0, y: 0 }, 1, 1, 0, 'x'), /positive zoom/);
    assert.throws(() => translateOnAxis({ x: 0, y: 0 }, 1, 1, 1, 'z'), /axis/);
});

test('viewport picking chooses the closest overlapping entity, including nested entities', () => {
    const near = entity('near', 108, 103);
    const root = entity('root', 0, 0, [entity('far', 100, 100), near]);
    assert.equal(pickEntityAt(root, 109, 104), near);
});

test('viewport picking returns null outside entity bounds or for invalid coordinates', () => {
    const root = entity('root', 0, 0, [entity('target', 20, 30)]);
    assert.equal(pickEntityAt(root, 200, 200), null);
    assert.equal(pickEntityAt(root, Number.NaN, 30), null);
    assert.equal(pickEntityAt(null, 20, 30), null);
});

test('viewport picking uses configured tolerance for entities without visual bounds', () => {
    const root = { id: 'root', children: [{
        id: 'point',
        components: [{ position: { x: 40, y: 50 }, scale: { x: 1, y: 1 } }],
        children: []
    }] };
    assert.equal(pickEntityAt(root, 50, 50, 12)?.id, 'point');
    assert.equal(pickEntityAt(root, 53, 50, 12), null);
});

test('viewport picking reads dimensions from runtime Sprite properties', () => {
    class RuntimeTransform {
        constructor() {
            this.position = { x: 10, y: 20 };
            this.scale = { x: 1, y: 1 };
        }
    }
    class RuntimeSprite {
        constructor() {
            this._properties = { width: 32, height: 24 };
        }
    }
    const hero = { id: 'runtime-hero', components: [new RuntimeTransform(), new RuntimeSprite()], children: [] };
    assert.equal(pickEntityAt({ children: [hero] }, 25, 30)?.id, 'runtime-hero');
    assert.equal(pickEntityAt({ children: [hero] }, 27, 30), null);
});

test('combat collider overlay bounds include the selected transform and authored offsets', () => {
    const selected = {
        transform: { position: { x: 4, y: -2 } },
        components: {
            Hitbox: { width: 2, height: 1, offsetX: -1, offsetY: 0.5 },
            Hurtbox: { width: 1, height: 3 },
            TriggerCollider: { width: 4, height: 2, offsetX: 2, offsetY: -3 },
            BoxCollider: { size: { x: 100, y: 100 }, offset: { x: 1, y: 2 } }
        }
    };
    assert.deepEqual(getColliderOverlayBounds(selected), [
        { type: 'Hitbox', color: '#fb7185', x: 3, y: -1.5, width: 2, height: 1 },
        { type: 'Hurtbox', color: '#38bdf8', x: 4, y: -2, width: 1, height: 3 },
        { type: 'TriggerCollider', color: '#facc15', x: 6, y: -5, width: 4, height: 2 },
        { type: 'BoxCollider', color: '#a78bfa', x: 5, y: 0, width: 100, height: 100 }
    ]);
    assert.deepEqual(getColliderOverlayBounds({ transform: { position: { x: 0, y: 0 } }, components: { Hitbox: { width: 0, height: 1 } } }), []);
});

test('Scene View renders selected hitbox, hurtbox, and trigger bounds over the viewport', () => {
    const harness = createSceneViewHarness();
    const tree = harness.render();
    const hitbox = findNode(tree, node => node.props?.['aria-label'] === 'Selected Hitbox bounds');
    const hurtbox = findNode(tree, node => node.props?.['aria-label'] === 'Selected Hurtbox bounds');
    const trigger = findNode(tree, node => node.props?.['aria-label'] === 'Selected TriggerCollider bounds');
    assert.ok(hitbox, 'selected Hitbox overlay is rendered');
    assert.ok(hurtbox, 'selected Hurtbox overlay is rendered');
    assert.ok(trigger, 'selected TriggerCollider overlay is rendered');
    assert.deepEqual([hitbox.props.x, hitbox.props.y, hitbox.props.width, hitbox.props.height], [1, 3.5, 2, 1]);
    assert.deepEqual([hurtbox.props.x, hurtbox.props.y, hurtbox.props.width, hurtbox.props.height], [2.25, 2, 1, 2]);
    assert.equal(trigger.props.strokeDasharray, '5 3');
});

test('Scene View UI emits viewport selection and cursor-anchored zoom updates', () => {
    const harness = createSceneViewHarness();
    const viewport = findNode(harness.render(), node => node.props?.className === 'flex-1 relative cursor-crosshair');
    viewport.props.onClick({ button: 0, altKey: false, clientX: 40, clientY: 70, currentTarget: {
        getBoundingClientRect: () => ({ left: 10, top: 20 })
    } });
    viewport.props.onWheel({ clientX: 60, clientY: 80, deltaY: -1 });
    assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [
        { type: 'editor:viewport-select', payload: { x: 30, y: 50 } },
        { type: 'editor:camera-update', payload: { zoom: 1.1, x: 4.545454545454547, y: 5.45454545454546 } }
    ]);
});

test('Scene View starts its paused editor preview only after loading a scene', () => {
    const harness = createSceneViewHarness();
    const iframe = findNode(harness.render(), node => node.props?.title === 'Scene View');
    assert.ok(iframe);
    const source = iframe.props.srcDoc;
    const loadSceneIndex = source.indexOf('game.loadScene(payload.data || payload.path)');
    const pauseIndex = source.indexOf('if (game.pause) game.pause();', loadSceneIndex);
    const startIndex = source.indexOf('game.start();', pauseIndex);
    const loadedIndex = source.indexOf("type: 'editor:scene-loaded'", startIndex);
    assert.ok(loadSceneIndex >= 0);
    assert.ok(pauseIndex > loadSceneIndex);
    assert.ok(startIndex > pauseIndex);
    assert.ok(loadedIndex > startIndex);
    assert.equal(source.slice(0, loadSceneIndex).includes('game.start()'), false);
});

test('Scene View UI pans the camera and moves a selected entity on its gizmo axis', () => {
    const harness = createSceneViewHarness();
    let tree = harness.render();
    const viewport = findNode(tree, node => node.props?.className === 'flex-1 relative cursor-crosshair');
    viewport.props.onMouseDown({ button: 1, altKey: false, clientX: 10, clientY: 20, preventDefault() {} });
    tree = harness.render();
    tree.props.onMouseMove({ clientX: 30, clientY: 50 });
    tree = harness.render();
    const handle = findNode(tree, node => node.type === 'circle' && node.props?.cx === 78);
    assert.ok(handle, 'selected entity x-axis handle is rendered');
    handle.props.onMouseDown({ button: 0, clientX: 58, clientY: 3, preventDefault() {}, stopPropagation() {} });
    tree.props.onMouseMove({ clientX: 78, clientY: 3 });
    assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [
        { type: 'editor:camera-update', payload: { zoom: 1, x: -20, y: -30 } },
        { type: 'editor:update-component', payload: {
            id: 'entity-1', component: 'transform', data: { position: { x: 22, y: 3 } }
        } }
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(harness.canonicalEdits)), [
        { id: 'entity-1', component: 'transform', data: { position: { x: 22, y: 3 } } }
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(harness.componentEdits)), [
        { id: 'entity-1', component: 'transform', field: 'position', value: { x: 22, y: 3 } }
    ]);
});

test('Scene View UI rotation and scale gizmos update the selected runtime Transform', () => {
    const harness = createSceneViewHarness();
    let tree = harness.render();
    const rotationHandle = findNode(tree, node => node.props?.['aria-label'] === 'Rotate selected entity');
    assert.ok(rotationHandle, 'rotation ring is available for the selected entity');
    rotationHandle.props.onMouseDown({ button: 0, clientX: 10, clientY: 10, preventDefault() {}, stopPropagation() {} });
    tree.props.onMouseMove({ clientX: 35, clientY: 10 });

    tree = harness.render();
    const scaleHandle = findNode(tree, node => node.props?.['aria-label'] === 'Scale selected entity');
    assert.ok(scaleHandle, 'scale handle is available for the selected entity');
    scaleHandle.props.onMouseDown({ button: 0, clientX: 10, clientY: 10, preventDefault() {}, stopPropagation() {} });
    tree.props.onMouseMove({ clientX: 35, clientY: 10 });

    assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [
        { type: 'editor:update-component', payload: {
            id: 'entity-1', component: 'transform', data: { rotation: 0.75 }
        } },
        { type: 'editor:update-component', payload: {
            id: 'entity-1', component: 'transform', data: { scale: { x: 1.25, y: 2.5 } }
        } }
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(harness.canonicalEdits)), [
        { id: 'entity-1', component: 'transform', data: { rotation: 0.75 } },
        { id: 'entity-1', component: 'transform', data: { scale: { x: 1.25, y: 2.5 } } }
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(harness.componentEdits)), [
        { id: 'entity-1', component: 'transform', field: 'rotation', value: 0.75 },
        { id: 'entity-1', component: 'transform', field: 'scale', value: { x: 1.25, y: 2.5 } }
    ]);
});

test('Scene View boots the engine runtime without loading the debug sample project', () => {
    const harness = createSceneViewHarness();
    const iframe = findNode(harness.render(), node => node.type === 'iframe' && node.props?.title === 'Scene View');
    assert.ok(iframe);
    assert.match(iframe.props.srcDoc, /const projectResourceBridge = installProjectResourceBridge\(\);[\s\S]*await import\("\/neptune\.js"\)/);
    assert.match(iframe.props.srcDoc, /\/projectResourceBridge\.js/);
    assert.match(iframe.props.srcDoc, /projectResourceBridge\.setScenePath\(payload\.path\)/);
    assert.doesNotMatch(iframe.props.srcDoc, /debug_project|scenes\/demo\.scn/);
});
