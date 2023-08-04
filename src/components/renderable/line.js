import { Color } from "../../basic/color.js";
import { Renderable } from "./renderable.js";
import { Vector2 } from "../../maths/vec2.js";
import { Transform } from "../transform.js";
import { Maths } from "../../maths/math.js";


/**
 * A Line Component allows us to draw lines between two points.
 * Points are defined as Vector2.
 * 
 * @class Line
 * @extends Renderable
 * 
 * @property {Vector2} lineToPoint - The ending point of the line, coordinates. This point is relative to the origin of the component. (in meters)
 * @property {Color} color=Color.fuchsia - The color of the line that is drawn.
 * @property {number} thickness=2 - The thickness of the line in pixles. Defaults to 2.
 * 
 * @example
 * // Create a line
 * var line = new Line(
 *  new Vector2(0,0),
 *  new Vector2(100,200),
 *  Color.red,
 *  5 
 * )
 * 
 * // Add the line to the component
 * entity.add(line);
 * 
 * 
 * 
 */
export class Line extends Renderable {

    constructor(lineToPoint, color = Color.fuchsia, thickness = 2) {
        super();
        this._properties.end = lineToPoint;
        this._properties.color = color;
        this._properties.thickness = thickness;
    }

    /**
     * Get the point to where the line should be drawn
     * @type {Vector2}
     */
    get lineToPoint() { return this._properties.end; }

    /**
     * Get the color to use for the line
     * @type {Color}
     */
    get color() { return this._properties.color; }

    /**
     * Get the thickness of the line in (pixels)
     * @type {Number}
     */
    get thickness() { return this._properties.thickness; }


    /**
     * Set the point to where the line will be drawn
     * @param {number} value Value in Meters
     */
    set lineToPoint(value) { this._properties.end = value; }

    /**
     * Set the color of the line
     */
    set color(value) { this._properties.color = value; }

    /**
     * Set the thickness of the line in (pixels)
     */
    set thickness(value) { this._properties.thickness = value; }

    /** @private */
    draw(ctx) {
        let transform = this.entity.getComponent(Transform);
        let position = Maths.meterToPixelVector2(transform.position);
        let endPosition = Maths.meterToPixelVector2(this.lineToPoint);
        let rotation = transform.rotation;
        let scale = Maths.meterToPixelVector2(transform.scale);
        let color = this._properties.color;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale.x, scale.y);
        ctx.fillStyle = color.toString();

        ctx.strokeStyle = color.toString();
        ctx.lineWidth = this.thickness;


        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + endPosition.x, position.y + endPosition.y);
        ctx.stroke();
        ctx.closePath();

        let children = this.entity.getComponentsInChildren(Renderable);
        for (let i = 0; i < children.length; i++) {
            children[i].draw(ctx);
        }
        ctx.restore();
    }

};