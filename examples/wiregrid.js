import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.grid = new npt.WireGrid({
            color: npt.Color.fromRGBA(0,0,0,0.3),
            size: this.width/20,
            app: this
        });
    }
} 
// Create a new Game
new Game();