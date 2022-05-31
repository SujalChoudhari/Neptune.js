import { Transform } from "../maths/transform.js";
import { Vector2 } from "../maths/vec2.js";


/**
 * @class CollidableTransform
 * @classdesc Transform that can collide.
 * @extends Transform   
 * @deprecated Use Physics/Collision Instead.
 * @property {Object} kwargs - The keyword arguments.
 * @property {Boolean} [kwargs.collidable=true] - Whether the transform is collidable.
 * @example 
 * // Create a new collidable transform.
 * let collidableTransform = new CollidableTransform({
 *      pos: new Vector2(10, 10),
 *      size: new Vector2(10, 10),
 *      rot: 0,
 *      collidable: true
 *   });
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class CollidableTransform extends Transform {
    constructor(kwargs) {
        super(kwargs);
        this.collidable = kwargs["collidable"] || true;
    }


    /**
     * @method
     * @description Updates the Transform.
     * Calculates the world position and rotation.
     * @param {Number} deltaTime - The time since the last update.
     * 
     */
    update(deltaTime) {
        super.update(deltaTime);
    }

    /**
     * @method
     * @description Checks if the transform contains the point.
     * @param {Number} x - The x position.
     * @param {Number} y - The y position.
     * @returns {Boolean} Whether the transform contains the point.
     * 
     * @example
     * // Check if the transform contains the point.
     * if(transform.containsPoint(x, y)){
     *     // Do something.
     * }
     */
    containsPoint(x, y) {
        return x >= this.worldPos.x && x <= this.worldPos.x + this.size.x && y >= this.worldPos.y && y <= this.worldPos.y + this.size.y;
    }

    /**
     * @method
     * @description Checks if the point collides with the transform.
     * The collidable property must be set to true for any collision to occur.
     * @param {Vector2} point - The point to check.
     * @returns {Boolean} Whether the point collides with the transform.
     * 
     * @example
     * // Check if the point collides with the transform.
     * if(transform.checkCollisionPoint(point)){
     *    // Do something.
     * }
     * 
     */
    checkCollisionPoint(point) {
        return this.collidable && this.containsPoint(point.x, point.y);
    }

    /**
     * @method
     * @description Get the direction of the collision of a Rect (Not Tested).
     * @param {Rect} rect - The rect to check.
     * @returns {Vector2} The direction of the collision.
     * 
     * @example
     * // Get the direction of the collision of a Rect.
     * let dir = transform.getCollisionDirection(rect);
     * 
     * 
     */
    getCollisionDirection(rect) {
        let direction = new Vector2(0, 0);
        if (this.checkCollisionPoint(new Vector2(rect.worldPos.x, rect.worldPos.y))) {
            direction.x = 1;
        }
        if (this.checkCollisionPoint(new Vector2(rect.worldPos.x + rect.size.x, rect.worldPos.y))) {
            direction.x = -1;
        }
        if (this.checkCollisionPoint(new Vector2(rect.worldPos.x, rect.worldPos.y + rect.size.y))) {
            direction.y = 1;
        }
        if (this.checkCollisionPoint(new Vector2(rect.worldPos.x + rect.size.x, rect.worldPos.y + rect.size.y))) {
            direction.y = -1;
        }
        return direction;
    }

    /** 
     * @method
     * @description Returns the collision Point of the transform with the rect.
     * @param {Rect} rect - The rect to check.
     * @returns {Vector2} The collision point.
     * 
     * @example
     * // Get the collision point of the transform with the rect.
     * let collisionPoint = transform.getCollisionPoint(rect);
     * 
     */
    getCollisionPoint(rect) {
        let dir = this.getCollisionDirection(rect);
        if (dir.x != 0) {
            return new Vector2(this.worldPos.x + this.size.x, this.worldPos.y + this.size.y / 2);
        }
        else if (dir.y != 0) {
            return new Vector2(this.worldPos.x + this.size.x / 2, this.worldPos.y + this.size.y);
        }
        return new Vector2(0, 0);
    }
}