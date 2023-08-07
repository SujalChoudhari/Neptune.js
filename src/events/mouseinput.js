import { Vector2 } from "../maths/vec2.js";

/**
 * @class MouseInput
 * @classdesc A class to handle mouse input.
 * @static
 * @hideconstructor
 */
export class MouseInput {
    static #canvas;
    static #pos = new Vector2();
    static #pressedButton;
    static #isClicked;
    static #isMouseDown;

    /**
     * Check if a button is currently up.
     * @param {MouseInput.BUTTON} button - The button to check. Use MouseInput.buttons enum.
     * @returns {boolean} True if the specified button is up.
     */
    static IsButtonUp(button) {
        return MouseInput.#pressedButton === button && !MouseInput.#isMouseDown;
    }

    /**
     * Check if a button is currently down.
     * @param {MouseInput.BUTTON} button - The button to check. Use MouseInput.buttons enum.
     * @returns {boolean} True if the specified button is down.
     */
    static IsButtonDown(button) {
        return MouseInput.#pressedButton === button && MouseInput.#isMouseDown;
    }

    /**
     * Check if a button was clicked.
     * @param {MouseInput.BUTTON} button - The button to check. Use MouseInput.buttons enum.
     * @returns {boolean} True if the specified button was clicked.
     */
    static IsClicked(button) {
        return MouseInput.#isClicked && MouseInput.#pressedButton === button;
    }

    /**
     * Get the current mouse position.
     * @returns {Vector2} The current mouse position.
     */
    static GetPosition() {
        return MouseInput.#pos.Copy();
    }

    /**@private */
    static init(canvas) {
        /**
         * Initialize the MouseInput class with a canvas element.
         * @private
         * @param {HTMLCanvasElement} canvas - The canvas element to track mouse input on.
         */
        MouseInput.#canvas = canvas;
        MouseInput.#pos = new Vector2();
        MouseInput.#pressedButton = null;
        MouseInput.#isClicked = false;
        MouseInput.#isMouseDown = false;

        MouseInput.#canvas.addEventListener("click", MouseInput.#click);
        MouseInput.#canvas.addEventListener("dblclick", MouseInput.#doubleClick);
        MouseInput.#canvas.addEventListener("contextmenu", MouseInput.#rightClick);
        MouseInput.#canvas.addEventListener("mousedown", MouseInput.#mouseDown);
        MouseInput.#canvas.addEventListener("mouseup", MouseInput.#mouseUp);
        MouseInput.#canvas.addEventListener("mousemove", MouseInput.#mouseMove);
    }

    /**@private */
    static #click(event, button) {
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = button;
    }

    /**@private */
    static #doubleClick(event, button) {
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = button;
    }

    /**@private */
    static #rightClick(event) {
        event.preventDefault(); // Prevent the default context menu from showing up
        MouseInput.#click(event, MouseInput.buttons.RIGHT);
    }

    /**@private */
    static #mouseDown(event, button) {
        MouseInput.#isMouseDown = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = button;
    }

    /**@private */
    static #mouseUp(event) {
        MouseInput.#isMouseDown = false;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = -1;
    }

    /**@private */
    static #mouseMove(event) {
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
    }

    /**
     * Clear the mouse input states.
     * @private
     */
    static clear() {
        MouseInput.#isClicked = false;
        MouseInput.#isMouseDown = false;
        MouseInput.#pressedButton = -1;
    }
}

/**
 * Enum for mouse buttons.
 * @readonly
 * @enum {number}
 * @memberof MouseInput
 * @property {number} LEFT - Left mouse button.
 */
MouseInput.BUTTON = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
};


