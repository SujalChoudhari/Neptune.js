/**
 * A component is a special type of object that can be attached to a entity.
 * Components are used to add functionality to entities.
 * Every component is unique and can only be attached to one entity at a time.
 * A component describes the behaviour of a game object, and is not a entity itself.
 * @class Component
 * @interface
 * @property {Entity} entity The entity that this component is attached to.
 */
export class Component{
    constructor(entity=null){
        this.entity = entity;
        this._properties = {};
    }


    /**
     * Destroys the component. This will remove the component from the entity it is attached to.
     * This is a callback method that is called when the entity is destroyed. Do not call this method directly.
     * @method
     * @protected
     * @returns {void}
     */
    Destroy(){
        this._properties = null;
        this.entity = null;

    }
}