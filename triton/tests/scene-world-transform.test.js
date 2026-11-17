import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntityWorldMatrix, getEntityWorldSelectionGeometry, worldDeltaToEntityLocal } from '../src/lib/scenePicking.mjs';

test('nested renderable transforms compose parent nonuniform scale and rotation as canvas affine matrices', () => {
    const hierarchy = {
        root: { id: 'root', parentId: null, children: ['parent'] },
        parent: { id: 'parent', parentId: 'root', children: ['child'] },
        child: { id: 'child', parentId: 'parent', children: [] }
    };
    const data = {
        parent: { transform: { position: { x: 1, y: 2 }, rotation: Math.PI / 2, scale: { x: 2, y: 1 } }, components: { Sprite: { width: 64, height: 32 } } },
        child: { transform: { position: { x: 3, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } }, components: { Sprite: { width: 64, height: 32 } } }
    };
    const matrix = getEntityWorldMatrix('child', hierarchy, data);
    assert.ok(Math.abs(matrix.e / 64 - 1) < 1e-10);
    assert.ok(Math.abs(matrix.f / 64 - 386) < 1e-10);
    assert.ok(Math.abs(matrix.a) < 1e-10);
    assert.ok(Math.abs(matrix.b - 8192) < 1e-10);
    const geometry = getEntityWorldSelectionGeometry('child', hierarchy, data);
    assert.equal(geometry.corners.length, 4);
    assert.ok(Math.abs(geometry.bounds.width - 2048) < 1e-10);
    assert.ok(Math.abs(geometry.bounds.height - 8192) < 1e-10);
    const local = worldDeltaToEntityLocal('child', { x: 1, y: 0 }, hierarchy, data);
    assert.ok(Math.abs(local.x) < 1e-10);
    assert.ok(Math.abs(local.y + 1 / 64) < 1e-10);
});

test('singular parent transforms reject inverse gizmo motion', () => {
    const hierarchy = { root: { id: 'root', children: ['parent'] }, parent: { id: 'parent', parentId: 'root', children: ['child'] }, child: { id: 'child', parentId: 'parent', children: [] } };
    const data = {
        parent: { transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 0, y: 1 } }, components: { Sprite: {} } },
        child: { transform: { position: { x: 1, y: 1 }, scale: { x: 1, y: 1 } }, components: { Sprite: {} } }
    };
    assert.equal(worldDeltaToEntityLocal('child', { x: 1, y: 0 }, hierarchy, data), null);
});
