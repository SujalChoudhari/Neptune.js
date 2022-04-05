/**
 * Entity
 * ======
 * @class Entity
 * @classdesc Base class for all game objects.
 * 
 * Properties:
 * -----------
 * @property name - The name of the entity.
 * @property parent - The parent of the entity.
 * 
 * 
 * Methods:
 * --------
 * @method init() - Initializes the entity. Called once when the entity is created and game is ready to start. 
 * @method update(deltaTime) - Updates the entity. Called every frame.
 * @method draw(ctx) - Draws the entity. Called every frame. Entity is drawn after the update.
 * @method setParent(parent) - Sets the parent of the entity.
 */
export default class Entity {

    /**
     * @param {Object} kwargs - The keyword arguments.
     * @param {string} kwargs.name - The name of the entity.
     * @param {Entity} kwargs.parent - The parent of the entity.
     * @param {Application} kwargs.app - The application that the entity is a part of and can register to.
     */
    constructor(kwargs) {
        this.name = kwargs["name"] || "Entity";
        this.parent = kwargs["parent"] || null;
        let app = kwargs["app"] || null;
        if (app != null) app.entities.push(this);
    }

    /**
     * @param {Entity} parent - The parent of the entity.
     */
    setParent(parent) {
        this.parent = parent;
    }

    /**
     * Initializes the entity. Called once when the entity is created and game is ready to start.
     */
    init() { }

    /**
     * 
     * @param {Number} deltaTime - The time since the last frame.
     */
    update(deltaTime) {
    }

    /**
     * @param {CanvasRenderingContext2D} ctx - The context of the canvas.
     */
    draw(ctx) {
        
    }
}