import { Container } from "./container.js";
import { Transform } from "../transform.js";
/**
 * VerticalBoxContainer or VBoxContainer is a container that arranges its children vertically.
 * @class VBoxContainer
 * @extends Container
 * 
 * @property {number} spacing=0 - The spacing between the children.
 */
export class VBoxContainer extends Container {
    constructor(spacing) {
        super();
        this._properties.spacing = spacing;
    }

    /**
     * The spacing between the children.
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
        let childHeight = height / children.length;

        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            child.GetComponent(Transform).x = (x);
            child.GetComponent(Transform).y = (y + i * (childHeight + spacing));
            child.GetComponent(Transform).width = (width);
            child.GetComponent(Transform).height = (childHeight);
        }
    }
}