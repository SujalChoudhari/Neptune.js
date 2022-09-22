import { Vector2 } from "./vec2.js";

export class Maths {
    static PI = Math.PI;
    static EXP = Math.E;
    static DEG_TO_RAD = Math.PI / 180;
    static RAD_TO_DEG = 180 / Math.PI;
    static METER_TO_PIXEL = 10;
    static PIXEL_TO_METER = 1 / 10;
    static VERY_SMALL_NUMBER = 0.0001;
    static VERY_LARGE_NUMBER = 1_000_000;

    static lenght(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    static lenghtSq(vector){
        return vector.x * vector.x + vector.y * vector.y;
    }

    static distance(vector1, vector2) {
        return Maths.lenght(vector2.copy().subtract(vector1));
    }
    
    static distanceSq(vector1, vector2) {
        return Maths.lenghtSq(vector2.copy().subtract(vector1));
    }

    static normalize(vector) {
        let lenght = Maths.lenght(vector);
        if (lenght != 0) return new Vector2(vector.x / lenght, vector.y / lenght);
        else return new Vector2(0, 0);

    }

    static perpendicular(vector) {
        return new Vector2(-vector.y, vector.x);
    }

    static dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    static cross(vector1, vector2) {
        return vector1.x * vector2.y - vector1.y * vector2.x;
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }

    static randomVector2(min, max) {
        return new Vector2(Math.random() * (max - min) + min, Math.random() * (max - min) + min);
    }

    static pixelToMeter(pixel) { // 10 pixel = 1 meter
        return pixel * this.PIXEL_TO_METER;
    }

    static meterToPixel(meter) { // 1 meter = 10 pixel
        return meter * this.METER_TO_PIXEL
    }

    static pixelToMeterVector2(vector) {
        return new Vector2(vector.x * Maths.PIXEL_TO_METER, vector.y * Maths.PIXEL_TO_METER);
    }

    static meterToPixelVector2(vector) {
        return new Vector2(vector.x * Maths.METER_TO_PIXEL, vector.y * Maths.METER_TO_PIXEL);
    }


    static nearlyEqual(a,b) {
        if (typeof a == typeof b) {
            return Math.abs(a - b) < Maths.VERY_SMALL_NUMBER;
        } else if (a instanceof Vector2 && b instanceof Vector2) {
            return Maths.nearlyEqual(a.x, b.x) && Maths.nearlyEqual(a.y, b.y);
        } else {
            throw new Error("nearlyEqual: a and b must be number or vector2");
        }
    }
}