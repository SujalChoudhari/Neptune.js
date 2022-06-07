/**
 * @class Input
 * @classdesc The Input class is capable of handling keyboard, mouse and touch inputs.
 * 
 * @property {HTMLCanvasElement} canvas - The canvas element that the input is attached to.
 * @property {Object} pos - The position of the mouse or touch.
 * @property {number} pos.x - The x position of the mouse or touch.
 * @property {number} pos.y - The y position of the mouse or touch.
 * 
 * @property {Number} pressedButton - The button that is currently pressed.
 * @property {Boolean} isClicked - Returns true if the button is clicked.
 * @property {Boolean} isDoubleClicked - Returns true if the button is double clicked.
 * @property {Boolean} isMouseDown - Returns true if the mouse button is down.
 * @property {Number} touchCount - Returns the number of touches.
 * @property {Number} keyPressed - The key that is currently pressed. (UNICODE)
 * @property {Number} specialKeyPressed - The special key that is currently pressed.
 * @property {Number} wheelDelta - The amount of wheel movement.
 * 
 * @property {Function(event)} onClick - The function to call when the button is clicked.
 * @property {Function(event)} onDoubleClick - The function to call when the button is double clicked.
 * 
 * @since 1.2.2
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 * 
 */
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

    /**
     * @method 
     * @description The function to call when the button is clicked.
     * @param {event} event - The event that is passed to the function.
     */
    static onClick;

    /**
     * @method
     * @description The function to call when the button is double clicked.
     * @param {event} event - The event that is passed to the function.
     * 
     */
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

        /**
         * @method 
         * @description The function to call when the button is clicked.
         * @param {event} event - The event that is passed to the function.
         */
        Input.onClick = (event) => { };

        /**
         * @method
         * @description The function to call when the button is double clicked.
         * @param {event} event - The event that is passed to the function.
         * 
         */
        Input.onDoubleClick = (event) => { };

        //#region Event Listeners

        //Click
        Input.canvas.addEventListener("click", Input._Click.bind(this));
        Input.canvas.addEventListener("dblclick", Input._DoubleClick.bind(this));

        //Mouse
        Input.canvas.addEventListener("mousedown", Input._MouseDown.bind(this));
        Input.canvas.addEventListener("mouseup", Input._MouseUp.bind(this));
        Input.canvas.addEventListener("mousemove", Input._MouseMove.bind(this));
        Input.canvas.addEventListener("mouseout", Input._MouseUp.bind(this));
        Input.canvas.addEventListener("mouseleave", Input._MouseUp.bind(this));
        Input.canvas.addEventListener("mouseover", Input._MouseMove.bind(this));

        //Touch
        Input.canvas.addEventListener("touchstart", Input._TouchStart.bind(this));
        Input.canvas.addEventListener("touchend", Input._TouchEnd.bind(this));
        Input.canvas.addEventListener("touchmove", Input._TouchMove.bind(this));

        //Wheel
        Input.canvas.addEventListener("wheel", Input._Wheel.bind(this));

        // Keyboard
        Input.canvas.addEventListener("keydown", Input._KeyDown.bind(this));
        Input.canvas.addEventListener("keyup", Input._KeyUp.bind(this));



        //#endregion
    }


    //#region Private Methods


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
        // Input.touchCount = event.touches.length;
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


    //#endregion

    //#region Public Methods

    /**
     * @method
     * @description Check if left mouse button is clicked.
     * @returns {Boolean} Returns true if the left mouse button is clicked.
     * 
     * @example
     * if(input.isLeftClicked()){
     *     //Do something
     * }
     * 
     * @since 1.2.2
     */
    static leftMouseButtonDown() {
        return Input.pressedButton === 0;
    }


    /**
     * @method
     * @description Check if right mouse button is clicked.
     * @returns {Boolean} Returns true if the right mouse button is clicked.
     * 
     * @example
     * if(input.isRightClicked()){
     *    //Do something
     * }
     * 
     * @since 1.2.2
     * 
     */
    static rightMouseButtonDown() {
        return Input.pressedButton === 2;
    }

    /**
     * @method
     * @description Check if middle mouse button is clicked.
     * @returns {Boolean} Returns true if the middle mouse button is clicked.
     * 
     * @example
     * if(input.isMiddleClicked()){
     *   //Do something
     * }
     * 
     * @since 1.2.2
     */
    static middleMouseButtonDown() {
        return Input.pressedButton === 1;
    }


    /**
     * @method
     * @description Check if left mouse button is clicked.
     * @returns {Boolean} Returns true if the left mouse button is clicked.
     * 
     * @example
     * if(input.isLeftClicked()){
     *    //Do something
     * }
     * 
     * @since 1.2.2
     */
    static leftMouseButtonUp() {
        return Input.pressedButton === 0 && !Input.isMouseDown;
    }

    /**
     * @method
     * @description Check if right mouse button is clicked.
     * @returns {Boolean} Returns true if the right mouse button is clicked.
     * 
     * @example
     * if(input.isRightClicked()){
     *   //Do something
     * }
     * 
     * @since 1.2.2
     */
    static rightMouseButtonUp() {
        return Input.pressedButton === 2 && !Input.isMouseDown;
    }

    /**
     * @method
     * @description Check if middle mouse button is clicked.
     * @returns {Boolean} Returns true if the middle mouse button is clicked.
     * 
     * @example
     * if(input.isMiddleClicked()){
     *  //Do something
     * }
     * 
     * @since 1.2.2
     */
    static middleMouseButtonUp() {
        return Input.pressedButton === 1 && !Input.isMouseDown;
    }

    /**
     * @method
     * @description Check if left mouse button is clicked.
     * @returns {Boolean} Returns true if the left mouse button is clicked.
     * 
     * @example
     * if(input.isLeftClicked()){
     *    //Do something
     * }
     * 
     * @since 1.2.2
     */
    static isLeftClicked() {
        return Input.isClicked && Input.pressedButton === 0;
    }

    /**
     * @method
     * @description Check if right mouse button is clicked.
     * @returns {Boolean} Returns true if the right mouse button is clicked.
     * 
     * @example
     * if(input.isRightClicked()){
     *   //Do something
     * }
     * 
     * @since 1.2.2
     */
    static isRightClicked() {
        return Input.isClicked && Input.pressedButton === 2;
    }

    /**
     * @method
     * @description Check if middle mouse button is clicked.
     * @returns {Boolean} Returns true if the middle mouse button is clicked.
     * 
     * @example
     * if(input.isMiddleClicked()){
     *  //Do something
     * }
     * 
     * @since 1.2.2
     */
    static isMiddleClicked() {
        return Input.isClicked && Input.pressedButton === 1;
    }

    /**
     * @method
     * @description Check if left mouse button is pressed.
     * @returns {Boolean} Returns true if the left mouse button is pressed.
     * 
     * @example
     * if(input.isLeftPressed()){
     *    //Do something
     * }
     * 
     * @since 1.2.2
     */
    static isLeftPressed() {
        return Input.pressedButton === 0;
    }

    /**
     * @method
     * @description Check if right mouse button is pressed.
     * @returns {Boolean} Returns true if the right mouse button is pressed.
     * 
     * @example
     * if(input.isRightPressed()){
     *   //Do something
     * }
     * 
     * @since 1.2.2
     */
    static isRightPressed() {
        return Input.pressedButton === 2;
    }

    /**
     * @method
     * @description Check if middle mouse button is pressed.
     * @returns {Boolean} Returns true if the middle mouse button is pressed.
     * 
     * @example
     * if(input.isMiddlePressed()){
     *  //Do something
     * }
     * 
     * @since 1.2.2
     */
    static isMiddlePressed() {
        return Input.pressedButton === 1;
    }

    /**
     * @method
     * @description Check if left mouse button is down.
     * @returns {Boolean} Returns true if the left mouse button is down.
     *  
     * @example
     * if(input.isLeftDown()){
     *   //Do something
     * }
     * 
     * @since 1.2.2
     * 
     */
    static isLeftDown() {
        return Input.isMouseDown && Input.pressedButton === 0;
    }

    /**
     * @method
     * @description Check if right mouse button is down.
     * @returns {Boolean} Returns true if the right mouse button is down.
     * 
     * @example
     * if(input.isRightDown()){
     *  //Do something
     * }
     * 
     * @since 1.2.2
     */
    static isRightDown() {
        return Input.isMouseDown && Input.pressedButton === 2;
    }

    /**
     * @method
     * @description Check if middle mouse button is down.
     * @returns {Boolean} Returns true if the middle mouse button is down.
     * 
     * @example
     * if(input.isMiddleDown()){
     * //Do something
     * }
     *  @since 1.2.2
     */
    static isMiddleDown() {
        return Input.isMouseDown && Input.pressedButton === 1;
    }


    /**
     * @method
     * @description Check if left mouse button is clicked.
     * @returns {Boolean} Returns true if the left mouse button is clicked.
     * 
     * @example
     * if(input.leftMouseButtonClicked()){
     *  //Do something
     * }
     * 
     */
    static leftMouseButtonClicked() {
        return Input.pressedButton === 0 && Input.isClicked;
    }


    /**
     * @method
     * @description Check if right mouse button is clicked.
     * @returns {Boolean} Returns true if the right mouse button is clicked.
     * 
     * @example
     * if(input.rightMouseButtonClicked()){
     * //Do something
     * }
     * 
     */
    static rightMouseButtonClicked() {
        return Input.pressedButton === 2 && Input.isClicked;
    }


    /**
     * @method
     * @description Check if middle mouse button is clicked.
     * @returns {Boolean} Returns true if the middle mouse button is clicked.
     *  
     * @example
     * if(input.middleMouseButtonClicked()){
     * //Do something
     * }
     * 
     * @since 1.2.2
     */
    static middleMouseButtonClicked() {
        return Input.pressedButton === 1 && Input.isClicked;
    }


    /**
     * @method
     * @description Check if left mouse button is double clicked.
     * @returns {Boolean} Returns true if the left mouse button is double clicked.
     * 
     * @example
     * if(input.leftMouseButtonDoubleClicked()){
     * //Do something
     * }
     * @since 1.2.2
     */
    static leftMouseButtonDoubleClicked() {
        return Input.pressedButton === 0 && Input.isDoubleClicked;
    }

    /**
     * @method
     * @description Check if right mouse button is double clicked.
     * @returns {Boolean} Returns true if the right mouse button is double clicked.
     * @example
     * if(input.rightMouseButtonDoubleClicked()){
     * //Do something
     * }
     * @since 1.2.2
     */
    static rightMouseButtonDoubleClicked() {
        return Input.pressedButton === 2 && Input.isDoubleClicked;
    }

    /**
     * @method
     * @description Check if middle mouse button is double clicked.
     * @returns {Boolean} Returns true if the middle mouse button is double clicked.
     * @example
     * if(input.middleMouseButtonDoubleClicked()){
     * //Do something
     * }
     * @since 1.2.2
     */
    static middleMouseButtonDoubleClicked() {
        return Input.pressedButton === 1 && Input.isDoubleClicked;
    }

    /**
     * @method
     * @description Get Wheel Scroll in pixels.
     * @returns {Number} Returns the wheel scroll in pixels.
     * 
     * @example
     * if(input.getWheelScroll() > 0){
     * //Do something
     * }
     * @since 1.2.2
     */
    static getWheelScroll() {
        return Input.wheelDelta;
    }

    /**
     * @method
     * @description Get the position of the mouse.
     * @returns {Object} Returns the position of the mouse.
     * 
     * @example
     * if(input.getPosition().x > 0){
     * //Do something
     * }
     * @since 1.2.2
     */
    static getPosition() {
        return Input.pos;
    }

    /**
     * @method
     * @description Get the touch count
     * @returns {Number} Returns the touch count.
     * 
     * @example
     * if(input.getTouchCount() > 0){
     * //Do something
     * }
     * 
     * @since 1.2.2
     */
    static getTouchCount() {
        return Input.touchCount;
    }

    /**
     * @method
     * @description Check if special keys are pressed (ALT, CTRL, SHIFT,META).
     * @returns {Number} Returns the special key pressed.
     * 
     * @example
     * if(input.isKeyPressed(input.KEY_ALT)){
     * //Do something
     * }
     * @since 1.2.2
     */
    static getSpecialKeyPressed() {
        return Input.specialKeyPressed;
    }

    /**
     * @method
     * @description Reset all the input states. Use this after you have processed ALL the input.
     * @since 1.2.2
     */
    static clear() {
        Input.isClicked = false;
        Input.isDoubleClicked = false;
        Input.isMouseDown = false;
        Input.touches = 0;
        Input.keyPressed = [];
        Input.specialKeyPressed = false;
        Input.wheelDelta = 0;
    }

    /**
     * @method
     * @description Check if a key is pressed.
     * @param {Number} keyCode The key code of the key to check.
     * @returns {Boolean} Returns true if the key is pressed.
     * 
     * @example
     * if(input.isKeyPressed(input.KEY_A)){
     * //Do something
     * }
     * @since 1.2.2
     */
    static getKeyDown(keyCode) {
        return Input.keyPressed[keyCode];
    }
    //#endregion

}

/**
 * @constant
 * @description The button ids for the mouse.
 * @since 1.2.2
 */
Input.buttons = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};

/**
 * @constant
 * @description The key codes for the keyboard.
 * @since 1.2.2
 */
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