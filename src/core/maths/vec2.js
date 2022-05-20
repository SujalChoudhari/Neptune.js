/**
 * @class Vector2
 * @classdesc A standard 2D vector.
 * 
 * @property {Number} x - The x coordinate.
 * @property {Number} y - The y coordinate.
 */
export class Vector2 {

    /**
     * @method
     * @description Creates a new Vector2 from Cartesian coordinates.
     * @param {Number} x - The x coordinate.
     * @param {Number} y - The y coordinate.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * console.log(vec.x); // 1
     * console.log(vec.y); // 2
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @method
     * @description Adds a vector to this vector.
     * @param {Vector2} vec - The vector to add.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * vec.add(new Vector2(2, 3));
     * console.log(vec.x); // 3
     */
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        
    }

    /**
     * @method
     * @description Subtracts a vector from this vector.
     * @param {Vector2} vec - The vector to subtract.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * vec.sub(new Vector2(2, 3));
     * console.log(vec.x); // -1
     */
    sub(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
    }

    /**
     * @method
     * @description Multiplies a vector by a scalar.
     * @param {Number} int - The scalar to multiply by.
     * @returns {Vector2} Reference to this vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * vec.mulInt(2);
     * console.log(vec.x); // 2
     */
    mulInt(int){
        this.x *= int;
        this.y *= int;
        return this
    }

    /**
     * @method
     * @description Multiplies a vector by another vector.
     * @param {Vector2} vec - The vector to multiply.
     * @returns {Vector2} Reference to this vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * vec.mul(new Vector2(2, 3));
     * console.log(vec.x); // 2
     */
    mul(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
        return this
    }

    /**
     * @method
     * @description Devides a vector by a scalar.
     * @param {Number} int - The scalar to divide by.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * vec.divInt(2);
     * console.log(vec.x); // 0.5
     */
    divInt(int){
        this.x /= int;
        this.y /= int;
    }


    /**
     * @method
     * @description Devides a vector by another vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * vec.div(new Vector2(2, 3));
     * console.log(vec.x); // 0.5
     */
    div(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
    }

    /**
     * @method
     * @description Returns the Magnitude of the vector.
     * @returns {Number} The magnitude of the vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * console.log(vec.mag()); // 2.23606797749979 (root of 5)
     */
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }


    /**
     * @method
     * @description Returns the normalised vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * let norm_vec = vec.normalise(); // new Vector2(0.4472135954999579, 0.8944271909999159)
     * 
     * console.log(norm_vec.mag()); // 1 always
     */
    normalise() {
        let mag = this.mag();
        this.x /= mag;
        this.y /= mag;
    }

    /**
     * @method
     * @description Limits the magnitude of the vector.
     * @param {Number} max - The maximum magnitude.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * vec.limit(2);
     * console.log(vec.mag()); // 2
     */
    limit(max){
        if(this.mag() > max){
            this.normalise();
            this.mulInt(max);
        }
    }

    /**
     * @method
     * @description Returns a copy of the vector.
     * @returns {Vector2} A copy of the vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * let copy = vec.copy();
     * console.log(copy.x); // 1
     */
    copy(){
        return new Vector2(this.x, this.y);
    }

    /**
     * @method
     * @description Rotates a vector by a given angle in degrees.
     * @param {Number} degrees - The angle to rotate by.
     * 
     * @example
     * let vec = new Vector2(5, 0);
     * vec.rotate(90);
     * console.log(vec); // new Vector2(0, 5)
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

    /**
     * @method
     * @static
     * @description Adds two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Vector2} The sum of the two vectors.
     * 
     * @example
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let sum = Vector2.add(vec1, vec2);
     * console.log(sum.x); // 3
     */
    static add(vec1, vec2) {
        return new Vector2(vec1.x + vec2.x, vec1.y + vec2.y);
    }


    /**
     * @method
     * @static
     * @description Subtracts two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Vector2} The difference of the two vectors.
     * 
     * @example
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let diff = Vector2.sub(vec1, vec2);
     * console.log(diff.x); // -1
     */
    static sub(vec1, vec2) {
        return new Vector2(vec1.x - vec2.x, vec1.y - vec2.y);
    }

    /**
     * @method
     * @static
     * @description Multiplies a vector by another vector.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Vector2} The product of the two vectors.
     * 
     * @example
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let prod = Vector2.mul(vec1, vec2);
     * console.log(prod.x); // 2
     */
    static mul(vec1, vec2) {
        return new Vector2(vec1.x * vec2.x, vec1.y * vec2.y);
    }

    /**
     * @method
     * @static
     * @description Divides a vector by another vector.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Vector2} The quotient of the two vectors.
     * 
     * @example
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let quot = Vector2.div(vec1, vec2);
     * console.log(quot.x); // 0.5
     */
    static div(vec1, vec2) {
        return new Vector2(vec1.x / vec2.x, vec1.y / vec2.y);
    }


    /** 
     * @method
     * @static
     * @description Returns the magnitude of a vector.
     * @param {Vector2} vec - The vector.
     * @returns {Number} The magnitude of the vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * console.log(vec.mag()); // 2.23606797749979 (root of 5)
     */
    static mag(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    }


    /**
     * @method
     * @static
     * @description Returns the normalised vector.
     * @param {Vector2} vec - The vector.
     * @returns {Vector2} The normalised vector.
     * 
     * @example
     * let vec = new Vector2(1, 2);
     * let norm_vec = Vector2.norm(vec); // new Vector2(0.4472135954999579, 0.8944271909999159)
     * console.log(norm_vec.mag()); // 1 always
     */
    static normalise(vec) {
        let mag = this.mag(vec);
        return new Vector2(vec.x / mag, vec.y / mag);
    }


    /**
     * @method
     * @static
     * @description Returns the dot product of two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Number} The dot product of the two vectors.
     * 
     * @example
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let dot = Vector2.dot(vec1, vec2); // 8
     */
    static dot(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }


    /**
     * @method
     * @static
     * @description Returns the cross product of two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Number} The cross product of the two vectors.
     * 
     * @example
     * // The cross product of two vectors is the z-component of the 3D vector
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let cross = Vector2.cross(vec1, vec2); // -1
     */
    static cross(vec1, vec2) {
        return vec1.x * vec2.y - vec1.y * vec2.x;
    }

    /**
     * @method
     * @static
     * @description Returns the angle between two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Number} The angle between the two vectors in radians.
     * 
     * @example
     * let vec1 = new Vector2(0,20);
     * let vec2 = new Vector2(10,10);
     * let angle = Vector2.angle(vec1, vec2); // PI/4
     */
    static angle(vec1, vec2) {
        return Math.acos(this.dot(vec1, vec2) / (this.mag(vec1) * this.mag(vec2)));
    }


    /**
     * @method
     * @static
     * @description Returns the projection of second vector onto the first vector.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Vector2} The projection of the second vector onto the first vector.
     * 
     * @example
     * let vec1 = new Vector2(1, 0);
     * let vec2 = new Vector2(2, 0);
     * let proj = Vector2.project(vec1, vec2); // new Vector2(1, 0)
     */
    static project(vec1, vec2) {
        let mag = this.mag(vec2);
        return new Vector2(vec2.x / mag, vec2.y / mag);
    }


    /**
     * @method
     * @static
     * @description Rotates a vector by a given angle.
     * @param {Vector2} vec - The vector.
     * @param {Number} angle - The angle to rotate by in radians.
     * @returns {Vector2} The rotated vector.
     * 
     * @example
     * let vec = new Vector2(1, 0);
     * let rot_vec = Vector2.rotate(vec, Math.PI / 2); // new Vector2(0, 1)
     */
    static rotate(vec, angle) {
        let x = vec.x * Math.cos(angle) - vec.y * Math.sin(angle);
        let y = vec.x * Math.sin(angle) + vec.y * Math.cos(angle);
        return new Vector2(x, y);
    }

    /**
     * @method
     * @static
     * @description Returns the distance between two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Number} The distance between the two vectors.
     * 
     * @example
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let dist = Vector2.dist(vec1, vec2); // 2.23606797749979
     */
    static distance(vec1, vec2) {
        return Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2));
    }


    /**
     * @method
     * @static
     * @description Lerps between two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @param {Number} t - The interpolation value.
     * @returns {Vector2} The lerped vector.
     * 
     * @example
     * let vec1 = new Vector2(1, 2);
     * let vec2 = new Vector2(2, 3);
     * let t;
     * let lerp_vec = Vector2.lerp(vec1, vec2, t);
     * 
     */
    static lerp(vec1, vec2, t) {
        return new Vector2(vec1.x + (vec2.x - vec1.x) * t, vec1.y + (vec2.y - vec1.y) * t);
    }

    /**
     * @method
     * @static
     * @description Returns the angle between two vectors.
     * @param {Vector2} vec1 - The first vector.
     * @param {Vector2} vec2 - The second vector.
     * @returns {Number} The angle between the two vectors in radians.
     * 
     * @example
     * let vec1 = new Vector2(0, 20);
     * let vec2 = new Vector2(10, 10);
     * let angle = Vector2.angle(vec1, vec2); // PI/4
     * 
     */
    static angle(vec1, vec2) {
        return Math.acos(this.dot(vec1, vec2) / (this.mag(vec1) * this.mag(vec2)));
    }

    /**
     * @method
     * @static
     * @description Generates a random vector.
     * @returns {Vector2} A random vector.
     * 
     * @example
     * let vec = Vector2.random();
     */
    static random(){
        return new Vector2(Math.random(),Math.random());
    }

    /**
     * @method
     * @static
     * @description Generates a random unit vector.
     * @returns {Vector2} A random unit vector.
     * 
     * @example
     * let vec = Vector2.randomUnit();
     * vec.mag(); // 1
     */
    static randomUnit(){
        return this.random().normalise();
    }


    /**
     * @method
     * @static
     * @description Generates a random vector with a given range of values.
     * @param {Number} min - The magnitude of the vector.
     * @param {Number} max - The magnitude of the vector.
     * @returns {Vector2} A random vector.
     * 
     * @example
     * let vec = Vector2.randomRange(1, 10);
     * vec.mag(); // 1 to 10
     * 
     */
    static randomRange(min, max){
        return new Vector2(Math.random() * (max - min) + min, Math.random() * (max - min) + min);
    }


}