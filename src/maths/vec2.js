export class Vector2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

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

	negetive(){
		if (this.x != 0) this.x = -this.x;
		if (this.y != 0) this.y = -this.y;
		return this;
	}

	static zero() {
		return new Vector2(0, 0);
	}

	static one() {
		return new Vector2(1, 1);
	}

	equals(vector) {
		return this.x == vector.x && this.y == vector.y;
	}

	copy() {
		return new Vector2(this.x, this.y);
	}


	static transform(vector, transform) {
		return new Vector2(vector.x * transform.properties.cos - vector.y * transform.properties.sin + transform.properties.positionX,
			vector.x * transform.properties.sin + vector.y * transform.properties.cos + transform.properties.positionY);
	}

	magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	static isSafe(vector) {
		return vector.x != null && vector.y != null && vector.x != undefined && vector.y != undefined && !isNaN(vector.x) && !isNaN(vector.y);
	}
}