import { Vector2 } from "../maths/vec2.js";
export class MouseInput {
    static #canvas;
    static #pos = new Vector2();
    static #pressedButton;
    static #isClicked;
    static #isMouseDown;
    static onClick = (event) => { };
    static onDoubleClick = (event) => { };
    static onRightClick = (event) => { };

    /**
     * Check if the left mouse button is down.
     * @returns {boolean} True if the left mouse button is down.
     * @method
     */
    static LeftMouseButtonDown() {
        return MouseInput.#pressedButton === 0 && MouseInput.#isMouseDown;
    }

    /**
     * Check if the right mouse button is down.
     * @returns {boolean} True if the right mouse button is down.
     */
    static RightMouseButtonDown() {
        return MouseInput.#pressedButton === 2 && MouseInput.#isMouseDown;
    }

    /**
     * Check if the middle mouse button is down.
     * @returns {boolean} True if the middle mouse button is down.
     */
    static MiddleMouseButtonDown() {
        return MouseInput.#pressedButton === 1 && MouseInput.#isMouseDown;
    }


    static LeftMouseButtonUp() {
        return MouseInput.#pressedButton === 0 && !MouseInput.#isMouseDown;
    }

    static RightMouseButtonUp() {
        return MouseInput.#pressedButton === 2 && !MouseInput.#isMouseDown;
    }

    static MiddleMouseButtonUp() {
        return MouseInput.#pressedButton === 1 && !MouseInput.#isMouseDown;
    }

    static IsLeftClicked() {
        return MouseInput.#isClicked && MouseInput.#pressedButton === 0;
    }

    static IsRightClicked() {
        return MouseInput.#isClicked && MouseInput.#pressedButton === 2;
    }

    static IsMiddleClicked() {
        return MouseInput.#isClicked && MouseInput.#pressedButton === 1;
    }

    static IsLeftPressed() {
        return MouseInput.#pressedButton === 0;
    }

    static IsRightPressed() {
        return MouseInput.#pressedButton === 2;
    }

    static IsMiddlePressed() {
        return MouseInput.#pressedButton === 1;
    }


    static GetPosition() {
        return MouseInput.#pos.Copy();
    }

    /**@private */
    static clear() {
        MouseInput.#isClicked = false;
        MouseInput.#isMouseDown = false;
        MouseInput.#pressedButton = -1;
    }


    /**@private */
    static init(canvas) {
        MouseInput.#canvas = canvas;
        MouseInput.#pos = new Vector2();
        MouseInput.#pressedButton = null;
        MouseInput.#isClicked = false;
        MouseInput.#isMouseDown = false;

        MouseInput.#canvas.addEventListener("click", MouseInput.#click);
        MouseInput.#canvas.addEventListener("dblclick", MouseInput.#doubleClick);
        MouseInput.#canvas.addEventListener("contextmenu", MouseInput.#rightClick);
        MouseInput.#canvas.addEventListener("mousedown", MouseInput.#mouseDown);
        MouseInput.#canvas.addEventListener("mouseup", MouseInput.#mouseUp);
        MouseInput.#canvas.addEventListener("mousemove", MouseInput.#mouseMove);
        MouseInput.#canvas.addEventListener("mouseout", MouseInput.#mouseUp);
        MouseInput.#canvas.addEventListener("mouseleave", MouseInput.#mouseUp);
        MouseInput.#canvas.addEventListener("mouseover", MouseInput.#mouseMove);
    }
    /**@private */
    static #click(event) {
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = event.button;
        MouseInput.onClick(event);
    }
    /**@private */
    static #doubleClick(event) {
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = event.button;
        MouseInput.onDoubleClick(event);
    }
    /**@private */
    static #rightClick(event) {
        event.preventDefault(); // Prevent the default context menu from showing up
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = MouseInput.Buttons.RIGHT;
        MouseInput.onRightClick(event);

    }
    /**@private */
    static #mouseDown(event) {
        MouseInput.#isMouseDown = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = event.button;
    }
    /**@private */
    static #mouseUp(event) {
        MouseInput.#isMouseDown = false;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = -1;
    }
    /**@private */
    static #mouseMove(event) {
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
    }
}



MouseInput.Buttons = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
};


