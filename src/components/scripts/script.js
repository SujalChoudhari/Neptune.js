import { Component } from "../component.js";
import { ScriptManager } from "./scriptManager.js";
/**
 * A Script can be used to add custom functionality to an Entity.
 * A Script is a Component thus, making possible to make new/custom Components.
 * @interface Script
 * @extends Component
 * 
 * 
 */
export class Script extends Component {
    constructor(name = "New Script") {
        super();
        this.name = name;
        ScriptManager.AddScript(this);
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
 * class MyBehaviour extends Behaviour{
 *    constructor(){
 *       super();
 *   }
 * 
 *  Init(){
 *     // Called when the behaviour is created
 * }
 * 
 * Update(deltaTime){
 *    // Called every frame
 * }
 * }
 * 
 * // Attach the behaviour to an entity
 * let entity = new Entity("Box");
 * let behaviour = new MyBehaviour();
 * entity.AddComponent(behaviour);
 * 
 */
export class Behaviour extends Script {
    
    
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