import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Entity } from '../src/core/entity.js';
import { Transform } from '../src/components/transform.js';
import { BoxCollider } from '../src/components/boxCollider.js';
import { Collider } from '../src/nereid/collider.js';
import { Body } from '../src/nereid/body.js';
import { TopDownController, boxColliderToCollider, collidersForEntity } from '../src/nereid/topDownController.js';
import { Vector2 } from '../src/math/vec2.js';

test('PHYS-01: boxColliderToCollider adapts BoxCollider with correct dimensions, layer, and offsets', () => {
    const box = new BoxCollider(2, 3, 0.5, -0.5, { layer: 2, mask: 0x00ff, role: 'solid' });
    const collider = boxColliderToCollider(box);

    assert.equal(collider.width, 2);
    assert.equal(collider.height, 3);
    assert.equal(collider.offsetX, 0.5 - 2 / 2); // -0.5
    assert.equal(collider.offsetY, -0.5 - 3 / 2); // -2.0
    assert.equal(collider.layer, 2);
    assert.equal(collider.mask, 0x00ff);
    assert.equal(collider.role, 'solid');
    assert.equal(collider.enabled, true);
});

test('PHYS-01: boxColliderToCollider respects parent scale when computing effective bounds', () => {
    const parent = new Entity('Parent');
    parent.AddComponent(new Transform(new Vector2(0, 0), 0, new Vector2(2, 3))); // Scale 2x, 3y

    const child = new Entity('Child');
    const box = new BoxCollider(1, 1, 0, 0);
    child.AddComponent(box);
    parent.AddChild(child);

    const collider = boxColliderToCollider(box, { applyScale: true });
    assert.equal(collider.width, 2);
    assert.equal(collider.height, 3);
});

test('PHYS-01: collidersForEntity correctly handles mixed colliders and disabled bodies', () => {
    const entity = new Entity('Mixed');
    const box = new BoxCollider(1, 1);
    const trigger = new Collider(2, 2, 0, 0, { role: 'trigger' });
    const body = new Body();

    entity.AddComponent(box);
    entity.AddComponent(trigger);
    entity.AddComponent(body);

    let colliders = collidersForEntity(entity);
    assert.equal(colliders.length, 2);
    assert.ok(colliders.some(c => c.role === 'solid'));
    assert.ok(colliders.some(c => c.role === 'trigger'));

    // Disable body
    body.enabled = false;
    colliders = collidersForEntity(entity);
    assert.ok(colliders.every(c => c.enabled === false), 'all colliders are disabled when body is disabled');
});

test('PHYS-01: TopDownController movement stops at BoxCollider obstacles and ignores disabled obstacles', () => {
    const player = new Entity('Player');
    const playerTransform = new Transform(new Vector2(0, 0));
    player.AddComponent(playerTransform);
    const controller = new TopDownController({ speed: 5 });
    player.AddComponent(controller);

    const wall = new Entity('Wall');
    wall.AddComponent(new Transform(new Vector2(1, 0)));
    const wallBox = new BoxCollider(1, 2);
    wall.AddComponent(wallBox);

    // Obstacle active: movement in +X direction should stop before hitting wall
    const moved = controller.move({ x: 1, y: 0 }, 1, [{ collider: wallBox, x: 1, y: 0, entity: wall }]);
    assert.ok(moved.x < 1.0, 'player stops before wall');

    // Reset player position
    playerTransform.position.x = 0;
    playerTransform.position.y = 0;

    // Disable wall BoxCollider
    wallBox.enabled = false;
    const movedThrough = controller.move({ x: 1, y: 0 }, 1, [{ collider: wallBox, x: 1, y: 0, entity: wall }]);
    assert.ok(Math.abs(movedThrough.x - 5) < 1e-6, 'player moves freely through disabled collider');
});
