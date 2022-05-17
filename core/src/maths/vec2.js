/**
 * Vector2
 * =======
 * @class Vector2
 * @classdesc A 2D vector.
 * 
 * Properties:
 * @property {Number} x - The x position of the vector.
 * @property {Number} y - The y position of the vector.
 * 
 * Methods:
 * @method add(vec) - Adds a vector to the vector.
 * @method sub(vec) - Subtracts a vector from the vector.
 * @method mul(vec) - Multiplies the vector by a vector.
 * @method div(vec) - Divides the vector by a vector.
 * @method mulInt(int) - Multiplies the vector by an integer.
 * @method divInt(int) - Divides the vector by an integer.
 * @method mag() - Returns the magnitude of the vector.
 * @method normalise() - Normalises the vector.
 * @method limit(max) - Limits the vector to a maximum magnitude.
 * @method copy() - Returns a copy of the vector.
 * @method rotate(degrees) - Rotates the vector by an angle.(degrees)
 * 
 * @static add(vec1, vec2) - Adds two vectors.
 * @static sub(vec1, vec2) - Subtracts two vectors.
 * @static mul(vec1, vec2) - Multiplies two vectors.
 * @static div(vec1, vec2) - Divides two vectors.
 * @static mag(vec) - Returns the magnitude of a vector.
 * @static normalise(vec) - Normalises a vector.
 * @static dot(vec1, vec2) - Returns the dot product of two vectors.
 * @static cross(vec1, vec2) - Returns the cross product of two vectors.
 * @static angle(vec1, vec2) - Returns the angle between two vectors.
 * @static project(vec1, vec2) - Returns the projection of vec1 onto vec2.
 * @static rotate(vec, angle) - Rotates a vector by an angle.
 * @static distance(vec1, vec2) - Returns the distance between two vectors.
 * @static lerp(vec1, vec2, t) - Returns the linear interpolation between two vectors.
 * @static angleBetween(vec1, vec2) - Returns the angle between two vectors.
 * @static random() - Returns a random vector.
 * @static randomRange(min, max) - Returns a random vector within a range.
 * @static randomUnit() - Returns a random unit vector.

 */
export default class Vector2 {
    /**
     * @constructor
     * @param {Number} x - The x position of the vector.
     * @param {Number} y - The y position of the vector.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Add a vector to the vector.
     * @param {Vector2} vec - The vector to add.
     */
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        
    }

    /**
     * Subtract two vectors.
     * @param {Vector2} vec - The vector to subtract.
     */
    sub(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
    }

    /**
     * Multiplies the vector by an integer.
     * @param {Number} int - an integer to multiply the vector by.
     */
    mulInt(int){
        this.x *= int;
        this.y *= int;
        return this
    }

    /**
     * Multiplies the vector by another vector.
     * @param {Vector2} vec - The vector to multiply by.
     */
    mul(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
        return this
    }

    /**
     * Devides the vector by an integer.
     * @param {Number} int - an integer to divide by.
     */
    divInt(int){
        this.x /= int;
        this.y /= int;
    }
    
    /**
     * Devides the vector by another vector.
     * @param {Vector2} vec - The vector to divide by.
     */
    div(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
    }

    /**
     * Magnitude of this vector.
     * @returns {Number} The magnitude of the vector.
     */
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /** 
     * Normalises this vector.
     */
    normalise() {
        let mag = this.mag();
        this.x /= mag;
        this.y /= mag;
    }

    /** 
     * Limits the vector to a maximum magnitude.
     */
    limit(max){
        if(this.mag() > max){
            this.normalise();
            this.mulInt(max);
        }
    }

    /**
     * Creates a copy of the vector.
     * @returns {Vector2} A copy of the same vector.
     */
    copy(){
        return new Vector2(this.x, this.y);
    }

    /**
     * Returns the cross product of two vectors.
     * @param {Number} degrees - The angle in degrees.
     */
    rotate(degrees){
        let rad = degrees * Math.PI / 180;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);
        let x = this.x;
        let y = this.y;
        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;
    }

    
    static add(vec1, vec2) {
        return new Vector2(vec1.x + vec2.x, vec1.y + vec2.y);
    }

    static sub(vec1, vec2) {
        return new Vector2(vec1.x - vec2.x, vec1.y - vec2.y);
    }

    static mul(vec1, vec2) {
        return new Vector2(vec1.x * vec2.x, vec1.y * vec2.y);
    }

    static div(vec1, vec2) {
        return new Vector2(vec1.x / vec2.x, vec1.y / vec2.y);
    }

    static mag(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    }

    static normalise(vec) {
        let mag = this.mag(vec);
        return new Vector2(vec.x / mag, vec.y / mag);
    }

    static dot(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }

    static cross(vec1, vec2) {
        return vec1.x * vec2.y - vec1.y * vec2.x;
    }

    static angle(vec1, vec2) {
        return Math.acos(this.dot(vec1, vec2) / (this.mag(vec1) * this.mag(vec2)));
    }

    static project(vec1, vec2) {
        let mag = this.mag(vec2);
        return new Vector2(vec2.x / mag, vec2.y / mag);
    }

    static rotate(vec, angle) {
        let x = vec.x * Math.cos(angle) - vec.y * Math.sin(angle);
        let y = vec.x * Math.sin(angle) + vec.y * Math.cos(angle);
        return new Vector2(x, y);
    }

    static distance(vec1, vec2) {
        return Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2));
    }

    static lerp(vec1, vec2, t) {
        return new Vector2(vec1.x + (vec2.x - vec1.x) * t, vec1.y + (vec2.y - vec1.y) * t);
    }

    static angleBetween(vec1, vec2) {
        return Math.acos(this.dot(vec1, vec2) / (this.mag(vec1) * this.mag(vec2)));
    }

    static random(){
        return new Vector2(Math.random(),Math.random());
    }

    static randomUnit(){
        return this.random().normalise();
    }

    static randomRange(min, max){
        return new Vector2(Math.random() * (max - min) + min, Math.random() * (max - min) + min);
    }


}