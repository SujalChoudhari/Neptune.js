import { Behaviour } from "./script.js";
import { Global } from "./script.js";

export class ScriptManager {
    static #behaviours = [];

    /**@private */
    static addScript(script) {
        console.log(`ScriptManager: Adding script ${script.constructor.name}`);
        // Relaxed check: Accept if it looks like a behaviour (has Update method) to avoid instanceof issues
        if (script instanceof Behaviour || (script.Update && typeof script.Update === 'function')) {
            this.#behaviours.push(script);
        } else if (script instanceof Global) {
            window[script.constructor.name] = script;
        }
    }
    /** @private */
    static behaviourInit() {
        console.log(`ScriptManager: Init ${this.#behaviours.length} scripts`);
        this.#behaviours.forEach(behaviour => {
            behaviour.Init();
        });
    }

    /** @private */
    static behaviourUpdate(deltaTime) {
        console.log(`ScriptManager: Updating ${this.#behaviours.length} scripts`);
        this.#behaviours.forEach(behaviour => {
            behaviour.Update(deltaTime);
        });
    }
}