import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
    SweptAABB,
    ElevationFilter,
    KnockbackMotor,
    HazardSystem
} from "../src/nereid/sweptCollision.js";
import * as Nereid from "../src/nereid/index.js";
import * as Neptune from "../src/neptune.js";

test("PHYS-03 Exports: classes are exported across sweptCollision, nereid, and neptune", () => {
    assert.equal(typeof SweptAABB, "function");
    assert.equal(typeof ElevationFilter, "function");
    assert.equal(typeof KnockbackMotor, "function");
    assert.equal(typeof HazardSystem, "function");

    assert.equal(Nereid.SweptAABB, SweptAABB);
    assert.equal(Nereid.ElevationFilter, ElevationFilter);
    assert.equal(Nereid.KnockbackMotor, KnockbackMotor);
    assert.equal(Nereid.HazardSystem, HazardSystem);

    assert.equal(Neptune.SweptAABB, SweptAABB);
    assert.equal(Neptune.ElevationFilter, ElevationFilter);
    assert.equal(Neptune.KnockbackMotor, KnockbackMotor);
    assert.equal(Neptune.HazardSystem, HazardSystem);
});

test("SweptAABB: prevents tunneling through thin wall with high velocity and long step", () => {
    // Thin wall from x = 19.9 to 20.1 (width 0.2)
    const thinWall = { left: 19.9, right: 20.1, top: 0, bottom: 20 };

    // Fast projectile: 0.5x0.5 box at x = 0..0.5 moving dx = 50 in a single step
    const projectile = { left: 0, right: 0.5, top: 5, bottom: 5.5 };
    const dx = 50;
    const dy = 0;

    const result = SweptAABB.sweepBoxAgainstBox(projectile, dx, dy, thinWall);

    assert.equal(result.hit, true);
    // Impact should be around (19.9 - 0.5/2) = 19.65 / 50 = ~0.39
    assert.ok(result.toi > 0.35 && result.toi < 0.45);
    assert.equal(result.normal.x, -1);
    assert.equal(result.normal.y, 0);

    // If naive discrete check was used, projectile would jump from x=0.25 to x=50.25 and miss the wall completely!
    const endCenter = 0.25 + dx;
    assert.ok(endCenter > thinWall.right); // Naive step tunnels
});

test("SweptAABB: returns hit=false when trajectory does not intersect obstacle", () => {
    const obstacle = { left: 10, right: 20, top: 10, bottom: 20 };
    const projectile = { left: 0, right: 1, top: 0, bottom: 1 };

    // Moving horizontally along y=0..1, misses obstacle at y=10..20
    const result = SweptAABB.sweepBoxAgainstBox(projectile, 30, 0, obstacle);
    assert.equal(result.hit, false);
    assert.equal(result.toi, 1.0);
});

test("KnockbackMotor: applies impulse, decelerates, and stops cleanly", () => {
    const motor = new KnockbackMotor({ decay: 5.0, minVelocity: 0.1 });
    motor.applyImpulse(10, 0);

    assert.equal(motor.isActive, true);
    assert.equal(motor.vx, 10);

    // Step 0.1s in open space
    const bounds = { left: 0, right: 1, top: 0, bottom: 1 };
    const step1 = motor.step(0.1, bounds);

    assert.ok(step1.dx > 0);
    assert.equal(step1.hitWall, false);
    assert.ok(motor.vx < 10); // Decelerated by friction

    // Step multiple times until friction stops it
    for (let i = 0; i < 20; i++) {
        motor.step(0.1, bounds);
    }

    assert.equal(motor.isActive, false);
    assert.equal(motor.vx, 0);
});

test("KnockbackMotor: handles knockback into wall without clipping or tunneling", () => {
    const motor = new KnockbackMotor({ decay: 2.0 });
    // Strong knockback towards a wall located at x = 5
    motor.applyImpulse(20, 0);

    const bounds = { left: 3, right: 4, top: 0, bottom: 2 }; // 1 unit away from wall
    const wall = { left: 5, right: 6, top: -10, bottom: 10 };

    let wallImpactFired = false;
    motor.onKnockbackEvent(e => {
        if (e.type === "wall-impact") wallImpactFired = true;
    });

    const stepResult = motor.step(0.5, bounds, [wall]); // would move 10 units without collision!

    assert.equal(stepResult.hitWall, true);
    assert.equal(wallImpactFired, true);
    // Entity displaced up to wall, but does not penetrate it
    assert.ok(stepResult.dx <= 1.0);
    // Normal velocity into wall was absorbed
    assert.equal(motor.vx, 0);
});

test("ElevationFilter: accurately detects overlapping vs non-overlapping elevation intervals", () => {
    // Overlapping: Ground entity (0..2) and Low fence (1..3)
    assert.equal(ElevationFilter.overlaps(0, 2, 1, 2), true);

    // Touching borders: (0..2) and (2..4) -> no volume overlap
    assert.equal(ElevationFilter.overlaps(0, 2, 2, 2), false);

    // Completely separated: Ground trap (0..1) vs Flying projectile (5..6)
    assert.equal(ElevationFilter.overlaps(0, 1, 5, 1), false);
});

test("HazardSystem: damages ground target while immune target at different elevation avoids damage", () => {
    const hazard = new HazardSystem();
    const zoneId = hazard.addZone({
        bounds: { left: 0, right: 10, top: 0, bottom: 10 },
        elevation: 0,
        height: 1, // Ground hazard: span [0, 1]
        damagePerTick: 25,
        tickInterval: 0.5
    });

    assert.ok(zoneId);

    const groundPlayer = {
        id: "ground_player",
        bounds: { left: 2, right: 4, top: 2, bottom: 4 },
        elevation: 0,
        height: 2, // span [0, 2] -> overlaps [0, 1]
        health: 100,
        receiveDamage(dmg) { this.health -= dmg.amount; }
    };

    const flyingPlayer = {
        id: "flying_player",
        bounds: { left: 2, right: 4, top: 2, bottom: 4 }, // Same 2D position!
        elevation: 5,
        height: 2, // span [5, 7] -> NO overlap with [0, 1]
        health: 100,
        receiveDamage(dmg) { this.health -= dmg.amount; }
    };

    // Step 0.6 seconds -> tick fires (tickInterval = 0.5)
    const events = hazard.step(0.6, [groundPlayer, flyingPlayer]);

    assert.equal(events.length, 1);
    assert.equal(events[0].targetId, "ground_player");
    assert.equal(groundPlayer.health, 75);
    // Flying player at elevation 5 took zero damage!
    assert.equal(flyingPlayer.health, 100);
});
