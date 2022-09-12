import { Vector2 } from "./vec2.js";

export class Math {
    static lenght(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    static distance(vector1, vector2) {
        return this.lenght(vector1 - vector2);
    }

    static normalize(vector) {
        let lenght = this.lenght(vector);
        return new Vector2(vector.x / lenght, vector.y / lenght);
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
}