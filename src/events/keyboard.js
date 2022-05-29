/**
 * @class Keyboard
 * @classdesc A class that handles keyboard input.
 * 
 * @property {Object} pressedKeys - The currently pressed keys.
 * @property {Object} releasedKeys - The keys that have been released since the last update.
 * @property {HTMLCanvasElement} canvas - The canvas element.
 * @property {Object} KEY_CODE - The key codes.
 * 
 * @example
 * // Create a new Keyboard object.
 * let keyboard = new Keyboard();
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Keyboard {
    constructor(canvas) {
        this.pressedKeys = {};
        this.releasedKeys = {};
        this.canvas = canvas;
        this.canvas.addEventListener("keydown", this.keyDown.bind(this));
        this.canvas.addEventListener("keyup", this.keyUp.bind(this));

        this.KEY_CODE = {
            NUM_ONE: 49,
            NUM_TWO: 50,
            NUM_THREE: 51,
            NUM_FOUR: 52,
            NUM_FIVE: 53,
            NUM_SIX: 54,
            NUM_SEVEN: 55,
            NUM_EIGHT: 56,
            NUM_NINE: 57,
            NUM_ZERO: 48,
            A: 65,
            B: 66,
            C: 67,
            D: 68,
            E: 69,
            F: 70,
            G: 71,
            H: 72,
            I: 73,
            J: 74,
            K: 75,
            L: 76,
            M: 77,
            N: 78,
            O: 79,
            P: 80,
            Q: 81,
            R: 82,
            S: 83,
            T: 84,
            U: 85,
            V: 86,
            W: 87,
            X: 88,
            Y: 89,
            Z: 90,
            LEFT_ARROW: 37,
            UP_ARROW: 38,
            RIGHT_ARROW: 39,
            DOWN_ARROW: 40,
            SPACE: 32,
            SHIFT: 16,
            CTRL: 17,
            ALT: 18,
            TAB: 9,
            ENTER: 13,
            ESC: 27,
            BACKSPACE: 8,
            DELETE: 46,

            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            F9: 120,
            F10: 121,
            F11: 122,
            F12: 123,

            NUM_LOCK: 144,
            SCROLL_LOCK: 145,
            SEMI_COLON: 186,
            EQUAL_SIGN: 187,
            COMMA: 188,
            DASH: 189,
            PERIOD: 190,
            FORWARD_SLASH: 191,
            GRAVE_ACCENT: 192,
            OPEN_BRACKET: 219,
            BACK_SLASH: 220,
            CLOSE_BRACKET: 221,
            SINGLE_QUOTE: 222
        };
    }

    /**
     * @event
     */
    keyDown(e) {
        this.pressedKeys[e.which] = true;
    }

    /**
     * @event
     */
    keyUp(e) {
        this.releasedKeys[e.which] = true;
    }

    /**
     * @method
     * @description Clear the keys that have been released since the last update. (Use this after updating the game.)
     * @returns {void}
     * 
     * @example
     * // Update the game.
     * // After updating the game, clear the released keys.
     * keyboard.clear();
     */
    clear() {
        this.pressedKeys = {};
        this.releasedKeys = {};
    }

    /**
     * @method
     * 
     * @description Checks if the specified key is currently pressed.
     * @param {Number} keyCode - The Keycode of the key to check.
     * @returns {Boolean} Whether the key is currently pressed or not.
     * 
     * @example
     * // Check if the space bar is currently pressed.
     * if (keyboard.isKeyPressed(keyboard.KEY_CODE.SPACE)) {
     *    // Do something.
     * }
     */
    isKeyPressed(keyCode) {
        return this.pressedKeys[keyCode];
    }


    /**
     * @method
     * @description Checks if the specified key is currently released.
     * @param {Number} keyCode - The Keycode of the key to check.
     * @returns {Boolean} Whether the key is currently released or not.
     * 
     * @example
     * // Check if the space bar is currently released.
     * if (keyboard.isKeyReleased(keyboard.KEY_CODE.SPACE)) {
     *   // Do something.
     * }
     */
    isKeyReleased(keyCode) {
        return this.releasedKeys[keyCode];
    }

    /**
     * @method
     * @description Checks if the specified key is currently down.
     * @param {Number} keyCode - The Keycode of the key to check.
     * @returns {Boolean} Whether the key is currently down or not.
     * 
     * @example
     * // Check if the space bar is currently down.
     * if (keyboard.isKeyDown(keyboard.KEY_CODE.SPACE)) {
     *  // Do something.
     * }
     */
    isKeyDown(keyCode) {
        return this.pressedKeys[keyCode] && !this.releasedKeys[keyCode];
    }


    /**
     * @method
     * @description Checks if the specified key is currently up.
     * @param {Number} keyCode - The Keycode of the key to check.
     * @returns {Boolean} Whether the key is currently up or not.
     * 
     * @example
     * // Check if the space bar is currently up.
     * if (keyboard.isKeyUp(keyboard.KEY_CODE.SPACE)) {
     * // Do something.
     * }
     */
    isKeyUp(keyCode) {
        return !this.pressedKeys[keyCode] && this.releasedKeys[keyCode];
    }
}