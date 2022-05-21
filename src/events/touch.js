import { Vector2 } from "../neptune.js";

/**
 * @class Touch
 * 
 * @description
 * A class that represents a Touch event.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas to listen to.
 * 
 * 
 */
export class Touch {
    constructor(canvas){
        this.canvas;
        this.x = 0;
        this.y = 0;
        this.button = 0;
        this.pressed = false;
        this.released = false;
        this.canvas = canvas;

        this.canvas.addEventListener('touchstart', this.ontouchStart.bind(this), false);
        this.canvas.addEventListener('touchend', this.ontouchEnd.bind(this), false);
        this.canvas.addEventListener('touchmove', this.ontouchMove.bind(this), false);
        this.canvas.addEventListener('touchcancel', this.ontouchCancel.bind(this), false);
    }

    ontouchStart(event) {
        this.x = event.touches[0].clientX;
        this.y = event.touches[0].clientY;
        this.button = event.touches[0].button;
        this.pressed = true;
        this.released = false;

    }

    ontouchEnd(event) {
        this.x = event.changedTouches[0].clientX;
        this.y = event.changedTouches[0].clientY;
        this.button = event.changedTouches[0].button;
        this.pressed = false;
        this.released = true;

    }

    ontouchMove(event) {
        this.x = event.changedTouches[0].clientX;
        this.y = event.changedTouches[0].clientY;
        this.button = event.changedTouches[0].button;
        this.pressed = true;
        this.released = false;

    }

    ontouchCancel(event) {
        this.x = event.changedTouches[0].clientX;
        this.y = event.changedTouches[0].clientY;
        this.button = event.changedTouches[0].button;
        this.pressed = false;
        this.released = true;

    }

    /**
     * @method
     * @description Clears the touch event.(Use this after updating the game.)
     * 
     * @example
     * // Clear the touch event.
     * touch.clear();
     */
    clear() {
        this.x = 0;
        this.y = 0;
        this.button = 0;
        this.wheel = 0;
        this.pressed = false;
        this.released = false;
    }

    /**
     * @method
     * @description Returns the touch position.
     * @returns {Vector2} The touch position.
     * 
     * @example
     * // Get the touch position.
     * let touchPosition = touch.getTouchPosition();
     * 
     */
    getTouchPosition() {
        return new Vector2(this.x, this.y);
    }


    /**
     * @method
     * @description Checks if the screen is touched.
     * @returns {boolean} Whether the screen is touched.
     * 
     * @example
     * // Check if the screen is touched.
     * if(touch.isTouched()) {
     *     // Do something.
     * }
     */
    isTouchPressed() {
        return this.pressed;
    }

    /**
     * @method
     * @description Checks if the screen is released.
     * @returns {boolean} Whether the screen is released.
     * 
     * @example
     * // Check if the screen is released.
     * if(touch.isReleased()) {
     *    // Do something.
     * }
     */
    isTouchReleased() {
        return this.released;
    }

}