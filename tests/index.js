import { printResults } from "./tester.js"


// import "./application.test.js"
// import "./entity-and-scene.test.js"
// import "./scenemanager.test.js"
// import "./audio.test.js"
// import "./storage.test.js"
// import "./sprite.test.js"
// import "./shape.test.js"
// import "./script.test.js"
// import "./ui.test.js"

import * as npt from "../src/neptune.js"
import * as Create from "../src/util/create.js"



const scene = Create.Scene("Test Scene");
const button = Create.Button("Test Button",{
    pos:new npt.Vector2(3,3),
    size:new npt.Vector2(10,4),
});

scene.AddChild(button);


printResults();

