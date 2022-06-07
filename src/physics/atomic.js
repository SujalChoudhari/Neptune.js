import { Details } from '../graphics/gizmos/details.js';
import { Application } from '../main.js';
import { Color } from '../basic/color.js';
import { Body } from './body.js';
import { Collision } from './collision.js';
import { Constraint } from './constraints.js';
import { Vertex } from './vertex.js';

/**
 * @class Atomic
 * @classdesc Atomic is a standalone physics engine made by @anuraghazra.
 * @see https://github.com/anuraghazra/Atomic.js
 * 
 * @property {HTMLCanvasElement} canvas - The canvas element to draw on.
 * @property {CanvasRenderingContext2D} ctx - The canvas context.
 * @property {Number} width - The width of the canvas.
 * @property {Number} height - The height of the canvas.
 * @property {Number} gravity - The gravity of the engine.
 * @property {Number} friction - The friction of the engine.
 * @property {Number} groundFriction - The friction of the ground.
 * @property {Number} simIteration - The number of iterations of the simulation.
 * @property {Number} constraintIterations - The number of constraint iterations.
 * @property {Number} collisionIterations - The number of collision iterations.
 * 
 * @property {Array.<Body>} bodies - The bodies in the engine.
 * @property {Array.<Vertex>} vertices - The vertices in the engine.
 * @property {Array.<Constraint>} constraints - The constraints in the engine.
 * 
 * @since 2.0.0
 * @license MIT
 * @author 	Anurag Hazra
 * 
 */
export class Atomic {

	static canvas;
	static ctx;
	static width;
	static height;
	static gravity;
	static friction;
	static groundFriction;
	static simIteration;
	static constraintIterations;
	static collisionIteration;
	static bodies;
	static vertices;
	static constraints;
	static collision;


	/**
	 * @method
	 * @description Initializes the physics engine.
	 * @param {Object} kwargs - The options for the engine.
	 * @param {Application} kwargs.app - The application to draw on.
	 * @param {Number} kwargs.gravity - The gravity of the engine.
	 * @param {Number} kwargs.friction - The friction of the engine.
	 * @param {Number} kwargs.simIteration - The number of iterations of the simulation.
	 */
	static init(kwargs) {
		let app = kwargs["app"];
		Atomic.ctx = app.ctx;
		Atomic.width = app.width;
		Atomic.height = app.height;
		Atomic.canvas = app.canvas;
		Atomic.gravity = kwargs["gravity"] || 1;
		Atomic.friction = kwargs["friction"] || 0.1;
		Atomic.groundFriction = 0.1;
		Atomic.simIteration = kwargs["simIteration"] || 50;
		Atomic.constraintIterations = 1;
		Atomic.collisionIteration = Atomic.simIteration / 2;
		Atomic.bodies = [];
		Atomic.vertices = [];
		Atomic.constraints = [];
		Atomic.collision = new Collision();


		/**
		 * @class
		 * @classdesc Premitives are used to draw on the canvas.
		 */
		Atomic.Poly = {


			/**
			 * @method
			 * @description Draws a box on the canvas.
			 * @param {Number} x - The x coordinate of the box.
			 * @param {Number} y - The y coordinate of the box.
			 * @param {Number} w - The width of the box.
			 * @param {Number} h - The height of the box.
			 * @param {Object} kwargs - The options for the box.
			 * @param {Number} [kwargs.mass=1] - The mass of the box.
			 * @param {Number} [kwargs.angle=0] - The angle of the box.
			 * @param {Boolean} [kwargs.static=false] - Whether the box is static or not.
			 * @param {Object} kwargs.render - The details of the box.
			 * @param {Color} kwargs.render.fillStyle - The fill style of the box.
			 * @param {Boolean} kwargs.render.strokeStyle - The stroke style of the box.
			 * 
			 * @returns {Body} The body of the box.
			 * @since 2.0.0
			 * @license MIT
			 * @author 	Anurag Hazra
			 * 
			 * @example
			 * let box = Atomic.Poly.box({
			 * 		mass: 1,
			 * 		angle: 0,
			 * 		static: false,
			 * 		render: {
			 * 			fillStyle: Color.random()
			 * 		}
			 * });
			 * 
			 */
			box: (x, y, w, h, kwargs) => {
				var b = new Body({
					mass: kwargs.mass || 1,
					angle: kwargs.angle || 0,
					static: (kwargs.static || false),
					render: kwargs.render,
					vertices: {
						n0: { x: x, y: y },
						n1: { x: x + w, y: y },
						n2: { x: x + w, y: y + h },
						n3: { x: x, y: y + h }
					},
					constraints: [
						["n0", "n1", true],
						["n1", "n2", true],
						["n2", "n3", true],
						["n3", "n0", true],
						["n0", "n2"],
						["n3", "n1"]
					]
				}, Atomic);
				Atomic.bodies.push(b);
				return b;
			},


			/**
			 * @method
			 * @description Draws a triangle on the canvas.
			 * @param {Number} x - The x coordinate of the triangle.
			 * @param {Number} y - The y coordinate of the triangle.
			 * @param {Number} w - The width of the triangle.
			 * @param {Number} h - The height of the triangle.
			 * @param {Object} kwargs - The options for the triangle.
			 * @param {Number} [kwargs.mass=1] - The mass of the triangle.
			 * @param {Boolean} [kwargs.static=false] - Whether the triangle is static or not.
			 * @param {Object} kwargs.render - The details of the triangle.
			 * @param {Color} kwargs.render.fillStyle - The fill style of the triangle.
			 * @param {Boolean} kwargs.render.strokeStyle - The stroke style of the triangle.
			 * 
			 * @returns {Body} The body of the triangle.
			 * @since 2.0.0
			 * @license MIT
			 * @author 	Anurag Hazra
			 * 
			 * @example
			 * let triangle = Atomic.Poly.triangle({
			 * 		mass: 1,
			 * 		static: false,
			 * 		render: {
			 * 			fillStyle: Color.random()
			 * 		}
			 * });
			 * 
			 */
			triangle: (x, y, w, h, kwargs) => {
				w /= 2;
				h /= 2;
				var b = new Body({
					x: x,
					y: y,
					mass: kwargs.mass,
					static: (kwargs.static || false),
					render: kwargs.render,
					vertices: {
						0: { x: x - w, y: y + h },
						1: { x: x, y: y - h },
						2: { x: x + w, y: y + h }
					},
					constraints: [[0, 1, true], [1, 2, true], [2, 0, true]]
				}, Atomic);
				Atomic.bodies.push(b);
				return b;
			},
		};
	}

	/**
	 * @method
	 * @static
	 * @description Add a new vertex.
	 * 
	 * @param {Number} x - The x coordinate of the vertex.
	 * @param {Number} y - The y coordinate of the vertex.
	 * @param {Boolean} pinned - Whether the vertex is pinned or not.
	 * 
	 * 
	 */
	static addVertex(x, y, pinned) {
		let vertex = new Atomic.Vertex(Atomic, { x: x, y: y }, pinned, {
			friction: Atomic.friction,
			gravity: Atomic.gravity,
			canvas: Atomic.canvas,
			engine: Atomic
		});
		Atomic.vertices.push(vertex);
	}

	/**
	 * @method
	 * @static
	 * @description Add a new constraint.
	 * @param {Number} i - The index of the first vertex.
	 * @param {Number} j - The index of the second vertex.
	 * 
	 */
	static addConstraint(i, j, edge) {
		let cons = new Atomic.Constraint(Atomic, Atomic.vertices[i], Atomic.vertices[j], edge);
		Atomic.constraints.push(cons);
	}

	/**
	 * @method
	 * @static
	 * @description Create a new Poly
	 * @param {Vertex} vert - The vertices of the poly.
	 * @param {Constraint} cons - The constraints of the poly.
	 * @param {Object} kwargs - The options for the poly.
	 * @param {Number} [kwargs.mass=cons.mass] - The mass of the poly.
	 * @param {Object} [kwargs.render=cons.render] - The details of the poly.
	 * 
	 * @returns {Body} The body of the poly.
	 */
	static createPoly(vert, cons, kwargs) {
		if (kwargs === undefined)
			kwargs = {};
		let b = new Atomic.Body({
			mass: (arguments.length === 2) ? cons.mass : kwargs.mass,
			render: (arguments.length === 2) ? cons.render : kwargs.render,
			vertices: vert,
			constraints: (cons || [])
		}, Atomic);
		if (arguments.length === 2) {
			// join outer vertex
			for (let i = 0; i < b.vertices.length; i++) {
				let bvert = b.vertices;
				let cons = new Atomic.Constraint(b, b.vertices[i], b.vertices[(i + 1) % bvert.length], true);
				b.edges.push(cons);
				Atomic.constraints.push(cons);
				b.eCount++;
			}
			// add center vertex
			b.calculateCenter();
			let centerVertex = new Atomic.Vertex(b, b.center, false, {
				friction: Atomic.friction,
				canvas: Atomic.canvas,
				groundFriction: Atomic.groundFriction,
				engine: Atomic
			});
			b.vertices.push(centerVertex);
			b.positions.push(centerVertex.position);
			Atomic.vertices.push(centerVertex);
			b.vCount++;
			// join to center vertex
			for (let i = 0; i < b.vertices.length - 1; i++) {
				let cons = new Atomic.Constraint(b, b.vertices[i], b.vertices[b.vertices.length - 1], false);
				b.edges.push(cons);
				b.eCount++;
				Atomic.constraints.push(cons);
			}
		}
		Atomic.bodies.push(b);
		return b;
	}

	/** Physics Simulation Update */
	/**
	 * @method
	 * @static
	 * @description Update the vertices
	 * 
	 */
	static integrate() {
		for (let i = 0; i < Atomic.vertices.length; i++) {
			Atomic.vertices[i].integrate();
		}
	}

	/**
	 * @method 
	 * @static
	 * @description Solve the varlet physics equations
	 */
	static updateConstraints() {
		// solve constrains
		for (let i = 0; i < Atomic.constraints.length; i++) {
			Atomic.constraints[i].solve();
		}
	}

	/**
	 * @method
	 * @static
	 * @description Handles all bodies boundary collisions
	 */
	static updateBoundary() {
		for (let i = 0; i < Atomic.vertices.length; i++) {
			Atomic.vertices[i].boundary();
		}
	}

	/**
	 * @method
	 * @static
	 * @description Batch Update Collisions
	 */
	static updateCollision() {
		// Recalculate the bounding boxes
		for (let i = 0; i < Atomic.bodies.length; i++) {
			Atomic.bodies[i].calculateCenter();
		}
		// // collisions detection
		for (let i = 0; i < Atomic.bodies.length - 1; i++) {
			let b0 = Atomic.bodies[i];
			for (let j = i + 1; j < Atomic.bodies.length; j++) {
				let b1 = Atomic.bodies[j];
				if (Atomic.collision.aabb(b0, b1)) {
					Atomic.collision.SAT(b0, b1)
						&& Atomic.collision.resolve(Atomic.friction);
				}
			}
		}
	}
	/**
	 * @method
	 * @static
	 * @description Solve All Collision And Update
	 */
	static update() {
		Atomic.integrate();
		for (let n = 0; n < Atomic.simIteration; n++) {
			for (let j = 0; j < Atomic.constraintIterations; j++) {
				Atomic.updateBoundary();
				Atomic.updateConstraints();
			}
			Atomic.updateCollision();
		}
	}
	/**
	 * @method
	 * @description draw all bodies
	 */
	static render() {
		for (let i = 0; i < Atomic.bodies.length; i++) {
			Atomic.bodies[i].draw();
		}
	}


	/**
	 * @method
	 * @static
	 * @description show the fps information
	 * @param {kwargs} kwargs - The options for the fps.
	 * @param {Number} [kwargs.x=10] - The x position of the fps.
	 * @param {Number} [kwargs.y=10] - The y position of the fps.
	 * @param {Number} [kwargs.updateSpeed=3] - The update speed of the fps.
	 * @param {Color} [kwargs.barsColor=Color.green] - The color of the fps.
	 */
	static showFps(kwargs) {
		let x =  kwargs.x ||  10;
		let y =  kwargs.y ||  10;
		let updateSpeed =  kwargs.updateSpeed || 3;
		let date = new Date();
		if (!Atomic.fpsScope.lastframe) {
			Atomic.fpsScope.lastframe = date.valueOf();
			Atomic.fpsScope.fps = 0;
			return;
		}
		let delta = (date.valueOf() - Atomic.fpsScope.lastframe) / 1000;
		let frametime = (date.valueOf() - Atomic.fpsScope.lastframe);
		Atomic.fpsScope.lastframe = date.valueOf();
		//bar_vx variable for moving bars in x axis
		Atomic.fpsScope.bar_vx++;
		if (Atomic.fpsScope.bar_vx > updateSpeed) {
			Atomic.fpsScope.bar_vx = 0;
		}
		//if bar_vx variable is equal to 1 then roundup the fps
		if (Atomic.fpsScope.bar_vx === 0) {
			Atomic.fpsScope.fps = (1 / delta).toFixed(1);
		}
		//render
		let color = kwargs.barsColor || Color.green;
		if (Atomic.fpsScope.fps < 40) {
			color = Color.orange;
		}
		if (Atomic.fpsScope.fps < 20) {
			color = Color.red;
		}
		Atomic.fpsScope.fpsBars.push({
			x: x + (Atomic.fpsScope.bar_vx),
			y: Atomic.fpsScope.fps / 2,
			color: color
		});
		if (Atomic.fpsScope.fpsBars.length > 87) {
			Atomic.fpsScope.fpsBars.shift();
		}
		let ctx = Atomic.ctx;
		function drawFpsMeter() {
			ctx.beginPath();
			//bounds
			ctx.fillStyle = (kwargs.background).toString() || Color.white.toString();;
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 0.5;
			ctx.fillRect(x - 5, y - 5, 100, 60);
			ctx.strokeRect(x - 5, y - 5, 100, 60);
			ctx.fill();
			ctx.stroke();
			//fps
			ctx.fillStyle = kwargs.fontColor.toString() || Color.black.toString();;
			ctx.font = kwargs.font || '10px Arial';
			ctx.fillText('FPS : ' + Atomic.fpsScope.fps, x, y + 10);
			//bars
			ctx.save();
			ctx.scale(1, -1); //rotate
			for (let i = 0; i < Atomic.fpsScope.fpsBars.length; i++) {
				ctx.fillStyle = Atomic.fpsScope.fpsBars[i].color.toString();;
				Atomic.fpsScope.fpsBars[i].x += 1;
				ctx.fillRect(Atomic.fpsScope.fpsBars[i].x - 2, -50 - y, 1.2, Atomic.fpsScope.fpsBars[i].y);
			}
			ctx.restore();
			//60fps line
			ctx.strokeStyle = Color.crimson.toString();
			ctx.moveTo(x, y + 20);
			ctx.lineTo(x + 90, y + 20);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.closePath();
		}
		drawFpsMeter.call(Atomic, null);
		return Atomic.fpsScope.fps;
	}
}


Atomic.Body = Body;
Atomic.Vertex = Vertex;
Atomic.Constraint = Constraint;

/**
 * @method
 * @description shows current framerate 
 * @property {Number} fps - The current framerate.
 * @property {Number} lastframe - The last frame time.
 * @property {Number} bar_vx - The bar x position.
 * @property {Array} fpsBars - The fps bars.
 */
Atomic.fpsScope = {
	fps: null,
	bar_vx: 0,
	lastframe: null,
	fpsBars: []
};
