import { Vector2 } from "../maths/vec2.js";
import { PhysicsBody } from "./physicsBody.js";
import { CollisionShape } from "./collisionShape.js";
import { Collision } from "./collision.js";
import { PhysicsTransform } from "./transform.js";
import { Maths } from "../maths/math.js";
export class PhysicsEngine {
    //assuming 10px == 1m
    static MIN_BODY_SIZE = 1 * 1; // area in m^2
    static MAX_BODY_SIZE = 10 * 10; //area of 10x10pixels

    static MIN_DENSITY = .7; //g/cm^3
    static MAX_DENSITY = 22; //g/cm^3

    static gravity = new Vector2(0, 9.81); //m/s^2
    static bodies = [];



    static Init() {

    }

    static getBodyCount() {
        return this.bodies.length;
    }

    static addBody(body) {
        if (body instanceof PhysicsBody) PhysicsEngine.bodies.push(body);
    }

    static removeBody(body) {
        if (body instanceof PhysicsBody) {
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

        // Movement
        for (let i = 0; i < PhysicsEngine.bodies.length; i++) {
            let body = PhysicsEngine.bodies[i];
            if (!body.isStatic) {
                body.Step(time);
            }
        }

        // Collision
        for (let i = 0; i < PhysicsEngine.bodies.length - 1; i++) {
            let bodyA = PhysicsEngine.bodies[i];
            for (let j = i + 1; j < PhysicsEngine.bodies.length; j++) {
                let bodyB = PhysicsEngine.bodies[j]
                let out = PhysicsEngine.collide(bodyA, bodyB);
                if (out.normal) {
                    bodyA.addForce(out.normal.copy().multiply(-out.depth));
                    bodyB.addForce(out.normal.copy().multiply(out.depth));

                    // PhysicsEngine.resolveCollision(bodyB,bodyA, out.normal);
                }
            }
        }
    }

    // static resolveCollision(bodyA, bodyB, collisionNormal) {
    //     let m1 = bodyA.properties.mass;
    //     let m2 = bodyB.properties.mass;
    //     let v1 = bodyA.properties.linearVelocity;
    //     let v2 = bodyB.properties.linearVelocity;
    //     let impulse = PhysicsEngine.calculateImpulse(bodyA, bodyB, collisionNormal);
    //     bodyA.properties.linearVelocity = v1.subtract(impulse.copy().multiply(1 / m1));
    //     bodyB.properties.linearVelocity = v2.add(impulse.copy().multiply(1 / m2));
    // }

    // static calculateImpulse(bodyA, bodyB, collisionNormal) {
    //     let v1 = bodyA.properties.linearVelocity;
    //     let v2 = bodyB.properties.linearVelocity;
    //     let relV = v2.subtract(v1);
    //     let m1 = bodyA.properties.mass;
    //     let m2 = bodyB.properties.mass;
    //     let e = Math.min(bodyA.properties.restitution, bodyB.properties.restitution);

    //     let j = (-(1 + e) * Maths.dot(relV, collisionNormal)) / (1 / m1 + 1 / m2);
    //     return collisionNormal.copy().multiply(j);
    // }

    static collide(bodyA, bodyB) {
        if (bodyA.properties.shapeType == CollisionShape.CIRCLE && bodyB.properties.shapeType == CollisionShape.CIRCLE) {
            let out = Collision.intersectCircles(bodyA.getPosition(), bodyA.getRadius(), bodyB.getPosition(), bodyB.getRadius());
            if (out) return out;
        }
        else if (bodyA.properties.shapeType == CollisionShape.BOX && bodyB.properties.shapeType == CollisionShape.BOX) {
            let out = Collision.intersectPolygon(bodyA.getTransformedVertices(), bodyB.getTransformedVertices())
            if (out) return out;
        }
        else if (bodyA.properties.shapeType == CollisionShape.CIRCLE && bodyB.properties.shapeType == CollisionShape.BOX) {
            let out = Collision.intersectCirclePolygon(bodyA.getPosition(), bodyA.getRadius(), bodyB.getTransformedVertices());
            if (out) return out;
        }
        else if (bodyA.properties.shapeType == CollisionShape.BOX && bodyB.properties.shapeType == CollisionShape.CIRCLE) {
            let out = Collision.intersectCirclePolygon(bodyB.getPosition(), bodyB.getRadius(), bodyA.getTransformedVertices());
            if (out) return { normal: out.normal.negetive(), depth: out.depth };
        }

        return { normal: null, depth: 0 }
    }

}