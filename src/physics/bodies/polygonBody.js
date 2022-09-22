
import { Body } from "./body.js";
import { Vector2 } from "../../maths/vec2.js";
import { Maths } from "../../maths/math.js";
import { CollisionShape } from '../collisionShape.js';
import { PhysicsEngine } from '../physicsEngine.js';
import { AABB } from "../AABB.js";

    
export class PolygonBody extends Body {
    constructor(position, vertices, density, restitution, isStatic) {
        super();
        let area = 0;
        let j = vertices.length - 1;
        for (let i = 0; i < vertices.length; i++) {
            area += (vertices[j].x + vertices[i].x) * (vertices[j].y - vertices[i].y);
            j = i;
        }
        area *= 0.5;

        let mass = area * density;

        if (area < PhysicsEngine.MIN_BODY_SIZE && area > PhysicsEngine.MAX_BODY_SIZE) {
            throw new Error(`Area should be between ${PhysicsEngine.MIN_BODY_SIZE} and ${PhysicsEngine.MAX_BODY_SIZE}. Area is ${area}`);
        }

        if (density < PhysicsEngine.MIN_BODY_DENSITY && density > PhysicsEngine.MAX_BODY_DENSITY) {
            throw new Error(`Density should be between ${PhysicsEngine.MIN_BODY_DENSITY} and ${PhysicsEngine.MAX_BODY_DENSITY}. Density is ${density}`);
        }
        this.properties.shapeType = CollisionShape.POLYGON;
        this.properties.position = position;
        this.properties.area = area;
        this.properties.density = density;
        this.properties.mass = mass;
        this.properties.restitution = Maths.clamp(restitution, 0, 1);
        this.properties.isStatic = isStatic;
        this.properties.inertia = this.calculateRotationalInertia();

        if (isStatic) {
            this.properties.invMass = 0;
            this.properties.invInertia = 0;
        }
        else {
            this.properties.invMass = 1 / mass;
            this.properties.invInertia = 1 / this.properties.inertia;
        }

        this.vertices = vertices;
        
        PhysicsEngine.addBody(this);
    }


    calculateRotationalInertia() {
        return 1 / 12 * this.properties.mass * (this.properties.width * this.properties.width + this.properties.height * this.properties.height);
    }

    getAABB() {
        if (this.aabbUpdateRequired) {
            let min = new Vector2(Infinity, Infinity);
            let max = new Vector2(-Infinity, -Infinity);

            let vertices = this.getTransformedVertices();
            for (let i = 0; i < vertices.length; i++) {
                let v = vertices[i];

                if (v.x < min.x) min.x = v.x;
                if (v.y < min.y) min.y = v.y;
                if (v.x > max.x) max.x = v.x;
                if (v.y > max.y) max.y = v.y;
            }
            this.aabb = new AABB(min, max);
            this.aabbUpdateRequired = false;
        }
        return this.aabb;
    }
}
