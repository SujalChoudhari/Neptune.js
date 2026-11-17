import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { pickEntityAt, translateOnAxis, resizeColliderBounds, zoomAtPoint, getFramingCamera, updateSelection, getEntitySelectionBounds, getColliderOverlayBounds, getEntityWorldMatrix, getEntityWorldSelectionGeometry, worldDeltaToEntityLocal, hasCompleteGroupTransformSelection, isSceneViewBridgeMessageSource } from '../src/lib/scenePicking.mjs';
import { BoxCollider } from '../../src/components/boxCollider.js';
import { pickRuntimeEntityAt } from '../src/lib/runtimeSelectionBridge.mjs';
import * as sceneTools from '../src/lib/sceneTools.mjs';
import { sceneContextSelection } from '../src/lib/sceneContextMenu.mjs';

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

function createSceneViewHarness(spawnFacing = undefined, selectedIds = ['entity-1'], initialTool = 'transform') {
    const sourcefile = path.resolve('triton/src/components/panels/SceneViewPanel.tsx');
    const external = [
        'react', 'react/jsx-runtime', 'lucide-react', '@/components/library', '@/context/GameContext',
        '@/lib/editorGameRunner', '@/lib/scenePicking.mjs', 'virtual:neptune-runtime-url',
        '../../../../src/thalassa/camera.js?url', '@/lib/scenePicking.mjs?url',
        '../../../../src/ui/authoredUi.js?url', '@/lib/projectResourceBridge.mjs?url', '@tauri-apps/api/core',
        './SceneToolBar', './SceneContextMenu', '@/lib/sceneContextMenu.mjs', '@/components/editor/ProjectExtensionLayer', '@/lib/sceneTools.mjs'
    ];
    const bundle = buildSync({
        bundle: true, format: 'cjs', platform: 'node', write: false,
        stdin: { contents: fs.readFileSync(sourcefile, 'utf8'), loader: 'tsx', sourcefile, resolveDir: path.dirname(sourcefile) }, external
    }).outputFiles[0].text;
    const slots = [];
    let hookIndex = 0;
    const notifications = [];
    const viewportMessages = [];
    const canonicalEdits = [];
    const componentEdits = [];
    const transactions = { begun: 0, committed: 0, cancelled: 0 };
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
        useMemo(factory) { hookIndex++; return factory(); },
        useEffect() { hookIndex++; }
    };
    const jsx = (type, props) => ({ type, props: props || {} });
    const modules = {
        react,
        './SceneToolBar': { SceneToolBar: 'SceneToolBar' },
        './SceneContextMenu': { SceneContextMenu: 'SceneContextMenu' },
        '@/lib/sceneContextMenu.mjs': { sceneContextSelection },
        '@/components/editor/ProjectExtensionLayer': { ProjectExtensionLayer: 'ProjectExtensionLayer' },
        '@/lib/sceneTools.mjs': sceneTools,
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
        'lucide-react': { ChevronDown: 'ChevronDown', ChevronLeft: 'ChevronLeft', ChevronRight: 'ChevronRight', ChevronUp: 'ChevronUp', Maximize: 'Maximize', ZoomIn: 'ZoomIn', ZoomOut: 'ZoomOut' },
        '@/components/library': { ThemedIconButton: 'ThemedIconButton' },
        '@/context/GameContext': { useGameContext: () => ({
            notifyGame: (type, payload) => notifications.push({ type, payload }),
            updateComponent: (id, component, field, value) => {
                componentEdits.push({ id, component, field, value });
                canonicalEdits.push({ id, component, data: { [field]: value } });
                notifications.push({ type: 'editor:update-component', payload: { id, component, data: { [field]: value } } });
            },
            beginSceneEdit: () => { transactions.begun += 1; return {
                commit() { transactions.committed += 1; return true; },
                cancel() { transactions.cancelled += 1; return true; }
            }; },
            canUndo: false, canRedo: false, undoSceneEdit() {}, redoSceneEdit() {},
            selectEntities() {}, addEntityToHierarchy() { return true; }, duplicateEntityInHierarchy() { return 'duplicate'; },
            deleteEntitiesInHierarchy() { return true; }, setEntityActiveInHierarchy() {}, setEntityLocked() {},
            entities: {
                root: { id: 'root', parentId: null, children: ['entity-1', 'entity-2'] },
                'entity-1': { id: 'entity-1', parentId: 'root', children: [] },
                'entity-2': { id: 'entity-2', parentId: 'root', children: [] }
            },
            selectedEntityData: {
                transform: { position: { x: 2, y: 3 }, rotation: 0.5, scale: { x: 1, y: 2 } },
                components: {
                    Hitbox: { width: 2, height: 1, offsetX: -1, offsetY: 0.5 },
                    Hurtbox: { width: 1, height: 2, offsetX: 0.25, offsetY: -1 },
                    TriggerCollider: { width: 3, height: 1, offsetX: -2, offsetY: 2 },
                    BoxCollider: { size: { x: 4, y: 3 }, offset: { x: 2, y: -3 } },
                    ...(spawnFacing !== undefined ? { SpawnPoint: { facing: spawnFacing } } : {})
                }
            },
            selectedIds,
            selectedEntitiesData: {
                'entity-1': {
                    id: 'entity-1', name: 'First',
                    transform: { position: { x: 2, y: 3 }, scale: { x: 1, y: 2 } },
                    components: { Sprite: { width: 10, height: 4 } }
                },
                'entity-2': {
                    id: 'entity-2', name: 'Second',
                    transform: { position: { x: -5, y: 6 }, scale: { x: 2, y: 1 } },
                    components: { Sprite: { _properties: { width: 4, height: 8 } } }
                }
            }
        }) },
        '@/lib/editorGameRunner': { EditorGameRunner: {
            updateEntity: (id, component, data) => canonicalEdits.push({ id, component, data })
        } },
        '@/lib/scenePicking.mjs': { translateOnAxis, resizeColliderBounds, zoomAtPoint, getFramingCamera, getColliderOverlayBounds,
            getEntityWorldMatrix, getEntityWorldSelectionGeometry, worldDeltaToEntityLocal, hasCompleteGroupTransformSelection, isSceneViewBridgeMessageSource },
        '@tauri-apps/api/core': { invoke: async () => '' },
        'virtual:neptune-runtime-url': '/neptune.js',
        '../../../../src/thalassa/camera.js?url': '/camera.js',
        '@/lib/scenePicking.mjs?url': '/scenePicking.js',
        '@/lib/projectResourceBridge.mjs?url': '/projectResourceBridge.js'
        ,'../../../../src/ui/authoredUi.js?url': '/authoredUi.js'
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
    let firstRender = true;
    const render = () => {
        hookIndex = 0;
        let tree = module.exports.SceneViewPanel();
        if (firstRender) {
            firstRender = false;
            const toolbar = findNode(tree, node => node.type === 'SceneToolBar');
            toolbar.props.onToolChange(initialTool);
            hookIndex = 0;
            tree = module.exports.SceneViewPanel();
        }
        slots[1].current = { contentWindow: { postMessage(message) { viewportMessages.push(message); } } };
        tree.props.ref.current = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 800, height: 600 }) };
        return tree;
    };
    return { render, notifications, viewportMessages, canonicalEdits, componentEdits, transactions, getSpawnPointOverlay: module.exports.getSpawnPointOverlay };
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

function findNodes(node, predicate, matches = []) {
    if (!node || typeof node !== 'object') return matches;
    if (Array.isArray(node)) {
        for (const child of node) findNodes(child, predicate, matches);
        return matches;
    }
    if (predicate(node)) matches.push(node);
    findNodes(node.props?.children, predicate, matches);
    return matches;
}

test('gizmo drag converts screen deltas to world units and constrains movement to its axis', () => {
    assert.deepEqual(translateOnAxis({ x: 10, y: 20 }, 30, 24, 2, 'x'), { x: 25, y: 20 });
    assert.deepEqual(translateOnAxis({ x: 10, y: 20 }, 30, 24, 2, 'y'), { x: 10, y: 32 });
    assert.throws(() => translateOnAxis({ x: 0, y: 0 }, 1, 1, 0, 'x'), /positive zoom/);
    assert.throws(() => translateOnAxis({ x: 0, y: 0 }, 1, 1, 1, 'z'), /axis/);
});

test('collider resize converts screen deltas through zoom and clamps dimensions above zero', () => {
    assert.deepEqual(resizeColliderBounds({ width: 2, height: 1 }, 20, 10, 2), { width: 12, height: 6 });
    assert.deepEqual(resizeColliderBounds({ width: 2, height: 1 }, -20, -10, 2), { width: 0.05, height: 0.05 });
    assert.throws(() => resizeColliderBounds({ width: 2, height: 1 }, 1, 1, 0), /positive zoom/);
    assert.throws(() => resizeColliderBounds({ width: Number.NaN, height: 1 }, 1, 1, 1), /finite dimensions/);
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
    hero.components[1].enabled = false;
    assert.equal(pickEntityAt({ children: [hero] }, 25, 30), null);
});

test('Scene View picks the rendered footprint of a rotated runtime sprite', () => {
    const target = {
        id: 'rotated',
        components: [
            { position: { x: 10, y: 20 }, scale: { x: 1, y: 1 }, rotation: Math.PI / 2 },
            { _properties: { width: 40, height: 4 } }
        ],
        children: []
    };
    const root = { children: [target] };
    assert.equal(pickEntityAt(root, 10, 35), target, 'visible vertical end is selectable');
    assert.equal(pickEntityAt(root, 25, 20), null, 'empty horizontal area is not selectable');
});

test('viewport picking uses runtime BoxCollider size and offset instead of point tolerance', () => {
    class RuntimeTransform {
        constructor() {
            this.position = { x: 10, y: 20 };
            this.scale = { x: 1, y: 1 };
        }
    }
    const target = { id: 'collider-only', components: [new RuntimeTransform(), new BoxCollider(20, 10, 4, -2)], children: [] };
    const root = { children: [target] };

    assert.equal(pickEntityAt(root, 15, 22)?.id, 'collider-only');
    assert.equal(pickEntityAt(root, 12, 20), null);
});

test('Scene View does not pick disabled collider bounds', () => {
    const collider = new BoxCollider(40, 20, 20, 0);
    const target = {
        id: 'collider-only',
        components: [{ position: { x: 10, y: 20 }, scale: { x: 1, y: 1 } }, collider],
        children: []
    };
    assert.equal(pickEntityAt({ children: [target] }, 40, 25), target);
    collider.enabled = false;
    assert.equal(pickEntityAt({ children: [target] }, 40, 25), null);
});

test('Scene View selection replacement and modifier toggling preserve unique entity IDs', () => {
    assert.deepEqual(updateSelection(['a', 'a', '', null, 'b'], null, true), ['a', 'b']);
    assert.deepEqual(updateSelection(['a', 'b'], 'c', true), ['a', 'b', 'c']);
    assert.deepEqual(updateSelection(['a', 'b'], 'a', true), ['b']);
    assert.deepEqual(updateSelection(['a', 'b'], null, true), ['a', 'b']);
    assert.deepEqual(updateSelection(['a', 'b'], 'c', false), ['c']);
    assert.deepEqual(updateSelection(['a', 'b'], null, false), []);
});

test('selection bounds use scaled sprite geometry and a fallback marker without collider sizing', () => {
    assert.deepEqual(getEntitySelectionBounds({
        id: 'sprite', name: 'Sprite',
        transform: { position: { x: 10, y: 20 }, scale: { x: -2, y: 0.5 } },
        components: { BoxCollider: { width: 90, height: 90 }, Sprite: { width: 8, height: 12 } }
    }), { id: 'sprite', name: 'Sprite', x: 2, y: 17, width: 16, height: 6 });
    assert.deepEqual(getEntitySelectionBounds({
        id: 'empty', transform: { position: { x: 1, y: 2 } }, components: {}
    }), { id: 'empty', name: '', x: -7, y: -6, width: 16, height: 16 });
    assert.deepEqual(getEntitySelectionBounds({
        id: 'disabled', transform: { position: { x: 10, y: 20 } },
        components: { Sprite: { width: 80, height: 60, enabled: false } }
    }), { id: 'disabled', name: '', x: 2, y: 12, width: 16, height: 16 });
    assert.equal(getEntitySelectionBounds({ transform: { position: { x: NaN, y: 2 } } }), null);
});

test('Scene View renders a separate outline for each selected entity without intercepting input', () => {
    const tree = createSceneViewHarness(undefined, ['entity-1', 'entity-2']).render();
    const outlines = findNodes(tree, node => node.type === 'polygon' && node.props['data-selection-outline']);
    assert.deepEqual(outlines.map(node => node.props['data-selection-outline']), ['entity-1', 'entity-2']);
    assert.deepEqual(outlines.map(node => node.props.points), [
        '-192,-64 448,-64 448,448 -192,448',
        '-576,128 -64,128 -64,640 -576,640'
    ]);
    const selectionSvg = findNode(tree, node => node.type === 'svg' && node.props['aria-label'] === 'Selected entities');
    assert.match(selectionSvg.props.className, /pointer-events-none/);
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
        { type: 'BoxCollider', color: '#a78bfa', x: -45, y: -50, width: 100, height: 100 }
    ]);
    assert.deepEqual(getColliderOverlayBounds({ transform: { position: { x: 0, y: 0 } }, components: { Hitbox: { width: 0, height: 1 } } }), []);
    assert.deepEqual(getColliderOverlayBounds({
        transform: { position: { x: 0, y: 0 } },
        components: { Hitbox: { width: 2, height: 3, enabled: false }, Hurtbox: { width: 4, height: 5, enabled: true } }
    }), [{ type: 'Hurtbox', color: '#38bdf8', x: 0, y: 0, width: 4, height: 5 }],
    'disabled collider must not show an editable overlay');
});

test('SpawnPoint overlay model resolves all cardinal directions and ignores invalid data', () => {
    const getSpawnPointOverlay = createSceneViewHarness().getSpawnPointOverlay;
    const directions = {
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        up: { x: 0, y: -1 }
    };
    for (const [facing, direction] of Object.entries(directions)) {
        assert.deepEqual(JSON.parse(JSON.stringify(getSpawnPointOverlay({
            transform: { position: { x: 4, y: -2 } },
            components: { SpawnPoint: { facing } }
        }))), { x: 4, y: -2, facing, direction });
    }
    assert.equal(getSpawnPointOverlay({ transform: { position: { x: 0, y: 0 } }, components: {} }), null);
    assert.equal(getSpawnPointOverlay({ transform: { position: { x: 0, y: 0 } }, components: { SpawnPoint: { facing: 'diagonal' } } }), null);
    assert.equal(getSpawnPointOverlay({ transform: { position: { x: Number.NaN, y: 0 } }, components: { SpawnPoint: { facing: 'right' } } }), null);
    assert.equal(getSpawnPointOverlay({ components: { SpawnPoint: { facing: 'right' } } }), null);
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
    assert.deepEqual([hitbox.props.x, hitbox.props.y, hitbox.props.width, hitbox.props.height], [64, 224, 128, 64]);
    assert.deepEqual([hurtbox.props.x, hurtbox.props.y, hurtbox.props.width, hurtbox.props.height], [144, 128, 64, 128]);
    assert.equal(trigger.props.strokeDasharray, '5 3');
});

test('Scene View renders an accessible, non-intercepting marker for each selected SpawnPoint facing', () => {
    const directions = {
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        up: { x: 0, y: -1 }
    };
    for (const [facing, direction] of Object.entries(directions)) {
        const tree = createSceneViewHarness(facing).render();
        const marker = findNode(tree, node => node.props?.['data-spawn-facing'] === facing);
        const shaft = findNode(tree, node => node.props?.['data-spawn-facing-arrow'] === 'shaft');
        assert.ok(marker, `${facing} marker is visible`);
        assert.equal(marker.props.role, 'img');
        assert.equal(marker.props['aria-label'], `Selected Spawn Point facing ${facing}`);
        assert.equal(marker.props.pointerEvents, 'none');
        assert.ok(shaft, `${facing} direction shaft is rendered`);
        assert.deepEqual([shaft.props.x1, shaft.props.y1, shaft.props.x2, shaft.props.y2], [128, 192, 128 + direction.x * 24, 192 + direction.y * 24]);
    }
});

test('Scene View SpawnPoint marker follows camera pan and zoom without capturing viewport input', () => {
    const harness = createSceneViewHarness('left');
    let tree = harness.render();
    const viewport = findNode(tree, node => node.props?.['data-scene-viewport'] === true);
    viewport.props.onMouseDown({ button: 1, clientX: 0, clientY: 0, preventDefault() {} });
    tree = harness.render();
    tree.props.onMouseMove({ clientX: 10, clientY: 15 });
    tree = harness.render();
    const zoomIn = findNode(tree, node => node.props?.title === 'Zoom In');
    zoomIn.props.onClick();
    tree = harness.render();

    const shaft = findNode(tree, node => node.props?.['data-spawn-facing-arrow'] === 'shaft');
    assert.deepEqual(
        [shaft.props.x1, shaft.props.y1, shaft.props.x2, shaft.props.y2].map(value => Number(value.toFixed(5))),
        [111.8, 197.7, 85.4, 197.7]
    );
    const marker = findNode(tree, node => node.props?.['data-spawn-facing'] === 'left');
    assert.equal(marker.props.pointerEvents, 'none');
    assert.ok(harness.notifications.some(({ type }) => type === 'editor:camera-update'));
});

test('Scene View omits direction markers for absent or unsupported SpawnPoint facing', () => {
    for (const facing of [undefined, 'diagonal']) {
        const tree = createSceneViewHarness(facing).render();
        assert.equal(findNode(tree, node => node.props?.['data-spawn-facing']), null);
    }
});

test('Scene View resizes every collider shape and syncs Inspector, canonical scene, and runtime payloads', () => {
    const cases = [
        ['Hitbox', { width: 2.15625, height: 1.078125 }],
        ['Hurtbox', { width: 1.15625, height: 2.078125 }],
        ['TriggerCollider', { width: 3.15625, height: 1.078125 }],
        ['BoxCollider', { size: { x: 4.15625, y: 3.078125 } }]
    ];

    for (const [type, expected] of cases) {
        const harness = createSceneViewHarness();
        const tree = harness.render();
        const handle = findNode(tree, node => node.props?.['aria-label'] === `Resize ${type} bounds`);
        assert.ok(handle, `${type} exposes a resize handle`);
        handle.props.onMouseDown({
            button: 0,
            clientX: 100,
            clientY: 200,
            preventDefault() {},
            stopPropagation() {}
        });
        tree.props.onMouseMove({ clientX: 110, clientY: 205 });
        tree.props.onMouseUp();

        const canonicalPatch = Object.assign({}, ...harness.canonicalEdits.filter(edit => edit.id === 'entity-1' && edit.component === type).map(edit => edit.data));
        assert.deepEqual(JSON.parse(JSON.stringify(canonicalPatch)), expected);
        const edits = harness.componentEdits.filter(edit => edit.component === type);
        const normalizedEdits = JSON.parse(JSON.stringify(edits.map(({ field, value }) => [field, value])));
        if (type === 'BoxCollider') {
            assert.deepEqual(normalizedEdits, [['size', { x: 4.15625, y: 3.078125 }]]);
        } else {
            assert.deepEqual(normalizedEdits, [['width', expected.width], ['height', expected.height]]);
        }
        assert.equal(harness.notifications.filter(item => item.type === 'editor:update-component' && item.payload.id === 'entity-1').length, edits.length);
    }
});

test('Scene View collider resize handles are focusable and resize all collider shapes with arrow keys', () => {
    const cases = [
        ['Hitbox', 'ArrowRight', false, { width: 2.1, height: 1 }],
        ['Hurtbox', 'ArrowUp', false, { width: 1, height: 1.9 }],
        ['TriggerCollider', 'ArrowLeft', false, { width: 2.9, height: 1 }],
        ['BoxCollider', 'ArrowDown', false, { size: { x: 4, y: 3.1 } }],
        ['Hitbox', 'ArrowRight', true, { width: 3, height: 1 }]
    ];

    for (const [type, key, shiftKey, expected] of cases) {
        const harness = createSceneViewHarness();
        const tree = harness.render();
        const handle = findNode(tree, node => node.props?.['aria-label'] === `Resize ${type} bounds`);
        assert.ok(handle, `${type} exposes a named resize control`);
        assert.equal(handle.props.role, 'button');
        assert.equal(handle.props.tabIndex, 0);
        assert.equal(handle.props['aria-keyshortcuts'], 'ArrowLeft ArrowRight ArrowUp ArrowDown');

        let defaultPrevented = false;
        let propagationStopped = false;
        handle.props.onKeyDown({
            key,
            shiftKey,
            preventDefault() { defaultPrevented = true; },
            stopPropagation() { propagationStopped = true; }
        });

        assert.equal(defaultPrevented, true, `${key} is handled by the resize control`);
        assert.equal(propagationStopped, true, `${key} does not bubble into viewport shortcuts`);
        const canonicalPatch = Object.assign({}, ...harness.canonicalEdits.filter(edit => edit.id === 'entity-1' && edit.component === type).map(edit => edit.data));
        assert.deepEqual(JSON.parse(JSON.stringify(canonicalPatch)), expected);
        const edits = harness.componentEdits.filter(edit => edit.component === type);
        assert.deepEqual(edits.map(edit => edit.field), type === 'BoxCollider' ? ['size'] : ['width', 'height']);
        assert.equal(harness.notifications.filter(item => item.type === 'editor:update-component' && item.payload.id === 'entity-1').length, edits.length);
    }

    const harness = createSceneViewHarness();
    const handle = findNode(harness.render(), node => node.props?.['aria-label'] === 'Resize Hitbox bounds');
    let tabWasPrevented = false;
    handle.props.onKeyDown({ key: 'Tab', preventDefault() { tabWasPrevented = true; }, stopPropagation() {} });
    assert.equal(tabWasPrevented, false, 'Tab remains available for moving focus between handles');
});

test('Scene View UI emits viewport selection and cursor-anchored zoom updates', () => {
    const harness = createSceneViewHarness();
    const viewport = findNode(harness.render(), node => node.props?.['data-scene-viewport'] === true);
    viewport.props.onClick({ button: 0, altKey: false, clientX: 40, clientY: 70, currentTarget: {
        getBoundingClientRect: () => ({ left: 10, top: 20 })
    } });
    viewport.props.onClick({ button: 0, altKey: false, shiftKey: true, clientX: 50, clientY: 75, currentTarget: {
        getBoundingClientRect: () => ({ left: 10, top: 20 })
    } });
    viewport.props.onWheel({ clientX: 60, clientY: 80, deltaY: -1 });
    assert.deepEqual(JSON.parse(JSON.stringify(harness.viewportMessages)), [
        { type: 'editor:viewport-select', payload: { x: 30, y: 50, excludedIds: [], multi: false } },
        { type: 'editor:viewport-select', payload: { x: 40, y: 55, excludedIds: [], multi: true } }
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [
        { type: 'editor:camera-update', payload: { zoom: 1.1, x: 4.545454545454547, y: 5.45454545454546 } }
    ]);
    const source = fs.readFileSync(path.resolve('triton/src/components/panels/SceneViewPanel.tsx'), 'utf8');
    assert.match(source, /type === 'editor:select'[\s\S]*editorSelection = updateSelection\(payload\?\.ids, null, true\)/);
    assert.match(source, /editorSelection = updateSelection\(editorSelection, selectedId, Boolean\(payload\.multi\)\)[\s\S]*type: 'game:selection-changed'[\s\S]*payload: \{ ids: editorSelection \}/);
});

test('toolbar zoom preserves the viewport-center world point and clamps zoom', () => {
    assert.deepEqual(zoomAtPoint({ x: 10, y: -5 }, 1, 2, 400, 300), { x: 210, y: 145 });
    assert.throws(() => zoomAtPoint({ x: 0, y: 0 }, 0, 1, 10, 10), /positive zoom levels/);

    const harness = createSceneViewHarness();
    const zoomIn = findNode(harness.render(), node => node.props?.['aria-label'] === 'Zoom In');
    assert.ok(zoomIn);
    zoomIn.props.onClick();
    const cameraUpdate = harness.notifications[0];
    assert.equal(cameraUpdate.type, 'editor:camera-update');
    assert.equal(cameraUpdate.payload.zoom, 1.1);
    assert.ok(Math.abs(cameraUpdate.payload.x - 36.363636363636374) < 1e-10);
    assert.ok(Math.abs(cameraUpdate.payload.y - 27.27272727272728) < 1e-10);
});

test('Scene View provides named directional camera pan controls at the current zoom', () => {
    const harness = createSceneViewHarness();
    let tree = harness.render();
    const panLeft = findNode(tree, node => node.props?.['aria-label'] === 'Pan Left');
    assert.ok(panLeft);
    panLeft.props.onClick();

    tree = harness.render();
    const panDown = findNode(tree, node => node.props?.['aria-label'] === 'Pan Down');
    assert.ok(panDown);
    panDown.props.onClick();

    assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [
        { type: 'editor:camera-update', payload: { zoom: 1, x: -40, y: 0 } },
        { type: 'editor:camera-update', payload: { zoom: 1, x: -40, y: 40 } }
    ]);
});

test('framing computes a padded camera for a group and rejects invalid bounds', () => {
    const camera = getFramingCamera([
        { x: -9, y: -1, width: 10, height: 8 },
        { x: -9, y: 2, width: 8, height: 8 }
    ], 800, 600);
    assert.equal(camera.zoom, 5);
    assert.equal(camera.x, -84);
    assert.equal(camera.y, -55.5);
    assert.equal(getFramingCamera([{ x: 0, y: 0, width: 2000, height: 1200 }], 800, 600)?.zoom, 0.352);
    assert.equal(getFramingCamera([{ x: 0, y: 0, width: 10000, height: 10000 }], 800, 600)?.zoom, 0.1);
    assert.equal(getFramingCamera([], 800, 600), null);
    assert.equal(getFramingCamera([null], 800, 600), null);
    assert.equal(getFramingCamera([{ x: NaN, y: 0, width: 10, height: 10 }], 800, 600), null);
    assert.equal(getFramingCamera([{ x: 0, y: 0, width: 10, height: 10 }], 80, 600), null);
});

test('Frame Selection toolbar fits every selected entity and sends the runtime camera update', () => {
    const harness = createSceneViewHarness(undefined, ['entity-1', 'entity-2']);
    const button = findNode(harness.render(), node => node.props?.['aria-label'] === 'Frame Selection');
    assert.ok(button);
    assert.equal(button.props.disabled, false);
    button.props.onClick();
    assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [
        { type: 'editor:camera-update', payload: { zoom: 0.6875, x: -645.8181818181819, y: -148.36363636363637 } }
    ]);

    const empty = findNode(createSceneViewHarness(undefined, []).render(), node => node.props?.['aria-label'] === 'Frame Selection');
    assert.equal(empty.props.disabled, true);

    const incompleteHarness = createSceneViewHarness(undefined, ['entity-1', 'missing-entity']);
    const incomplete = findNode(incompleteHarness.render(), node => node.props?.['aria-label'] === 'Frame Selection');
    assert.equal(incomplete.props.disabled, true);
    incomplete.props.onClick();
    assert.deepEqual(incompleteHarness.notifications, []);
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
    const viewport = findNode(tree, node => node.props?.['data-scene-viewport'] === true);
    viewport.props.onMouseDown({ button: 1, altKey: false, clientX: 10, clientY: 20, preventDefault() {} });
    tree = harness.render();
    tree.props.onMouseMove({ clientX: 30, clientY: 50 });
    tree = harness.render();
    const handle = findNode(tree, node => node.props?.['aria-label'] === 'Translate on X axis');
    assert.ok(handle, 'selected entity x-axis handle is rendered');
    handle.props.onMouseDown({ button: 0, clientX: 58, clientY: 3, preventDefault() {}, stopPropagation() {} });
    tree.props.onMouseMove({ clientX: 78, clientY: 3 });
    assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [
        { type: 'editor:camera-update', payload: { zoom: 1, x: -20, y: -30 } },
        { type: 'editor:update-component', payload: {
            id: 'entity-1', component: 'transform', data: { position: { x: 2.3125, y: 3 } }
        } }
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(harness.canonicalEdits)), [
        { id: 'entity-1', component: 'transform', data: { position: { x: 2.3125, y: 3 } } }
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(harness.componentEdits)), [
        { id: 'entity-1', component: 'transform', field: 'position', value: { x: 2.3125, y: 3 } }
    ]);
});

test('one transform drag records one committed history transaction', () => {
    const harness = createSceneViewHarness();
    const tree = harness.render();
    const handle = findNode(tree, node => node.props?.['aria-label'] === 'Translate on X axis');
    handle.props.onMouseDown({ button: 0, clientX: 10, clientY: 10, preventDefault() {}, stopPropagation() {} });
    tree.props.onMouseMove({ clientX: 74, clientY: 10 });
    tree.props.onMouseUp();
    assert.equal(harness.transactions.begun, 1);
    assert.equal(harness.transactions.committed, 1);
    assert.equal(harness.transactions.cancelled, 0);
    assert.ok(harness.componentEdits.some(edit => edit.component === 'transform' && edit.field === 'position'));
});

test('Scene View translates selected entities together and limits the group gizmo to translation', () => {
    const ids = ['entity-1', 'entity-2'];
    const harness = createSceneViewHarness(undefined, ids);
    let tree = harness.render();
    assert.ok(findNode(tree, node => node.props?.['aria-label'] === 'Move selected entities'));
    assert.ok(findNode(tree, node => node.props?.['aria-label'] === 'Translate on X axis'));
    assert.ok(findNode(tree, node => node.props?.['aria-label'] === 'Translate on Y axis'));
    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Rotate selected entity'), null);
    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Scale selected entity'), null);

    const xHandle = findNode(tree, node => node.props?.['aria-label'] === 'Translate on X axis');
    xHandle.props.onMouseDown({ button: 0, clientX: 56, clientY: 5.5, preventDefault() {}, stopPropagation() {} });
    tree.props.onMouseMove({ clientX: 76, clientY: 5.5 });
    assert.deepEqual(JSON.parse(JSON.stringify(harness.canonicalEdits)), [
        { id: 'entity-1', component: 'transform', data: { position: { x: 2.3125, y: 3 } } },
        { id: 'entity-2', component: 'transform', data: { position: { x: -4.6875, y: 6 } } }
    ]);

    const keyboardHarness = createSceneViewHarness(undefined, ids);
    tree = keyboardHarness.render();
    const yHandle = findNode(tree, node => node.props?.['aria-label'] === 'Translate on Y axis');
    yHandle.props.onKeyDown({ key: 'ArrowUp', shiftKey: false, preventDefault() {}, stopPropagation() {} });
    assert.deepEqual(JSON.parse(JSON.stringify(keyboardHarness.canonicalEdits)), [
        { id: 'entity-1', component: 'transform', data: { position: { x: 2, y: 2.9 } } },
        { id: 'entity-2', component: 'transform', data: { position: { x: -5, y: 5.9 } } }
    ]);
    assert.deepEqual(keyboardHarness.componentEdits.map(({ id, field }) => [id, field]), [
        ['entity-1', 'position'], ['entity-2', 'position']
    ]);
});

test('Scene View disables group movement instead of partially editing an incomplete selection', () => {
    const ids = ['entity-1', 'missing-entity'];
    const harness = createSceneViewHarness(undefined, ids);
    const tree = harness.render();

    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Move selected entities'), null);
    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Translate on X axis'), null);
    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Translate on Y axis'), null);
    assert.deepEqual(harness.canonicalEdits, []);
    assert.equal(hasCompleteGroupTransformSelection(ids, {
        'entity-1': { transform: { position: { x: 2, y: 3 } } },
        'missing-entity': undefined
    }), false);
    assert.equal(hasCompleteGroupTransformSelection(ids, {
        'entity-1': { transform: { position: { x: 2, y: 3 } } },
        'missing-entity': { transform: { position: { x: Number.NaN, y: 6 } } }
    }), false);
});

test('Scene View transform gizmos are focusable and edit transforms with arrow-key precision steps', () => {
    const cases = [
        ['Translate on X axis', 'ArrowRight', false, { position: { x: 2.1, y: 3 } }],
        ['Translate on X axis', 'ArrowLeft', true, { position: { x: 1, y: 3 } }],
        ['Translate on Y axis', 'ArrowDown', false, { position: { x: 2, y: 3.1 } }],
        ['Translate on Y axis', 'ArrowUp', true, { position: { x: 2, y: 2 } }],
        ['Rotate selected entity', 'ArrowUp', true, { rotation: 1.5 }],
        ['Rotate selected entity', 'ArrowDown', false, { rotation: 0.4 }],
        ['Scale selected entity', 'ArrowLeft', false, { scale: { x: 0.9, y: 1.8 } }],
        ['Scale selected entity', 'ArrowRight', true, { scale: { x: 1.5, y: 3 } }]
    ];

    for (const [label, key, shiftKey, expected] of cases) {
        const harness = createSceneViewHarness();
        const tree = harness.render();
        const handle = findNode(tree, node => node.props?.['aria-label'] === label);
        assert.ok(handle, `${label} is rendered`);
        assert.equal(handle.props.role, 'button');
        assert.equal(handle.props.tabIndex, 0);
        assert.match(handle.props.className, /focus-visible:stroke-white/);
        assert.ok(handle.props['aria-keyshortcuts'].split(' ').includes(key));

        let defaultPrevented = false;
        let propagationStopped = false;
        handle.props.onKeyDown({
            key,
            shiftKey,
            preventDefault() { defaultPrevented = true; },
            stopPropagation() { propagationStopped = true; }
        });

        assert.equal(defaultPrevented, true);
        assert.equal(propagationStopped, true);
        assert.deepEqual(JSON.parse(JSON.stringify(harness.canonicalEdits)), [
            { id: 'entity-1', component: 'transform', data: expected }
        ]);
        assert.deepEqual(JSON.parse(JSON.stringify(harness.componentEdits)), [
            { id: 'entity-1', component: 'transform', field: Object.keys(expected)[0], value: expected[Object.keys(expected)[0]] }
        ]);
        assert.deepEqual(JSON.parse(JSON.stringify(harness.notifications)), [{
            type: 'editor:update-component',
            payload: { id: 'entity-1', component: 'transform', data: expected }
        }]);
    }

    const harness = createSceneViewHarness();
    const handle = findNode(harness.render(), node => node.props?.['aria-label'] === 'Translate on X axis');
    let tabWasPrevented = false;
    handle.props.onKeyDown({ key: 'Tab', preventDefault() { tabWasPrevented = true; }, stopPropagation() {} });
    assert.equal(tabWasPrevented, false, 'Tab remains available for moving focus between gizmos');
    assert.deepEqual(harness.canonicalEdits, [], 'unsupported keys do not mutate the selected transform');
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


test('Scene View shape selection bounds follow authored rectangle and circle geometry', () => {
    const rectangle = getEntitySelectionBounds({ id: 'hero', transform: { position: { x: 2, y: 4 }, scale: { x: 1, y: 1 } }, components: { Shape: { geometry: 1, param: { width: 0.65, height: 0.65 } } } });
    assert.deepEqual(rectangle, { id: 'hero', name: '', x: 1.675, y: 3.675, width: 0.65, height: 0.65 });
    const circle = getEntitySelectionBounds({ transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotation: Math.PI / 4 }, components: { Shape: { geometry: 0, param: { radius: 0.5 } } } });
    assert.ok(Math.abs(circle.width - 1) < 1e-12);
    assert.ok(Math.abs(circle.height - 1) < 1e-12);
});

test('Scene View render-aware picking follows pixels, pan, zoom, draw order and selection locks', () => {
    class Transform { constructor(x, y) { this.position = { x, y }; this.scale = { x: 1, y: 1 }; this.rotation = 0; } }
    class Shape { constructor(width, height, order) { this.geometry = 1; this._properties = { param: { width, height, fill: true } }; this.renderOrder = order; } draw() {} }
    const floor = { id: 'floor', components: [new Transform(7, 4.5), new Shape(14, 9, 0)], children: [] };
    const hero = { id: 'hero', components: [new Transform(2, 4), new Shape(0.65, 0.65, 2)], children: [] };
    const scene = { children: [floor, hero], activeCamera: { screenToWorld(x, y) { return { x: x / 0.5 + 20, y: y / 0.5 + 40 }; } } };
    assert.equal(pickRuntimeEntityAt(scene, 54, 108), 'hero');
    assert.equal(pickRuntimeEntityAt(scene, 54, 108, 64, ['floor']), 'hero');
    assert.equal(pickRuntimeEntityAt(scene, 54, 108, 64, ['hero', 'floor']), null);
    assert.equal(pickRuntimeEntityAt(scene, 900, 900), null);
});


test('Scene View tool mode shows only the intended handles and can change through its toolbar', () => {
    const harness = createSceneViewHarness(undefined, ['entity-1'], 'move');
    let tree = harness.render();
    assert.ok(findNode(tree, node => node.props?.['aria-label'] === 'Translate on X axis'));
    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Rotate selected entity'), null);
    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Scale selected entity'), null);
    const modes = [
        ['rotate', 'Rotate selected entity'], ['scale', 'Scale selected entity'], ['rect', 'Resize selected entity']
    ];
    for (const [tool, label] of modes) {
        findNode(tree, node => node.type === 'SceneToolBar').props.onToolChange(tool);
        tree = harness.render();
        assert.ok(findNode(tree, node => node.props?.['aria-label'] === label));
        assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Translate on X axis'), null);
    }
    findNode(tree, node => node.type === 'SceneToolBar').props.onToolChange('hand');
    tree = harness.render();
    assert.equal(findNode(tree, node => node.props?.['aria-label'] === 'Move selected entity'), null);
});
