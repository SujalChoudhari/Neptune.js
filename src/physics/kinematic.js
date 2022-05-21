import {Vector2} from "../maths/vec2.js";
import {CollidableTransform} from "./collidable_transform.js";

/**
 * @class Kinematic
 * @classdesc Kinematic class. 
 * Physics Engine has no control over the movement of the kinematic object.
 * @extends CollidableTransform
 * 
 * @property {Object} kwargs - The keyword arguments.
 * @property {Vector2} kwargs.velocity - The velocity.
 * @property {Vector2} [kwargs.vel] - The velocity.
 * @property {Vector2} [kwargs.acceleration] - The acceleration.
 * @property {Vector2} kwargs.acc - The acceleration.
 * @property {Number} kwargs.drag - The drag.
 * @property {Number} kwargs.mass - The mass.
 * @property {Number} [kwargs.maxVelocity] - The maximum velocity.
 * @property {Number} kwargs.maxVel- The maximum velocity.
 * @property {Number} [kwargs.maxAcceleration] - The maximum acceleration.
 * @property {Number} kwargs.maxAcc - The maximum acceleration.
 */
export class Kinematic extends CollidableTransform{
    constructor(kwargs){
        super(kwargs);
        this.velocity = kwargs["velocity"] || kwargs["vel"]  || new Vector2(0, 0);
        this.acceleration = kwargs["acceleration"] || kwargs["acc"]  || new Vector2(0, 0);
        this.mass = kwargs["mass"] || 1;
        this.drag = kwargs["drag"] || 0;
        this.maxVelocity = kwargs["maxVelocity"]||kwargs["maxVel"]  || Infinity;
        this.maxAcceleration = kwargs["maxAcceleration"] || kwargs["maxAcc"] || Infinity;
    }
    
    /**
     * @method
     * @description Updates the Kinematic object.
     * Forces and Accelerations are applied to the velocity and position.
     * @param {Number} deltaTime - The time since the last update.
     * 
     * @example
     * // Update the kinematic.
     * kinematic.update(deltaTime);
     */
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
     * @method
     * @description Adds a force to the kinematic object.
     * @param {Vector2} force - The force.
     * 
     * @example
     * // Add a force to the kinematic.
     * kinematic.addForce(force);
     */
    addForce(force){
        force.mulInt(1 / this.mass);
        this.acceleration.add(force);
    }

    /**
     * @method
     * @description Adds a Impulse to the kinematic object.
     * @param {Vector2} impulse - The impulse.
     * 
     * @example
     * // Add a impulse to the kinematic.
     * kinematic.addImpulse(impulse);
     */
    addImpulse(impulse){
        impulse.mulInt(1 / this.mass);
        this.velocity.add(impulse);
    }

    /**
     * @method
     * @description Adds a Acceleration to the kinematic object.
     * @param {Vector2} acceleration - The acceleration.
     * 
     * @example
     * // Add a acceleration to the kinematic.
     * kinematic.addAcceleration(acceleration);
     */
    addAcceleration(acceleration){
        this.acceleration.add(acceleration);
    }

}