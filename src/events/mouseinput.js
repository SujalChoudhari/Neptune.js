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

    static Init(canvas) {
        MouseInput.#canvas = canvas;
        MouseInput.#pos = new Vector2();
        MouseInput.#pressedButton = null;
        MouseInput.#isClicked = false;
        MouseInput.#isMouseDown = false;

        MouseInput.#canvas.addEventListener("click", MouseInput.#Click);
        MouseInput.#canvas.addEventListener("dblclick", MouseInput.#DoubleClick);
        MouseInput.#canvas.addEventListener("contextmenu", MouseInput.#RightClick);
        MouseInput.#canvas.addEventListener("mousedown", MouseInput.#MouseDown);
        MouseInput.#canvas.addEventListener("mouseup", MouseInput.#MouseUp);
        MouseInput.#canvas.addEventListener("mousemove", MouseInput.#MouseMove);
        MouseInput.#canvas.addEventListener("mouseout", MouseInput.#MouseUp);
        MouseInput.#canvas.addEventListener("mouseleave", MouseInput.#MouseUp);
        MouseInput.#canvas.addEventListener("mouseover", MouseInput.#MouseMove);
    }

    static #Click(event) {
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = event.button;
        MouseInput.onClick(event);
    }

    static #DoubleClick(event) {
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = event.button;
        MouseInput.onDoubleClick(event);
    }

    static #RightClick(event) {
        event.preventDefault(); // Prevent the default context menu from showing up
        MouseInput.#isClicked = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = MouseButtons.RIGHT;
        MouseInput.onRightClick(event);

    }

    static #MouseDown(event) {
        MouseInput.#isMouseDown = true;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = event.button;
    }

    static #MouseUp(event) {
        MouseInput.#isMouseDown = false;
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
        MouseInput.#pressedButton = -1;
    }

    static #MouseMove(event) {
        MouseInput.#pos.x = event.offsetX;
        MouseInput.#pos.y = event.offsetY;
    }

    static leftMouseButtonDown() {
        return MouseInput.#pressedButton === 0 && MouseInput.#isMouseDown;
    }

    static rightMouseButtonDown() {
        return MouseInput.#pressedButton === 2 && MouseInput.#isMouseDown;
    }

    static middleMouseButtonDown() {
        return MouseInput.#pressedButton === 1 && MouseInput.#isMouseDown;
    }

    static leftMouseButtonUp() {
        return MouseInput.#pressedButton === 0 && !MouseInput.#isMouseDown;
    }

    static rightMouseButtonUp() {
        return MouseInput.#pressedButton === 2 && !MouseInput.#isMouseDown;
    }

    static middleMouseButtonUp() {
        return MouseInput.#pressedButton === 1 && !MouseInput.#isMouseDown;
    }

    static isLeftClicked() {
        return MouseInput.#isClicked && MouseInput.#pressedButton === 0;
    }

    static isRightClicked() {
        return MouseInput.#isClicked && MouseInput.#pressedButton === 2;
    }

    static isMiddleClicked() {
        return MouseInput.#isClicked && MouseInput.#pressedButton === 1;
    }

    static isLeftPressed() {
        return MouseInput.#pressedButton === 0;
    }

    static isRightPressed() {
        return MouseInput.#pressedButton === 2;
    }

    static isMiddlePressed() {
        return MouseInput.#pressedButton === 1;
    }

    static getPosition() {
        return MouseInput.#pos.copy();
    }

    static Clear() {
        MouseInput.#isClicked = false;
        MouseInput.#isMouseDown = false;
        MouseInput.#pressedButton = -1;
    }
}



export const MouseButtons = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
};


