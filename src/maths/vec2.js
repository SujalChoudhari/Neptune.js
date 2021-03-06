/**
 * @class Vector2
 * @param {Number} x - The x coordinate of the vector.
 * @param {Number} y - The y coordinate of the vector.
 * @description A 2D vector class.
 */
export function Vector2(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

/**
 * 
 * @param {Vector2} v1 - The first vector.
 * @param {Vector2} v2  - The second vector.
 * @returns {Number} The angle between the two vectors.
 */
Vector2.dist = function (v1, v2) {
	return v1.dist(v2);
}

/**
 * @param {Vector2} v1 - The first vector.
 * @param {Vector2} v2 - The second vector.
 * @returns {Vector2} The difference between the two vectors.
 */
Vector2.sub = function (v1, v2) {
	return new Vector2(v1.x - v2.x, v1.y - v2.y);
};

/** */
Vector2.add = function (v1, v2) {
	return new Vector2(v1.x + v2.x, v1.y + v2.y);
};

/** */
Vector2.fromAngle = function (angle) {
	let v = new Vector2(0, 0);
	v.x = Math.cos(angle);
	v.y = Math.sin(angle);
	return v;
}

/** */
Vector2.random2D = function (v) {
	return Vector2.fromAngle(Math.random() * Math.PI * 180);
}

Vector2.prototype = {

	/** */
	set: function (x, y) {
		this.x = x;
		this.y = y;
		return this;
	},

	/** */
	add: function (x, y) {
		if (arguments.length === 1) {
			this.x += x.x;
			this.y += x.y;
		} else if (arguments.length === 2) {
			this.x += x;
			this.y += y;
		}
		return this;
	},

	/** */
	sub: function (x, y) {
		if (x instanceof Vector2) {
			this.x -= x.x;
			this.y -= x.y;
		} else {
			this.x -= x;
			this.y -= y;
		}
		return this;
	},

	/** */
	sub2: function (v0, v1) {
		this.x = v0.x - v1.x;
		this.y = v0.y - v1.y;
		return this;
	},

	/** */
	mult: function (v) {
		if (typeof v === 'number') {
			this.x *= v;
			this.y *= v;
		} else {
			this.x *= v.x;
			this.y *= v.y;
		}
		return this;
	},
	/** */
	div: function (v) {
		if (typeof v === 'number') {
			this.x /= v;
			this.y /= v;
		} else {
			this.x /= v.x;
			this.y /= v.y;
		}
		return this;
	},
	/** */
	mag: function () {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},
	/** */
	magSq: function () {
		return (this.x * this.x + this.y * this.y);
	},
	/** */
	setMag: function (value) {
		this.normalize();
		this.mult(value);
		return this;
	},
	/** */
	normalize: function () {
		let m = this.mag();
		if (m > 0) {
			this.div(m);
		}
		return this;
	},
	/** */
	limit: function (max) {
		if (this.mag() > max) {
			this.normalize();
			this.mult(max);
		}
		return this;
	},
	/** */
	heading: function () {
		return (-Math.atan2(-this.y, this.x));
	},
	/** */
	dist: function (v) {
		let dx = this.x - v.x;
		let dy = this.y - v.y;
		return Math.sqrt(dx * dx + dy * dy);
	},
	/** */
	copy: function () {
		return new Vector2(this.x, this.y);
	},
	/** */
	negative: function () {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	},
	/** */
	array: function () {
		return [this.x, this.y];
	},
	/** */
	toString: function () {
		return "[" + this.x + ", " + this.y + ", " + this.z + "]";
	},
	/** */
	unit: function () {
		return this.div(this.mag());
	},
	/** */
	subtract: function (v) {
		return new Vector2(this.x - v, this.y - v);
	},
	/** */
	dot: function (v) {
		return this.x * v.x + this.y * v.y;
	},
	/** */
	scale: function (v, s) {
		this.x = v.x * s;
		this.y = v.y * s;
		return this;
	},
	/** */
	normal: function (v0, v1) {
		// perpendicular
		var nx = v0.y - v1.y,
			ny = v1.x - v0.x;
		// normalize
		var len = 1.0 / Math.sqrt(nx * nx + ny * ny);
		this.x = nx * len;
		this.y = ny * len;
		return this;
	},
	/** */
	copy: function (v) {
		this.x = v.x;
		this.y = v.y;
		return this;
	},
	/** */
	squareDist: function (v) {
		var dx = this.x - v.x;
		var dy = this.y - v.y;
		return (dx * dx + dy * dy);
	},
	/** */
	perp: function (v) {
		this.x = -v.y;
		this.y = v.x;
		return this;
	}
}