import { Container } from "./container.js";
import { Transform } from "../uitransform.js";

/**
 * MarginContainer is a container that arranges its children with margins.
 * Note: The margins are added to this container's UITransform component.
 * 
 * @class MarginContainer
 * @extends Container   
 * 
 * @property {number} top=0 - The top margin.
 * @property {number} bottom=0 - The bottom margin.
 * @property {number} left=0 - The left margin.
 * @property {number} right=0 - The right margin.
 */
export class MarginContainer extends Container {
    constructor(left, right, top, bottom) {
        super();
        this._properties.left = left;
        this._properties.right = right;
        this._properties.top = top;
        this._properties.bottom = bottom;

    }

    /**
     * The left margin.
     * @type {number}
     */
    get left() {
        return this._properties.left;
    }

    set left(left) {
        this._properties.left = left;
    }

    /**
     * The right margin.
     * @type {number}
     */
    get right() {
        return this._properties.right;
    }

    set right(right) {
        this._properties.right = right;
    }

    /**
     * The bottom margin.
     * @type {number}
     */
    get top() {
        return this._properties.top;
    }

    set top(top) {
        this._properties.top = top;
    }

    /**
     * The bottom margin.
     * @type {number}
     */
    get bottom() {
        return this._properties.bottom;
    }

    set bottom(bottom) {
        this._properties.bottom = bottom;
    }


    Update() {
        let x = this.entity.GetComponent(Transform).x;
        let y = this.entity.GetComponent(Transform).y;
        let width = this.entity.GetComponent(Transform).width;
        let height = this.entity.GetComponent(Transform).height;

        let left = this.left;
        let right = this.right;
        let top = this.top;
        let bottom = this.bottom;

        let children = this.entity.GetChildren();
        let childWidth = width / children.length;

        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            child.GetComponent(Transform).x = (x + i * (childWidth + left + right));
            child.GetComponent(Transform).y = (y + top);
            child.GetComponent(Transform).width = (childWidth);
            child.GetComponent(Transform).height = (height - top - bottom);
        }
    }
}