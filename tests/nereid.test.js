import { describe, it, expect, beforeEach } from "./tester.js";
import { Body, Collider, SolidCollider, TriggerCollider, Hitbox, Hurtbox, InteractionArea, HazardArea, CollisionSystem, PlatformerController } from "../src/nereid/index.js";
import { Entity, Transform } from "../src/neptune.js";

// ============================================
// Body Tests
// ============================================
describe('Body', () => {
    let body;

    beforeEach(() => {
        body = new Body();
    });

    it('creates body with default values', () => {
        expect(body.velocity.x).toBe(0);
        expect(body.velocity.y).toBe(0);
        expect(body.grounded).toBe(false);
    });

    it('applyForce adds to velocity', () => {
        body.applyForce(10, 5);
        expect(body.velocity.x).toBe(10);
        expect(body.velocity.y).toBe(5);
    });

    it('impulse sets velocity directly', () => {
        body.velocity.x = 100;
        body.impulse(50, 25);
        expect(body.velocity.x).toBe(50);
        expect(body.velocity.y).toBe(25);
    });

    it('applies validated knockback as an immediate velocity change', () => {
        body.velocity.x = 3;
        body.applyKnockback(-12, 6);
        expect(body.velocity.x).toBe(-12);
        expect(body.velocity.y).toBe(6);
        expect(() => body.applyKnockback(NaN, 0)).toThrow(/finite/);
    });

    it('update applies gravity when not grounded', () => {
        body.gravity = 1000;
        body.update(0.1);
        expect(body.velocity.y).toBe(100);
    });

    it('update respects maxFallSpeed', () => {
        body.gravity = 10000;
        body.maxFallSpeed = 500;
        body.update(1);
        expect(body.velocity.y).toBe(500);
    });

    it('friction applies when grounded', () => {
        body.grounded = true;
        body.velocity.x = 100;
        body.friction = 0.5;
        body.update(0.016);
        expect(body.velocity.x).toBe(50);
    });
});

// ============================================
// Collider Tests
// ============================================
describe('Collider', () => {
    let collider;

    beforeEach(() => {
        collider = new Collider(32, 32, 0, 0);
    });

    it('creates collider with dimensions', () => {
        expect(collider.width).toBe(32);
        expect(collider.height).toBe(32);
    });

    it('getBounds calculates correct position', () => {
        const bounds = collider.getBounds(100, 200);
        expect(bounds.left).toBe(100);
        expect(bounds.top).toBe(200);
        expect(bounds.right).toBe(132);
        expect(bounds.bottom).toBe(232);
    });

    it('getBounds applies offset', () => {
        collider.offsetX = -16;
        collider.offsetY = -16;
        const bounds = collider.getBounds(100, 100);
        expect(bounds.left).toBe(84);
        expect(bounds.top).toBe(84);
    });

    it('overlaps detects collision', () => {
        const other = new Collider(32, 32);
        expect(collider.overlaps(other, 0, 0, 16, 16)).toBe(true);
        expect(collider.overlaps(other, 0, 0, 100, 100)).toBe(false);
    });

    it('containsPoint works correctly', () => {
        expect(collider.containsPoint(16, 16, 0, 0)).toBe(true);
        expect(collider.containsPoint(50, 50, 0, 0)).toBe(false);
    });
});

// ============================================
// Collision roles and event system
// ============================================
describe('CollisionSystem', () => {
    it('keeps solid, trigger, hitbox, and hurtbox roles distinct and validates layer masks', () => {
        expect(new SolidCollider().role).toBe("solid");
        expect(new TriggerCollider().isTrigger).toBe(true);
        expect(new Hitbox().role).toBe("hitbox");
        expect(new Hurtbox().role).toBe("hurtbox");
        expect(() => new Collider(0, 10)).toThrow(/positive finite/);
        expect(() => new Collider(10, 10, 0, 0, { layer: 0 })).toThrow(/layer/);
    });

    it('emits deterministic trigger enter, stay, and exit events and filters layers by masks', () => {
        const system = new CollisionSystem();
        const sensor = new TriggerCollider(10, 10, 0, 0, { layer: 1, mask: 2 });
        const target = new SolidCollider(10, 10, 0, 0, { layer: 2, mask: 1 });
        const events = [];
        for (const phase of ["enter", "stay", "exit"]) {
            sensor.on(phase, event => events.push(`sensor:${event.phase}`));
            target.on(phase, event => events.push(`target:${event.phase}`));
        }
        expect(system.step([{ collider: target, x: 0, y: 0 }, { collider: sensor, x: 0, y: 0 }])).toBe(1);
        system.step([{ collider: sensor, x: 0, y: 0 }, { collider: target, x: 0, y: 0 }]);
        system.step([{ collider: sensor, x: 20, y: 0 }, { collider: target, x: 0, y: 0 }]);
        expect(events).toEqual(["target:enter", "sensor:enter", "target:stay", "sensor:stay", "target:exit", "sensor:exit"]);
        expect(system.step([{ collider: sensor, x: 0, y: 0 }, { collider: new SolidCollider(10, 10, 0, 0, { layer: 4, mask: 1 }), x: 0, y: 0 }])).toBe(0);
    });

    it('does not process inactive collider branches and resumes contacts when reactivated', () => {
        const system = new CollisionSystem();
        const parent = new Entity("Inactive branch");
        const child = new Entity("Sensor");
        parent.AddChild(child);
        const sensor = new TriggerCollider(10, 10);
        child.AddComponent(sensor);
        const target = new Entity("Target");
        const solid = new SolidCollider(10, 10);
        target.AddComponent(solid);
        const events = [];
        sensor.on("enter", () => events.push("enter"));
        sensor.on("stay", () => events.push("stay"));
        sensor.on("exit", () => events.push("exit"));
        const entries = [{ collider: sensor, x: 0, y: 0, entity: child }, { collider: solid, x: 0, y: 0, entity: target }];
        parent.active = false;
        expect(system.step(entries)).toBe(0);
        expect(events).toEqual([]);
        parent.active = true;
        expect(system.step(entries)).toBe(1);
        expect(events).toEqual(["enter"]);
        child.active = false;
        expect(system.step(entries)).toBe(0);
        expect(events).toEqual(["enter", "exit"]);
        child.active = true;
        expect(system.step(entries)).toBe(1);
        expect(events).toEqual(["enter", "exit", "enter"]);
        target.active = false;
        expect(system.step(entries)).toBe(0);
        expect(events).toEqual(["enter", "exit", "enter", "exit"]);
        target.active = true;
        parent.active = false;
        expect(system.step([{ collider: sensor, x: 0, y: 0 }, { collider: solid, x: 0, y: 0 }])).toBe(0);
    });

    it('reports hit, hurt, hazard, interaction, and climbable contacts with entities', () => {
        const system = new CollisionSystem();
        const attacker = new Hitbox(8, 8);
        const victim = new Hurtbox(8, 8);
        const hazard = new HazardArea(8, 8, 0, 0, { hazard: { damage: 3 } });
        const interaction = new InteractionArea(8, 8);
        const ladder = new Collider(8, 8, 0, 0, { climbable: true });
        const hits = [], hurts = [], hazards = [], interactions = [], climbs = [];
        attacker.on("hit", e => hits.push(e.otherEntity));
        victim.on("hurt", e => hurts.push(e.entity));
        hazard.on("hazard", e => hazards.push(e.otherEntity));
        interaction.on("interaction", e => interactions.push(e.otherEntity));
        ladder.on("climbable", e => climbs.push(e.otherEntity));
        system.step([
            { collider: attacker, x: 0, y: 0, entity: "attacker" },
            { collider: victim, x: 0, y: 0, entity: "victim" },
            { collider: hazard, x: 0, y: 0, entity: "spikes" },
            { collider: interaction, x: 0, y: 0, entity: "door" },
            { collider: ladder, x: 0, y: 0, entity: "ladder" }
        ]);
        expect(hits).toEqual(["victim"]);
        expect(hurts).toEqual(["victim"]);
        expect(hazards).toContain("attacker");
        expect(interactions).toContain("attacker");
        expect(climbs.length).toBeGreaterThan(0);
        expect(hazard.hazard.damage).toBe(3);
    });

    it('checks one-way surfaces only when crossed from their permitted face and draws collider bounds', () => {
        const platform = new SolidCollider(20, 4, 0, 0, { oneWay: "up" });
        const surface = platform.getBounds(0, 10);
        const before = { left: 2, top: 0, right: 8, bottom: 10 };
        const landing = { left: 2, top: 8, right: 8, bottom: 14 };
        const fromBelow = { left: 2, top: 12, right: 8, bottom: 18 };
        expect(CollisionSystem.canResolveOneWay(platform, surface, before, landing)).toBe(true);
        expect(CollisionSystem.canResolveOneWay(platform, surface, fromBelow, landing)).toBe(false);
        const calls = [];
        const context = { strokeStyle: "white", strokeRect: (...args) => calls.push(args) };
        platform.debugDraw(context, 3, 10, "red");
        expect(calls).toEqual([[3, 10, 20, 4]]);
        expect(context.strokeStyle).toBe("white");
    });
});

// ============================================
// PlatformerController Tests
// ============================================
describe('PlatformerController', () => {
    let controller;
    let entity;
    let body;

    beforeEach(() => {
        entity = new Entity("Player");
        body = new Body();
        entity.AddComponent(body);
        controller = new PlatformerController();
        entity.AddComponent(controller);
    });

    it('move changes velocity', () => {
        controller.move(1, 0.1);
        expect(body.velocity.x).toBeGreaterThan(0);
    });

    it('move left changes velocity negative', () => {
        controller.move(-1, 0.1);
        expect(body.velocity.x).toBeLessThan(0);
    });

    it('jump sets buffer timer', () => {
        controller.jump();
        expect(controller.jumpBufferTimer).toBeGreaterThan(0);
    });

    it('update decreases timers', () => {
        controller.jumpBufferTimer = 0.1;
        controller.coyoteTimer = 0.1;
        controller.update(0.05);
        expect(controller.jumpBufferTimer).toBeLessThan(0.1);
    });

    it('coyote time allows late jump', () => {
        body.grounded = true;
        controller.update(0.016); // Set coyote timer
        body.grounded = false;
        controller.jump();
        controller.update(0.016);

        expect(body.velocity.y).toBeLessThan(0); // Jumping
    });
});
