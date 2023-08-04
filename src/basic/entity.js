
/**
 * An entity is a game object. 
 * All the Objects in the game are entities. 
 * Entities can have components attached to them.
 * Entities can have children entities, which can be used to create a hierarchy of entities.
 * 
 * @class Entity
 * @example
 * // Create a new entity
 * let entity = new Entity("Box");
 * 
 */
export class Entity {
    constructor(name = "Entity") {
        this._name = name;
        this._children = [];
        this._parent = null;
        this._components = [];
    }

    /**
     * Name of the entity. Names are not processed by the engine. They are used for debugging purposes.
     * @type {string}
     * @protected
     */
    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    /**
     * Parent Entity of this entity. If this entity is the root entity, this will be null.
     * @type {Entity}
     * @readonly
     * @protected
     */
    get parent() {
        return this._parent;
    }

    set parent(parent) {
        this._parent = parent;
    }

    /**
     * Children of this entity.
     * @type {Entity[]}
     * @readonly
     * @protected
     */
    get children() {
        return this._children;
    }

    /**
     * Component attached to this entity.
     * @type {Component[]}
     * @readonly
     * @protected
     */
    get components() {
        return this._components;
    }

    /**
     * Returns the component of the given type attached to this entity.
     * @param {Component} type The type of the component to be returned.
     * @returns {Component} The component of the given type attached to this entity.
     * @method
     * @example
     * // Get the transform component of the entity
     * let transform = entity.getComponent(Transform);
     * 
     */
    GetComponent(type) {
        return this._components.find(component => component instanceof type);
    }

    /**
     * Returns true if the entity has a component of the given type.
     * @param {Component} type The type of the component to be checked.
     * @returns {boolean} True if the entity has a component of the given type.
     * @method
     * @example
     * // Check if the entity has a transform component
     * let hasTransform = entity.hasComponent(Transform);
     */
    HasComponent(type) {
        return this._components.some(component => component instanceof type);
    }


    GetChildren() {
        return this._children;
    }


    GetParent() {
        return this._parent;
    }

    /**
     * Removes the component of the given type from the entity.
     * @param {Component} type The type of the component to be removed.
     * @method
     * @example
     * // Remove the transform component from the entity
     * entity.removeComponent(Transform);
     * 
     */
    RemoveComponent(type) {
        let index = this._components.findIndex(component => component instanceof type);
        if (index > -1) {
            this._components.splice(index, 1);
        }
        else console.warn("Component not found");
    }

    /**
     * Adds a component to the entity. This checks if the component is already attached to the entity. 
     * If it is, it will not be added again.
     * @param {Component} component The component to be added.
     * @method
     * @example
     * // Add a transform component to the entity
     * entity.addComponent(new Transform());
     * 
     */
    AddComponent(component) {
        if (!this.HasComponent(component.constructor)) {
            component.entity = this;
            this._components.push(component);
        } else console.warn("Component already attached");
    }

    /**
     * Adds a child entity to this entity. This checks if the child is already added to the entity.
     * If it is, it will not be added again.
     * @param {Entity} child The child entity to be added.
     * @method
     * @example
     * // Create a new entity
     * let entity = new Entity("Box");
     * 
     * // Create a new child entity
     * let child = new Entity("Child");
     * 
     * // Add the child entity to the parent entity
     * entity.addChild(child);
     */
    AddChild(child) {
        if (this._children == null) {
            this._children = [];
        }
        if (!this._children.includes(child)) {
            child.parent = this;
            this._children.push(child);
        } else console.warn("Child already attached");
    }

    /**
     * Removes the child entity from this entity.
     * @param {Entity} child The child entity to be removed.
     * @method
     * @example
     * // Create a new entity
     * let entity = new Entity("Box");
     * 
     * // Create a new child entity
     * let child = new Entity("Child");
     * 
     * // Add the child entity to the parent entity
     * entity.addChild(child);
     * 
     * // Remove the child entity from the parent entity
     * entity.removeChild(child);
     */
    GetComponentsInChildren(type) {
        const components = [];
        for (const child of this._children) {
            if (child.HasComponent(type)) {
                components.push(child.GetComponent(type));
            }
        }
        return components;
    }

    /**
     * Get a component of the given type attached to children of this entity.
     * Gets the component of the first child with the given type.
     * @param {Component} type The type of the component to be returned.
     * @returns {Component} The component of the given type attached to children of this entity.
     * @method
     * @example
     * // Get the transform component of the first child of the entity
     * let transform = entity.getComponentinChildren(Transform);
     * 
     */
    GetComponentinChildren(type) {
        let component = null;
        this._children.forEach(child => {
            if (child.hasComponent(type)) {
                component = child.getComponent(type);
                return component;
            }
        });
        return null;
    }

    /**
     * Get a component of the given type attached to the children.
     * Returns all the components of the given type attached to all the children.
     * @param {Component} type The type of the component to be returned.
     * @returns {Component[]} The components of the given type attached to the children.
     * @method
     *  
     * @example
     * // Get the transform components of all the children of the entity
     * let transforms = entity.getComponentsinChildren(Transform);
     * 
     */
    GetComponentsInChildren(type) {
        const components = [];
        for (const child of this._children) {
            if (child.HasComponent(type)) {
                components.push(child.GetComponent(type));
            }
        }
        return components;
    }

    /**
     * Gets the child entity with the specified component type.
     * @param {Component} type The type of the component to be returned.
     * @returns {Entity} The child entity with the specified component type.
     * @method
     *  
     * @example
     * // Get the first child entity with a transform component 
     * let child = entity.getChildWithComponent(Transform);
     * 
     * 
     */
    GetChildWithComponent(type) {
        return this._children.filter(child => child.hasComponent(type));
    }


    /**
     * Gets all the children with the specified component type.
     * @param {Component} type The type of the component to be returned.
     * @returns {Entity[]} The children with the specified component type.
     * @method
     * 
     * @example
     * // Get all the children with a transform component
     * let children = entity.getChildrenWithComponent(Transform);
     * 
     */
    destroy() {
        for (let i = this._components.length - 1; i >= 0; i--) {
            this._components[i].destroy();
        }

        for (let i = this._children.length - 1; i >= 0; i--) {
            this._children[i].destroy();
        }

        this._parent.RemoveChild(this);
        this._children = [];
    }







    /**
     * Generate a tree with the children of this entity. 
     * Components are not included in the tree.
     * @returns {Object} The tree with the children of this entity.
     * @method
     * 
     * @example
     * // Generate a tree with the children of the entity
     * let tree = entity.GetTree();
     */
    GetTree() {
        let tree = {};
        tree.name = this.name;
        tree.children = [];
        this._children.forEach(child => {
            tree.children.push(child.getTree());
        });
        return tree;
    }


    destroy() {
        this._components.forEach(component => {
            component.destroy();
        });

        this._children.forEach(child => {
            child.destroy();
        });
        this._parent.RemoveChild(this);

    }
}