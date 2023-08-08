import { Vector2 } from "../maths/vec2.js";
import { Component } from "../components/component.js";
import { MouseInput } from "../events/mouseinput.js"
import { Maths } from "../maths/math.js"

/**
 * UI Transform Component is responsible for the position, rotation and width and height of a UI element.
 * Every UI element must have a transform component. Without a transform component, the UI element will not be rendered.
 * Note Scale is not supported for UI elements.
 * Thus normal Transform Component cannot be used for UI elements, as it has scale instead of width and height.
 * All the UI Rendering is done with pixels, so the position and width and height are in pixels. 
 * Position vector is replaced by x and y.
 * @class UITransform
 * @extends Component
 * @property {number} x=0 - The x position of the UI element.
 * @property {number} y=0 - The y position of the UI element.
 * @property {number} rotation=0 - The rotation of the UI element in degrees.
 * @property {number} width=10 - The width of the UI element.
 * @property {number} height=10 - The height of the UI element.
 */
export class Transform extends Component {

    constructor(x = 0, y = 0, width = 10, height = 10, rot = 0) {
        super();
        this._properties.x = x;
        this._properties.y = y;
        this._properties.width = width;
        this._properties.height = height;
        this._properties.rot = rot;

    }

    /**
     * X position of the UI element.
     * @type {number}
     */
    get x() {
        return this._properties.x;
    }

    set x(x) {
        this._properties.x = x;
    }

    /**
     * Y position of the UI element.
     * @type {number}
     */
    get y() {
        return this._properties.y;
    }

    set y(y) {
        this._properties.y = y;
    }

    /**
     * Width of the UI element.
     * @type {number}
     */
    get width() {
        return this._properties.width;
    }

    set width(width) {
        this._properties.width = width;
    }

    /**
     * Height of the UI element.
     */
    get height() {
        return this._properties.height;
    }

    set height(height) {
        this._properties.height = height;
    }

    /**
     * Rotation of the UI element in degrees.
     */
    get rotation() {
        return this._properties.rot;
    }

    set rotation(rot) {
        this._properties.rot = rot;
    }

    /**
     * Center the UI element. Set/Get the x and y position of the UI element so that center of the UI element is as specified.
     */
    get center() {
        let center = new Vector2(this._properties.x + this._properties.width / 2, this._properties.y + this._properties.height / 2);
        return center;
    }

    set center(center) {
        this._properties.x = center.x - this._properties.width / 2;
        this._properties.y = center.y - this._properties.height / 2;
    }



    /**
     * Align the UI element to the parent as per the specified mode.
     * If the UI element has no parent, it will align to the window.
     * 
     * @param {string} mode="center" - The mode of alignment.
     * | Mode | Description |
     * | --- | --- |
     * | "top" | Align the UI element to the top of the parent. |
     * | "middle" | Align the UI element to the middle of the parent. |
     * | "bottom" | Align the UI element to the bottom of the parent. |
     * | "left" | Align the UI element to the left of the parent. |
     * | "right" | Align the UI element to the right of the parent. |
     * | "center" | Align the UI element to the center of the parent. |
     * 
     * @example
     * // Align the UI element to the top of the parent.
     * transform.align("top");
     * 
     */
    Align(mode = "center") {
        let parent = this.entity.parent;
        if (parent != undefined) {
            var parentTransform = parent.GetComponent(Transform);
            var x = parentTransform.x;
            var y = parentTransform.y;
            var width = parentTransform.width;
            var height = parentTransform.height;
        }
        else {
            var x = 0;
            var y = 0;
            var width = window.innerWidth * Maths.PIXEL_TO_METER;
            var height = window.innerHeight * Maths.PIXEL_TO_METER;
        }

        switch (mode) {
            case "left":
                this._properties.x = x;
                break;
            case "right":
                this._properties.x = x + width - this._properties.width;
                break;
            case "top":
                this._properties.y = y;
                break;
            case "bottom":
                this._properties.y = y + height - this._properties.height;
                break;
            case "center":
                this._properties.x = x + width / 2 - this._properties.width / 2;
                break;
            case "middle":
                this._properties.y = y + height / 2 - this._properties.height / 2;
                break;
        }
    }


    /**
     * Fill the Entity with the parent as per the specified mode.
     * If the UI element has no parent, it will fill the window.
     * 
     * @param {string} mode="both" - The mode of filling.
     * | Mode | Description |
     * | --- | --- |
     * | "both" | Fill the UI element to the size of the parent. |
     * | "x" | Fill the UI element to the width of the parent. |
     * | "y" | Fill the UI element to the height of the parent. |
     * 
     * @param {number} padX=0 - Padding in the x direction.
     * @param {number} padY=0 - Padding in the y direction.
     * 
     * @example
     * // Fill the UI element to the size of the parent.
     * this.entity.getComponent(UITransform).fill();
     * 
     */
    Fill(mode = "both", padX = 0, padY = 0) {
        let parent = this.entity.parent;
        if (parent && parent.HasComponent(Transform)) {
            var parentTransform = parent.GetComponent(Transform);
            var x = parentTransform.x;
            var y = parentTransform.y;
            var width = parentTransform.width;
            var height = parentTransform.height;
        } else {
            var x = 0;
            var y = 0;
            var width = window.innerWidth * Maths.PIXEL_TO_METER;
            var height = window.innerHeight * Maths.PIXEL_TO_METER;
        }

        switch (mode) {
            case "both":
                this._properties.x = x + padX;
                this._properties.y = y + padY;
                this._properties.width = width - padX * 2;
                this._properties.height = height - padY * 2;
                break;
            case "x":
                this._properties.x = x + padX;
                this._properties.width = width - padX * 2;
                break;
            case "y":
                this._properties.y = y + padY;
                this._properties.height = height - padY * 2;
                break;
        }
    }
}   