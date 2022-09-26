
This article will help you gettting started with Neptune.js. It will explain how to install and use Neptune.js. All the essential features, such as the rendering system, the input system, the entity component system, etc. will be explained in detail.


Start with the Introduction to Neptune.js article to understand what Neptune.js is and what it can do for you. What are the features of Neptune.js and how can you use them.


## Quick Start

There is some template code that you can use to get started with Neptune.js. You can use this code to create a simple game.

### Installation

You can install Neptune.js using npm. You can use the following command to install Neptune.js.

```bash
npm install @neptune-js/neptune
```

Or Use the available ZIP file from the [GitHub Repository](https://github.com/SujalChoudhari/Neptune.js).


### HTML File
Neptune allows you to customize the game page.
The template code is as follows:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>My New Game</title>
</head>
<body>

    <!-- Play Button -->
    <button id="neptune-play">Play</button>

    <!-- Canvas used for rendering -->
    <canvas tabindex="1" id="neptune-canvas"></canvas>

    <!-- Game Javascript file -->
    <script type="module" src="myNewGame.js"></script>

</body>
</html>

```

### Javascript File

The template code is as follows:

```js

import * as npt from "../src/neptune.js"; // import neptune.js

// Create a new game
class MyNewGame extends npt.Application {
    constructor() {
        super();

        // Creations of Entities/ Scenes

    }

    Init(){

        // Initialization of Entities/ Scenes

    }
}

new MyNewGame(); // Start the game
```

Thats it! Now you are ready to start creating your own game.
Get details about the various features of Neptune.js in the tutorials section.