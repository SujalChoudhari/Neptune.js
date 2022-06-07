import { Color } from "../../basic/color.js"

/**
 * @class Details
 * @classdesc A class that draws details on the canvas.
 */
export class Details {
	/**
	 * @method
	 * @param {number} radius - The radius of the gizmo.
	 * @param {Color} color - The color of the gizmo.
	 * @param {Atomic} engine - The engine to draw the gizmo on.
	 */
	static dots(engine, radius, color) {
		let PI2 = Math.PI * 2;
		let rad = radius || 4;
		for (let i = 0, j = engine.vertices.length; i < j; i++) {
			let p = engine.vertices[i].position;
			if (!p.hidden) {
				let fill = color.toString() || new Color(0, 0, 0, 0.3).toString();
				engine.ctx.beginPath();
				engine.ctx.fillStyle = fill;
				engine.ctx.arc(p.x, p.y, rad, 0, PI2);
				engine.ctx.fill();
				engine.ctx.closePath();
			}
		}
	}

	/**
	 * @method
	 * @param {string} font - The font of the gizmo.
	 *  @param {Color} color - The color of the gizmo.
	 * @param {Atomic} engine - The engine to draw the gizmo on.
	 */
	static pointIndex(engine, font, color) {
		engine.ctx.font = font || '10px Arial';
		engine.ctx.fillStyle = color.toString() || new Color(0, 0, 0, 0.9).toString();
		for (let i = 0; i < engine.vertices.length; i++) {
			let p = engine.vertices[i].position;
			engine.ctx.fillText(i, (p.x - 5), (p.y - 5));
		}
		engine.ctx.fill();
	}

	/**
	 * @method
	 * @param {number} linewidth - The width of the gizmo.
	 * @param {Color} color - The color of the gizmo.
	 * @param {boolean} showHidden - Whether to show hidden vertices.
	 * @param {Atomic} engine - The engine to draw the gizmo on.
	 */
	static lines(engine, linewidth, color, showHidden) {
		if (!showHidden) { showHidden = false; }
		if (engine.constraints.length > 0) {
			engine.ctx.beginPath();
			engine.ctx.strokeStyle = color.toString() || new Color(0, 0, 0, 0.3).toString();
			engine.ctx.lineWidth = linewidth || 1;
			for (let i = 0; i < engine.constraints.length; i++) {
				let c = engine.constraints[i];
				if (!c.hidden) {
					engine.ctx.moveTo(c.p0.x, c.p0.y);
					engine.ctx.lineTo(c.p1.x, c.p1.y);
				}
				if (showHidden === true) {
					if (c.hidden) {
						engine.ctx.moveTo(c.p0.x, c.p0.y);
						engine.ctx.lineTo(c.p1.x, c.p1.y);
					}
				}
			}
			engine.ctx.stroke();
			engine.ctx.closePath();
		}
	}

	/**
	 * @method
	 * @param {string} font - The font of the gizmo.
	 *  @param {Color} color - The color of the gizmo.
	 * @param {Atomic} engine - The engine to draw the gizmo on.
	 */
	static indexOfBodies(engine, font, color) {
		engine.ctx.save();
		engine.ctx.font = font || '10px Arial';
		engine.ctx.fillStyle = color.toString() || new Color(0, 0, 0, 0.9).toString();
		for (let i = 0; i < engine.bodies.length; i++) {
			let p = engine.bodies[i];
			for (let j = 0; j < p.vertices.length; j++) {
				let v = p.vertices[j].position;
				engine.ctx.fillText(i + '.' + j, (v.x - 10), (v.y - 10));
			}
		}
		engine.ctx.fill();
		engine.ctx.restore();
	}

	/**
	 * @method
	 *  @param {Color} color - The color of the gizmo.
	 * @param {Atomic} engine - The engine to draw the gizmo on.
	 */
	static centerOfMass(engine, color) {
		engine.ctx.fillStyle = color.toString() || new Color(0, 0, 0, 0.3).toString();
		engine.ctx.beginPath();
		for (let i = 0; i < engine.bodies.length; i++) {
			let b = engine.bodies[i];
			engine.ctx.fillRect(b.center.x - 2.5, b.center.y - 2.5, 5, 5);
		}
		engine.ctx.fill();
		engine.ctx.closePath();
	}

	/**
	 * @method
	 * @param {Color} color - The color of the gizmo.
	 * @param {Atomic} engine - The engine to draw the gizmo on.
	 */
	static boundingBox(engine, color) {
		engine.ctx.fillStyle = color.toString() || new Color(0, 0, 0, 0.3).toString();
		engine.ctx.beginPath();
		for (let i = 0; i < engine.bodies.length; i++) {
			let b = engine.bodies[i];
			engine.ctx.fillRect(b.center.x - b.halfEx.x, b.center.y - b.halfEx.y,
				b.halfEx.x + b.halfEx.x, b.halfEx.y + b.halfEx.y);
		}
		engine.ctx.fill();
		engine.ctx.closePath();
	}

	/**
	 * @method
	 * @param {Atomic} engine - The engine to draw the gizmo on.
	 */
	static information(engine) {
		let stat = 'Objects : ' + engine.bodies.length;
		let stat2 = 'Vertices : ' + engine.vertices.length;
		let stat3 = 'Constraints : ' + engine.constraints.length;
		engine.ctx.fillStyle = Color.black.toString();
		engine.ctx.font = '14px Arial'
		engine.ctx.fillText(stat, 10, 20);
		engine.ctx.fillText(stat2, 10, 40);
		engine.ctx.fillText(stat3, 10, 60);
	}
}