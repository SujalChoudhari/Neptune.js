import * as npt from  '../src/neptune.js'


export class Game extends npt.Application {
    constructor(){
        super();

        this.main = new npt.Entity("Main");
        let transform = new npt.UITransform(0,0,100,100,0);
        this.main.addComponent(transform);
        transform.align("center");
        transform.fill("both",10,30);

        this.panel = new npt.Entity("Panel");   
        let panelTransform = new npt.Panel(0,0,100,100,0,npt.Color.fuchsia);
        this.panel.addComponent(panelTransform);
        this.main.addChild(this.panel);
        panelTransform.align("center");
        panelTransform.align("bottom");
        panelTransform.fill("both",30,10);
        console.log(this.panel)
    }

    Init(){

    }

    Update(timeStamp){

    }

    Draw(ctx){
        this.main.getComponent(npt.UITransform).debugDraw(ctx);
        this.panel.getComponent(npt.Panel).draw(ctx);
    }
}

new Game();