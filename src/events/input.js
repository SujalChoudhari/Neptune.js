
export class Input {
    static canvas;
    static pos = {
        x: 0,
        y: 0
    };
    static pressedButton;
    static isClicked;
    static isDoubleClicked;
    static isMouseDown;
    static touches = [];
    static keyPressed = [];
    static specialKeyPressed;
    static wheelDelta;
    static onClick;
    static onDoubleClick;

    static init(canvas) {
        Input.canvas = canvas;
        Input.pos = {
            x: 0,
            y: 0
        }
        Input.pressedButton = null;
        Input.isClicked = false;
        Input.isDoubleClicked = false;
        Input.isMouseDown = false;
        Input.touches = [];

        Input.keyPressed = [];
        Input.specialKeyPressed = null;
        Input.wheelDelta = 0;
        Input.onClick = (event) => { };
        Input.onDoubleClick = (event) => { };

        Input.canvas.addEventListener("click", Input._Click.bind(this));
        Input.canvas.addEventListener("dblclick", Input._DoubleClick.bind(this));
        Input.canvas.addEventListener("mousedown", Input._MouseDown.bind(this));
        Input.canvas.addEventListener("mouseup", Input._MouseUp.bind(this));
        Input.canvas.addEventListener("mousemove", Input._MouseMove.bind(this));
        Input.canvas.addEventListener("mouseout", Input._MouseUp.bind(this));
        Input.canvas.addEventListener("mouseleave", Input._MouseUp.bind(this));
        Input.canvas.addEventListener("mouseover", Input._MouseMove.bind(this));
        Input.canvas.addEventListener("touchstart", Input._TouchStart.bind(this));
        Input.canvas.addEventListener("touchend", Input._TouchEnd.bind(this));
        Input.canvas.addEventListener("touchmove", Input._TouchMove.bind(this));
        Input.canvas.addEventListener("wheel", Input._Wheel.bind(this));
        Input.canvas.addEventListener("keydown", Input._KeyDown.bind(this));
        Input.canvas.addEventListener("keyup", Input._KeyUp.bind(this));
    }


    static _checkSpecialKey(event) {
        if (event.shiftKey) Input.specialKeyPressed = Input.keyCode.SHIFT;
        if (event.ctrlKey) Input.specialKeyPressed = Input.keyCode.CTRL;
        if (event.altKey) Input.specialKeyPressed = Input.keyCode.ALT;
        if (event.metaKey) Input.specialKeyPressed = Input.keyCode.META;
        else Input.specialKeyPressed = null;
    }

    static _Click(event) {
        Input.isClicked = true;
        Input.pos.x = event.offsetX;
        Input.pos.y = event.offsetY;

        Input.pressedButton = event.button;
        Input._checkSpecialKey(event);

        Input.onClick(event);
    }

    static _DoubleClick(event) {
        Input.isDoubleClicked = true;
        Input.pos.x = event.offsetX;
        Input.pos.y = event.offsetY;

        Input.pressedButton = event.button;
        Input._checkSpecialKey(event);

        Input.onDoubleClick(event);

    }

    static _MouseDown(event) {
        Input.isMouseDown = true;
        Input.pos.x = event.offsetX;
        Input.pos.y = event.offsetY;
        Input.pressedButton = event.button;

        Input.pressedButton = event.button;
        Input._checkSpecialKey(event);

    }

    static _MouseUp(event) {
        Input.isMouseDown = false;
        Input.pos.x = event.offsetX;
        Input.pos.y = event.offsetY;

        Input.pressedButton = event.button;
        Input._checkSpecialKey(event);
    }

    static _MouseMove(event) {
        Input.pos.x = event.offsetX;
        Input.pos.y = event.offsetY;

        Input.pressedButton = event.button;
        Input._checkSpecialKey(event);
    }

    static _TouchStart(event) {
        Input.touches = event.touches;
        Input.pos.x = Math.round(event.changedTouches[0].pageX);
        Input.pos.y = Math.round(event.changedTouches[0].pageY);
        Input._checkSpecialKey(event);
    }

    static _TouchEnd(event) {
        Input.touches = event.touches;
        Input.pos.x = Math.round(event.changedTouches[0].pageX);
        Input.pos.y = Math.round(event.changedTouches[0].pageY);
        Input._checkSpecialKey(event);

    }

    static _TouchMove(event) {
        Input.touches = event.touches;
        Input.pos.x = Math.round(event.changedTouches[0].pageX);
        Input.pos.y = Math.round(event.changedTouches[0].pageY);
        Input._checkSpecialKey(event);
    }

    static _Wheel(event) {
        Input.wheelDelta = event.deltaY;
    }

    static _KeyDown(event) {
        Input.keyPressed[event.key] = true;
        Input._checkSpecialKey(event);
    }

    static _KeyUp(event) {
        Input.keyPressed[event.key] = false;
        Input.specialKeyPressed = null;
    }

    static leftMouseButtonDown() {
        return Input.pressedButton === 0;
    }
    static rightMouseButtonDown() {
        return Input.pressedButton === 2;
    }
    static middleMouseButtonDown() {
        return Input.pressedButton === 1;
    }
    static leftMouseButtonUp() {
        return Input.pressedButton === 0 && !Input.isMouseDown;
    }
    static rightMouseButtonUp() {
        return Input.pressedButton === 2 && !Input.isMouseDown;
    }
    static middleMouseButtonUp() {
        return Input.pressedButton === 1 && !Input.isMouseDown;
    }
    static isLeftClicked() {
        return Input.isClicked && Input.pressedButton === 0;
    }
    static isRightClicked() {
        return Input.isClicked && Input.pressedButton === 2;
    }
    static isMiddleClicked() {
        return Input.isClicked && Input.pressedButton === 1;
    }
    static isLeftPressed() {
        return Input.pressedButton === 0;
    }
    static isRightPressed() {
        return Input.pressedButton === 2;
    }
    static isMiddlePressed() {
        return Input.pressedButton === 1;
    }
    static isLeftDown() {
        return Input.isMouseDown && Input.pressedButton === 0;
    }
    static isRightDown() {
        return Input.isMouseDown && Input.pressedButton === 2;
    }
    static isMiddleDown() {
        return Input.isMouseDown && Input.pressedButton === 1;
    }
    static leftMouseButtonClicked() {
        return Input.pressedButton === 0 && Input.isClicked;
    }
    static rightMouseButtonClicked() {
        return Input.pressedButton === 2 && Input.isClicked;
    }
    static middleMouseButtonClicked() {
        return Input.pressedButton === 1 && Input.isClicked;
    }
    static leftMouseButtonDoubleClicked() {
        return Input.pressedButton === 0 && Input.isDoubleClicked;
    }
    static rightMouseButtonDoubleClicked() {
        return Input.pressedButton === 2 && Input.isDoubleClicked;
    }
    static middleMouseButtonDoubleClicked() {
        return Input.pressedButton === 1 && Input.isDoubleClicked;
    }
    static getWheelScroll() {
        return Input.wheelDelta;
    }
    static getPosition() {
        return Input.pos;
    }
    static getTouchCount() {
        return Input.touchCount;
    }
    static getSpecialKeyPressed() {
        return Input.specialKeyPressed;
    }
    static clear() {
        Input.isClicked = false;
        Input.isDoubleClicked = false;
        Input.isMouseDown = false;
        Input.touches = 0;
        Input.keyPressed = [];
        Input.specialKeyPressed = false;
        Input.wheelDelta = 0;
    }
    static getKeyDown(keyCode) {
        return Input.keyPressed[keyCode];
    }

}
Input.buttons = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};
Input.keyCode = {
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