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
export class Input{
    /**
     * @method
     * @param {HTMLCanvasElement} canvas - The canvas element that the input is attached to.
     */
    constructor(canvas){
        this.canvas = canvas;
        
        /**
         * @property {Object} pos - The position of the mouse or touch.
         * @property {number} pos.x - The x position of the mouse or touch.
         * @property {number} pos.y - The y position of the mouse or touch.
         */
        this.pos = {
            x: 0,
            y: 0
        }
        this.pressedButton = null;
        this.isClicked = false;
        this.isDoubleClicked = false;
        this.isMouseDown = false;
        this.touchCount = 0;

        this.keyPressed = [];
        this.specialKeyPressed = null;
        this.wheelDelta = 0;

        /**
         * @method 
         * @description The function to call when the button is clicked.
         * @param {event} event - The event that is passed to the function.
         */
        this.onClick = (event) => {};

        /**
         * @method
         * @description The function to call when the button is double clicked.
         * @param {event} event - The event that is passed to the function.
         * 
         */
        this.onDoubleClick = (event) => {};

        //#region Event Listeners

        //Click
        this.canvas.addEventListener("click", this._Click.bind(this));
        this.canvas.addEventListener("dblclick", this._DoubleClick.bind(this));

        //Mouse
        this.canvas.addEventListener("mousedown", this._MouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this._MouseUp.bind(this));
        this.canvas.addEventListener("mousemove", this._MouseMove.bind(this));
        this.canvas.addEventListener("mouseout", this._MouseUp.bind(this));
        this.canvas.addEventListener("mouseleave", this._MouseUp.bind(this));
        this.canvas.addEventListener("mouseover", this._MouseMove.bind(this));

        //Touch
        this.canvas.addEventListener("touchstart", this._MouseDown.bind(this));
        this.canvas.addEventListener("touchend", this._MouseUp.bind(this));
        this.canvas.addEventListener("touchmove", this._MouseMove.bind(this));

        //Wheel
        this.canvas.addEventListener("wheel", this._Wheel.bind(this));

        // Keyboard
        this.canvas.addEventListener("keydown", this._KeyDown.bind(this));
        this.canvas.addEventListener("keyup", this._KeyUp.bind(this));



        //#endregion
    }


    //#region Private Methods


    _checkSpecialKey(event){
        if(event.shiftKey) return Input.keyCode.SHIFT;
        if(event.ctrlKey) return Input.keyCode.CTRL;
        if(event.altKey) return Input.keyCode.ALT;
        if(event.metaKey) return Input.keyCode.META;
        return null;
    }

    _Click(event){
        this.isClicked = true;
        this.pos.x = event.offsetX;
        this.pos.y = event.offsetY;

        this.pressedButton = event.button;
        this._checkSpecialKey(event);

        this.onClick(event);
    }

    _DoubleClick(event){
        this.isDoubleClicked = true;
        this.pos.x = event.offsetX;
        this.pos.y = event.offsetY;

        this.pressedButton = event.button;
        this._checkSpecialKey(event);

        this.onDoubleClick(event);

    }

    _MouseDown(event){
        this.isMouseDown = true;
        this.pos.x = event.offsetX;
        this.pos.y = event.offsetY;
        this.pressedButton = event.button;

        this.pressedButton = event.button;
        this._checkSpecialKey(event);
        this.touchCount = event.touches.length;

    }

    _MouseUp(event){
        this.isMouseDown = false;
        this.pos.x = event.offsetX;
        this.pos.y = event.offsetY;

        this.pressedButton = event.button;
        this._checkSpecialKey(event);
        this.touchCount = event.touches.length;
    }

    _MouseMove(event){
        this.pos.x = event.offsetX;
        this.pos.y = event.offsetY;

        this.pressedButton = event.button;
        this._checkSpecialKey(event);
        this.touchCount = event.touches.length;
    }

    _Wheel(event){
        this.wheelDelta = event.deltaY;
    }

    _KeyDown(event){
        this.keyPressed[event.key] = true;
        this.specialKeyPressed = this._checkSpecialKey(event);
    }

    _KeyUp(event){
        this.keyPressed[event.key] = false;
        this.specialKeyPressed = null;
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
    leftMouseButtonDown(){
        return this.pressedButton === 0;
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
    rightMouseButtonDown(){
        return this.pressedButton === 2;
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
    middleMouseButtonDown(){
        return this.pressedButton === 1;
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
    leftMouseButtonUp(){
        return this.pressedButton === 0 && !this.isMouseDown;
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
    rightMouseButtonUp(){
        return this.pressedButton === 2 && !this.isMouseDown;
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
    middleMouseButtonUp(){
        return this.pressedButton === 1 && !this.isMouseDown;
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
    isLeftClicked(){
        return this.isClicked && this.pressedButton === 0;
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
    isRightClicked(){
        return this.isClicked && this.pressedButton === 2;
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
    isMiddleClicked(){
        return this.isClicked && this.pressedButton === 1;
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
    isLeftPressed(){
        return this.pressedButton === 0;
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
    isRightPressed(){
        return this.pressedButton === 2;
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
    isMiddlePressed(){
        return this.pressedButton === 1;
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
    isLeftDown(){
        return this.isMouseDown && this.pressedButton === 0;
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
    isRightDown(){
        return this.isMouseDown && this.pressedButton === 2;
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
    isMiddleDown(){
        return this.isMouseDown && this.pressedButton === 1;
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
    leftMouseButtonClicked(){
        return this.pressedButton === 0 && this.isClicked;
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
    rightMouseButtonClicked(){
        return this.pressedButton === 2 && this.isClicked;
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
    middleMouseButtonClicked(){
        return this.pressedButton === 1 && this.isClicked;
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
    leftMouseButtonDoubleClicked(){
        return this.pressedButton === 0 && this.isDoubleClicked;
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
    rightMouseButtonDoubleClicked(){
        return this.pressedButton === 2 && this.isDoubleClicked;
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
    middleMouseButtonDoubleClicked(){
        return this.pressedButton === 1 && this.isDoubleClicked;
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
    getWheelScroll(){
        return this.wheelDelta;
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
    getPosition(){
        return this.pos;
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
    getTouchCount(){
        return this.touchCount;
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
    getSpecialKeyPressed(){
        return this.specialKeyPressed;
    }

    /**
     * @method
     * @description Reset all the input states. Use this after you have processed ALL the input.
     * @since 1.2.2
     */
    clear(){
        this.isClicked = false;
        this.isDoubleClicked = false;
        this.isMouseDown = false;
        this.touchCount = 0;
        this.specialKeyPressed = false;
        this.wheelDelta = 0;
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
    getKeyDown(keyCode){
        return this.keyPressed[keyCode];
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
Input.keyCode =  {
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