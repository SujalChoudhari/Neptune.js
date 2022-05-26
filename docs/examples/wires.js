import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.grid = new npt.WireGrid({
            color: npt.Color.fromRGBA(0,0,0,0.3),
            size: this.width,
            space: 100,
            app: this
        });

        this.wireRect = new npt.WireRect({
            color: npt.Color.fromRGBA(0,0,0,0.3),
            pos : new npt.Vector2(10, 10),
            size: new npt.Vector2(40,40),
            app: this
        });

        this.circle = new npt.WireCircle({
            color: npt.Color.fromRGBA(0,0,0,0.3),
            pos : new npt.Vector2(this.width/2, this.height/2),
            radius: this.width/6,
            app: this
        });

        this.vectr = new npt.WireLine({
            color: npt.Color.fromRGBA(255,0,0,0.4),
            start: new npt.Vector2(100,100),
            end: new npt.Vector2(200,300),
            app: this
        });
    }
} 
// Create a new Game
new Game();