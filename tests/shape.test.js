// Visual Testing

import * as npt from "../src/neptune.js";
import { describe } from "./tester.js";


const scene = new npt.Scene("TestScene");
npt.SceneManager.LoadScene(scene.id);


const entity = new npt.Entity("TestEntity");
scene.AddChild(entity);
const circle = new npt.Shape(npt.Shape.CIRCLE,{fill:true,radius:5});
const rect = new npt.Shape(npt.Shape.RECTANGLE,{fill:true,width:10,height:10});
const line = new npt.Shape(npt.Shape.LINE,{fill:true,width:10,height:10,color:npt.Color.white,thickness:5});
const triangle = new npt.Shape(npt.Shape.TRIANGLE,{fill:true,width:10,height:10,color:npt.Color.white,thickness:1});
const polygon = new npt.Shape(npt.Shape.POLYGON,{fill:true,color:npt.Color.white,thickness:1,points:[new npt.Vector2(-30,0),new npt.Vector2(10,0),new npt.Vector2(10,30)]});
entity.AddComponent(new npt.Transform(new npt.Vector2(40,40),0,new npt.Vector2(1,1)));

entity.AddComponent(polygon);
// entity.AddComponent(triangle);
// entity.AddComponent(line);
// entity.AddComponent(circle);
// entity.AddComponent(rect);

describe("Shape", () => {});