export class Collision {
    constructor(bodyA,bodyB,
                normal,depth,
                contactPointCount,contactPoint1,contactPoint2){

        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.normal = normal;
        this.depth = depth;
        this.contactPointCount = contactPointCount;
        this.contactPoint1 = contactPoint1;
        this.contactPoint2 = contactPoint2;
    }
}