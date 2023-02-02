import *  as npt from "../src/neptune.js"
import { Color, Entity } from "../src/basic/basic__.js";
import { Sound,Shape } from "../src/components/components__.js";
import { BoxBody, CircleBody } from "../src/physics/physics__.js";
import { Vector2 } from "../src/maths/maths__.js";

class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.audio = new Entity("Audio");
        this.audio.addComponent(new Sound("piece", "https://sampleswap.org/mp3/artist/36239/LEE423_Violent-Vortex-160.mp3"));

        this.box = new Entity("Box");
        this.box.addComponent(new BoxBody(new Vector2(10,10),30,10,10,1,false));
        this.box.addComponent(new Shape(Shape.RECTANGLE,Color.aliceblue,true,{width:30,height:10}));

        this.circle = new Entity("Circle");
        this.circle.addComponent(new CircleBody(new Vector2(30,30),5,5,0.1,false));
        this.circle.addComponent(new Shape(Shape.CIRCLE,Color.aqua,true,{radius:5,outline:Color.black,thickness:1}));

        this.ground = new Entity("Ground");
        this.ground.addComponent(new BoxBody(new Vector2(10,60),130,10,3,0.1,true));
        this.ground.addComponent(new Shape(Shape.RECTANGLE,Color.yellow,true,{width:130,height:10}));

    }

    Init() {
        // this.audio.getComponent(Sound).volume = 0.1;
        // this.audio.getComponent(Sound).play()
        // this.ground.getComponent(BoxBody).rotate(1);
    }

    Update(timeStamp){
        
    }

    Draw(ctx){
        this.box.getComponent(Shape).draw(ctx);
        this.circle.getComponent(Shape).draw(ctx);
        this.ground.getComponent(Shape).draw(ctx);
    }

}

new MyNewGame();
