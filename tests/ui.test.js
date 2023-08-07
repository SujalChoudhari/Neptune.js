import * as npt from "../src/neptune.js";
import { describe } from "./tester.js";


class TestBehaviour extends npt.Behaviour {
    constructor() {
        super();
        this.Init = () => {
            console.log("Init");
        }

        this.Update = () => {
            console.log("Update");
        }
    }
}

const entity = new npt.Entity("TestEntity");
const behaviour = new   TestBehaviour();
entity.AddComponent(behaviour);

const scene = new npt.Scene("TestScene");
scene.AddChild(entity);

const canvas = new npt.Entity("Button");
scene.AddChild(canvas);
canvas.AddComponent(new npt.UI.UITransform(10, 10, 200, 200, 0)); // Set width and height
canvas.AddComponent(new npt.UI.Panel());
canvas.AddComponent(new npt.UI.MarginContainer(4, 5, 2, 3)); // Adjust the spacing as needed

const sprite = new npt.Entity("Sprite");
sprite.AddComponent(new npt.UI.UITransform(0, 0, 1, 1, 0));
sprite.AddComponent(new npt.UI.UISprite("https://st.depositphotos.com/1008768/3573/i/450/depositphotos_35732355-stock-photo-example-button.jpg"));
sprite.AddComponent(new npt.Behaviour("Sprite", () => {
    sprite.GetComponent(npt.UI.UISprite).filter.Add(npt.Filter.TYPE.BLUR, "3px");
    sprite.GetComponent(npt.UI.UISprite).blendMode = npt.Renderable.BLEND_MODE.MULTIPLY;
}));


canvas.AddChildren(sprite); // Add sprites as children before Update

canvas.AddComponent(new npt.Behaviour("Canvas", () => {
    canvas.GetComponent(npt.UI.UITransform).Fill("both", 10, 10);
    canvas.GetComponent(npt.UI.MarginContainer).Update();
}));

npt.SceneManager.LoadScene(scene.id);

describe("UI", () => { });