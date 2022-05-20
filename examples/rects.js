import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.rect = new npt.Rect({
            app:this,
            pos: new npt.Vector2(200,200),
            size: new npt.Vector2(100,100),
            color: new npt.Color(255,0,0)
        });

        this.rect2 = new npt.Rect({
            app:this,
            pos: new npt.Vector2(300,300),
            size: new npt.Vector2(100,100),
            color: new npt.Color(0,255,0)
        });

        this.rect3 = new npt.Rect({
            app:this,
            pos: new npt.Vector2(400,400),
            size: new npt.Vector2(100,100),
            color: new npt.Color(0,0,255)
        });
    }
}
// Create a new Game
new Game();