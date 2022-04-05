import Transform from "../maths/transform.js";
import Vector2 from "../maths/vec2.js";

/**
 * CollidableTransform
 * ========
 * @class CollidableTransform
 * @extends Transform
 * @classdesc A CollidableTransform is a class that is used to store the position, rotation and scale of an Entity. It also stores the collider of the transform and handles collisions.
 * 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {bool} kwargs.collidable - Whether or not the transform is collidable or not.
 * 
 * Methods:
 * @method containsPoint(x,y) - Returns true if the point is contained within the transform.
 * @method getCollisionPoint(rect) - Returns the collision point of the transform with the given rect.
 * @method getCollisionDirection(rect) - Returns the direction of the collision between the transform and the given rect.
 * @method checkCollisionPoint(point) - Returns true if the point is contained within the transform.
 */
export default class CollidableTransform extends Transform{
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {bool} kwargs.collidable - Whether or not the transform is collidable or not.
     */
    constructor(kwargs){
        super(kwargs);
        this.collidable = kwargs["collidable"] || true;
    }

    update(deltaTime){
        super.update(deltaTime);
    }
    
    /**
     * check if the point is contained within the transform.
     * @param {Number} x - The x position of the point.
     * @param {Numner} y - The y position of the point.
     * @returns {bool} - Returns true if the point is contained within the transform.
     */
    containsPoint(x,y){
        return x >= this.worldPos.x && x <= this.worldPos.x + this.size.x && y >= this.worldPos.y && y <= this.worldPos.y + this.size.y;
    }

    /**
     * check if the point is contained within the transform.
     * @param {Vector2} point - The point to check.
     * @returns {bool} - Returns true if the point is contained within the transform.
     */
    checkCollisionPoint(point){
        return this.collidable && this.containsPoint(point.x,point.y);
    }

    /**
     * Get the direction of the collision between the transform and the given rect.
     * @param {Transform} rect - The transform to check.
     * @returns {Vector2} - Returns the direction of the collision between the transform and the given rect.
     */
    getCollisionDirection(rect){
        let direction = new Vector2(0, 0);
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x, rect.worldPos.y))){
            direction.x = 1;
        }
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x + rect.size.x, rect.worldPos.y))){
            direction.x = -1;
        }
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x, rect.worldPos.y + rect.size.y))){
            direction.y = 1;
        }
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x + rect.size.x, rect.worldPos.y + rect.size.y))){
            direction.y = -1;
        }
        return direction;
    }

    /**
     * Get Collision Point
     * @param {Transform} rect - The transform to check.
     * @returns {Vector2} - Returns the collision point of the transform with the given rect.
     */
    getCollisionPoint(rect){
        let dir = this.getCollisionDirection(rect);
        if(dir.x != 0){
            return new Vector2(this.worldPos.x + this.size.x, this.worldPos.y + this.size.y / 2);
        }
        else if(dir.y != 0){
            return new Vector2(this.worldPos.x + this.size.x / 2, this.worldPos.y + this.size.y);
        }
        return new Vector2(0, 0);
    }
}