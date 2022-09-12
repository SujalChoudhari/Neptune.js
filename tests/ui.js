import * as npt from  '../src/neptune.js'


export class Game extends npt.Application {
    constructor(){
        super();
        this.scene = new npt.Scene();

        this.main = new npt.Entity();
        this.main.addComponent(new npt.UITransform(100,100,100,100));
        let container = new npt.MarginContainer(0,10,10,10);
        this.main.addComponent(container);
        container.update();
        this.main.addComponent(new npt.Text("Hello World", "30px Arial", npt.Text.ALIGN_CENTER, npt.Color.aqua));
        this.scene.addChild(this.main);
    }

    Init(){
        npt.Input.init(this.canvas);
    }

    Update(timeStamp){
        if(this.main.getComponent(npt.UITransform).isClicked()) console.log("Hovered");


        npt.Input.clear();
    }

    Draw(ctx){
        this.scene.draw(ctx);
    }
}

new Game();