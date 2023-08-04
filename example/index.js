import * as npt from "../src/index.js";


let scene = new npt.Scene();
let entity = new npt.Entity();
let entityScript = new npt.Behaviour();

npt.MouseInput.onRightClick = (event) => {
    console.log("Right Clicked");
}

entity.addComponent(new npt.Transform(new npt.Vector2(1, 1), 0, new npt.Vector2(1, 1)));
let sprite = new npt.Sprite("https://previews.123rf.com/images/fordzolo/fordzolo1506/fordzolo150600296/41026708-example-white-stamp-text-on-red-backgroud.jpg", 1, 1);
let circle = new npt.Shape(npt.Shape.CIRCLE, npt.Color.wheat, true, { radius: 10, thickness: 4 });

entity.addComponent(sprite);
entity.addComponent(circle);
entity.addComponent(entityScript);

scene.addChild(entity);

