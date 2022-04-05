import Vector2 from "../maths/vec2.js";
import CollidableTransform from "./collidable_transform.js";

/**
 * Kinematic
 * ========
 * @class Kinematic
 * @extends CollidableTransform
 * @classdesc Kinematic object can be manipulated by the forces applied to it. 
 * Properties:
 * @property {Object} kwargs - The keyword arguments.
 * @property {Vector2} kwargs.velocity - The velocity of the object.
 * @property {Vector2} kwargs.acceleration - The acceleration of the object.
 * @property {Number} kwargs.maxVelocity - The maximum velocity of the object.
 * @property {Number} kwargs.maxAcceleration - The maximum acceleration of the object.
 * @property {Number} kwargs.mass - The mass of the object.
 * @property {Number} kwargs.drag - The drag of the object.
 * 
 * Methods:
 * @method addForce(force) - Adds a force to the object.
 * @method addImpulse(impulse) - Adds an impulse to the object.
 * @method addAcceleration(acceleration) - Adds an acceleration to the object.
 */
export default class Kinematic extends CollidableTransform{
    /**
     * @constructor
     * @param {Object} kwargs - The keyword arguments.
     * @param {Vector2} kwargs.velocity - The velocity of the object.
     * @param {Vector2} kwargs.acceleration - The acceleration of the object.
     * @param {Number} kwargs.maxVelocity - The maximum velocity of the object.
     * @param {Number} kwargs.maxAcceleration - The maximum acceleration of the object.
     * @param {Number} kwargs.mass - The mass of the object.
     * @param {Number} kwargs.drag - The drag of the object.
     */
    constructor(kwargs){
        super(kwargs);
        this.velocity = kwargs["velocity"] || new Vector2(0, 0);
        this.acceleration = kwargs["acceleration"] || new Vector2(0, 0);
        this.mass = kwargs["mass"] || 1;
        this.drag = kwargs["drag"] || 0;
        this.maxVelocity = kwargs["maxVelocity"] || Infinity;
        this.maxAcceleration = kwargs["maxAcceleration"] || Infinity;
    }
    
    update(deltaTime){
        super.update(deltaTime);
        this.velocity.add(this.acceleration);
        this.velocity.mulInt(1 - this.drag);
        this.velocity.limit(this.maxVelocity);
        this.pos.add(this.velocity);
        
        this.acceleration.mulInt(0);
        this.velocity.mulInt(0);
    }

    /**
     * Adds a force to the object.
     * @param {Vector2} force - The force to be added.
     */
    addForce(force){
        force.mulInt(1 / this.mass);
        this.acceleration.add(force);
    }

    /**
     * Adds an impulse to the object.
     * @param {Vector2} impulse - The impulse to be added.
     */
    addImpulse(impulse){
        impulse.mulInt(1 / this.mass);
        this.velocity.add(impulse);
    }

    /**
     * Adds an acceleration to the object.
     * @param {Vector2} acceleration - The acceleration to be added.
     */
    addAcceleration(acceleration){
        this.acceleration.add(acceleration);
    }

}