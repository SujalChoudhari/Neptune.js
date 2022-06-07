
/**
 * @class Entity
 * @description The base class for all entities.
 * 
 * @property {Object} kwargs - The keyword arguments.
 * @property {String} kwargs.name - The name of the entity.
 * @property {Entity} kwargs.parent - The parent entity.
 * @property {Application} kwargs.application - The application.
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Entity {
    /**
     * @method
     * @description Creates a new Entity object.
     * @param {Object} kwargs - The keyword arguments.
     * @param {String} [kwargs.name = "Entity"] - The name of the entity.
     * @param {Entity} [kwargs.parent=null] - The parent entity.
     * @param {Application} [kwargs.app=null] - The application.
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

}

Entity.prototype.init = () =>{}
Entity.prototype.update = (deltaTime) =>{}
Entity.prototype.draw = (ctx) =>{}