
## Initiation
Follow the steps listed above to get started initializing your project.
You can choose from the options mentioned above.


Once you have installed/imported everything, You are ready to start using the features of Neptune.js.

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
import * as npt  from '@neptune-js/neptune'; // Depends on how you installed Neptune.js

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

// Create a new Game
new Game();
```

Thats it! You can now start making your game using the neptune.js framework.

## Simple Circle Example
Circle is a renderable object which we can draw on the screen. 
The following code will draw a red circle to the center of the screen.

```javascript
import * as npt  from '@neptune-js/neptune'; // Depends on how you installed Neptune.js

class Game extends npt.Application {
    constructor() {
        super();
        this.circle = new npt.Circle({
            app: this,  /*  when you pass the game class to the Entity(here,Circle), 
                            it will automatically set the app property to the game class 
                            and will draw and update the entity on the canvas without you having to call the draw/update method.*/
            pos: new npt.Vector2(this.width / 2, this.height / 2),
            radius: 100,
            color: npt.Color.red
        });
    }
}

new Game();
```


## Hello World Example
## Hello World!
Creating Text is simple, here is the code to follow
```javascript
class Game extends npt.Application {
    constructor() {
        super();
        this.background = new npt.Rect({
            app:this,
            pos: new npt.Vector2(0, 0),
            w: this.width,
            h: this.height,
            color: npt.Color.black
        });

        this.text = new npt.Text({
            parent: this.background, // property of an entity
            pos: new npt.Vector2(200,200),
            text: "Hello World",
            font: "30px Roboto", // all fonts which are supported by html5 canvas can be used here
            color: npt.Color.white,
            align: "center" // this is text align (similar to the html5 canvas) https://www.w3schools.com/tags/canvas_textalign.asp
        }); 
    }

    init() {
        super.init();
        this.text.align("center");
        this.text.align('middle');
    }

    update(deltaTime){
        super.update(deltaTime);
        this.text.update(delatTime);  // Because app is not set of the text, we need to call update manually.
    }
}

new Game();

```

Congratulations, you've learned the basics of using Neptune.js! If you want to explore more, check out the Documentation and Create Wonderfull games.