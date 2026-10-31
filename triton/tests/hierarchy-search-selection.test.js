import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleHierarchyIds, hierarchySelectionForClick } from '../src/lib/visibleHierarchyIds.ts';

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

test('Shift-click selects the clicked row when the previous anchor is hidden by search or collapse', () => {
    assert.deepEqual(hierarchySelectionForClick(['a', 'hero', 'b'], 'hidden', 'b'), ['b']);
    assert.deepEqual(hierarchySelectionForClick(['a', 'b'], 'hero', 'b'), ['b']);
    assert.deepEqual(hierarchySelectionForClick(['a', 'hero', 'b'], 'hero', 'b'), ['hero', 'b']);
});
