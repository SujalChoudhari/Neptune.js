import { Vector2 } from "../maths/vec2.js";
import { Body } from "./bodies/body.js";
import { CollisionDetection } from "./collisiondetection.js";
import { Maths } from "../maths/math.js";
import { Collision } from "./collision.js";

/**
 * PhysicsEngine is the main class for the physics engine.
 * All the physics calculations are done here. All the bodies in the simulation are updated here.
 * This class is initialized in the engine and is used by the engine to update the physics.
 * No need to initialize this class manually and no need to call any of the methods manually.
 * @class PhysicsEngine
 * 
 */
export class PhysicsEngine {

    /**
     * Minimum area of the body required to be simulated. 
     * Bodies with area less than this will not be simulated/created. (in m^2)
     * @type {number}
     * @readonly
     */
    static get MIN_BODY_SIZE() { return 1 * 1; } // area in m^2

    /**
     * Maximum area of the body required to be simulated.
     * Bodies with area greater than this will not be simulated/created. (in m^2)
     * @type {number}
     * @readonly
     */
    static get MAX_BODY_SIZE() { return 100 * 100; } // area in m^2

    /**
     * Minimum density of the body required to be simulated.
     * Bodies with density less than this will not be simulated/created. (in g/cm^3)
     * @type {number}
     * @readonly
     */
    static get MIN_DENSITY() { return 0.7; } // g/cm^3

    /**
     * Maximum density of the body required to be simulated.
     * Bodies with density greater than this will not be simulated/created. (in g/cm^3)
     * @type {number}
     * @readonly
     */
    static get MAX_DENSITY() { return 22; } // g/cm^3

    /**
     * Minimum iterations of the physics engine in each frame.
     * @type {number}
     * @readonly
     */
    static get MIN_ITERATIONS() { return 1; }

    /**
     * Maximum iterations of the physics engine in each frame.
     * @type {number}
     * @readonly
     */
    static get MAX_ITERATIONS() { return 64; }


    /**
     * Current Iterations of the physics engine in each frame.
     * @type {number}
     */
    static iterations = 30;

    /**
     * The gravity vector of the physics engine. in m/s^2
     * @type {Vector2}
     */
    static gravity = new Vector2(0, 9.80 / 1000); // in m/s^2

    /**
     * List of all the bodies in the physics engine.
     * @readonly
     * @type {Array<Body>}
     */
    static bodies = [];

    /**
     * List of Collision Manifolds
     * @type {Array<Collision>}
     * @readonly
     */
    static collisionManifold = [];


    static set gravity(value) {
        PhysicsEngine.gravity = value.divide(100);
    }

    static set iterations(value) {
        Maths.clamp(value, PhysicsEngine.MIN_ITERATIONS, PhysicsEngine.MAX_ITERATIONS);
    }


    /**
     * Initializes the physics engine.
     * Automatically called by the engine.
     * @protected
     * @method
     */
    static Init() { }


    /**
     * Get the total no of bodies in the physics engine.
     * @method
     * @returns {number}
     */
    static getBodyCount() {
        return this.bodies.length;
    }

    /**
     * Add a body to the physics engine.
     * Note: Physics Bodies will add themselves to the physics engine automatically.
     * @param {Body} body
     * @method
     * @protected
     */
    static addBody(body) {
        if (body instanceof Body) PhysicsEngine.bodies.push(body);
    }

    /**
     * Remove a body from the physics engine.
     * Note: Physics Bodies will remove themselves when they are destroyed.
     * @param {Body} body
     * @method
     * @protected
     */
    static removeBody(body) {
        if (body instanceof Body) {
            let index = PhysicsEngine.bodies.indexOf(body);
            if (index > -1) {
                PhysicsEngine.bodies.splice(index, 1);
            }
        }
    }


    /**
     * Get a physics Body from the physics engine.
     * @param {number} index - Index of the body in the physics engine.
     * @returns {Body}
     * @method
     */
    static getBody(index) {
        return PhysicsEngine.bodies[index];
    }

    /**
     * Step the physics engine.
     * All the physics calculations are done here.
     * Collision are detected, resolved and all the bodies are updated.
     * This method is called by the engine automatically based on the iteration count.
     * @method
     * @protected
     * @param {number} time - delta time in seconds.
     */
    static Step(time) {

        for (let it = 0; it < PhysicsEngine.iterations; it++) {
            PhysicsEngine.#stepBodies(time);
            PhysicsEngine.#broadPhase();
            PhysicsEngine.#narrowPhase();
        }
    }

    static #stepBodies(time) {
        // Movement
        for (let i = 0; i < PhysicsEngine.bodies.length; i++) {
            let body = PhysicsEngine.bodies[i];
            body.Step(time, PhysicsEngine.iterations);
        }
    }

    static #broadPhase() {
        // CollisionDetection
        PhysicsEngine.collisionManifold = [];
        for (let i = 0; i < PhysicsEngine.bodies.length - 1; i++) {
            let bodyA = PhysicsEngine.bodies[i];
            let bodyAaabb = bodyA.getAABB();
            for (let j = i + 1; j < PhysicsEngine.bodies.length; j++) {
                let bodyB = PhysicsEngine.bodies[j];
                let bodyBaabb = bodyB.getAABB();
                if (bodyA.isStatic && bodyB.isStatic) continue;


                if (!CollisionDetection.intersectAABB(bodyAaabb, bodyBaabb)) continue;


                let out = CollisionDetection.collide(bodyA, bodyB);
                if (out.normal) {

                    bodyA.move(out.normal.copy().multiply(-out.depth / 2));
                    bodyB.move(out.normal.copy().multiply(out.depth / 2));

                    let data = CollisionDetection.findContactPoints(bodyA, bodyB);
                    let collisionManifold = new Collision(bodyA, bodyB,
                        out.normal, out.depth,
                        data.count, data.contact1, data.contact2);

                    PhysicsEngine.collisionManifold.push(collisionManifold);
                }
            }
        }
    }

    static #narrowPhase() {
        // Collision Resolution
        for (let i = 0; i < PhysicsEngine.collisionManifold.length; i++) {
            PhysicsEngine.#resolveCollisionWithRotation(PhysicsEngine.collisionManifold[i]);
        }
    }


    static #resolveCollisionBasic(collision) {

        let bodyA = collision.bodyA;
        let bodyB = collision.bodyB;
        let collisionNormal = collision.normal;

        let relativeVelocity = bodyB.linearVelocity.copy().subtract(bodyA.linearVelocity.copy());
        if (Maths.dot(relativeVelocity, collisionNormal) > 0) return;

        let e = Math.min(bodyA.restitution, bodyB.restitution); // Restitution
        let j = -(1 + e) * Maths.dot(relativeVelocity, collisionNormal);
        j /= bodyA.invMass + bodyB.invMass

        let impulse = collisionNormal.copy().multiply(j);
        bodyA.addImpulse(impulse.copy().negetive());
        bodyB.addImpulse(impulse);
    }

    static #resolveCollisionWithRotation(collision) {
        let bodyA = collision.bodyA;
        let bodyB = collision.bodyB;
        let normal = collision.normal;
        let contactPoint1 = collision.contactPoint1;
        let contactPoint2 = collision.contactPoint2;
        let contactPointCount = collision.contactPointCount;

        let contactList = [contactPoint1, contactPoint2];
        let impulseList = [];
        let raList = [];
        let rbList = [];

        let e = (bodyA.restitution + bodyB.restitution) / 2; // Restitution

        for (let i = 0; i < contactPointCount; i++) {
            let ra = contactList[i].copy().subtract(bodyA.position);
            let rb = contactList[i].copy().subtract(bodyB.position);
            raList[i] = ra;
            rbList[i] = rb;

            let raPerpendicular = new Vector2(-ra.y, ra.x);
            let rbPerpendicular = new Vector2(-rb.y, rb.x);

            let angularLinearVelocityA = raPerpendicular.copy().multiply(bodyA.angularVelocity);
            let angularLinearVelocityB = rbPerpendicular.copy().multiply(bodyB.angularVelocity);

            let bLinearAngular = bodyB.linearVelocity.copy().add(angularLinearVelocityB)
            let aLinearAngular = bodyA.linearVelocity.copy().add(angularLinearVelocityA)
            let relativeVelocity = bLinearAngular.subtract(aLinearAngular);


            let contactVelocityMagnitude = Maths.dot(relativeVelocity, normal);

            if (Maths.dot(relativeVelocity, normal) > 0) continue;

            let raPerpendicularDotNormal = Maths.dot(raPerpendicular, normal);
            let rbPerpendicularDotNormal = Maths.dot(rbPerpendicular, normal);

            let j = -(1 + e) * contactVelocityMagnitude;
            j /= bodyA.invMass + bodyB.invMass +
                (raPerpendicularDotNormal * raPerpendicularDotNormal) * bodyA.invInertia +
                (rbPerpendicularDotNormal * rbPerpendicularDotNormal) * bodyB.invInertia;

            j /= contactPointCount;

            let impulse = normal.copy().multiply(j);
            impulseList[i] = impulse;
        }

        for (let j = 0; j < contactPointCount; j++) {

            let impulse = impulseList[j];
            if (impulse == undefined) continue;


            let ra = raList[j];
            let rb = rbList[j];
            bodyA.addTorqueImpulse(-Maths.cross(ra, impulse));
            bodyB.addTorqueImpulse(Maths.cross(rb, impulse));

            bodyA.addImpulse(impulse.copy().negetive());
            bodyB.addImpulse(impulse);

        }
    }
}