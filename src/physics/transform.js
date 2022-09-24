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
        this.positionX = x;
        this.positionY = y;
        this.sin = Math.sin(angle);
        this.cos = Math.cos(angle);
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