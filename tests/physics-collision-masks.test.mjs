import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
    CollisionLayers,
    createCollisionMask,
    canLayersCollide,
    ContactSolver,
    TriggerLifecycleSystem
} from "../src/nereid/collisionLayers.js";
import { Collider } from "../src/nereid/collider.js";
import * as Nereid from "../src/nereid/index.js";
import * as Neptune from "../src/neptune.js";

test("PHYS-02 Exports: exports available across collisionLayers, nereid, and neptune", () => {
    assert.equal(typeof CollisionLayers, "object");
    assert.equal(typeof createCollisionMask, "function");
    assert.equal(typeof canLayersCollide, "function");
    assert.equal(typeof ContactSolver, "function");
    assert.equal(typeof TriggerLifecycleSystem, "function");

    assert.equal(Nereid.CollisionLayers, CollisionLayers);
    assert.equal(Nereid.createCollisionMask, createCollisionMask);
    assert.equal(Nereid.canLayersCollide, canLayersCollide);
    assert.equal(Nereid.ContactSolver, ContactSolver);
    assert.equal(Nereid.TriggerLifecycleSystem, TriggerLifecycleSystem);

    assert.equal(Neptune.CollisionLayers, CollisionLayers);
    assert.equal(Neptune.createCollisionMask, createCollisionMask);
    assert.equal(Neptune.canLayersCollide, canLayersCollide);
    assert.equal(Neptune.ContactSolver, ContactSolver);
    assert.equal(Neptune.TriggerLifecycleSystem, TriggerLifecycleSystem);
});

test("CollisionLayers and createCollisionMask: computes bitwise masks accurately", () => {
    assert.equal(CollisionLayers.PLAYER, 2);
    assert.equal(CollisionLayers.ENEMY, 4);
    assert.equal(CollisionLayers.TERRAIN, 8);

    const mask = createCollisionMask(CollisionLayers.PLAYER, CollisionLayers.ENEMY);
    assert.equal(mask, 6); // 2 | 4 = 6
    assert.equal((mask & CollisionLayers.PLAYER) !== 0, true);
    assert.equal((mask & CollisionLayers.ENEMY) !== 0, true);
    assert.equal((mask & CollisionLayers.TERRAIN) !== 0, false);
});

test("canLayersCollide: evaluates symmetric vs asymmetric mask filtering", () => {
    const triggerLayer = CollisionLayers.TRIGGER;
    const triggerMask = createCollisionMask(CollisionLayers.PLAYER); // Trigger detects Player

    const playerLayer = CollisionLayers.PLAYER;
    const playerMask = createCollisionMask(CollisionLayers.TERRAIN); // Player only cares about Terrain, NOT Trigger

    // Symmetric mode: both must match -> should be false because Player does not mask Trigger
    const symmetric = canLayersCollide(triggerLayer, triggerMask, playerLayer, playerMask, { symmetric: true });
    assert.equal(symmetric, false);

    // Asymmetric mode: Trigger evaluating Player -> should be true because Trigger masks Player!
    const asymmetricTrigger = canLayersCollide(triggerLayer, triggerMask, playerLayer, playerMask, { symmetric: false });
    assert.equal(asymmetricTrigger, true);

    // Asymmetric mode: Player evaluating Trigger -> should be false because Player does NOT mask Trigger
    const asymmetricPlayer = canLayersCollide(playerLayer, playerMask, triggerLayer, triggerMask, { symmetric: false });
    assert.equal(asymmetricPlayer, false);
});

test("ContactSolver.getAABBContact: computes penetration depth, normal, and corner contact", () => {
    // Horizontal penetration: Box A penetrates Box B on the left edge
    const boxA = { left: 0, right: 10, top: 0, bottom: 10 };
    const boxB = { left: 8, right: 18, top: 0, bottom: 10 };

    const contact = ContactSolver.getAABBContact(boxA, boxB);
    assert.notEqual(contact, null);
    assert.equal(contact.depth, 2);
    assert.equal(contact.normal.x, -1);
    assert.equal(contact.normal.y, 0);

    // No overlap
    const boxC = { left: 20, right: 30, top: 0, bottom: 10 };
    assert.equal(ContactSolver.getAABBContact(boxA, boxC), null);

    // Corner contact tie (ox === oy = 2)
    const boxD = { left: 8, right: 18, top: 8, bottom: 18 };
    const cornerContact = ContactSolver.getAABBContact(boxA, boxD);
    assert.notEqual(cornerContact, null);
    assert.equal(cornerContact.depth, 2);
    assert.ok(cornerContact.normal.x < 0);
    assert.ok(cornerContact.normal.y < 0);
});

test("ContactSolver.resolveOverlappingSpawn: separates entity spawned inside obstacles", () => {
    // Player spawned overlapping a static wall
    const playerBounds = { left: 5, right: 15, top: 0, bottom: 10 }; // center (10, 5), width 10, height 10
    const wall = { left: 0, right: 8, top: 0, bottom: 10 };          // overlapX = 3, overlapY = 10

    const result = ContactSolver.resolveOverlappingSpawn(playerBounds, [wall]);
    assert.equal(result.resolved, true);
    // Overlap on X is 3, shallower than Y (10), so pushed right
    assert.ok(result.displacementX > 2.9);

    // Verify after displacement there is no overlap
    const resolvedPlayer = {
        left: playerBounds.left + result.displacementX,
        right: playerBounds.right + result.displacementX,
        top: playerBounds.top + result.displacementY,
        bottom: playerBounds.bottom + result.displacementY
    };
    assert.equal(ContactSolver.getAABBContact(resolvedPlayer, wall), null);
});

test("ContactSolver.slideAlongNormal: projects velocity along wall normal without sticking", () => {
    // Moving diagonally into a vertical wall with normal (-1, 0)
    const vx = 5;
    const vy = 5;
    const normalX = -1;
    const normalY = 0;

    const slid = ContactSolver.slideAlongNormal(vx, vy, normalX, normalY);
    // X velocity into wall is cancelled; Y velocity along wall is preserved
    assert.equal(slid.vx, 0);
    assert.equal(slid.vy, 5);
});

test("TriggerLifecycleSystem: enter, stay, and exit events across steps", () => {
    const system = new TriggerLifecycleSystem();
    const events = [];

    system.on("enter", e => events.push({ phase: "enter", ...e }));
    system.on("stay", e => events.push({ phase: "stay", ...e }));
    system.on("exit", e => events.push({ phase: "exit", ...e }));

    const triggerCol = new Collider(10, 10, 0, 0);
    triggerCol.layer = CollisionLayers.TRIGGER;
    triggerCol.mask = CollisionLayers.PLAYER;
    triggerCol.role = "trigger";

    const playerCol = new Collider(4, 4, 0, 0);
    playerCol.layer = CollisionLayers.PLAYER;
    playerCol.mask = CollisionLayers.ALL;
    playerCol.role = "player";

    // Step 1: Player enters trigger area (overlapping spawn)
    system.step([
        { collider: triggerCol, x: 5, y: 5 },
        { collider: playerCol, x: 5, y: 5 }
    ]);

    assert.equal(events.length, 1);
    assert.equal(events[0].phase, "enter");

    // Step 2: Player stays in trigger area
    system.step([
        { collider: triggerCol, x: 5, y: 5 },
        { collider: playerCol, x: 6, y: 5 }
    ]);

    assert.equal(events.length, 2);
    assert.equal(events[1].phase, "stay");

    // Step 3: Player moves far away -> exit
    system.step([
        { collider: triggerCol, x: 5, y: 5 },
        { collider: playerCol, x: 50, y: 50 }
    ]);

    assert.equal(events.length, 3);
    assert.equal(events[2].phase, "exit");
});

test("TriggerLifecycleSystem: removal in callback handles safely without crashing or skipping", () => {
    const system = new TriggerLifecycleSystem();
    const triggerCol = new Collider(10, 10, 0, 0);
    triggerCol.layer = CollisionLayers.TRIGGER;
    triggerCol.mask = CollisionLayers.ALL;

    const pickupA = new Collider(2, 2, 0, 0);
    pickupA.layer = CollisionLayers.ITEM;
    pickupA.mask = CollisionLayers.ALL;

    const pickupB = new Collider(2, 2, 0, 0);
    pickupB.layer = CollisionLayers.ITEM;
    pickupB.mask = CollisionLayers.ALL;

    let callbackFiredA = false;
    let callbackFiredB = false;

    // In callback for pickupA, we disable pickupA (simulating pickup collection & removal)
    system.on("enter", evt => {
        if (evt.other === pickupA) {
            callbackFiredA = true;
            pickupA.enabled = false; // Disabling/removing inside callback
        }
        if (evt.other === pickupB) {
            callbackFiredB = true;
        }
    });

    // Step with both pickups overlapping trigger
    system.step([
        { collider: triggerCol, x: 5, y: 5 },
        { collider: pickupA, x: 5, y: 5 },
        { collider: pickupB, x: 5, y: 5 }
    ]);

    assert.equal(callbackFiredA, true);
    assert.equal(callbackFiredB, true);

    // Next step: pickupA is disabled, so it should trigger exit or clean up cleanly
    assert.doesNotThrow(() => {
        system.step([
            { collider: triggerCol, x: 5, y: 5 },
            { collider: pickupA, x: 5, y: 5 },
            { collider: pickupB, x: 5, y: 5 }
        ]);
    });
});
