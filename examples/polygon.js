import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.poly = new npt.Polygon({
            app:this,
            points: [
                new npt.Vector2(20, 20),
                new npt.Vector2(200, 20),
                new npt.Vector2(200, 200),
                new npt.Vector2(20, 400)
            ],
            color: new npt.Color(255, 0, 0)
        });
    }
}
// Create a new Game
new Game();