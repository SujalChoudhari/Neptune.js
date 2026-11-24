import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Entity, isEntityActive } from '../src/core/entity.js';
import { DestroyQueue } from '../src/core/destroyQueue.js';
import { Component } from '../src/components/component.js';
import { Behaviour } from '../src/scripts/script.js';
import { ScriptManager } from '../src/scripts/scriptManager.js';
import { Scene } from '../src/core/scene.js';
import { SceneManager } from '../src/core/sceneManager.js';

test('CORE-01: DestroyQueue drains re-entrantly and deduplicates additions', () => {
    DestroyQueue.clear();
    const parent = new Entity('Parent');
    const child = new Entity('Child');
    parent.AddChild(child);

    let secondDestroyed = false;
    const second = new Entity('Second');
    const comp = new Component();
    comp.onDestroy = () => {
        // Re-entrant queue addition during destruction
        DestroyQueue.Add(second);
        secondDestroyed = true;
    };
    parent.AddComponent(comp);

    DestroyQueue.Add(parent);
    DestroyQueue.Add(parent); // Duplicate addition
    assert.equal(DestroyQueue.size, 1);

    DestroyQueue.destroy();
    assert.equal(parent._destroyed, true);
    assert.equal(child._destroyed, true);
    assert.equal(second._destroyed, true);
    assert.equal(secondDestroyed, true);
    assert.equal(DestroyQueue.size, 0);
});

test('CORE-01: Entity double destroy is safe and idempotent', () => {
    const entity = new Entity('Idempotent');
    let destroyCount = 0;
    const comp = new Component();
    comp.destroy = () => { destroyCount++; };
    entity.AddComponent(comp);

    entity.destroy();
    assert.equal(entity._destroyed, true);
    assert.equal(destroyCount, 1);

    // Second destroy does nothing
    entity.destroy();
    assert.equal(destroyCount, 1);
});

test('CORE-01: Cannot add child or component to a destroyed entity', () => {
    const entity = new Entity('Dead');
    entity.destroy();

    assert.throws(() => {
        entity.AddComponent(new Component());
    }, /Cannot add component to a destroyed entity/);

    assert.throws(() => {
        entity.AddChild(new Entity('Orphan'));
    }, /Cannot add child to a destroyed entity/);

    const aliveParent = new Entity('Alive');
    assert.throws(() => {
        aliveParent.AddChild(entity);
    }, /Cannot add a destroyed child entity/);
});

test('CORE-01: Destroying entity during ScriptManager update safely cleans up without crashing', () => {
    const entityA = new Entity('EntityA');
    const entityB = new Entity('EntityB');
    let bUpdated = false;

    const killerBehaviour = new Behaviour('Killer', null, () => {
        // Destroy entityB while iteration is happening
        entityB.destroy();
    });
    const victimBehaviour = new Behaviour('Victim', null, () => {
        bUpdated = true;
    });

    entityA.AddComponent(killerBehaviour);
    entityB.AddComponent(victimBehaviour);

    // Initial tick
    ScriptManager.behaviourInit();
    ScriptManager.behaviourUpdate(0.016);

    // Victim was destroyed during update, its behaviour is removed
    assert.equal(entityB._destroyed, true);
    assert.equal(bUpdated, false);

    // Clean up
    entityA.destroy();
});

test('CORE-01: Reparenting active and inactive entities updates active state correctly without cycle', () => {
    const parentA = new Entity('ParentA');
    parentA.active = false;

    const parentB = new Entity('ParentB');
    parentB.active = true;

    const child = new Entity('Child');
    parentA.AddChild(child);
    assert.equal(isEntityActive(child), false);

    // Move child to active parentB
    parentB.AddChild(child);
    assert.equal(child.parent, parentB);
    assert.equal(parentA.children.includes(child), false);
    assert.equal(isEntityActive(child), true);

    // Rejects cycle
    assert.throws(() => {
        child.AddChild(parentB);
    }, /cannot create a parent cycle/);
});
