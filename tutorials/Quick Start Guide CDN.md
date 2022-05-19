
To start making use of Neptune.js framework, 
you first need to have at least the bare bones 
of a neptune project, this is easy to replicate and
can be customised to your needs.

You can use the NPM to load the neptune.js library.


## Import
```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@0.0.4-s/neptune.min.js"
```

## Setting up the HTML
This is the HTML that will be used to render the neptune.js application.
It is highly customizable and can be changed to suit your needs.
This HTML template is the minimum required to render the neptune.js application.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Neptune Game</title>
  </head>
  <body>  

    <!-- Game won't start until user clicks on the button -->
    <button id="__play__">Play</button>
    <!--The canvas where your game will be drawn -->
    <canvas id="__panel__"></canvas>
  
    <!--Link the game file into the html -->

    <script type="module" src="./main.js"></script>

  </body>
</html>
```


## Setting up the game file (main.js)
This file will provide a entry point for the game.
It is the only file that needs to be imported into the HTML.

```javascript
import * as npt from "https://cdn.jsdelivr.net/npm/@neptune-js/neptune@0.0.4-s/neptune.min.js"

class Game extends npt.Application{
    constructor(){
        super();
        // To create Entities. 
    }

    // Init is called only once when the Game starts, used for Initiating Code
    init(){
        super.init();
    }
    
    // Update is called every frame, used to run logic and physics
    update(deltaTime){
        super.update(deltaTime);
    }
    
    // Draw method used to draw Renderables on the screen, draw is called just after update
    draw(ctx){
        super.draw(ctx);
    }
}
```

Thats all you need to get started with Neptune.js with CDN. Follow [Quick Start Guide](tutorial-Quick%20Start%20Guide.html) for simple examples.