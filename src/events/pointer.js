import {Vector2} from "../maths/vec2.js";

/**
 * @class
 * @classdesc A class that represents a Pointer event.
 * Poniter class is used to detect mouse and touch events on the canvas.
 * 
 * @property {Number} x - The x coordinate of the pointer.
 * @property {Number} y - The y coordinate of the pointer.
 * @property {Number} dx - The change in x coordinate of the pointer.
 * @property {Number} dy - The change in y coordinate of the pointer.
 * @property {Object} BUTTON_CODE - The button code.
 * @property {Number} BUTTON_CODE.LEFT - The left pointer button code.
 * @property {Number} BUTTON_CODE.MIDDLE - The middle pointer button code.
 * @property {Number} BUTTON_CODE.RIGHT - The right pointer button code.
 * 
 * @property {Object} WHEEL_CODE - The wheel code.
 * @property {Number} WHEEL_CODE.UP - The up wheel code.
 * @property {Number} WHEEL_CODE.DOWN - The down wheel code.
 * 
 * 
 * @example
 * // Create a new pointer.
 * let pointer = new Pointer();
 * 
 * 
 * @since 1.2.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Pointer {
    /**
     * @method
     * @description Creates a new Pointer event.
     * @parma {HTMLCanvasElement} canvas - The canvas to listen to.
     * 
     * @example
     * // Create a new pointer.
     * let pointer = new Pointer(this.canvas);
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


        this.canvas.addEventListener('touchstart', this.ontouchStart.bind(this), false);
        this.canvas.addEventListener('touchend', this.ontouchEnd.bind(this), false);
        this.canvas.addEventListener('touchmove', this.ontouchMove.bind(this), false);
        this.canvas.addEventListener('touchcancel', this.ontouchCancel.bind(this), false);
    }

    /**
     * @event
     */
    ontouchStart(event) {
        this.x = event.touches[0].clientX;
        this.y = event.touches[0].clientY;
        this.button = event.touches[0].button;
        this.pressed = true;
        this.released = false;
        this.clicked = true;
    }

    /**
     * @event
     */
    ontouchEnd(event) {
        this.x = event.changedTouches[0].clientX;
        this.y = event.changedTouches[0].clientY;
        this.button = event.changedTouches[0].button;
        this.pressed = false;
        this.released = true;
        this.clicked = false;
    }

    /**
     * @event
     */
    ontouchMove(event) {
        this.x = event.changedTouches[0].clientX;
        this.y = event.changedTouches[0].clientY;
        this.button = event.changedTouches[0].button;
        this.pressed = true;
        this.released = false;
        this.clicked = false;
    }

    /**
     * @event
     */
    ontouchCancel(event) {
        this.x = event.changedTouches[0].clientX;
        this.y = event.changedTouches[0].clientY;
        this.button = event.changedTouches[0].button;
        this.pressed = false;
        this.released = true;
        this.clicked = false;
    }


    /**
     * @event
     */
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

    /**
     * @event
     */
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

    /**
     * @event
     */
    onthisMove(event) {
        this.x = event.clientX;
        this.y = event.clientY;
        this.dx = event.movementX;
        this.dy = event.movementY;
    }


    /**
     * @event
     */
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
     * @description Clears the pointer event.(Use this after updating the game.)
     * 
     * @example
     * // Clear the pointer event.
     * this.clear();
     * 
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
     * @description Checks if the left pointer button is pressed.
     * @returns {Boolean} True if the left button pointer is pressed.
     * 
     * @example
     * // Check if the left button is pressed.
     * if(pointer.isLeftButtonPressed()) {
     *      console.log("Left button is pressed.");
     * }
     * 
     * 

     */
    isLeftButtonPressed() {
        return this.button === 0 && this.pressed;
    }

    /**
     * @method
     * @description  Checks if the middle pointer button is pressed.
     * @returns {Boolean}  True if the left button pointer is pressed.
     * 
     * @example
     * // Check if the middle button is pressed.
     * if(pointer.isMiddleButtonPressed()) {
     *      console.log("Middle button is pressed.");
     * }
     * 
     * 

     */
    isMiddleButtonPressed() {
        return this.button === 1 && this.pressed;
    }



    /**
     * @method
     * @description Checks if the Right pointer button is pressed.
     * @returns {Boolean} True if the right button pointer is pressed.
     * 
     * @example
     * // Check if the right button is pressed.
     * if(pointer.isRightButtonPressed()) {
     *      console.log("Right button is pressed.");
     * }
     * 

     */
    isRightButtonPressed() {
        return this.button === 2 && this.pressed;
    }

    /**
     * @method
     * @description Checks if the Left pointer button is released.
     * @returns {Boolean} True if the left button pointer is released.
     * 
     * @example
     * // Check if the left button is released.
     * if(pointer.isLeftButtonReleased()) {
     *      console.log("Left button is released.");
     * }
     * 

     */
    isLeftButtonReleased() {
        return this.button === 0 && this.released;
    }


    /**
     * @method
     * @description Checks if the Middle pointer button is released.
     * @returns {Boolean} True if the middle button pointer is released.
     * 
     * @example
     * // Check if the middle button is released.
     * if(pointer.isMiddleButtonReleased()) {
     *      console.log("Middle button is released.");
     * }
     * 
     * 

     */
    isMiddleButtonReleased() {
        return this.button === 1 && this.released;
    }

    /**
     * @method
     * @description Checks if the Right pointer button is released.
     * @returns {Boolean} True if the right button pointer is released.
     * 
     * @example
     * // Check if the right button is released.
     * if(pointer.isRightButtonReleased()) {
     *      console.log("Right button is released.");
     * }
     * 
     * 

     */
    isRightButtonReleased() {
        return this.button === 2 && this.released;
    }

    /**
     * @method
     * @description Checks if the Left pointer button is clicked.
     * @returns {Boolean} True if the left button pointer is clicked.
     * 
     * @example
     * // Check if the left button is clicked.
     * if(pointer.isLeftButtonClicked()) {
     *     console.log("Left button is clicked.");
     * }
     * 
     * 

     */
    isLeftButtonClicked() {
        return this.button === 0 && this.clicked;
    }

    /**
     * @method
     * @description Checks if the Middle pointer button is clicked.
     * @returns {Boolean} True if the middle button pointer is clicked.
     * 
     * @example
     * // Check if the middle button is clicked.
     * if(pointer.isMiddleButtonClicked()) {
     *    console.log("Middle button is clicked.");
     * }
     * 
     * 

     */
    isMiddleButtonClicked() {
        return this.button === 1 && this.clicked;
    }


    /**
     * @method
     * @description Checks if the Right pointer button is clicked.
     * @returns {Boolean} True if the right button pointer is clicked.
     * 
     * @example
     * // Check if the right button is clicked.
     * if(pointer.isRightButtonClicked()) {
     *   console.log("Right button is clicked.");
     * }
     * 
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
     * if(pointer.isWheelScrollingUp()) {
     *      console.log("Wheel is scrolling up.");
     * }
     * 
     * 

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
     * if(pointer.isWheelScrollingDown()) {
     *     console.log("Wheel is scrolling down.");
     * }
     * 
     * 

     */
    isWheelDown() {
        return this.wheelDown;
    }

    /**
     * @method
     * @description Returns the Position of the pointer.
     * @returns {Vector2} The position of the pointer.
     * 
     * @example
     * // Get Vector2 of the pointer.
     * var pointerPosition = pointer.getPointerPos();
     * 
     */
    getPointerPos() {
        return new Vector2(this.x, this.y);
    }

    /**
     * @method
     * @description Get the delta Pointer position as a Vector2.
     * @returns {Vector2} The delta position of the pointer.
     * 
     * @example
     * // Get Vector2 of the pointer.
     * var pointerPosition = pointer.getPointerDelta();
     * 
     * 

     */
    getPointerDelta() {
        return new Vector2(this.dx, this.dy);
    }
}