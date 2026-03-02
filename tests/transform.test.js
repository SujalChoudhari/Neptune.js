import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Transform, Vector2 } from "../src/neptune.js";

describe('Transform', () => {
    let transform;

    beforeEach(() => {
        transform = new Transform();
    });

    afterEach(() => {
        transform = null;
    });

    // Constructor tests
    it('creates transform with default position at zero', () => {
        expect(transform.position.x).toBe(0);
        expect(transform.position.y).toBe(0);
    });

    it('creates transform with default rotation at zero', () => {
        expect(transform.rotation).toBe(0);
    });

    it('creates transform with default scale at one', () => {
        expect(transform.scale.x).toBe(1);
        expect(transform.scale.y).toBe(1);
    });

    it('creates transform with custom position', () => {
        const t = new Transform(new Vector2(10, 20));
        expect(t.position.x).toBe(10);
        expect(t.position.y).toBe(20);
    });

    it('creates transform with custom rotation', () => {
        const t = new Transform(Vector2.Zero(), Math.PI);
        expect(t.rotation).toBe(Math.PI);
    });

    it('creates transform with custom scale', () => {
        const t = new Transform(Vector2.Zero(), 0, new Vector2(2, 3));
        expect(t.scale.x).toBe(2);
        expect(t.scale.y).toBe(3);
    });

    // Position getter returns live reference
    it('position getter returns a live vector reference', () => {
        const pos = transform.position;
        pos.x = 999;
        expect(transform.position.x).toBe(999);
    });

    // Position setter
    it('position setter updates position', () => {
        transform.position = new Vector2(5, 10);
        expect(transform.position.x).toBe(5);
        expect(transform.position.y).toBe(10);
    });

    // Rotation getter/setter
    it('rotation getter returns current rotation', () => {
        transform.rotation = 1.5;
        expect(transform.rotation).toBe(1.5);
    });

    // Scale getter returns live reference
    it('scale getter returns a live vector reference', () => {
        const scale = transform.scale;
        scale.x = 999;
        expect(transform.scale.x).toBe(999);
    });

    // Scale setter
    it('scale setter updates scale', () => {
        transform.scale = new Vector2(3, 4);
        expect(transform.scale.x).toBe(3);
        expect(transform.scale.y).toBe(4);
    });

    // GetForward tests
    it('GetForward returns correct forward vector at rotation 0', () => {
        transform.rotation = 0;
        const forward = transform.GetForward();
        expect(forward.x).toBeCloseTo(1, 10);
        expect(forward.y).toBeCloseTo(0, 10);
    });

    it('GetForward returns correct forward vector at rotation PI/2', () => {
        transform.rotation = Math.PI / 2;
        const forward = transform.GetForward();
        expect(forward.x).toBeCloseTo(0, 10);
        expect(forward.y).toBeCloseTo(1, 10);
    });

    it('GetForward returns correct forward vector at rotation PI', () => {
        transform.rotation = Math.PI;
        const forward = transform.GetForward();
        expect(forward.x).toBeCloseTo(-1, 10);
        expect(forward.y).toBeCloseTo(0, 10);
    });

    // Translate tests
    it('Translate moves position by given vector', () => {
        transform.position = new Vector2(5, 5);
        transform.Translate(new Vector2(3, 2));
        expect(transform.position.x).toBe(8);
        expect(transform.position.y).toBe(7);
    });

    it('Translate with negative values', () => {
        transform.position = new Vector2(10, 10);
        transform.Translate(new Vector2(-3, -5));
        expect(transform.position.x).toBe(7);
        expect(transform.position.y).toBe(5);
    });

    // Rotate tests
    it('Rotate adds to current rotation', () => {
        transform.rotation = 1;
        transform.Rotate(0.5);
        expect(transform.rotation).toBe(1.5);
    });

    it('Rotate with negative angle', () => {
        transform.rotation = 1;
        transform.Rotate(-0.3);
        expect(transform.rotation).toBeCloseTo(0.7, 10);
    });

    // Scale method tests
    it('Scale multiplies current scale', () => {
        transform.scale = new Vector2(2, 3);
        transform.Scale(new Vector2(2, 2));
        expect(transform.scale.x).toBe(4);
        expect(transform.scale.y).toBe(6);
    });

    it('Scale with fractional values', () => {
        transform.scale = new Vector2(4, 8);
        transform.Scale(new Vector2(0.5, 0.25));
        expect(transform.scale.x).toBe(2);
        expect(transform.scale.y).toBe(2);
    });
});
