import { Transform } from "../../components/transform.js";
import { Vector2 } from "../../maths/vec2.js";
import { CollisionShape } from '../collisionShape.js';
import { PhysicsEngine } from '../physicsEngine.js';
import { PhysicsTransform } from "../transform.js";

export class Body extends Transform {
    constructor(position, density, mass, restitution, area, isStatic) {
        super();
        this._properties.position = position;
        this._properties.density = density;
        this._properties.mass = mass;
        this._properties.restitution = restitution;
        this._properties.area = area;
        this._properties.isStatic = isStatic;
        this._properties.linearVelocity = new Vector2(0, 0);
        this._properties.rotation = 0;
        this._properties.angularVelocity = 0;
        this._properties.force = new Vector2(0, 0);
        this._properties.torque = 0;
        this._properties.airResistance = 0.03;
        this._properties.inertia = 0;
        this._properties.invMass = 0;
        this._properties.invInertia = 0;

        this._aabb = null;
        this._aabbUpdateRequired = true;
        this._vertices = [];
        this._transformedVertices = [];
        this._transformUpdateRequired = true;
    }

    get position() {
        return this._properties.position;
    }

    get rotation() {
        return this._properties.rotation;
    }

    get linearVelocity() {
        return this._properties.linearVelocity;
    }

    get angularVelocity() {
        return this._properties.angularVelocity;
    }

    get restitution() {
        return this._properties.restitution;
    }

    get mass() {
        return this._properties.mass;
    }

    get invMass() {
        return this._properties.invMass;
    }

    get invInertia() {
        return this._properties.invInertia;
    }

    get inertia() {
        return this._properties.inertia;
    }

    get isStatic() {
        return this._properties.isStatic;
    }

    get shapeType() {
        return this._properties.shapeType;
    }

    get vertices() {
        return this._vertices;
    }

    get area() {
        return this._properties.area;
    }

    get density() {
        return this._properties.density;
    }


    Step(time, iterations) { // in seconds
        if (this._properties.isStatic) return;
        time /= iterations;
        let acceleration = this._properties.force.copy().multiply(this._properties.invMass);
        this._properties.linearVelocity.add(acceleration.copy().multiply(time));
        this._properties.linearVelocity.add(PhysicsEngine.gravity.copy());
        this._properties.position.add(this._properties.linearVelocity.copy().multiply(time));

        this._properties.angularVelocity += this._properties.torque * this._properties.invInertia * time;
        this._properties.rotation += this._properties.angularVelocity * time;

        this._properties.force = new Vector2(0, 0);
        this._properties.torque = 0;
        this._properties.linearVelocity.multiply(1 - (this._properties.airResistance / iterations));


        this._aabbUpdateRequired = true;
        this._transformUpdateRequired = true;
    }

    addForce(force) {
        this._properties.force.add(force);
    }

    addTorque(torque) {
        this._properties.torque += torque; // in Nm
    }

    addTorqueImpulse(torque) {
        this._properties.angularVelocity += torque * this._properties.invInertia;
    }

    addImpulse(impulse) {
        this._properties.linearVelocity.add(impulse.copy().multiply(this._properties.invMass));
    }

    calculateRotationalInertia() {
        if (this._properties.shapeType == CollisionShape.POLYGON) {
            return 1 / 12 * this._properties.mass * (this._properties.width * this._properties.width + this._properties.height * this._properties.height);
        }
        else if (this._properties.shapeType == CollisionShape.CIRCLE) {
            return 1 / 2 * this._properties.mass * this._properties.radius * this._properties.radius;
        }
    }

    getAABB() {
        throw new Error("getAABB() not implemented");
    }

    getTransformedVertices() {
        if (this._transformUpdateRequired) {
            let transform = new PhysicsTransform(this._properties.position.x, this._properties.position.y, this._properties.rotation);
            for (let i = 0; i < this._vertices.length; i++) {
                this._transformedVertices[i] = Vector2.transform(this._vertices[i], transform);
            }
            this._transformUpdateRequired = false;
        }
        return this._transformedVertices;
    }

    move(translation) {
        if (this._properties.invMass == 0) return;
        this._properties.position.add(translation);

    }

    moveTowards(target, dt) {
        let direction = target.sub(this._properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.move(direction.mul(speed * dt));
    }

    rotate(rotation) { // in radians
        rotation *= Math.PI / 180;
        this._properties.rotation += rotation;
        this._transformUpdateRequired = true;
    }

    rotateTowards(target, dt) {
        let direction = target.sub(this._properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.rotate(speed * dt);
    }

    moveAt(position){
        this._properties.position = position;
        this._aabbUpdateRequired = true;
        this._transformUpdateRequired = true;
    }

    rotateAt(rotation){
        this._properties.rotation = rotation;
        this._aabbUpdateRequired = true;
        this._transformUpdateRequired = true;
    }

    destroy() {
        PhysicsEngine.removeBody(this);
        this._properties = null;
        this._vertices = null;
        this._transformedVertices = null;
        this._aabb = null;
        this._aabbUpdateRequired = null;

    }
}