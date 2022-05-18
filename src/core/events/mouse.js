import Vector2 from "../maths/vec2";

/**
 * @class
 * @classdesc A class that represents a Mouse event.
 * 
 * @property {Number} x - The x coordinate of the mouse.
 * @property {Number} y - The y coordinate of the mouse.
 * @property {Number} dx - The change in x coordinate of the mouse.
 * @property {Number} dy - The change in y coordinate of the mouse.
 * @property {Object} BUTTON_CODE - The button code.
 * @property {Number} BUTTON_CODE.LEFT - The left mouse button code.
 * @property {Number} BUTTON_CODE.MIDDLE - The middle mouse button code.
 * @property {Number} BUTTON_CODE.RIGHT - The right mouse button code.
 * 
 * @property {Object} WHEEL_CODE - The wheel code.
 * @property {Number} WHEEL_CODE.UP - The up wheel code.
 * @property {Number} WHEEL_CODE.DOWN - The down wheel code.
 * 
 * 
 * @example
 * // Create a new mouse.
 * let mouse = new Mouse();
 * 
 */
export class Mouse {
    /**
     * @method
     * @description Creates a new Mouse event.
     * @parma {HTMLCanvasElement} canvas - The canvas to listen to.
     * 
     * @example
     * // Create a new mouse.
     * let mouse = new Mouse(this.canvas);
     * 
     */
    constructor(canvas){
        this.canvas;
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.button = 0;
        this.wheel = 0;
        this.pressed = false;
        this.released = false;
        this.clicked = false;
        this.wheelUp = false;
        this.wheelDown = false;
        this.BUTTON_CODE = {
            LEFT: 0,
            MIDDLE: 1,
            RIGHT: 2
        };

        this.WHEEL_CODE = {
            UP: 1,
            DOWN: -1
        };
        this.canvas = canvas;
        this.canvas.addEventListener('thisdown', this.onthisDown.bind(this), false);
        this.canvas.addEventListener('thisup', this.onthisUp.bind(this), false);
        this.canvas.addEventListener('thismove', this.onthisMove.bind(this), false);
        this.canvas.addEventListener('thiswheel', this.onthisWheel.bind(this), false);
        this.canvas.addEventListener('DOMthisScroll', this.onthisWheel.bind(this), false);
    }

    
    onthisDown(event) {
        this.x = event.clientX;
        this.y = event.clientY;
        this.dx = 0;
        this.dy = 0;
        this.button = event.button;
        this.pressed = true;
        this.released = false;
        this.clicked = true;
        this.wheelUp = false;
        this.wheelDown = false;
    }
    onthisUp(event) {
        this.x = event.clientX;
        this.y = event.clientY;
        this.dx = 0;
        this.dy = 0;
        this.button = event.button;
        this.pressed = false;
        this.released = true;
        this.clicked = false;
        this.wheelUp = false;
        this.wheelDown = false;
    }
    onthisMove(event) {
        this.x = event.clientX;
        this.y = event.clientY;
        this.dx = event.movementX;
        this.dy = event.movementY;
    }
    onthisWheel(event) {
        this.x = event.clientX;
        this.y = event.clientY;
        this.dx = 0;
        this.dy = 0;
        this.button = event.button;
        this.wheelUp = event.deltaY < 0;
        this.wheelDown = event.deltaY > 0;

    }

    /**
     * @method
     * @description Clears the mouse event.(Use this after updating the game.)
     * 
     * @example
     * // Clear the mouse event.
     * this.clear();
     * 
     */
    clear() {
        this.released = false;
        this.clicked = false;
        this.wheelUp = false;
        this.wheelDown = false;
    }

    /**
     * @method
     * @description Checks if the left mouse button is pressed.
     * @returns {Boolean} True if the left button mouse is pressed.
     * 
     * @example
     * // Check if the left button is pressed.
     * if(mouse.isLeftButtonPressed()) {
     *      console.log("Left button is pressed.");
     * }
     */
    isLeftButtonPressed() {
        return this.button === 0 && this.pressed;
    }

    /**
     * @method
     * @description  Checks if the middle mouse button is pressed.
     * @returns {Boolean}  True if the left button mouse is pressed.
     * 
     * @example
     * // Check if the middle button is pressed.
     * if(mouse.isMiddleButtonPressed()) {
     *      console.log("Middle button is pressed.");
     * }
     */
    isMiddleButtonPressed() {
        return this.button === 1 && this.pressed;
    }



    /**
     * @method
     * @description Checks if the Right mouse button is pressed.
     * @returns {Boolean} True if the right button mouse is pressed.
     * 
     * @example
     * // Check if the right button is pressed.
     * if(mouse.isRightButtonPressed()) {
     *      console.log("Right button is pressed.");
     * }
     */
    isRightButtonPressed() {
        return this.button === 2 && this.pressed;
    }

    /**
     * @method
     * @description Checks if the Left mouse button is released.
     * @returns {Boolean} True if the left button mouse is released.
     * 
     * @example
     * // Check if the left button is released.
     * if(mouse.isLeftButtonReleased()) {
     *      console.log("Left button is released.");
     * }
     */
    isLeftButtonReleased() {
        return this.button === 0 && this.released;
    }


    /**
     * @method
     * @description Checks if the Middle mouse button is released.
     * @returns {Boolean} True if the middle button mouse is released.
     * 
     * @example
     * // Check if the middle button is released.
     * if(mouse.isMiddleButtonReleased()) {
     *      console.log("Middle button is released.");
     * }
     */
    isMiddleButtonReleased() {
        return this.button === 1 && this.released;
    }

    /**
     * @method
     * @description Checks if the Right mouse button is released.
     * @returns {Boolean} True if the right button mouse is released.
     * 
     * @example
     * // Check if the right button is released.
     * if(mouse.isRightButtonReleased()) {
     *      console.log("Right button is released.");
     * }
     */
    isRightButtonReleased() {
        return this.button === 2 && this.released;
    }

    /**
     * @method
     * @description Checks if the Left mouse button is clicked.
     * @returns {Boolean} True if the left button mouse is clicked.
     * 
     * @example
     * // Check if the left button is clicked.
     * if(mouse.isLeftButtonClicked()) {
     *     console.log("Left button is clicked.");
     * }
     */
    isLeftButtonClicked() {
        return this.button === 0 && this.clicked;
    }

    /**
     * @method
     * @description Checks if the Middle mouse button is clicked.
     * @returns {Boolean} True if the middle button mouse is clicked.
     * 
     * @example
     * // Check if the middle button is clicked.
     * if(mouse.isMiddleButtonClicked()) {
     *    console.log("Middle button is clicked.");
     * }
     */
    isMiddleButtonClicked() {
        return this.button === 1 && this.clicked;
    }


    /**
     * @method
     * @description Checks if the Right mouse button is clicked.
     * @returns {Boolean} True if the right button mouse is clicked.
     * 
     * @example
     * // Check if the right button is clicked.
     * if(mouse.isRightButtonClicked()) {
     *   console.log("Right button is clicked.");
     * }
     * 
     */
    isRightButtonClicked() {
        return this.button === 2 && this.clicked;
    }

    /**
     * @method
     * @description Check if Wheel is Scrolling Up.
     * @returns {Boolean} True if the wheel is scrolling up.
     * 
     * @example
     * // Check if the wheel is scrolling up.
     * if(mouse.isWheelScrollingUp()) {
     *      console.log("Wheel is scrolling up.");
     * }
     */
    isWheelUp() {
        return this.wheelUp;
    }

    /**
     * @method
     * @description Check if Wheel is Scrolling Down.
     * @returns {Boolean} True if the wheel is scrolling down.
     * 
     * @example
     * // Check if the wheel is scrolling down.
     * if(mouse.isWheelScrollingDown()) {
     *     console.log("Wheel is scrolling down.");
     * }
     */
    isWheelDown() {
        return this.wheelDown;
    }

    /**
     * @method
     * @description Returns the Position of the mouse.
     * @returns {Vector2} The position of the mouse.
     * 
     * @example
     * // Get Vector2 of the mouse.
     * var mousePosition = mouse.getMousePos();
     * 
     */
    getMousePos() {
        return new Vector2(this.x, this.y);
    }

    /**
     * @method
     * @description Get the delta Mouse position as a Vector2.
     * @returns {Vector2} The delta position of the mouse.
     * 
     * @example
     * // Get Vector2 of the mouse.
     * var mousePosition = mouse.getMouseDelta();
     */
    getMouseDelta() {
        return new Vector2(this.dx, this.dy);
    }
}