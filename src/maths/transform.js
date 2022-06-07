import {Entity} from "../basic/entity.js";
import {Vector2} from "./vec2.js";

/**
 * @class Transform
 * @classdesc A Transform is a class that represents a position and a size.
 * @extends Entity
 * @param {Object} kwargs - The keyword arguments.
 * @param {Vector2} [kwargs.pos = Vector2(0,0)] - The world position. (Optional with x and y properties)
 * @param {Vector2} [kwargs.size= Vector2(1,1)] - The world size. (Optional with w and h properties)
 * @param {Number} [kwargs.x=0] - The x position.
 * @param {Number} [kwargs.y=0] - The y position.
 * @param {Number} [kwargs.w=1] - The width.
 * @param {Number} [kwargs.h=1] - The height.
 * 
 * @example
 * // Create a new transform.
 * let transform = new Transform({
 *      pos: new Vector2(10, 10),
 *      size: new Vector2(10, 10),
 *      rot: 0
 *    });
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Transform extends Entity {
    constructor(kwargs){
        super(kwargs);
        this.pos = kwargs["pos"] || new Vector2(kwargs["x"] || 0, kwargs["y"] || 0);
        this.size = kwargs["size"] || new Vector2(kwargs["w"] || 1, kwargs["h"] || 1);
        this.rot = kwargs["rot"] || 0;
    }
}