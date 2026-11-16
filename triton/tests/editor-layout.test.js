import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editorLayoutKey, readEditorLayout, serializeEditorLayout, REQUIRED_EDITOR_PANELS } from '../src/lib/editorLayout.mjs';

function layout() {
    return {
        grid: { width: 1280, height: 720, orientation: 'HORIZONTAL', root: { type: 'branch', data: [
            { type: 'leaf', size: 720, data: { id: 'workspace', views: [...REQUIRED_EDITOR_PANELS], activeView: 'scene' } }
        ] } },
        panels: Object.fromEntries(REQUIRED_EDITOR_PANELS.map(id => [id, { id, contentComponent: id, title: id }]))
    };
}
test('workspace layouts round-trip all essential tools and use isolated project keys', () => {
    const data = layout();
    assert.deepEqual(readEditorLayout(serializeEditorLayout(data)), data);
    assert.equal(editorLayoutKey('D:\\Projects\\Emberfall\\'), editorLayoutKey('D:/Projects/Emberfall'));
    assert.notEqual(editorLayoutKey('D:/Projects/A'), editorLayoutKey('D:/Projects/B'));
    assert.equal(editorLayoutKey(null), null);
});
test('malformed, stale, hidden, duplicate and offscreen layouts fall back to defaults', () => {
    assert.equal(readEditorLayout('{broken'), null);
    assert.equal(readEditorLayout(JSON.stringify({ version: 0, layout: layout() })), null);
    for (const mutate of [
        data => delete data.panels.inspector,
        data => { data.panels.scene.contentComponent = 'fake-timeline'; },
        data => { data.grid.width = 0; },
        data => { data.grid.root.data[0].visible = false; },
        data => { data.grid.root.data[0].data.views.push('scene'); },
        data => { data.floatingGroups = [{ x: -10000 }]; },
        data => { data.grid.root.data[0].size = 0; }
    ]) {
        const data = layout(); mutate(data);
        assert.equal(serializeEditorLayout(data), null);
    }
});
