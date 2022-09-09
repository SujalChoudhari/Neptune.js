import { Application } from "../src/main.js";
import { Shape } from "../src/components/shape.js";
import { Color } from "../src/basic/color.js";
import { Entity } from "../src/basic/entity.js";
import { Transform } from "../src/components/transform.js";
import { Vector2 } from "../src/maths/vec2.js";
import { Sprite } from "../src/components/sprite.js";
import { Scene } from "../src/basic/scene.js";
export class TestApplication extends Application {
    constructor(){
        super();
        let photo = new Sprite("https://developer.mozilla.org/assets/mdn_contributor.png",100,100);
        let photo2 = new Sprite("https://developer.mozilla.org/assets/mdn_contributor.png",100,100);
        let photo3 = new Sprite("https://developer.mozilla.org/assets/mdn_contributor.png",100,100);
        // let shape = new Shape(Shape.RECTANGLE,Color.fuchsia,true,{width: 100, height: 20});
        // let shape = new Shape(Shape.TRIANGLE,Color.fuchsia,true,{width: 10, height: 10});

        this.scene = new Scene("Scene");
        this.scene.addComponent(new Transform(new Vector2(0,0),0,new Vector2(1,1)));
        
        this.image = new Entity("Image");
        this.image.addComponent(new Transform(new Vector2(200,200),0,new Vector2(1,1)));
        this.image.addComponent(photo);

        this.image2 = new Entity("Image2");
        this.image2.addComponent(new Transform(new Vector2(100,100),0,new Vector2(3,1)));   
        this.image2.addComponent(photo2);
        
        this.image3 = new Entity("Image3");
        this.image3.addComponent(new Transform(new Vector2(0,100),0,new Vector2(.3,1)));   
        this.image3.addComponent(photo3);

        this.scene.addChild(this.image);
        this.image.addChild(this.image2);
        this.image2.addChild(this.image3);
    }

    Init(){

    }

    Update(timeStamp){
        this.image.getComponent(Transform).rotate(0.01);
        this.image2.getComponent(Transform).rotate(-0.01);
        this.image3.getComponent(Transform).rotate(-0.01);
    }



    Draw(ctx){
        this.scene.draw(ctx);
        // this.image2.getComponent(Sprite).draw(ctx);
    }
}

new TestApplication();