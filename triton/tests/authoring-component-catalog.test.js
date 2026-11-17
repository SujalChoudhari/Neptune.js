import test from 'node:test';
import assert from 'node:assert/strict';
import { componentCompatibilityError, getComponentDefaults, registeredAuthoringComponents } from '../src/components/panels/inspector/componentCatalog.ts';

test('Add Component catalog matches registered IDs and provides valid authoring defaults', () => {
    assert.deepEqual(registeredAuthoringComponents.map(component => component.id), [
        'ProjectBehaviour', 'Sprite', 'BoxCollider', 'Shape', 'TriggerCollider', 'Hitbox', 'Hurtbox',
        'Dialogue', 'QuestDefinition', 'EnemyConfig', 'SceneTransition', 'SpawnPoint'
    ]);
    assert.deepEqual(getComponentDefaults('ProjectBehaviour'), { module: '', settings: {} });
    assert.deepEqual(getComponentDefaults('Shape').param, {
        radius: 1, color: { r: 255, g: 0, b: 255, a: 1 }, fill: true, width: 1, height: 1,
        outline: { r: 0, g: 0, b: 0, a: 1 }, thickness: 1, points: []
    });
    assert.deepEqual(getComponentDefaults('BoxCollider'), { size: { x: 1, y: 1 }, offset: { x: 0, y: 0 } });
    assert.equal(getComponentDefaults('Sprite').width, 1);
    assert.equal(getComponentDefaults('TriggerCollider').width, 1);
    assert.equal(getComponentDefaults('Transform'), null);
});

test('component catalog rejects unregistered and duplicate additions without inventing collider conflicts', () => {
    assert.match(componentCompatibilityError('Transform', []), /not registered/);
    assert.match(componentCompatibilityError('sprite', ['Sprite']), /already attached/);
    assert.equal(componentCompatibilityError('Hurtbox', ['BoxCollider']), null);
    assert.equal(componentCompatibilityError('Hitbox', ['Hurtbox']), null);
});
