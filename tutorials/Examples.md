
Here are few Examples of how to use the library to do simple tasks.

## Table of Contents
* [Circles](#circles) - Render circles in a scene
* [Collision](#collision) - Detect collisions between objects
* [Cookies](#cookies) - Cookies are a great way to store data
* [Sprite](#sprite) - Render a sprite
* [Polygon](#polygon) - Render a polygon
* [Rect](#rect) - Render a rectangle
* [Spritesheet](#spritesheet) - Render images through spritesheets
* [Text](#text) - Render text
* [WireGrid](#wiregrid) - Render a wireframe grid
* [Wires](#wires) - Render wireframes for definite geometry

# Html Game Page
This is the suggested html page fot the pourpose of exploring examples.
```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Neptune Game</title>
    <style>
      *{
        margin: 0%;
        padding: 0%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>  
    <button id="neptune-play">Play</button>
    <canvas id="neptune-canvas"></canvas>
    <script type="module" src="./spritesheets.js"></script>
  </body>
</html>

```








# Circles
Neptune has Circle as a renderable entity.
## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";

// Creating a new game class, this will be the main class for the game
class Game extends npt.Application {
	// Constructor of the class is used to initiate the game.
	// All objects should be created here and Application class can be overridden here.
	constructor() {
		super();

		// Using this keyword to assign the object to the variable.
		this.test = new npt.Circle({
			radius: 50,
			app: this,
			pos: new npt.Vector2(50, 50),
			color: npt.Color.fromRGBA(255, 0, 0, 0.9)
		});

		this.test2 = new npt.Circle({
			radius: 100,
			app: this,
			parent: this.test,
			pos: new npt.Vector2(100, 100),
			color: npt.Color.fromRGBA(255, 255, 0, 0.5)
		});
	}
}

// Create a new Game
// No need to assign the game to a variable, but if you are facing Issues, try 
// let game = new Game();
new Game();

// You should have 2 translucent circles on screen.

```



## Output
<p align="center">
<iframe src="examples/circles.html"  height="333" width="333" scrolling="no"></iframe>
</p>

# Collision
Neptune.js has a Collision class which can detect collisions between objects. *Circle to Circle*, *Circle to Rect* and *Rect to Rect* collision is supported.

## Code
```javascript

import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";

class Game extends npt.Application {
	constructor() {
		super();
		this.grid = new npt.WireGrid({
			color: npt.Color.fromRGBA(0, 0, 0, 0.3),
			size: this.width,
			space: 50,
			app: this
		});

		this.test = new npt.Circle({
			radius: 30,
			app: this,
			pos: new npt.Vector2(30, 30),
			color: npt.Color.fromRGBA(255, 0, 0, 1)
		});

		this.test2 = new npt.Circle({
			radius: 30,
			app: this,
			parent: this.test,
			pos: new npt.Vector2(450, 0),
			color: npt.Color.fromRGBA(255, 255, 0, 1)
		});

		this.test3 = new npt.Rect({
			w: 30,
			h: 30,
			app: this,
			pos: new npt.Vector2(20, 300),
			color: npt.Color.fromRGBA(0, 255, 0, 1)
		});

		this.test4 = new npt.Rect({
			w: 40,
			h: 40,
			app: this,
			parent: this.test,
			pos: new npt.Vector2(300, 30),
			color: npt.Color.fromRGBA(0, 0, 255, 1)
		});
	}

	update(deltaTime) {
		super.update(deltaTime);
		this.grid.size = window.innerWidth;

		if (!npt.Collision.circleCircle(this.test, this.test2)) {
			this.test2.pos.x += -10;
		}
		else {
			this.test2.pos.x = this.test.radius + 0.9 * this.test2.radius;
		}

		if (!npt.Collision.circleRect(this.test, this.test3)) {
			this.test3.pos.y += -5;
		}

		if (!npt.Collision.rectRect(this.test3, this.test4)) {
			this.test4.pos.x += -7;
		}

	}
}
// Create a new Game
new Game();
```


## Output
<p align="center">
<iframe src="examples/collision.html"  height="333" width="333" scrolling="no"></iframe>
</p>


# Cookies
Neptune.js has a Cookie class which can be used to store data in the browser. Basic methods are `save` , `load` , `delete` and `deleteAll`.
## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";


class Game extends npt.Application {
	constructor() {
		super();
		npt.Cookies.save("test", "test");
		npt.Cookies.save("test2", "test2");
		npt.Cookies.save("test3", "test3");
		console.log(npt.Cookies.load("test"));
		console.log(npt.Cookies.load("test2"));
		console.log(npt.Cookies.load("test3"));

		// npt.Cookies.delete("test");
		// npt.Cookies.deleteAll();
	}
}
// Create a new Game
new Game();

```

# Sprite
Sprite Class is a collection of tools to load andrender sprites, resizing and cropping sprites is also supported.
Here is a example which shows how to load and crop a sprite.
## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";


class Game extends npt.Application {
	constructor() {
		super();
		this.imageOG = new npt.Sprite({
			app: this,
			src: "https://source.unsplash.com/200x200/?car",
			pos: new npt.Vector2(0, 0),
			size: new npt.Vector2(200, 200)
		});
		this.image = new npt.Sprite({
			app: this,
			src: "https://source.unsplash.com/200x200/?car",
			pos: new npt.Vector2(200, 200),
			size: new npt.Vector2(100, 100)
		});

		this.grid = new npt.WireGrid({
			size: 333,
			color: new npt.Color(0, 0, 0, 0.5),
			app: this,
			space: 100
		});
	}
	init() {
		super.init();
		this.image.crop(100, 0, 100, 100)
	}
}
// Create a new Game
new Game();


```
## Output
<p align="center">
<iframe src="examples/images.html"  height="333" width="333" scrolling="no"></iframe>
</p>

# Polygon
Polygon Class allows you to create convex polygons.

## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";


class Game extends npt.Application {
	constructor() {
		super();
		this.poly = new npt.Polygon({
			app: this,
			points: [
				new npt.Vector2(10, 10),
				new npt.Vector2(10, 200),
				new npt.Vector2(200, 200),
				new npt.Vector2(100, 10)
			],
			color: new npt.Color(255, 0, 0)
		});
	}
}
// Create a new Game
new Game();
```

## Output
<p align="center">
<iframe src="examples/polygon.html"  height="333" width="333" scrolling="no"></iframe>
</p>

# Rect
Rect is a regular rectangle. It can be used to create a rectangle which can be used to detect collision.
## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";


class Game extends npt.Application {
	constructor() {
		super();
		this.rect = new npt.Rect({
			app: this,
			pos: new npt.Vector2(10, 10),
			size: new npt.Vector2(30, 30),
			color: new npt.Color(255, 0, 0)
		});

		this.rect2 = new npt.Rect({
			app: this,
			pos: new npt.Vector2(40, 40),
			size: new npt.Vector2(30, 30),
			color: new npt.Color(0, 255, 0)
		});

		this.rect3 = new npt.Rect({
			app: this,
			pos: new npt.Vector2(70,70),
			size: new npt.Vector2(30, 30),
			color: new npt.Color(0, 0, 255)
		});
	}
}
// Create a new Game
new Game();

```
## Output
<p align="center">
<iframe src="examples/rect.html"  height="333" width="333" scrolling="no"></iframe>

# Text
Text Class allows you to create text. Simple HTML5 canvas text is supported.

### Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";


class Game extends npt.Application {
	constructor() {
		super();
		this.text = new npt.Text({
			text: "Hello World",
			pos : new npt.Vector2(100, 100),
			w: 300,
			h:30,
			font: "30px Arial",
			align: "center",
			app:    this
		})
	}
}
// Create a new Game
new Game();

```
### Output
<p align="center">
<iframe src="examples/text.html"  height="333" width="333" scrolling="no"></iframe>

# Spritesheet
## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";
class Game extends npt.Application {
	constructor() {
		super();
		this.spritesheet = new npt.SpriteSheet({
			src: "https://toppng.com/uploads/preview/spelunky-sprite-sheet-11562984861xfrhfytweq.png",
			pos: new npt.Vector2(0, 0),
			size: new npt.Vector2(16, 16)
		});

		// this.spritesheet.addSprite("test",0,0,840/12,859/12);
		this.spritesheet.addGrid("test", 0, 0, 840 / 12, 859 / 12, 12, 12);
	}

	init() {
		super.init();
		this.spritesheet.deleteSprite([
			"test_11", "test_12",
			"test_36",
			"test_60",
			"test_95", "test_96",
			"test_105", "test_106", "test_107", "test_108",
			"test_132", "test_131",
			"test_140", "test_141", "test_142", "test_143", "test_144"
		]);
		console.log(this.spritesheet.sprites);
	}

	draw(ctx) {

		this.spritesheet.draw(ctx, "test_5");
		let a = 0;
		for (let i = 0; i < 12; i++) {
			for (let j = 0; j < 12; j++) {
				a++;
				this.spritesheet.draw(ctx, "test_" + a, i * 20 + i, j * 20 + j);
			}
		}

	}
}
// Create a new Game
new Game();
```
## Output
<p align="center">
<iframe src="examples/spritesheet.html"  height="333" width="333" scrolling="no"></iframe>


# WireGrid
Wiregrid is a Gizmo that can be used to draw a grid on the screen.
Wire grid is necessary to get positions of objects.

## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";


class Game extends npt.Application {
	constructor() {
		super();
		this.grid = new npt.WireGrid({
			color: npt.Color.fromRGBA(0, 0, 0, 0.3),
			size: this.width,
			space: 100,
			app: this
		});
		this.grid2 = new npt.WireGrid({
			color: npt.Color.fromRGBA(0, 0, 0, 0.3),
			size: this.width,
			space: 10,
			app: this
		});
	}
}
// Create a new Game
new Game();
```
## Output
<p align="center">
<iframe src="examples/wiregrid.html"  height="333" width="333" scrolling="no"></iframe>



# Wires
All the Gizmos are used to get a wireframe of any dimentions.
Wiregrids or wire shapes can be used to debug vectors, or as an placeholder asset for objects.
## Code
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@latest/src/neptune.min.js";
class Game extends npt.Application {
	constructor() {
		super();
		this.grid = new npt.WireGrid({
			color: npt.Color.fromRGBA(0, 0, 0, 0.3),
			size: this.width,
			space: 100,
			app: this
		});

		this.wireRect = new npt.WireRect({
			color: npt.Color.fromRGBA(0, 0, 0, 0.3),
			pos: new npt.Vector2(10, 10),
			size: new npt.Vector2(40, 40),
			app: this
		});

		this.circle = new npt.WireCircle({
			color: npt.Color.fromRGBA(0, 0, 0, 0.3),
			pos: new npt.Vector2(this.width / 2, this.height / 2),
			radius: this.width / 6,
			app: this
		});

		this.vectr = new npt.WireLine({
			color: npt.Color.fromRGBA(255, 0, 0, 0.4),
			start: new npt.Vector2(100, 100),
			end: new npt.Vector2(200, 300),
			app: this
		});
	}
}
// Create a new Game
new Game();
```
## Output
<p align="center">
<iframe src="examples/wires.html"  height="333" width="333" scrolling="no"></iframe>




