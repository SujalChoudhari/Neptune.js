import { Vector2 } from "../maths/vec2.js";

/**
 * @class Vertex
 * @param {*} parent
 * @param {*} vertex
 * @param {*} pinned
 */
export class Vertex {
	constructor(parent, vertex, pinned, kwargs) {
		this.kwargs = kwargs;
		this.parent = parent;
		this.position = new Vector2(vertex.x, vertex.y);
		this.oldPosition = new Vector2(vertex.x, vertex.y);
		this.pinned = pinned;
	}
	/**
	 * @method
	 * @description Loop and update physics
	 */
	integrate() {
		if (!this.pinned) {
			let pos = this.position;
			let oldpos = this.oldPosition;
			let x = pos.x;
			let y = pos.y;
			pos.x += (pos.x - oldpos.x) * this.kwargs.friction;
			pos.y += (pos.y - oldpos.y) * this.kwargs.friction + this.kwargs.engine.gravity;
			oldpos.set(x, y);
		}
	}
	/**
	 * @method
	 * @description Handle Boundry Collision
	 */
	boundary() {
		let pos = this.position, old = this.oldPosition;
		let vx = (pos.x - old.x);
		let vy = (pos.y - old.y);
		// Y
		if (pos.y < 0) {
			pos.y = 0;
		}
		else if (pos.y > this.kwargs.canvas.height) {
			pos.x -= (pos.y - this.kwargs.canvas.height) * vx * this.kwargs.groundFriction;
			pos.y = this.kwargs.canvas.height;
		}
		// X
		if (pos.x < 0) {
			pos.x = 0;
		}
		else if (pos.x > this.kwargs.canvas.width) {
			pos.x = this.kwargs.canvas.width;
		};
	}
};
