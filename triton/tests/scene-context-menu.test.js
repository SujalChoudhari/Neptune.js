import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSceneMenuPosition, sceneContextSelection } from '../src/lib/sceneContextMenu.mjs';

test('scene context menu stays within the viewport edges', () => {
    assert.deepEqual(clampSceneMenuPosition(995, 795, 180, 150, 1000, 800), { x: 816, y: 646 });
    assert.deepEqual(clampSceneMenuPosition(-10, -20, 180, 150, 1000, 800), { x: 4, y: 4 });
});

test('scene context selection preserves selected groups and rejects locked hits', () => {
    const entities = { a: { locked: false }, b: { locked: false }, c: { locked: true } };
    assert.deepEqual(sceneContextSelection('b', ['a', 'b'], entities), ['a', 'b']);
    assert.deepEqual(sceneContextSelection('c', ['a', 'b'], entities), []);
    assert.deepEqual(sceneContextSelection('a', ['b'], entities), ['a']);
    assert.deepEqual(sceneContextSelection(null, ['a'], entities), []);
});
