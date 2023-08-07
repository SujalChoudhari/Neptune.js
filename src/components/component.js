/**
 * A component is a special type of object that can be attached to a entity.
 * Components are used to add functionality to entities.
 * Every component is unique and can only be attached to one entity at a time.
 * A component describes the behaviour of a game object, and is not a entity itself.
 * @class Component
 * @interface
 * @property {Entity} entity The entity that this component is attached to.
 * @property {object} properties The properties of the component. [Read only]
 */
export class Component {
    constructor(entity = null) {
        this.entity = entity;
        this._properties = {};
    }

    /**
     * The entity that this component is attached to.
     * @readonly
     */
    get properties() {
        return this._properties;
    }


    /**
     * @private
     * @returns {void}
     */
    destroy() {
        this._properties = null;
        this.entity = null;

    }


}