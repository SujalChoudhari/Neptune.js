import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Vector2, Maths } from "../src/neptune.js";

describe('Vector2', () => {
    let v1;
    let v2;

    beforeEach(() => {
        v1 = new Vector2(3, 4);
        v2 = new Vector2(1, 2);
    });

    afterEach(() => {
        v1 = null;
        v2 = null;
    });

    // Constructor tests
    it('creates a vector with correct x and y values', () => {
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(4);
    });

    // Static factory methods
    it('Vector2.Zero() creates a zero vector', () => {
        const zero = Vector2.Zero();
        expect(zero.x).toBe(0);
        expect(zero.y).toBe(0);
    });

    it('Vector2.One() creates a vector with 1,1', () => {
        const one = Vector2.One();
        expect(one.x).toBe(1);
        expect(one.y).toBe(1);
    });

    // Add tests
    it('Add with Vector2 adds correctly', () => {
        v1.Add(v2);
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
    });

    it('Add with scalar adds to both components', () => {
        v1.Add(5);
        expect(v1.x).toBe(8);
        expect(v1.y).toBe(9);
    });

    it('Add returns the same vector (chainable)', () => {
        const result = v1.Add(v2);
        expect(result).toBe(v1);
    });

    // Subtract tests
    it('Subtract with Vector2 subtracts correctly', () => {
        v1.Subtract(v2);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(2);
    });

    it('Subtract with scalar subtracts from both components', () => {
        v1.Subtract(1);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(3);
    });

    // Multiply tests
    it('Multiply with Vector2 multiplies correctly', () => {
        v1.Multiply(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(8);
    });

    it('Multiply with scalar multiplies both components', () => {
        v1.Multiply(2);
        expect(v1.x).toBe(6);
        expect(v1.y).toBe(8);
    });

    // Divide tests
    it('Divide with Vector2 divides correctly', () => {
        const v = new Vector2(10, 20);
        v.Divide(new Vector2(2, 4));
        expect(v.x).toBe(5);
        expect(v.y).toBe(5);
    });

    it('Divide with scalar divides both components', () => {
        const v = new Vector2(10, 20);
        v.Divide(2);
        expect(v.x).toBe(5);
        expect(v.y).toBe(10);
    });

    // Negetive tests
    it('Negetive negates the vector', () => {
        v1.Negetive();
        expect(v1.x).toBe(-3);
        expect(v1.y).toBe(-4);
    });

    it('Negetive handles zero values', () => {
        const v = new Vector2(0, 5);
        v.Negetive();
        expect(v.x).toBe(0);
        expect(v.y).toBe(-5);
    });

    // Copy tests
    it('Copy creates an independent copy', () => {
        const copy = v1.Copy();
        expect(copy.x).toBe(v1.x);
        expect(copy.y).toBe(v1.y);
        copy.x = 100;
        expect(v1.x).toBe(3); // Original unchanged
    });

    // Magnitude tests
    it('Magnitude returns correct length', () => {
        // 3-4-5 triangle
        expect(v1.Magnitude()).toBe(5);
    });

    it('Magnitude of zero vector is zero', () => {
        const zero = Vector2.Zero();
        expect(zero.Magnitude()).toBe(0);
    });

    // Normalize tests
    it('Normalize creates unit vector', () => {
        v1.Normalize();
        expect(v1.Magnitude()).toBeCloseTo(1, 5);
    });

    it('Normalize preserves direction', () => {
        const originalX = v1.x;
        const originalY = v1.y;
        v1.Normalize();
        // Ratio should be same
        expect(v1.x / v1.y).toBeCloseTo(originalX / originalY, 5);
    });

    it('Normalize handles zero vector gracefully', () => {
        const zero = Vector2.Zero();
        zero.Normalize();
        expect(zero.x).toBe(0);
        expect(zero.y).toBe(0);
    });

    // IsSafe tests
    it('IsSafe returns true for valid vectors', () => {
        expect(Vector2.IsSafe(v1)).toBe(true);
    });

    it('IsSafe returns false for NaN values', () => {
        const badVector = new Vector2(NaN, 5);
        expect(Vector2.IsSafe(badVector)).toBe(false);
    });

    it('IsSafe returns false for null values', () => {
        const badVector = { x: null, y: 5 };
        expect(Vector2.IsSafe(badVector)).toBe(false);
    });

    it('IsSafe returns false for undefined values', () => {
        const badVector = { x: undefined, y: 5 };
        expect(Vector2.IsSafe(badVector)).toBe(false);
    });
});

describe('Maths', () => {
    // Constants
    it('PI equals Math.PI', () => {
        expect(Maths.PI).toBe(Math.PI);
    });

    it('EXP equals Math.E', () => {
        expect(Maths.EXP).toBe(Math.E);
    });

    it('DEG_TO_RAD conversion is correct', () => {
        expect(180 * Maths.DEG_TO_RAD).toBeCloseTo(Math.PI, 10);
    });

    it('RAD_TO_DEG conversion is correct', () => {
        expect(Math.PI * Maths.RAD_TO_DEG).toBeCloseTo(180, 10);
    });

    // Length functions
    it('Lenght calculates correct magnitude', () => {
        const v = new Vector2(3, 4);
        expect(Maths.Lenght(v)).toBe(5);
    });

    it('LenghtSq calculates correct squared magnitude', () => {
        const v = new Vector2(3, 4);
        expect(Maths.LenghtSq(v)).toBe(25);
    });

    // Distance functions
    it('Distance calculates correct distance between points', () => {
        const v1 = new Vector2(0, 0);
        const v2 = new Vector2(3, 4);
        expect(Maths.Distance(v1, v2)).toBe(5);
    });

    it('DistanceSq calculates correct squared distance', () => {
        const v1 = new Vector2(0, 0);
        const v2 = new Vector2(3, 4);
        expect(Maths.DistanceSq(v1, v2)).toBe(25);
    });

    // Normalize
    it('Normalize returns unit vector', () => {
        const v = new Vector2(3, 4);
        const normalized = Maths.Normalize(v);
        expect(Maths.Lenght(normalized)).toBeCloseTo(1, 10);
    });

    it('Normalize handles zero vector', () => {
        const zero = Vector2.Zero();
        const normalized = Maths.Normalize(zero);
        expect(normalized.x).toBe(0);
        expect(normalized.y).toBe(0);
    });

    // Perpendicular
    it('Perpendicular returns 90-degree rotated vector', () => {
        const v = new Vector2(1, 0);
        const perp = Maths.Perpendicular(v);
        expect(perp.x).toBe(0);
        expect(perp.y).toBe(1);
    });

    // Dot product
    it('Dot product calculates correctly', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(3, 4);
        expect(Maths.Dot(v1, v2)).toBe(11); // 1*3 + 2*4
    });

    it('Dot product of perpendicular vectors is zero', () => {
        const v1 = new Vector2(1, 0);
        const v2 = new Vector2(0, 1);
        expect(Maths.Dot(v1, v2)).toBe(0);
    });

    // Cross product
    it('Cross product calculates correctly', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(3, 4);
        expect(Maths.Cross(v1, v2)).toBe(-2); // 1*4 - 2*3
    });

    // Clamp
    it('Clamp returns value when within range', () => {
        expect(Maths.Clamp(5, 0, 10)).toBe(5);
    });

    it('Clamp returns min when value is below', () => {
        expect(Maths.Clamp(-5, 0, 10)).toBe(0);
    });

    it('Clamp returns max when value is above', () => {
        expect(Maths.Clamp(15, 0, 10)).toBe(10);
    });

    // RandomVector2
    it('RandomVector2 returns values within range', () => {
        const random = Maths.RandomVector2(0, 10);
        expect(random.x).toBeGreaterThanOrEqual(0);
        expect(random.x).toBeLessThanOrEqual(10);
        expect(random.y).toBeGreaterThanOrEqual(0);
        expect(random.y).toBeLessThanOrEqual(10);
    });

    // Unit conversions
    it('PixelToMeter and MeterToPixel are inverses', () => {
        const meter = 5;
        const pixel = Maths.MeterToPixel(meter);
        const backToMeter = Maths.PixelToMeter(pixel);
        expect(backToMeter).toBeCloseTo(meter, 10);
    });

    it('PixelToMeterVector2 converts correctly', () => {
        const pixelVec = new Vector2(40, 60);
        const meterVec = Maths.PixelToMeterVector2(pixelVec);
        expect(meterVec.x).toBe(pixelVec.x * Maths.PIXEL_TO_METER);
        expect(meterVec.y).toBe(pixelVec.y * Maths.PIXEL_TO_METER);
    });

    it('MeterToPixelVector2 converts correctly', () => {
        const meterVec = new Vector2(2, 3);
        const pixelVec = Maths.MeterToPixelVector2(meterVec);
        expect(pixelVec.x).toBe(meterVec.x * Maths.METER_TO_PIXEL);
        expect(pixelVec.y).toBe(meterVec.y * Maths.METER_TO_PIXEL);
    });

    // NearlyEqual
    it('NearlyEqual returns true for very close numbers', () => {
        expect(Maths.NearlyEqual(1.0, 1.001)).toBe(true);
    });

    it('NearlyEqual returns false for different numbers', () => {
        expect(Maths.NearlyEqual(1.0, 2.0)).toBe(false);
    });

    it('NearlyEqual works with Vector2', () => {
        const v1 = new Vector2(1.0, 2.0);
        const v2 = new Vector2(1.005, 2.005);
        expect(Maths.NearlyEqual(v1, v2)).toBe(true);
    });

    it('NearlyEqual throws for mismatched types', () => {
        expect(() => Maths.NearlyEqual(1, "string")).toThrow();
    });

    // Constants
    it('VERY_SMALL_NUMBER is a small positive number', () => {
        expect(Maths.VERY_SMALL_NUMBER).toBeGreaterThan(0);
        expect(Maths.VERY_SMALL_NUMBER).toBeLessThan(1);
    });

    it('VERY_LARGE_NUMBER is a large number', () => {
        expect(Maths.VERY_LARGE_NUMBER).toBeGreaterThan(100000);
    });
});
