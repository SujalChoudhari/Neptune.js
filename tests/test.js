import {Application} from "../src/neptune.js"
import { Color, Entity } from "../src/basic/basic__.js";
import { Sound,Shape,Line,Transform} from "../src/components/components__.js";
import { BoxBody, CircleBody } from "../src/physics/physics__.js";
import { Vector2 } from "../src/maths/maths__.js";

class MyNewGame extends Application {
    constructor() {
        super();
        this.entity = new Entity("entity");
        this.entity.addComponent(new Transform(new Vector2(2,2),0));
        this.line = new Line(new Vector2(2,2),Color.white);
        this.entity.addComponent(this.line);

    }

    Init() {

    }

    Update(timeStamp){
        
    }

    Draw(ctx){
        this.line.draw(ctx);
    }

}

new MyNewGame();
