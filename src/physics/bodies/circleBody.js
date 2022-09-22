import { Transform } from "../../components/transform.js";
import { Vector2 } from "../../maths/vec2.js";
import { Maths } from "../../maths/math.js";
import { CollisionShape } from '../collisionShape.js';
import { PhysicsEngine } from '../physicsEngine.js';
import { PhysicsTransform } from "../transform.js";
import { AABB } from "../AABB.js";
import { Body } from "./body.js";
export class CircleBody extends Body {
    constructor(position, radius, density, restitution, isStatic) {
        super();
        let area = Math.PI * radius * radius;
        let mass = area * density;

        if (area < PhysicsEngine.MIN_BODY_SIZE && area > PhysicsEngine.MAX_BODY_SIZE) {
            throw new Error(`Area should be between ${PhysicsEngine.MIN_BODY_SIZE} and ${PhysicsEngine.MAX_BODY_SIZE}. Area is ${area}`);
        }

        if (density < PhysicsEngine.MIN_BODY_DENSITY && density > PhysicsEngine.MAX_BODY_DENSITY) {
            throw new Error(`Density should be between ${PhysicsEngine.MIN_BODY_DENSITY} and ${PhysicsEngine.MAX_BODY_DENSITY}. Density is ${density}`);
        }

        this.properties.shapeType = CollisionShape.CIRCLE;
        this.properties.position = position;
        this.properties.radius = radius;
        this.properties.area = area;
        this.properties.density = density;
        this.properties.mass = mass;
        this.properties.restitution = Maths.clamp(restitution, 0, 1);
        this.properties.isStatic = isStatic;
        this.properties.inertia = this.calculateRotationalInertia();
        this.properties.rotation = 0;


        if (isStatic) {
            this.properties.invMass = 0;
            this.properties.invInertia = 0;
        }

        else {
            this.properties.invMass = 1 / mass;
            this.properties.invInertia = 1 / this.properties.inertia;
        }

        this.vertices = this.createVertices();

        PhysicsEngine.addBody(this);

    }

    getAABB() {

        if (this.aabbUpdateRequired) {
            let min = new Vector2(Infinity, Infinity);
            let max = new Vector2(-Infinity, -Infinity);

            let pos = this.properties.position;
            let rad = this.properties.radius;
            min.x = pos.x - rad;
            min.y = pos.y - rad;
            max.x = pos.x + rad;
            max.y = pos.y + rad;


            this.aabb = new AABB(min, max);
            this.aabbUpdateRequired = false;
        }
        return this.aabb;
    }

    createVertices() {
        let vertices = [];
        let numPoints = 4;
        let angle = 0;
        let angleIncrement = 2 * Math.PI / numPoints;
        for (let i = 0; i < numPoints; i++) {
            let x = this.properties.radius * Math.cos(angle);
            let y = this.properties.radius * Math.sin(angle);
            vertices.push(new Vector2(x, y));
            angle += angleIncrement;
        }
        return vertices;
    }

    calculateRotationalInertia() {
        return 1 / 2 * this.properties.mass * this.properties.radius * this.properties.radius;

    }
}