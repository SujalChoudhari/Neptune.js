import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleHierarchyIds } from '../src/lib/visibleHierarchyIds.ts';

const entities = {
    root: { id: 'root', parentId: null, name: 'Scene', expanded: true, children: ['a', 'b'] },
    a: { id: 'a', parentId: 'root', name: 'Actors', expanded: false, children: ['hero', 'hidden'] },
    hero: { id: 'hero', parentId: 'a', name: 'Hero', expanded: false, children: [] },
    hidden: { id: 'hidden', parentId: 'a', name: 'Villain', expanded: false, children: [] },
    b: { id: 'b', parentId: 'root', name: 'Hero backup', expanded: false, children: [] }
};

test('Hierarchy search range includes matching rows and ancestors but not filtered siblings', () => {
    assert.deepEqual(visibleHierarchyIds(entities, 'hero'), ['a', 'hero', 'b']);
    assert.deepEqual(visibleHierarchyIds(entities, ''), ['a', 'b']);
});
