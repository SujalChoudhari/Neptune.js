import { Body } from "./body.js";
import { Vector2 } from "../../maths/vec2.js";
import { Maths } from "../../maths/math.js";
import { CollisionShape } from '../collisionShape.js';
import { PhysicsEngine } from '../physicsEngine.js';
import { AABB } from "../AABB.js";

/**
 * BoxBody is a Rectangle body.
 * CollisionShape of this body is a Polygon.
 * @class BoxBody
 * @extends Body
 * 
 */
export class BoxBody extends Body {
    constructor(position, width, height, density, restitution, isStatic) {
        super();
        let area = width * height;
        let mass = area * density;

        if (area < PhysicsEngine.MIN_BODY_SIZE && area > PhysicsEngine.MAX_BODY_SIZE) {
            throw new Error(`Area should be between ${PhysicsEngine.MIN_BODY_SIZE} and ${PhysicsEngine.MAX_BODY_SIZE}. Area is ${area}`);
        }

        if (density < PhysicsEngine.MIN_BODY_DENSITY && density > PhysicsEngine.MAX_BODY_DENSITY) {
            throw new Error(`Density should be between ${PhysicsEngine.MIN_BODY_DENSITY} and ${PhysicsEngine.MAX_BODY_DENSITY}. Density is ${density}`);
        }
        this._properties.shapeType = CollisionShape.POLYGON;
        this._properties.position = position;
        this._properties.width = width;
        this._properties.height = height;
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

        this._vertices = this.createBoxVertices();
        
        PhysicsEngine.addBody(this);

        
    }

    /**
     * Width of the box
     * @type {number}
     * @readonly
     */
    get width(){
        return this._properties.width;
    }

    /**
     * Height of the box
     * @type {number}
     * @readonly
     */
    get height(){
        return this._properties.height;
    }

    createBoxVertices() {
        let width = this._properties.width;
        let height = this._properties.height;
        let vertices = [];
        vertices.push(new Vector2(-width / 2, -height / 2));
        vertices.push(new Vector2(width / 2, -height / 2));
        vertices.push(new Vector2(width / 2, height / 2));
        vertices.push(new Vector2(-width / 2, height / 2));
        
        return vertices;
    }

    calculateRotationalInertia() {
        return 1 / 12 * this._properties.mass * (this._properties.width * this._properties.width + this._properties.height * this._properties.height);
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
