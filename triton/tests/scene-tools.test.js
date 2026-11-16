import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SCENE_TOOLS, getSceneToolShortcut, getSceneDragDelta, moveScenePosition, snapSceneValue, resizeSceneScale, captureTransformSnapshot } from '../src/lib/sceneTools.mjs';

const key = (value, extra = {}) => ({ key: value, target: null, ...extra });

test('QWERTY selects the documented viewport tools without requiring Shift', () => {
    assert.deepEqual(SCENE_TOOLS.map(tool => getSceneToolShortcut(key(tool.key.toLowerCase()))), ['hand', 'move', 'rotate', 'scale', 'rect', 'transform']);
    assert.equal(getSceneToolShortcut(key('W')), 'move');
    assert.equal(getSceneToolShortcut(key('z')), null);
});

test('tool shortcuts preserve typing, modifiers, dialogs, game frames and IME input', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'IFRAME']) assert.equal(getSceneToolShortcut(key('w', { target: { tagName } })), null);
    for (const blocked of ['ctrlKey', 'metaKey', 'altKey', 'isComposing', 'repeat', 'defaultPrevented']) assert.equal(getSceneToolShortcut(key('w', { [blocked]: true })), null);
    assert.equal(getSceneToolShortcut(key('w', { target: { isContentEditable: true } })), null);
    assert.equal(getSceneToolShortcut(key('w', { target: { closest: () => ({}) } })), null);
    assert.equal(getSceneToolShortcut(key('w'), { modalOpen: true }), null);
    assert.equal(getSceneToolShortcut(key('w'), { activeElement: { tagName: 'INPUT' } }), null);
});

test('pointer displacement converts CSS pixels to world units once at arbitrary zoom', () => {
    assert.deepEqual(getSceneDragDelta(32, -64, { zoom: 0.5 }), { x: 1, y: -2 });
    assert.deepEqual(getSceneDragDelta(128, 64, { zoom: 2, fine: true }), { x: 0.1, y: 0.05 });
    assert.deepEqual(getSceneDragDelta(64, 0, { zoom: 1, coarse: true }), { x: 10, y: 0 });
    assert.throws(() => getSceneDragDelta(1, 1, { zoom: 0 }), /positive/);
});

test('movement snaps the final position and preserves a constrained axis', () => {
    assert.deepEqual(moveScenePosition({ x: 0.13, y: 2.13 }, { x: 0.2, y: 10 }, { axis: 'x', snapStep: 0.25 }), { x: 0.25, y: 2.13 });
    assert.deepEqual(moveScenePosition({ x: -0.13, y: 0 }, { x: -0.2, y: 0 }, { snapStep: 0.25 }), { x: -0.25, y: 0 });
    assert.equal(snapSceneValue(0.30000000000000004, 0.1), 0.3);
    assert.throws(() => snapSceneValue(1, -1), /positive/);
});

test('Escape rollback snapshot retains independent starting transforms for a group', () => {
    const source = { hero: { transform: { position: { x: 2, y: 3 }, rotation: 0.5, scale: { x: 1, y: 2 } } } };
    const snapshot = captureTransformSnapshot(['hero'], source);
    source.hero.transform.position.x = 9;
    source.hero.transform.scale.y = 8;
    assert.deepEqual(snapshot.hero, { position: { x: 2, y: 3 }, rotation: 0.5, scale: { x: 1, y: 2 } });
    assert.equal(Object.isFrozen(snapshot.hero.position), true);
    assert.equal(captureTransformSnapshot(['missing'], source), null);
});

test('rect resize supports independent axes, aspect lock, mirrored scales and minimum size', () => {
    assert.deepEqual(resizeSceneScale({ x: 2, y: 1 }, { width: 4, height: 2 }, { x: 2, y: -1 }), { x: 3, y: 0.5 });
    assert.deepEqual(resizeSceneScale({ x: -2, y: 1 }, { width: 4, height: 2 }, { x: 2, y: 0 }, { uniform: true }), { x: -3, y: 1.5 });
    const clamped = resizeSceneScale({ x: 1, y: 1 }, { width: 2, height: 2 }, { x: -10, y: -10 });
    assert.deepEqual(clamped, { x: 0.005, y: 0.005 });
    assert.throws(() => resizeSceneScale({ x: 0, y: 1 }, { width: 2, height: 2 }, { x: 1, y: 1 }), /nonzero/);
});
