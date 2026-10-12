import { Component } from "../components/component.js";
import { Vector2 } from "../math/vec2.js";

/**
 * BoxCollider Component.
 * Used for AABB Collision detection.
 * @class BoxCollider
 * @extends Component
 */
export class BoxCollider extends Component {
    constructor(width = 1, height = 1, offsetX = 0, offsetY = 0) {
        super();
        this._properties.size = new Vector2(width, height);
        this._properties.offset = new Vector2(offsetX, offsetY);
    }

    get size() {
        return this._properties.size;
    }

    set size(val) {
        this._properties.size = val;
    }

    get offset() {
        return this._properties.offset;
    }

    set offset(val) {
        this._properties.offset = val;
    }

    deserialize(props) {
        if (props.size) this.size = new Vector2(props.size.x, props.size.y);
        if (props.offset) this.offset = new Vector2(props.offset.x, props.offset.y);
        // Direct width/height support for simpler JSON
        if (props.width !== undefined) this.size.x = props.width;
        if (props.height !== undefined) this.size.y = props.height;
    }
}
