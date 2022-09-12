import * as npt from  '../src/neptune.js'


export class Game extends npt.Application {
    constructor(){
        super();
        this.scene = new npt.Scene();

        this.main = new npt.Entity();
        this.scene.addChild(this.main);
        this.main.addComponent(new npt.UITransform(100,100,100,100));
        let container = new npt.MarginContainer(0,10,10,10);
        this.main.addComponent(container);
        container.update();
        this.main.addComponent(new npt.Text("Hello World", "30px Arial", npt.Text.ALIGN_CENTER, npt.Color.aqua));

        this.sprite = new npt.Entity();
        this.sprite.addComponent(new npt.UITransform(100,100,100,100));
        this.sprite.addComponent(new npt.UISprite("https://img.itch.zone/aW1nLzUwMDIwNzQucG5n/105x83%23/fpVj5Y.png", 32, 32));
        this.scene.addChild(this.sprite);
    }

    Init(){
        
    }

    Update(timeStamp){
        if(this.main.getComponent(npt.UITransform).isClicked()) console.log("Hovered");


        
    }

    Draw(ctx){
        this.scene.draw(ctx);
    }
}

new Game();