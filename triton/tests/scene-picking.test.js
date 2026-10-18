import test from 'node:test';
import assert from 'node:assert/strict';
import { pickEntityAt, translateOnAxis } from '../src/lib/scenePicking.mjs';

const entity = (id, x, y, children = []) => ({
    id,
    components: [{ position: { x, y }, scale: { x: 1, y: 1 } }, { width: 32, height: 24 }],
    children
});

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
