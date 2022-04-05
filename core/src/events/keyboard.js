/**
 * Keyboard event class
 * =====================
 * @class
 * Handle keyboard events with ease.
 * 
 * Properties:
 * -----------
 * @property {Object} pressedKeys - An array of pressed keys.
 * @property {Object} releasedKeys - An array of released keys.
 * @property {Object} KEY_CODE - An object containing all the key codes.
 * 
 * Methods:
 * --------
 * @method keyDown - Used by addEventListner, Adds a key to the pressed keys array.
 * @method keyUp - Used by addEventListner, Adds a key to the released keys array.
 * @method clear - Clears the pressed and released keys arrays.
 * @method isKeyPressed - Returns true if the key is pressed.
 * @method isKeyReleased - Returns true if the key is released.
 * @method isKeyDown - Returns true if the key is down.
 * @method isKeyUp - Returns true if the key is up.
 */
export default class Keyboard {
    /**
     * @constructor
     * @param {} canvas - The canvas to listen to.
     */
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
     * @param {Event} e - The event object.
     */
    keyDown(e) {
        this.pressedKeys[e.which] = true;
    }

    /**
     * @param {Event} e - The event object.
     */
    keyUp(e) {
        this.releasedKeys[e.which] = true;
    }


    /**
     * Clears the pressed and released keys arrays.
     */
    clear() {
        this.pressedKeys = {};
        this.releasedKeys = {};
    }

    /**
     * Checks if a key is pressed.
     * @param {Number} keyCode - The key code.
     * @returns {Boolean} - Returns true if the key is pressed.
     */
    isKeyPressed(keyCode) {
        return this.pressedKeys[keyCode];
    }

    /**
     * Checks if a key is released.
     * @param {Number} keyCode - The key code.
     * @returns {Boolean} - Returns true if the key is released.
     */
    isKeyReleased(keyCode) {
        return this.releasedKeys[keyCode];
    }


    /**
     * Checks if a key is down.
     * @param {Number} keyCode - The key code.
     * @returns {Boolean} - Returns true if the key is down.
     * 
     */
    isKeyDown(keyCode) {
        return this.pressedKeys[keyCode] && !this.releasedKeys[keyCode];
    }

    /**
     * Checks if a key is up.
     * @param {Number} keyCode - The key code.
     * @returns {Boolean} - Returns true if the key is up.
     */
    isKeyUp(keyCode) {
        return !this.pressedKeys[keyCode] && this.releasedKeys[keyCode];
    }
}