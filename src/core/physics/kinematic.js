import Vector2 from "../maths/vec2.js";
import CollidableTransform from "./collidable_transform.js";
export default class Kinematic extends CollidableTransform{
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
    addForce(force){
        force.mulInt(1 / this.mass);
        this.acceleration.add(force);
    }
    addImpulse(impulse){
        impulse.mulInt(1 / this.mass);
        this.velocity.add(impulse);
    }
    addAcceleration(acceleration){
        this.acceleration.add(acceleration);
    }

}