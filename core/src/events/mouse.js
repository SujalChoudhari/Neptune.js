/**
 * Mouse Event Handler class
 * =========================
 * @class
 * Handle mouse events with ease.
 * 
 * Properties:
 * -----------
 * @property {Number} x - The x position of the mouse.
 * @property {Number} y - The y position of the mouse.
 * @property {Number} dx - The change in x position of the mouse.
 * @property {Number} dy - The change in y position of the mouse.
 * @property {Number} button - The button index of the mouse.
 * @property {Number} wheel - The wheel index of the mouse.
 * @property {bool} pressed - If the mouse is pressed with current button or wheel. 
 * @property {bool} released - If the mouse is released with current button or wheel.
 * @property {bool} clicked - If the mouse is clicked with current button or wheel.
 * @property {bool} wheelUp - If the mouse wheel is up.
 * @property {bool} wheelDown - If the mouse wheel is down.
 * 
 * @property {Object} BUTTON_CODE - The button code of the mouse.
 * @property {Number} BUTTON_CODE.LEFT - The left button code.
 * @property {Number} BUTTON_CODE.MIDDLE - The middle button code.
 * @property {Number} BUTTON_CODE.RIGHT - The right button code.
 * 
 * @property {Object} WHEEL_CODE - The wheel code of the mouse.
 * @property {Number} WHEEL_CODE.UP - The up wheel code.
 * @property {Number} WHEEL_CODE.DOWN - The down wheel code.
 * 
 * Methods:
 * --------
 * @method onMouseDown - Adds an event to the handler.
 * @method onMouseUp - Adds an event to the handler.
 * @method onMouseMove - Adds an event to the handler.
 * @method onMouseWheel - Adds an event to the handler.
 * @method clear - Clears the handler.
 * @method isLeftButtonPressed - Returns true if the left button is pressed.
 * @method isMiddleButtonPressed - Returns true if the middle button is pressed.
 * @method isRightButtonPressed - Returns true if the right button is pressed.
 * @method isLeftButtonReleased - Returns true if the left button is released.
 * @method isMiddleButtonReleased - Returns true if the middle button is released.
 * @method isRightButtonReleased - Returns true if the right button is released.
 * @method isLeftButtonClicked - Returns true if the left button is clicked.
 * @method isMiddleButtonClicked - Returns true if the middle button is clicked.
 * @method isRightButtonClicked - Returns true if the right button is clicked.
 * @method isWheelUp - Returns true if the mouse wheel is up.
 * @method isWheelDown - Returns true if the mouse wheel is down.
 * @method getMousePos - Returns the mouse position.
 * @method getMouseDelta - Returns the mouse delta.
 * 
 */
export default class Mouse {
    static canvas;
    static x = 0;
    static y = 0;
    static dx = 0;
    static dy = 0;
    static button = 0;
    static wheel = 0;
    static pressed = false;
    static released = false;
    static clicked = false;
    static wheelUp = false;
    static wheelDown = false;

    static BUTTON_CODE = {
        LEFT: 0,
        MIDDLE: 1,
        RIGHT: 2
    };

    static WHEEL_CODE = {
        UP: 1,
        DOWN: -1
    };

    static init(canvas) {
        Mouse.canvas = canvas;
        Mouse.canvas.addEventListener('mousedown', Mouse.onMouseDown.bind(Mouse), false);
        Mouse.canvas.addEventListener('mouseup', Mouse.onMouseUp.bind(Mouse), false);
        Mouse.canvas.addEventListener('mousemove', Mouse.onMouseMove.bind(Mouse), false);
        Mouse.canvas.addEventListener('mousewheel', Mouse.onMouseWheel.bind(Mouse), false);
        Mouse.canvas.addEventListener('DOMMouseScroll', Mouse.onMouseWheel.bind(Mouse), false);
    }


    /**
     * Used by addEventListener.
     */
    static onMouseDown(event) {
        Mouse.x = event.clientX;
        Mouse.y = event.clientY;
        Mouse.dx = 0;
        Mouse.dy = 0;
        Mouse.button = event.button;
        Mouse.pressed = true;
        Mouse.released = false;
        Mouse.clicked = true;
        Mouse.wheelUp = false;
        Mouse.wheelDown = false;
    }

    /**
     * Used by addEventListener.
     */
    static onMouseUp(event) {
        Mouse.x = event.clientX;
        Mouse.y = event.clientY;
        Mouse.dx = 0;
        Mouse.dy = 0;
        Mouse.button = event.button;
        Mouse.pressed = false;
        Mouse.released = true;
        Mouse.clicked = false;
        Mouse.wheelUp = false;
        Mouse.wheelDown = false;
    }

    /**
     * Used by addEventListener.
     */
    static onMouseMove(event) {
        Mouse.x = event.clientX;
        Mouse.y = event.clientY;
        Mouse.dx = event.movementX;
        Mouse.dy = event.movementY;
    }

    /**
     * Used by addEventListener.
     */
    static onMouseWheel(event) {
        Mouse.x = event.clientX;
        Mouse.y = event.clientY;
        Mouse.dx = 0;
        Mouse.dy = 0;
        Mouse.button = event.button;
        Mouse.wheelUp = event.deltaY < 0;
        Mouse.wheelDown = event.deltaY > 0;

    }

    /**
     * Clears the handler. 
     */
    static clear() {
        // Mouse.pressed = false;
        Mouse.released = false;
        Mouse.clicked = false;
        Mouse.wheelUp = false;
        Mouse.wheelDown = false;
    }


    /**
     * Check if the Left button is pressed.
     * @returns {bool} - Returns true if the left button is pressed.
     */
    static isLeftButtonPressed() {
        return Mouse.button === 0 && Mouse.pressed;
    }

    /**
     * Check if the Middle button is pressed.
     * @returns {bool} - Returns true if the middle button is pressed.
     */
    static isMiddleButtonPressed() {
        return Mouse.button === 1 && Mouse.pressed;
    }

    /**
     * Check if the Right button is pressed.
     * @returns {bool} - Returns true if the right button is pressed.
     */
    static isRightButtonPressed() {
        return Mouse.button === 2 && Mouse.pressed;
    }


    /**
     * Check if the Left button is released.
     * @returns {bool} - Returns true if the left button is released.
     */
    static isLeftButtonReleased() {
        return Mouse.button === 0 && Mouse.released;
    }

    /**
     * Check if the Middle button is released.
     * @returns {bool} - Returns true if the middle button is released.
     */
    static isMiddleButtonReleased() {
        return Mouse.button === 1 && Mouse.released;
    }

    /**
     * Check if the Right button is released.
     * @returns {bool} - Returns true if the right button is released.
     */
    static isRightButtonReleased() {
        return Mouse.button === 2 && Mouse.released;
    }

    /**
     * Check if the Left button is clicked.
     * @returns {bool} - Returns true if the left button is clicked.
     */
    static isLeftButtonClicked() {
        return Mouse.button === 0 && Mouse.clicked;
    }

    /**
     * Check if the Middle button is clicked.
     * @returns {bool} - Returns true if the left button is clicked.
     */
    static isMiddleButtonClicked() {
        return Mouse.button === 1 && Mouse.clicked;
    }

    /**
     * Check if the Right button is clicked.
     * @returns {bool} - Returns true if the left button is clicked.
     */
    static isRightButtonClicked() {
        return Mouse.button === 2 && Mouse.clicked;
    }

    /**
     * Check if the mouse wheel is up.
     * @returns {bool} - Returns true if the mouse wheel is up.
     */
    static isWheelUp() {
        return Mouse.wheelUp;
    }

    /**
     * Check if the mouse wheel is down.
     * @returns {bool} - Returns true if the mouse wheel is up.
     */
    static isWheelDown() {
        return Mouse.wheelDown;
    }

    /**
     * Get the mouse position.
     * @returns {Vector2} - Returns the mouse position.
     */
    static getMousePos() {
        return new Vector2(Mouse.x, Mouse.y);
    }


    /**
     * Get the mouse position delta.
     * @returns {Vector2} - Returns the mouse position delta.
     */
    static getMouseDelta() {
        return new Vector2(Mouse.dx, Mouse.dy);
    }
}