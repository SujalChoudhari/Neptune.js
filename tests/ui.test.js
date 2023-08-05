import * as npt from "../src/neptune.js";

const scene = new npt.Scene("TestScene");

const button = new npt.Entity("Button");
button.AddComponent(new npt.UI.Transform(0,0,100,100,0));
button.AddComponent(new npt.UI.Text("Hello"));
scene.AddChildren(button);

npt.SceneManager.LoadScene(scene.id);