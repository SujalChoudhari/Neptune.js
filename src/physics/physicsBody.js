import { Transform} from "../components/transform.js";
import { Vector2 } from "../maths/vec2.js";
import { Maths } from "../maths/math.js";
import {CollisionShape} from './collisionShape.js';
import {PhysicsEngine} from './physicsEngine.js';
import { PhysicsTransform } from "./transform.js";

export class PhysicsBody extends Transform {
    constructor(position,density,mass,restitution,area,isStatic,radius,width,height,shapeType) {
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

        this.properties.linearVelocity = new Vector2(0,0);
        this.properties.angularVelocity = 0;
        this.properties.force = new Vector2(0,0);

        if (shapeType == CollisionShape.BOX){
            this.vertices = PhysicsBody.createBoxVertices(width,height);
            this.transformedVertices = [];
            this.transformUpdateRequired = true;
            this.triangles = PhysicsBody.createBoxTriangles();
        }

        PhysicsEngine.addBody(this);
    }

    getLinearVelocity(){
        return this.properties.linearVelocity;
    }

    static createBoxVertices(width,height){
        let vertices = [];

        vertices.push(new Vector2(-width/2,-height/2));
        vertices.push(new Vector2(width/2,-height/2));
        vertices.push(new Vector2(width/2,height/2));
        vertices.push(new Vector2(-width/2,height/2));

        return vertices;
    }   

    static createBoxTriangles(){
        let triangles = [];

        triangles[0] = 0;
        triangles[1] = 1;
        triangles[2] = 2;
        triangles[3] = 0;
        triangles[4] = 2;
        triangles[5] = 3;

        return triangles;

    }

    getTransformedVertices(){
        
        if (this.transformUpdateRequired){
           let transform = new PhysicsTransform(this.properties.position.x,this.properties.position.y,this.properties.rotation);

           for(let i=0; i<this.vertices.length; i++){
               this.transformedVertices[i] = Vector2.transform(this.vertices[i],transform);
           }
           this.transformUpdateRequired = false;
        }
        return this.transformedVertices;
    }

    move(translation){
        this.properties.position.add(translation);
        this.transformUpdateRequired = true;
    }

    moveTowards(target,dt){
        let direction = target.sub(this.properties.position);
        let distance = direction.magnitude();
        direction.normalize();
        let speed = distance / dt;
        this.move(direction.mul(speed * dt));
    }

    rotate(rotation){
        this.properties.rotation += rotation;
        this.transformUpdateRequired = true;
    }

    Step(time){ // in seconds
        if (!this.properties.isStatic){
            this.properties.linearVelocity.add(this.properties.force.multiply(time/this.properties.mass));
            this.move(this.properties.linearVelocity.multiply(time));
            this.properties.linearVelocity = this.properties.linearVelocity.multiply(0.99);
            this.properties.force = new Vector2(0,0);
        }
    }

    addForce(force){
        this.properties.force.add(force);
    }

    applyImpulse(impulse){
        this.properties.linearVelocity.add(impulse.divide(this.properties.mass));
    }

    static createCircleBody(position,density,radius,restitution=0,isStatic){
        let area = Math.PI * radius * radius;

        if (area < PhysicsEngine.MIN_BODY_SIZE && area > PhysicsEngine.MAX_BODY_SIZE){
            console.error(`Area should be between ${PhysicsEngine.MIN_BODY_SIZE} and ${PhysicsEngine.MAX_BODY_SIZE}. Area is ${area}`);
        }

        if (density < PhysicsEngine.MIN_BODY_DENSITY && density > PhysicsEngine.MAX_BODY_DENSITY){
            console.error(`Density should be between ${PhysicsEngine.MIN_BODY_DENSITY} and ${PhysicsEngine.MAX_BODY_DENSITY}. Density is ${density}`);
        }

        let mass = density * area;
        let body =  new PhysicsBody(position,density,mass,Maths.clamp(restitution,0,1),area,isStatic,radius,0,0,CollisionShape.CIRCLE);
        return body;
    }

    static createBoxBody(position,density,width,height,restitution,isStatic){
        let area = width * height;
        // console.log(area);
        let mass = density * area;
        let body =  new PhysicsBody(position,density,mass,Maths.clamp(restitution,0,1),area,isStatic,0,width,height,CollisionShape.BOX);
        return body;
    }



}
