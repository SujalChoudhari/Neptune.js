import * as npt from  '../src/neptune.js'


export class Game extends npt.Application {
    constructor(){
        super();
        // let shape = new npt.Shape(npt.Shape.CIRCLE,npt.Color.fuchsia,true,{radius: 10});
        // let shape = new npt.Shape(Shape.RECTANGLE,Color.fuchsia,true,{width: 100, height: 20});
        // let shape = new npt.Shape(npt.Shape.TRIANGLE,npt.Color.fuchsia,true,{width: 10, height: 10});
        let shape = new npt.Shape(npt.Shape.LINE,npt.Color.fuchsia,true,{width: 200, height: 200, thickness: 2});
        
        this.circle = new npt.Entity("Circle");
        this.circle.addComponent(new npt.Transform(new npt.Vector2(100,100),0,new npt.Vector2(1,1)));
        this.circle.addComponent(shape);
    }

    Init(){

    }

    Update(timeStamp){
    }



    Draw(ctx){
        this.circle.getComponent(npt.Shape).draw(ctx);
    }
}

new Game();