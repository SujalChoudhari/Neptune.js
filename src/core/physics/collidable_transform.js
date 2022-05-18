import Transform from "../maths/transform.js";
import Vector2 from "../maths/vec2.js";
export default class CollidableTransform extends Transform{
    constructor(kwargs){
        super(kwargs);
        this.collidable = kwargs["collidable"] || true;
    }

    update(deltaTime){
        super.update(deltaTime);
    }
    containsPoint(x,y){
        return x >= this.worldPos.x && x <= this.worldPos.x + this.size.x && y >= this.worldPos.y && y <= this.worldPos.y + this.size.y;
    }
    checkCollisionPoint(point){
        return this.collidable && this.containsPoint(point.x,point.y);
    }
    getCollisionDirection(rect){
        let direction = new Vector2(0, 0);
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x, rect.worldPos.y))){
            direction.x = 1;
        }
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x + rect.size.x, rect.worldPos.y))){
            direction.x = -1;
        }
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x, rect.worldPos.y + rect.size.y))){
            direction.y = 1;
        }
        if(this.checkCollisionPoint(new Vector2(rect.worldPos.x + rect.size.x, rect.worldPos.y + rect.size.y))){
            direction.y = -1;
        }
        return direction;
    }
    getCollisionPoint(rect){
        let dir = this.getCollisionDirection(rect);
        if(dir.x != 0){
            return new Vector2(this.worldPos.x + this.size.x, this.worldPos.y + this.size.y / 2);
        }
        else if(dir.y != 0){
            return new Vector2(this.worldPos.x + this.size.x / 2, this.worldPos.y + this.size.y);
        }
        return new Vector2(0, 0);
    }
}