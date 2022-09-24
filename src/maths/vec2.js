
/**
 * A 2 dimensional vector. This class uses traditional Vector Math.
 * @class Vector2
 * @property {number} x - The x value of the vector.
 * @property {number} y - The y value of the vector.
 */

export class Vector2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 * Add a vector to this vector.
	 * This returns a new vector, as well as changing the original vector.
	 * @param {Vector2} vector - The vector to add. It can be a Vector2 or a number.
	 * @returns {Vector2} - The new vector.
	 * @method
	 */
	add(vector) {
		if (vector instanceof Vector2) {
			this.x += vector.x;
			this.y += vector.y;
		}else {
			this.x += vector;
			this.y += vector;
		}
		return this;
	}

	/**
	 * Subtracts a vector from this vector.
	 * This returns a new vector, as well as changing the original vector.
	 * @param {Vector2} vector - The vector to subtract. It can be a Vector2 or a number.
	 * @returns {Vector2} - The new vector.
	 * @method
	 */
	subtract(vector) {
		if (vector instanceof Vector2) {
			this.x -= vector.x;
			this.y -= vector.y;
		}else {
			this.x -= vector;
			this.y -= vector;
		}
		return this;
	}

	/**
	 * Multiply a vector by another vector.
	 * This returns a new vector, as well as changing the original vector.
	 * @param {Vector2} vector - The vector to multiply. It can be a Vector2 or a number.
	 * @returns {Vector2} - The new vector.
	 */
	multiply(vector) {
		if (vector instanceof Vector2) {
			this.x *= vector.x;
			this.y *= vector.y;
		}else {
			this.x *= vector;
			this.y *= vector;
		}
		return this;
	}

	/**
	 * Divides a vector by another vector.
	 * This returns a new vector, as well as changing the original vector.
	 * @param {Vector2} vector - The vector to divide. It can be a Vector2 or a number.
	 * @returns {Vector2} - The new vector.
	 * @method
	 */
	divide(vector) {
		if (vector instanceof Vector2) {
			this.x /= vector.x;
			this.y /= vector.y;
		}else {
			this.x /= vector;
			this.y /= vector;
		}
		return this;
	}

	/**
	 * Negates the vector.
	 * This returns a new vector, as well as changing the original vector.
	 * Rotates the vector 180 degrees.
	 * 
	 * @returns {Vector2} - The new vector.
	 */
	negetive(){
		if (this.x != 0) this.x = -this.x;
		if (this.y != 0) this.y = -this.y;
		return this;
	}

	/**
	 * Returns a new vector with elements as Zero.
	 * @returns {Vector2} - The new vector.
	 */
	static zero() {
		return new Vector2(0, 0);
	}

	/**
	 * Returns a new vector with elements as One.
	 * @returns {Vector2} - The new vector.
	 */
	static one() {
		return new Vector2(1, 1);
	}


	/**
	 * Creates a new copy of the vector. Useful for when you want to keep the original vector especially when using the Vector2 mathamatical functions.
	 * @returns {Vector2} - The new vector.
	 */
	copy() {
		return new Vector2(this.x, this.y);
	}

	/**
	 * Transforms the Vector based on the given PhysicsTransform.
	 * This rotates the vector based on the rotation of the transform.
	 * @param {Vector2} vector - The vector to transform.
	 * @param {PhysicsTransform} transform - The transform to use.
	 * @returns {Vector2} - The new vector.
	 */
	static transform(vector, transform) {
		return new Vector2(vector.x * transform.cos - vector.y * transform.sin + transform.positionX,
			vector.x * transform.sin + vector.y * transform.cos + transform.positionY);
	}

	/**
	 * Returns the magnitude of the vector.
	 * @returns {number} - The magnitude of the vector.
	 */
	magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	/**
	 * Checks if the values of the Vector are Safe Numbers.
	 * @returns {boolean} - True if the values are safe numbers.
	 */
	static isSafe(vector) {
		return vector.x != null && vector.y != null && vector.x != undefined && vector.y != undefined && !isNaN(vector.x) && !isNaN(vector.y);
	}


	/**
	 * Normalizes the vector.
	 * This returns a new vector, as well as changing the original vector.
	 * @returns {Vector2} - The new vector.
	 */
	normalize() {
		let magnitude = this.magnitude();
		if (magnitude != 0) {
			this.x /= magnitude;
			this.y /= magnitude;
		}
		return this;
	}
}