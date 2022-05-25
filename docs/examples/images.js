import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.imageOG = new npt.Sprite({
            app:this,
            src: "https://images.unsplash.com/photo-1587340532186-b92aa5512b6a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=MnwxfDB8MXxyYW5kb218MHx8cmFuZG9tfHx8fHx8MTY1MzMxNjE5Ng&ixlib=rb-1.2.1&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=400",
            pos: new npt.Vector2(0,0),
            size: new npt.Vector2(400,400)
        });
        this.image = new npt.Sprite({
            app:this,
            src: "https://images.unsplash.com/photo-1587340532186-b92aa5512b6a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=MnwxfDB8MXxyYW5kb218MHx8cmFuZG9tfHx8fHx8MTY1MzMxNjE5Ng&ixlib=rb-1.2.1&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=400",
            pos: new npt.Vector2(400,0),
            size: new npt.Vector2(200,200)
        });
        
        this.grid = new npt.WireGrid({
            size : 3 * 200,
            app:this,
            space: 200
        });
    }
    init(){
        super.init();
        this.image.crop(200,0,200,200)
    }
}
// Create a new Game
new Game();