/**
 * Event class
 * ==========
 * @class
 * Create Custom Events with ease.
 * 
 * Properties:
 * -----------
 * @property {Number} code - The code of the event. Every event should have unique code.
 * @property {bool} isTriggered - If the event is triggered.
 * 
 * 
 * Methods:
 * --------
 * @method trigger - Triggers the event.
 * @method isTriggered - Returns true if the event is triggered.
 */
export class Event {
    /**
     * @constructor
     * @param {Number} code - The code of the event. Every event should have unique code.
     */
    constructor(code) {
        this.code = code;
        this.isTriggered = false;
    }

    /**
     * Triggers the event.
     */
    trigger() {
        this.isTriggered = true;
    }

    /**
     * Checks if the event is triggered.
     * @returns {bool} - Returns true if the event is triggered.
     */
    isTriggered() {
        return this.isTriggered;
    }
}


/**
 * CustomEvent Handler class
 * =========================
 * @class
 * Handle Custom Events with ease.
 * 
 * Properties:
 * -----------
 * @property {Event} event - The event to be handled.
 * 
 * Methods:
 * --------
 * @method addEvent - Adds an event to the handler.
 * @method triggerEvent - Triggers the event.
 * @method isEventTriggered - Returns true if the event is triggered.
 */
export default class EventHandler {
    /**
     * @constructor
     * 
     */
    constructor() {
        this.events = {};
    }

    /**
     * Adds an event to the handler.
     * @param {Event} event - The event to be handled.
     * 
     */
    addEvent(event) {
        this.events[event.code] = event;
    }

    /**
     * Triggers the event.
     * @param {Number} eventCode - The code of the event.
     * 
     */
    triggerEvent(eventCode) {
        this.events[eventCode].trigger();
    }

    /**
     * Checks if the event is triggered.
     * @param {Number} eventCode - The code of the event.   
     * @returns {bool} - Returns true if the event is triggered.
     */
    isEventTriggered(eventCode) {
        return this.events[eventCode].isTriggered();
    }
}