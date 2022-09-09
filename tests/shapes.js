import { Application } from "../src/main.js";
import { Shape } from "../src/components/shape.js";
import { Color } from "../src/basic/color.js";
import { Entity } from "../src/basic/entity.js";
import { Transform } from "../src/components/transform.js";
import { Vector2 } from "../src/maths/vec2.js";
export class TestApplication extends Application {
    constructor(){
        super();
        let shape = new Shape(Shape.CIRCLE,Color.fuchsia,true,{radius: 10});
        // let shape = new Shape(Shape.RECTANGLE,Color.fuchsia,true,{width: 100, height: 20});
        // let shape = new Shape(Shape.TRIANGLE,Color.fuchsia,true,{width: 10, height: 10});
        
        this.circle = new Entity("Circle");
        this.circle.addComponent(new Transform(new Vector2(100,100),0,new Vector2(2,1)));
        this.circle.addComponent(shape);
    }

    Init(){

    }

    Update(timeStamp){
    }



    Draw(ctx){
        this.circle.getComponent(Shape).draw(ctx);
    }
}

new TestApplication();