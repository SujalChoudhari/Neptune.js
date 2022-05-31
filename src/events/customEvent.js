/**
 * @class CustomEvent
 * @classdesc A CustomEvent object is created when any event of type custom is dispatched.
 * @property {Number} id - The id of the event.
 * @property {String} name - The name of the event.
 * @property {Function} callback - The callback function.
 * @property {Array} args - The arguments to pass to the callback function.
 * @property {Boolean} enabled - Whether the event is enabled or not.
 * 
 *  
 * @since 1.2.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class CustomEvent {
    /**
     * @method
     * @description Constructs a new CustomEvent object.
     * @param {Object} kwargs - The keyword arguments.
     * @param {Number} [kwargs.id=0] - The id of the event.
     * @param {String} [kwargs.name=""] - The name of the event.
     * @param {Function} [kwargs.callback=function(){}] - The callback function.
     * @param {Array} [kwargs.args=[]] - The arguments to pass to the callback function.
     * @param {Boolean} [kwargs.enabled=true] - Whether the event is enabled or not.
     * 
     * @example
     * // Create a new custom event.
     * let event = new CustomEvent({
     *     id: 1,
     *     name: "custom",
     *     callback: function(arg1, arg2){
     *         // Do something.
     *     },
     *     args: [arg1, arg2]
     * });
     * 
     *
     * 
     */
    constructor(kwargs){
        this.id = kwargs.id || 0;
        this.name = kwargs.name || "";
        this.callback = kwargs.callback || function(){};
        this.args = kwargs.args || [];
        this.enabled =kwargs.enabled || true;
    }


    /**
     * @method
     * @description Triggers the event.
     * 
     * @example
     * // Trigger the event.
     * event.call()
     * 
     * 
     */
    call(){
        this.callback(...this.args);
    }

    /** 
     * @method
     * @description Get the id of the event.
     * @returns {Number} The id of the event.
     * 
     * @example
     * // Get the id of the event.
     * let id = event.getId();
    */
    getId(){
        return this.id;
    }


    /**
     * @method  
     * @description Get the name of the event.
     * @returns {String} The name of the event.
     * 
     * @example
     * // Get the name of the event.
     * let name = event.getName();
     * 
     */
    getName(){
        return this.name;
    }



}