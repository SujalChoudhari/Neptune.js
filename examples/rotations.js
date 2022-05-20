import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.rect = new npt.Rect({
            app:this,
            pos: new npt.Vector2(300,300),
            color: npt.Color.cyan,
            w: 100,
            h: 100,
            rot : 0
        });

        this.rect2 = new npt.Rect({
            app:this,
            parent: this.rect,
            pos: new npt.Vector2(100,100),
            color: npt.Color.darkgoldenrod,
            size: new npt.Vector2(100,100)
        });

        this.rect3 = new npt.Rect({
            app:this,
            parent: this.rect2,
            pos: new npt.Vector2(100,100),
            color: npt.Color.darkcyan,
            size: new npt.Vector2(100,100)
        });
    }
    init(){
        super.init();

    }


    update(deltaTime){
        super.update(deltaTime);
        this.rect.rotateDegrees(1);
        this.rect2.rotateDegrees(1);
        console.log(this.rect2.worldPos);
    }   

}
// Create a new Game
new Game();