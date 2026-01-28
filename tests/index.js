import { printResults } from "./tester.js"

// Core tests
import "./application.test.js"
import "./entity-and-scene.test.js"
import "./scenemanager.test.js"

// Component tests
import "./component.test.js"
import "./transform.test.js"
import "./audio.test.js"
import "./storage.test.js"

// Rendering tests
import "./sprite.test.js"
import "./shape.test.js"
import "./ui.test.js"

// Script tests
import "./script.test.js"

// Math tests
import "./maths.test.js"

// Event tests
import "./events.test.js"

// Integration tests
import "./integration/gameloop.test.js"

// Titan Animation tests
import "./titan.test.js"

// Thalassa World/Camera tests
import "./thalassa.test.js"

// Nereid Physics tests
import "./nereid.test.js"

// Proteus Audio tests
import "./proteus.test.js"

// Larissa RPG tests
import "./larissa.test.js"

// Galatea Cutscene tests
import "./galatea.test.js"

printResults();
