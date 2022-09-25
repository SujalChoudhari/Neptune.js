import { Behaviour } from "./script.js";
import { Global } from "./script.js";
/**
 * Manages all the Script components.
 */
export class ScriptManager{
    static #behaviours = [];

    static AddScript(script){
        if(script instanceof Behaviour){
            this.#behaviours.push(script);
        }else if(script instanceof Global){
            window[script.constructor.name] = script;
        }
    }

    static BehaviourInit(){
        this.#behaviours.forEach(behaviour => {
            behaviour.Init();
        });
    }

    static BehaviourUpdate(deltaTime){
        this.#behaviours.forEach(behaviour => {
            behaviour.Update(deltaTime);
        });
    }
}