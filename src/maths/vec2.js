
export class Vector2 {
	constructor(x, y) {
		if (arguments.length == 0) {
			this.x = 0;
			this.y = 0;
		} else if (arguments.length == 1) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			this.y = y;
		}
	}
	clone() {
		return new Vector2(this.x, this.y);
	}
	toString() {
		return '(' + this.x + ',' + this.y + ')';
	}
	add(vec) {
		this.x += vec.x;
		this.y += vec.y;
		return this;
	}
	subtract(vec) {
		this.x -= vec.x;
		this.y -= vec.y;
		return this;
	}
	divide(scalar) {
		this.x /= scalar;
		this.y /= scalar;
		return this;
	}
	multiply(v) {
		this.x *= v.x;
		this.y *= v.y;
		return this;
	}
	multiplyScalar(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}
	invert() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}
	angle() {
		return Math.atan2(this.y, this.x);
	}
	distance(vec) {
		return Math.sqrt((vec.x - this.x) * (vec.x - this.x) + (vec.y - this.y) * (vec.y - this.y));
	}
	distanceSq(vec) {
		return (vec.x - this.x) * (vec.x - this.x) + (vec.y - this.y) * (vec.y - this.y);
	}
	clockwise(vec) {
		let a = this.y * vec.x;
		let b = this.x * vec.y;

		if (a > b) {
			return -1;
		}
		else if (a === b) {
			return 0;
		}
		return 1;
	}
	relativeClockwise(center, vec) {
		let a = (this.y - center.y) * (vec.x - center.x);
		let b = (this.x - center.x) * (vec.y - center.y);

		if (a > b) {
			return -1;
		}
		else if (a === b) {
			return 0;
		}
		return 1;
	}
	rotate(angle) {
		let tmp = new Vector2(0, 0);
		let cosAngle = Math.cos(angle);
		let sinAngle = Math.sin(angle);
		tmp.x = this.x * cosAngle - this.y * sinAngle;
		tmp.y = this.x * sinAngle + this.y * cosAngle;

		this.x = tmp.x;
		this.y = tmp.y;
		return this;
	}
	rotateAround(angle, vec) {
		let s = Math.sin(angle);
		let c = Math.cos(angle);
		this.x -= vec.x;
		this.y -= vec.y;
		let x = this.x * c - this.y * s;
		let y = this.x * s + this.y * c;
		this.x = x + vec.x;
		this.y = y + vec.y;
		return this;
	}
	rotateTo(vec, center, offsetAngle = 0.0) {
		this.x += 0.001;
		this.y -= 0.001;
		let a = Vector2.subtract(this, center);
		let b = Vector2.subtract(vec, center);
		let angle = Vector2.angle(b, a);
		this.rotateAround(angle + offsetAngle, center);
		return this;
	}
	rotateAwayFrom(vec, center, angle) {
		this.rotateAround(angle, center);

		let distSqA = this.distanceSq(vec);

		this.rotateAround(-2.0 * angle, center);
		let distSqB = this.distanceSq(vec);
		if (distSqB < distSqA) {
			this.rotateAround(2.0 * angle, center);
		}
	}
	getRotateAwayFromAngle(vec, center, angle) {
		let tmp = this.clone();
		tmp.rotateAround(angle, center);

		let distSqA = tmp.distanceSq(vec);

		tmp.rotateAround(-2.0 * angle, center);
		let distSqB = tmp.distanceSq(vec);
		if (distSqB < distSqA) {
			return angle;
		} else {
			return -angle;
		}
	}
	getRotateTowardsAngle(vec, center, angle) {
		let tmp = this.clone();
		tmp.rotateAround(angle, center);

		let distSqA = tmp.distanceSq(vec);

		tmp.rotateAround(-2.0 * angle, center);
		let distSqB = tmp.distanceSq(vec);
		if (distSqB > distSqA) {
			return angle;
		} else {
			return -angle;
		}
	}
	getRotateToAngle(vec, center) {
		let a = Vector2.subtract(this, center);
		let b = Vector2.subtract(vec, center);
		let angle = Vector2.angle(b, a);

		return Number.isNaN(angle) ? 0.0 : angle;
	}
	isInPolygon(polygon) {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			if (((polygon[i].y > this.y) != (polygon[j].y > this.y)) &&
				(this.x < (polygon[j].x - polygon[i].x) * (this.y - polygon[i].y) /
					(polygon[j].y - polygon[i].y) + polygon[i].x)) {
				inside = !inside;
			}
		}
		return inside;
	}
	length() {
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	}
	lengthSq() {
		return (this.x * this.x) + (this.y * this.y);
	}
	normalize() {
		this.divide(this.length());
		return this;
	}
	normalized() {
		return Vector2.divideScalar(this, this.length());
	}
	whichSide(vecA, vecB) {
		return (this.x - vecA.x) * (vecB.y - vecA.y) - (this.y - vecA.y) * (vecB.x - vecA.x);
	}
	sameSideAs(vecA, vecB, vecC) {
		let d = this.whichSide(vecA, vecB);
		let dRef = vecC.whichSide(vecA, vecB);
		return d < 0 && dRef < 0 || d == 0 && dRef == 0 || d > 0 && dRef > 0;
	}
	static add(vecA, vecB) {
		return new Vector2(vecA.x + vecB.x, vecA.y + vecB.y);
	}
	static subtract(vecA, vecB) {
		return new Vector2(vecA.x - vecB.x, vecA.y - vecB.y);
	}
	static multiply(vecA, vecB) {
		return new Vector2(vecA.x * vecB.x, vecA.y * vecB.y);
	}
	static multiplyScalar(vec, scalar) {
		return new Vector2(vec.x, vec.y).multiplyScalar(scalar);
	}
	static midpoint(vecA, vecB) {
		return new Vector2((vecA.x + vecB.x) / 2, (vecA.y + vecB.y) / 2);
	}
	static normals(vecA, vecB) {
		let delta = Vector2.subtract(vecB, vecA);
		return [
			new Vector2(-delta.y, delta.x),
			new Vector2(delta.y, -delta.x)
		];
	}
	static units(vecA, vecB) {
		let delta = Vector2.subtract(vecB, vecA);
		return [
			(new Vector2(-delta.y, delta.x)).normalize(),
			(new Vector2(delta.y, -delta.x)).normalize()
		];
	}
	static divide(vecA, vecB) {
		return new Vector2(vecA.x / vecB.x, vecA.y / vecB.y);
	}
	static divideScalar(vecA, s) {
		return new Vector2(vecA.x / s, vecA.y / s);
	}
	static dot(vecA, vecB) {
		return vecA.x * vecB.x + vecA.y * vecB.y;
	}
	static angle(vecA, vecB) {
		let dot = Vector2.dot(vecA, vecB);
		return Math.acos(dot / (vecA.length() * vecB.length()));
	}
	static threePointangle(vecA, vecB, vecC) {
		let ab = Vector2.subtract(vecB, vecA);
		let bc = Vector2.subtract(vecC, vecB);
		let abLength = vecA.distance(vecB);
		let bcLength = vecB.distance(vecC);
		return Math.acos(Vector2.dot(ab, bc) / (abLength * bcLength));
	}
	static scalarProjection(vecA, vecB) {
		let unit = vecB.normalized();

		return Vector2.dot(vecA, unit);
	}
	static averageDirection(vecs) {
		let avg = new Vector2(0.0, 0.0);
		for (var i = 0; i < vecs.length; i++) {
			let vec = vecs[i];
			avg.add(vec);
		}
		return avg.normalize();
	}

	static zero(){
		return new Vector2(0,0);
	}

	static one(){
		return new Vector2(1,1);
	}
}