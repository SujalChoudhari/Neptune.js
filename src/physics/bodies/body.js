import { Transform } from "../../components/transform.js";
import { Vector2 } from "../../maths/vec2.js";
import { CollisionShape } from '../collisionShape.js';
import { PhysicsEngine } from '../physicsEngine.js';
import { PhysicsTransform } from "../transform.js";

/**
 * Body is the base class for all the bodies in the physics engine.
 * Body class extends the Transform class, thus it has all the properties of the Transform class.
 * No need of a seconaary transform class.
 * This class is used by the physics engine to calculate the position and rotation of the rigid bodies.
 * Instead of using this class directly, use the derived classes like CircleBody, PolygonBody, etc.
 * @interface
 * @extends Transform
 * 
 * @property {Vector2} position - The position of the body.
 * @property {number} density - The density of the body.
 * @property {number} mass - The mass of the body.
 * @property {number} restitution - The restitution of the body.
 * @property {number} area - The area of the body.
 * @property {boolean} isStatic - If the body is static.
 * @property {Vector2} linearVelocity - The linear velocity of the body.
 * @property {number} rotation - The rotation of the body.
 * @property {number} angularVelocity - The angular velocity of the body.
 * @property {Vector2} force - The force of the body.
 * @property {number} torque - The torque of the body.
 * @property {number} airResistance - The air resistance of the body.
 * @property {number} inertia - The inertia of the body.
 * 
 * @property {number} invMass - The inverse mass of the body.
 * @property {number} invInertia - The inverse inertia of the body.
 */
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

    /**
     * Position the body at the given position.
     * @type {Vector2}
     * @readonly
     */
    get position() {
        return this._properties.position;
    }

    /**
     * Rotation of the body.
     * @type {number}
     * @readonly
     */
    get rotation() {
        return this._properties.rotation;
    }

    /**
     * Linear velocity of the body.
     * @type {Vector2}
     * @readonly
     */
    get linearVelocity() {
        return this._properties.linearVelocity;
    }

    /**
     * Angular velocity of the body.
     * @type {number}
     * @readonly
     */
    get angularVelocity() {
        return this._properties.angularVelocity;
    }

    /**
     * Restitution of the body.
     * @type {number}
     * @readonly
     */
    get restitution() {
        return this._properties.restitution;
    }


    /**
     * Mass of the body.
     * @type {number}
     * @readonly
     */
    get mass() {
        return this._properties.mass;
    }

    /**
     * Inverse mass of the body. 0 if the body is static.
     * @type {number}
     * @readonly
     */
    get invMass() {
        return this._properties.invMass;
    }

    /**
     * Inverse Inertia of the body. 0 if the body is static.
     * @type {number}
     * @readonly
     */
    get invInertia() {
        return this._properties.invInertia;
    }

    /**
     * Inertia of the body.
     * @type {number}
     * @readonly
     */
    get inertia() {
        return this._properties.inertia;
    }

    /**
     * Is the body static.
     * @type {boolean}
     * @readonly
     */
    get isStatic() {
        return this._properties.isStatic;
    }

    /**
     * CollisionShape type of the body.
     * @type {CollisionShape}
     * @readonly
     */
    get shapeType() {
        return this._properties.shapeType;
    }

    /**
     * Vertices of the body.
     * @type {Vector2[]}
     * @readonly
     */
    get vertices() {
        return this._vertices;
    }

    /**
     * Area of the body.
     * @type {number}
     * @readonly
     */
    get area() {
        return this._properties.area;
    }

    /**
     * Denstiy of the body.
     * @type {number}
     * @readonly
     */
    get density() {
        return this._properties.density;
    }


    /**
     * Steps the body. This function is called by the physics engine.
     * @method
     * @protected
     * @param {number} time - delta time.
     * @param {number} iterations - number of iterations.
     * 
     */
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

    /**
     * Add a force to the body.
     * @method
     * @param {Vector2} force - The force to add.
     */
    addForce(force) {
        this._properties.force.add(force);
    }

    /**
     * Add a torque to the body.
     * @method
     * @param {number} torque - The torque to add.
     */
    addTorque(torque) {
        this._properties.torque += torque; // in Nm
    }

    /**
     * Add a torque impulse to the body.
     * @method
     * @param {number} torque - The torque impulse to add.
     */
    addTorqueImpulse(torque) {
        this._properties.angularVelocity += torque * this._properties.invInertia;
    }

    /**
     * Add a force impulse to the body.
     * @method
     * @param {Vector2} force - The force impulse to add.
     */
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

    /**
     * Get the axis aligned bounding box of the body.
     * @method
     */
    getAABB() {
        throw new Error("getAABB() not implemented");
    }

    /**
     * Get the transformed vertices of the body.
     * Always use the transformed vertices rather than the original vertices.
     * @method
     */
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

    /**
     * Move the body by a vector.
     * @method
     * @param {Vector2} translation - The translation vector.
     */
    move(translation) {
        if (this._properties.invMass == 0) return;
        this._properties.position.add(translation);

    }

    /**
     * Move a body towards a point.
     * @method
     * @param {Vector2} target - The target point.
     * @param {number} dt - The delta time.
     * 
     */
    moveTowards(target, dt) {
        let direction = target.sub(this._properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.move(direction.mul(speed * dt));
    }

    /**
     * Rotate a body by an angle. (in radians)
     * @method
     * @param {number} rotation - The rotation angle.
     */
    rotate(rotation) { // in radians
        rotation *= Math.PI / 180;
        this._properties.rotation += rotation;
        this._transformUpdateRequired = true;
    }

    /**
     * Rotate a body towards a point.
     * @method
     * @param {Vector2} target - The target point.
     * @param {number} dt - The delta time.
     * 
     */
    rotateTowards(target, dt) {
        let direction = target.sub(this._properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.rotate(speed * dt);
    }

    /**
     * Move a body at a point.
     * @method
     * @param {Vector2} position - The target point.
     */
    moveAt(position){
        this._properties.position = position;
        this._aabbUpdateRequired = true;
        this._transformUpdateRequired = true;
    }

    /**
     * Set the rotation of a body.
     * @method
     * @param {number} rotation - The rotation angle.
     */
    rotateAt(rotation){
        this._properties.rotation = rotation;
        this._aabbUpdateRequired = true;
        this._transformUpdateRequired = true;
    }

    Destroy() {
        PhysicsEngine.removeBody(this);
        this._properties = null;
        this._vertices = null;
        this._transformedVertices = null;
        this._aabb = null;
        this._aabbUpdateRequired = null;

    }
}