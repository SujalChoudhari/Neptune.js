import { Vector2 } from "./vec2.js";

/**
 * A Math class containing useful math functions. 
 * This class contains all the Mathamatical functions used by the engine.
 * This class is static and should not be instantiated.
 * @class Maths
 */
export class Maths {
    static #INITIAL_METER_TO_PIXEL_CONVERSION_FACTOR = 20;
    static #METER_TO_PIXEL_CONVERSION_FACTOR = Maths.#INITIAL_METER_TO_PIXEL_CONVERSION_FACTOR;

    /**
     * The Value of PI. Same as Math.PI
     * @type {number}
     * @readonly
     */
    static get PI() { return Math.PI; }

    /**
     * The value of e. Same as Math.E
     * @type {number}
     * @readonly
     */
    static get EXP() { return Math.E; }

    /**
     * Constant to multiply by to convert from degrees to radians.
     * @type {number}
     * @readonly
     */
    static get DEG_TO_RAD() { return Math.PI / 180; }

    /**
     * Constant to multiply by to convert from radians to degrees.
     * @type {number}
     * @readonly
     */
    static get RAD_TO_DEG() { return 180 / Math.PI; }

    /**
     * Constatnt to multiply by to convert Meter to Pixel.
     * @type {number}
     * @readonly
     */
    static get METER_TO_PIXEL() { return Maths.#METER_TO_PIXEL_CONVERSION_FACTOR; }

    /**
     * Constant to multiply by to convert from Pixel to Meter.
     * @type {number}
     * @readonly
     */
    static get PIXEL_TO_METER() { return 1 / Maths.#METER_TO_PIXEL_CONVERSION_FACTOR; }

    /**
     * Very small number.
     * This number is in meters. It is used in physics for aproximate equality.
     * @type {number}
     * @readonly
     * 
     */
    static get VERY_SMALL_NUMBER() { return 0.01; }

    /**
     * Very large number.
     * This number is in meters. It is used in physics for aproximate equality.
     * @type {number}
     * @readonly
     */
    static get VERY_LARGE_NUMBER() { return 1_000_000; }

    /**
     * Find the lenght of a vector.
     * @param {Vector2} vector 
     * @returns {number}
     */
    static Lenght(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    /**
     * Find the lenght of a vector squared.
     * Finding Square root is expensive. To compare lenghts, it is better to compare the square of the lenghts.
     * @param {Vector2} vector
     * @returns {number}
     */
    static LenghtSq(vector) {
        return vector.x * vector.x + vector.y * vector.y;
    }

    /**
     * Find the distance between two points.
     * @param {Vector2} vector1
     * @param {Vector2} vector2
     * @returns {number}
     * 
     */
    static Distance(vector1, vector2) {
        return Maths.Lenght(vector2.Copy().Subtract(vector1));
    }

    /**
     * Find the distance between two points squared.
     * Finding Square root is expensive. To compare distances, it is better to compare the square of the distances.
     * @param {Vector2} vector1
     * @param {Vector2} vector2
     * @returns {number}
     */
    static DistanceSq(vector1, vector2) {
        return Maths.LenghtSq(vector2.Copy().Subtract(vector1));
    }

    /**
     * Normalize a vector. A normalized vector has a lenght of 1, but the same direction as the original vector.
     * @param {Vector2} vector
     * @returns {Vector2}
     */
    static Normalize(vector) {
        let lenght = Maths.Lenght(vector);
        if (lenght != 0) return new Vector2(vector.x / lenght, vector.y / lenght);
        else return new Vector2(0, 0);

    }

    /**
     * Find perpendicular vector. The perpendicular vector is 90 degrees to the original vector.
     * @param {Vector2} vector
     * @returns {Vector2}
     * 
     */
    static Perpendicular(vector) {
        return new Vector2(-vector.y, vector.x);
    }

    /**
     * Find the dot product of two vectors. The dot product is the sum of the products of the corresponding components of the two vectors. It is the lenght projection of one vector onto the other.
     * @param {Vector2} vector1
     * @param {Vector2} vector2
     * @returns {number}
     */
    static Dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    /**
     * Find the cross product of two vectors. The cross product is the determinant of the two vectors. It is the lenght projection of one vector onto the perpendicular of the other.
     * @param {Vector2} vector1
     * @param {Vector2} vector2
     * @returns {number}
     */
    static Cross(vector1, vector2) {
        return vector1.x * vector2.y - vector1.y * vector2.x;
    }

    /**
     * Clamp a number between a min and max value.
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static Clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }

    /**
     * Get a random Vector2 between min and max.
     * @param {Vector2} min - The minimum value of the random vector.
     * @param {Vector2} max - The maximum value of the random vector.
     * @returns {Vector2} - A random vector between min and max.
     * 
     */
    static RandomVector2(min, max) {
        return new Vector2(Math.random() * (max - min) + min, Math.random() * (max - min) + min);
    }

    /**
     * Convert Pixel to Meter.
     * @param {number} pixel
     * @returns {number}
     */
    static PixelToMeter(pixel) { // 10 pixel = 1 meter
        return pixel * this.PIXEL_TO_METER;
    }

    /**
     * Convert Meter to Pixel.
     * @param {number} meter
     * @returns {number}
     */
    static MeterToPixel(meter) { // 1 meter = 10 pixel
        return meter * this.METER_TO_PIXEL
    }

    /**
     * Convert Vector2 from Pixel to Meter.
     * @param {Vector2} pixel
     * @returns {Vector2}
     */
    static PixelToMeterVector2(vector) {
        return new Vector2(vector.x * Maths.PIXEL_TO_METER, vector.y * Maths.PIXEL_TO_METER);
    }

    /**
     * Convert Vector2 from Meter to Pixel.
     * @param {Vector2} meter
     * @returns {Vector2}
     */
    static MeterToPixelVector2(vector) {
        return new Vector2(vector.x * Maths.METER_TO_PIXEL, vector.y * Maths.METER_TO_PIXEL);
    }

    /**
     * Find if two numbers /Vectors are approximately equal.
     * @param {number} a - can be a number or a Vector2.
     * @param {number} b - can be a number or a Vector2.
     * @returns {boolean}
     */
    static NearlyEqual(a, b) {
        if (typeof a == typeof b) {
            return Math.abs(a - b) < Maths.VERY_SMALL_NUMBER;
        } else if (a instanceof Vector2 && b instanceof Vector2) {
            return Maths.NearlyEqual(a.x, b.x) && Maths.NearlyEqual(a.y, b.y);
        } else {
            throw new Error("nearlyEqual: a and b must be number or vector2");
        }
    }


    static generateMeterToPixelConversionFactor(originalCanvasWidth, originalCanvasHeight, newWidth, newHeight) {
        //assuming aspect ratio is same
        let widthRatio = newWidth / originalCanvasWidth;
        let heightRatio = newHeight / originalCanvasHeight;
        let ratio = widthRatio < heightRatio ? widthRatio : heightRatio;
        Maths.#METER_TO_PIXEL_CONVERSION_FACTOR = Maths.#INITIAL_METER_TO_PIXEL_CONVERSION_FACTOR * ratio;

    }
}