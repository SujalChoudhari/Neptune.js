import { Vector2 } from "./vec2.js";

export class Maths {
    static lenght(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    static distance(vector1, vector2) {
        return Maths.lenght(vector2.copy().subtract(vector1));
    }

    static normalize(vector) {
        let lenght = Maths.lenght(vector);
        if (lenght != 0) return new Vector2(vector.x / lenght, vector.y / lenght);
        else return new Vector2(0, 0);

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
        return pixel / 10;
    }

    static meterToPixel(meter) { // 1 meter = 10 pixel
        return meter * 10;
    }

    static pixelToMeterVector2(vector) {
        return new Vector2(Maths.pixelToMeter(vector.x), Maths.pixelToMeter(vector.y));
    }

    static meterToPixelVector2(vector) {
        return new Vector2(Maths.meterToPixel(vector.x), Maths.meterToPixel(vector.y));
    }

    static perpendicular(vector) {
        return new Vector2(-vector.y, vector.x);
    }
}