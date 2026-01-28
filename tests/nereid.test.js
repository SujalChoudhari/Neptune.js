import { describe, it, expect, beforeEach } from "./tester.js";
import { Body, Collider, PlatformerController } from "../src/nereid/index.js";
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
