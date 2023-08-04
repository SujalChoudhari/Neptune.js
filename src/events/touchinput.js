import { Vector2 } from "../maths/vec2.js";

export class TouchInput {
    static #canvas;
    static #touches = [];

    static Init(canvas) {
        TouchInput.#canvas = canvas;
        TouchInput.#touches = [];

        TouchInput.#canvas.addEventListener("touchstart", TouchInput.#TouchStart);
        TouchInput.#canvas.addEventListener("touchend", TouchInput.#TouchEnd);
        TouchInput.#canvas.addEventListener("touchmove", TouchInput.#TouchMove);
    }

    static #TouchStart(event) {
        TouchInput.#touches = event.touches;
        // Handle special keys here if needed
    }

    static #TouchEnd(event) {
        TouchInput.#touches = event.touches;
        // Handle special keys here if needed
    }

    static #TouchMove(event) {
        TouchInput.#touches = event.touches;
        // Handle special keys here if needed
    }

    static getTouchCount() {
        return TouchInput.#touches.length;
    }

    static getTouch(index) {
        if (index >= 0 && index < TouchInput.#touches.length) {
            const touch = TouchInput.#touches[index];
            return new Vector2(touch.pageX - TouchInput.#canvas.offsetLeft, touch.pageY - TouchInput.#canvas.offsetTop);
        }
        return null;
    }

    static isTouchActive(index) {
        return index >= 0 && index < TouchInput.#touches.length;
    }

    static Clear() {
        TouchInput.#touches = [];
    }
}
