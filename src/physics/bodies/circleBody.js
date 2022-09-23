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

        this._properties.shapeType = CollisionShape.CIRCLE;
        this._properties.position = position;
        this._properties.radius = radius;
        this._properties.area = area;
        this._properties.density = density;
        this._properties.mass = mass;
        this._properties.restitution = Maths.clamp(restitution, 0, 1);
        this._properties.isStatic = isStatic;
        this._properties.inertia = this.calculateRotationalInertia();
        this._properties.rotation = 0;


        if (isStatic) {
            this._properties.invMass = 0;
            this._properties.invInertia = 0;
        }

        else {
            this._properties.invMass = 1 / mass;
            this._properties.invInertia = 1 / this._properties.inertia;
        }

        this._vertices = this.createVertices();

        PhysicsEngine.addBody(this);

    }

    getAABB() {

        if (this._aabbUpdateRequired) {
            let min = new Vector2(Infinity, Infinity);
            let max = new Vector2(-Infinity, -Infinity);

            let pos = this._properties.position;
            let rad = this._properties.radius;
            min.x = pos.x - rad;
            min.y = pos.y - rad;
            max.x = pos.x + rad;
            max.y = pos.y + rad;


            this._aabb = new AABB(min, max);
            this._aabbUpdateRequired = false;
        }
        return this._aabb;
    }

    createVertices() {
        let vertices = [];
        let numPoints = 4;
        let angle = 0;
        let angleIncrement = 2 * Math.PI / numPoints;
        for (let i = 0; i < numPoints; i++) {
            let x = this._properties.radius * Math.cos(angle);
            let y = this._properties.radius * Math.sin(angle);
            vertices.push(new Vector2(x, y));
            angle += angleIncrement;
        }
        return vertices;
    }

    calculateRotationalInertia() {
        return 1 / 2 * this._properties.mass * this._properties.radius * this._properties.radius;

    }
}