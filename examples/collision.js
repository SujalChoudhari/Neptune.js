import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.grid = new npt.WireGrid({
            color: npt.Color.fromRGBA(0,0,0,0.3),
            size: this.width,
            space:50,
            app: this
        });

        this.test = new npt.Circle({
            radius: 30,
            app:this,
            pos: new npt.Vector2(200,200),
            color: npt.Color.fromRGBA(255,0,0,1)
        });

        this.test2 = new npt.Circle({
            radius: 30,
            app:this,
            parent: this.test,
            pos: new npt.Vector2(450,0),
            color: npt.Color.fromRGBA(255,255,0,1)
        });
        
        this.test3 = new npt.Rect({
            w: 30,
            h: 30,
            app:this,
            pos: new npt.Vector2(190,400),
            color: npt.Color.fromRGBA(0,255,0,1)
        });

        this.test4 = new npt.Rect({
            w: 40,
            h: 40,
            app:this,
            parent: this.test,
            pos: new npt.Vector2(450,30),
            color: npt.Color.fromRGBA(0,0,255,1)
        });
    }

    update(deltaTime){
        super.update(deltaTime);
        this.grid.size = window.innerWidth;
        
        if(!npt.Collision.circleCircle(this.test, this.test2)){
            this.test2.pos.x += -10;
        }
        else{
            this.test2.pos.x = this.test.radius + 0.9* this.test2.radius;
        }

        if(!npt.Collision.circleRect(this.test, this.test3)){
            this.test3.pos.y += -5;
        }

        if(!npt.Collision.rectRect(this.test3, this.test4)){
            this.test4.pos.x += -7;
        }

    }
}
// Create a new Game
new Game();