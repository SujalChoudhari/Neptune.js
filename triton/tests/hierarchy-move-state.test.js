import test from 'node:test';
import assert from 'node:assert/strict';
import { moveHierarchyEntities } from '../src/lib/moveHierarchyEntities.mjs';

const hierarchy = () => ({
    root: { id: 'root', children: ['a', 'b', 'c'], parentId: '' },
    a: { id: 'a', children: ['child'], parentId: 'root' },
    child: { id: 'child', children: [], parentId: 'a' },
    b: { id: 'b', children: [], parentId: 'root' },
    c: { id: 'c', children: [], parentId: 'root' }
});

test('moving an entity immediately updates the editor hierarchy without changing the old snapshot', () => {
    const before = hierarchy();
    const after = moveHierarchyEntities(before, ['a'], 'b');
    assert.deepEqual(after.root.children, ['b', 'c']);
    assert.deepEqual(after.b.children, ['a']);
    assert.equal(after.a.parentId, 'b');
    assert.deepEqual(before.root.children, ['a', 'b', 'c']);
});

test('same-parent ordering and ancestor/descendant multi-drag follow canonical scene behavior', () => {
    const after = moveHierarchyEntities(hierarchy(), ['a', 'child'], 'root', 2);
    assert.deepEqual(after.root.children, ['b', 'c', 'a']);
    assert.deepEqual(after.a.children, ['child']);
    assert.equal(after.child.parentId, 'a');
    assert.equal(moveHierarchyEntities(after, ['a'], 'child'), after);
});
