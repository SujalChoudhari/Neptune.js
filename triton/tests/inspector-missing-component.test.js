import assert from 'node:assert/strict';
import test from 'node:test';
import { EditorGameRunner } from '../src/lib/editorGameRunner.ts';

test('Inspector edits to a removed component cannot silently mark a scene saved', async () => {
    EditorGameRunner.openScene({ entities: [{ id: 'hero', name: 'Hero', components: [{ id: 'sprite', type: 'Sprite', props: { path: 'hero.png' } }] }] }, 'main.scene');
    assert.equal(EditorGameRunner.updateEntity('hero', 'Sprite', { path: 'new.png' }), true);
    await EditorGameRunner.saveScene(async () => true);
    assert.equal(EditorGameRunner.isDirty, false);
    assert.equal(EditorGameRunner.updateEntity('hero', 'MissingComponent', { enabled: false }), false);
    assert.equal(EditorGameRunner.isDirty, false);
    assert.deepEqual(JSON.parse(JSON.stringify(EditorGameRunner.currentScene.entities[0].components)), [{ id: 'sprite', type: 'Sprite', props: { path: 'new.png' } }]);
});
