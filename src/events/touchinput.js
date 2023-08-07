import { Vector2 } from "../maths/vec2.js";
/**
 * @class TouchInput
 * @classdesc A class to handle touch input.
 * @static
 * @hideconstructor
 * @example
 * // Check if a touch is currently active
 * TouchInput.IsTouchActive(0);
 * 
 * // Get the position of the first touch
 * TouchInput.GetTouch(0);
 * 
 */
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

    /**
     * Get the number of active touches.
     * @returns {number} The number of active touches.
     */
    static GetTouchCount() {
        return TouchInput.#touches.length;
    }

    /**
     * Get the position of the touch at the given index.
     * @param {number} index The index of the touch to get the position of.
     * @returns {Vector2} The position of the touch at the given index.
     */
    static GetTouch(index) {
        if (index >= 0 && index < TouchInput.#touches.length) {
            const touch = TouchInput.#touches[index];
            return new Vector2(touch.pageX - TouchInput.#canvas.offsetLeft, touch.pageY - TouchInput.#canvas.offsetTop);
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
}
