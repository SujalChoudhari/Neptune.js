import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.image = new npt.Sprite({
            app:this,
            src: "https://source.unsplash.com/800x400/?nature",
            pos: new npt.Vector2(20,200),
            size: new npt.Vector2(800,400)
        });
    }
}
// Create a new Game
new Game();