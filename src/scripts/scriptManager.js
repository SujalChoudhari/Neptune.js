import { Behaviour } from "./script.js";
import { Global } from "./script.js";
import { isEntityActive } from "../core/entity.js";
import { Scene } from "../core/scene.js";
import { SceneManager } from "../core/sceneManager.js";

const isBehaviourActive = behaviour => {
    if (behaviour.properties?.enabled === false || behaviour.enabled === false) return false;
    if (!behaviour.entity) return true;
    if (!isEntityActive(behaviour.entity)) return false;
    let root = behaviour.entity;
    const visited = new Set();
    while (root.parent && !visited.has(root)) {
        visited.add(root);
        root = root.parent;
    }
    return !(root instanceof Scene) || SceneManager.isSceneLoaded(root);
};

export class ScriptManager {
    static #behaviours = new Set();
    static #initialized = new WeakSet();

    /**
     * Remove a destroyed script from future lifecycle ticks.
     * @private
     */
    static removeScript(script) {
        this.#behaviours.delete(script);
    }

    /**@private */
    static addScript(script) {
        console.log(`ScriptManager: Adding script ${script.constructor.name}`);
        // Relaxed check: Accept if it looks like a behaviour (has Update method) to avoid instanceof issues
        if (script instanceof Behaviour || (script.Update && typeof script.Update === 'function')) {
            this.#behaviours.add(script);
        } else if (script instanceof Global) {
            window[script.constructor.name] = script;
        }
    }
    /** @private */
    static behaviourInit() {
        console.log(`ScriptManager: Init ${this.#behaviours.size} scripts`);
        [...this.#behaviours].forEach(behaviour => {
            if (!this.#behaviours.has(behaviour) || !isBehaviourActive(behaviour)) return;
            this.#initialize(behaviour);
        });
    }

    static #initialize(behaviour) {
        if (this.#initialized.has(behaviour)) return;
        if (typeof behaviour.Init === 'function') behaviour.Init();
        this.#initialized.add(behaviour);
    }

    /** @private */
    static behaviourUpdate(deltaTime) {
        // Snapshot the pass: scripts spawned by Init/Update begin next frame.
        [...this.#behaviours].forEach(behaviour => {
            if (!this.#behaviours.has(behaviour) || !isBehaviourActive(behaviour)) return;
            this.#initialize(behaviour);
            if (!this.#behaviours.has(behaviour) || !isBehaviourActive(behaviour)) return;
            behaviour.Update(deltaTime);
        });
    }
}