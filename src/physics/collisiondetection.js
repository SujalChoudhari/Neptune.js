import { Maths } from "../maths/math.js";
import { Vector2 } from "../maths/vec2.js";
import { CollisionShape } from './collisionShape.js';

/**
 * Collision Detection is used by the physics engine to detect the collisions.
 * @class CollisionDetection
 * 
 */
export class CollisionDetection {

    /**
     * Get collision points between two Bodies
     * @param {Body} bodyA
     * @param {Body} bodyB
     * 
     * @returns {Array} - [count, contact1, contact2]
     *  count: number of contacts
     *  contact1: first contact point
     *  contact2: second contact point
     */
    static findContactPoints(bodyA, bodyB) {
        
        if (bodyA._properties.shapeType == CollisionShape.CIRCLE && bodyB._properties.shapeType == CollisionShape.CIRCLE) {

            let point = CollisionDetection.#findContactPoint(bodyA._properties.position, bodyA._properties.radius, bodyB._properties.position)
            return { count: 1, contact1: point, contact2: Vector2.zero() };

        }
        else if (bodyA._properties.shapeType == CollisionShape.POLYGON && bodyB._properties.shapeType == CollisionShape.POLYGON) {
            let data = CollisionDetection.#findContactPointsPolygonPolygon(bodyA.getTransformedVertices(), bodyB.getTransformedVertices());
            if(data.count == 2) debugger;
            return { count: data.count, contact1: data.contact1, contact2: data.contact2 };
        }
        else if (bodyA._properties.shapeType == CollisionShape.CIRCLE && bodyB._properties.shapeType == CollisionShape.POLYGON) {
            let point = CollisionDetection.#findContactPointPolygonCircle(
                bodyA.getPosition(), bodyA.getRadius(),
                bodyB.getPosition(), bodyB.getTransformedVertices());
            return { count: 1, contact1: point, contact2: Vector2.zero() };
        }
        else if (bodyA._properties.shapeType == CollisionShape.POLYGON && bodyB._properties.shapeType == CollisionShape.CIRCLE) {
            let point = CollisionDetection.#findContactPointPolygonCircle(
                bodyB.getPosition(), bodyB.getRadius(),
                bodyA.getPosition(), bodyA.getTransformedVertices());
            return { count: 1, contact1: point, contact2: Vector2.zero() };
        }
        else return [0, Vector2.zero(), Vector2.zero()];
    }

    static #findContactPoint(centerA, radiusA, centerB) {
        let ab = centerB.copy().subtract(centerA);
        let direction = Maths.normalize(ab);
        let contactPoint = centerA.copy().add(direction.copy().multiply(radiusA));

        return contactPoint;
    }

    static #findContactPointPolygonCircle(center, radius, polygonCenter, vertices) {
        
        let minSquaredDist = Maths.VERY_LARGE_NUMBER;
        let contactPoint;
        for (let i = 0; i < vertices.length; i++) {
            let va = vertices[i];
            let vb = vertices[(i + 1) % vertices.length]

            let out = CollisionDetection.#pointSegmentDistance(center, va, vb);

            
            if (out.distanceSq < minSquaredDist) {
                minSquaredDist = out.distanceSq;
                contactPoint = out.contact;
            }


        }
        return contactPoint;
    }

    static #findContactPointsPolygonPolygon(verticesA, verticesB) {
        let count = 0; let contact1; let contact2;
        // debugger;
        let minSquaredDist = Maths.VERY_LARGE_NUMBER;

        for (let i = 0; i < verticesA.length; i++) {
            let p = verticesA[i];

            for (let j = 0; j < verticesB.length; j++) {
                let va = verticesA[j];
                let vb = verticesB[(j + 1) % verticesB.length];

                let out = CollisionDetection.#pointSegmentDistance(p, va, vb);
                if (Maths.nearlyEqual(out.distanceSq, minSquaredDist)) {
                    if (!Maths.nearlyEqual(out.distanceSq, minSquaredDist)) {
                        count = 2;
                        contact2 = out.contact;
                    }
                }

                if (out.distanceSq < minSquaredDist) {
                    minSquaredDist = out.distanceSq;
                    count = 1;
                    contact1 = out.contact;
                }

            }
            return { count, contact1, contact2 };
        }

        for (let i = 0; i < verticesB.length; i++) {
            let p = verticesB[i];

            for (let j = 0; j < verticesA.length; j++) {
                let va = verticesA[j];
                let vb = verticesA[(j + 1) % verticesA.length];

                let out = CollisionDetection.#pointSegmentDistance(p, va, vb);

                if (Maths.nearlyEqual(out.distanceSq, minSquaredDist)) {
                    if (!Maths.nearlyEqual(out.distanceSq, minSquaredDist)) {
                        count = 2;
                        contact2 = out.contact;
                    }
                }

                if (out.distanceSq < minSquaredDist) {
                    minSquaredDist = out.distanceSq;
                    count = 1;
                    contact1 = out.contact;
                }

            }
        }
    }

    static #intersectCircles(centerA, radiusA, centerB, radiusB) {
        let distance = Maths.distance(centerA, centerB);
        let radii = radiusA + radiusB;

        if (distance >= radii) return false;

        let normal = Maths.normalize(centerB.copy().subtract(centerA));
        let depth = radii - distance;

        return { normal, depth };
    }

    static #intersectPolygon(verticesA, verticesB, centerA, centerB) {

        let normal = Vector2.zero();
        let depth = Number.MAX_SAFE_INTEGER;

        let direction = centerB.subtract(centerA);
        direction = Maths.normalize(direction);

        let outA = CollisionDetection.#projectVertices(verticesA, direction);
        let outB = CollisionDetection.#projectVertices(verticesB, direction);
        if (outA.max < outB.min || outB.max < outA.min) return false;

        for (let i = 0; i < verticesA.length; i++) {
            let axis = Maths.perpendicular(verticesA[i].copy().subtract(verticesA[(i + 1) % verticesA.length]));
            axis = Maths.normalize(axis);
            let outA = CollisionDetection.#projectVertices(verticesA, axis);
            let outB = CollisionDetection.#projectVertices(verticesB, axis);

            if (outA.max < outB.min || outB.max < outA.min) return false;
            let axisDepth = Math.min(outA.max - outB.min, outB.max - outA.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }
        }

        for (let i = 0; i < verticesB.length; i++) {
            let axis = Maths.perpendicular(verticesB[i].copy().subtract(verticesB[(i + 1) % verticesB.length]));
            axis = Maths.normalize(axis);
            let outB = CollisionDetection.#projectVertices(verticesB, axis);
            let outA = CollisionDetection.#projectVertices(verticesA, axis);

            if (outA.max < outB.min || outB.max < outA.min) return false;
            let axisDepth = Math.min(outA.max - outB.min, outB.max - outA.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }
        }

        if (Maths.dot(direction, normal) < 0) {
            normal = normal.negetive();
        }
        return { normal, depth };
    }

    static #intersectCirclePolygon(center, radius, vertices, polygonCenter) {
        let normal = Vector2.zero();
        let depth = Number.MAX_SAFE_INTEGER;

        let direction = polygonCenter.subtract(center);
        direction = Maths.normalize(direction);

        let outA = CollisionDetection.#projectVertices(vertices, direction);
        let outB = CollisionDetection.#projectCircle(center, radius, direction);
        if (outA.max < outB.min || outB.max < outA.min) return false;


        for (let i = 0; i < vertices.length; i++) {
            let axis = Maths.perpendicular(vertices[i].copy().subtract(vertices[(i + 1) % vertices.length]));
            axis = Maths.normalize(axis);
            let outPolygon = CollisionDetection.#projectVertices(vertices, axis);
            let outCircle = CollisionDetection.#projectCircle(center, radius, axis);

            if (outCircle.max < outPolygon.min || outPolygon.max < outCircle.min) return false;
            let axisDepth = Math.min(outCircle.max - outPolygon.min, outPolygon.max - outCircle.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }

        }


        if (Maths.dot(direction, normal) < 0) {
            normal = normal.negetive();
        }

        return { normal, depth };
    }

    static #projectVertices(vertices, axis) {

        let min = Maths.dot(vertices[0], axis);
        let max = min;

        for (let i = 1; i < vertices.length; i++) {
            let dot = Maths.dot(vertices[i], axis);
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }

        return { min, max };
    }

    // /**
    //  * 
    //  * @param {*} circleCenter 
    //  * @param {*} vertices 
    //  * @returns 
    //  */
    // static findClosestPointOnPolygon(circleCenter, vertices) {
    //     let closestPoint = vertices[0];
    //     let closestDistance = Maths.distance(circleCenter, vertices[0]);

    //     for (let i = 1; i < vertices.length; i++) {
    //         let distance = Maths.distance(circleCenter, vertices[i]);
    //         if (distance < closestDistance) {
    //             closestDistance = distance;
    //             closestPoint = vertices[i];
    //         }
    //     }

    //     return closestPoint;
    // }

    static #projectCircle(center, radius, axis) {
        let direction = Maths.normalize(axis);
        let directionAndRadius = direction.multiply(radius);
        let p1 = center.copy().subtract(directionAndRadius);
        let p2 = center.copy().add(directionAndRadius);

        let min = Maths.dot(p1, axis);
        let max = Maths.dot(p2, axis);

        if (min > max) {
            let temp = min;
            min = max;
            max = temp;
        }
        return { min, max };
    }


    /**
     * Checks if two Bodies are colliding
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @returns {boolean}
     */
    static collide(bodyA, bodyB) {
        if (bodyA._properties.shapeType == CollisionShape.CIRCLE && bodyB._properties.shapeType == CollisionShape.CIRCLE) {
            let out = CollisionDetection.#intersectCircles(
                bodyA.getPosition(),
                bodyA.getRadius(),
                bodyB.getPosition(),
                bodyB.getRadius());
            if (out)
                return out;
        }
        else if (bodyA._properties.shapeType == CollisionShape.POLYGON && bodyB._properties.shapeType == CollisionShape.POLYGON) {
            let out = CollisionDetection.#intersectPolygon(
                bodyA.getTransformedVertices(),
                bodyB.getTransformedVertices(),
                bodyA.getPosition(),
                bodyB.getPosition());
            if (out)
                return out;
        }
        else if (bodyA._properties.shapeType == CollisionShape.CIRCLE && bodyB._properties.shapeType == CollisionShape.POLYGON) {
            let out = CollisionDetection.#intersectCirclePolygon(
                bodyA.getPosition(),
                bodyA.getRadius(),
                bodyB.getTransformedVertices(),
                bodyB.getPosition());
            if (out)
                return out;
        }
        else if (bodyA._properties.shapeType == CollisionShape.POLYGON && bodyB._properties.shapeType == CollisionShape.CIRCLE) {
            let out = CollisionDetection.#intersectCirclePolygon(
                bodyB.getPosition(),
                bodyB.getRadius(),
                bodyA.getTransformedVertices(),
                bodyA.getPosition());
            if (out)
                return { normal: out.normal.negetive(), depth: out.depth };

        }

        return { normal: null, depth: 0 }
    }

    /**
     * Checks if 2 AABB (Axis Aligned Bounding Box) are colliding
     * @param {AABB} a - First AABB
     * @param {AABB} b - Second AABB
     * @returns {boolean} - True if colliding, false otherwise
     */
    static intersectAABB(a, b) {
        return (a.min.x <= b.max.x && a.max.x >= b.min.x) &&
            (a.min.y <= b.max.y && a.max.y >= b.min.y);
    }

    static #pointSegmentDistance(point, a, b) {
        let ab = b.copy().subtract(a);
        let ap = point.copy().subtract(a);

        let proj = Maths.dot(ap, ab);
        let lenSq = Maths.lenghtSq(ab);

        let d = proj / lenSq;

        let contact;

        if (d <= 0) {
            contact = a;
        }
        else if (d >= 1) {
            contact = b;
        }
        else {
            contact = a.copy().add(ab.copy().multiply(d));
        }

        let distanceSq = Maths.distanceSq(point, contact);

        return { contact, distanceSq };

    }
}