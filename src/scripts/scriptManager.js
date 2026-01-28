import { Behaviour } from "./script.js";
import { Global } from "./script.js";

export class ScriptManager{
    static #behaviours = [];

    /**@private */
    static addScript(script){
        if(script instanceof Behaviour){
            this.#behaviours.push(script);
        }else if(script instanceof Global){
            window[script.constructor.name] = script;
        }
    }
    /** @private */
    static behaviourInit(){
        this.#behaviours.forEach(behaviour => {
            behaviour.Init();
        });
    }

    /** @private */
    static behaviourUpdate(deltaTime){
        this.#behaviours.forEach(behaviour => {
            behaviour.Update(deltaTime);
        });
    }
}