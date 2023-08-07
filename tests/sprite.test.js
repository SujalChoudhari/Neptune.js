import * as npt from "../src/neptune.js";
import { describe } from "./tester.js";


const sprite = new npt.Sprite("https://source.unsplash.com/random/100x100",20,20);
const entity = new npt.Entity("TestEntity");
entity.AddComponent(new npt.Transform(new npt.Vector2(40,40),0,new npt.Vector2(1,1)));
entity.AddComponent(sprite);


const scene = new npt.Scene("TestScene");
scene.AddChildren(entity);
npt.SceneManager.LoadScene(scene.id);


const scene2 = new npt.Scene("TestScene2");
const entity2 = new npt.Entity("TestEntity2");
entity2.AddComponent(new npt.Transform(new npt.Vector2(40,40),0,new npt.Vector2(1,1)));
entity2.AddComponent(new npt.Sprite("https://source.unsplash.com/random/100x100",20,20));
scene2.AddChildren(entity2);
npt.SceneManager.LoadScene(scene2.id);


describe("Sprite", () => {});