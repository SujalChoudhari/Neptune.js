import { Behaviour } from "./script.js";
import { Global } from "./script.js";

export class ScriptManager {
    static #behaviours = [];

    /**@private */
    static addScript(script) {
        // Relaxed check: Accept if it looks like a behaviour (has Update method) to avoid instanceof issues
        if (script instanceof Behaviour || (script.Update && typeof script.Update === 'function')) {
            this.#behaviours.push(script);
        } else if (script instanceof Global) {
            window[script.constructor.name] = script;
        }
    }
    /** @private */
    static behaviourInit() {
        this.#behaviours.forEach(behaviour => {
            behaviour.Init();
        });
    }

    /** @private */
    static behaviourUpdate(deltaTime) {
        this.#behaviours.forEach(behaviour => {
            behaviour.Update(deltaTime);
        });
    }
}