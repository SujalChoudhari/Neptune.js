import { Container } from "./container.js";
import { Transform } from "../uitransform.js";
/**
 * Horizontal Box Container or HBoxContainer is a container that arranges its children horizontally.
 * @class HBoxContainer
 * @extends Container
 * 
 * @property {number} spacing=0 - The spacing between the children.
 */
export class HBoxContainer extends Container {
    constructor(spacing) {
        super();
        this._properties.spacing = spacing;
    }

    /**
     * Space between the children.
     * @type {number}
     */
    get spacing() {
        return this._properties.spacing;
    }

    set spacing(spacing) {
        this._properties.spacing = spacing;
    }


    Update() {
        let x = this.entity.GetComponent(Transform).x;
        let y = this.entity.GetComponent(Transform).y;
        let width = this.entity.GetComponent(Transform).width;
        let height = this.entity.GetComponent(Transform).height;

        let spacing = this.spacing;

        let children = this.entity.GetChildren();
        let childWidth = width / children.length;

        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            child.GetComponent(Transform).x = (x + i * (childWidth + spacing));
            child.GetComponent(Transform).y = (y);
            child.GetComponent(Transform).width = (childWidth);
            child.GetComponent(Transform).height = (height);
        }
    }
}