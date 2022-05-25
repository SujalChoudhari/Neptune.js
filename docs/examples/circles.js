// Importing Neptune.js
import * as npt from "@neptune-js/neptune"

// Creating a new game class, this will be the main class for the game
class Game extends npt.Application{
    // Constructor of the class is used to initiate the game.
    // All objects should be created here and Application class can be overridden here.
    constructor(){
        super();

        // Using this keyword to assign the object to the variable.
        this.test = new npt.Circle({
            radius: 100,
            app:this,
            pos: new npt.Vector2(200,200),
            color: npt.Color.fromRGBA(255,0,0,0.1)
        });

        this.test2 = new npt.Circle({
            radius: 100,
            app:this,
            parent: this.test,
            pos: new npt.Vector2(200,200),
            color: npt.Color.fromRGBA(255,255,0,0.5)
        });
    }
}

// Create a new Game
// No need to assign the game to a variable, but if you are facing Issues, try 
// let game = new Game();
new Game();

// You should have 2 translucent circles on screen.
