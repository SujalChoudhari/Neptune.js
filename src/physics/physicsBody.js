import { Transform } from "../components/transform.js";
import { Vector2 } from "../maths/vec2.js";
import { Maths } from "../maths/math.js";
import { CollisionShape } from './collisionShape.js';
import { PhysicsEngine } from './physicsEngine.js';
import { PhysicsTransform } from "./transform.js";
import { AABB } from "./AABB.js";

export class PhysicsBody extends Transform {
    constructor(position, density, mass, restitution, area, isStatic, radius, width, height, shapeType) {
        super();
        this.properties.position = position;
        this.properties.density = density;
        this.properties.mass = mass;
        this.properties.restitution = restitution;
        this.properties.area = area;
        this.properties.isStatic = isStatic;
        this.properties.radius = radius;
        this.properties.width = width;
        this.properties.height = height;
        this.properties.shapeType = shapeType;

        this.properties.linearVelocity = new Vector2(0, 0);
        this.properties.angularVelocity = 0;
        this.properties.force = new Vector2(0, 0);
        this.properties.torque = 0;
        this.properties.airResistance = .99;

        this.aabb = undefined;
        this.aabbUpdateRequired = true;

        if (shapeType == CollisionShape.BOX) {
            this.vertices = PhysicsBody.createBoxVertices(width, height);
            this.transformedVertices = [];
            this.transformUpdateRequired = true;
            this.triangles = PhysicsBody.createBoxTriangles();
        }

        if (isStatic) this.properties.invMass = 0;
        else this.properties.invMass = 1 / mass;

        PhysicsEngine.addBody(this);
    }

    getLinearVelocity() {
        return this.properties.linearVelocity;
    }

    static createBoxVertices(width, height) {
        let vertices = [];

        vertices.push(new Vector2(-width / 2, -height / 2));
        vertices.push(new Vector2(width / 2, -height / 2));
        vertices.push(new Vector2(width / 2, height / 2));
        vertices.push(new Vector2(-width / 2, height / 2));

        return vertices;
    }

    static createBoxTriangles() {
        let triangles = [];

        triangles[0] = 0;
        triangles[1] = 1;
        triangles[2] = 2;
        triangles[3] = 0;
        triangles[4] = 2;
        triangles[5] = 3;

        return triangles;

    }


    getAABB() {

        if (this.aabbUpdateRequired) {
            let min = new Vector2(Infinity, Infinity);
            let max = new Vector2(-Infinity, -Infinity);

            if (this.properties.shapeType == CollisionShape.BOX) {
                let vertices = this.getTransformedVertices();
                for (let i = 0; i < vertices.length; i++) {
                    let v = vertices[i];

                    if (v.x < min.x) min.x = v.x;
                    if (v.y < min.y) min.y = v.y;
                    if (v.x > max.x) max.x = v.x;
                    if (v.y > max.y) max.y = v.y;
                }

            }
            else if (this.properties.shapeType == CollisionShape.CIRCLE) {
                let pos = this.properties.position;
                let rad = this.properties.radius;
                min.x = pos.x - rad;
                min.y = pos.y - rad;
                max.x = pos.x + rad;
                max.y = pos.y + rad;
            }
            else { throw new Error("Invalid shape type"); }

            this.aabb = new AABB(min, max);
            this.aabbUpdateRequired = false;
        }

        return this.aabb;

    }
    getTransformedVertices() {

        if (this.transformUpdateRequired) {
            let transform = new PhysicsTransform(this.properties.position.x, this.properties.position.y, this.properties.rotation);

            for (let i = 0; i < this.vertices.length; i++) {
                this.transformedVertices[i] = Vector2.transform(this.vertices[i], transform);
            }
            this.transformUpdateRequired = false;
        }
        return this.transformedVertices;
    }

    getAngularVelocity() {
        return this.properties.angularVelocity;
    }

    setAngularVelocity(angularVelocity) {
        this.properties.angularVelocity = angularVelocity;
    }

    move(translation) {
        if (this.properties.invMass == 0) return;
        this.properties.position.add(translation);

    }

    moveTowards(target, dt) {
        let direction = target.sub(this.properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.move(direction.mul(speed * dt));
    }

    rotate(rotation) { // in radians
        rotation *= Math.PI / 180;
        this.properties.rotation += rotation;
        this.transformUpdateRequired = true;
    }

    Step(time) { // in seconds
        if (this.properties.isStatic) return;
        let acceleration = this.properties.force.copy().multiply(this.properties.invMass);
        this.properties.linearVelocity.add(acceleration.copy().multiply(time));
        this.properties.linearVelocity.add(PhysicsEngine.gravity.copy());
        this.properties.position.add(this.properties.linearVelocity.copy().multiply(time));

        this.properties.force = new Vector2(0, 0);
        this.properties.linearVelocity.multiply(this.properties.airResistance);
        // console.log(acceleration)

        this.aabbUpdateRequired = true;
        this.transformUpdateRequired = true;
    }

    addForce(force) {
        this.properties.force.add(force);
    }

    addTorque(torque) {
        this.properties.torque += torque; // in Nm
    }

    addImpulse(impulse) {
        this.properties.linearVelocity.add(impulse.copy().multiply(this.properties.invMass));
    }

    static createCircleBody(position, density, radius, restitution = 0, isStatic) {
        let area = Math.PI * radius * radius;

        if (area < PhysicsEngine.MIN_BODY_SIZE && area > PhysicsEngine.MAX_BODY_SIZE) {
            console.error(`Area should be between ${PhysicsEngine.MIN_BODY_SIZE} and ${PhysicsEngine.MAX_BODY_SIZE}. Area is ${area}`);
        }

        if (density < PhysicsEngine.MIN_BODY_DENSITY && density > PhysicsEngine.MAX_BODY_DENSITY) {
            console.error(`Density should be between ${PhysicsEngine.MIN_BODY_DENSITY} and ${PhysicsEngine.MAX_BODY_DENSITY}. Density is ${density}`);
        }

        let mass = density * area;
        let body = new PhysicsBody(position, density, mass, Maths.clamp(restitution, 0, 1), area, isStatic, radius, 0, 0, CollisionShape.CIRCLE);
        return body;
    }

    static createBoxBody(position, density, width, height, restitution, isStatic) {
        let area = width * height;
        // console.log(area);
        let mass = density * area;

        if (area < PhysicsEngine.MIN_BODY_SIZE && area > PhysicsEngine.MAX_BODY_SIZE) {
            console.error(`Area should be between ${PhysicsEngine.MIN_BODY_SIZE} and ${PhysicsEngine.MAX_BODY_SIZE}. Area is ${area}`);
        }

        if (density < PhysicsEngine.MIN_BODY_DENSITY && density > PhysicsEngine.MAX_BODY_DENSITY) {
            console.error(`Density should be between ${PhysicsEngine.MIN_BODY_DENSITY} and ${PhysicsEngine.MAX_BODY_DENSITY}. Density is ${density}`);
        }

        let body = new PhysicsBody(position, density, mass, Maths.clamp(restitution, 0, 1), area, isStatic, 0, width, height, CollisionShape.BOX);
        return body;
    }

    destroy() {
        PhysicsEngine.removeBody(this);
        this.properties = null;
        this.vertices = null;
        this.transformedVertices = null;
        this.aabb = null;
        this.aabbUpdateRequired = null;

    }
}
