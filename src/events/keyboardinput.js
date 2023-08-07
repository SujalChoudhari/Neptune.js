/**
 * @class KeyboardInput
 * @classdesc KeyboardInput class to handle keyboard input
 * @static
 * @hideconstructor
 * @example
 * // Check if the key with the keycode 65 (A) is pressed
 * KeyboardInput.IsKeyDown(KeyBoardInput.KEY_CODE.A);
 * 
 */
export class KeyboardInput {
    static #canvas;
    static #keyPressed = [];
    static #specialKeyPressed;

    /**
     * Checks if the key with the given keycode is pressed.
     * @param {KeyboardInput.KEY_CODE} keyCode The keycode of the key to check.
     * @returns {boolean} True if the key with the given keycode is pressed.
     * @method
     * @example
     */
    static IsKeyDown(keyCode) {
        if (KeyboardInput.#keyPressed[keyCode] === undefined) return false;
        return KeyboardInput.#keyPressed[keyCode];
    }

    /**
     * Returns the keycode of the special key pressed.
     * @returns {number} The keycode of the special key pressed.
     */
    static GetSpecialKeyPressed() {
        return KeyboardInput.#specialKeyPressed;
    }

    /**@private */
    static init(canvas) {
        KeyboardInput.#canvas = canvas;
        KeyboardInput.#keyPressed = [];
        KeyboardInput.#specialKeyPressed = null;

        KeyboardInput.#canvas.addEventListener("keydown", KeyboardInput.#keyDown);
        KeyboardInput.#canvas.addEventListener("keyup", KeyboardInput.#keyUp);
    }
    /**@private */
    static #checkSpecialKey(event) {
        if (event.shiftKey) KeyboardInput.#specialKeyPressed = KeyboardInput.KEY_CODE.SHIFT;
        else if (event.ctrlKey) KeyboardInput.#specialKeyPressed = KeyboardInput.KEY_CODE.CTRL;
        else if (event.altKey) KeyboardInput.#specialKeyPressed = KeyboardInput.KEY_CODE.ALT;
        else if (event.metaKey) KeyboardInput.#specialKeyPressed = KeyboardInput.KEY_CODE.META;
        else KeyboardInput.#specialKeyPressed = null;
    }
    /**@private */
    static #keyDown(event) {
        if (!KeyboardInput.#keyPressed[event.keyCode]) {
            KeyboardInput.#checkSpecialKey(event);
            KeyboardInput.#keyPressed[event.keyCode] = true;
        }
    }

    /**@private */
    static #keyUp(event) {
        KeyboardInput.#checkSpecialKey(event);
        KeyboardInput.#keyPressed[event.keyCode] = false;
    }

    /**@private */
    static clear() {
        KeyboardInput.#specialKeyPressed = null;
    }
}


KeyboardInput.KEY_CODE = {
    NUMONE: 49,
    NUMTWO: 50,
    NUMTHREE: 51,
    NUMFOUR: 52,
    NUMFIVE: 53,
    NUMSIX: 54,
    NUMSEVEN: 55,
    NUMEIGHT: 56,
    NUMNINE: 57,
    NUMZERO: 48,
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
    LEFTARROW: 37,
    UPARROW: 38,
    RIGHTARROW: 39,
    DOWNARROW: 40,
    SPACE: 32,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    META: 19,
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

    NUMLOCK: 144,
    SCROLLLOCK: 145,
    SEMICOLON: 186,
    EQUALSIGN: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARDSLASH: 191,
    GRAVEACCENT: 192,
    OPENBRACKET: 219,
    BACKSLASH: 220,
    CLOSEBRACKET: 221,
    SINGLEQUOTE: 222
};
