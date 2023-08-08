import { Component } from "./component.js";
import { Vector2 } from "../maths/vec2.js";

/**
 * A Transform Component is responsible for the position, rotation and scale of an entity.
 * Every entity component must have a transform component. Without a transform component, the entity will not be rendered.
 * 
 * @class Transform
 * @extends Component
 * 
 * @property {Vector2} position=Vector2.zero() - The position of the entity.
 * @property {number} rotation=0 - The rotation of the entity in degrees.
 * @property {Vector2} scale=Vector2.one() - The scale of the entity.
 * 
 * @example
 * // Create a transform component
 * let transform = new Transform(new Vector2(0,0),0,new Vector2(1,1));
 * 
 * // Add the transform component to an entity
 * entity.AddComponent(transform);
 * 
 * 
 */
export class Transform extends Component {
    constructor(pos = Vector2.Zero(), rot = 0, scale = Vector2.One()) {
        super();
        this._properties = {
            position: pos,
            rotation: rot,
            scale: scale
        }

        this._debug = {
            globalPosition: Vector2.Zero(),
            globalRotation: 0,
            globalScale: Vector2.One()
        }
    }

    /**
     * The vector representing the position of the entity.
     * @type {Vector2}
     * 
     */
    get position() {
        return this._properties.position.Copy();
    }

    set position(position) {
        this._properties.position = position;
    }

    /**
     * Thr rotation of the entity.
     * @type {number}
     */
    get rotation() {
        return this._properties.rotation;
    }

    set rotation(rotation) {
        this._properties.rotation = rotation;
    }

    /**
     * A Vector2 representing the scale of the entity.
     * Scale defaults to Vector2.one().
     * Changing the scale will not affect the width, height and radius of the entity.
     * Scale only affects the Rendering of the entity.
     * @type {Vector2}
     * 
     */
    get scale() {
        return this._properties.scale.Copy();
    }

    set scale(scale) {
        this._properties.scale = scale;
    }

    /**
     * Returns the forward vector of the entity.
     * @returns {Vector2} The forward vector of the entity.
     * 
     */
    GetForward() {
        return new Vector2(Math.cos(this._properties.rotation), Math.sin(this._properties.rotation));
    }

    /**
     * Translates the entity by the given vector.
     * @param {Vector2} translation The vector by which the entity is translated.
     */
    Translate(translation) {
        this._properties.position.add(translation);
    }

    /**
     * Rotates the entity by the given angle.
     * @param {number} angle The angle by which the entity is rotated.
     */
    Rotate(rotation) {
        this._properties.rotation += rotation;
    }

    /**
     * Scales the entity by the given vector.
     * @param {Vector2} scale The vector by which the entity is scaled.
     */
    Scale(scale) {
        this._properties.scale.x *= scale.x;
        this._properties.scale.y *= scale.y;
    }
}