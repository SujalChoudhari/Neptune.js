import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.test = new npt.Circle({
            radius: 10,
            app:this,
            pos: new npt.Vector2(100,100),
            color: npt.Color.random()
        });
        this.test2 = new npt.Rect({
            app:this,
            pos: new npt.Vector2(200,200),
            color: npt.Color.random(),
            size: new npt.Vector2(100,100),
            parent: this.test
        });

    }

    // Update is called every frame, used to run logic and physics
    update(deltaTime){
        super.update(deltaTime);
        this.test.rotateDegrees(1);

    }
    
    // Draw method used to draw Renderables on the screen, draw is called just after update
    draw(ctx){
        super.draw(ctx);
    }
}
// Create a new Game
new Game();