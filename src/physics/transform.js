/**
 * Physics Transform is not a component, but a class that is used to store the transformation data of the vectors.
 * This class is used by the physics engine to calculate the position and rotation of the rigid bodies.
 * This is a Manifold class.
 * @class PhysicsTransform
 * @property {number} x - The x position of the transformation.
 * @property {number} y - The y position of the transformation.
 * @property {number} angle - The angle of the transformation.
 * @property {number} sin - The sin of the angle.
 * @property {number} cos - The cos of the angle.
 */
export class PhysicsTransform {
    constructor(x,y,angle){
        super();
        this.positionX = x;
        this.positionY = y;
        this.sin = Math.sin(angle);
        this.cos = Math.cos(angle);
    }

    get x(){
        return this.positionX;
    }

    set x(x){
        this.positionX = x;
    }

    get y(){
        return this.positionY;
    }

    set y(y){
        this.positionY = y;
    }

    get angle(){
        return Math.atan2(this.sin,this.cos);
    }

    set angle(angle){
        this.sin = Math.sin(angle);
        this.cos = Math.cos(angle);
    }

    get sin(){
        return this.sin;
    }

    set sin(sin){
        this.sin = sin;
    }

    get cos(){
        return this.cos;
    }

    set cos(cos){
        this.cos = cos;
    }

    /**
     * Creates a blank PhysicsTransform with all values set to 0.
     * @static
     * @returns {PhysicsTransform} A blank PhysicsTransform.
     */
    static zero(){
        return new PhysicsTransform(0,0,0);
    }
}