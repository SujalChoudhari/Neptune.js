import { Maths } from "../maths/math.js";
import { Vector2 } from "../neptune.js";


export class Collision {

    static intersectCircles(centerA, radiusA, centerB, radiusB) {
        let distance = Maths.distance(centerA, centerB);
        let radii = radiusA + radiusB;

        if (distance >= radii) return false;

        let normal = Maths.normalize(centerB.copy().subtract(centerA));
        let depth = radii - distance;

        return normal.multiply(depth);
    }

    static intersectPolygon(verticesA, verticesB) {

        let normal = Vector2.zero;
        let depth = Number.MAX_SAFE_INTEGER;

        let centerA = Collision.findAritmaticMean(verticesA);
        let centerB = Collision.findAritmaticMean(verticesB);
        let direction = centerB.subtract(centerA);

        let outA = Collision.projectVertices(verticesA, direction);
        let outB = Collision.projectVertices(verticesB, direction);
        if (outA.max < outB.min || outB.max < outA.min) return false;

        for (let i = 0; i < verticesA.length; i++) {
            let axis = Maths.perpendicular(verticesA[i].copy().subtract(verticesA[(i + 1) % verticesA.length]));

            let outA = Collision.projectVertices(verticesA, axis);
            let outB = Collision.projectVertices(verticesB, axis);

            if (outA.max < outB.min || outB.max < outA.min) return false;
            let axisDepth = Math.min(outA.max - outB.min, outB.max - outA.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }
        }

        for (let i = 0; i < verticesB.length; i++) {
            let axis = Maths.perpendicular(verticesB[i].copy().subtract(verticesB[(i + 1) % verticesB.length]));

            let outB = Collision.projectVertices(verticesB, axis);
            let outA = Collision.projectVertices(verticesA, axis);

            if (outA.max < outB.min || outB.max < outA.min) return false;
            let axisDepth = Math.min(outA.max - outB.min, outB.max - outA.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }
        }

        depth /= Maths.lenght(normal);
        normal = Maths.normalize(normal);

        if(Maths.dot(direction,normal) < 0) {
            normal = normal.negetive();
        }
        return normal.multiply(depth);
    }


    static intersectCirclePolygon(center, radius, vertices) {
        let normal = Vector2.zero;
        let depth = Number.MAX_SAFE_INTEGER;

        let polygonCenter = Collision.findAritmaticMean(vertices);
        let direction = polygonCenter.subtract(center);

        let outA = Collision.projectVertices(vertices, direction);
        let outB = Collision.projectCircle(center, radius, direction);
        if (outA.max < outB.min || outB.max < outA.min) return false;


        for (let i = 0; i < vertices.length; i++) {
            let axis = Maths.perpendicular(vertices[i].copy().subtract(vertices[(i + 1) % vertices.length]));

            let outPolygon = Collision.projectVertices(vertices, axis);
            let outCircle = Collision.projectCircle(center, radius, axis);

            if (outCircle.max < outPolygon.min || outPolygon.max < outCircle.min) return false;
            let axisDepth = Math.min(outCircle.max - outPolygon.min, outPolygon.max - outCircle.min);
            if (axisDepth < depth) {
                depth = axisDepth;
                normal = axis;
            }

        }

        // let closestPoint = Collision.findClosestPointOnPolygon(center, vertices);

        // let axis = Maths.normalize(closestPoint.copy().subtract(center));

        // let outPolygon = Collision.projectVertices(vertices, axis);
        // let outCircle = Collision.projectCircle(center, radius, axis);

        // if (outCircle.max < outPolygon.min || outPolygon.max < outCircle.min) return false;
        // let axisDepth = Math.min(outCircle.max - outPolygon.min, outPolygon.max - outCircle.min);
        // if (axisDepth < depth) {
        //     depth = axisDepth;
        //     normal = axis;
        // }

        // polygonCenter = Collision.findAritmaticMean(vertices);
        // direction = polygonCenter.subtract(center);

        depth /= Maths.lenght(normal);
        normal = Maths.normalize(normal);

        if (Maths.dot(direction, normal) < 0) {
            normal = normal.negetive();
        }

        return normal.multiply(depth);

    }

    static findAritmaticMean(vertices) {
        let sumX = 0;
        let sumY = 0;

        for (let i = 0; i < vertices.length; i++) {
            sumX += vertices[i].x;
            sumY += vertices[i].y;
        }

        return new Vector2(sumX / vertices.length, sumY / vertices.length);
    }

    static projectVertices(vertices, axis) {
        let min = Maths.dot(vertices[0], axis);
        let max = min;

        for (let i = 1; i < vertices.length; i++) {
            let dot = Maths.dot(vertices[i], axis);
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }

        return { min, max };
    }

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

        return closestPoint;
    }

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
        return { min, max };

    }
}