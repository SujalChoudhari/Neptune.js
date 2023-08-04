console.time("Tests");
import { printResults } from "./tester.js"

import "./application.test.js"
import "./entity-and-scene.test.js"

printResults();
console.timeEnd("Tests");