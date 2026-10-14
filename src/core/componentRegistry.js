/**
 * ComponentRegistry is a singleton that maps component names (strings) to Component classes/constructors.
 * This is essential for loading components from JSON data where only the class name is known.
 */
export class ComponentRegistry {
    static #components = new Map();

    static #componentNames = new Map();

    /**
     * Register a component class with the registry.
     * @param {string} name - The name to register the component under (usually class.name).
     * @param {class} componentClass - The class constructor.
     */
    static register(name, componentClass) {
        if (typeof name !== "string" || name.trim() === "") {
            throw new TypeError("ComponentRegistry: component name must be a non-empty string.");
        }
        if (typeof componentClass !== "function") {
            throw new TypeError(`ComponentRegistry: '${name}' must be registered with a constructor.`);
        }
        if (ComponentRegistry.#components.has(name)) {
            console.warn(`ComponentRegistry: Overwriting existing component '${name}'`);
        }
        ComponentRegistry.#components.set(name, componentClass);
        ComponentRegistry.#componentNames.set(componentClass, name);
    }

    /**
     * Get a component class by name.
     * @param {string} name - The name of the component.
     * @returns {class|undefined} The component class constructor.
     */
    static get(name) {
        return ComponentRegistry.#components.get(name);
    }

    /**
     * Return the registered serialized name for a component constructor or instance.
     * Unregistered components fall back to their JavaScript constructor name.
     */
    static nameOf(componentOrClass) {
        const componentClass = typeof componentOrClass === "function"
            ? componentOrClass
            : componentOrClass?.constructor;
        return ComponentRegistry.#componentNames.get(componentClass) || componentClass?.name;
    }

    static has(name) {
        return ComponentRegistry.#components.has(name);
    }

    /**
     * Create a new instance of a component by name.
     * @param {string} name - The name of the component.
     * @param {...any} args - Arguments to pass to the constructor.
     * @returns {Component|null} The new component instance, or null if not found.
     */
    static create(name, ...args) {
        const ComponentClass = ComponentRegistry.get(name);
        if (!ComponentClass) {
            console.error(`ComponentRegistry: Component '${name}' not found.`);
            return null;
        }
        return new ComponentClass(...args);
    }

    /**
     * Clear the registry (mostly for testing).
     */
    static clear() {
        ComponentRegistry.#components.clear();
        ComponentRegistry.#componentNames.clear();
    }
}
