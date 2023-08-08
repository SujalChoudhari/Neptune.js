import { Component } from "../component.js";
import { ScriptManager } from "./scriptManager.js";


export class Script {
    constructor(name = "New Script") {

        this.name = name;
        ScriptManager.addScript(this);
    }
}

/**
 * A Behaviour is a Script that is attached to an Entity.
 * A Behaviour is a Component thus, making possible to make new/custom Components.
 * @interface Behaviour
 * @extends Script
 * 
 * @example
 * // Create a new Behaviour
 * const MyBehaviour = new Behaviour("My Behaviour");
 * MyBehaviour.Init = () => {
 *  console.log("Behaviour Created");
 * }
 * MyBehaviour.Update = () => {
 *  console.log("Behaviour Updated");
 * }
 * 
 * 
 */
export class Behaviour extends Script {

    /**
     * Creates a new Behaviour
     * @param {string} name - Name of the Behaviour
     * @param {Function} Init - Function called when the Behaviour is created
     * @param {Function} Update - Function called every frame
     */
    constructor(name = "New Behaviour", Init = () => { }, Update = () => { }) {
        super(name);
        this.Init = Init;
        this.Update = Update;
    }
}

/**
 * A Global is a Script that is attached to the global scope. (window)
 * A Global allows to create and access global variables.
 * @interface Global
 * @extends Script
 * 
 * @example
 * // Create a new Global
 * class MyGlobal extends Global{
 *   constructor(){
 *      super();
 *     this.myVariable = 0;
 * }
 * }
 * new MyGlobal();
 * 
 * // Access the global variable
 * console.log(window.MyGlobal.myVariable);
 */
export class Global extends Script { }