import { Transform } from "../../components/transform.js";
import { Vector2 } from "../../maths/vec2.js";
import { CollisionShape } from '../collisionShape.js';
import { PhysicsEngine } from '../physicsEngine.js';
import { PhysicsTransform } from "../transform.js";

export class Body extends Transform {
    constructor(position, density, mass, restitution, area, isStatic) {
        super();
        this.properties.position = position;
        this.properties.density = density;
        this.properties.mass = mass;
        this.properties.restitution = restitution;
        this.properties.area = area;
        this.properties.isStatic = isStatic;
        
        this.properties.linearVelocity = new Vector2(0, 0);
        this.properties.rotation = 0;
        this.properties.angularVelocity = 0;
        this.properties.force = new Vector2(0, 0);
        this.properties.torque = 0;
        this.properties.airResistance = 0.03;
        this.properties.inertia = 0;
        this.properties.invMass = 0;
        this.properties.invInertia = 0;


        this.aabb = null;
        this.aabbUpdateRequired = true;
        this.vertices = [];
        this.transformedVertices = [];
        this.transformUpdateRequired = true;
    }

    Step(time, iterations) { // in seconds
        if (this.properties.isStatic) return;
        time /= iterations;
        let acceleration = this.properties.force.copy().multiply(this.properties.invMass);
        this.properties.linearVelocity.add(acceleration.copy().multiply(time));
        this.properties.linearVelocity.add(PhysicsEngine.gravity.copy());
        this.properties.position.add(this.properties.linearVelocity.copy().multiply(time));

        this.properties.angularVelocity += this.properties.torque * this.properties.invInertia * time;
        this.properties.rotation += this.properties.angularVelocity * time;

        this.properties.force = new Vector2(0, 0);
        this.properties.torque = 0;
        this.properties.linearVelocity.multiply(1 - (this.properties.airResistance / iterations));


        this.aabbUpdateRequired = true;
        this.transformUpdateRequired = true;
    }

    addForce(force) {
        this.properties.force.add(force);
    }

    addTorque(torque) {
        this.properties.torque += torque; // in Nm
    }

    addTorqueImpulse(torque) {
        this.properties.angularVelocity += torque * this.properties.invInertia;
    }

    addImpulse(impulse) {
        this.properties.linearVelocity.add(impulse.copy().multiply(this.properties.invMass));
    }

    calculateRotationalInertia() {
        if (this.properties.shapeType == CollisionShape.POLYGON) {
            return 1 / 12 * this.properties.mass * (this.properties.width * this.properties.width + this.properties.height * this.properties.height);
        }
        else if (this.properties.shapeType == CollisionShape.CIRCLE) {
            return 1 / 2 * this.properties.mass * this.properties.radius * this.properties.radius;
        }
    }

    getAABB() {
        throw new Error("getAABB() not implemented");
    }

    getTransformedVertices() {
        if (this.transformUpdateRequired) {
            let transform = new PhysicsTransform(this.properties.position.x, this.properties.position.y, this.properties.rotation);
            for (let i = 0; i < this.vertices.length; i++) {
                this.transformedVertices[i] = Vector2.transform(this.vertices[i], transform);
            }
            this.transformUpdateRequired = false;
        }
        return this.transformedVertices;
    }

    move(translation) {
        if (this.properties.invMass == 0) return;
        this.properties.position.add(translation);

    }

    moveTowards(target, dt) {
        let direction = target.sub(this.properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.move(direction.mul(speed * dt));
    }

    rotate(rotation) { // in radians
        rotation *= Math.PI / 180;
        this.properties.rotation += rotation;
        this.transformUpdateRequired = true;
    }

    rotateTowards(target, dt) {
        let direction = target.sub(this.properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.rotate(speed * dt);
    }

    moveAt(position){
        this.properties.position = position;
        this.aabbUpdateRequired = true;
        this.transformUpdateRequired = true;
    }

    rotateAt(rotation){
        this.properties.rotation = rotation;
        this.aabbUpdateRequired = true;
        this.transformUpdateRequired = true;
    }

    destroy() {
        PhysicsEngine.removeBody(this);
        this.properties = null;
        this.vertices = null;
        this.transformedVertices = null;
        this.aabb = null;
        this.aabbUpdateRequired = null;

    }
}