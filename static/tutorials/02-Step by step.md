# Guide to Neptune: Step by Step

## Entities

In Neptune, everything in your game is represented as an "Entity." An Entity is like a container that holds different parts called "Components." Each Component adds specific features and behaviors to the Entity. You can also group Entities together in parent-child relationships to create hierarchies.

### Creating an Entity

To create an Entity, you need to follow these steps:

1. First, import the Neptune library at the beginning of your code.
2. Then, you can create an Entity using the following code:

```javascript
import * as npt from "../src/index.js";

let myEntity = new npt.Entity();
```

## Scenes

A "Scene" is a special type of Entity that acts as the root of your game. You can have multiple Scenes, but only one Scene can be active at a time. The Scene is responsible for rendering all the Entities within it.

### Creating a Scene

Creating a Scene is straightforward:

```javascript
import * as npt from "../src/index.js";

let myScene = new npt.Scene();
```

### Adding an Entity to a Scene

To add an Entity to a Scene, you can use the following code:

```javascript
import * as npt from "../src/index.js";

let myScene = new npt.Scene();
let myEntity = new npt.Entity();

myScene.addChild(myEntity);
```

## Components

Components are the building blocks of an Entity. They add functionality and data to the Entity, such as graphics, movement, or behaviors.

### Creating a Component

Let's create a few Components and attach them to an Entity:

```javascript
import * as npt from "../src/index.js";

let myEntity = new npt.Entity();

// Create a Transform Component for position, rotation, and scale
let transformComponent = new npt.Transform(new npt.Vector2(1, 1), 0, new npt.Vector2(1, 1));

// Create a Sprite Component with an image URL and size
let spriteComponent = new npt.Sprite("https://example.com/my-image.png", 1, 1);

// Create a Circle Shape Component with specific properties
let circleShapeComponent = new npt.Shape(npt.Shape.CIRCLE, npt.Color.wheat, true, { radius: 10, thickness: 4 });

// Add the Components to the Entity
myEntity.addComponent(transformComponent);
myEntity.addComponent(spriteComponent);
myEntity.addComponent(circleShapeComponent);
```

## Putting It All Together

Now, let's assemble our Scene with the Entity we created and visualize it:

```javascript
import * as npt from "../src/index.js";

// Create a new Scene
let myScene = new npt.Scene();

// Create a new Entity
let myEntity = new npt.Entity();

// Add Components to the Entity
myEntity.addComponent(new npt.Transform(new npt.Vector2(1, 1), 0, new npt.Vector2(1, 1)));
myEntity.addComponent(new npt.Sprite("https://example.com/my-image.png", 1, 1));
myEntity.addComponent(new npt.Shape(npt.Shape.CIRCLE, npt.Color.wheat, true, { radius: 10, thickness: 4 }));

// Add the Entity to the Scene
myScene.addChild(myEntity);
```

With these simple steps, you have created an Entity, added Components to it, and placed it in a Scene. Now you can expand your game by adding more Entities, Components, and Scenes to create a fully functional and interactive game!