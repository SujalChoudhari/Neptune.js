import { Component } from "../components/component.js";
import { Vector2 } from "../math/vec2.js";

/**
 * BoxCollider Component.
 * Used for AABB Collision detection and integrates with Nereid physics.
 * @class BoxCollider
 * @extends Component
 */
export class BoxCollider extends Component {
    constructor(width = 1, height = 1, offsetX = 0, offsetY = 0, options = {}) {
        super();
        this._properties.size = new Vector2(width, height);
        this._properties.offset = new Vector2(offsetX, offsetY);
        this._properties.enabled = options.enabled ?? true;
        this._properties.role = options.role ?? "solid";
        this._properties.layer = options.layer ?? 1;
        this._properties.mask = options.mask ?? 0xffffffff;
        this._properties.isTrigger = options.isTrigger ?? (this._properties.role !== "solid");
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

    get enabled() {
        return this._properties.enabled !== false;
    }

    set enabled(val) {
        this._properties.enabled = Boolean(val);
    }

    get role() {
        return this._properties.role || "solid";
    }

    set role(val) {
        this._properties.role = val;
        this._properties.isTrigger = val !== "solid";
    }

    get layer() {
        return this._properties.layer ?? 1;
    }

    set layer(val) {
        this._properties.layer = val;
    }

    get mask() {
        return this._properties.mask ?? 0xffffffff;
    }

    set mask(val) {
        this._properties.mask = val >>> 0;
    }

    get isTrigger() {
        return Boolean(this._properties.isTrigger);
    }

    set isTrigger(val) {
        this._properties.isTrigger = Boolean(val);
        if (this._properties.isTrigger && this._properties.role === "solid") {
            this._properties.role = "trigger";
        } else if (!this._properties.isTrigger && this._properties.role === "trigger") {
            this._properties.role = "solid";
        }
    }

    deserialize(props) {
        if (!props) return;
        if (props.size) this.size = new Vector2(props.size.x, props.size.y);
        if (props.offset) this.offset = new Vector2(props.offset.x, props.offset.y);
        if (props.offsetX !== undefined) this.offset.x = props.offsetX;
        if (props.offsetY !== undefined) this.offset.y = props.offsetY;
        if (props.width !== undefined) this.size.x = props.width;
        if (props.height !== undefined) this.size.y = props.height;
        if (props.enabled !== undefined) this.enabled = props.enabled;
        if (props.role !== undefined) this.role = props.role;
        if (props.layer !== undefined) this.layer = props.layer;
        if (props.mask !== undefined) this.mask = props.mask;
        if (props.isTrigger !== undefined) this.isTrigger = props.isTrigger;
    }
}
