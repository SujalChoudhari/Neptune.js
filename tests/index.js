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

printResults();
