
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
        this._properties.shapeType = CollisionShape.POLYGON;
        this._properties.position = position;
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

        this._vertices = vertices;
       

        
        PhysicsEngine.addBody(this);
    }


    calculateRotationalInertia() {
        let width = this._properties.area /2;
        let height = this._properties.area /2;
        return 1 / 12 * this._properties.mass * (width * width + height * height);
    }

    getAABB() {
        if (this._aabbUpdateRequired) {
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
            this._aabb = new AABB(min, max);
            this._aabbUpdateRequired = false;
        }
        return this._aabb;
    }
}
