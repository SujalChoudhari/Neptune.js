
/**
 * @class Entity
 * @description The base class for all entities.
 * 
 * @property {Object} kwargs - The keyword arguments.
 * @property {String} kwargs.name - The name of the entity.
 * @property {Entity} kwargs.parent - The parent entity.
 * @property {Application} kwargs.application - The application.
 */
export class Entity {
    /**
     * @method
     * @description Creates a new Entity object.
     * @param {Object} kwargs - The keyword arguments.
     * @param {String} kwargs.name - The name of the entity.
     * @param {Entity} kwargs.parent - The parent entity.
     * @param {Application} kwargs.app - The application.
     * 
     * @example
     * // Create a new Entity object.
     * let entity = new Entity({
     *         name: "entity",
     *         parent: null,
     *         app: app
     *      });
     */
    constructor(kwargs) {
        this.name = kwargs["name"] || "Entity";
        this.parent = kwargs["parent"] || null;
        let app = kwargs["app"] || null;
        if (app != null) app.entities.push(this);
    }

    /**
     * @method
     * @description Sets the new parent entity.
     * @param {Entity} parent - The new parent entity.
     * 
     * @example
     * // Set the new parent entity.
     * entity.setParent(parent);
     */
    setParent(parent) {
        this.parent = parent;
    }

    /**
     * @method
     * @description Initializes the entity.
     * 
     * @example
     * // Initialize the entity.
     * entity.init();
     */
    init() { }

    /**
     * @method
     * @description Updates the entity.
     * @param {Number} deltaTime - The time between the last frame and the current frame.
     * 
     * @example
     * // Update the entity.
     * entity.update(deltaTime);
     */
    update(deltaTime) {
    }

    /**
     * @method
     * @description Draws the entity.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * 
     * @example
     * // Draw the entity.
     * entity.draw(ctx);
     */
    draw(ctx) {
        
    }
}