import * as npt from "../src/neptune.js";


class Game extends npt.Application{
    constructor(){
        super();

    }

    draw(ctx){
        super.draw(ctx);
        npt.Wireframe.circle(ctx, new npt.Vector2(100,100), 50, npt.Color.red);
        npt.Wireframe.rect(ctx, new npt.Vector2(200,200), new npt.Vector2(100,100), npt.Color.green);
        npt.Wireframe.grid(ctx,this.width,100,new npt.Color(0,0,0,0.5));
        npt.Wireframe.line(ctx, new npt.Vector2(200,300), new npt.Vector2(300,200), npt.Color.red);
    }

    
}

new Game();