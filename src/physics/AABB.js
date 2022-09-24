/**
 * Axix Aligned Bounding Box or AABB is a rectangle that is used to detect collisions.
 * @class AABB
 * 
 * @property {Vector2} min - The minimum point of the AABB.
 * @property {Vector2} max - The maximum point of the AABB.
 */
export class AABB{
    #min;
    #max;
    constructor(min,max){
        this.#min = min;
        this.#max = max;
    }

    /**
     * The minimum point of the AABB.
     * @type {Vector2}
     * @readonly
     */
    get min(){
        return this.#min;
    }

    /**
     * The maximum point of the AABB.
     * @type {Vector2}
     * @readonly
     */
    get max(){
        return this.#max;
    }

    

}