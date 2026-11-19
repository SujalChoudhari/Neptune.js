export * from "./materialRegistry.js";
export * from "./cellSimulation.js";

import materialModule from "./materialRegistry.js";
import { CellGridSimulation } from "./cellSimulation.js";

export default {
    ...materialModule,
    CellGridSimulation,
};
