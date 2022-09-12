export class CollisionShape{
}

export class BoxCollisionShape extends CollisionShape{
    constructor(width=50, height=50){
        super();
        this.width = width;
        this.height = height;
    }

    get getWidth(){
        return this.width;
    }

    get getHeight(){
        return this.height;
    }
    
}

export class CircleCollisionShape extends CollisionShape{
    constructor(radius=20){
        super();
        this.radius = radius;
    }

    get getRadius(){
        return this.radius;
    }
}