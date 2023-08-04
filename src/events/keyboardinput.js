export class KeyboardInput {
    static #canvas;
    static #keyPressed = [];
    static #specialKeyPressed;

    static Init(canvas) {
        KeyboardInput.#canvas = canvas;
        KeyboardInput.#keyPressed = [];
        KeyboardInput.#specialKeyPressed = null;

        KeyboardInput.#canvas.addEventListener("keydown", KeyboardInput.#KeyDown);
        KeyboardInput.#canvas.addEventListener("keyup", KeyboardInput.#KeyUp);
    }

    static #checkSpecialKey(event) {
        if (event.shiftKey) KeyboardInput.#specialKeyPressed = KeyboardInput.keyCode.SHIFT;
        else if (event.ctrlKey) KeyboardInput.#specialKeyPressed = KeyboardInput.keyCode.CTRL;
        else if (event.altKey) KeyboardInput.#specialKeyPressed = KeyboardInput.keyCode.ALT;
        else if (event.metaKey) KeyboardInput.#specialKeyPressed = KeyboardInput.keyCode.META;
        else KeyboardInput.#specialKeyPressed = null;
    }

    static #KeyDown(event) {
        if (!KeyboardInput.#keyPressed[event.keyCode]) {
            KeyboardInput.#checkSpecialKey(event);
            KeyboardInput.#keyPressed[event.keyCode] = true;
        }
    }

    static #KeyUp(event) {
        KeyboardInput.#checkSpecialKey(event);
        KeyboardInput.#keyPressed[event.keyCode] = false;
    }

    static isKeyDown(keyCode) {
        if (KeyboardInput.#keyPressed[keyCode] === undefined) return false;
        return KeyboardInput.#keyPressed[keyCode];
    }

    static getSpecialKeyPressed() {
        return KeyboardInput.#specialKeyPressed;
    }

    static Clear() {
        KeyboardInput.#specialKeyPressed = null;
    }
}


KeyboardInput.keyCode = {
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
