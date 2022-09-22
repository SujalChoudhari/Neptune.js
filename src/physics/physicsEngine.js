import { Vector2 } from "../maths/vec2.js";
import { Body } from "./bodies/body.js";
import { CollisionDetection } from "./collisiondetection.js";
import { Maths } from "../maths/math.js";
import { Collision } from "./collision.js";
export class PhysicsEngine {
    //assuming 10px == 1m
    static MIN_BODY_SIZE = 1 * 1; // area in m^2
    static MAX_BODY_SIZE = 10 * 10; //area of 10x10pixels

    static MIN_DENSITY = .7; //g/cm^3
    static MAX_DENSITY = 22; //g/cm^3

    static MIN_ITERATIONS = 1;
    static MAX_ITERATIONS = 128;

    static iterations = 30;
    static gravity = new Vector2(0, 9.80 / 1000); //m/s^2
    static bodies = [];

    static collisionManifold = [];

    static partitionGrid = []; //5x5 Worldgrid
    

    set gravity(value) {
        PhysicsEngine.gravity = value.divide(100);
    }

    set iterations(value) {
        Maths.clamp(value, PhysicsEngine.MIN_ITERATIONS, PhysicsEngine.MAX_ITERATIONS);
    }


    static Init() { }

    static getBodyCount() {
        return this.bodies.length;
    }

    static addBody(body) {
        if (body instanceof Body) PhysicsEngine.bodies.push(body);
    }

    static removeBody(body) {
        if (body instanceof Body) {
            let index = PhysicsEngine.bodies.indexOf(body);
            if (index > -1) {
                PhysicsEngine.bodies.splice(index, 1);
            }
        }
    }

    static getBody(index) {
        return PhysicsEngine.bodies[index];
    }

    static Step(time) {

        for (let it = 0; it < PhysicsEngine.iterations; it++) {
            PhysicsEngine.stepBodies(time);
            PhysicsEngine.broadPhase();
            PhysicsEngine.narrowPhase(); 
        }
    }

    static stepBodies(time){
        // Movement
        for (let i = 0; i < PhysicsEngine.bodies.length; i++) {
            let body = PhysicsEngine.bodies[i];
            body.Step(time , PhysicsEngine.iterations);
        }
    }

    static broadPhase() {
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

    static narrowPhase(){
        // Collision Resolution
        for (let i = 0; i < PhysicsEngine.collisionManifold.length; i++) {
            PhysicsEngine.resolveCollision(PhysicsEngine.collisionManifold[i]);
        }
    }


    static resolveCollision(collision) {

        let bodyA = collision.bodyA;
        let bodyB = collision.bodyB;
        let collisionNormal = collision.normal;
        let depth = collision.depth;

        let relativeVelocity = bodyB.properties.linearVelocity.copy().subtract(bodyA.properties.linearVelocity.copy());
        let e = Math.min(bodyA.properties.restitution, bodyB.properties.restitution);
        let j = -(1 + e) * Maths.dot(relativeVelocity, collisionNormal);
        j /= bodyA.properties.invMass + bodyB.properties.invMass;

        let impulse = collisionNormal.copy().multiply(j);

        bodyA.addImpulse(impulse.copy().negetive());
        bodyB.addImpulse(impulse);

    }



}