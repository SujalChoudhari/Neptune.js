import { Maths } from "../maths/math.js";
import { Vector2 } from "../maths/vec2.js";
import { CollisionShape } from './collisionShape.js';


export class CollisionDetection {
    static findContactPoints(bodyA,bodyB){
        if (bodyA.properties.shapeType == CollisionShape.CIRCLE && bodyB.properties.shapeType == CollisionShape.CIRCLE) {
            
            let point = CollisionDetection.findContactPoint(bodyA.properties.position, bodyA.properties.radius, bodyB.position)
            return [1,point,Vector2.zero()];
            
        }
        else if (bodyA.properties.shapeType == CollisionShape.BOX && bodyB.properties.shapeType == CollisionShape.BOX) {
            return [0,Vector2.zero(),Vector2.zero()];
        }
        else if (bodyA.properties.shapeType == CollisionShape.CIRCLE && bodyB.properties.shapeType == CollisionShape.BOX) {
            return [0,Vector2.zero(),Vector2.zero()];
        }
        else if (bodyA.properties.shapeType == CollisionShape.BOX && bodyB.properties.shapeType == CollisionShape.CIRCLE) {
            return [0,Vector2.zero(),Vector2.zero()];
        }
    }

    static findContactPoint(centerA, radiusA, centerB) {
        let ab = centerB.copy().subtract(centerA);
        direction = Maths.normalize(ab);
        let contactPoint = centerA.copy().add(direction.copy().multiply(radiusA));

        return  contactPoint;}

    static intersectCircles(centerA, radiusA, centerB, radiusB) {
        let distance = Maths.distance(centerA, centerB);
        let radii = radiusA + radiusB;

        if (distance >= radii) return false;

        let normal = Maths.normalize(centerB.copy().subtract(centerA));
        let depth = radii - distance;

        return {normal,depth};}

    static intersectPolygon(verticesA, verticesB,centerA,centerB) {

        let normal = Vector2.zero();
        let depth = Number.MAX_SAFE_INTEGER;

        let direction = centerB.subtract(centerA);
        direction = Maths.normalize(direction);

        let outA = CollisionDetection.projectVertices(verticesA, direction);
        let outB = CollisionDetection.projectVertices(verticesB, direction);
        if (outA.max < outB.min || outB.max < outA.min) return false;

        for (let i = 0; i < verticesA.length; i++) {
            let axis = Maths.perpendicular(verticesA[i].copy().subtract(verticesA[(i + 1) % verticesA.length]));
            axis = Maths.normalize(axis);
            let outA = CollisionDetection.projectVertices(verticesA, axis);
            let outB = CollisionDetection.projectVertices(verticesB, axis);

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
            let outB = CollisionDetection.projectVertices(verticesB, axis);
            let outA = CollisionDetection.projectVertices(verticesA, axis);

            if (outA.max < outB.min || outB.max < outA.min) return false;
            let axisDepth = Math.min(outA.max - outB.min, outB.max - outA.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }
        }

        if(Maths.dot(direction,normal) < 0) {
            normal = normal.negetive();
        }
        return {normal,depth};}

    static intersectCirclePolygon(center, radius, vertices,polygonCenter) {
        let normal = Vector2.zero();
        let depth = Number.MAX_SAFE_INTEGER;

        let direction = polygonCenter.subtract(center);
        direction = Maths.normalize(direction);

        let outA = CollisionDetection.projectVertices(vertices, direction);
        let outB = CollisionDetection.projectCircle(center, radius, direction);
        if (outA.max < outB.min || outB.max < outA.min) return false;


        for (let i = 0; i < vertices.length; i++) {
            let axis = Maths.perpendicular(vertices[i].copy().subtract(vertices[(i + 1) % vertices.length]));
            axis = Maths.normalize(axis);
            let outPolygon = CollisionDetection.projectVertices(vertices, axis);
            let outCircle = CollisionDetection.projectCircle(center, radius, axis);

            if (outCircle.max < outPolygon.min || outPolygon.max < outCircle.min) return false;
            let axisDepth = Math.min(outCircle.max - outPolygon.min, outPolygon.max - outCircle.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }

        }

        // let closestPoint = CollisionDetection.findClosestPointOnPolygon(center, vertices);

        // let axis = Maths.normalize(closestPoint.copy().subtract(center));

        // let outPolygon = CollisionDetection.projectVertices(vertices, axis);
        // let outCircle = CollisionDetection.projectCircle(center, radius, axis);

        // if (outCircle.max < outPolygon.min || outPolygon.max < outCircle.min) return false;
        // let axisDepth = Math.min(outCircle.max - outPolygon.min, outPolygon.max - outCircle.min);
        // if (axisDepth < depth) {
        //     depth = axisDepth;
        //     normal = axis;
        // }

        // polygonCenter = CollisionDetection.findAritmaticMean(vertices);
        // direction = polygonCenter.subtract(center);


        if (Maths.dot(direction, normal) < 0) {
            normal = normal.negetive();
        }

        return {normal,depth};}

    static projectVertices(vertices, axis) {
        let min = Maths.dot(vertices[0], axis);
        let max = min;

        for (let i = 1; i < vertices.length; i++) {
            let dot = Maths.dot(vertices[i], axis);
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }

        return { min, max };}

    static findClosestPointOnPolygon(circleCenter, vertices) {
        let closestPoint = vertices[0];
        let closestDistance = Maths.distance(circleCenter, vertices[0]);

        for (let i = 1; i < vertices.length; i++) {
            let distance = Maths.distance(circleCenter, vertices[i]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = vertices[i];
            }
        }

        return closestPoint;}

    static projectCircle(center, radius, axis) {
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
        return { min, max };}

    static collide(bodyA, bodyB) {
        if (bodyA.properties.shapeType == CollisionShape.CIRCLE && bodyB.properties.shapeType == CollisionShape.CIRCLE) {
            let out = CollisionDetection.intersectCircles(
                bodyA.getPosition(),
                bodyA.getRadius(),
                bodyB.getPosition(),
                bodyB.getRadius());
            if (out)
                return out;
        }
        else if (bodyA.properties.shapeType == CollisionShape.BOX && bodyB.properties.shapeType == CollisionShape.BOX) {
            let out = CollisionDetection.intersectPolygon(
                bodyA.getTransformedVertices(),
                bodyB.getTransformedVertices(),
                bodyA.getPosition(),
                bodyB.getPosition());
            if (out)
                return out;
        }
        else if (bodyA.properties.shapeType == CollisionShape.CIRCLE && bodyB.properties.shapeType == CollisionShape.BOX) {
            let out = CollisionDetection.intersectCirclePolygon(
                bodyA.getPosition(),
                bodyA.getRadius(),
                bodyB.getTransformedVertices(),
                bodyB.getPosition());
            if (out)
                return out;
        }
        else if (bodyA.properties.shapeType == CollisionShape.BOX && bodyB.properties.shapeType == CollisionShape.CIRCLE) {
            let out = CollisionDetection.intersectCirclePolygon(
                bodyB.getPosition(),
                bodyB.getRadius(),
                bodyA.getTransformedVertices(),
                bodyA.getPosition());
            if (out)
                return { normal: out.normal.negetive(), depth: out.depth };

        }

        return { normal: null, depth: 0 }}
}