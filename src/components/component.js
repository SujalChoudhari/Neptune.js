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

    /**
     * Populates the component properties from a data object.
     * Override this method for custom property handling.
     * @param {object} props - The properties object (usually from JSON).
     */
    deserialize(props) {
        if (!props) return;

        // Default implementation: copy props to _properties
        // This handles simple key-value pairs. 
        // Complex types (Vector2, etc.) might need custom handling in subclasses 
        // or a smarter default deserializer here.
        for (const key in props) {
            if (Object.prototype.hasOwnProperty.call(props, key)) {
                // If the property exists in _properties, we might want to be careful about types,
                // but for now, we just overwrite.

                // TODO: Add support for checking if existing prop is a Vector2/Color and using .set() // turbo
                this._properties[key] = props[key];
            }
        }
    }
}