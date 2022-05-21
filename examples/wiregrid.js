import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.grid = new npt.WireGrid({
            color: npt.Color.fromRGBA(0,0,0,0.3),
            size: this.width,
            space:100,
            app: this
        });
        this.grid2 = new npt.WireGrid({
            color: npt.Color.fromRGBA(0,0,0,0.3),
            size: this.width,
            space:10,
            app: this
        });
    }
} 
// Create a new Game
new Game();