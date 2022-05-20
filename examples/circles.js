import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
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
new Game();