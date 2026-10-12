
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
	Add(vector) {
		if (vector instanceof Vector2) {
			this.x += vector.x;
			this.y += vector.y;
		} else {
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
	Subtract(vector) {
		if (vector instanceof Vector2) {
			this.x -= vector.x;
			this.y -= vector.y;
		} else {
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
	Multiply(vector) {
		if (vector instanceof Vector2) {
			this.x *= vector.x;
			this.y *= vector.y;
		} else {
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
	Divide(vector) {
		if (vector instanceof Vector2) {
			this.x /= vector.x;
			this.y /= vector.y;
		} else {
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
	Negetive() {
		if (this.x != 0) this.x = -this.x;
		if (this.y != 0) this.y = -this.y;
		return this;
	}

	/**
	 * Returns a new vector with elements as Zero.
	 * @returns {Vector2} - The new vector.
	 */
	static Zero() {
		return new Vector2(0, 0);
	}

	/**
	 * Returns a new vector with elements as One.
	 * @returns {Vector2} - The new vector.
	 */
	static One() {
		return new Vector2(1, 1);
	}


	/**
	 * Creates a new copy of the vector. Useful for when you want to keep the original vector especially when using the Vector2 mathamatical functions.
	 * @returns {Vector2} - The new vector.
	 */
	Copy() {
		return new Vector2(this.x, this.y);
	}


	/**
	 * Returns the magnitude of the vector.
	 * @returns {number} - The magnitude of the vector.
	 */
	Magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	/**
	 * Checks if the values of the Vector are Safe Numbers.
	 * @returns {boolean} - True if the values are safe numbers.
	 */
	static IsSafe(vector) {
		return vector.x != null && vector.y != null && vector.x != undefined && vector.y != undefined && !isNaN(vector.x) && !isNaN(vector.y);
	}


	/**
	 * Normalizes the vector.
	 * This returns a new vector, as well as changing the original vector.
	 * @returns {Vector2} - The new vector.
	 */
	Normalize() {
		let magnitude = this.Magnitude();
		if (magnitude != 0) {
			this.x /= magnitude;
			this.y /= magnitude;
		}
		return this;
	}
}