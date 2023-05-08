This series builds upon the Introduction and will get you started with the concepts with the Editor Component System.

## Entity

Every Object in Neptune is an Entity. An Entity is a collection of Components.
An Entity can have multiple Components. Each Component has a unique type.
Entity can also has children Entities. Children Entities are Entities that are attached to the parent Entity.
All the children entities are rendered relative to the parent Entity.
If a parent entity is deleted, all the children entities are also deleted.
But if a child entity is deleted, the parent entity is not deleted.
This behaviour is similar to the DOM in HTML. Thus allows to create hierarchies of Entities.

### Creating an Entity

```js
import * as npt from "../Neptune.js-main/src/index.js";

class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.player = new npt.Entity();
        console.log(this.player);
        /**
         * Entity {
         * name: "Entity",
         * children: [],
         * components: [],
         * parent: null
         * }
         */
    }
}

new MyNewGame();

```


## Scene

Scene is a Special Entity. It is the root Entity of the game.
There can be multiple Scenes in a game. But only one Scene can be active at a time. (Multiple Scenes under special conditions).
The rendering of the Hierarchies of Entities is done by the Scene.
The scnenes are managed by a SceneManager. The SceneManager is a singleton class.


### Creating a Scene

```js

import * as npt from "../Neptune.js-main/src/index.js";

class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.mainMenu = new npt.Scene();
        this.mainMenu.name = "Main Menu";
        console.log(this.mainMenu);
        /**
         * Scene {
         * name: "Main Menu",
         * children: [],
         * components: [],
         * parent: null,
         * id: 0
         * }
         */
    }

}

new MyNewGame();

```

### Adding An Entity to a Scene

```js
import * as npt from "../Neptune.js-main/src/index.js";

class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.mainMenu = new npt.Scene("MainMenu");

        this.button = new npt.Entity("Button");

        this.mainMenu.addChild(this.button);
        // Use addChild function to add an Entity to a Scene.

        console.log(this.mainMenu);
        /**
         * Scene {
         * name: "MainMenu",
         * children: [Entity],
         * components: [],
         * parent: null,
         * id: 0
         * }
         */

    }

}

new MyNewGame();

```

## Components

A compoennt is a part of an Entity. It adds functionality to the Entity.
A component is a set of data and functions added to an Entity.
Only one compnent of a type can be added to an Entity.
All the components will be explained in detail in later tutorials.


### Creating a Component

```js   
import * as npt from "../Neptune.js-main/src/index.js";

class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.player = new npt.Entity();
        let transform = new npt.Transform( // new Transform Component
            new npt.Vector2(0, 0),  //position
            0,                      //rotation
            new npt.Vector2(1, 1)   //scale
        );

        this.player.addComponent(transform); // add the component to the Entity

        console.log(this.player);
        /**
         * Entity {
         * name: "Entity",
         * components: [Transform],
         * children: [],
         * parent: null
         * }
         */
    }

}

new MyNewGame();

```

## Application

The Application is the main class of Neptune. It is the entry point of the game.
Application holds the responsibility of Starting the Game, Updating the various Systems, Rendering the Scene, Managing the Game Loop, etc.

```js
import * as npt from "../Neptune.js-main/src/index.js";

class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.fps; // Max/Suggested FPS
        this.clearColor; // Background color
        this.width; // Width of the canvas
        this.height; // Height of the canvas
        this.deltaTime; // Time between two frames

    }

    Init() {
        // Called after the game is loaded
        // Add your game initialization code here
    }

    Update() {
        // Called every frame
        // Add your game update code here
    }

    Draw() {
        // Called after the update function
        // Add your game draw code here
        // Scenes are drawn automatically
    }

}

new MyNewGame();

```

# System

There are various systems in Neptune. Each system is responsible for a specific task.
- **Rendering System**
A renderable component houses the data required to render the Entity.

- **Input System**
The Input System is responsible for handling the input events.
It can be used to get the input from the keyboard, mouse, touch, etc.


- **SceneManager System**
The SceneManager System is responsible for managing the Scenes.
It loads the Scenes, unloads the Scenes, etc.

- **Scripting System**
The Scripting System is responsible for running the scripts.
It can be used to run the scripts in the game.
There are 2 types of scripts in Neptune.
    - **Behaviour Scripts**
    - **Global Scripts**


