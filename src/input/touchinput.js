import { Vector2 } from "../math/vec2.js";

/**
 * @class TouchInput
 * @classdesc A class to handle touch input including multi-touch and touch cancellation.
 * @static
 * @hideconstructor
 */
export class TouchInput {
    static #canvas;
    static #touches = [];

    /**@private */
    static init(canvas) {
        if (TouchInput.#canvas) {
            TouchInput.dispose();
        }
        TouchInput.#canvas = canvas;
        TouchInput.#touches = [];

        TouchInput.#canvas.addEventListener("touchstart", TouchInput.#touchStart, { passive: true });
        TouchInput.#canvas.addEventListener("touchend", TouchInput.#touchEnd, { passive: true });
        TouchInput.#canvas.addEventListener("touchmove", TouchInput.#touchMove, { passive: true });
        TouchInput.#canvas.addEventListener("touchcancel", TouchInput.#touchCancel, { passive: true });
    }

    /**@private */
    static #touchStart(event) {
        TouchInput.#touches = event.touches ? [...event.touches] : [];
    }
    /**@private */
    static #touchEnd(event) {
        TouchInput.#touches = event.touches ? [...event.touches] : [];
    }
    /**@private */
    static #touchMove(event) {
        TouchInput.#touches = event.touches ? [...event.touches] : [];
    }
    /**@private */
    static #touchCancel(event) {
        TouchInput.#touches = event.touches ? [...event.touches] : [];
    }

    /**
     * Get the number of active touches.
     * @returns {number} The number of active touches.
     */
    static GetTouchCount() {
        return TouchInput.#touches.length;
    }

    /**
     * Get the position of the touch at the given index in canvas coordinates.
     * @param {number} index The index of the touch.
     * @returns {Vector2|null} The position of the touch.
     */
    static GetTouch(index) {
        if (index >= 0 && index < TouchInput.#touches.length) {
            const touch = TouchInput.#touches[index];
            const rect = TouchInput.#canvas?.getBoundingClientRect?.() ?? { left: 0, top: 0 };
            return new Vector2(touch.clientX - rect.left, touch.clientY - rect.top);
        }
        return null;
    }

    /**
     * Check if a touch is currently active.
     * @param {number} index The index of the touch to check.
     * @returns {boolean} True if the touch at the given index is active.
     */
    static IsTouchActive(index) {
        return index >= 0 && index < TouchInput.#touches.length;
    }

    /**@private */
    static clear() {
        TouchInput.#touches = [];
    }

    /** Clean up listeners on canvas teardown */
    static dispose() {
        if (TouchInput.#canvas) {
            TouchInput.#canvas.removeEventListener("touchstart", TouchInput.#touchStart);
            TouchInput.#canvas.removeEventListener("touchend", TouchInput.#touchEnd);
            TouchInput.#canvas.removeEventListener("touchmove", TouchInput.#touchMove);
            TouchInput.#canvas.removeEventListener("touchcancel", TouchInput.#touchCancel);
            TouchInput.#canvas = null;
        }
        TouchInput.#touches = [];
    }
}
