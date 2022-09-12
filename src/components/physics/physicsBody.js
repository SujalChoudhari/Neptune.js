

import { PhysicsEngine } from "../../basic/physicsEngine.js";
import { Math } from "../../maths/math.js";
import { Vector2 } from "../../neptune.js";
import { Component } from "../component.js";
import { CollisionShape } from "./collisionShape.js";
import { BoxCollisionShape } from "./collisionShape.js";
import { CircleCollisionShape } from "./collisionShape.js";

export class PhysicsBody extends Component {
    constructor(linearVelocity=Vector2.zero(),rotationalVelocity=0,density=1,mass=1,restitution=0,area,isStatic=false,collisionShape=new CircleCollisionShape()){
        super();
        this.properties.linearVelocity = linearVelocity;
        this.properties.rotationalVelocity = rotationalVelocity;
        this.properties.density = density;
        this.properties.mass = mass;
        this.properties.restitution = restitution;
        this.properties.area = area;
        this.properties.isStatic = isStatic;
        this.properties.collisionShape =collisionShape; 
    }

    createCircleBody(raduis,density,isStatic,restitution){
        let area = Math.PI * radius * radius;
        if (area < PhysicsEngine.MIN_BODY_SIZE || area > PhysicsEngine.MAX_BODY_SIZE){
            console.warn(`Area of circle is ${area} which is outside the range of ${PhysicsEngine.MIN_BODY_SIZE} to ${PhysicsEngine.MAX_BODY_SIZE}`);
            return;
        }

        if(density < PhysicsEngine.MIN_DENSITY || density > PhysicsEngine.MAX_DENSITY){
            console.warn(`Density of circle is ${density} which is outside the range of ${PhysicsEngine.MIN_DENSITY} to ${PhysicsEngine.MAX_DENSITY}`);
            return;
        }

        let restitution = Math.clamp(restitution,0,1);
        let mass = area * density;

        return new PhysicsBody(Vector2.zero(),0,density,mass,restitution,area,isStatic,new CircleCollisionShape(radius));

    }

    createBoxBody(width,height,density,isStatic,restitution){
        let area = width * height;
        if (area < PhysicsEngine.MIN_BODY_SIZE || area > PhysicsEngine.MAX_BODY_SIZE){
            console.warn(`Area of box is ${area} which is outside the range of ${PhysicsEngine.MIN_BODY_SIZE} to ${PhysicsEngine.MAX_BODY_SIZE}`);
            return;
        }

        if(density < PhysicsEngine.MIN_DENSITY || density > PhysicsEngine.MAX_DENSITY){
            console.warn(`Density of box is ${density} which is outside the range of ${PhysicsEngine.MIN_DENSITY} to ${PhysicsEngine.MAX_DENSITY}`);
            return;
        }

        let restitution = Math.clamp(restitution,0,1);
        let mass = area * density;

        return new PhysicsBody(Vector2.zero(),0,density,mass,restitution,area,isStatic,new BoxCollisionShape(width,height));

    }
}