
This article will help you gettting started with Neptune.js. It will explain how to install and use Neptune.js. All the essential features, such as the rendering system, the input system, the entity component system, etc. will be explained in detail.


Start with the Introduction to Neptune.js article to understand what Neptune.js is and what it can do for you. What are the features of Neptune.js and how can you use them.


## Quick Start

There is some template code that you can use to get started with Neptune.js. You can use this code to create a simple game.

### Installation

You can install Neptune.js using npm.
Use the available ZIP files in the releases section from the [GitHub Repository](https://github.com/SujalChoudhari/Neptune.js).


### HTML File
Neptune allows you to customize the game page.
The template code is as follows:

```html
<!-- index.html -->
<html lang="en">
<head>
    <title>Demo Game</title>
</head>
<body>
    <div id="neptune-gamepage">
        <!-- Elements here will be removed once game starts (optional) -->
    </div>
    <div id="neptune-loading"> 
        <!-- Elements here will be removes once the game is ready to play (optional) -->
    </div>
    <script type="module" src="./yourfile.js"></script> <!-- Your custom file (which imports Neptune.js)-->
</body>
</html>

```

### Javascript File

The template code is as follows:

```js

import * as npt from "../src/neptune.js"; // Import Neptune.js

// And thats it! You are ready to start creating your game.

```

Thats it! Now you are ready to start creating your own game.
Get details about the various features of Neptune.js in the tutorials section.