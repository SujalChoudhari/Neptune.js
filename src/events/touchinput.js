import { Vector2 } from "../maths/vec2.js";

export class TouchInput {
    static #canvas;
    static #touches = [];

    /**@private */
    static init(canvas) {
        TouchInput.#canvas = canvas;
        TouchInput.#touches = [];

        TouchInput.#canvas.addEventListener("touchstart", TouchInput.#touchStart, { passive: true });
        TouchInput.#canvas.addEventListener("touchend", TouchInput.#touchEnd, { passive: true });
        TouchInput.#canvas.addEventListener("touchmove", TouchInput.#touchMove, { passive: true });
    }
    /**@private */
    static #touchStart(event) {
        TouchInput.#touches = event.touches;
        // Handle special keys here if needed
    }
    /**@private */
    static #touchEnd(event) {
        TouchInput.#touches = event.touches;
        // Handle special keys here if needed
    }
    /**@private */
    static #touchMove(event) {
        TouchInput.#touches = event.touches;
        // Handle special keys here if needed
    }
    /**@private */
    static GetTouchCount() {
        return TouchInput.#touches.length;
    }

    static GetTouch(index) {
        if (index >= 0 && index < TouchInput.#touches.length) {
            const touch = TouchInput.#touches[index];
            return new Vector2(touch.pageX - TouchInput.#canvas.offsetLeft, touch.pageY - TouchInput.#canvas.offsetTop);
        }
        return null;
    }

    static IsTouchActive(index) {
        return index >= 0 && index < TouchInput.#touches.length;
    }

    /**@private */
    static clear() {
        TouchInput.#touches = [];
    }
}
