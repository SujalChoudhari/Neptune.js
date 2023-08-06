import * as npt from "../src/neptune.js";
import { describe } from "./tester.js";

const scene = new npt.Scene("TestScene");

const canvas = new npt.Entity("Button");
scene.AddChild(canvas);
canvas.AddComponent(new npt.UI.Transform(10, 10, 200, 200, 0)); // Set width and height
canvas.AddComponent(new npt.UI.Panel());
canvas.AddComponent(new npt.UI.MarginContainer(4,5,2,3)); // Adjust the spacing as needed

const sprite = new npt.Entity("Sprite");
sprite.AddComponent(new npt.UI.Transform(0, 0, 1, 1, 0));
sprite.AddComponent(new npt.UI.Sprite("https://st.depositphotos.com/1008768/3573/i/450/depositphotos_35732355-stock-photo-example-button.jpg"));
sprite.AddComponent(new npt.Behaviour("Sprite", () => {
    // Any additional sprite behavior
}));

// const sprite2 = new npt.Entity("Sprite");
// sprite2.AddComponent(new npt.UI.Transform(0, 0, 1, 1, 0));
// sprite2.AddComponent(new npt.UI.Sprite("https://st.depositphotos.com/1008768/3573/i/450/depositphotos_35732355-stock-photo-example-button.jpg"));
// sprite2.AddComponent(new npt.Behaviour("Sprite", () => {
//     // Any additional sprite behavior
// },(deltaTime)=>{
    
// }));

canvas.AddChildren(sprite); // Add sprites as children before Update

canvas.AddComponent(new npt.Behaviour("Canvas", () => {
    canvas.GetComponent(npt.UI.Transform).Fill("both", 10, 10);
    canvas.GetComponent(npt.UI.MarginContainer).Update();
}));

npt.SceneManager.LoadScene(scene.id);

describe("UI", () => { });