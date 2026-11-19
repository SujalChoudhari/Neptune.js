var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/math/vec2.js
var Vector2;
var init_vec2 = __esm({
  "src/math/vec2.js"() {
    Vector2 = class _Vector2 {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
      /**
       * Add a vector to this vector.
       * This returns a new vector, as well as changing the original vector.
       * @param {Vector2} vector - The vector to add. It can be a Vector2 or a number.
       * @returns {Vector2} - The new vector.
       * @method
       */
      Add(vector) {
        if (vector instanceof _Vector2) {
          this.x += vector.x;
          this.y += vector.y;
        } else {
          this.x += vector;
          this.y += vector;
        }
        return this;
      }
      /**
       * Subtracts a vector from this vector.
       * This returns a new vector, as well as changing the original vector.
       * @param {Vector2} vector - The vector to subtract. It can be a Vector2 or a number.
       * @returns {Vector2} - The new vector.
       * @method
       */
      Subtract(vector) {
        if (vector instanceof _Vector2) {
          this.x -= vector.x;
          this.y -= vector.y;
        } else {
          this.x -= vector;
          this.y -= vector;
        }
        return this;
      }
      /**
       * Multiply a vector by another vector.
       * This returns a new vector, as well as changing the original vector.
       * @param {Vector2} vector - The vector to multiply. It can be a Vector2 or a number.
       * @returns {Vector2} - The new vector.
       */
      Multiply(vector) {
        if (vector instanceof _Vector2) {
          this.x *= vector.x;
          this.y *= vector.y;
        } else {
          this.x *= vector;
          this.y *= vector;
        }
        return this;
      }
      /**
       * Divides a vector by another vector.
       * This returns a new vector, as well as changing the original vector.
       * @param {Vector2} vector - The vector to divide. It can be a Vector2 or a number.
       * @returns {Vector2} - The new vector.
       * @method
       */
      Divide(vector) {
        if (vector instanceof _Vector2) {
          this.x /= vector.x;
          this.y /= vector.y;
        } else {
          this.x /= vector;
          this.y /= vector;
        }
        return this;
      }
      /**
       * Negates the vector.
       * This returns a new vector, as well as changing the original vector.
       * Rotates the vector 180 degrees.
       * 
       * @returns {Vector2} - The new vector.
       */
      Negetive() {
        if (this.x != 0) this.x = -this.x;
        if (this.y != 0) this.y = -this.y;
        return this;
      }
      /**
       * Returns a new vector with elements as Zero.
       * @returns {Vector2} - The new vector.
       */
      static Zero() {
        return new _Vector2(0, 0);
      }
      /**
       * Returns a new vector with elements as One.
       * @returns {Vector2} - The new vector.
       */
      static One() {
        return new _Vector2(1, 1);
      }
      /**
       * Creates a new copy of the vector. Useful for when you want to keep the original vector especially when using the Vector2 mathamatical functions.
       * @returns {Vector2} - The new vector.
       */
      Copy() {
        return new _Vector2(this.x, this.y);
      }
      /**
       * Returns the magnitude of the vector.
       * @returns {number} - The magnitude of the vector.
       */
      Magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
      }
      /**
       * Checks if the values of the Vector are Safe Numbers.
       * @returns {boolean} - True if the values are safe numbers.
       */
      static IsSafe(vector) {
        return vector.x != null && vector.y != null && vector.x != void 0 && vector.y != void 0 && !isNaN(vector.x) && !isNaN(vector.y);
      }
      /**
       * Normalizes the vector.
       * This returns a new vector, as well as changing the original vector.
       * @returns {Vector2} - The new vector.
       */
      Normalize() {
        let magnitude = this.Magnitude();
        if (magnitude != 0) {
          this.x /= magnitude;
          this.y /= magnitude;
        }
        return this;
      }
    };
  }
});

// src/rendering/filter.js
var Filter;
var init_filter = __esm({
  "src/rendering/filter.js"() {
    Filter = class {
      constructor() {
        this.filters = [];
      }
      /**
       * Add a new filter to the list.
       * @param {string} type - The type of the filter.
       * @param {...number} values - Filter values.
       */
      Add(type, ...values) {
        this.filters.push({
          type,
          values
        });
      }
      /**
       * Remove a filter from the list.
       * @param {string} type - The type of the filter.
       * @param {...number} values - Filter values.
       */
      Remove(type) {
        this.filters = this.filters.filter((filter) => filter.type !== type);
      }
      /**
       * Apply the filters to a canvas context.
       * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
       */
      toString(ctx2) {
        const filterString = this.filters.map((filter) => {
          const values = filter.values.join(", ");
          return `${filter.type}(${values})`;
        }).join(" ");
        return filterString;
      }
    };
    Filter.TYPE = {
      NONE: "none",
      GRAYSCALE: "grayscale",
      SEPIA: "sepia",
      INVERT: "invert",
      BRIGHTNESS: "brightness",
      CONTRAST: "contrast",
      BLUR: "blur",
      HUE_ROTATE: "hue-rotate",
      SATURATE: "saturate",
      OPACITY: "opacity",
      DROP_SHADOW: "drop-shadow"
    };
  }
});

// src/components/component.js
var Component;
var init_component = __esm({
  "src/components/component.js"() {
    Component = class {
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
        for (const key in props) {
          if (Object.prototype.hasOwnProperty.call(props, key)) {
            if (key in this) {
              this[key] = props[key];
            } else {
              this._properties[key] = props[key];
            }
          }
        }
      }
    };
  }
});

// src/rendering/renderable.js
function withRenderablePass(ctx2, draw) {
  if (!ctx2 || typeof ctx2 !== "object" && typeof ctx2 !== "function") return draw();
  if (activeRenderablePasses.has(ctx2)) return draw();
  activeRenderablePasses.set(ctx2, { traversedEntities: /* @__PURE__ */ new WeakSet() });
  try {
    return draw();
  } finally {
    activeRenderablePasses.delete(ctx2);
  }
}
function collectRenderableRoots(entity) {
  const renderables = [];
  if (!entity || entity.active === false) return renderables;
  const visited = new Set(entity ? [entity] : []);
  const stack = [...entity?.children || []].reverse();
  while (stack.length > 0) {
    const child = stack.pop();
    if (!child || visited.has(child)) continue;
    visited.add(child);
    if (child.active === false) continue;
    const childRenderables = (child.components || []).filter((component) => component instanceof Renderable && component.properties?.enabled !== false && component.enabled !== false);
    if (childRenderables.length > 0) {
      renderables.push(...childRenderables);
      continue;
    }
    for (const nestedChild of [...child.children || []].reverse()) {
      stack.push(nestedChild);
    }
  }
  return renderables;
}
function sortRenderables(renderables) {
  return renderables.map((renderable, insertionOrder) => ({ renderable, insertionOrder })).sort((a, b) => {
    const orderA = Number.isFinite(a.renderable.renderOrder) ? a.renderable.renderOrder : 0;
    const orderB = Number.isFinite(b.renderable.renderOrder) ? b.renderable.renderOrder : 0;
    return orderA - orderB || a.insertionOrder - b.insertionOrder;
  }).map(({ renderable }) => renderable);
}
var activeRenderablePasses, Renderable;
var init_renderable = __esm({
  "src/rendering/renderable.js"() {
    init_filter();
    init_component();
    activeRenderablePasses = /* @__PURE__ */ new WeakMap();
    Renderable = class _Renderable extends Component {
      /** Blend mode of the object */
      blendMode = _Renderable.BLEND_MODE.NORMAL;
      /** The filter applied to the object */
      filter = new Filter();
      constructor() {
        super();
        this._properties.renderOrder = 0;
      }
      get properties() {
        if (this._properties && !Number.isFinite(this._properties.renderOrder)) {
          this._properties.renderOrder = 0;
        }
        return this._properties;
      }
      get renderOrder() {
        return Number.isFinite(this._properties?.renderOrder) ? this._properties.renderOrder : 0;
      }
      set renderOrder(value) {
        this._properties.renderOrder = value;
      }
      /** Draw this entity's nested renderables in deterministic order. @protected */
      drawChildren(ctx2) {
        const pass = ctx2 && activeRenderablePasses.get(ctx2);
        if (pass && this.entity) {
          if (pass.traversedEntities.has(this.entity)) return;
          pass.traversedEntities.add(this.entity);
        }
        for (const renderable of sortRenderables(collectRenderableRoots(this.entity))) {
          renderable.draw(ctx2);
        }
      }
      /** @private */
      draw(ctx2) {
      }
    };
    Renderable.BLEND_MODE = {
      NORMAL: "source-over",
      MULTIPLY: "multiply",
      SCREEN: "screen",
      OVERLAY: "overlay",
      DARKEN: "darken",
      LIGHTEN: "lighten",
      COLOR_DODGE: "color-dodge",
      COLOR_BURN: "color-burn",
      HARD_LIGHT: "hard-light",
      SOFT_LIGHT: "soft-light",
      DIFFERENCE: "difference",
      EXCLUSION: "exclusion",
      HUE: "hue",
      SATURATION: "saturation",
      COLOR: "color",
      LUMINOSITY: "luminosity"
    };
  }
});

// src/core/componentRegistry.js
var ComponentRegistry;
var init_componentRegistry = __esm({
  "src/core/componentRegistry.js"() {
    ComponentRegistry = class _ComponentRegistry {
      static #components = /* @__PURE__ */ new Map();
      static #componentNames = /* @__PURE__ */ new Map();
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
        if (_ComponentRegistry.#components.has(name)) {
          console.warn(`ComponentRegistry: Overwriting existing component '${name}'`);
        }
        _ComponentRegistry.#components.set(name, componentClass);
        _ComponentRegistry.#componentNames.set(componentClass, name);
      }
      /**
       * Get a component class by name.
       * @param {string} name - The name of the component.
       * @returns {class|undefined} The component class constructor.
       */
      static get(name) {
        return _ComponentRegistry.#components.get(name);
      }
      /**
       * Return the registered serialized name for a component constructor or instance.
       * Unregistered components fall back to their JavaScript constructor name.
       */
      static nameOf(componentOrClass) {
        const componentClass = typeof componentOrClass === "function" ? componentOrClass : componentOrClass?.constructor;
        return _ComponentRegistry.#componentNames.get(componentClass) || componentClass?.name;
      }
      static has(name) {
        return _ComponentRegistry.#components.has(name);
      }
      /**
       * Create a new instance of a component by name.
       * @param {string} name - The name of the component.
       * @param {...any} args - Arguments to pass to the constructor.
       * @returns {Component|null} The new component instance, or null if not found.
       */
      static create(name, ...args) {
        const ComponentClass = _ComponentRegistry.get(name);
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
        _ComponentRegistry.#components.clear();
        _ComponentRegistry.#componentNames.clear();
      }
    };
  }
});

// src/core/entity.js
function isEntityActive(entity) {
  for (let current = entity; current; current = current.parent) {
    if (current.active === false) return false;
  }
  return true;
}
function cloneSerializable(value, seen = /* @__PURE__ */ new WeakSet()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return void 0;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => cloneSerializable(item, seen)).filter((item) => item !== void 0);
  }
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "entity" || key === "parent" || key === "children") continue;
    const cloned = cloneSerializable(item, seen);
    if (cloned !== void 0) result[key] = cloned;
  }
  return result;
}
var makeId, Entity;
var init_entity = __esm({
  "src/core/entity.js"() {
    init_componentRegistry();
    makeId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
    Entity = class {
      constructor(name = "Entity") {
        this._name = name;
        this.id = makeId("ent");
        this._children = [];
        this._parent = null;
        this._components = [];
        this._destroyed = false;
        this.active = true;
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
       * let transform = entity.GetComponent(Transform);
       * 
       */
      GetComponent(type) {
        return this._components.find((component) => component instanceof type);
      }
      /**
       * Returns true if the entity has a component of the given type.
       * @param {Component} type The type of the component to be checked.
       * @returns {boolean} True if the entity has a component of the given type.
       * @method
       * @example
       * // Check if the entity has a transform component
       * let hasTransform = entity.HasComponent(Transform);
       */
      HasComponent(type) {
        return this._components.some((component) => component instanceof type);
      }
      /**
       * Get all children of this entity.
       * @returns {Entity[]} The children of this entity.
       */
      GetChildren() {
        return this._children;
      }
      /**
       * Returns the parent of this entity.
       * @returns {Entity} The parent of this entity.
       */
      GetParent() {
        return this._parent;
      }
      /**
       * Removes the component of the given type from the entity.
       * @param {Component} type The type of the component to be removed.
       * @method
       * @example
       * // Remove the transform component from the entity
       * entity.RemoveComponent(Transform);
       * 
       */
      RemoveComponent(type) {
        let index = this._components.findIndex((component) => component instanceof type);
        if (index > -1) {
          const [component] = this._components.splice(index, 1);
          component.destroy();
        } else console.warn("Component not found");
      }
      /**
       * Adds a component to the entity. This checks if the component is already attached to the entity. 
       * If it is, it will not be added again.
       * @param {Component} component The component to be added.
       * @method
       * @example
       * // Add a transform component to the entity
       * entity.AddComponent(new Transform());
       * 
       */
      AddComponent(component) {
        if (!component || typeof component !== "object") {
          throw new TypeError("Entity.AddComponent expects a component instance.");
        }
        if (!this.HasComponent(component.constructor)) {
          component.entity = this;
          if (!component.id) component.id = makeId("cmp");
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
       * entity.AddChild(child);
       */
      AddChild(child) {
        if (!child || typeof child !== "object") {
          throw new TypeError("Entity.AddChild expects an entity instance.");
        }
        for (let ancestor = this; ancestor; ancestor = ancestor.parent) {
          if (ancestor === child) {
            throw new TypeError("Entity.AddChild cannot create a parent cycle.");
          }
        }
        if (this._children == null) {
          this._children = [];
        }
        if (this._children.includes(child)) {
          console.warn("Child already attached");
          return;
        }
        if (child.parent && child.parent !== this) child.parent.RemoveChild(child);
        child.parent = this;
        this._children.push(child);
      }
      /** Remove a direct child and clear its parent reference. */
      RemoveChild(child) {
        const index = this._children.indexOf(child);
        if (index === -1) return false;
        this._children.splice(index, 1);
        if (child.parent === this) child.parent = null;
        return true;
      }
      /**
       * Adds multiple child entities to this entity.
       * @param {Entity[]} children The child entities to be added.
       * @method
       * @example
       * // Create a new entity
       * let entity = new Entity("Box");
       * let childEntity1 = new Entity("Child1");
       * let childEntity2 = new Entity("Child2");
       * let childEntity3 = new Entity("Child3");
       * 
       * // Add the child entities to the parent entity
       * entity.AddChildren(childEntity1, childEntity2, childEntity3);
       * 
       */
      AddChildren(...children) {
        children.forEach((child) => {
          this.AddChild(child);
        });
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
       * let transforms = entity.GetComponentsInChildren(Transform);
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
       * let child = entity.GetChildWithComponent(Transform);
       * 
       * 
       */
      GetChildWithComponent(type) {
        return this._children.filter((child) => child.HasComponent(type));
      }
      /**
       * Serialize this entity and its descendants into the project data contract.
       * Component IDs are generated once when a component is attached and are then
       * retained by save/load cycles.
       */
      serialize() {
        return {
          id: this.id,
          name: this.name,
          ...this.active === false ? { active: false } : {},
          components: this._components.map((component) => ({
            id: component.id,
            type: ComponentRegistry.nameOf(component),
            props: cloneSerializable(component.properties || {})
          })),
          children: this._children.map((child) => child.serialize())
        };
      }
      toJSON() {
        return this.serialize();
      }
      /** Backward-compatible aliases for callers using camelCase APIs. */
      Serialize() {
        return this.serialize();
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
        this._children.forEach((child) => {
          tree.children.push(child.GetTree());
        });
        return tree;
      }
      /**@private */
      destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        for (const component of this._components.splice(0)) {
          component.destroy();
        }
        for (const child of [...this._children]) {
          child.destroy();
        }
        this._parent?.RemoveChild(this);
        this._parent = null;
      }
    };
  }
});

// src/math/math.js
var Maths;
var init_math = __esm({
  "src/math/math.js"() {
    init_vec2();
    Maths = class _Maths {
      static #INITIAL_METER_TO_PIXEL_CONVERSION_FACTOR = 64;
      static #METER_TO_PIXEL_CONVERSION_FACTOR = _Maths.#INITIAL_METER_TO_PIXEL_CONVERSION_FACTOR;
      /**
       * The Value of PI. Same as Math.PI
       * @type {number}
       * @readonly
       */
      static get PI() {
        return Math.PI;
      }
      /**
       * The value of e. Same as Math.E
       * @type {number}
       * @readonly
       */
      static get EXP() {
        return Math.E;
      }
      /**
       * Constant to multiply by to convert from degrees to radians.
       * @type {number}
       * @readonly
       */
      static get DEG_TO_RAD() {
        return Math.PI / 180;
      }
      /**
       * Constant to multiply by to convert from radians to degrees.
       * @type {number}
       * @readonly
       */
      static get RAD_TO_DEG() {
        return 180 / Math.PI;
      }
      /**
       * Constatnt to multiply by to convert Meter to Pixel.
       * @type {number}
       * @readonly
       */
      static get METER_TO_PIXEL() {
        return _Maths.#METER_TO_PIXEL_CONVERSION_FACTOR;
      }
      /**
       * Constant to multiply by to convert from Pixel to Meter.
       * @type {number}
       * @readonly
       */
      static get PIXEL_TO_METER() {
        return 1 / _Maths.#METER_TO_PIXEL_CONVERSION_FACTOR;
      }
      /**
       * Very small number.
       * This number is in meters. It is used in physics for aproximate equality.
       * @type {number}
       * @readonly
       * 
       */
      static get VERY_SMALL_NUMBER() {
        return 0.01;
      }
      /**
       * Very large number.
       * This number is in meters. It is used in physics for aproximate equality.
       * @type {number}
       * @readonly
       */
      static get VERY_LARGE_NUMBER() {
        return 1e6;
      }
      /**
       * Find the lenght of a vector.
       * @param {Vector2} vector 
       * @returns {number}
       */
      static Lenght(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      }
      /**
       * Find the lenght of a vector squared.
       * Finding Square root is expensive. To compare lenghts, it is better to compare the square of the lenghts.
       * @param {Vector2} vector
       * @returns {number}
       */
      static LenghtSq(vector) {
        return vector.x * vector.x + vector.y * vector.y;
      }
      /**
       * Find the distance between two points.
       * @param {Vector2} vector1
       * @param {Vector2} vector2
       * @returns {number}
       * 
       */
      static Distance(vector1, vector2) {
        return _Maths.Lenght(vector2.Copy().Subtract(vector1));
      }
      /**
       * Find the distance between two points squared.
       * Finding Square root is expensive. To compare distances, it is better to compare the square of the distances.
       * @param {Vector2} vector1
       * @param {Vector2} vector2
       * @returns {number}
       */
      static DistanceSq(vector1, vector2) {
        return _Maths.LenghtSq(vector2.Copy().Subtract(vector1));
      }
      /**
       * Normalize a vector. A normalized vector has a lenght of 1, but the same direction as the original vector.
       * @param {Vector2} vector
       * @returns {Vector2}
       */
      static Normalize(vector) {
        let lenght = _Maths.Lenght(vector);
        if (lenght != 0) return new Vector2(vector.x / lenght, vector.y / lenght);
        else return new Vector2(0, 0);
      }
      /**
       * Find perpendicular vector. The perpendicular vector is 90 degrees to the original vector.
       * @param {Vector2} vector
       * @returns {Vector2}
       * 
       */
      static Perpendicular(vector) {
        return new Vector2(-vector.y, vector.x);
      }
      /**
       * Find the dot product of two vectors. The dot product is the sum of the products of the corresponding components of the two vectors. It is the lenght projection of one vector onto the other.
       * @param {Vector2} vector1
       * @param {Vector2} vector2
       * @returns {number}
       */
      static Dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
      }
      /**
       * Find the cross product of two vectors. The cross product is the determinant of the two vectors. It is the lenght projection of one vector onto the perpendicular of the other.
       * @param {Vector2} vector1
       * @param {Vector2} vector2
       * @returns {number}
       */
      static Cross(vector1, vector2) {
        return vector1.x * vector2.y - vector1.y * vector2.x;
      }
      /**
       * Clamp a number between a min and max value.
       * @param {number} value
       * @param {number} min
       * @param {number} max
       * @returns {number}
       */
      static Clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
      }
      /**
       * Get a random Vector2 between min and max.
       * @param {Vector2} min - The minimum value of the random vector.
       * @param {Vector2} max - The maximum value of the random vector.
       * @returns {Vector2} - A random vector between min and max.
       * 
       */
      static RandomVector2(min, max) {
        return new Vector2(Math.random() * (max - min) + min, Math.random() * (max - min) + min);
      }
      /**
       * Convert Pixel to Meter.
       * @param {number} pixel
       * @returns {number}
       */
      static PixelToMeter(pixel) {
        return pixel * this.PIXEL_TO_METER;
      }
      /**
       * Convert Meter to Pixel.
       * @param {number} meter
       * @returns {number}
       */
      static MeterToPixel(meter) {
        return meter * this.METER_TO_PIXEL;
      }
      /**
       * Convert Vector2 from Pixel to Meter.
       * @param {Vector2} pixel
       * @returns {Vector2}
       */
      static PixelToMeterVector2(vector) {
        return new Vector2(vector.x * _Maths.PIXEL_TO_METER, vector.y * _Maths.PIXEL_TO_METER);
      }
      /**
       * Convert Vector2 from Meter to Pixel.
       * @param {Vector2} meter
       * @returns {Vector2}
       */
      static MeterToPixelVector2(vector) {
        return new Vector2(vector.x * _Maths.METER_TO_PIXEL, vector.y * _Maths.METER_TO_PIXEL);
      }
      /**
       * Find if two numbers /Vectors are approximately equal.
       * @param {number} a - can be a number or a Vector2.
       * @param {number} b - can be a number or a Vector2.
       * @returns {boolean}
       */
      static NearlyEqual(a, b) {
        if (a instanceof Vector2 && b instanceof Vector2) {
          return _Maths.NearlyEqual(a.x, b.x) && _Maths.NearlyEqual(a.y, b.y);
        } else if (typeof a === "number" && typeof b === "number") {
          return Math.abs(a - b) < _Maths.VERY_SMALL_NUMBER;
        } else {
          throw new Error("nearlyEqual: a and b must be number or vector2");
        }
      }
      /**@private */
      static generateMeterToPixelConversionFactor(originalCanvasWidth, originalCanvasHeight, newWidth, newHeight) {
        let widthRatio = newWidth / originalCanvasWidth;
        let heightRatio = newHeight / originalCanvasHeight;
        let ratio = widthRatio < heightRatio ? widthRatio : heightRatio;
        _Maths.#METER_TO_PIXEL_CONVERSION_FACTOR = _Maths.#INITIAL_METER_TO_PIXEL_CONVERSION_FACTOR * ratio;
      }
    };
  }
});

// src/ui/authoredUi.js
function validateAuthoredUI(value) {
  if (value == null) return { version: AUTHORED_UI_VERSION, elements: [] };
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== AUTHORED_UI_VERSION || !Array.isArray(value.elements)) {
    throw new TypeError(`scene.ui must be an object with version ${AUTHORED_UI_VERSION} and an elements array`);
  }
  const ids = /* @__PURE__ */ new Set();
  const elements = value.elements.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new TypeError(`scene.ui.elements[${index}] must be an object`);
    if (typeof item.id !== "string" || !item.id.trim() || ids.has(item.id)) throw new TypeError(`scene.ui.elements[${index}].id must be non-empty and unique`);
    ids.add(item.id);
    if (!["panel", "text", "button"].includes(item.type)) throw new TypeError(`Unsupported authored UI type '${String(item.type)}'`);
    const anchor = item.anchor ?? { x: "left", y: "top" };
    if (!anchor || !["left", "center", "right"].includes(anchor.x) || !["top", "center", "bottom"].includes(anchor.y)) throw new TypeError(`scene.ui.elements[${index}].anchor is invalid`);
    const width = finite(item.width ?? 100, `scene.ui.elements[${index}].width`, 0, 1e5);
    const height = finite(item.height ?? 32, `scene.ui.elements[${index}].height`, 0, 1e5);
    const zIndex = finite(item.zIndex ?? index, `scene.ui.elements[${index}].zIndex`, -1e4, 1e4);
    const color = item.color ?? "#f5f5f5";
    const background = item.background ?? (item.type === "panel" ? "#25313b" : "transparent");
    if (!isSafeColor(color) || !isSafeColor(background)) throw new TypeError(`scene.ui.elements[${index}] color/background is unsupported`);
    const text = item.text ?? "";
    if (typeof text !== "string" || text.length > 4096) throw new TypeError(`scene.ui.elements[${index}].text must be a string of at most 4096 characters`);
    const fontSize = finite(item.fontSize ?? 16, `scene.ui.elements[${index}].fontSize`, 1, 256);
    if (item.visible !== void 0 && typeof item.visible !== "boolean") throw new TypeError(`scene.ui.elements[${index}].visible must be a boolean`);
    if (item.action !== void 0 && item.action !== null && (typeof item.action !== "string" || item.action.length > 128)) throw new TypeError(`scene.ui.elements[${index}].action must be a short string`);
    const visible = item.visible !== false;
    return {
      id: item.id,
      type: item.type,
      x: finite(item.x ?? 0, `scene.ui.elements[${index}].x`),
      y: finite(item.y ?? 0, `scene.ui.elements[${index}].y`),
      width,
      height,
      zIndex,
      anchor: { x: anchor.x, y: anchor.y },
      color,
      background,
      text,
      fontSize,
      visible,
      fontFamily: item.fontFamily === void 0 ? "sans-serif" : typeof item.fontFamily === "string" && /^[\w ,'-]{1,128}$/.test(item.fontFamily) ? item.fontFamily : (() => {
        throw new TypeError(`scene.ui.elements[${index}].fontFamily is unsupported`);
      })(),
      align: ["left", "center", "right"].includes(item.align) ? item.align : "left",
      action: typeof item.action === "string" && item.action.length <= 128 ? item.action : null
    };
  });
  return { version: AUTHORED_UI_VERSION, elements };
}
function positionStyle(element) {
  const horizontal = element.anchor.x;
  const vertical = element.anchor.y;
  const style = { position: "absolute", width: `${element.width}px`, height: `${element.height}px`, zIndex: String(element.zIndex) };
  style[horizontal === "left" ? "left" : horizontal === "right" ? "right" : "left"] = horizontal === "center" ? `calc(50% + ${element.x}px)` : `${element.x}px`;
  style[vertical === "top" ? "top" : vertical === "bottom" ? "bottom" : "top"] = vertical === "center" ? `calc(50% + ${element.y}px)` : `${element.y}px`;
  if (horizontal === "center") style.transform = "translateX(-50%)";
  if (vertical === "center") style.transform = `${style.transform || ""} translateY(-50%)`.trim();
  return style;
}
function mountAuthoredUI(host, source, { mode = "game", captureInput = false, onCaptureChange } = {}) {
  if (!host || typeof host.appendChild !== "function") throw new TypeError("Authored UI needs a DOM host element");
  if (mode !== "game" && mode !== "scene-preview") throw new TypeError("Authored UI mode must be 'game' or 'scene-preview'");
  const data = validateAuthoredUI(source);
  const root = host.ownerDocument.createElement("div");
  root.dataset.neptuneAuthoredUi = "true";
  root.dataset.mode = mode;
  Object.assign(root.style, { position: "absolute", inset: "0", overflow: "hidden", pointerEvents: captureInput ? "auto" : "none", zIndex: "20" });
  root.setAttribute("aria-label", "Authored game UI preview");
  const actionHandler = (event) => {
    if (mode !== "game") return;
    const action = event.target?.closest?.("[data-neptune-action]")?.dataset.neptuneAction;
    if (action) host.dispatchEvent(new host.ownerDocument.defaultView.CustomEvent("neptune:ui-action", { bubbles: true, detail: { action } }));
  };
  root.addEventListener("click", actionHandler);
  for (const element of data.elements.filter((item) => item.visible).sort((a, b) => a.zIndex - b.zIndex)) {
    const node = host.ownerDocument.createElement(element.type === "button" ? "button" : "div");
    node.dataset.neptuneUiId = element.id;
    Object.assign(node.style, positionStyle(element), {
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: element.align === "center" ? "center" : element.align === "right" ? "flex-end" : "flex-start",
      padding: "4px 8px",
      color: element.color,
      backgroundColor: element.background,
      fontFamily: element.fontFamily,
      fontSize: `${element.fontSize}px`,
      textAlign: element.align,
      border: element.type === "button" ? "1px solid rgba(255,255,255,.28)" : "0",
      borderRadius: element.type === "button" ? "4px" : "0",
      pointerEvents: captureInput || mode === "game" && element.type === "button" ? "auto" : "none"
    });
    node.textContent = element.text;
    if (element.type === "button") {
      node.type = "button";
      node.dataset.neptuneAction = element.action || "";
      node.disabled = !element.action || mode !== "game";
      node.tabIndex = mode === "game" || captureInput ? 0 : -1;
    }
    root.appendChild(node);
  }
  host.appendChild(root);
  const states = hostCaptureStates.get(host) || [];
  const state = { captureInput, active: true };
  states.push(state);
  hostCaptureStates.set(host, states);
  const updateCapture = () => {
    const active = [...hostCaptureStates.get(host) || []].reverse().find((item) => item.active);
    host.dataset.neptuneUiCapture = active ? active.captureInput ? "captured" : "passthrough" : "off";
  };
  updateCapture();
  onCaptureChange?.(captureInput);
  let disposed = false;
  return {
    element: root,
    mode,
    captureInput,
    setCapture(next) {
      if (disposed || typeof next !== "boolean") return false;
      state.captureInput = next;
      root.style.pointerEvents = next ? "auto" : "none";
      for (const node of root.querySelectorAll("button")) node.tabIndex = next ? 0 : -1;
      updateCapture();
      onCaptureChange?.(next);
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeEventListener("click", actionHandler);
      root.remove();
      state.active = false;
      const remaining = (hostCaptureStates.get(host) || []).filter((item) => item.active);
      hostCaptureStates.set(host, remaining);
      updateCapture();
      onCaptureChange?.(false);
    }
  };
}
var AUTHORED_UI_VERSION, finite, namedColors, isSafeColor, hostCaptureStates;
var init_authoredUi = __esm({
  "src/ui/authoredUi.js"() {
    AUTHORED_UI_VERSION = 1;
    finite = (value, label, min = -1e5, max = 1e5) => {
      if (!Number.isFinite(value) || value < min || value > max) throw new TypeError(`${label} must be a finite number from ${min} to ${max}`);
      return value;
    };
    namedColors = /* @__PURE__ */ new Set(["transparent", "white", "black", "red", "green", "blue", "yellow", "orange", "purple", "gray", "grey", "lime", "navy", "teal", "aqua", "fuchsia", "silver", "maroon", "olive"]);
    isSafeColor = (value) => typeof value === "string" && (namedColors.has(value.toLowerCase()) || /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value) || /^rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value));
    hostCaptureStates = /* @__PURE__ */ new WeakMap();
  }
});

// src/core/scene.js
function getResourceReferenceTarget(value, kind, sourceLocation = kind) {
  assertResourceReference(value, kind, sourceLocation);
  if (typeof value === "string") return value.trim();
  for (const key of ["path", "uri", "id", "key", "ref"]) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
  }
  return null;
}
function assertResourceReference(value, kind, sourceLocation = kind) {
  const types = RESOURCE_TYPES[kind] || /* @__PURE__ */ new Set([kind, "resource", "asset"]);
  if (value === void 0 || value === null) {
    throw new ResourceReferenceError(kind, value, sourceLocation, "missing reference");
  }
  if (typeof value === "string") {
    if (value.trim()) return value.trim();
    throw new ResourceReferenceError(kind, value, sourceLocation, "reference is empty");
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ResourceReferenceError(kind, value, sourceLocation, "reference must be a string or reference object");
  }
  const declaredType = value.type ?? value.resourceType ?? value.assetType ?? value.kind;
  if (declaredType !== void 0 && (typeof declaredType !== "string" || !types.has(declaredType.toLowerCase()))) {
    throw new ResourceReferenceError(
      kind,
      value,
      sourceLocation,
      `declared type '${String(declaredType)}' is incompatible`
    );
  }
  const targetKeys = ["path", "uri", "id", "key", "ref"];
  const target = targetKeys.find((key) => typeof value[key] === "string" && value[key].trim());
  if (!target) {
    throw new ResourceReferenceError(kind, value, sourceLocation, "reference object has no usable target");
  }
  return value[target].trim();
}
function validateComponentReferences(component, sourceLocation) {
  if (!isObject(component) || typeof component.type !== "string") return;
  const componentType = component.type.toLowerCase();
  const props = component.props;
  const propsLocation = `${sourceLocation}.props`;
  if (!isObject(props)) {
    if (["sprite", "sound", "soundpool", "audio", "tilemap", "animator", "animation"].includes(componentType)) {
      throw new ResourceReferenceError(componentType, props, propsLocation, "component properties are missing");
    }
    return;
  }
  if (componentType === "sprite") {
    assertResourceReference(
      props.path ?? props.texture ?? props.asset ?? props.reference,
      "sprite",
      `${propsLocation}.path`
    );
  } else if (componentType === "sound" || componentType === "soundpool" || componentType === "audio") {
    assertResourceReference(
      props.src ?? props.path ?? props.audio ?? props.asset ?? props.reference,
      "audio",
      `${propsLocation}.${props.src !== void 0 ? "src" : "path"}`
    );
  } else if (componentType === "tilemap") {
    assertResourceReference(
      props.tileset ?? props.tilesetRef ?? props.asset,
      "tileset",
      `${propsLocation}.tileset`
    );
  } else if (componentType === "animation") {
    assertResourceReference(
      props.path ?? props.animation ?? props.asset ?? props.reference,
      "animation",
      `${propsLocation}.animation`
    );
  } else if (componentType === "animator") {
    const animations = props.animations;
    if (Array.isArray(animations)) {
      animations.forEach((animation, index) => assertResourceReference(
        animation,
        "animation",
        `${propsLocation}.animations[${index}]`
      ));
    } else if (animations !== void 0) {
      if (isObject(animations) && !("path" in animations || "uri" in animations || "id" in animations || "key" in animations || "ref" in animations)) {
        Object.entries(animations).forEach(([name, animation]) => assertResourceReference(
          animation,
          "animation",
          `${propsLocation}.animations.${name}`
        ));
      } else {
        assertResourceReference(animations, "animation", `${propsLocation}.animations`);
      }
    }
    if (props.currentAnimation !== void 0) {
      assertResourceReference(props.currentAnimation, "animation", `${propsLocation}.currentAnimation`);
    }
  }
}
function validateEntityReferences(entity, sourceLocation) {
  if (!isObject(entity)) return;
  if (entity.prefab !== void 0) assertResourceReference(entity.prefab, "prefab", `${sourceLocation}.prefab`);
  if (entity.prefabRef !== void 0) assertResourceReference(entity.prefabRef, "prefab", `${sourceLocation}.prefabRef`);
  if (Array.isArray(entity.components)) {
    entity.components.forEach((component, index) => validateComponentReferences(component, `${sourceLocation}.components[${index}]`));
  }
  if (Array.isArray(entity.children)) {
    entity.children.forEach((child, index) => validateEntityReferences(child, `${sourceLocation}.children[${index}]`));
  }
}
function validateSceneResourceReferences(data, sourceLocation = "scene") {
  if (!isObject(data)) return data;
  if (Array.isArray(data.layers)) {
    data.layers.forEach((layer, layerIndex) => {
      const layerLocation = `${sourceLocation}.layers[${layerIndex}]`;
      if (!isObject(layer)) return;
      if (layer.type === "tilemap") {
        assertResourceReference(layer.src, "tilemap", `${layerLocation}.src`);
      }
      if (layer.prefab !== void 0) {
        assertResourceReference(layer.prefab, "prefab", `${layerLocation}.prefab`);
      }
      if (Array.isArray(layer.entities)) {
        layer.entities.forEach((entity, entityIndex) => validateEntityReferences(entity, `${layerLocation}.entities[${entityIndex}]`));
      }
    });
  }
  if (Array.isArray(data.entities)) {
    data.entities.forEach((entity, index) => validateEntityReferences(entity, `${sourceLocation}.entities[${index}]`));
  }
  if (data.prefab !== void 0) assertResourceReference(data.prefab, "prefab", `${sourceLocation}.prefab`);
  if (Array.isArray(data.prefabs)) {
    data.prefabs.forEach((prefab, index) => assertResourceReference(prefab, "prefab", `${sourceLocation}.prefabs[${index}]`));
  } else if (isObject(data.prefabs)) {
    Object.entries(data.prefabs).forEach(([name, prefab]) => assertResourceReference(prefab, "prefab", `${sourceLocation}.prefabs.${name}`));
  }
  return data;
}
var SCENE_SCHEMA_VERSION, SCENE_DATA_VERSION, RESOURCE_REFERENCE_ERROR_CODE, RESOURCE_TYPES, describeReference, ResourceReferenceError, isObject, cloneSerializable2, Scene;
var init_scene = __esm({
  "src/core/scene.js"() {
    init_renderable();
    init_entity();
    init_sceneManager();
    init_math();
    init_authoredUi();
    SCENE_SCHEMA_VERSION = 1;
    SCENE_DATA_VERSION = "1.0.0";
    RESOURCE_REFERENCE_ERROR_CODE = "RESOURCE_REFERENCE_INVALID";
    RESOURCE_TYPES = {
      tileset: /* @__PURE__ */ new Set(["tileset", "image", "texture", "resource", "asset"]),
      sprite: /* @__PURE__ */ new Set(["sprite", "image", "texture", "resource", "asset"]),
      animation: /* @__PURE__ */ new Set(["animation", "resource", "asset"]),
      audio: /* @__PURE__ */ new Set(["audio", "sound", "music", "resource", "asset"]),
      prefab: /* @__PURE__ */ new Set(["prefab", "scene", "resource", "asset"]),
      tilemap: /* @__PURE__ */ new Set(["tilemap", "map", "resource", "asset"])
    };
    describeReference = (value) => {
      if (value === void 0 || value === null) return "<missing>";
      if (typeof value === "string") return value.trim() || "<empty>";
      if (typeof value !== "object") return String(value);
      for (const key of ["id", "path", "uri", "key", "ref"]) {
        if (typeof value[key] === "string" && value[key].trim()) return value[key];
      }
      return "<malformed>";
    };
    ResourceReferenceError = class extends Error {
      constructor(kind, value, sourceLocation, reason, expected = "a non-empty path, id, uri, or key") {
        const reference = describeReference(value);
        super(`[${RESOURCE_REFERENCE_ERROR_CODE}] Invalid ${kind} resource reference '${reference}' at ${sourceLocation}: ${reason}. Expected ${expected}.`);
        this.name = "ResourceReferenceError";
        this.code = RESOURCE_REFERENCE_ERROR_CODE;
        this.referenceType = kind;
        this.resourceType = kind;
        this.reference = reference;
        this.source = sourceLocation;
        this.sourceLocation = sourceLocation;
        this.location = sourceLocation;
        this.reason = reason;
        this.expected = expected;
      }
    };
    isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    cloneSerializable2 = (value, seen = /* @__PURE__ */ new WeakSet()) => {
      if (value === null || typeof value !== "object") return value;
      if (seen.has(value)) return void 0;
      seen.add(value);
      if (Array.isArray(value)) return value.map((item) => cloneSerializable2(item, seen));
      const result = {};
      for (const [key, item] of Object.entries(value)) {
        const cloned = cloneSerializable2(item, seen);
        if (cloned !== void 0) result[key] = cloned;
      }
      return result;
    };
    Scene = class extends Entity {
      static SCHEMA_VERSION = SCENE_SCHEMA_VERSION;
      static DATA_VERSION = SCENE_DATA_VERSION;
      /** Called when The scene is loaded */
      OnSceneLoad = () => {
      };
      /** Called when the scene is unloaded */
      OnSceneUnload = () => {
      };
      /** Called when the scene is loaded in additive mode */
      OnSceneLoadAdditive = () => {
      };
      /** Called when the scene is unloaded in additive mode */
      OnSceneUnloadAdditive = () => {
      };
      constructor(name) {
        super(name);
        this.id = SceneManager.getIdForNewScene();
        this.ui = { version: 1, elements: [] };
        this.navigationTilemaps = /* @__PURE__ */ new Map();
        SceneManager.addScene(this);
      }
      /** Get the runtime navigation grid loaded from a tilemap resource path. */
      getNavigationTilemap(resourcePath) {
        return this.navigationTilemaps.get(resourcePath) ?? null;
      }
      /** Serialize the scene graph using the versioned scene contract. */
      serialize() {
        return {
          type: "scene",
          version: SCENE_DATA_VERSION,
          schemaVersion: SCENE_SCHEMA_VERSION,
          id: this.id,
          name: this.name,
          camera: this.cameraSettings ? cloneSerializable2(this.cameraSettings) : void 0,
          ...this.ui?.elements?.length ? { ui: cloneSerializable2(validateAuthoredUI(this.ui)) } : {},
          layers: [{
            name: "Main",
            type: "object_layer",
            root: true,
            entities: this.children.map((child) => child.serialize())
          }]
        };
      }
      toJSON() {
        return this.serialize();
      }
      Serialize() {
        return this.serialize();
      }
      /** @private */
      draw(ctx2) {
        ctx2.save();
        if (this.activeCamera) {
          this.activeCamera.apply(ctx2);
        } else if (this.cameraSettings && this.cameraSettings.bounds) {
          const x = this.cameraSettings.bounds.x || 0;
          const y = this.cameraSettings.bounds.y || 0;
          const px = Maths.MeterToPixel(x);
          const py = Maths.MeterToPixel(y);
          ctx2.translate(-px, -py);
        }
        withRenderablePass(ctx2, () => {
          sortRenderables(collectRenderableRoots(this)).forEach((renderable) => renderable.draw(ctx2));
        });
        const camera = this.activeCamera;
        const fadeAlpha = camera ? Math.max(0, Math.min(1, camera.fadeAlpha || 0)) : 0;
        if (fadeAlpha > 0) {
          const zoom = camera.zoom || 1;
          ctx2.save();
          ctx2.globalAlpha *= fadeAlpha;
          ctx2.fillStyle = "#000";
          ctx2.fillRect(camera.x, camera.y, camera.viewWidth / zoom, camera.viewHeight / zoom);
          ctx2.restore();
        }
        ctx2.restore();
      }
    };
  }
});

// src/core/storage.js
function getStorageArea(persistent) {
  const name = persistent ? "localStorage" : "sessionStorage";
  const area = globalThis[name];
  if (area && typeof area.getItem === "function") return area;
  const memory = persistent ? memoryStores.persistent : memoryStores.session;
  return {
    setItem(key, value) {
      memory.set(String(key), String(value));
    },
    getItem(key) {
      return memory.has(String(key)) ? memory.get(String(key)) : null;
    },
    removeItem(key) {
      memory.delete(String(key));
    },
    clear() {
      memory.clear();
    }
  };
}
function parseVersion(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const major = Number.parseInt(value.split(".")[0], 10);
  return Number.isInteger(major) ? major : null;
}
function normalizeSchemaVersion(value) {
  return typeof value === "string" ? parseVersion(value) : value;
}
function clone(value) {
  if (value === void 0) return void 0;
  return JSON.parse(JSON.stringify(value));
}
function assertProjectVersion(data) {
  const sourceVersion = data?.schemaVersion ?? data?.version;
  const version = normalizeSchemaVersion(sourceVersion);
  if (sourceVersion !== void 0 && (version === null || version !== PROJECT_SCHEMA_VERSION)) {
    throw new Error(`Unsupported project schema version '${sourceVersion}'. Supported version is ${PROJECT_SCHEMA_VERSION}. Migrate the project before loading it.`);
  }
}
function assertSceneVersion(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("Scene data must be a JSON object.");
  }
  const sourceVersion = data.schemaVersion ?? data.version;
  const version = normalizeSchemaVersion(sourceVersion);
  if (sourceVersion !== void 0 && (version === null || version !== SCENE_SCHEMA_VERSION2)) {
    throw new Error(`Unsupported scene schema version '${sourceVersion}'. Supported version is ${SCENE_SCHEMA_VERSION2}. Migrate the scene before loading it.`);
  }
}
function serializeScenePayload(scene = {}) {
  const source = typeof scene.serialize === "function" ? scene.serialize() : scene;
  assertSceneVersion(source);
  validateSceneResourceReferences(source);
  const payload = clone(source || {});
  payload.type = "scene";
  payload.version = SCENE_DATA_VERSION2;
  payload.schemaVersion = SCENE_SCHEMA_VERSION2;
  return payload;
}
var PROJECT_SCHEMA_VERSION, PROJECT_DATA_VERSION, SCENE_SCHEMA_VERSION2, SCENE_DATA_VERSION2, memoryStores, Storage;
var init_storage = __esm({
  "src/core/storage.js"() {
    init_scene();
    PROJECT_SCHEMA_VERSION = 1;
    PROJECT_DATA_VERSION = "1.0.0";
    SCENE_SCHEMA_VERSION2 = 1;
    SCENE_DATA_VERSION2 = "1.0.0";
    memoryStores = {
      session: /* @__PURE__ */ new Map(),
      persistent: /* @__PURE__ */ new Map()
    };
    Storage = class _Storage {
      /**
       * Set a value in the browser's local storage or session storage.
       * @param {string} key The key of the data to be stored.
       * @param {string} value The value of the data to be stored.
       * @param {boolean} persistent Whether the data should be stored in the local storage or session storage.
       */
      static Set(key, value, persistent = false) {
        getStorageArea(persistent).setItem(key, value);
      }
      /**
       * Get a value from the browser's local storage or session storage.
       * @param {string} key The key of the data to be retrieved.
       * @returns {string} The data stored in the browser's local storage or session storage.
       */
      static Get(key) {
        let data = getStorageArea(false).getItem(key);
        if (!data)
          data = getStorageArea(true).getItem(key);
        return data;
      }
      /**
       * Remove a value from the browser's local storage or session storage.
       * @param {string} key The key of the data to be removed.
       * @returns {string} The data stored in the browser's local storage or session storage.
       * 
       */
      static Remove(key) {
        getStorageArea(false).removeItem(key);
        getStorageArea(true).removeItem(key);
      }
      /**
       * Clear the browser's local storage or session storage.
       */
      static Clear() {
        getStorageArea(false).clear();
        getStorageArea(true).clear();
      }
      /** Store a versioned JSON value without exposing JSON parsing to callers. */
      static SetJSON(key, value, persistent = false) {
        _Storage.Set(key, JSON.stringify(value), persistent);
      }
      static GetJSON(key) {
        const value = _Storage.Get(key);
        if (value === null || value === void 0) return null;
        try {
          return JSON.parse(value);
        } catch (error) {
          throw new Error(`Stored value '${key}' is not valid JSON: ${error.message}`);
        }
      }
      static SerializeProject(project = {}) {
        const source = typeof project.serialize === "function" ? project.serialize() : project;
        const payload = clone(source || {});
        payload.type = "project";
        payload.version = PROJECT_DATA_VERSION;
        payload.schemaVersion = PROJECT_SCHEMA_VERSION;
        if (!Array.isArray(payload.scenes)) payload.scenes = [];
        payload.scenes = payload.scenes.map((scene) => serializeScenePayload(scene));
        return payload;
      }
      static DeserializeProject(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new TypeError("Project data must be a JSON object.");
        }
        assertProjectVersion(data);
        if (Array.isArray(data.scenes)) {
          data.scenes.forEach((scene, index) => {
            assertSceneVersion(scene);
            validateSceneResourceReferences(scene, `project.scenes[${index}]`);
          });
        }
        return _Storage.SerializeProject(data);
      }
      static SaveProject(key, project, persistent = false) {
        _Storage.SetJSON(key, _Storage.SerializeProject(project), persistent);
        return _Storage.GetJSON(key);
      }
      static LoadProject(key) {
        const data = _Storage.GetJSON(key);
        return data === null ? null : _Storage.DeserializeProject(data);
      }
      static SaveScene(key, scene, persistent = false) {
        const payload = serializeScenePayload(scene);
        _Storage.SetJSON(key, payload, persistent);
        return _Storage.GetJSON(key);
      }
      static LoadScene(key) {
        const data = _Storage.GetJSON(key);
        if (data === null) return null;
        const version = normalizeSchemaVersion(data.schemaVersion ?? parseVersion(data.version));
        if (version !== null && version !== void 0 && version !== 1) {
          throw new Error(`Unsupported scene schema version '${data.schemaVersion ?? data.version}'. Supported version is 1. Migrate the scene before loading it.`);
        }
        validateSceneResourceReferences(data, `storage.scene['${key}']`);
        return data;
      }
      static setJSON(...args) {
        return _Storage.SetJSON(...args);
      }
      static getJSON(...args) {
        return _Storage.GetJSON(...args);
      }
      static saveProject(...args) {
        return _Storage.SaveProject(...args);
      }
      static loadProject(...args) {
        return _Storage.LoadProject(...args);
      }
      static saveScene(...args) {
        return _Storage.SaveScene(...args);
      }
      static loadScene(...args) {
        return _Storage.LoadScene(...args);
      }
    };
  }
});

// src/components/transform.js
var Transform;
var init_transform = __esm({
  "src/components/transform.js"() {
    init_component();
    init_vec2();
    Transform = class extends Component {
      constructor(pos = Vector2.Zero(), rot = 0, scale = Vector2.One()) {
        super();
        this._properties = {
          position: pos.Copy(),
          rotation: rot,
          scale: scale.Copy()
        };
      }
      /**
       * The vector representing the position of the entity.
       * @type {Vector2}
       * 
       */
      get position() {
        return this._properties.position;
      }
      set position(position) {
        this._properties.position = position;
      }
      /**
       * Thr rotation of the entity.
       * @type {number}
       */
      get rotation() {
        return this._properties.rotation;
      }
      set rotation(rotation) {
        this._properties.rotation = rotation;
      }
      /**
       * A Vector2 representing the scale of the entity.
       * Scale defaults to Vector2.one().
       * Changing the scale will not affect the width, height and radius of the entity.
       * Scale only affects the Rendering of the entity.
       * @type {Vector2}
       * 
       */
      get scale() {
        return this._properties.scale;
      }
      set scale(scale) {
        this._properties.scale = scale;
      }
      deserialize(props) {
        if (!props) return;
        const { position, scale, ...rest } = props;
        super.deserialize(rest);
        for (const [key, value] of [["position", position], ["scale", scale]]) {
          if (value && typeof value.x === "number" && typeof value.y === "number") {
            this._properties[key].x = value.x;
            this._properties[key].y = value.y;
          }
        }
      }
      /**
       * Returns the forward vector of the entity.
       * @returns {Vector2} The forward vector of the entity.
       * 
       */
      GetForward() {
        return new Vector2(Math.cos(this._properties.rotation), Math.sin(this._properties.rotation));
      }
      /**
       * Translates the entity by the given vector.
       * @param {Vector2} translation The vector by which the entity is translated.
       */
      Translate(translation) {
        this._properties.position.Add(translation);
      }
      /**
       * Rotates the entity by the given angle.
       * @param {number} angle The angle by which the entity is rotated.
       */
      Rotate(rotation) {
        this._properties.rotation += rotation;
      }
      /**
       * Scales the entity by the given vector.
       * @param {Vector2} scale The vector by which the entity is scaled.
       */
      Scale(scale) {
        this._properties.scale.x *= scale.x;
        this._properties.scale.y *= scale.y;
      }
    };
  }
});

// src/rendering/sprite.js
var Sprite;
var init_sprite = __esm({
  "src/rendering/sprite.js"() {
    init_renderable();
    init_transform();
    init_math();
    init_scene();
    Sprite = class extends Renderable {
      #image;
      #transform;
      constructor(path, width = 1, height = 1) {
        super();
        this._properties.path = getResourceReferenceTarget(path, "sprite", "sprite.path");
        this._properties.width = width;
        this._properties.height = height;
        this.#image = new Image();
        this.#image.src = path;
      }
      /**
       * The Path to the image. Note: While hosting the game on a server, the path must be relative to the server.
       * @type {string}
       * 
       */
      get path() {
        return this._properties.path;
      }
      set path(path) {
        this._properties.path = getResourceReferenceTarget(path, "sprite", "sprite.path");
        this.#image.src = this._properties.path;
      }
      /**
       * Width of the sprite in meters.
       */
      get width() {
        return this._properties.width;
      }
      set width(width) {
        this._properties.width = width;
      }
      /**
       * Height of the sprite in meters.
       */
      get height() {
        return this._properties.height;
      }
      set height(height) {
        this._properties.height = height;
      }
      /** @private */
      draw(ctx2) {
        super.draw(ctx2);
        if (this.#transform == null)
          this.#transform = this.entity.GetComponent(Transform);
        let image = this.#image;
        let path = this._properties.path;
        let width = this._properties.width;
        let height = this._properties.height;
        let position = Maths.MeterToPixelVector2(this.#transform.position);
        let rotation = this.#transform.rotation;
        let scale = Maths.MeterToPixelVector2(this.#transform.scale);
        ctx2.save();
        ctx2.translate(position.x, position.y);
        ctx2.rotate(rotation);
        ctx2.scale(scale.x, scale.y);
        ctx2.globalCompositeOperation = this.blendMode;
        ctx2.filter = this.filter;
        if (this._properties.sourceRect) {
          const src = this._properties.sourceRect;
          ctx2.drawImage(image, src.x, src.y, src.width, src.height, -width / 2, -height / 2, width, height);
        } else {
          ctx2.drawImage(image, -width / 2, -height / 2, width, height);
        }
        this.drawChildren(ctx2);
        ctx2.restore();
      }
    };
  }
});

// src/thalassa/tileset.js
var Tileset;
var init_tileset = __esm({
  "src/thalassa/tileset.js"() {
    init_scene();
    Tileset = class {
      /**
       * @param {string} imagePath - Path to the tileset image.
       * @param {number} tileWidth - Width of each tile in pixels.
      * @param {number} tileHeight - Height of each tile in pixels.
       */
      constructor(imagePath, tileWidth = 16, tileHeight = 16) {
        this.imagePath = getResourceReferenceTarget(imagePath, "tileset", "tileset.imagePath");
        if (!Number.isFinite(tileWidth) || tileWidth <= 0 || !Number.isFinite(tileHeight) || tileHeight <= 0) {
          throw new ResourceReferenceError("tileset", imagePath, "tileset.tileSize", "tile dimensions must be positive numbers", "positive tileWidth and tileHeight values");
        }
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.image = new Image();
        this.image.src = imagePath;
        this.loaded = false;
        this.columns = 0;
        this.rows = 0;
        this.image.onload = () => {
          this.loaded = true;
          this.columns = Math.floor(this.image.width / this.tileWidth);
          this.rows = Math.floor(this.image.height / this.tileHeight);
        };
      }
      /**
       * Get the source rectangle for a tile by its ID.
       * @param {number} tileId - Tile ID (0-indexed, left-to-right, top-to-bottom).
       * @returns {{ x: number, y: number, w: number, h: number }}
       */
      getTileRect(tileId) {
        if (!Number.isInteger(tileId) || tileId < 0) {
          throw new ResourceReferenceError("tileset", this.imagePath, "tileset.tileId", "tile id must be a non-negative integer", "a valid zero-based tile id");
        }
        if (this.columns === 0) return { x: 0, y: 0, w: this.tileWidth, h: this.tileHeight };
        const col = tileId % this.columns;
        const row = Math.floor(tileId / this.columns);
        return {
          x: col * this.tileWidth,
          y: row * this.tileHeight,
          w: this.tileWidth,
          h: this.tileHeight
        };
      }
      /**
       * Draw a specific tile to a canvas context.
       * @param {CanvasRenderingContext2D} ctx - Canvas context.
       * @param {number} tileId - Tile ID.
       * @param {number} destX - Destination X position.
       * @param {number} destY - Destination Y position.
       * @param {number} scale - Scale factor.
       */
      drawTile(ctx2, tileId, destX, destY, scale = 1) {
        if (!this.loaded) return;
        const rect = this.getTileRect(tileId);
        ctx2.drawImage(
          this.image,
          rect.x,
          rect.y,
          rect.w,
          rect.h,
          destX,
          destY,
          this.tileWidth * scale,
          this.tileHeight * scale
        );
      }
    };
  }
});

// src/thalassa/tilemap.js
function validateGameplayMetadata(metadata, label) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new TypeError(`${label} metadata must be an object`);
  }
  for (const key of Object.keys(metadata)) {
    if (!TILE_METADATA_FIELDS.has(key)) throw new TypeError(`Unknown ${label.toLowerCase()} metadata field: ${key}`);
  }
  if (metadata.walkable !== void 0 && typeof metadata.walkable !== "boolean") {
    throw new TypeError(`${label} metadata walkable must be a boolean`);
  }
  if (metadata.terrain !== void 0 && typeof metadata.terrain !== "string") {
    throw new TypeError(`${label} metadata terrain must be a string`);
  }
  if (metadata.collision !== void 0 && typeof metadata.collision !== "boolean") {
    throw new TypeError(`${label} metadata collision must be a boolean`);
  }
  for (const field of ["damage", "slowdown", "movementCost"]) {
    if (metadata[field] !== void 0 && (!Number.isFinite(metadata[field]) || metadata[field] < 0)) {
      throw new TypeError(`${label} metadata ${field} must be a finite non-negative number`);
    }
  }
  for (const field of ["interaction", "transition"]) {
    if (metadata[field] !== void 0 && metadata[field] !== null && (typeof metadata[field] !== "object" || Array.isArray(metadata[field]))) {
      throw new TypeError(`${label} metadata ${field} must be an object or null`);
    }
  }
}
var TILE_METADATA_FIELDS, Tilemap;
var init_tilemap = __esm({
  "src/thalassa/tilemap.js"() {
    init_component();
    init_tileset();
    init_scene();
    TILE_METADATA_FIELDS = /* @__PURE__ */ new Set(["walkable", "terrain", "collision", "damage", "slowdown", "movementCost", "interaction", "transition"]);
    Tilemap = class _Tilemap extends Component {
      /**
       * @param {Tileset} tileset - The tileset to use.
       * @param {number} width - Map width in tiles.
       * @param {number} height - Map height in tiles.
       */
      constructor(tileset, width = 10, height = 10) {
        super();
        if (!(tileset instanceof Tileset)) {
          throw new ResourceReferenceError("tileset", tileset, "tilemap.tileset", "reference is not a Tileset instance", "a compatible Tileset instance");
        }
        if (!Number.isInteger(width) || width < 0 || !Number.isInteger(height) || height < 0) {
          throw new ResourceReferenceError("tilemap", tileset.imagePath, "tilemap.dimensions", "width and height must be non-negative integers", "valid tilemap dimensions");
        }
        this.tileset = tileset;
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.data = new Array(width * height).fill(-1);
        this.metadata = /* @__PURE__ */ new Map();
        this.cellMetadata = /* @__PURE__ */ new Map();
        this.layers = [];
        this.occupants = /* @__PURE__ */ new Map();
        this.occupantCells = /* @__PURE__ */ new Map();
      }
      /** Register another traversable map layer, ordered by render order then insertion. */
      addLayer(name, tilemap, renderOrder = 0) {
        if (typeof name !== "string" || name.length === 0) {
          throw new TypeError("Tilemap layer name must be a non-empty string");
        }
        if (!(tilemap instanceof _Tilemap) || tilemap === this) {
          throw new TypeError("Tilemap layer must be a different Tilemap instance");
        }
        if (!Number.isFinite(renderOrder)) {
          throw new TypeError("Tilemap layer renderOrder must be finite");
        }
        if (this.layers.some((layer) => layer.name === name)) {
          throw new Error(`Tilemap layer '${name}' already exists`);
        }
        this.layers.push({ name, tilemap, renderOrder });
        return tilemap;
      }
      getLayer(name) {
        return this.layers.find((layer) => layer.name === name)?.tilemap;
      }
      /** Set validated gameplay metadata for a tile ID. */
      setTileMetadata(tileId, metadata) {
        if (!Number.isInteger(tileId) || tileId < 0) {
          throw new TypeError("Tile metadata requires a non-negative integer tileId");
        }
        validateGameplayMetadata(metadata, "Tile");
        this.metadata.set(tileId, structuredClone(metadata));
        return this.getTileMetadata(tileId);
      }
      /** Return a defensive copy of metadata for a tile ID, or null when unset. */
      getTileMetadata(tileId) {
        const metadata = this.metadata.get(tileId);
        return metadata ? structuredClone(metadata) : null;
      }
      /** Set validated metadata for one row-major cell, overriding tile defaults. */
      setCellMetadata(x, y, metadata) {
        const index = this.gridIndex(x, y);
        if (index === null) throw new RangeError("Cell metadata coordinates are outside the tilemap");
        validateGameplayMetadata(metadata, "Cell");
        this.cellMetadata.set(index, structuredClone(metadata));
        return this.getCellMetadata(x, y);
      }
      /** Return a defensive copy of cell metadata, or null when unset/out of bounds. */
      getCellMetadata(x, y) {
        const index = this.gridIndex(x, y);
        if (index === null) return null;
        const metadata = this.cellMetadata.get(index);
        return metadata ? structuredClone(metadata) : null;
      }
      /** Resolve tile defaults with cell-specific metadata taking precedence. */
      getResolvedMetadata(x, y) {
        const tileId = this.getTile(x, y);
        const tileMetadata = tileId >= 0 ? this.metadata.get(tileId) : null;
        const cellMetadata = this.getCellMetadata(x, y);
        if (!tileMetadata && !cellMetadata) return null;
        return structuredClone({ ...tileMetadata || {}, ...cellMetadata || {} });
      }
      /** Convert tile coordinates to a stable row-major grid index, or null out of bounds. */
      gridIndex(x, y) {
        return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height ? y * this.width + x : null;
      }
      /** Place or move an occupant; each occupant may occupy only one cell. */
      occupy(x, y, occupant) {
        const index = this.gridIndex(x, y);
        if (index === null) throw new RangeError("Occupancy coordinates are outside the tilemap");
        if (occupant === void 0 || occupant === null) throw new TypeError("Occupant must be a non-null value");
        if (!this.isWalkable(x, y, occupant)) return false;
        const previousCell = this.occupantCells.get(occupant);
        if (previousCell !== void 0) this.occupants.delete(previousCell);
        this.occupants.set(index, occupant);
        this.occupantCells.set(occupant, index);
        return true;
      }
      /** Move an occupied actor by one cardinal tile, leaving state unchanged on failure. */
      moveOccupant(occupant, x, y) {
        if (occupant === void 0 || occupant === null) throw new TypeError("Occupant must be a non-null value");
        const currentIndex = this.occupantCells.get(occupant);
        if (currentIndex === void 0) return false;
        const fromX = currentIndex % this.width;
        const fromY = Math.floor(currentIndex / this.width);
        if (Math.abs(x - fromX) + Math.abs(y - fromY) !== 1) return false;
        if (!this.isWalkable(x, y, occupant)) return false;
        const nextIndex = this.gridIndex(x, y);
        this.occupants.delete(currentIndex);
        this.occupants.set(nextIndex, occupant);
        this.occupantCells.set(occupant, nextIndex);
        return true;
      }
      /** Follow a shortest path by one step toward a destination; returns the new cell or null. */
      moveOccupantToward(occupant, goalX, goalY) {
        const currentIndex = this.occupantCells.get(occupant);
        if (currentIndex === void 0) return null;
        const x = currentIndex % this.width;
        const y = Math.floor(currentIndex / this.width);
        const path = this.findPath(x, y, goalX, goalY, occupant);
        if (!path?.length) return path ? { x, y } : null;
        const step = path[0];
        return this.moveOccupant(occupant, step.x, step.y) ? step : null;
      }
      vacate(occupant) {
        const index = this.occupantCells.get(occupant);
        if (index === void 0) return null;
        this.occupantCells.delete(occupant);
        this.occupants.delete(index);
        return { x: index % this.width, y: Math.floor(index / this.width) };
      }
      getOccupant(x, y) {
        const index = this.gridIndex(x, y);
        return index === null ? null : this.occupants.get(index) ?? null;
      }
      isWalkable(x, y, mover = null) {
        const index = this.gridIndex(x, y);
        if (index === null) return false;
        const tileId = this.getTile(x, y);
        const metadata = this.getResolvedMetadata(x, y);
        if (metadata?.walkable === false || tileId >= 0 && metadata?.walkable !== true) return false;
        const occupant = this.occupants.get(index);
        return occupant === void 0 || occupant === mover;
      }
      /** Deterministic minimum-cost four-way path; returns coordinates excluding start, or null. */
      findPath(startX, startY, goalX, goalY, mover = null) {
        if (this.gridIndex(startX, startY) === null || this.gridIndex(goalX, goalY) === null || !this.isWalkable(startX, startY, mover) || !this.isWalkable(goalX, goalY, mover)) return null;
        if (startX === goalX && startY === goalY) return [];
        const key = (x, y) => y * this.width + x;
        const start = key(startX, startY);
        const distances = /* @__PURE__ */ new Map([[start, 0]]);
        const previous = /* @__PURE__ */ new Map([[start, null]]);
        const settled = /* @__PURE__ */ new Set();
        const queue = [];
        let insertionOrder = 0;
        const compare = (a, b) => a.distance - b.distance || a.order - b.order;
        const push = (entry) => {
          queue.push(entry);
          let index = queue.length - 1;
          while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (compare(queue[parent], entry) <= 0) break;
            queue[index] = queue[parent];
            index = parent;
          }
          queue[index] = entry;
        };
        const pop = () => {
          const first = queue[0];
          const last = queue.pop();
          if (queue.length && last) {
            let index = 0;
            while (true) {
              const left = index * 2 + 1;
              const right = left + 1;
              if (left >= queue.length) break;
              const child = right < queue.length && compare(queue[right], queue[left]) < 0 ? right : left;
              if (compare(queue[child], last) >= 0) break;
              queue[index] = queue[child];
              index = child;
            }
            queue[index] = last;
          }
          return first;
        };
        push({ index: start, distance: 0, order: insertionOrder++ });
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        while (queue.length) {
          const current = pop();
          if (!current || settled.has(current.index) || current.distance !== distances.get(current.index)) continue;
          if (current.index === key(goalX, goalY)) {
            const path = [];
            let step = current.index;
            while (step !== start) {
              path.push({ x: step % this.width, y: Math.floor(step / this.width) });
              step = previous.get(step);
            }
            return path.reverse();
          }
          settled.add(current.index);
          const x = current.index % this.width;
          const y = Math.floor(current.index / this.width);
          for (const [dx, dy] of directions) {
            const nx = x + dx, ny = y + dy, next = key(nx, ny);
            if (this.gridIndex(nx, ny) === null || settled.has(next) || !this.isWalkable(nx, ny, mover)) continue;
            const movementCost = this.getResolvedMetadata(nx, ny)?.movementCost ?? 1;
            const distance = current.distance + movementCost;
            if (distance >= (distances.get(next) ?? Infinity)) continue;
            distances.set(next, distance);
            previous.set(next, current.index);
            push({ index: next, distance, order: insertionOrder++ });
          }
        }
        return null;
      }
      /**
       * Set a tile at position.
       * @param {number} x - X position in tiles.
       * @param {number} y - Y position in tiles.
       * @param {number} tileId - Tile ID from tileset (-1 for empty).
       */
      setTile(x, y, tileId) {
        if (!Number.isInteger(tileId) || tileId < -1) {
          throw new ResourceReferenceError("tileset", this.tileset.imagePath, `tilemap.data[${x},${y}]`, "tile id must be -1 or a non-negative integer", "a valid tile id");
        }
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          this.data[y * this.width + x] = tileId;
        }
      }
      /**
       * Get a tile at position.
       * @param {number} x - X position in tiles.
       * @param {number} y - Y position in tiles.
       * @returns {number} Tile ID or -1 if empty/out of bounds.
       */
      getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          return this.data[y * this.width + x];
        }
        return -1;
      }
      /**
       * Load tilemap from 2D array.
       * @param {number[][]} data - 2D array of tile IDs.
       */
      loadFromArray(data) {
        if (!Array.isArray(data) || data.length > 0 && !Array.isArray(data[0])) {
          throw new ResourceReferenceError("tilemap", this.tileset.imagePath, "tilemap.data", "data must be a two-dimensional array", "a two-dimensional tile data array");
        }
        this.height = data.length;
        this.width = data[0]?.length || 0;
        this.data = new Array(this.width * this.height);
        for (let y = 0; y < this.height; y++) {
          if (!Array.isArray(data[y]) || data[y].length !== this.width) {
            throw new ResourceReferenceError("tilemap", this.tileset.imagePath, `tilemap.data[${y}]`, "rows must have the same width", "a rectangular two-dimensional tile data array");
          }
          for (let x = 0; x < this.width; x++) {
            const tileId = data[y][x];
            if (tileId === void 0 || tileId === null) {
              this.data[y * this.width + x] = -1;
            } else if (!Number.isInteger(tileId) || tileId < -1) {
              throw new ResourceReferenceError("tileset", this.tileset.imagePath, `tilemap.data[${y}][${x}]`, "tile id must be -1 or a non-negative integer", "a valid tile id");
            } else {
              this.data[y * this.width + x] = tileId;
            }
          }
        }
      }
      /**
       * Get pixel width of the tilemap.
       */
      get pixelWidth() {
        return this.width * this.tileset.tileWidth * this.scale;
      }
      /**
       * Get pixel height of the tilemap.
       */
      get pixelHeight() {
        return this.height * this.tileset.tileHeight * this.scale;
      }
      /**
       * Convert world position to tile position.
       * @param {number} worldX 
       * @param {number} worldY 
       * @returns {{ x: number, y: number }}
       */
      worldToTile(worldX, worldY) {
        return {
          x: Math.floor(worldX / (this.tileset.tileWidth * this.scale)),
          y: Math.floor(worldY / (this.tileset.tileHeight * this.scale))
        };
      }
      /**
       * Check if a tile is solid (non-empty).
       * @param {number} x 
       * @param {number} y 
       * @returns {boolean}
       */
      isSolid(x, y) {
        const tileId = this.getTile(x, y);
        const collision = this.getResolvedMetadata(x, y)?.collision;
        return tileId >= 0 ? collision !== false : collision === true;
      }
      /**
       * Draw the tilemap.
       * @param {CanvasRenderingContext2D} ctx 
       * @param {number} offsetX - Camera offset X.
       * @param {number} offsetY - Camera offset Y.
       */
      draw(ctx2, offsetX = 0, offsetY = 0) {
        this.#drawTiles(ctx2, offsetX, offsetY);
        const visited = /* @__PURE__ */ new Set([this]);
        const layers = [...this.layers].sort((a, b) => a.renderOrder - b.renderOrder);
        const drawLayer = (tilemap) => {
          if (visited.has(tilemap)) return;
          visited.add(tilemap);
          tilemap.#drawTiles(ctx2, offsetX, offsetY);
          for (const layer of [...tilemap.layers].sort((a, b) => a.renderOrder - b.renderOrder)) {
            drawLayer(layer.tilemap);
          }
        };
        for (const layer of layers) drawLayer(layer.tilemap);
      }
      #drawTiles(ctx2, offsetX, offsetY) {
        const tw = this.tileset.tileWidth * this.scale;
        const th = this.tileset.tileHeight * this.scale;
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const tileId = this.data[y * this.width + x];
            if (tileId >= 0) {
              this.tileset.drawTile(
                ctx2,
                tileId,
                x * tw - offsetX,
                y * th - offsetY,
                this.scale
              );
            }
          }
        }
      }
    };
  }
});

// src/components/spawnPoint.js
var SpawnPoint;
var init_spawnPoint = __esm({
  "src/components/spawnPoint.js"() {
    init_component();
    SpawnPoint = class extends Component {
      constructor(entity = null) {
        super(entity);
        this._properties = { spawnId: "start", facing: "right" };
      }
    };
  }
});

// src/components/sceneTransition.js
function findSpawnPoint(scene, spawnId) {
  const pending = [...scene.children];
  while (pending.length > 0) {
    const entity = pending.shift();
    const spawnPoint = entity.components.find((component) => component instanceof SpawnPoint && component.properties.spawnId === spawnId);
    if (spawnPoint) return entity;
    pending.unshift(...entity.children);
  }
  return null;
}
var SPAWN_FACING_ROTATION, SceneTransition;
var init_sceneTransition = __esm({
  "src/components/sceneTransition.js"() {
    init_component();
    init_sceneManager();
    init_spawnPoint();
    init_transform();
    init_vec2();
    SPAWN_FACING_ROTATION = Object.freeze({
      right: 0,
      down: Math.PI / 2,
      left: Math.PI,
      up: -Math.PI / 2
    });
    SceneTransition = class extends Component {
      constructor(entity = null) {
        super(entity);
        this._properties = { targetScene: "", spawnPoint: "", trigger: "enter" };
        this._pendingActor = null;
        this._pendingTransition = null;
        this._unbindTrigger = null;
        this.lastActivation = null;
        this.lastError = null;
      }
      destroy() {
        this._unbindTrigger?.();
        this._unbindTrigger = null;
        super.destroy();
      }
      /** Bind enter-mode activation to the authored TriggerCollider's overlap events. */
      bindTrigger(collider) {
        if (!collider || collider.role !== "trigger" || typeof collider.on !== "function") return false;
        this._unbindTrigger?.();
        this._unbindTrigger = collider.on("enter", (payload) => {
          this.lastActivation = this.OnTriggerEnter(payload.otherEntity).catch((error) => {
            this.lastError = error;
            return false;
          });
        });
        return true;
      }
      /** Activate an enter-mode transition for the entity that entered its trigger. */
      OnTriggerEnter(actor) {
        if (this.properties.trigger !== "enter") return Promise.resolve(false);
        return this.#transitionActor(actor);
      }
      /** Activate an interact-mode transition from a gameplay interaction/input handler. */
      Interact(actor) {
        if (this.properties.trigger !== "interact") return Promise.resolve(false);
        return this.#transitionActor(actor);
      }
      #transitionActor(actor) {
        if (!actor || typeof actor.GetComponent !== "function" || !Array.isArray(actor.children)) return Promise.resolve(false);
        if (this._pendingTransition) {
          return this._pendingActor === actor ? this._pendingTransition : Promise.resolve(false);
        }
        this.lastError = null;
        const transition = this.#loadAndTransfer(actor).finally(() => {
          this._pendingActor = null;
          this._pendingTransition = null;
        });
        this._pendingActor = actor;
        this._pendingTransition = transition;
        return transition;
      }
      async #loadAndTransfer(actor) {
        const targetScene = this.properties.targetScene;
        if (typeof targetScene !== "string" || targetScene.trim() === "") return false;
        const { SceneLoader: SceneLoader2 } = await Promise.resolve().then(() => (init_sceneLoader(), sceneLoader_exports));
        const destination = await SceneLoader2.load(targetScene);
        if (!destination) return false;
        const source = SceneManager.GetActiveScene();
        const previousParent = actor.parent ?? null;
        const actorTransform = actor.GetComponent(Transform);
        const previousPosition = actorTransform ? new Vector2(actorTransform.position.x, actorTransform.position.y) : null;
        const previousRotation = actorTransform?.rotation;
        let committed = false;
        try {
          const spawnId = this.properties.spawnPoint;
          let spawnEntity = null;
          let spawnTransform = null;
          if (typeof spawnId === "string" && spawnId !== "") {
            spawnEntity = findSpawnPoint(destination, spawnId);
            spawnTransform = spawnEntity?.GetComponent(Transform) ?? null;
            if (!spawnTransform) return false;
          }
          if (spawnTransform && !actorTransform) return false;
          if (spawnTransform) {
            actorTransform.position = new Vector2(spawnTransform.position.x, spawnTransform.position.y);
            const spawnPoint = spawnEntity.components.find((component) => component instanceof SpawnPoint);
            const rotation = SPAWN_FACING_ROTATION[spawnPoint?.properties.facing];
            if (rotation !== void 0) actorTransform.rotation = rotation;
          }
          if (!SceneManager.TransitionToScene(destination.id, [actor])) return false;
          committed = true;
          return true;
        } finally {
          if (!committed) {
            if (SceneManager.GetActiveScene() === destination && source) {
              try {
                SceneManager.LoadScene(source.id);
              } catch (error) {
                this.lastError ??= error;
              }
            }
            if (actorTransform && previousPosition) {
              actorTransform.position = previousPosition;
              actorTransform.rotation = previousRotation;
            }
            if (actor.parent !== previousParent) {
              const currentParent = actor.parent;
              if (currentParent && Array.isArray(currentParent.children)) {
                const actorIndex = currentParent.children.indexOf(actor);
                if (actorIndex !== -1) currentParent.children.splice(actorIndex, 1);
              }
              if (previousParent && Array.isArray(previousParent.children)) {
                previousParent.AddChild(actor);
              } else {
                actor.parent = previousParent;
              }
            }
            try {
              SceneManager.removeScene(destination);
            } catch (error) {
              this.lastError ??= error;
            }
          }
        }
      }
    };
  }
});

// src/core/sceneLoader.js
var sceneLoader_exports = {};
__export(sceneLoader_exports, {
  ResourceReferenceError: () => ResourceReferenceError,
  SCENE_SCHEMA_VERSION: () => SCENE_SCHEMA_VERSION,
  SceneLoader: () => SceneLoader,
  assertResourceReference: () => assertResourceReference,
  validateSceneResourceReferences: () => validateSceneResourceReferences
});
var SceneLoader;
var init_sceneLoader = __esm({
  "src/core/sceneLoader.js"() {
    init_scene();
    init_entity();
    init_sceneManager();
    init_componentRegistry();
    init_vec2();
    init_sprite();
    init_tileset();
    init_tilemap();
    init_sceneTransition();
    init_authoredUi();
    SceneLoader = class _SceneLoader {
      static #assertSupportedVersion(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new TypeError("Scene data must be a JSON object.");
        }
        if (data.type && data.type !== "scene") {
          throw new Error(`Cannot load '${data.type}' as a scene. Expected a scene payload.`);
        }
        const schemaVersion = typeof data.schemaVersion === "string" ? Number.parseInt(data.schemaVersion.split(".")[0], 10) : data.schemaVersion;
        const legacyVersion = data.version;
        const parsedLegacyVersion = typeof legacyVersion === "number" ? legacyVersion : typeof legacyVersion === "string" ? Number.parseInt(legacyVersion.split(".")[0], 10) : null;
        const version = schemaVersion ?? parsedLegacyVersion;
        if (version !== null && version !== void 0 && version !== SCENE_SCHEMA_VERSION) {
          throw new Error(`Unsupported scene schema version '${schemaVersion ?? legacyVersion}'. Supported version is ${SCENE_SCHEMA_VERSION}. Migrate the scene before loading it.`);
        }
      }
      /**
       * Loads a scene from a JSON file.
       * @param {string} path - The path to the .scn file.
       * @returns {Promise<Scene>} The loaded scene.
       */
      static async load(path) {
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load scene: ${path} (${response.status})`);
          }
          const json = await response.json();
          return _SceneLoader.parse(json);
        } catch (error) {
          console.error("SceneLoader:", error);
          throw error;
        }
      }
      /**
       * Parses a scene JSON object and creates the Scene.
       * @param {object} data - The scene JSON data.
       * @returns {Scene} The instantiated scene.
       */
      /**
       * Parses a scene JSON object and creates the Scene.
       * @param {object} data - The scene JSON data.
       * @returns {Promise<Scene>} The instantiated scene.
       */
      static parse(data) {
        _SceneLoader.validate(data);
        const sceneName = data.name || "Untitled Scene";
        const scene = new Scene(sceneName);
        if (data.id !== void 0 && data.id !== null) scene.id = data.id;
        scene.ui = validateAuthoredUI(data.ui);
        try {
          if (data.camera) {
            scene.cameraSettings = data.camera;
          }
          const pendingLoads = [];
          if (Array.isArray(data.layers)) {
            for (const layerData of data.layers) {
              const pending = _SceneLoader.#parseLayer(layerData, scene);
              if (pending && typeof pending.then === "function") pendingLoads.push(pending);
            }
          }
          if (Array.isArray(data.entities)) {
            data.entities.forEach((entityData) => scene.AddChild(_SceneLoader.#parseEntity(entityData)));
          }
          if (pendingLoads.length > 0) {
            return Promise.all(pendingLoads).then(
              () => scene,
              (error) => {
                SceneManager.removeScene(scene);
                throw error;
              }
            );
          }
          return scene;
        } catch (error) {
          SceneManager.removeScene(scene);
          throw error;
        }
      }
      /** Validate a scene payload without constructing or registering a Scene. */
      static validate(data) {
        _SceneLoader.#assertSupportedVersion(data);
        if (data.ui !== void 0) validateAuthoredUI(data.ui);
        return validateSceneResourceReferences(data);
      }
      /**
       * Parses a layer definition.
       * @private
       */
      static #parseLayer(layerData, scene) {
        if (!layerData || typeof layerData !== "object" || Array.isArray(layerData)) {
          throw new TypeError("Invalid scene layer definition. Expected an object with a type and source location.");
        }
        if (layerData.type === "object_layer" || layerData.type === "main" || layerData.type === "parallax") {
          const parent = layerData.root ? scene : new Entity(layerData.name || layerData.type);
          if (layerData.id && parent !== scene) parent.id = layerData.id;
          if (Array.isArray(layerData.entities)) {
            layerData.entities.forEach((entityData) => {
              const entity = _SceneLoader.#parseEntity(entityData);
              parent.AddChild(entity);
            });
          }
          if (parent !== scene) scene.AddChild(parent);
        } else if (layerData.type === "tilemap") {
          return _SceneLoader.#loadTilemap(
            getResourceReferenceTarget(layerData.src, "tilemap", "scene.layers[].src"),
            scene,
            layerData.src
          );
        }
        return null;
      }
      static async #loadTilemap(path, scene, sourceReference = path) {
        const res = await fetch(path);
        if (!res.ok) {
          throw new Error(`Failed to load tilemap '${path}' (${res.status}). Source reference: ${path}.`);
        }
        const map = await res.json();
        if (!map || typeof map !== "object" || Array.isArray(map)) {
          throw new TypeError(`Invalid tilemap '${path}': expected a JSON object. Source reference: ${path}.`);
        }
        if (!Array.isArray(map.data)) {
          throw new ResourceReferenceError("tilemap", sourceReference, `${path}.data`, "tilemap data is missing or not an array", "a tilemap object with a numeric data array");
        }
        if (!Number.isInteger(map.width) || map.width <= 0) {
          throw new ResourceReferenceError("tilemap", sourceReference, `${path}.width`, "tilemap width must be a positive integer", "a tilemap object with a positive integer width");
        }
        const data = map.data;
        const cols = map.width;
        const tileSize = map.tileSize === void 0 ? 64 : map.tileSize;
        const tileset = map.tileset;
        assertResourceReference(tileset, "tileset", `${path}.tileset`);
        if (!Number.isFinite(tileSize) || tileSize <= 0) {
          throw new ResourceReferenceError("tileset", tileset, `${path}.tileSize`, "tile size must be a positive number", "a tileset with a positive tileSize");
        }
        const texCols = map.columns === void 0 ? 10 : map.columns;
        if (!Number.isInteger(texCols) || texCols <= 0) {
          throw new ResourceReferenceError("tileset", tileset, `${path}.columns`, "tileset columns must be a positive integer", "a tileset with positive integer columns");
        }
        if (map.height !== void 0 && (!Number.isInteger(map.height) || map.height <= 0 || data.length !== cols * map.height)) {
          throw new ResourceReferenceError("tilemap", sourceReference, `${path}.data`, "tilemap data length does not match its dimensions", "a tilemap data array sized to width and height");
        }
        const height = map.height ?? Math.ceil(data.length / cols);
        const navigationMap = new Tilemap(new Tileset(tileset, tileSize, tileSize), cols, height);
        navigationMap.data = Array.from({ length: cols * height }, (_, index) => {
          const tileId = data[index] ?? 0;
          return tileId === 0 ? -1 : tileId - 1;
        });
        if (map.metadata !== void 0) {
          if (!map.metadata || typeof map.metadata !== "object" || Array.isArray(map.metadata)) {
            throw new ResourceReferenceError("tilemap", sourceReference, `${path}.metadata`, "tile metadata must be an object", "an object keyed by editor tile ID");
          }
          for (const [editorId, metadata] of Object.entries(map.metadata)) {
            const numericId = Number(editorId);
            if (!Number.isInteger(numericId) || numericId < 1) {
              throw new ResourceReferenceError("tilemap", sourceReference, `${path}.metadata.${editorId}`, "tile metadata key must be a positive editor tile ID", "a positive integer tile ID");
            }
            navigationMap.setTileMetadata(numericId - 1, metadata);
          }
        }
        if (map.cellMetadata !== void 0) {
          if (!map.cellMetadata || typeof map.cellMetadata !== "object" || Array.isArray(map.cellMetadata)) {
            throw new ResourceReferenceError("tilemap", sourceReference, `${path}.cellMetadata`, "cell metadata must be an object", "an object keyed by row-major cell index");
          }
          for (const [cellIndex, metadata] of Object.entries(map.cellMetadata)) {
            const numericIndex = Number(cellIndex);
            if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= cols * height) {
              throw new ResourceReferenceError("tilemap", sourceReference, `${path}.cellMetadata.${cellIndex}`, "cell metadata key is outside the map", "a valid row-major cell index");
            }
            if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
              throw new ResourceReferenceError("tilemap", sourceReference, `${path}.cellMetadata[${numericIndex}]`, "cell metadata must be an object", "an object of cell metadata");
            }
            navigationMap.setCellMetadata(numericIndex % cols, Math.floor(numericIndex / cols), metadata);
          }
        }
        scene.navigationTilemaps.set(path, navigationMap);
        for (let i = 0; i < data.length; i++) {
          const tileId = data[i];
          if (!Number.isInteger(tileId) || tileId < 0) {
            throw new ResourceReferenceError("tileset", tileset, `${path}.data[${i}]`, "tile id must be a non-negative integer", "a tileset tile id");
          }
          if (tileId === 0) {
            const cellMetadata2 = map.cellMetadata?.[i];
            if (cellMetadata2 === void 0) continue;
            if (!cellMetadata2 || typeof cellMetadata2 !== "object" || Array.isArray(cellMetadata2)) {
              throw new ResourceReferenceError("tilemap", sourceReference, `${path}.cellMetadata[${i}]`, "cell metadata must be an object", "an object of cell metadata");
            }
            const emptyCell = new Entity("TileCell_" + i);
            emptyCell.tileId = 0;
            emptyCell.tileMetadata = structuredClone(cellMetadata2);
            const emptyCellTransform = ComponentRegistry.create("Transform");
            emptyCellTransform.position = new Vector2(i % cols + 0.5, Math.floor(i / cols) + 0.5);
            emptyCell.AddComponent(emptyCellTransform);
            if (cellMetadata2.collision === true) {
              const collider = ComponentRegistry.create("BoxCollider");
              collider.size = new Vector2(1, 1);
              emptyCell.AddComponent(collider);
            }
            scene.AddChild(emptyCell);
            continue;
          }
          const gx = i % cols;
          const gy = Math.floor(i / cols);
          const x = gx + 0.5;
          const y = gy + 0.5;
          const entity = new Entity("Tile_" + i);
          const tileMetadata = map.metadata?.[tileId];
          const cellMetadata = map.cellMetadata?.[i];
          const resolvedTileMetadata = tileMetadata || cellMetadata ? { ...tileMetadata || {}, ...cellMetadata || {} } : null;
          if (resolvedTileMetadata && typeof resolvedTileMetadata === "object" && !Array.isArray(resolvedTileMetadata)) {
            entity.tileId = tileId;
            entity.tileMetadata = structuredClone(resolvedTileMetadata);
          }
          const t = ComponentRegistry.create("Transform");
          t.position = new Vector2(x, y);
          entity.AddComponent(t);
          const tid = tileId - 1;
          const tx = tid % texCols * tileSize;
          const ty = Math.floor(tid / texCols) * tileSize;
          const sprite = ComponentRegistry.create("Sprite", tileset);
          sprite.width = 1;
          sprite.height = 1;
          sprite.deserialize({
            path: tileset,
            width: 1,
            height: 1,
            sourceRect: { x: tx, y: ty, width: tileSize, height: tileSize }
          });
          entity.AddComponent(sprite);
          if ((cellMetadata?.collision ?? tileMetadata?.collision) !== false) {
            const collider = ComponentRegistry.create("BoxCollider");
            collider.size = new Vector2(1, 1);
            entity.AddComponent(collider);
          }
          scene.AddChild(entity);
        }
      }
      /**
       * Parses an entity definition.
       * @private
       */
      static #parseEntity(entityData) {
        if (!entityData || typeof entityData !== "object" || Array.isArray(entityData)) {
          throw new Error("Invalid entity definition in scene data. Expected an entity object.");
        }
        const entity = new Entity(entityData.name || "Entity");
        if (entityData.id) entity.id = entityData.id;
        if (typeof entityData.type === "string") entity.type = entityData.type;
        if (entityData.active === false) entity.active = false;
        const transformType = ComponentRegistry.get("Transform");
        let hasTransform = false;
        if (entityData.transform && transformType) {
          const transform = ComponentRegistry.create("Transform");
          _SceneLoader.#deserializeTransform(transform, entityData.transform);
          entity.AddComponent(transform);
          hasTransform = true;
        }
        if (Array.isArray(entityData.components)) {
          entityData.components.forEach((compData) => {
            if (!compData || typeof compData !== "object" || typeof compData.type !== "string") {
              throw new Error(`Invalid component definition on entity '${entity.name}'. Expected a type and props object.`);
            }
            const componentProps = compData.props;
            const component = compData.type.toLowerCase() === "sprite" ? ComponentRegistry.create(compData.type, componentProps?.path ?? componentProps?.texture ?? componentProps?.asset ?? componentProps?.reference) : ComponentRegistry.create(compData.type);
            if (!component) {
              console.warn(`SceneLoader: Unknown component type '${compData.type}' for entity '${entity.name}'`);
            } else if (compData.type === "Transform") {
              if (!hasTransform) {
                _SceneLoader.#deserializeTransform(component, compData.props);
                if (compData.id) component.id = compData.id;
                entity.AddComponent(component);
                hasTransform = true;
              }
            } else {
              if (typeof component.deserialize === "function") component.deserialize(compData.props);
              if (compData.id) component.id = compData.id;
              entity.AddComponent(component);
            }
          });
        }
        const transition = entity.components.find((component) => component instanceof SceneTransition);
        const triggerCollider = entity.components.find((component) => component.role === "trigger");
        if (transition && triggerCollider) transition.bindTrigger(triggerCollider);
        if (Array.isArray(entityData.children)) {
          entityData.children.forEach((childData) => {
            const child = _SceneLoader.#parseEntity(childData);
            entity.AddChild(child);
          });
        }
        return entity;
      }
      static #deserializeTransform(transform, data) {
        if (!data) return;
        const position = data.position || data.pos;
        const rotation = data.rotation ?? data.rot;
        if (position) transform.position = new Vector2(position.x, position.y);
        if (rotation !== void 0) transform.rotation = rotation;
        if (data.scale) transform.scale = new Vector2(data.scale.x, data.scale.y);
      }
    };
  }
});

// src/core/sceneManager.js
var SceneManager;
var init_sceneManager = __esm({
  "src/core/sceneManager.js"() {
    init_scene();
    init_storage();
    SceneManager = class _SceneManager {
      /** @private */
      static #scenes = [];
      /** @private */
      static #loadedScenes = [];
      /** @private */
      static #currentSceneIndex = -1;
      /** @private */
      static #nextSceneId = 0;
      /**
       * Get a scene by id.
       * @param {number} id - Id of the scene.
       * @returns {Scene} The scene with the specified id.
       */
      static GetScene(id) {
        return _SceneManager.#scenes.find((scene) => scene.id === id);
      }
      /**
       * Get a scene by name.
       * @param {string} name - Name of the scene.
       * @returns {Scene} The scene with the specified name.
       */
      static GetSceneByName(name) {
        return _SceneManager.#scenes.find((scene) => scene.name === name);
      }
      /** Return a snapshot of all registered scenes for project serialization. */
      static GetScenes() {
        return [..._SceneManager.#scenes];
      }
      /** Whether a scene participates in the current main/additive runtime pass. */
      static isSceneLoaded(scene) {
        return _SceneManager.#loadedScenes.includes(scene);
      }
      /** Remove a registered scene that is not currently active. */
      static removeScene(scene) {
        const index = _SceneManager.#scenes.indexOf(scene);
        if (index === -1 || _SceneManager.GetActiveScene() === scene) return false;
        if (_SceneManager.#loadedScenes.includes(scene)) scene.OnSceneUnloadAdditive();
        _SceneManager.#loadedScenes = _SceneManager.#loadedScenes.filter((loadedScene) => loadedScene !== scene);
        _SceneManager.#scenes.splice(index, 1);
        return true;
      }
      /**
       * Get the currently active scene.
       * @returns {Scene} The active scene.
       */
      static GetActiveScene() {
        return _SceneManager.GetScene(_SceneManager.#currentSceneIndex);
      }
      /**
       * Load a scene by id. This will unload the current scene and load the new scene.
       * @param {number} id - Id of the scene to be loaded.
       * @method
       */
      static LoadScene(id) {
        const scene = _SceneManager.GetScene(id);
        if (scene) {
          _SceneManager.#unloadScene(_SceneManager.#currentSceneIndex);
          scene.OnSceneUnloadAdditive();
          scene.OnSceneLoad();
          _SceneManager.#loadedScenes.push(scene);
          _SceneManager.#currentSceneIndex = id;
        }
      }
      /**
       * Transition to another scene while moving selected runtime entities into it.
       * Entity instances are transferred rather than serialized so their runtime state survives.
       * @param {number} id - Id of the destination scene.
       * @param {Entity[]} entities - Entities to preserve across the transition.
       */
      static TransitionToScene(id, entities = []) {
        const destination = _SceneManager.GetScene(id);
        if (!destination) return false;
        if (!Array.isArray(entities)) {
          throw new TypeError("SceneManager.TransitionToScene expects an array of entities.");
        }
        const source = _SceneManager.GetActiveScene();
        for (const entity of entities) {
          if (!entity || typeof entity !== "object" || !Array.isArray(entity.children)) {
            throw new TypeError("SceneManager.TransitionToScene expects entity instances.");
          }
        }
        for (const entity of entities) {
          if (entity.parent && Array.isArray(entity.parent.children)) {
            const index = entity.parent.children.indexOf(entity);
            if (index !== -1) entity.parent.children.splice(index, 1);
          } else if (source) {
            const index = source.children.indexOf(entity);
            if (index !== -1) source.children.splice(index, 1);
          }
          entity.parent = null;
          destination.AddChild(entity);
        }
        _SceneManager.LoadScene(id);
        return true;
      }
      /**
       * Load a new scene in additive mode. This will not unload the current scene.
       * @param {number} id - Id of the scene to be loaded.
       * @method
       */
      static LoadSceneAdditive(id) {
        const scene = _SceneManager.GetScene(id);
        if (scene) {
          scene.OnSceneLoadAdditive();
          _SceneManager.#loadedScenes.push(scene);
        }
      }
      /**
       * Unload all added scenes. This will not unload the current scene.
       * @method
       */
      static UnloadAllAdditiveScenes() {
        _SceneManager.#loadedScenes.forEach((scene) => {
          scene.OnSceneUnloadAdditive();
        });
        _SceneManager.#loadedScenes = [];
      }
      /**
       * Initialize the SceneManager. Loads the first scene if not already loaded.
       * @method
       * @private
       */
      static init() {
        if (_SceneManager.#scenes.length === 0) {
          console.error("No scenes added to SceneManager");
          return;
        }
        if (_SceneManager.#currentSceneIndex === -1) {
          _SceneManager.LoadScene(_SceneManager.#scenes[0].id);
        }
      }
      /**
       * Add a scene to the SceneManager.
       * @param {Scene} scene - The scene to be added.
       * @private
       */
      static addScene(scene) {
        if (_SceneManager.#scenes.indexOf(scene) === -1) {
          scene.id = _SceneManager.getIdForNewScene();
          _SceneManager.#nextSceneId = scene.id + 1;
          _SceneManager.#scenes.push(scene);
        }
      }
      /**
       * Replace stale registrations that share a parsed scene's persisted ID.
       * SceneLoader constructs and registers a Scene before restoring its ID from
       * serialized data, so loading an edited scene again can otherwise leave
       * duplicate IDs and make GetScene select the older instance.
       * @param {Scene} scene - The parsed replacement scene.
       * @returns {Scene} The registered replacement scene.
       */
      static replaceScene(scene) {
        if (!scene || typeof scene !== "object") {
          throw new TypeError("SceneManager.replaceScene expects a Scene instance.");
        }
        if (!_SceneManager.#scenes.includes(scene)) {
          _SceneManager.addScene(scene);
        }
        const duplicates = _SceneManager.#scenes.filter((candidate) => candidate !== scene && candidate.id === scene.id);
        if (duplicates.length === 0) return scene;
        const activeScene = _SceneManager.GetActiveScene();
        const replacesActiveScene = duplicates.includes(activeScene);
        for (const duplicate of duplicates) {
          if (!_SceneManager.#loadedScenes.includes(duplicate)) continue;
          if (duplicate === activeScene) duplicate.OnSceneUnload();
          else duplicate.OnSceneUnloadAdditive();
        }
        const firstDuplicateIndex = _SceneManager.#scenes.findIndex((candidate) => duplicates.includes(candidate));
        const insertionIndex = _SceneManager.#scenes.slice(0, firstDuplicateIndex).filter((candidate) => !duplicates.includes(candidate) && candidate !== scene).length;
        _SceneManager.#loadedScenes = _SceneManager.#loadedScenes.filter((candidate) => !duplicates.includes(candidate));
        _SceneManager.#scenes = _SceneManager.#scenes.filter((candidate) => !duplicates.includes(candidate) && candidate !== scene);
        _SceneManager.#scenes.splice(insertionIndex, 0, scene);
        if (replacesActiveScene) _SceneManager.#currentSceneIndex = -1;
        return scene;
      }
      /**
       * Unload a scene by its id.
       * @param {number} id - Id of the scene to be unloaded.
       * @private
       */
      static #unloadScene(id) {
        const scene = _SceneManager.GetScene(id);
        if (scene) {
          scene.OnSceneUnload();
          _SceneManager.#loadedScenes = _SceneManager.#loadedScenes.filter((s) => s !== scene);
        }
      }
      /**
       * Draw all loaded scenes.
       * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
       * @private
       */
      static draw(ctx2) {
        _SceneManager.#loadedScenes.forEach((scene) => {
          scene.draw(ctx2);
        });
      }
      /**
       * Get a id for a new Scene
       * @returns {number} The id for a new scene.
       * @private
       */
      static getIdForNewScene() {
        while (_SceneManager.#scenes.some((scene) => scene.id === _SceneManager.#nextSceneId)) {
          _SceneManager.#nextSceneId++;
        }
        return _SceneManager.#nextSceneId;
      }
      /** Build a versioned project payload from the currently registered scenes. */
      static SerializeProject(name = "Untitled Project", metadata = {}) {
        return Storage.SerializeProject({
          ...metadata,
          name,
          scenes: _SceneManager.#scenes
        });
      }
      static SaveProject(key, name = "Untitled Project", persistent = false, metadata = {}) {
        const project = typeof name === "object" ? name : _SceneManager.SerializeProject(name, metadata);
        return Storage.SaveProject(key, project, persistent);
      }
      /** Close the in-memory project without touching persisted data. */
      static CloseProject() {
        _SceneManager.removeAllScenes();
      }
      /**
       * Reopen a saved project. Parsing is dynamic to retain the existing
       * SceneLoader -> SceneManager dependency without introducing a module cycle.
       */
      static async OpenProject(key) {
        const project = Storage.LoadProject(key);
        if (project === null) return null;
        const { SceneLoader: SceneLoader2 } = await Promise.resolve().then(() => (init_sceneLoader(), sceneLoader_exports));
        const scenes = [];
        try {
          for (const sceneData of project.scenes) {
            scenes.push(await SceneLoader2.parse(sceneData));
          }
        } catch (error) {
          for (const scene of scenes.reverse()) {
            _SceneManager.removeScene(scene);
          }
          throw error;
        }
        _SceneManager.#scenes = [...scenes];
        _SceneManager.#loadedScenes = [];
        _SceneManager.#currentSceneIndex = -1;
        _SceneManager.#nextSceneId = 0;
        return { ...project, scenes };
      }
      static serializeProject(...args) {
        return _SceneManager.SerializeProject(...args);
      }
      static saveProject(...args) {
        return _SceneManager.SaveProject(...args);
      }
      static closeProject(...args) {
        return _SceneManager.CloseProject(...args);
      }
      static openProject(...args) {
        return _SceneManager.OpenProject(...args);
      }
      /**@private */
      static removeAllScenes() {
        _SceneManager.#scenes = [];
        _SceneManager.#loadedScenes = [];
        _SceneManager.#currentSceneIndex = -1;
        _SceneManager.#nextSceneId = 0;
      }
    };
  }
});

// src/rendering/color.js
var Color = class _Color {
  constructor(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  /**
   * Generate Color from A Hexadecimal string.
   * @param {number} hex=0x000000 - The hex value of the color.
   * @returns  {Color} The color.
   */
  static FromHex(hex = 0) {
    let r = hex >> 16 & 255;
    let g = hex >> 8 & 255;
    let b = hex & 255;
    return new _Color(r, g, b, 1);
  }
  /**
   * Generate a color from RGB values.
   * @param {number} r - Red value of the color.
   * @param {number} g - Green value of the color.
   * @param {number} b - Blue value of the color.
   * @returns {Color} The color.
   */
  static FromRGB(r, g, b) {
    return new _Color(r, g, b, 1);
  }
  /**
   * Generate a color from RGBA values.
   * @param {number} r - Red value of the color.
   * @param {number} g - Green value of the color.
   * @param {number} b - Blue value of the color.
   * @param {number} a - Blue value of the color.
   * @returns {Color} The color.
   */
  static FromRGBA(r, g, b, a) {
    return new _Color(r, g, b, a);
  }
  /**
   * Generate a color from HSL values.
   * @param {number} h - Hue value of the color.
   * @param {number} s - Saturation value of the color.
   * @param {number} l - Lightness value of the color.
   * @returns {Color} The color.
   * @see https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
   */
  static FromHSL(h, s, l) {
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs(h / 60 % 2 - 1));
    let m = l - c / 2;
    let r, g, b;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    return new _Color(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), 1);
  }
  /**
   * Generate a Random Color.
   * @returns {Color} The color.
   */
  static Random() {
    return new _Color(Math.random() * 255, Math.random() * 255, Math.random() * 255, 1);
  }
  /**
   * Convert the color into RGB javascript string. 
   * `rgba(r,g,b,a)` or `rgb(r,g,b)`.
   * @returns {string} The color in RGB format.
   * 
   */
  toString() {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }
};
Color.aliceblue = Color.FromHex(15792383);
Color.antiquewhite = Color.FromHex(16444375);
Color.aqua = Color.FromHex(65535);
Color.aquamarine = Color.FromHex(8388564);
Color.azure = Color.FromHex(15794175);
Color.beige = Color.FromHex(16119260);
Color.bisque = Color.FromHex(16770244);
Color.black = Color.FromHex(0);
Color.blanchedalmond = Color.FromHex(16772045);
Color.blue = Color.FromHex(255);
Color.blueviolet = Color.FromHex(9055202);
Color.brown = Color.FromHex(10824234);
Color.burlywood = Color.FromHex(14596231);
Color.cadetblue = Color.FromHex(6266528);
Color.chartreuse = Color.FromHex(8388352);
Color.chocolate = Color.FromHex(13789470);
Color.coral = Color.FromHex(16744272);
Color.cornflowerblue = Color.FromHex(6591981);
Color.cornsilk = Color.FromHex(16775388);
Color.crimson = Color.FromHex(14423100);
Color.cyan = Color.FromHex(65535);
Color.darkblue = Color.FromHex(139);
Color.darkcyan = Color.FromHex(35723);
Color.darkgoldenrod = Color.FromHex(12092939);
Color.darkgray = Color.FromHex(11119017);
Color.darkgreen = Color.FromHex(25600);
Color.darkgrey = Color.FromHex(11119017);
Color.darkkhaki = Color.FromHex(12433259);
Color.darkmagenta = Color.FromHex(9109643);
Color.darkolivegreen = Color.FromHex(5597999);
Color.darkorange = Color.FromHex(16747520);
Color.darkorchid = Color.FromHex(10040012);
Color.darkred = Color.FromHex(9109504);
Color.darksalmon = Color.FromHex(15308410);
Color.darkseagreen = Color.FromHex(9419919);
Color.darkslateblue = Color.FromHex(4734347);
Color.darkslategray = Color.FromHex(3100495);
Color.darkslategrey = Color.FromHex(3100495);
Color.darkturquoise = Color.FromHex(52945);
Color.darkviolet = Color.FromHex(9699539);
Color.deeppink = Color.FromHex(16716947);
Color.deepskyblue = Color.FromHex(49151);
Color.dimgray = Color.FromHex(6908265);
Color.dimgrey = Color.FromHex(6908265);
Color.dodgerblue = Color.FromHex(2003199);
Color.firebrick = Color.FromHex(11674146);
Color.floralwhite = Color.FromHex(16775920);
Color.forestgreen = Color.FromHex(2263842);
Color.fuchsia = Color.FromHex(16711935);
Color.gainsboro = Color.FromHex(14474460);
Color.ghostwhite = Color.FromHex(16316671);
Color.gold = Color.FromHex(16766720);
Color.goldenrod = Color.FromHex(14329120);
Color.gray = Color.FromHex(8421504);
Color.green = Color.FromHex(32768);
Color.greenyellow = Color.FromHex(11403055);
Color.grey = Color.FromHex(8421504);
Color.honeydew = Color.FromHex(15794160);
Color.hotpink = Color.FromHex(16738740);
Color.indianred = Color.FromHex(13458524);
Color.indigo = Color.FromHex(4915330);
Color.ivory = Color.FromHex(16777200);
Color.khaki = Color.FromHex(15787660);
Color.lavender = Color.FromHex(15132410);
Color.lavenderblush = Color.FromHex(16773365);
Color.lawngreen = Color.FromHex(8190976);
Color.lemonchiffon = Color.FromHex(16775885);
Color.lightblue = Color.FromHex(11393254);
Color.lightcoral = Color.FromHex(15761536);
Color.lightcyan = Color.FromHex(14745599);
Color.lightgoldenrodyellow = Color.FromHex(16448210);
Color.lightgray = Color.FromHex(13882323);
Color.lightgreen = Color.FromHex(9498256);
Color.lightgrey = Color.FromHex(13882323);
Color.lightpink = Color.FromHex(16758465);
Color.lightsalmon = Color.FromHex(16752762);
Color.lightseagreen = Color.FromHex(2142890);
Color.lightskyblue = Color.FromHex(8900346);
Color.lightslategray = Color.FromHex(7833753);
Color.lightsteelblue = Color.FromHex(11584734);
Color.lightyellow = Color.FromHex(16777184);
Color.lime = Color.FromHex(65280);
Color.limegreen = Color.FromHex(3329330);
Color.linen = Color.FromHex(16445670);
Color.magenta = Color.FromHex(16711935);
Color.maroon = Color.FromHex(8388608);
Color.mediumaquamarine = Color.FromHex(6737322);
Color.mediumblue = Color.FromHex(205);
Color.mediumorchid = Color.FromHex(12211667);
Color.mediumpurple = Color.FromHex(9662683);
Color.mediumseagreen = Color.FromHex(3978097);
Color.mediumslateblue = Color.FromHex(8087790);
Color.mediumspringgreen = Color.FromHex(64154);
Color.mediumturquoise = Color.FromHex(4772300);
Color.mediumvioletred = Color.FromHex(13047173);
Color.midnightblue = Color.FromHex(1644912);
Color.mintcream = Color.FromHex(16121850);
Color.mistyrose = Color.FromHex(16770273);
Color.moccasin = Color.FromHex(16770229);
Color.navajowhite = Color.FromHex(16768685);
Color.navy = Color.FromHex(128);
Color.oldlace = Color.FromHex(16643558);
Color.olive = Color.FromHex(8421376);
Color.olivedrab = Color.FromHex(7048739);
Color.orange = Color.FromHex(16753920);
Color.orangered = Color.FromHex(16729344);
Color.orchid = Color.FromHex(14315734);
Color.palegoldenrod = Color.FromHex(15657130);
Color.palegreen = Color.FromHex(10025880);
Color.paleturquoise = Color.FromHex(11529966);
Color.palevioletred = Color.FromHex(14381203);
Color.papayawhip = Color.FromHex(16773077);
Color.peachpuff = Color.FromHex(16767673);
Color.peru = Color.FromHex(13468991);
Color.pink = Color.FromHex(16761035);
Color.plum = Color.FromHex(14524637);
Color.powderblue = Color.FromHex(11591910);
Color.purple = Color.FromHex(8388736);
Color.red = Color.FromHex(16711680);
Color.rosybrown = Color.FromHex(12357519);
Color.royalblue = Color.FromHex(4286945);
Color.saddlebrown = Color.FromHex(9127187);
Color.salmon = Color.FromHex(16416882);
Color.sandybrown = Color.FromHex(16032864);
Color.seagreen = Color.FromHex(3050327);
Color.seashell = Color.FromHex(16774638);
Color.sienna = Color.FromHex(10506797);
Color.silver = Color.FromHex(12632256);
Color.skyblue = Color.FromHex(8900331);
Color.slateblue = Color.FromHex(6970061);
Color.slategray = Color.FromHex(7372944);
Color.snow = Color.FromHex(16775930);
Color.springgreen = Color.FromHex(65407);
Color.steelblue = Color.FromHex(4620980);
Color.tan = Color.FromHex(13808780);
Color.teal = Color.FromHex(32896);
Color.thistle = Color.FromHex(14204888);
Color.tomato = Color.FromHex(16737095);
Color.turquoise = Color.FromHex(4251856);
Color.violet = Color.FromHex(9371903);
Color.wheat = Color.FromHex(16113331);
Color.white = Color.FromHex(16777215);
Color.whitesmoke = Color.FromHex(16119285);
Color.yellow = Color.FromHex(16776960);
Color.yellowgreen = Color.FromHex(10145074);

// src/input/mouseinput.js
init_vec2();
var MouseInput = class _MouseInput {
  static #canvas;
  static #pos = new Vector2();
  static #pressedButton;
  static #isClicked;
  static #isMouseDown;
  /**
   * Check if a button is currently up.
   * @param {MouseInput.BUTTON} button - The button to check. Use MouseInput.buttons enum.
   * @returns {boolean} True if the specified button is up.
   */
  static IsButtonUp(button) {
    return _MouseInput.#pressedButton === button && !_MouseInput.#isMouseDown;
  }
  /**
   * Check if a button is currently down.
   * @param {MouseInput.BUTTON} button - The button to check. Use MouseInput.buttons enum.
   * @returns {boolean} True if the specified button is down.
   */
  static IsButtonDown(button) {
    return _MouseInput.#pressedButton === button && _MouseInput.#isMouseDown;
  }
  /**
   * Check if a button was clicked.
   * @param {MouseInput.BUTTON} button - The button to check. Use MouseInput.buttons enum.
   * @returns {boolean} True if the specified button was clicked.
   */
  static IsClicked(button) {
    return _MouseInput.#isClicked && _MouseInput.#pressedButton === button;
  }
  /**
   * Get the current mouse position.
   * @returns {Vector2} The current mouse position.
   */
  static GetPosition() {
    return _MouseInput.#pos.Copy();
  }
  /**@private */
  static init(canvas2) {
    _MouseInput.#canvas = canvas2;
    _MouseInput.#pos = new Vector2();
    _MouseInput.#pressedButton = null;
    _MouseInput.#isClicked = false;
    _MouseInput.#isMouseDown = false;
    _MouseInput.#canvas.addEventListener("click", _MouseInput.#click);
    _MouseInput.#canvas.addEventListener("dblclick", _MouseInput.#doubleClick);
    _MouseInput.#canvas.addEventListener("contextmenu", _MouseInput.#rightClick);
    _MouseInput.#canvas.addEventListener("mousedown", _MouseInput.#mouseDown);
    _MouseInput.#canvas.addEventListener("mouseup", _MouseInput.#mouseUp);
    _MouseInput.#canvas.addEventListener("mousemove", _MouseInput.#mouseMove);
  }
  /**@private */
  static #click(event, button) {
    _MouseInput.#isClicked = true;
    _MouseInput.#pos.x = event.offsetX;
    _MouseInput.#pos.y = event.offsetY;
    _MouseInput.#pressedButton = button;
  }
  /**@private */
  static #doubleClick(event, button) {
    _MouseInput.#isClicked = true;
    _MouseInput.#pos.x = event.offsetX;
    _MouseInput.#pos.y = event.offsetY;
    _MouseInput.#pressedButton = button;
  }
  /**@private */
  static #rightClick(event) {
    event.preventDefault();
    _MouseInput.#click(event, _MouseInput.BUTTON.RIGHT);
  }
  /**@private */
  static #mouseDown(event, button) {
    _MouseInput.#isMouseDown = true;
    _MouseInput.#pos.x = event.offsetX;
    _MouseInput.#pos.y = event.offsetY;
    _MouseInput.#pressedButton = button;
  }
  /**@private */
  static #mouseUp(event) {
    _MouseInput.#isMouseDown = false;
    _MouseInput.#pos.x = event.offsetX;
    _MouseInput.#pos.y = event.offsetY;
    _MouseInput.#pressedButton = -1;
  }
  /**@private */
  static #mouseMove(event) {
    _MouseInput.#pos.x = event.offsetX;
    _MouseInput.#pos.y = event.offsetY;
  }
  /**
   * Clear the mouse input states.
   * @private
   */
  static clear() {
    _MouseInput.#isClicked = false;
    _MouseInput.#isMouseDown = false;
    _MouseInput.#pressedButton = -1;
  }
};
MouseInput.BUTTON = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};

// src/input/keyboardinput.js
var KeyboardInput = class _KeyboardInput {
  static #canvas;
  static #keyPressed = [];
  static #specialKeyPressed;
  static #pressedThisFrame = /* @__PURE__ */ new Set();
  static #releasedThisFrame = /* @__PURE__ */ new Set();
  static #initializedWindow;
  /** True for the simulation frame after a key goes down, even after a quick release. */
  static IsKeyPressed(keyCode) {
    return _KeyboardInput.#pressedThisFrame.has(keyCode);
  }
  /** True for a simulation frame after a key goes up, including a quick tap. */
  static IsKeyReleased(keyCode) {
    return _KeyboardInput.#releasedThisFrame.has(keyCode);
  }
  /**
   * Checks if the key with the given keycode is pressed.
   * @param {KeyboardInput.KEY_CODE} keyCode The keycode of the key to check.
   * @returns {boolean} True if the key with the given keycode is pressed.
   * @method
   * @example KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.A)
   */
  static IsKeyDown(keyCode) {
    if (!_KeyboardInput.#keyPressed) return false;
    if (_KeyboardInput.#keyPressed[keyCode] === void 0) return false;
    return _KeyboardInput.#keyPressed[keyCode];
  }
  /**
   * Returns the keycode of the special key pressed.
   * @returns {number} The keycode of the special key pressed.
   */
  static GetSpecialKeyPressed() {
    return _KeyboardInput.#specialKeyPressed;
  }
  /**@private */
  static init(canvas2) {
    if (_KeyboardInput.#initializedWindow) {
      _KeyboardInput.#initializedWindow.removeEventListener("keydown", _KeyboardInput.#keyDown);
      _KeyboardInput.#initializedWindow.removeEventListener("keyup", _KeyboardInput.#keyUp);
      _KeyboardInput.#initializedWindow.removeEventListener("blur", _KeyboardInput.#blur);
    }
    _KeyboardInput.#canvas = canvas2;
    _KeyboardInput.#initializedWindow = window;
    _KeyboardInput.#keyPressed = [];
    _KeyboardInput.#specialKeyPressed = null;
    _KeyboardInput.#pressedThisFrame.clear();
    _KeyboardInput.#releasedThisFrame.clear();
    window.addEventListener("keydown", _KeyboardInput.#keyDown);
    window.addEventListener("keyup", _KeyboardInput.#keyUp);
    window.addEventListener("blur", _KeyboardInput.#blur);
  }
  /** Remove global handlers and forget every held key. Safe to call repeatedly. */
  static dispose() {
    if (_KeyboardInput.#initializedWindow) {
      _KeyboardInput.#initializedWindow.removeEventListener("keydown", _KeyboardInput.#keyDown);
      _KeyboardInput.#initializedWindow.removeEventListener("keyup", _KeyboardInput.#keyUp);
      _KeyboardInput.#initializedWindow.removeEventListener("blur", _KeyboardInput.#blur);
    }
    _KeyboardInput.#initializedWindow = null;
    _KeyboardInput.#canvas = null;
    _KeyboardInput.#keyPressed = [];
    _KeyboardInput.#pressedThisFrame.clear();
    _KeyboardInput.#releasedThisFrame.clear();
    _KeyboardInput.#specialKeyPressed = null;
  }
  /** Clear held and transient state when a gameplay or project context ends. */
  static reset() {
    _KeyboardInput.#keyPressed = [];
    _KeyboardInput.#pressedThisFrame.clear();
    _KeyboardInput.#releasedThisFrame.clear();
    _KeyboardInput.#specialKeyPressed = null;
  }
  /**@private */
  static #checkSpecialKey(event) {
    if (event.shiftKey) _KeyboardInput.#specialKeyPressed = _KeyboardInput.KEY_CODE.SHIFT;
    else if (event.ctrlKey) _KeyboardInput.#specialKeyPressed = _KeyboardInput.KEY_CODE.CTRL;
    else if (event.altKey) _KeyboardInput.#specialKeyPressed = _KeyboardInput.KEY_CODE.ALT;
    else if (event.metaKey) _KeyboardInput.#specialKeyPressed = _KeyboardInput.KEY_CODE.META;
    else _KeyboardInput.#specialKeyPressed = null;
  }
  /**@private */
  static #keyDown(event) {
    if (!_KeyboardInput.#keyPressed[event.keyCode]) {
      _KeyboardInput.#checkSpecialKey(event);
      _KeyboardInput.#keyPressed[event.keyCode] = true;
      _KeyboardInput.#pressedThisFrame.add(event.keyCode);
    }
  }
  /**@private */
  static #keyUp(event) {
    _KeyboardInput.#checkSpecialKey(event);
    if (_KeyboardInput.#keyPressed[event.keyCode]) _KeyboardInput.#releasedThisFrame.add(event.keyCode);
    _KeyboardInput.#keyPressed[event.keyCode] = false;
  }
  /**@private */
  static clear() {
    _KeyboardInput.#specialKeyPressed = null;
    _KeyboardInput.#pressedThisFrame.clear();
    _KeyboardInput.#releasedThisFrame.clear();
  }
  static #blur() {
    for (let keyCode = 0; keyCode < _KeyboardInput.#keyPressed.length; keyCode++) {
      if (_KeyboardInput.#keyPressed[keyCode]) _KeyboardInput.#releasedThisFrame.add(keyCode);
    }
    _KeyboardInput.#keyPressed = [];
    _KeyboardInput.#pressedThisFrame.clear();
    _KeyboardInput.#specialKeyPressed = null;
  }
};
KeyboardInput.KEY_CODE = {
  NUMONE: 49,
  NUMTWO: 50,
  NUMTHREE: 51,
  NUMFOUR: 52,
  NUMFIVE: 53,
  NUMSIX: 54,
  NUMSEVEN: 55,
  NUMEIGHT: 56,
  NUMNINE: 57,
  NUMZERO: 48,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  LEFTARROW: 37,
  UPARROW: 38,
  RIGHTARROW: 39,
  DOWNARROW: 40,
  SPACE: 32,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  META: 19,
  TAB: 9,
  ENTER: 13,
  ESC: 27,
  BACKSPACE: 8,
  DELETE: 46,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  NUMLOCK: 144,
  SCROLLLOCK: 145,
  SEMICOLON: 186,
  EQUALSIGN: 187,
  COMMA: 188,
  DASH: 189,
  PERIOD: 190,
  FORWARDSLASH: 191,
  GRAVEACCENT: 192,
  OPENBRACKET: 219,
  BACKSLASH: 220,
  CLOSEBRACKET: 221,
  SINGLEQUOTE: 222
};

// src/input/touchinput.js
init_vec2();
var TouchInput = class _TouchInput {
  static #canvas;
  static #touches = [];
  /**@private */
  static init(canvas2) {
    _TouchInput.#canvas = canvas2;
    _TouchInput.#touches = [];
    _TouchInput.#canvas.addEventListener("touchstart", _TouchInput.#touchStart, { passive: true });
    _TouchInput.#canvas.addEventListener("touchend", _TouchInput.#touchEnd, { passive: true });
    _TouchInput.#canvas.addEventListener("touchmove", _TouchInput.#touchMove, { passive: true });
  }
  /**@private */
  static #touchStart(event) {
    _TouchInput.#touches = event.touches;
  }
  /**@private */
  static #touchEnd(event) {
    _TouchInput.#touches = event.touches;
  }
  /**@private */
  static #touchMove(event) {
    _TouchInput.#touches = event.touches;
  }
  /**
   * Get the number of active touches.
   * @returns {number} The number of active touches.
   */
  static GetTouchCount() {
    return _TouchInput.#touches.length;
  }
  /**
   * Get the position of the touch at the given index.
   * @param {number} index The index of the touch to get the position of.
   * @returns {Vector2} The position of the touch at the given index.
   */
  static GetTouch(index) {
    if (index >= 0 && index < _TouchInput.#touches.length) {
      const touch = _TouchInput.#touches[index];
      return new Vector2(touch.pageX - _TouchInput.#canvas.offsetLeft, touch.pageY - _TouchInput.#canvas.offsetTop);
    }
    return null;
  }
  /**
   * Check if a touch is currently active.
   * @param {number} index The index of the touch to check.
   * @returns {boolean} True if the touch at the given index is active.
   */
  static IsTouchActive(index) {
    return index >= 0 && index < _TouchInput.#touches.length;
  }
  /**@private */
  static clear() {
    _TouchInput.#touches = [];
  }
};

// src/core/application.js
init_sceneManager();

// src/scripts/script.js
init_component();
var Script = class extends Component {
  constructor(name = "New Script") {
    super();
    this.name = name;
    ScriptManager.addScript(this);
  }
  destroy() {
    ScriptManager.removeScript(this);
    super.destroy();
  }
};
var Behaviour = class extends Script {
  /**
   * Creates a new Behaviour
   * @param {string} name - Name of the Behaviour
   * @param {Function} Init - Function called when the Behaviour is created
   * @param {Function} Update - Function called every frame
   */
  constructor(name = "New Behaviour", Init = null, Update = null) {
    super(name);
    if (Init) this.Init = Init;
    if (Update) this.Update = Update;
  }
};
var Global = class extends Script {
};

// src/scripts/scriptManager.js
init_entity();
init_scene();
init_sceneManager();
var isBehaviourActive = (behaviour) => {
  if (behaviour.properties?.enabled === false || behaviour.enabled === false) return false;
  if (!behaviour.entity) return true;
  if (!isEntityActive(behaviour.entity)) return false;
  let root = behaviour.entity;
  const visited = /* @__PURE__ */ new Set();
  while (root.parent && !visited.has(root)) {
    visited.add(root);
    root = root.parent;
  }
  return !(root instanceof Scene) || SceneManager.isSceneLoaded(root);
};
var ScriptManager = class {
  static #behaviours = /* @__PURE__ */ new Set();
  static #initialized = /* @__PURE__ */ new WeakSet();
  /**
   * Remove a destroyed script from future lifecycle ticks.
   * @private
   */
  static removeScript(script) {
    this.#behaviours.delete(script);
  }
  /**@private */
  static addScript(script) {
    console.log(`ScriptManager: Adding script ${script.constructor.name}`);
    if (script instanceof Behaviour || script.Update && typeof script.Update === "function") {
      this.#behaviours.add(script);
    } else if (script instanceof Global) {
      window[script.constructor.name] = script;
    }
  }
  /** @private */
  static behaviourInit() {
    console.log(`ScriptManager: Init ${this.#behaviours.size} scripts`);
    [...this.#behaviours].forEach((behaviour) => {
      if (!this.#behaviours.has(behaviour) || !isBehaviourActive(behaviour)) return;
      this.#initialize(behaviour);
    });
  }
  static #initialize(behaviour) {
    if (this.#initialized.has(behaviour)) return;
    if (typeof behaviour.Init === "function") behaviour.Init();
    this.#initialized.add(behaviour);
  }
  /** @private */
  static behaviourUpdate(deltaTime) {
    [...this.#behaviours].forEach((behaviour) => {
      if (!this.#behaviours.has(behaviour) || !isBehaviourActive(behaviour)) return;
      this.#initialize(behaviour);
      if (!this.#behaviours.has(behaviour) || !isBehaviourActive(behaviour)) return;
      behaviour.Update(deltaTime);
    });
  }
};

// src/core/destroyQueue.js
init_entity();
init_component();
var DestroyQueue = class _DestroyQueue {
  static #queue = [];
  /**
   * Adds an entity to the destroy queue.
   * Note: If a component is added to the destroy queue, The entire entity will be destroyed.
   * @param {Entity} object The entity to be destroyed. or the component of the entity to be destroyed.
   * @returns {void}
   */
  static Add(object) {
    if (object instanceof Entity) {
      _DestroyQueue.#queue.push(object);
    }
    if (object instanceof Component) {
      _DestroyQueue.#queue.push(object.entity);
    }
  }
  /**@private */
  static destroy() {
    _DestroyQueue.#queue.forEach((entity) => {
      entity.destroy();
    });
    _DestroyQueue.#queue = [];
  }
};

// src/core/application.js
init_authoredUi();

// src/core/fixedStepper.js
var finitePositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${name} must be a positive finite number`);
};
var FixedStepper = class {
  constructor({ step = 1 / 60, maxSteps = 5, maxFrameDelta = 0.25 } = {}) {
    finitePositive(step, "step");
    finitePositive(maxFrameDelta, "maxFrameDelta");
    if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new TypeError("maxSteps must be a positive integer");
    this.step = step;
    this.maxSteps = maxSteps;
    this.maxFrameDelta = maxFrameDelta;
    this.accumulator = 0;
    this.droppedTime = 0;
  }
  get interpolationAlpha() {
    return this.accumulator / this.step;
  }
  advance(frameDelta, update) {
    if (!Number.isFinite(frameDelta) || frameDelta < 0) throw new TypeError("frameDelta must be finite and non-negative");
    if (typeof update !== "function") throw new TypeError("advance requires an update callback");
    const accepted = Math.min(frameDelta, this.maxFrameDelta);
    this.droppedTime += frameDelta - accepted;
    this.accumulator += accepted;
    let steps = 0;
    while (this.accumulator + Number.EPSILON >= this.step && steps < this.maxSteps) {
      this.accumulator = Math.max(0, this.accumulator - this.step);
      update(this.step);
      steps++;
    }
    if (this.accumulator >= this.step) {
      const keptRemainder = this.accumulator % this.step;
      this.droppedTime += this.accumulator - keptRemainder;
      this.accumulator = keptRemainder;
    }
    return steps;
  }
  reset() {
    this.accumulator = 0;
  }
};

// src/core/worldFacts.js
function normalizeProvenance(provenance) {
  if (typeof provenance === "string" && provenance.trim()) {
    return { source: provenance.trim(), timestamp: Date.now() };
  }
  if (provenance && typeof provenance === "object") {
    const source = typeof provenance.source === "string" && provenance.source.trim() ? provenance.source.trim() : "system";
    const timestamp = typeof provenance.timestamp === "number" && Number.isFinite(provenance.timestamp) ? provenance.timestamp : Date.now();
    return { source, timestamp };
  }
  return { source: "system", timestamp: Date.now() };
}
function getNested(obj, parts) {
  let curr = obj;
  for (let i = 0; i < parts.length; i++) {
    if (curr === null || typeof curr !== "object") {
      return void 0;
    }
    const prop = parts[i];
    if (!(prop in curr)) {
      return void 0;
    }
    curr = curr[prop];
  }
  return curr;
}
function setNested(obj, parts, value) {
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const prop = parts[i];
    if (!(prop in curr) || typeof curr[prop] !== "object" || curr[prop] === null) {
      curr[prop] = {};
    }
    curr = curr[prop];
  }
  curr[parts[parts.length - 1]] = value;
}
function matchesPattern(pattern, key) {
  if (!pattern || pattern === "*") return true;
  if (pattern === key) return true;
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return key.startsWith(prefix);
  }
  if (pattern.includes("*")) {
    const regexStr = "^" + pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$";
    return new RegExp(regexStr).test(key);
  }
  return false;
}
var WorldFacts = class {
  #facts = /* @__PURE__ */ new Map();
  #listeners = /* @__PURE__ */ new Set();
  /**
   * @param {Record<string, any>} [initialFacts]
   */
  constructor(initialFacts = null) {
    if (initialFacts && typeof initialFacts === "object") {
      for (const [key, value] of Object.entries(initialFacts)) {
        this.set(key, value, { source: "initial", timestamp: Date.now() });
      }
    }
  }
  /**
   * Number of stored authoritative facts.
   * @returns {number}
   */
  get size() {
    return this.#facts.size;
  }
  /**
   * Sets a fact with provenance tracking.
   * @param {string} key
   * @param {any} value
   * @param {string|object} [provenance]
   * @returns {this}
   */
  set(key, value, provenance = null) {
    if (typeof key !== "string" || !key.trim()) {
      throw new TypeError("Fact key must be a non-empty string");
    }
    const prov = normalizeProvenance(provenance);
    const oldRecord = this.#facts.get(key);
    const oldValue = oldRecord ? oldRecord.value : void 0;
    const storedValue = value !== null && typeof value === "object" ? structuredClone(value) : value;
    this.#facts.set(key, {
      value: storedValue,
      source: prov.source,
      timestamp: prov.timestamp
    });
    this._notifyChange(key, storedValue, oldValue, prov);
    return this;
  }
  /**
   * Gets a fact value. Supports exact key, dot-notated sub-path traversal,
   * and namespace aggregation.
   * @param {string} key
   * @param {any} [defaultValue=undefined]
   * @returns {any}
   */
  get(key, defaultValue = void 0) {
    if (typeof key !== "string") return defaultValue;
    if (this.#facts.has(key)) {
      const val = this.#facts.get(key).value;
      return val !== null && typeof val === "object" ? structuredClone(val) : val;
    }
    if (key.includes(".")) {
      const parts = key.split(".");
      for (let i = parts.length - 1; i >= 1; i--) {
        const prefix2 = parts.slice(0, i).join(".");
        if (this.#facts.has(prefix2)) {
          const rootVal = this.#facts.get(prefix2).value;
          const subVal = getNested(rootVal, parts.slice(i));
          if (subVal !== void 0) {
            return subVal !== null && typeof subVal === "object" ? structuredClone(subVal) : subVal;
          }
        }
      }
    }
    const prefix = key + ".";
    let matched = false;
    const composite = {};
    for (const [k, rec] of this.#facts.entries()) {
      if (k.startsWith(prefix)) {
        matched = true;
        const subParts = k.slice(prefix.length).split(".");
        const val = rec.value !== null && typeof rec.value === "object" ? structuredClone(rec.value) : rec.value;
        setNested(composite, subParts, val);
      }
    }
    if (matched) {
      return composite;
    }
    return defaultValue;
  }
  /**
   * Checks whether a fact exists (exact key, nested property, or namespace).
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    if (typeof key !== "string") return false;
    if (this.#facts.has(key)) return true;
    return this.get(key) !== void 0;
  }
  /**
   * Returns full fact record including value and provenance metadata.
   * @param {string} key
   * @returns {{ value: any, source: string, timestamp: number }|null}
   */
  getFact(key) {
    if (typeof key !== "string") return null;
    if (this.#facts.has(key)) {
      const rec = this.#facts.get(key);
      return {
        value: rec.value !== null && typeof rec.value === "object" ? structuredClone(rec.value) : rec.value,
        source: rec.source,
        timestamp: rec.timestamp
      };
    }
    if (key.includes(".")) {
      const parts = key.split(".");
      for (let i = parts.length - 1; i >= 1; i--) {
        const prefix = parts.slice(0, i).join(".");
        if (this.#facts.has(prefix)) {
          const rootRec = this.#facts.get(prefix);
          const subVal = getNested(rootRec.value, parts.slice(i));
          if (subVal !== void 0) {
            return {
              value: subVal !== null && typeof subVal === "object" ? structuredClone(subVal) : subVal,
              source: rootRec.source,
              timestamp: rootRec.timestamp
            };
          }
        }
      }
    }
    return null;
  }
  /**
   * Returns provenance metadata for a fact.
   * @param {string} key
   * @returns {{ source: string, timestamp: number }|null}
   */
  getProvenance(key) {
    const fact = this.getFact(key);
    return fact ? { source: fact.source, timestamp: fact.timestamp } : null;
  }
  /**
   * Deletes a fact and notifies listeners.
   * @param {string} key
   * @param {string|object} [provenance]
   * @returns {boolean}
   */
  delete(key, provenance = null) {
    if (typeof key !== "string" || !this.#facts.has(key)) return false;
    const oldRec = this.#facts.get(key);
    const prov = normalizeProvenance(provenance);
    this.#facts.delete(key);
    this._notifyChange(key, void 0, oldRec.value, prov);
    return true;
  }
  /**
   * Clears all facts.
   */
  clear() {
    this.#facts.clear();
  }
  /**
   * Returns an array of stored fact keys.
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.#facts.keys());
  }
  /**
   * Returns an array of `[key, value]` entries.
   * @returns {Array<Array>}
   */
  entries() {
    return Array.from(this.#facts.entries()).map(([k, rec]) => [
      k,
      rec.value !== null && typeof rec.value === "object" ? structuredClone(rec.value) : rec.value
    ]);
  }
  /**
   * Returns a plain object representation of all stored facts.
   * @returns {Record<string, any>}
   */
  toObject() {
    const obj = {};
    for (const [k, rec] of this.#facts.entries()) {
      obj[k] = rec.value !== null && typeof rec.value === "object" ? structuredClone(rec.value) : rec.value;
    }
    return obj;
  }
  /**
   * Returns all authoritative records with provenance.
   * @returns {Record<string, { value: any, source: string, timestamp: number }>}
   */
  allFacts() {
    const result = {};
    for (const [k, rec] of this.#facts.entries()) {
      result[k] = {
        value: rec.value !== null && typeof rec.value === "object" ? structuredClone(rec.value) : rec.value,
        source: rec.source,
        timestamp: rec.timestamp
      };
    }
    return result;
  }
  /**
   * Registers a change listener with pattern filtering and clean unbind.
   * - `onChange(callback)`: global listener (key, newValue, oldValue, provenance)
   * - `onChange(pattern, callback)`: filtered listener (newValue, oldValue, provenance, key)
   * @param {string|Function} patternOrCallback
   * @param {Function} [maybeCallback]
   * @returns {Function} Unbind function
   */
  onChange(patternOrCallback, maybeCallback) {
    let pattern = null;
    let callback = null;
    if (typeof patternOrCallback === "function") {
      callback = patternOrCallback;
    } else if (typeof patternOrCallback === "string" && typeof maybeCallback === "function") {
      pattern = patternOrCallback;
      callback = maybeCallback;
    } else {
      throw new TypeError("Invalid arguments for onChange: expected (callback) or (pattern, callback)");
    }
    const listenerRecord = {
      pattern,
      callback,
      isRemoved: false
    };
    this.#listeners.add(listenerRecord);
    const unbind = () => {
      if (listenerRecord.isRemoved) return;
      listenerRecord.isRemoved = true;
      this.#listeners.delete(listenerRecord);
    };
    listenerRecord.unbind = unbind;
    return unbind;
  }
  /**
   * Explicit unbind for a listener or unbind function.
   * @param {Function} unbindOrCallback
   */
  offChange(unbindOrCallback) {
    if (typeof unbindOrCallback !== "function") return false;
    for (const record of this.#listeners) {
      if (record.unbind === unbindOrCallback || record.callback === unbindOrCallback) {
        record.unbind();
        return true;
      }
    }
    return false;
  }
  /**
   * Internal change notification.
   * @private
   */
  _notifyChange(key, newValue, oldValue, provenance) {
    if (this.#listeners.size === 0) return;
    const snapshot = Array.from(this.#listeners);
    for (const listener of snapshot) {
      if (listener.isRemoved) continue;
      if (!listener.pattern) {
        listener.callback(key, newValue, oldValue, provenance);
      } else if (matchesPattern(listener.pattern, key)) {
        listener.callback(newValue, oldValue, provenance, key);
      }
    }
  }
  /**
   * Creates a deep-cloned, serializable snapshot for save games.
   * @returns {{ version: number, timestamp: number, facts: Record<string, { value: any, source: string, timestamp: number }> }}
   */
  snapshot() {
    const factsObj = {};
    for (const [key, record] of this.#facts.entries()) {
      factsObj[key] = {
        value: record.value !== null && typeof record.value === "object" ? structuredClone(record.value) : record.value,
        source: record.source,
        timestamp: record.timestamp
      };
    }
    return {
      version: 1,
      timestamp: Date.now(),
      facts: factsObj
    };
  }
  /**
   * Restores state from a snapshot.
   * @param {object} snapshot
   * @param {object} [options]
   * @returns {this}
   */
  restore(snapshot, { clearExisting = true, notify = false } = {}) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new TypeError("Snapshot must be an object");
    }
    if (clearExisting) {
      this.#facts.clear();
    }
    const rawFacts = snapshot.facts && typeof snapshot.facts === "object" && !Array.isArray(snapshot.facts) ? snapshot.facts : snapshot;
    for (const [key, entry] of Object.entries(rawFacts)) {
      if (snapshot.facts && (key === "version" || key === "timestamp")) {
        continue;
      }
      let value;
      let provenance;
      if (entry && typeof entry === "object" && "value" in entry && "source" in entry) {
        value = entry.value !== null && typeof entry.value === "object" ? structuredClone(entry.value) : entry.value;
        provenance = {
          source: entry.source,
          timestamp: typeof entry.timestamp === "number" ? entry.timestamp : Date.now()
        };
      } else {
        value = entry !== null && typeof entry === "object" ? structuredClone(entry) : entry;
        provenance = { source: "restore", timestamp: Date.now() };
      }
      this.#facts.set(key, {
        value,
        source: provenance.source,
        timestamp: provenance.timestamp
      });
      if (notify) {
        this._notifyChange(key, value, void 0, provenance);
      }
    }
    return this;
  }
};
var TypedEventBus = class {
  #listeners = /* @__PURE__ */ new Map();
  // eventType -> Array<ListenerRecord>
  #depth = 0;
  #eventDepths = /* @__PURE__ */ new Map();
  #orderSeq = 0;
  /**
   * @param {object} [options]
   */
  constructor({ maxRecursionDepth = 32, guardDuplicates = true } = {}) {
    this.maxRecursionDepth = maxRecursionDepth;
    this.guardDuplicates = guardDuplicates;
  }
  /**
   * Subscribes a prioritized listener to an event type.
   * @param {string|symbol} eventType
   * @param {Function} listener
   * @param {number|object} [options]
   * @returns {Function} Idempotent unbind function
   */
  on(eventType, listener, options = {}) {
    if (typeof eventType !== "string" && typeof eventType !== "symbol") {
      throw new TypeError("Event type must be a string or symbol");
    }
    if (typeof listener !== "function") {
      throw new TypeError("Listener must be a function");
    }
    const opts = typeof options === "number" ? { priority: options } : options || {};
    const priority = Number.isFinite(opts.priority) ? Number(opts.priority) : 0;
    const once = Boolean(opts.once);
    const id = opts.id || null;
    const shouldGuardDuplicates = opts.guardDuplicates !== void 0 ? Boolean(opts.guardDuplicates) : this.guardDuplicates;
    if (!this.#listeners.has(eventType)) {
      this.#listeners.set(eventType, []);
    }
    const list = this.#listeners.get(eventType);
    if (shouldGuardDuplicates) {
      const existing = list.find((r) => !r.isRemoved && (r.fn === listener || id !== null && r.id === id));
      if (existing) {
        return existing.unbind;
      }
    }
    let record;
    const unbind = () => {
      if (record.isRemoved) return;
      record.isRemoved = true;
      const currentList = this.#listeners.get(eventType);
      if (currentList) {
        const idx = currentList.indexOf(record);
        if (idx !== -1) {
          currentList.splice(idx, 1);
        }
        if (currentList.length === 0) {
          this.#listeners.delete(eventType);
        }
      }
    };
    record = {
      fn: listener,
      priority,
      once,
      id,
      isRemoved: false,
      order: ++this.#orderSeq,
      unbind
    };
    list.push(record);
    list.sort((a, b) => b.priority - a.priority || a.order - b.order);
    return unbind;
  }
  /**
   * Subscribes a listener that runs at most once.
   * @param {string|symbol} eventType
   * @param {Function} listener
   * @param {number|object} [options]
   * @returns {Function}
   */
  once(eventType, listener, options = {}) {
    const opts = typeof options === "number" ? { priority: options } : { ...options || {} };
    opts.once = true;
    return this.on(eventType, listener, opts);
  }
  /**
   * Unsubscribes a listener by function reference or registration ID.
   * @param {string|symbol} eventType
   * @param {Function|string} listenerOrId
   * @returns {boolean}
   */
  off(eventType, listenerOrId) {
    const list = this.#listeners.get(eventType);
    if (!list || list.length === 0) return false;
    let removed = false;
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      if (r.fn === listenerOrId || typeof listenerOrId === "string" && r.id === listenerOrId) {
        r.unbind();
        removed = true;
      }
    }
    return removed;
  }
  /**
   * Emits an event with prioritized dispatch, recursion bounding,
   * self-removal safety, and stopPropagation support.
   * @param {string|symbol} eventType
   * @param {any} [data={}]
   * @returns {{ stopped: boolean, count: number, defaultPrevented: boolean }}
   */
  emit(eventType, data = {}) {
    const currentEvent = this.#eventDepths.get(eventType) || 0;
    if (currentEvent >= this.maxRecursionDepth) {
      throw new RangeError(
        `Event recursion depth exceeded maximum limit of ${this.maxRecursionDepth} for event "${String(eventType)}"`
      );
    }
    this.#depth++;
    this.#eventDepths.set(eventType, currentEvent + 1);
    try {
      const list = this.#listeners.get(eventType);
      if (!list || list.length === 0) {
        return { stopped: false, count: 0, defaultPrevented: false };
      }
      const snapshot = list.slice();
      let stopped = false;
      let prevented = false;
      const originalStopPropagation = data && typeof data === "object" && typeof data.stopPropagation === "function" ? data.stopPropagation.bind(data) : null;
      const originalPreventDefault = data && typeof data === "object" && typeof data.preventDefault === "function" ? data.preventDefault.bind(data) : null;
      const stopPropagation = () => {
        stopped = true;
        if (originalStopPropagation) {
          originalStopPropagation();
        }
      };
      const preventDefault = () => {
        prevented = true;
        if (originalPreventDefault) {
          originalPreventDefault();
        }
      };
      const eventContext = {
        type: eventType,
        data,
        stopPropagation,
        preventDefault,
        get isPropagationStopped() {
          return stopped || Boolean(data?.isPropagationStopped?.());
        },
        get defaultPrevented() {
          return prevented || Boolean(data?.defaultPrevented);
        }
      };
      if (data && typeof data === "object") {
        if (typeof data.stopPropagation !== "function") {
          try {
            Object.defineProperty(data, "stopPropagation", {
              value: stopPropagation,
              writable: true,
              configurable: true
            });
          } catch (_) {
          }
        }
        if (typeof data.isPropagationStopped !== "function") {
          try {
            Object.defineProperty(data, "isPropagationStopped", {
              value: () => stopped,
              writable: true,
              configurable: true
            });
          } catch (_) {
          }
        }
      }
      let invokedCount = 0;
      for (let i = 0; i < snapshot.length; i++) {
        const record = snapshot[i];
        if (record.isRemoved) {
          continue;
        }
        if (stopped || data?.isPropagationStopped?.()) {
          break;
        }
        if (record.once) {
          record.unbind();
        }
        invokedCount++;
        const result = record.fn(data, eventContext);
        if (result && typeof result === "object" && result.stopPropagation) {
          stopPropagation();
        }
      }
      return {
        stopped: stopped || Boolean(data?.isPropagationStopped?.()),
        count: invokedCount,
        defaultPrevented: prevented
      };
    } finally {
      this.#depth--;
      const count = (this.#eventDepths.get(eventType) || 1) - 1;
      if (count <= 0) {
        this.#eventDepths.delete(eventType);
      } else {
        this.#eventDepths.set(eventType, count);
      }
    }
  }
  /**
   * Returns the count of active listeners for an event type (or all events).
   * @param {string|symbol} [eventType]
   * @returns {number}
   */
  listenerCount(eventType) {
    if (eventType !== void 0) {
      const list = this.#listeners.get(eventType);
      return list ? list.filter((r) => !r.isRemoved).length : 0;
    }
    let total = 0;
    for (const list of this.#listeners.values()) {
      total += list.filter((r) => !r.isRemoved).length;
    }
    return total;
  }
  /**
   * Checks if there are any active listeners for an event type.
   * @param {string|symbol} eventType
   * @returns {boolean}
   */
  hasListeners(eventType) {
    return this.listenerCount(eventType) > 0;
  }
  /**
   * Clears listeners for a given event type or all listeners if omitted.
   * @param {string|symbol} [eventType]
   */
  clear(eventType) {
    if (eventType !== void 0) {
      const list = this.#listeners.get(eventType);
      if (list) {
        for (const r of list) {
          r.isRemoved = true;
        }
        this.#listeners.delete(eventType);
      }
    } else {
      for (const list of this.#listeners.values()) {
        for (const r of list) {
          r.isRemoved = true;
        }
      }
      this.#listeners.clear();
    }
  }
};
var RuleEngine = class {
  #rules = /* @__PURE__ */ new Map();
  #eventSubscriptions = /* @__PURE__ */ new Map();
  #traces = [];
  #traceSeq = 0;
  #ruleSeq = 0;
  /**
   * @param {WorldFacts|object} [optionsOrFacts]
   * @param {TypedEventBus} [maybeBus]
   * @param {object} [maybeOptions]
   */
  constructor(optionsOrFacts = {}, maybeBus = null, maybeOptions = {}) {
    let facts2;
    let bus;
    let options;
    if (optionsOrFacts instanceof WorldFacts) {
      facts2 = optionsOrFacts;
      bus = maybeBus instanceof TypedEventBus ? maybeBus : new TypedEventBus();
      options = maybeOptions || {};
    } else if (optionsOrFacts && typeof optionsOrFacts === "object") {
      facts2 = optionsOrFacts.facts instanceof WorldFacts ? optionsOrFacts.facts : new WorldFacts();
      bus = optionsOrFacts.bus instanceof TypedEventBus ? optionsOrFacts.bus : new TypedEventBus();
      options = optionsOrFacts;
    } else {
      facts2 = new WorldFacts();
      bus = new TypedEventBus();
      options = {};
    }
    this.facts = facts2;
    this.bus = bus;
    this.maxTraces = typeof options.maxTraces === "number" ? options.maxTraces : 1e3;
    this.enableTracing = options.enableTracing !== false;
  }
  /**
   * Total number of registered rules.
   * @returns {number}
   */
  get ruleCount() {
    return this.#rules.size;
  }
  /**
   * Adds an ordered condition/effect rule.
   * @param {object} ruleDef
   * @param {string} [ruleDef.id] Unique rule identifier
   * @param {string} [ruleDef.name] Human readable name
   * @param {number} [ruleDef.priority=0] Higher executes first
   * @param {string|string[]} [ruleDef.event] Event(s) to bind on TypedEventBus
   * @param {Function|boolean} [ruleDef.condition] Condition check
   * @param {Function} [ruleDef.action] Action effect
   * @param {boolean} [ruleDef.stopPropagation=false] If true, halts further rules/listeners on execution
   * @param {boolean} [ruleDef.enabled=true]
   * @returns {Function} Unbind function
   */
  addRule(ruleDef) {
    if (!ruleDef || typeof ruleDef !== "object") {
      throw new TypeError("Rule definition must be an object");
    }
    const id = typeof ruleDef.id === "string" && ruleDef.id.trim() ? ruleDef.id.trim() : `rule_${++this.#ruleSeq}`;
    if (this.#rules.has(id)) {
      this.removeRule(id);
    }
    const priority = Number.isFinite(ruleDef.priority) ? Number(ruleDef.priority) : 0;
    const condition = typeof ruleDef.condition === "function" ? ruleDef.condition : typeof ruleDef.when === "function" ? ruleDef.when : ruleDef.condition !== void 0 ? () => Boolean(ruleDef.condition) : () => true;
    const action = typeof ruleDef.action === "function" ? ruleDef.action : typeof ruleDef.effect === "function" ? ruleDef.effect : typeof ruleDef.then === "function" ? ruleDef.then : null;
    const ruleRecord = {
      id,
      name: ruleDef.name || ruleDef.description || id,
      priority,
      event: ruleDef.event || ruleDef.on || null,
      condition,
      action,
      stopPropagation: Boolean(ruleDef.stopPropagation),
      enabled: ruleDef.enabled !== false,
      order: ++this.#ruleSeq
    };
    this.#rules.set(id, ruleRecord);
    const unbindSubscriptions = [];
    if (ruleRecord.event) {
      const events = Array.isArray(ruleRecord.event) ? ruleRecord.event : [ruleRecord.event];
      for (const evt of events) {
        if (typeof evt === "string" && evt.trim()) {
          const unbindBus = this.bus.on(evt, (data, eventContext) => {
            if (!ruleRecord.enabled) return;
            let stopped = false;
            const stop = () => {
              stopped = true;
              eventContext.stopPropagation();
            };
            const executionContext = {
              facts: this.facts,
              bus: this.bus,
              event: data,
              data,
              eventType: evt,
              rule: ruleRecord,
              stopPropagation: stop,
              trace: (details) => this._logTrace({
                ruleId: id,
                priority,
                eventType: evt,
                conditionMatched: true,
                actionExecuted: true,
                stoppedPropagation: stopped,
                details
              })
            };
            let matched = false;
            let executed = false;
            let error = null;
            try {
              matched = Boolean(condition(executionContext));
            } catch (err) {
              error = err;
              this._logTrace({
                ruleId: id,
                priority,
                eventType: evt,
                conditionMatched: false,
                actionExecuted: false,
                stoppedPropagation: false,
                error
              });
              throw err;
            }
            if (matched) {
              if (action) {
                try {
                  const result = action(executionContext);
                  executed = true;
                  if (result && typeof result === "object" && result.stopPropagation) {
                    stop();
                  }
                } catch (err) {
                  error = err;
                  this._logTrace({
                    ruleId: id,
                    priority,
                    eventType: evt,
                    conditionMatched: true,
                    actionExecuted: false,
                    stoppedPropagation: stopped || ruleRecord.stopPropagation,
                    error
                  });
                  throw err;
                }
              } else {
                executed = true;
              }
              if (ruleRecord.stopPropagation) {
                stop();
              }
            }
            this._logTrace({
              ruleId: id,
              priority,
              eventType: evt,
              conditionMatched: matched,
              actionExecuted: executed,
              stoppedPropagation: stopped || matched && ruleRecord.stopPropagation,
              error: null
            });
          }, { priority, id: `rule:${id}:${evt}` });
          unbindSubscriptions.push(unbindBus);
        }
      }
    }
    this.#eventSubscriptions.set(id, unbindSubscriptions);
    const unbind = () => {
      this.removeRule(id);
    };
    ruleRecord.unbind = unbind;
    return unbind;
  }
  /**
   * Removes a rule and cleans up all its event bus subscriptions.
   * @param {string} ruleId
   * @returns {boolean}
   */
  removeRule(ruleId) {
    const rule = this.#rules.get(ruleId);
    if (!rule) return false;
    const subs = this.#eventSubscriptions.get(ruleId);
    if (subs) {
      for (const unbind of subs) {
        try {
          unbind();
        } catch (_) {
        }
      }
      this.#eventSubscriptions.delete(ruleId);
    }
    this.#rules.delete(ruleId);
    return true;
  }
  /**
   * Returns a rule definition by ID.
   * @param {string} ruleId
   * @returns {object|null}
   */
  getRule(ruleId) {
    return this.#rules.get(ruleId) || null;
  }
  /**
   * Checks if a rule is registered.
   * @param {string} ruleId
   * @returns {boolean}
   */
  hasRule(ruleId) {
    return this.#rules.has(ruleId);
  }
  /**
   * Enables a rule.
   * @param {string} ruleId
   */
  enableRule(ruleId) {
    const rule = this.#rules.get(ruleId);
    if (rule) rule.enabled = true;
  }
  /**
   * Disables a rule.
   * @param {string} ruleId
   */
  disableRule(ruleId) {
    const rule = this.#rules.get(ruleId);
    if (rule) rule.enabled = false;
  }
  /**
   * Evaluates matching rules in priority order against facts and event data.
   * @param {string|null} [eventType=null]
   * @param {any} [eventData={}]
   * @param {object} [options]
   * @returns {{ matchedCount: number, executedCount: number, stoppedPropagation: boolean }}
   */
  evaluate(eventType = null, eventData = {}, options = {}) {
    const matching = [];
    for (const rule of this.#rules.values()) {
      if (!rule.enabled) continue;
      if (eventType !== null && rule.event !== null) {
        const events = Array.isArray(rule.event) ? rule.event : [rule.event];
        if (!events.includes(eventType)) continue;
      }
      matching.push(rule);
    }
    matching.sort((a, b) => b.priority - a.priority || a.order - b.order);
    let stopped = false;
    let matchedCount = 0;
    let executedCount = 0;
    const stop = () => {
      stopped = true;
    };
    for (const rule of matching) {
      if (stopped) break;
      const executionContext = {
        facts: this.facts,
        bus: this.bus,
        event: eventData,
        data: eventData,
        eventType,
        rule,
        stopPropagation: stop,
        trace: (details) => this._logTrace({
          ruleId: rule.id,
          priority: rule.priority,
          eventType,
          conditionMatched: true,
          actionExecuted: true,
          stoppedPropagation: stopped,
          details
        })
      };
      let matched = false;
      let executed = false;
      let error = null;
      try {
        matched = Boolean(rule.condition(executionContext));
      } catch (err) {
        error = err;
        this._logTrace({
          ruleId: rule.id,
          priority: rule.priority,
          eventType,
          conditionMatched: false,
          actionExecuted: false,
          stoppedPropagation: false,
          error
        });
        if (options.rethrow !== false) throw err;
        continue;
      }
      if (matched) {
        matchedCount++;
        if (rule.action) {
          try {
            const result = rule.action(executionContext);
            executed = true;
            executedCount++;
            if (result && typeof result === "object" && result.stopPropagation) {
              stop();
            }
          } catch (err) {
            error = err;
            this._logTrace({
              ruleId: rule.id,
              priority: rule.priority,
              eventType,
              conditionMatched: true,
              actionExecuted: false,
              stoppedPropagation: stopped || rule.stopPropagation,
              error
            });
            if (options.rethrow !== false) throw err;
            continue;
          }
        } else {
          executed = true;
          executedCount++;
        }
        if (rule.stopPropagation) {
          stop();
        }
      }
      this._logTrace({
        ruleId: rule.id,
        priority: rule.priority,
        eventType,
        conditionMatched: matched,
        actionExecuted: executed,
        stoppedPropagation: stopped || matched && rule.stopPropagation,
        error: null
      });
    }
    return {
      matchedCount,
      executedCount,
      stoppedPropagation: stopped
    };
  }
  /**
   * Internal decision trace logger.
   * @private
   */
  _logTrace(entry) {
    if (!this.enableTracing) return null;
    const trace = {
      id: ++this.#traceSeq,
      timestamp: Date.now(),
      ruleId: entry.ruleId,
      priority: entry.priority,
      eventType: entry.eventType || null,
      conditionMatched: Boolean(entry.conditionMatched),
      actionExecuted: Boolean(entry.actionExecuted),
      stoppedPropagation: Boolean(entry.stoppedPropagation),
      error: entry.error || null,
      details: entry.details || null
    };
    this.#traces.push(trace);
    if (this.#traces.length > this.maxTraces) {
      this.#traces.shift();
    }
    return trace;
  }
  /**
   * Retrieves recorded decision traces with optional filtering.
   * @param {object} [filter]
   * @returns {Array<object>}
   */
  getDecisionTraces(filter = {}) {
    let list = this.#traces.slice();
    if (filter.ruleId) {
      list = list.filter((t) => t.ruleId === filter.ruleId);
    }
    if (filter.eventType) {
      list = list.filter((t) => t.eventType === filter.eventType);
    }
    if (filter.matched !== void 0) {
      list = list.filter((t) => t.conditionMatched === filter.matched);
    }
    if (filter.executed !== void 0) {
      list = list.filter((t) => t.actionExecuted === filter.executed);
    }
    if (typeof filter.limit === "number" && filter.limit > 0) {
      list = list.slice(-filter.limit);
    }
    return list;
  }
  /**
   * Returns the most recent decision trace.
   * @returns {object|null}
   */
  getLastDecisionTrace() {
    return this.#traces.length > 0 ? { ...this.#traces[this.#traces.length - 1] } : null;
  }
  /**
   * Clears all recorded decision traces.
   */
  clearDecisionTraces() {
    this.#traces = [];
  }
  /**
   * Unbinds and clears all registered rules.
   */
  clearRules() {
    for (const ruleId of Array.from(this.#rules.keys())) {
      this.removeRule(ruleId);
    }
  }
  /**
   * Cleans up all rules and decision traces.
   */
  dispose() {
    this.clearRules();
    this.clearDecisionTraces();
  }
};

// src/audio/audioBuses.js
init_component();
function finiteNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}
function nonEmptyString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}
var AudioBus = class {
  /**
   * @param {string} name
   * @param {Object} [config]
   * @param {AudioBus} [config.parent=null]
   * @param {number} [config.volume=1.0]
   * @param {boolean} [config.muted=false]
   */
  constructor(name, { parent = null, volume = 1, muted = false } = {}) {
    this.name = nonEmptyString(name, "bus name");
    this.parent = parent;
    this.volume = Math.max(0, Math.min(1, finiteNumber(volume, "volume")));
    this.muted = Boolean(muted);
  }
  /**
   * Compute composed effective volume through the ancestor chain.
   * If this bus or any ancestor is muted, effective volume is 0.0.
   * @returns {number} Composed volume in range [0, 1]
   */
  getEffectiveVolume() {
    if (this.muted) return 0;
    if (!this.parent) return this.volume;
    return this.volume * this.parent.getEffectiveVolume();
  }
  /**
   * Check if this bus or any of its parents is muted.
   * @returns {boolean}
   */
  isEffectivelyMuted() {
    if (this.muted) return true;
    if (!this.parent) return false;
    return this.parent.isEffectivelyMuted();
  }
};
var AudioBusSystem = class _AudioBusSystem extends Component {
  constructor() {
    super();
    this.buses = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
    this.createBus("master", { parent: null, volume: 1, muted: false });
    this.createBus("music", { parent: "master", volume: 0.8, muted: false });
    this.createBus("sfx", { parent: "master", volume: 1, muted: false });
    this.createBus("ui", { parent: "master", volume: 0.9, muted: false });
  }
  /**
   * Add change listener.
   * @param {Function} listener
   * @returns {Function} Unsubscribe
   */
  onBusChanged(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  _emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  /**
   * Create or retrieve an audio bus.
   * @param {string} name
   * @param {Object} [config]
   * @param {string|AudioBus} [config.parent="master"]
   * @param {number} [config.volume=1.0]
   * @param {boolean} [config.muted=false]
   * @returns {AudioBus}
   */
  createBus(name, { parent = "master", volume = 1, muted = false } = {}) {
    nonEmptyString(name, "name");
    let parentBus = null;
    if (parent) {
      parentBus = typeof parent === "string" ? this.buses.get(parent) ?? null : parent;
    }
    const bus = new AudioBus(name, { parent: parentBus, volume, muted });
    this.buses.set(name, bus);
    return bus;
  }
  /**
   * Get audio bus by name. Throws if missing.
   * @param {string} name
   * @returns {AudioBus}
   */
  getBus(name) {
    nonEmptyString(name, "name");
    if (!this.buses.has(name)) {
      throw new Error(`Audio bus "${name}" not found`);
    }
    return this.buses.get(name);
  }
  /**
   * Set volume for a bus, clamped strictly between 0 and 1.
   * Throws if volume is not a finite number.
   * @param {string} name
   * @param {number} volume
   */
  setVolume(name, volume) {
    finiteNumber(volume, "volume");
    const bus = this.getBus(name);
    bus.volume = Math.max(0, Math.min(1, volume));
    this._emit({ type: "volume", bus: name, volume: bus.volume, effective: bus.getEffectiveVolume() });
  }
  /**
   * Set mute state for a bus.
   * @param {string} name
   * @param {boolean} muted
   */
  setMuted(name, muted) {
    const bus = this.getBus(name);
    bus.muted = Boolean(muted);
    this._emit({ type: "mute", bus: name, muted: bus.muted, effective: bus.getEffectiveVolume() });
  }
  /**
   * Toggle mute state for a bus.
   * @param {string} name
   * @returns {boolean} New mute state
   */
  toggleMute(name) {
    const bus = this.getBus(name);
    this.setMuted(name, !bus.muted);
    return bus.muted;
  }
  /**
   * Get composed effective volume for a bus.
   * If the bus or any of its parents is muted, returns 0.0.
   * @param {string} name
   * @returns {number}
   */
  getEffectiveVolume(name) {
    return this.getBus(name).getEffectiveVolume();
  }
  /**
   * Check if a bus is muted directly or via any parent.
   * @param {string} name
   * @returns {boolean}
   */
  isMuted(name) {
    return this.getBus(name).isEffectivelyMuted();
  }
  /**
   * Export user audio preferences separately from game progress saves.
   * @returns {Object}
   */
  exportPreferences() {
    const prefs = {};
    for (const [name, bus] of this.buses.entries()) {
      prefs[name] = {
        volume: bus.volume,
        muted: bus.muted
      };
    }
    return prefs;
  }
  /**
   * Import user audio preferences. Can be called before audio unlock or scene loading.
   * @param {Object} prefs
   */
  importPreferences(prefs) {
    if (!prefs || typeof prefs !== "object") return;
    for (const [name, config] of Object.entries(prefs)) {
      if (this.buses.has(name) && config && typeof config === "object") {
        if (typeof config.volume === "number" && Number.isFinite(config.volume)) {
          this.buses.get(name).volume = Math.max(0, Math.min(1, config.volume));
        }
        if (typeof config.muted === "boolean") {
          this.buses.get(name).muted = config.muted;
        }
      }
    }
    this._emit({ type: "preferences-loaded" });
  }
  toJSON() {
    return this.exportPreferences();
  }
  static fromJSON(data) {
    const system = new _AudioBusSystem();
    system.importPreferences(data);
    return system;
  }
};

// src/core/versionedSave.js
var MapStorage = class {
  /**
   * @param {Array<Array<string>>} [initialEntries]
   */
  constructor(initialEntries) {
    this._map = new Map(initialEntries || []);
  }
  /**
   * @param {string} key
   * @returns {string|null}
   */
  getItem(key) {
    const k = String(key);
    return this._map.has(k) ? this._map.get(k) : null;
  }
  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    this._map.set(String(key), String(value));
  }
  /**
   * @param {string} key
   */
  removeItem(key) {
    this._map.delete(String(key));
  }
  clear() {
    this._map.clear();
  }
  /**
   * @param {number} index
   * @returns {string|null}
   */
  key(index) {
    return Array.from(this._map.keys())[index] || null;
  }
  /**
   * @returns {string[]}
   */
  keys() {
    return Array.from(this._map.keys());
  }
  /**
   * @returns {number}
   */
  get length() {
    return this._map.size;
  }
};
var FutureVersionError = class extends Error {
  /**
   * @param {number} saveVersion
   * @param {number} supportedVersion
   * @param {string} [customMessage]
   */
  constructor(saveVersion, supportedVersion, customMessage) {
    const msg = customMessage || `Save schema version (${saveVersion}) is newer than supported version (${supportedVersion}). Please update the application to load this save.`;
    super(msg);
    this.name = "FutureVersionError";
    this.code = "ERR_FUTURE_SCHEMA_VERSION";
    this.saveVersion = saveVersion;
    this.supportedVersion = supportedVersion;
    this.isFutureVersion = true;
  }
};
var ReferenceValidationError = class _ReferenceValidationError extends Error {
  /**
   * @param {Object|string} resultOrMessage
   * @param {Object} [details]
   */
  constructor(resultOrMessage, details) {
    const message = typeof resultOrMessage === "string" ? resultOrMessage : _ReferenceValidationError.formatMessage(resultOrMessage);
    super(message);
    this.name = "ReferenceValidationError";
    this.code = "ERR_REFERENCE_VALIDATION";
    if (resultOrMessage && typeof resultOrMessage === "object") {
      this.validationResult = resultOrMessage;
      this.errors = resultOrMessage.errors || [];
      this.duplicates = resultOrMessage.duplicates || { entities: [], components: [] };
      this.dangling = resultOrMessage.dangling || [];
    } else {
      const extra = details || {};
      this.errors = extra.errors || [message];
      this.duplicates = extra.duplicates || { entities: [], components: [] };
      this.dangling = extra.dangling || [];
    }
  }
  /**
   * Format a readable message from validation results.
   * @param {Object} result
   * @returns {string}
   */
  static formatMessage(result) {
    const parts = ["Reference validation failed:"];
    if (result && Array.isArray(result.errors) && result.errors.length > 0) {
      for (let i = 0; i < result.errors.length; i++) {
        parts.push(`  - ${result.errors[i]}`);
      }
    }
    return parts.join("\n");
  }
};
var MigrationError = class extends Error {
  /**
   * @param {string} message
   * @param {Object} [details]
   */
  constructor(message, details) {
    super(message);
    this.name = "MigrationError";
    this.code = "ERR_SCHEMA_MIGRATION";
    const info = details || {};
    this.fromVersion = info.fromVersion;
    this.toVersion = info.toVersion;
    this.step = info.step;
    this.cause = info.cause || null;
    this.aborted = true;
    this.originalStatePreserved = true;
  }
};
var CorruptSaveError = class extends Error {
  /**
   * @param {string} message
   * @param {Object} [details]
   */
  constructor(message, details) {
    super(message);
    this.name = "CorruptSaveError";
    this.code = "ERR_CORRUPT_SAVE_JSON";
    const info = details || {};
    this.line = info.line || 1;
    this.column = info.column || 1;
    this.position = info.position || 0;
    this.snippet = info.snippet || "";
    this.rawText = info.rawText || "";
    this.diagnostic = info.diagnostic || null;
  }
};
var SchemaMigrationRegistry = class {
  constructor() {
    this._migrations = /* @__PURE__ */ new Map();
  }
  /**
   * Register a migration step.
   * Can be called as register(fromVersion, toVersion, migrateFn, options)
   * or register(fromVersion, migrateFn, options) where toVersion = fromVersion + 1.
   *
   * @param {number} fromVersion
   * @param {number|Function} toVersionOrFn
   * @param {Function} [maybeFn]
   * @param {Object} [options]
   * @returns {SchemaMigrationRegistry}
   */
  register(fromVersion, toVersionOrFn, maybeFn, options) {
    if (!Number.isInteger(fromVersion)) {
      throw new TypeError("fromVersion must be an integer.");
    }
    let toVersion;
    let migrateFn;
    let stepOptions = options || {};
    if (typeof toVersionOrFn === "function") {
      toVersion = fromVersion + 1;
      migrateFn = toVersionOrFn;
      if (typeof maybeFn === "object" && maybeFn !== null) {
        stepOptions = maybeFn;
      }
    } else if (Number.isInteger(toVersionOrFn) && typeof maybeFn === "function") {
      toVersion = toVersionOrFn;
      migrateFn = maybeFn;
    } else {
      throw new TypeError("Invalid migration arguments: expected (fromVersion, toVersion, migrateFn) or (fromVersion, migrateFn).");
    }
    if (toVersion <= fromVersion) {
      throw new RangeError(`Migration target version (${toVersion}) must be greater than source version (${fromVersion}).`);
    }
    this._migrations.set(fromVersion, {
      fromVersion,
      toVersion,
      migrate: migrateFn,
      verify: stepOptions.verify || null,
      description: stepOptions.description || `Migration from v${fromVersion} to v${toVersion}`
    });
    return this;
  }
  /**
   * Check if a migration is registered from fromVersion.
   * @param {number} fromVersion
   * @returns {boolean}
   */
  has(fromVersion) {
    return this._migrations.has(fromVersion);
  }
  /**
   * Get migration step starting from fromVersion.
   * @param {number} fromVersion
   * @returns {Object|null}
   */
  get(fromVersion) {
    return this._migrations.get(fromVersion) || null;
  }
  /**
   * Plan sequential migration steps from sourceVersion to targetVersion.
   * @param {number} fromVersion
   * @param {number} targetVersion
   * @returns {Array<Object>}
   */
  getPlan(fromVersion, targetVersion) {
    if (!Number.isInteger(fromVersion) || !Number.isInteger(targetVersion)) {
      throw new TypeError("Schema versions must be integers.");
    }
    if (fromVersion > targetVersion) {
      throw new RangeError(`Cannot migrate backward from v${fromVersion} to v${targetVersion}.`);
    }
    if (fromVersion === targetVersion) {
      return [];
    }
    const plan = [];
    let current = fromVersion;
    while (current < targetVersion) {
      const step = this._migrations.get(current);
      if (!step) {
        throw new Error(`No migration registered from schema version ${current} to reach supported version ${targetVersion}.`);
      }
      if (step.toVersion > targetVersion) {
        throw new Error(`Migration step from v${current} targets v${step.toVersion}, which exceeds target version ${targetVersion}.`);
      }
      plan.push(step);
      current = step.toVersion;
    }
    return plan;
  }
  /**
   * Clear all registered migrations.
   */
  clear() {
    this._migrations.clear();
  }
};
var ReferenceValidator = class _ReferenceValidator {
  /**
   * @param {Object} [options]
   */
  constructor(options) {
    const opts = options || {};
    this.referenceFields = opts.referenceFields || [
      "parentId",
      "parent",
      "targetId",
      "targetEntityId",
      "entityId",
      "followTargetId",
      "ownerId"
    ];
    this.throwOnError = opts.throwOnError || false;
  }
  /**
   * Static shortcut to validate references on data.
   * @param {Object} data
   * @param {Object} [options]
   * @returns {Object}
   */
  static validate(data, options) {
    const validator = new _ReferenceValidator(options);
    return validator.validate(data, options);
  }
  /**
   * Validate data for duplicate entity/component IDs and dangling references.
   * @param {Object} data
   * @param {Object} [options]
   * @returns {Object}
   */
  validate(data, options) {
    const opts = options || {};
    const shouldThrow = opts.throwOnError !== void 0 ? opts.throwOnError : this.throwOnError;
    const allEntities = [];
    const allComponents = [];
    const entityMap = /* @__PURE__ */ new Map();
    const componentMap = /* @__PURE__ */ new Map();
    const duplicateEntityIds = /* @__PURE__ */ new Set();
    const duplicateComponentIds = /* @__PURE__ */ new Set();
    const dangling = [];
    const visited = /* @__PURE__ */ new Set();
    function visitEntity(ent) {
      if (!ent || typeof ent !== "object" || visited.has(ent)) return;
      visited.add(ent);
      allEntities.push(ent);
      if (ent.id !== void 0 && ent.id !== null) {
        const idStr = String(ent.id);
        if (entityMap.has(idStr)) {
          duplicateEntityIds.add(idStr);
        } else {
          entityMap.set(idStr, ent);
        }
      }
      if (Array.isArray(ent.components)) {
        for (let i = 0; i < ent.components.length; i++) {
          const comp = ent.components[i];
          if (comp && typeof comp === "object") {
            allComponents.push({ component: comp, entity: ent });
            if (comp.id !== void 0 && comp.id !== null) {
              const cidStr = String(comp.id);
              if (componentMap.has(cidStr)) {
                duplicateComponentIds.add(cidStr);
              } else {
                componentMap.set(cidStr, { component: comp, entity: ent });
              }
            }
          }
        }
      } else if (ent.components && typeof ent.components === "object") {
        for (const key of Object.keys(ent.components)) {
          const comp = ent.components[key];
          if (comp && typeof comp === "object") {
            allComponents.push({ component: comp, entity: ent });
            if (comp.id !== void 0 && comp.id !== null) {
              const cidStr = String(comp.id);
              if (componentMap.has(cidStr)) {
                duplicateComponentIds.add(cidStr);
              } else {
                componentMap.set(cidStr, { component: comp, entity: ent });
              }
            }
          }
        }
      }
      if (Array.isArray(ent.children)) {
        for (let i = 0; i < ent.children.length; i++) {
          const child = ent.children[i];
          if (child && typeof child === "object") {
            visitEntity(child);
          }
        }
      }
    }
    function scan(obj) {
      if (!obj || typeof obj !== "object" || visited.has(obj)) return;
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const item = obj[i];
          if (item && typeof item === "object") {
            if (item.id !== void 0 && (item.components !== void 0 || item.children !== void 0 || item.parentId !== void 0 || item.parent !== void 0 || item.type === "Entity" || item.name !== void 0)) {
              visitEntity(item);
            } else {
              scan(item);
            }
          }
        }
        return;
      }
      if (Array.isArray(obj.entities)) {
        for (let i = 0; i < obj.entities.length; i++) {
          visitEntity(obj.entities[i]);
        }
      }
      if (Array.isArray(obj.children)) {
        for (let i = 0; i < obj.children.length; i++) {
          if (obj.children[i] && typeof obj.children[i] === "object") {
            visitEntity(obj.children[i]);
          }
        }
      }
      if (obj.state && typeof obj.state === "object") scan(obj.state);
      if (obj.scene && typeof obj.scene === "object") scan(obj.scene);
      if (obj.data && typeof obj.data === "object") scan(obj.data);
      if (obj.id !== void 0 && (obj.components !== void 0 || obj.children !== void 0 || obj.parentId !== void 0 || obj.parent !== void 0)) {
        visitEntity(obj);
      }
    }
    scan(data);
    for (let i = 0; i < allEntities.length; i++) {
      const ent = allEntities[i];
      const entId = ent.id !== void 0 ? String(ent.id) : `[anonymous entity #${i}]`;
      const parentRef = ent.parentId !== void 0 && ent.parentId !== null && ent.parentId !== "" ? ent.parentId : typeof ent.parent === "string" && ent.parent !== "" ? ent.parent : null;
      if (parentRef !== null && parentRef !== void 0) {
        const targetId = String(parentRef);
        if (ent.id !== void 0 && String(ent.id) === targetId) {
          dangling.push({
            sourceId: entId,
            sourceType: "entity",
            field: "parentId",
            targetId,
            message: `Entity '${entId}' has cyclic self-referencing parentId '${targetId}'.`
          });
        } else if (!entityMap.has(targetId)) {
          dangling.push({
            sourceId: entId,
            sourceType: "entity",
            field: "parentId",
            targetId,
            message: `Entity '${entId}' references non-existent parentId '${targetId}'.`
          });
        }
      }
      for (let f = 0; f < this.referenceFields.length; f++) {
        const field = this.referenceFields[f];
        if (field === "parentId" || field === "parent") continue;
        if (ent[field] !== void 0 && ent[field] !== null && ent[field] !== "") {
          const targetId = String(ent[field]);
          if (!entityMap.has(targetId) && !componentMap.has(targetId)) {
            dangling.push({
              sourceId: entId,
              sourceType: "entity",
              field,
              targetId,
              message: `Entity '${entId}' has dangling reference in '${field}' pointing to non-existent '${targetId}'.`
            });
          }
        }
      }
    }
    for (let i = 0; i < allComponents.length; i++) {
      const { component, entity } = allComponents[i];
      const sourceId = component.id !== void 0 ? String(component.id) : entity?.id ? String(entity.id) : `[component #${i}]`;
      const compLabel = component.id ? `Component '${component.id}'` : `Component on entity '${entity?.id}'`;
      for (let f = 0; f < this.referenceFields.length; f++) {
        const field = this.referenceFields[f];
        if (component[field] !== void 0 && component[field] !== null && component[field] !== "") {
          const targetId = String(component[field]);
          if (!entityMap.has(targetId) && !componentMap.has(targetId)) {
            dangling.push({
              sourceId,
              sourceType: "component",
              field,
              targetId,
              message: `${compLabel} has dangling reference in '${field}' pointing to non-existent '${targetId}'.`
            });
          }
        }
      }
    }
    const errors = [];
    for (const id of duplicateEntityIds) {
      errors.push(`Duplicate entity ID detected: '${id}'.`);
    }
    for (const id of duplicateComponentIds) {
      errors.push(`Duplicate component ID detected: '${id}'.`);
    }
    for (let i = 0; i < dangling.length; i++) {
      errors.push(dangling[i].message);
    }
    const result = {
      valid: errors.length === 0,
      errors,
      duplicates: {
        entities: Array.from(duplicateEntityIds),
        components: Array.from(duplicateComponentIds)
      },
      dangling,
      entityCount: allEntities.length,
      componentCount: allComponents.length
    };
    if (!result.valid && shouldThrow) {
      throw new ReferenceValidationError(result);
    }
    return result;
  }
};
var VersionedSaveEngine = class {
  /**
   * @param {Object} [options]
   */
  constructor(options) {
    const opts = options || {};
    this.currentVersion = Number.isInteger(opts.currentVersion) ? opts.currentVersion : 1;
    this.storage = opts.storage !== void 0 ? opts.storage : typeof globalThis.localStorage !== "undefined" ? globalThis.localStorage : new MapStorage();
    this.prefix = opts.prefix || "neptune.save";
    this.validateReferences = opts.validateReferences !== void 0 ? Boolean(opts.validateReferences) : true;
    this.autoRecoverCorrupt = opts.autoRecoverCorrupt !== void 0 ? Boolean(opts.autoRecoverCorrupt) : true;
    this.migrationRegistry = opts.migrations instanceof SchemaMigrationRegistry ? opts.migrations : new SchemaMigrationRegistry();
    if (opts.migrations && !(opts.migrations instanceof SchemaMigrationRegistry)) {
      if (Array.isArray(opts.migrations)) {
        for (let i = 0; i < opts.migrations.length; i++) {
          const m = opts.migrations[i];
          this.migrationRegistry.register(m.from, m.to, m.migrate, m);
        }
      } else if (typeof opts.migrations === "object") {
        for (const key of Object.keys(opts.migrations)) {
          const fromV = Number.parseInt(key, 10);
          if (Number.isInteger(fromV)) {
            const val = opts.migrations[key];
            if (typeof val === "function") {
              this.migrationRegistry.register(fromV, val);
            } else if (val && typeof val === "object" && typeof val.migrate === "function") {
              this.migrationRegistry.register(fromV, val.to || fromV + 1, val.migrate, val);
            }
          }
        }
      }
    }
    this.validator = opts.validator instanceof ReferenceValidator ? opts.validator : new ReferenceValidator(opts.validator);
  }
  /**
   * Build storage key for a save slot.
   * @param {string} slot
   * @returns {string}
   */
  key(slot) {
    if (typeof slot !== "string" || !slot.trim()) {
      throw new TypeError("Save slot must be a non-empty string.");
    }
    return `${this.prefix}.${encodeURIComponent(slot)}`;
  }
  /**
   * Register a schema migration.
   * @param {number} fromVersion
   * @param {number|Function} toVersionOrFn
   * @param {Function} [maybeFn]
   * @param {Object} [options]
   * @returns {VersionedSaveEngine}
   */
  registerMigration(fromVersion, toVersionOrFn, maybeFn, options) {
    this.migrationRegistry.register(fromVersion, toVersionOrFn, maybeFn, options);
    return this;
  }
  /**
   * Diagnose a corrupt JSON string and produce line, column, snippet, and reason.
   * @param {string} rawText
   * @param {Error} [syntaxError]
   * @returns {Object}
   */
  diagnoseCorruptJson(rawText, syntaxError) {
    if (typeof rawText !== "string") {
      return {
        position: 0,
        line: 1,
        column: 1,
        snippet: "",
        reason: "Input is not a string",
        message: "Corrupt JSON: input is not a string."
      };
    }
    const errMessage = syntaxError ? syntaxError.message : "";
    let position = null;
    const posMatch = errMessage.match(/position\s+(\d+)/i);
    if (posMatch) {
      position = Number.parseInt(posMatch[1], 10);
    } else {
      const lineColMatch = errMessage.match(/(\d+):(\d+)/);
      if (lineColMatch) {
        const targetLine = Number.parseInt(lineColMatch[1], 10);
        const targetCol = Number.parseInt(lineColMatch[2], 10);
        const lines2 = rawText.split("\n");
        let charCount = 0;
        for (let i = 0; i < targetLine - 1 && i < lines2.length; i++) {
          charCount += lines2[i].length + 1;
        }
        position = charCount + targetCol - 1;
      }
    }
    if (position === null || position >= rawText.length) {
      if (/unexpected end/i.test(errMessage)) {
        position = Math.max(0, rawText.length);
      } else {
        position = 0;
      }
    }
    const lines = rawText.split("\n");
    let currentPos = 0;
    let line = 1;
    let column = 1;
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length + 1;
      if (currentPos + lineLen > position || i === lines.length - 1) {
        line = i + 1;
        column = Math.max(1, position - currentPos + 1);
        break;
      }
      currentPos += lineLen;
    }
    const lineContent = lines[line - 1] || "";
    const prefix = `Line ${line}: `;
    const pointerIndent = " ".repeat(prefix.length + Math.max(0, Math.min(column - 1, lineContent.length)));
    const snippet = `${prefix}${lineContent}
${pointerIndent}^`;
    let reason = "Syntax error in JSON string.";
    if (/unexpected end/i.test(errMessage)) {
      reason = "Unexpected end of JSON input. The file was likely truncated during an interrupted save or crash.";
    } else if (/,(\s*[}\]])/.test(rawText)) {
      reason = "Illegal trailing comma before closing brace or bracket.";
    } else if (/'[^']*'/.test(rawText)) {
      reason = "Single quotes used instead of double quotes.";
    } else if (/expected property name/i.test(errMessage) || /expected double-quoted/i.test(errMessage)) {
      reason = "Unquoted or improperly quoted object property key.";
    }
    const message = `Corrupt JSON at line ${line}, column ${column}: ${reason}
${snippet}`;
    return {
      position,
      line,
      column,
      snippet,
      reason,
      message,
      rawText,
      cause: syntaxError || null
    };
  }
  /**
   * Repair truncated JSON strings by closing open quotes and brackets.
   * @param {string} text
   * @returns {string|null}
   * @private
   */
  #repairTruncatedJson(text) {
    if (!text || typeof text !== "string") return null;
    const s = text.trim();
    if (!s) return null;
    let inString = false;
    let escaped = false;
    const stack = [];
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
      } else {
        if (char === '"') {
          inString = true;
        } else if (char === "{" || char === "[") {
          stack.push(char);
        } else if (char === "}") {
          if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
        } else if (char === "]") {
          if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
        }
      }
    }
    let repaired = s;
    if (inString) {
      repaired += '"';
    }
    repaired = repaired.replace(/,\s*$/, "");
    repaired = repaired.replace(/,(\s*[}\]])/g, "$1");
    while (stack.length > 0) {
      const open = stack.pop();
      repaired = repaired.replace(/,\s*$/, "");
      if (open === "{") repaired += "}";
      else if (open === "[") repaired += "]";
    }
    return repaired;
  }
  /**
   * Attempt recovery of corrupt JSON through heuristics and fallback backups.
   * @param {string} rawText
   * @param {Object} [options]
   * @returns {Object}
   */
  recoverCorruptJson(rawText, options) {
    if (typeof rawText !== "string") {
      throw new TypeError("rawText must be a string.");
    }
    const opts = options || {};
    try {
      const parsed = JSON.parse(rawText);
      return {
        recovered: false,
        data: parsed,
        strategy: "none",
        message: "JSON is already valid."
      };
    } catch (parseError) {
      const diagnostic = this.diagnoseCorruptJson(rawText, parseError);
      if (opts.backupText && typeof opts.backupText === "string") {
        try {
          const backupData = JSON.parse(opts.backupText);
          return {
            recovered: true,
            data: backupData,
            strategy: "backup_slot",
            diagnostic,
            message: "Recovered from backup slot."
          };
        } catch (_) {
        }
      }
      const trailingCleaned = rawText.replace(/,(\s*[}\]])/g, "$1");
      if (trailingCleaned !== rawText) {
        try {
          const data = JSON.parse(trailingCleaned);
          return {
            recovered: true,
            data,
            strategy: "trailing_comma_cleanup",
            diagnostic,
            message: "Recovered by removing trailing commas."
          };
        } catch (_) {
        }
      }
      const quoteNormalized = rawText.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"').replace(/,(\s*[}\]])/g, "$1");
      if (quoteNormalized !== rawText) {
        try {
          const data = JSON.parse(quoteNormalized);
          return {
            recovered: true,
            data,
            strategy: "quote_normalization",
            diagnostic,
            message: "Recovered by converting single quotes to double quotes."
          };
        } catch (_) {
        }
      }
      const repaired = this.#repairTruncatedJson(rawText);
      if (repaired !== null) {
        try {
          const data = JSON.parse(repaired);
          return {
            recovered: true,
            data,
            strategy: "truncated_json_repair",
            diagnostic,
            message: "Recovered truncated JSON by safely closing open structures."
          };
        } catch (_) {
        }
      }
      if (opts.throwOnError !== false) {
        throw new CorruptSaveError(diagnostic.message, diagnostic);
      }
      return {
        recovered: false,
        data: null,
        strategy: "failed",
        diagnostic,
        message: "Could not recover corrupt JSON."
      };
    }
  }
  /**
   * Migrate a save record through sequential registered schema migrations.
   * Enforces step verification and atomic abort on errors.
   *
   * @param {Object} record
   * @param {number} [targetVersion]
   * @returns {Object}
   */
  migrate(record, targetVersion) {
    if (!record || typeof record !== "object") {
      throw new TypeError("Save record must be an object.");
    }
    const destVersion = Number.isInteger(targetVersion) ? targetVersion : this.currentVersion;
    const sourceVersion = record.schemaVersion !== void 0 ? record.schemaVersion : record.version !== void 0 ? record.version : null;
    if (sourceVersion === null || sourceVersion === void 0) {
      throw new Error("Save record is missing schemaVersion.");
    }
    if (!Number.isInteger(sourceVersion)) {
      throw new TypeError(`Invalid schemaVersion: expected integer, got ${sourceVersion}.`);
    }
    if (sourceVersion > destVersion) {
      throw new FutureVersionError(sourceVersion, destVersion);
    }
    if (sourceVersion === destVersion) {
      return structuredClone(record);
    }
    const plan = this.migrationRegistry.getPlan(sourceVersion, destVersion);
    let currentRecord = structuredClone(record);
    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      const snapshotBeforeStep = structuredClone(currentRecord);
      let migrated;
      try {
        migrated = step.migrate(snapshotBeforeStep, {
          fromVersion: step.fromVersion,
          toVersion: step.toVersion
        });
      } catch (err) {
        throw new MigrationError(
          `Migration failed at step v${step.fromVersion} -> v${step.toVersion}: ${err.message}`,
          {
            fromVersion: step.fromVersion,
            toVersion: step.toVersion,
            step: i + 1,
            cause: err
          }
        );
      }
      if (!migrated || typeof migrated !== "object") {
        throw new MigrationError(
          `Step verification failed at step v${step.fromVersion} -> v${step.toVersion}: migration returned non-object.`,
          { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1 }
        );
      }
      const stepResultVersion = migrated.schemaVersion !== void 0 ? migrated.schemaVersion : migrated.version !== void 0 ? migrated.version : null;
      if (stepResultVersion !== step.toVersion) {
        throw new MigrationError(
          `Step verification failed at step v${step.fromVersion} -> v${step.toVersion}: expected schemaVersion ${step.toVersion}, got ${stepResultVersion}.`,
          { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1 }
        );
      }
      if (typeof step.verify === "function") {
        let verified = false;
        try {
          verified = step.verify(migrated);
        } catch (verifyErr) {
          throw new MigrationError(
            `Step verification threw an error at step v${step.fromVersion} -> v${step.toVersion}: ${verifyErr.message}`,
            { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1, cause: verifyErr }
          );
        }
        if (verified === false) {
          throw new MigrationError(
            `Step verification failed custom check at step v${step.fromVersion} -> v${step.toVersion}.`,
            { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1 }
          );
        }
      }
      currentRecord = migrated;
    }
    return currentRecord;
  }
  /**
   * Validate references on entities and components.
   * @param {Object} data
   * @param {Object} [options]
   * @returns {Object}
   */
  validate(data, options) {
    return this.validator.validate(data, options);
  }
  /**
   * Save data into a named storage slot with backup and reference validation.
   * @param {string} slot
   * @param {Object} data
   * @param {Object} [options]
   * @returns {Object}
   */
  save(slot, data, options) {
    const opts = options || {};
    if (typeof slot !== "string" || !slot.trim()) {
      throw new TypeError("Save slot must be a non-empty string.");
    }
    if (!data || typeof data !== "object") {
      throw new TypeError("Game state to save must be an object.");
    }
    const shouldValidate = opts.validateReferences !== void 0 ? opts.validateReferences : this.validateReferences;
    if (shouldValidate) {
      this.validator.validate(data, { throwOnError: true });
    }
    const clonedData = structuredClone(data);
    const record = Array.isArray(clonedData) ? {
      schemaVersion: this.currentVersion,
      savedAt: Date.now(),
      entities: clonedData
    } : {
      schemaVersion: this.currentVersion,
      savedAt: Date.now(),
      ...clonedData
    };
    let text;
    try {
      text = JSON.stringify(record, null, opts.pretty ? 2 : 0);
    } catch (err) {
      throw new Error(`Failed to serialize save data: ${err.message}`);
    }
    const key = this.key(slot);
    if (this.storage) {
      const existing = this.storage.getItem(key);
      if (existing !== null) {
        this.storage.setItem(`${key}.bak`, existing);
      }
      this.storage.setItem(key, text);
    }
    return record;
  }
  /**
   * Load, migrate, and validate save data from a slot or raw JSON text.
   * @param {string|Object} slotOrRaw
   * @param {Object} [options]
   * @returns {Object|null}
   */
  load(slotOrRaw, options) {
    const opts = options || {};
    const shouldValidate = opts.validateReferences !== void 0 ? opts.validateReferences : this.validateReferences;
    const autoRecover = opts.autoRecoverCorrupt !== void 0 ? opts.autoRecoverCorrupt : this.autoRecoverCorrupt;
    let rawText = null;
    let slotKey = null;
    let parsedRecord = null;
    if (typeof slotOrRaw === "string") {
      const trimmed = slotOrRaw.trim();
      if (opts.raw === true || trimmed.startsWith("{") || trimmed.startsWith("[")) {
        rawText = slotOrRaw;
      } else {
        slotKey = this.key(slotOrRaw);
        const stored = this.storage ? this.storage.getItem(slotKey) : null;
        if (stored !== null) {
          rawText = stored;
        } else if (/[\s{}[\]"':]/.test(trimmed)) {
          rawText = slotOrRaw;
        } else {
          if (opts.required) {
            throw new Error(`Save slot '${slotOrRaw}' does not exist.`);
          }
          return null;
        }
      }
    } else if (slotOrRaw && typeof slotOrRaw === "object") {
      parsedRecord = slotOrRaw;
    } else {
      throw new TypeError("load() expects a slot name string, raw JSON string, or object.");
    }
    if (rawText !== null) {
      let backupText = null;
      if (slotKey && this.storage) {
        backupText = this.storage.getItem(`${slotKey}.bak`);
      }
      if (autoRecover) {
        const recovery = this.recoverCorruptJson(rawText, {
          backupText,
          throwOnError: true
        });
        parsedRecord = recovery.data;
      } else {
        try {
          parsedRecord = JSON.parse(rawText);
        } catch (err) {
          const diag = this.diagnoseCorruptJson(rawText, err);
          throw new CorruptSaveError(diag.message, diag);
        }
      }
    }
    if (!parsedRecord || typeof parsedRecord !== "object") {
      throw new CorruptSaveError("Save data is empty or not a valid object.");
    }
    const targetVersion = Number.isInteger(opts.targetVersion) ? opts.targetVersion : this.currentVersion;
    const migratedRecord = this.migrate(parsedRecord, targetVersion);
    if (shouldValidate) {
      this.validator.validate(migratedRecord, { throwOnError: true });
    }
    if (opts.returnRecord || opts.returnEnvelope) {
      return migratedRecord;
    }
    return migratedRecord;
  }
  /**
   * List all save slots currently present in storage.
   * @returns {string[]}
   */
  slots() {
    if (!this.storage) return [];
    const keys = typeof this.storage.keys === "function" ? this.storage.keys() : Array.from({ length: this.storage.length || 0 }, (_, i) => this.storage.key(i));
    const prefixDot = `${this.prefix}.`;
    return keys.filter((k) => k && k.startsWith(prefixDot) && !k.endsWith(".bak")).map((k) => decodeURIComponent(k.slice(prefixDot.length)));
  }
  /**
   * Remove a save slot and its backup from storage.
   * @param {string} slot
   */
  remove(slot) {
    if (!this.storage) return;
    const key = this.key(slot);
    this.storage.removeItem(key);
    this.storage.removeItem(`${key}.bak`);
  }
  /**
   * Check if a save slot exists in storage.
   * @param {string} slot
   * @returns {boolean}
   */
  has(slot) {
    if (!this.storage) return false;
    return this.storage.getItem(this.key(slot)) !== null;
  }
};

// src/core/application.js
var sceneLoadGenerations = /* @__PURE__ */ new WeakMap();
var Application = class {
  #playBtn;
  #canvas;
  #ctx;
  #currentTimeStamp;
  #width;
  #height;
  #clearColor;
  #fps;
  #initialCanvasSize = { width: 0, height: 0 };
  #isRunning = false;
  #playGeneration = 0;
  #authoredUI = null;
  #authoredUIScene = null;
  #fixedStepper = new FixedStepper();
  #worldFacts = new WorldFacts();
  #eventBus = new TypedEventBus();
  #ruleEngine = new RuleEngine({ facts: this.#worldFacts, bus: this.#eventBus });
  #audioBuses = new AudioBusSystem();
  #versionedSave = new VersionedSaveEngine();
  #isInitialized = false;
  /**
   *  @private
   */
  constructor() {
    this.#pageSetup();
    document.getElementById("neptune-loading")?.remove();
    this.#width = window.innerWidth;
    this.#height = window.innerHeight;
    this.#initialCanvasSize = { width: window.outerWidth, height: window.outerHeight };
    this.#fps = 60;
    this.#clearColor = Color.FromHex(3359829);
    this.#canvas = document.getElementById("neptune-canvas");
    this.#canvas.setAttribute("height", window.innerHeight);
    this.#canvas.setAttribute("width", window.innerWidth);
    this.#canvas.style.display = "none";
    this.#canvas.focus();
    this.#ctx = this.#canvas.getContext("2d");
    this.#playBtn = document.getElementById("neptune-play");
    this.#playBtn.style.display = "block";
    this.#playBtn.onclick = () => {
      this.start();
    };
    this.#currentTimeStamp = performance.now();
    this._deltaTime = 0;
    window.addEventListener("neptune:ui-capture", (event) => {
      this.#authoredUI?.setCapture(Boolean(event.detail?.enabled));
    });
  }
  get width() {
    return this.#width;
  }
  get height() {
    return this.#height;
  }
  get fps() {
    return this.#fps;
  }
  set fps(value) {
    this.#fps = value;
  }
  get clearColor() {
    return this.#clearColor;
  }
  set clearColor(value) {
    this.#clearColor = value;
  }
  get deltaTime() {
    return this._deltaTime;
  }
  get isRunning() {
    return this.#isRunning;
  }
  get worldFacts() {
    return this.#worldFacts;
  }
  get eventBus() {
    return this.#eventBus;
  }
  get ruleEngine() {
    return this.#ruleEngine;
  }
  get audioBuses() {
    return this.#audioBuses;
  }
  get versionedSave() {
    return this.#versionedSave;
  }
  #init() {
    this.#canvas.setAttribute("height", window.innerHeight);
    this.#canvas.setAttribute("width", window.innerWidth);
    window.onresize = () => {
      this.#width = window.innerWidth;
      this.#height = window.innerHeight;
      this.#canvas.width = this.#width;
      this.#canvas.height = this.#height;
    };
    this.#canvas.focus();
    MouseInput.init(this.#canvas);
    KeyboardInput.init(this.#canvas);
    TouchInput.init(this.#canvas);
    SceneManager.init();
    ScriptManager.behaviourInit();
  }
  /**
   * Start the application (public method)
   */
  start() {
    if (this.#isRunning) return;
    if (this.#playBtn) this.#playBtn.remove();
    document.getElementById("neptune-gamepage")?.remove();
    this.#canvas.setAttribute("tabindex", "1");
    this.#canvas.style.display = "block";
    this.#canvas.focus();
    this.#width = window.innerWidth;
    this.#height = window.innerHeight;
    this.#initialCanvasSize = { width: window.outerWidth, height: window.outerHeight };
    if (!this.#isInitialized) {
      this.#init();
      this.#isInitialized = true;
    }
    this.#fixedStepper.reset();
    this.#currentTimeStamp = null;
    this.#isRunning = true;
    this.#gameloop(0, ++this.#playGeneration);
  }
  /**
   * Pause the game logic (updates). Rendering continues.
   */
  pause() {
    this.isPaused = true;
    this.#fixedStepper.reset();
    KeyboardInput.clear();
  }
  /**
   * Resume the game logic.
   */
  resume() {
    this.isPaused = false;
    this.#currentTimeStamp = null;
  }
  /** Stop the game loop. Calling start() later resumes the existing instance. */
  stop() {
    this.isPaused = false;
    this.#isRunning = false;
    this.#playGeneration++;
    this.#fixedStepper.reset();
    KeyboardInput.reset();
    MouseInput.clear();
    TouchInput.clear();
  }
  /**
   * Get the active scene.
   */
  get scene() {
    return SceneManager.GetActiveScene();
  }
  /** Clear editor project state and invalidate asynchronous scene loads. */
  resetProject() {
    this.stop();
    this.#authoredUI?.dispose();
    this.#authoredUI = null;
    this.#authoredUIScene = null;
    sceneLoadGenerations.set(this, (sceneLoadGenerations.get(this) || 0) + 1);
    for (const scene of SceneManager.GetScenes()) {
      scene.active = false;
      for (const child of [...scene.children]) child.destroy();
      for (const component of scene.components) component.destroy();
    }
    SceneManager.removeAllScenes();
    this.#ctx.clearRect(0, 0, this.#width, this.#height);
  }
  /**
   * Load a scene via the application (editor helper).
   * @param {string} path 
   */
  async loadScene(pathOrData) {
    const generation = (sceneLoadGenerations.get(this) || 0) + 1;
    sceneLoadGenerations.set(this, generation);
    console.log("Application: Loading Scene", typeof pathOrData === "string" ? pathOrData : "from Data");
    try {
      const { SceneLoader: SceneLoader2 } = await Promise.resolve().then(() => (init_sceneLoader(), sceneLoader_exports));
      let data;
      if (typeof pathOrData === "string") {
        const response = await fetch(pathOrData);
        data = await response.json();
      } else {
        data = pathOrData;
      }
      const newScene = await SceneLoader2.parse(data);
      if (generation !== sceneLoadGenerations.get(this)) {
        SceneManager.removeScene(newScene);
        newScene.destroy();
        return false;
      }
      const previousScene = this.scene;
      SceneManager.replaceScene(newScene);
      SceneManager.LoadScene(newScene.id);
      if (previousScene && previousScene !== newScene && previousScene.id === newScene.id) {
        SceneManager.removeScene(previousScene);
        previousScene.destroy();
      }
      return true;
    } catch (e) {
      if (generation !== sceneLoadGenerations.get(this)) return false;
      console.error("Application: Failed to load scene", e);
      throw e;
    }
  }
  #draw(ctx2) {
    SceneManager.draw(ctx2);
    const scene = this.scene;
    if (globalThis.__NEPTUNE_EDITOR_PREVIEW__ === true) {
      this.#authoredUI?.dispose();
      this.#authoredUI = null;
      this.#authoredUIScene = scene || null;
      return;
    }
    if (scene !== this.#authoredUIScene) {
      this.#authoredUI?.dispose();
      this.#authoredUI = null;
      this.#authoredUIScene = scene || null;
      if (scene?.ui?.elements?.length) {
        this.#authoredUI = mountAuthoredUI(document.body, scene.ui, { mode: "game", captureInput: false });
      }
    }
  }
  #update(timeStamp) {
    ScriptManager.behaviourUpdate(timeStamp);
  }
  #gameloop(timeStamp, generation) {
    if (!this.#isRunning || generation !== this.#playGeneration) return;
    const frameDelta = this.#currentTimeStamp === null ? 0 : Math.max(0, (timeStamp - this.#currentTimeStamp) / 1e3);
    this.#currentTimeStamp = timeStamp;
    this.#ctx.clearRect(0, 0, this.#width, this.#height);
    this.#ctx.fillStyle = this.#clearColor.toString() || Color.darkgray;
    this.#ctx.fillRect(0, 0, this.#width, this.#height);
    if (!this.isPaused) {
      this.#fixedStepper.advance(frameDelta, (fixedDelta) => {
        this._deltaTime = fixedDelta;
        this.#update(fixedDelta);
        MouseInput.clear();
        KeyboardInput.clear();
        TouchInput.clear();
        DestroyQueue.destroy();
      });
    } else {
      this.#fixedStepper.reset();
      MouseInput.clear();
      KeyboardInput.clear();
      TouchInput.clear();
    }
    this.#draw(this.#ctx);
    if (this.#isRunning && generation === this.#playGeneration) {
      requestAnimationFrame((nextTimeStamp) => this.#gameloop(nextTimeStamp, generation));
    }
  }
  #pageSetup() {
    let playBtn = document.getElementById("neptune-play");
    if (!playBtn) {
      playBtn = document.createElement("button");
      playBtn.setAttribute("type", "button");
      playBtn.setAttribute("id", "neptune-play");
      playBtn.textContent = "Play Game";
      document.body.appendChild(playBtn);
    }
    let canvas2 = document.getElementById("neptune-canvas");
    if (!canvas2) {
      canvas2 = document.createElement("canvas");
      canvas2.setAttribute("id", "neptune-canvas");
      document.body.appendChild(canvas2);
    }
    if (!document.getElementById("neptune-style")) {
      let style = document.createElement("style");
      style.id = "neptune-style";
      style.innerHTML = `
body {
    margin: 0;
    padding: 0;
    overflow: hidden;
}
#neptune-play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #334455;
    color: white;
    border: none;
    padding: 20px;
    font-size: 20px;
    cursor: pointer;
    display: none;
}

#neptune-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
}
    `;
      document.head.appendChild(style);
    }
  }
};

// src/neptune.js
init_storage();
init_filter();
init_entity();
init_scene();
init_sceneManager();
init_component();
init_transform();

// src/components/boxCollider.js
init_component();
init_vec2();
var BoxCollider = class extends Component {
  constructor(width = 1, height = 1, offsetX = 0, offsetY = 0) {
    super();
    this._properties.size = new Vector2(width, height);
    this._properties.offset = new Vector2(offsetX, offsetY);
  }
  get size() {
    return this._properties.size;
  }
  set size(val) {
    this._properties.size = val;
  }
  get offset() {
    return this._properties.offset;
  }
  set offset(val) {
    this._properties.offset = val;
  }
  deserialize(props) {
    if (props.size) this.size = new Vector2(props.size.x, props.size.y);
    if (props.offset) this.offset = new Vector2(props.offset.x, props.offset.y);
    if (props.offsetX !== void 0) this.offset.x = props.offsetX;
    if (props.offsetY !== void 0) this.offset.y = props.offsetY;
    if (props.width !== void 0) this.size.x = props.width;
    if (props.height !== void 0) this.size.y = props.height;
  }
};

// src/components/dialogue.js
init_component();
var Dialogue = class extends Component {
  constructor(entity = null) {
    super(entity);
    this._properties = {
      speaker: "",
      text: "",
      next: ""
    };
  }
};

// src/components/questDefinition.js
init_component();
var QuestDefinition = class extends Component {
  constructor(entity = null) {
    super(entity);
    this._properties = {
      name: "New Quest",
      description: "Describe the quest...",
      objectiveId: "objective-1",
      objective: "Describe the objective...",
      required: 1
    };
  }
};

// src/components/enemyConfig.js
init_component();
var EnemyConfig = class extends Component {
  constructor(entity = null) {
    super(entity);
    this._properties = {
      maxHealth: 100,
      moveSpeed: 2,
      contactDamage: 10,
      behavior: "patrol"
    };
  }
};

// src/neptune.js
init_sceneTransition();
init_spawnPoint();

// src/nereid/collider.js
init_component();
var Collider = class _Collider extends Component {
  constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
    super();
    if (![width, height, offsetX, offsetY].every(Number.isFinite) || width <= 0 || height <= 0) {
      throw new TypeError("Collider dimensions must be positive finite numbers and offsets must be finite");
    }
    if (!options || typeof options !== "object" || Array.isArray(options)) throw new TypeError("Collider options must be an object");
    const layer = options.layer ?? 1;
    const mask = options.mask ?? 4294967295;
    if (!Number.isInteger(layer) || layer <= 0 || layer > 2147483647 || !Number.isInteger(mask) || mask < 0 || mask > 4294967295) {
      throw new TypeError("Collider layer must be a positive 31-bit mask and mask must be a 32-bit mask");
    }
    const role = options.role ?? "solid";
    if (!["solid", "trigger", "hitbox", "hurtbox", "interaction", "hazard"].includes(role)) {
      throw new TypeError(`Unsupported collider role: ${role}`);
    }
    const oneWay = options.oneWay ?? null;
    if (oneWay !== null && !["up", "down", "left", "right"].includes(oneWay)) throw new TypeError("oneWay must be up, down, left, right, or null");
    const climbable = options.climbable ?? false;
    if (typeof climbable !== "boolean") throw new TypeError("climbable must be a boolean");
    this.width = width;
    this.height = height;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.layer = layer;
    this.mask = mask >>> 0;
    this.role = role;
    this.isTrigger = role !== "solid";
    this.enabled = true;
    this.oneWay = oneWay;
    this.hazard = options.hazard ?? null;
    this.climbable = climbable;
    this._listeners = /* @__PURE__ */ new Map();
  }
  getBounds(x, y) {
    return {
      left: x + this.offsetX,
      top: y + this.offsetY,
      right: x + this.offsetX + this.width,
      bottom: y + this.offsetY + this.height
    };
  }
  overlaps(other, x1, y1, x2, y2) {
    if (!(other instanceof _Collider)) throw new TypeError("overlaps requires another Collider");
    const a = this.getBounds(x1, y1);
    const b = other.getBounds(x2, y2);
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }
  containsPoint(px, py, entityX, entityY) {
    if (![px, py, entityX, entityY].every(Number.isFinite)) return false;
    const bounds = this.getBounds(entityX, entityY);
    return px >= bounds.left && px <= bounds.right && py >= bounds.top && py <= bounds.bottom;
  }
  on(event, listener) {
    if (typeof event !== "string" || !event || typeof listener !== "function") throw new TypeError("Collider.on requires an event name and function");
    if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
    this._listeners.get(event).add(listener);
    return () => this.off(event, listener);
  }
  off(event, listener) {
    const listeners = this._listeners.get(event);
    if (!listeners) return false;
    const removed = listeners.delete(listener);
    if (listeners.size === 0) this._listeners.delete(event);
    return removed;
  }
  emit(event, payload) {
    for (const listener of [...this._listeners.get(event) ?? []]) listener(payload);
  }
  /** Render the world-space collider bounds for diagnostics. */
  debugDraw(ctx2, x, y, color = "#ff00ff") {
    if (!ctx2 || typeof ctx2.strokeRect !== "function") throw new TypeError("debugDraw requires a 2D canvas context");
    const bounds = this.getBounds(x, y);
    const previous = ctx2.strokeStyle;
    ctx2.strokeStyle = color;
    ctx2.strokeRect(bounds.left, bounds.top, this.width, this.height);
    ctx2.strokeStyle = previous;
  }
};
var SolidCollider = class extends Collider {
  constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
    super(width, height, offsetX, offsetY, { ...options, role: "solid" });
  }
};
var TriggerCollider = class extends Collider {
  constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
    super(width, height, offsetX, offsetY, { ...options, role: "trigger" });
  }
};
var Hitbox = class extends Collider {
  constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
    super(width, height, offsetX, offsetY, { ...options, role: "hitbox" });
  }
};
var Hurtbox = class extends Collider {
  constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
    super(width, height, offsetX, offsetY, { ...options, role: "hurtbox" });
  }
};
var InteractionArea = class extends Collider {
  constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
    super(width, height, offsetX, offsetY, { ...options, role: "interaction" });
  }
};
var HazardArea = class extends Collider {
  constructor(width = 32, height = 32, offsetX = 0, offsetY = 0, options = {}) {
    super(width, height, offsetX, offsetY, { ...options, role: "hazard" });
    this.hazard = options.hazard ?? { damage: 1 };
    if (!this.hazard || typeof this.hazard !== "object" || Array.isArray(this.hazard)) throw new TypeError("HazardArea hazard must be an object");
  }
};

// src/neptune.js
init_renderable();

// src/rendering/shape.js
init_renderable();
init_transform();
init_math();
var Shape = class _Shape extends Renderable {
  _properties = {
    geometry: _Shape.CIRCLE,
    param: { radius: 10, color: Color.fuchsia, fill: true, width: 10, height: 10, outline: Color.black, thickness: 1, points: [] }
  };
  #transform;
  constructor(geometry = _Shape.CIRCLE, param = { radius: 10, color: Color.fuchsia, fill: true, width: 10, height: 10, outline: Color.black, thickness: 1, points: [] }) {
    super();
    this._properties.geometry = geometry;
    param = Object.assign(this._properties.param, param);
  }
  deserialize(props) {
    if (!props) return;
    super.deserialize(props);
    if (props.geometry !== void 0) this.geometry = props.geometry;
    if (props.param) {
      const newParam = Object.assign(this._properties.param, props.param);
      if (newParam.color && !(newParam.color instanceof Color)) {
        newParam.color = new Color(newParam.color.r, newParam.color.g, newParam.color.b, newParam.color.a);
      }
      if (newParam.outline && !(newParam.outline instanceof Color)) {
        newParam.outline = new Color(newParam.outline.r, newParam.outline.g, newParam.outline.b, newParam.outline.a);
      }
      this._properties.param = newParam;
    }
  }
  /**
   * Geometry of the shape. Can be one of the following:
   * ```
   * Shape.CIRCLE = 0;
   * Shape.RECTANGLE = 1;
   * Shape.LINE = 2;
   * Shape.TRIANGLE = 3;
   * Shape.POLYGON = 4;
   * ```
   * @type {number}
   */
  get geometry() {
    return this._properties.geometry;
  }
  set geometry(geometry) {
    this._properties.geometry = geometry;
  }
  /**
   * Color of the shape.
   * @type {Color}
   * 
   */
  get color() {
    return this._properties.param.color;
  }
  set color(color) {
    this._properties.param.color = color;
  }
  /**
   * Fill the shape or not.
   * @type {boolean}
   */
  get fill() {
    return this._properties.param.fill;
  }
  set fill(fill) {
    this._properties.param.fill = fill;
  }
  /**
   * If shape is Circle. The radius of the circle.
   * @type {number}
   */
  get radius() {
    return this._properties.param.radius;
  }
  set radius(radius) {
    this._properties.param.radius = radius;
  }
  /**
   * If the shape is Rectangle. The width of the rectangle.
   * @type {number}
   */
  get width() {
    return this._properties.param.width;
  }
  set width(width) {
    this._properties.param.width = width;
  }
  /**
   * If the shape is Rectangle. The height of the rectangle.
   */
  get height() {
    return this._properties.param.height;
  }
  set height(height) {
    this._properties.param.height = height;
  }
  /**
   * Outline of the shape.
   * @type {Color}
   */
  get outline() {
    return this._properties.param.outline;
  }
  set outline(outline) {
    this._properties.param.outline = outline;
  }
  /**
   * The thickness of the outline of the shape.
   * @type {number}
   */
  get thickness() {
    return this._properties.param.thickness;
  }
  set thickness(thickness) {
    this._properties.param.thickness = thickness;
  }
  /** @private */
  draw(ctx2) {
    super.draw(ctx2);
    if (this.#transform == null)
      this.#transform = this.entity.GetComponent(Transform);
    let position = Maths.MeterToPixelVector2(this.#transform.position);
    let rotation = this.#transform.rotation;
    let radius = this._properties.param.radius;
    let scale = Maths.MeterToPixelVector2(this.#transform.scale);
    let param = this._properties.param;
    let fill = this._properties.param.fill;
    ctx2.save();
    ctx2.translate(position.x, position.y);
    ctx2.rotate(rotation);
    ctx2.scale(scale.x, scale.y);
    ctx2.globalCompositeOperation = this.blendMode;
    ctx2.filter = this.filter;
    ctx2.fillStyle = param.color.toString();
    if (param.outline) ctx2.strokeStyle = param.outline.toString();
    if (param.thickness) ctx2.lineWidth = param.thickness;
    switch (this._properties.geometry) {
      case _Shape.CIRCLE:
        ctx2.beginPath();
        ctx2.arc(0, 0, radius, 0, Math.PI * 2);
        break;
      case _Shape.RECTANGLE:
        ctx2.beginPath();
        ctx2.rect(-param.width / 2, -param.height / 2, param.width, param.height);
        break;
      case _Shape.LINE:
        ctx2.beginPath();
        ctx2.moveTo(0, 0);
        ctx2.strokeStyle = param.color.toString();
        ctx2.lineTo(param.width, param.height);
        ctx2.stroke();
        break;
      case _Shape.TRIANGLE:
        ctx2.beginPath();
        ctx2.moveTo(0, -param.height / 2);
        ctx2.lineTo(param.width / 2, param.height / 2);
        ctx2.lineTo(-param.width / 2, param.height / 2);
        ctx2.closePath();
        break;
      case _Shape.POLYGON:
        ctx2.beginPath();
        ctx2.moveTo(param.points[0].x, param.points[0].y);
        for (let i = 1; i < param.points.length; i++) {
          ctx2.lineTo(param.points[i].x, param.points[i].y);
        }
        ctx2.closePath();
        break;
    }
    if (fill) {
      ctx2.fill();
      if (param.outline) ctx2.stroke();
    } else {
      ctx2.stroke();
    }
    this.drawChildren(ctx2);
    ctx2.restore();
  }
};
Shape.CIRCLE = 0;
Shape.RECTANGLE = 1;
Shape.LINE = 2;
Shape.TRIANGLE = 3;
Shape.POLYGON = 4;

// src/neptune.js
init_sprite();

// src/audio/audio.js
init_component();

// src/ui/uitransform.js
init_vec2();
init_component();
init_math();
var Transform2 = class _Transform extends Component {
  constructor(x = 0, y = 0, width = 10, height = 10, rot = 0) {
    super();
    this._properties.x = x;
    this._properties.y = y;
    this._properties.width = width;
    this._properties.height = height;
    this._properties.rot = rot;
  }
  /**
   * X position of the UI element.
   * @type {number}
   */
  get x() {
    return this._properties.x;
  }
  set x(x) {
    this._properties.x = x;
  }
  /**
   * Y position of the UI element.
   * @type {number}
   */
  get y() {
    return this._properties.y;
  }
  set y(y) {
    this._properties.y = y;
  }
  /**
   * Width of the UI element.
   * @type {number}
   */
  get width() {
    return this._properties.width;
  }
  set width(width) {
    this._properties.width = width;
  }
  /**
   * Height of the UI element.
   */
  get height() {
    return this._properties.height;
  }
  set height(height) {
    this._properties.height = height;
  }
  /**
   * Rotation of the UI element in degrees.
   */
  get rotation() {
    return this._properties.rot;
  }
  set rotation(rot) {
    this._properties.rot = rot;
  }
  /**
   * Center the UI element. Set/Get the x and y position of the UI element so that center of the UI element is as specified.
   */
  get center() {
    let center = new Vector2(this._properties.x + this._properties.width / 2, this._properties.y + this._properties.height / 2);
    return center;
  }
  set center(center) {
    this._properties.x = center.x - this._properties.width / 2;
    this._properties.y = center.y - this._properties.height / 2;
  }
  /**
   * Align the UI element to the parent as per the specified mode.
   * If the UI element has no parent, it will align to the window.
   * 
   * @param {string} mode="center" - The mode of alignment.
   * | Mode | Description |
   * | --- | --- |
   * | "top" | Align the UI element to the top of the parent. |
   * | "middle" | Align the UI element to the middle of the parent. |
   * | "bottom" | Align the UI element to the bottom of the parent. |
   * | "left" | Align the UI element to the left of the parent. |
   * | "right" | Align the UI element to the right of the parent. |
   * | "center" | Align the UI element to the center of the parent. |
   * 
   * @example
   * // Align the UI element to the top of the parent.
   * transform.align("top");
   * 
   */
  Align(mode = "center") {
    let parent = this.entity.parent;
    if (parent != void 0) {
      var parentTransform = parent.GetComponent(_Transform);
      var x = parentTransform.x;
      var y = parentTransform.y;
      var width = parentTransform.width;
      var height = parentTransform.height;
    } else {
      var x = 0;
      var y = 0;
      var width = window.innerWidth * Maths.PIXEL_TO_METER;
      var height = window.innerHeight * Maths.PIXEL_TO_METER;
    }
    switch (mode) {
      case "left":
        this._properties.x = x;
        break;
      case "right":
        this._properties.x = x + width - this._properties.width;
        break;
      case "top":
        this._properties.y = y;
        break;
      case "bottom":
        this._properties.y = y + height - this._properties.height;
        break;
      case "center":
        this._properties.x = x + width / 2 - this._properties.width / 2;
        break;
      case "middle":
        this._properties.y = y + height / 2 - this._properties.height / 2;
        break;
    }
  }
  /**
   * Fill the Entity with the parent as per the specified mode.
   * If the UI element has no parent, it will fill the window.
   * 
   * @param {string} mode="both" - The mode of filling.
   * | Mode | Description |
   * | --- | --- |
   * | "both" | Fill the UI element to the size of the parent. |
   * | "x" | Fill the UI element to the width of the parent. |
   * | "y" | Fill the UI element to the height of the parent. |
   * 
   * @param {number} padX=0 - Padding in the x direction.
   * @param {number} padY=0 - Padding in the y direction.
   * 
   * @example
   * // Fill the UI element to the size of the parent.
   * this.entity.getComponent(UITransform).fill();
   * 
   */
  Fill(mode = "both", padX = 0, padY = 0) {
    let parent = this.entity.parent;
    if (parent && parent.HasComponent(_Transform)) {
      var parentTransform = parent.GetComponent(_Transform);
      var x = parentTransform.x;
      var y = parentTransform.y;
      var width = parentTransform.width;
      var height = parentTransform.height;
    } else {
      var x = 0;
      var y = 0;
      var width = window.innerWidth * Maths.PIXEL_TO_METER;
      var height = window.innerHeight * Maths.PIXEL_TO_METER;
    }
    switch (mode) {
      case "both":
        this._properties.x = x + padX;
        this._properties.y = y + padY;
        this._properties.width = width - padX * 2;
        this._properties.height = height - padY * 2;
        break;
      case "x":
        this._properties.x = x + padX;
        this._properties.width = width - padX * 2;
        break;
      case "y":
        this._properties.y = y + padY;
        this._properties.height = height - padY * 2;
        break;
    }
  }
  #isPointInside(point) {
    return point.x >= this._properties.x && point.x <= this._properties.x + this._properties.width && point.y >= this._properties.y && point.y <= this._properties.y + this._properties.height;
  }
  /**
   * Check if the UI element is being hovered over.
   * @returns {boolean} - True if the UI element is being hovered over.
   */
  IsHovered() {
    return this.#isPointInside(Maths.PixelToMeterVector2(MouseInput.GetPosition()));
  }
  /**
   * Check if the UI element is being clicked.
   * @returns {boolean} - True if the UI element is being clicked.
   */
  IsClicked() {
    return this.IsHovered() && MouseInput.IsLeftClicked();
  }
};

// src/ui/text.js
init_renderable();
init_transform();

// src/rendering/font.js
var Font = class {
  constructor(size = 20, family = "Arial", style = "bold") {
    this.size = size;
    this.family = family;
    this.style = style;
  }
  /**
   * Convert font to CSS font string.
   * @returns {string} CSS font string.
   */
  toString() {
    return `${this.style} ${this.size}px ${this.family}`;
  }
};

// src/ui/text.js
init_math();
var Text = class _Text extends Renderable {
  #transform;
  constructor(text = "Hello, World!", font = new Font(), align = _Text.ALIGN.LEFT, color = Color.white) {
    super();
    this._properties.text = text;
    this._properties.font = font;
    this._properties.align = align;
    this._properties.color = color;
  }
  deserialize(props) {
    if (!props) return;
    if (props.text !== void 0) this.text = props.text;
    if (props.align !== void 0) this.align = props.align;
    if (props.color && !(props.color instanceof Color)) {
      this.color = new Color(props.color.r, props.color.g, props.color.b, props.color.a);
    }
    if (props.font) {
      const f = new Font();
      if (props.font.size) f.size = props.font.size;
      if (props.font.family) f.family = props.font.family;
      if (props.font.weight) f.weight = props.font.weight;
      this.font = f;
    }
  }
  /**
   * The text to display.
   * @type {string}
   */
  get text() {
    return this._properties.text;
  }
  set text(text) {
    this._properties.text = text;
  }
  /**
   * Font the text should be displayed in.
   * The all fonts supported by the browser/HTML5 canvas can be used.
   * Example: "30px Arial bold"
   * @type {Font}
   * 
   */
  get font() {
    return this._properties.font;
  }
  set font(font) {
    this._properties.font = font;
  }
  /**
   * Align the text.
   * | Value | Description |
   * | --- | --- |
   * | Text.ALIGN_LEFT | Align the text to the left. |
   * | Text.ALIGN_CENTER | Align the text to the center. |
   * | Text.ALIGN_RIGHT | Align the text to the right. |
   * | Text.ALIGN_START | Align the text to the start. |
   * | Text.ALIGN_END | Align the text to the end. |
   * @type {string}
   */
  get align() {
    return this._properties.align;
  }
  set align(align) {
    this._properties.align = align;
  }
  /**
   * The text color to be used.
   * @type {Color}
   */
  get color() {
    return this._properties.color;
  }
  set color(color) {
    this._properties.color = color;
  }
  draw(ctx2) {
    if (this.#transform == null) {
      this.#transform = this.entity.GetComponent(Transform2);
      if (!this.#transform) {
      }
    }
    let x = 0, y = 0, rot = 0;
    let scaleX = 1, scaleY = 1;
    if (this.#transform) {
      if (this.#transform.x !== void 0) {
        x = this.#transform.x;
        y = this.#transform.y;
        rot = this.#transform.rotation;
      } else if (this.#transform.position !== void 0) {
        x = this.#transform.position.x;
        y = this.#transform.position.y;
        rot = this.#transform.rotation;
        scaleX = this.#transform.scale.x;
        scaleY = this.#transform.scale.y;
      } else {
        console.warn("Text: Transform found but has no known coordinates:", this.#transform);
      }
    } else {
      const t = this.entity.components.find((c) => c.position || c.x !== void 0);
      if (t) {
        this.#transform = t;
        console.log("Text: Force found transform via iteration", t);
        if (t.position) {
          x = t.position.x;
          y = t.position.y;
        }
      } else {
        console.error("Text: No Transform found on entity " + this.entity.name);
      }
    }
    ctx2.save();
    ctx2.translate(x * Maths.METER_TO_PIXEL, y * Maths.METER_TO_PIXEL);
    ctx2.rotate(rot * Maths.DEG_TO_RAD);
    ctx2.scale(Maths.METER_TO_PIXEL * scaleX, Maths.METER_TO_PIXEL * scaleY);
    ctx2.font = this.font.toString();
    ctx2.fillStyle = this.color.toString();
    ctx2.textAlign = this.align;
    ctx2.fillText(this.text, 0, this.font.size / 4);
    ctx2.restore();
  }
};
Text.ALIGN = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
  START: "start",
  END: "end"
};

// src/ui/sprite.js
init_renderable();
init_math();

// src/ui/panel.js
init_renderable();
init_math();

// src/ui/containers/container.js
init_component();

// src/ui/ui.js
init_authoredUi();

// src/scripts/projectBehaviour.js
init_transform();
init_sprite();
init_sceneManager();

// src/core/saveManager.js
var SaveManager = class _SaveManager {
  static SCHEMA_VERSION = 1;
  constructor({ storage = globalThis.localStorage, prefix = "neptune.save", autosaveInterval = 0, onError = () => {
  } } = {}) {
    this.storage = storage ?? new MapStorage2();
    this.prefix = prefix;
    this.autosaveInterval = autosaveInterval;
    this.onError = onError;
    this.timer = null;
    if (!Number.isFinite(autosaveInterval) || autosaveInterval < 0) throw new RangeError("autosaveInterval must be non-negative.");
  }
  key(slot) {
    if (typeof slot !== "string" || !slot.trim()) throw new TypeError("Save slot must be a non-empty string.");
    return `${this.prefix}.${encodeURIComponent(slot)}`;
  }
  save(slot, state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) throw new TypeError("Game state must be an object.");
    let text;
    try {
      text = JSON.stringify({ schemaVersion: _SaveManager.SCHEMA_VERSION, savedAt: Date.now(), state });
    } catch (error) {
      throw new Error(`Game state cannot be saved: ${error.message}`);
    }
    this.storage.setItem(this.key(slot), text);
    return JSON.parse(text);
  }
  load(slot, migrations = {}) {
    const text = this.storage.getItem(this.key(slot));
    if (text === null) return null;
    let record;
    try {
      record = JSON.parse(text);
    } catch (error) {
      throw new Error(`Save slot '${slot}' is corrupt JSON: ${error.message}`);
    }
    if (!record || !Number.isInteger(record.schemaVersion) || !record.state || typeof record.state !== "object") throw new Error(`Save slot '${slot}' is corrupt: expected a versioned game state.`);
    while (record.schemaVersion !== _SaveManager.SCHEMA_VERSION) {
      const migrate = migrations[record.schemaVersion];
      if (typeof migrate !== "function") throw new Error(`Save slot '${slot}' uses unsupported schema ${record.schemaVersion}; supply a migration to ${_SaveManager.SCHEMA_VERSION}.`);
      const previousVersion = record.schemaVersion;
      record = migrate(structuredClone(record));
      if (!record || !Number.isInteger(record.schemaVersion) || !record.state || typeof record.state !== "object") throw new Error(`Migration for '${slot}' returned an invalid record.`);
      if (record.schemaVersion !== previousVersion + 1) throw new Error(`Migration for '${slot}' must advance schema ${previousVersion} to ${previousVersion + 1}.`);
    }
    return structuredClone(record.state);
  }
  slots() {
    const keys = typeof this.storage.keys === "function" ? this.storage.keys() : Array.from({ length: this.storage.length ?? 0 }, (_, i) => this.storage.key(i));
    return keys.filter((k) => k?.startsWith(`${this.prefix}.`)).map((k) => decodeURIComponent(k.slice(this.prefix.length + 1)));
  }
  remove(slot) {
    this.storage.removeItem(this.key(slot));
  }
  enableAutosave(capture, slot = "autosave") {
    if (typeof capture !== "function") throw new TypeError("Autosave capture must be a function.");
    this.disableAutosave();
    this.capture = capture;
    this.autosaveSlot = slot;
    if (this.autosaveInterval) this.timer = setInterval(() => {
      if (this.autosavePending) return;
      this.autosavePending = this.autosaveNow().finally(() => {
        this.autosavePending = null;
      });
    }, this.autosaveInterval);
    return this;
  }
  disableAutosave() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }
  async autosaveNow() {
    if (!this.capture) throw new Error("Autosave is not configured.");
    try {
      this.recoverable = this.save(this.autosaveSlot, await this.capture());
      return this.recoverable;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  recover() {
    return this.load(this.autosaveSlot ?? "autosave");
  }
};
var MapStorage2 = class extends Map {
  getItem(k) {
    return this.has(k) ? this.get(k) : null;
  }
  setItem(k, v) {
    this.set(k, String(v));
  }
  removeItem(k) {
    this.delete(k);
  }
  keys() {
    return Array.from(super.keys());
  }
};

// src/thalassa/camera.js
init_vec2();
var Camera = class {
  constructor(viewWidth, viewHeight) {
    this.position = new Vector2(0, 0);
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.target = null;
    this.followSpeed = 5;
    this.offset = new Vector2(0, 0);
    this.lookAhead = new Vector2(0, 0);
    this.bounds = null;
    this.shakeAmount = 0;
    this.shakeDuration = 0;
    this.shakeOffset = new Vector2(0, 0);
    this.zoom = 1;
    this.transition = null;
    this.fadeAlpha = 0;
  }
  /**
   * Set the target to follow.
   * @param {Entity} target - Entity with Transform component.
   * @param {Vector2} offset - Offset from target center.
   */
  /**
   * Set the target to follow.
   * @param {Entity} target - Entity with Transform component.
   * @param {Vector2} offset - Offset from target center.
   */
  follow(target, offset = null) {
    this.target = target;
    if (offset) this.offset = offset;
  }
  /**
   * Set world bounds for the camera.
   * @param {number} minX 
   * @param {number} minY 
   * @param {number} maxX 
   * @param {number} maxY 
   */
  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }
  /**
   * Clear bounds.
   */
  clearBounds() {
    this.bounds = null;
  }
  /**
   * Trigger screen shake.
   * @param {number} amount - Shake intensity in pixels.
   * @param {number} duration - Duration in seconds.
   */
  shake(amount, duration) {
    this.shakeAmount = amount;
    this.shakeDuration = duration;
  }
  /**
   * Set the zoom level of the camera.
   * @param {number} value - Zoom level. 1 is default.
   */
  setZoom(value) {
    this.zoom = value;
  }
  /** Move the camera to a world position over a fixed duration. */
  transitionTo(position, duration, { fade = false } = {}) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new TypeError("Camera transition position must have finite x and y coordinates");
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new RangeError("Camera transition duration must be positive");
    }
    this.transition = {
      from: new Vector2(this.position.x, this.position.y),
      to: new Vector2(position.x, position.y),
      duration,
      elapsed: 0,
      fade
    };
    this.target = null;
    this.fadeAlpha = 0;
  }
  /**
   * Update camera position.
   * @param {number} deltaTime - Time since last frame.
   */
  update(deltaTime) {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) {
      throw new RangeError("Camera deltaTime must be a finite non-negative number");
    }
    if (this.transition) {
      const transition = this.transition;
      transition.elapsed = Math.min(transition.duration, transition.elapsed + deltaTime);
      const progress = transition.elapsed / transition.duration;
      this.position.x = transition.from.x + (transition.to.x - transition.from.x) * progress;
      this.position.y = transition.from.y + (transition.to.y - transition.from.y) * progress;
      this.fadeAlpha = transition.fade ? progress < 0.5 ? progress * 2 : (1 - progress) * 2 : 0;
      if (progress >= 1) this.transition = null;
    }
    if (this.target && !this.transition) {
      const Transform3 = this.target.GetComponent ? this.target.GetComponent(this.target.constructor) : null;
      let targetPos = null;
      if (this.target.GetComponent) {
        const transform = this.target.components?.find((c) => c.position);
        if (transform) {
          targetPos = transform.position;
        }
      }
      if (this.target.position) {
        targetPos = this.target.position;
      }
      if (targetPos) {
        const targetX = targetPos.x + this.offset.x + this.lookAhead.x;
        const targetY = targetPos.y + this.offset.y + this.lookAhead.y;
        const t = Math.min(1, this.followSpeed * deltaTime);
        this.position.x += (targetX - this.viewWidth / 2 - this.position.x) * t;
        this.position.y += (targetY - this.viewHeight / 2 - this.position.y) * t;
      }
    }
    if (this.bounds) {
      this.position.x = Math.max(this.bounds.minX, Math.min(this.position.x, this.bounds.maxX - this.viewWidth));
      this.position.y = Math.max(this.bounds.minY, Math.min(this.position.y, this.bounds.maxY - this.viewHeight));
    }
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime;
      this.shakeOffset.x = (Math.random() - 0.5) * 2 * this.shakeAmount;
      this.shakeOffset.y = (Math.random() - 0.5) * 2 * this.shakeAmount;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }
  /**
   * Get the final camera X offset (including shake).
   */
  get x() {
    return this.position.x + this.shakeOffset.x;
  }
  /**
   * Get the final camera Y offset (including shake).
   */
  get y() {
    return this.position.y + this.shakeOffset.y;
  }
  /**
   * Convert screen position to world position.
   * @param {number} screenX 
   * @param {number} screenY 
   * @returns {Vector2}
   */
  screenToWorld(screenX, screenY) {
    return new Vector2(
      screenX / (this.zoom || 1) + this.x,
      screenY / (this.zoom || 1) + this.y
    );
  }
  /**
   * Convert world position to screen position.
   * @param {number} worldX 
   * @param {number} worldY 
   * @returns {Vector2}
   */
  worldToScreen(worldX, worldY) {
    return new Vector2(
      (worldX - this.x) * (this.zoom || 1),
      (worldY - this.y) * (this.zoom || 1)
    );
  }
  /**
   * Apply the camera transform to the context.
   * @param {CanvasRenderingContext2D} ctx 
   */
  apply(ctx2) {
    const zoom = this.zoom || 1;
    ctx2.scale(zoom, zoom);
    ctx2.translate(-this.x, -this.y);
  }
};

// src/larissa/index.js
var larissa_exports = {};
__export(larissa_exports, {
  ABILITY_NODE_TYPES: () => ABILITY_NODE_TYPES,
  ABILITY_NODE_VOCABULARY: () => ABILITY_NODE_VOCABULARY,
  ARCHETYPES: () => ARCHETYPES,
  AbilityBudgetExceededError: () => AbilityBudgetExceededError,
  AbilityExecutionError: () => AbilityExecutionError,
  AbilityExecutor: () => AbilityExecutor,
  AbilityValidationError: () => AbilityValidationError,
  AbilityValidator: () => AbilityValidator,
  AttackDefinition: () => AttackDefinition,
  BossAI: () => BossAI,
  BoundedMemory: () => BoundedMemory,
  CombatSystem: () => CombatSystem,
  Combatant: () => Combatant,
  DeathRetryManager: () => DeathRetryManager,
  EQUIPMENT_SLOTS: () => EQUIPMENT_SLOTS,
  EnemyAI: () => EnemyAI,
  EquipmentSystem: () => EquipmentSystem,
  FACTION_DISPOSITION: () => FACTION_DISPOSITION,
  FactionRegistry: () => FactionRegistry,
  GameData: () => GameData,
  Inventory: () => Inventory,
  ItemRegistry: () => ItemRegistry,
  LevelProgression: () => LevelProgression,
  LootTable: () => LootTable,
  NPCKnowledge: () => NPCKnowledge,
  NPCSchedule: () => NPCSchedule,
  PerceptionSystem: () => PerceptionSystem,
  Progression: () => Progression,
  QuestLog: () => QuestLog,
  ROUTINE_ACTIVITIES: () => ROUTINE_ACTIVITIES,
  RewardSystem: () => RewardSystem,
  ScheduleSlot: () => ScheduleSlot,
  ScheduleSystem: () => ScheduleSystem,
  Shop: () => Shop,
  Stats: () => Stats,
  StatusEffectManager: () => StatusEffectManager,
  UtilityAI: () => UtilityAI,
  UtilityAction: () => UtilityAction,
  UtilityConsideration: () => UtilityConsideration,
  UtilityCurves: () => UtilityCurves,
  clamp01: () => clamp01,
  createDefaultActions: () => createDefaultActions,
  createRPGSnapshot: () => createRPGSnapshot,
  getPointKey: () => getPointKey,
  isHourInSlot: () => isHourInSlot,
  isValidEquipmentSlot: () => isValidEquipmentSlot,
  parseHour: () => parseHour,
  restoreRPGSnapshot: () => restoreRPGSnapshot
});

// src/larissa/stats.js
init_component();
var Stats = class extends Component {
  constructor(config = {}) {
    super();
    this._maxHealth = config.maxHealth ?? 100;
    this._health = config.health ?? this._maxHealth;
    this._combatant = null;
    this._unsubscribeCombatant = null;
    this.maxStamina = config.maxStamina ?? 100;
    this.stamina = this.maxStamina;
    this.attack = config.attack ?? 10;
    this.defense = config.defense ?? 5;
    this.speed = config.speed ?? 100;
    this.effects = [];
    this.onDeath = null;
    this.onDamage = null;
    this.onHeal = null;
  }
  /** Maximum health mirrors Combatant while explicitly bound; standalone Stats retains legacy ownership. */
  get maxHealth() {
    return this._combatant?.maxHealth ?? this._maxHealth;
  }
  set maxHealth(value) {
    if (this._combatant) {
      if (!Number.isFinite(value) || value <= 0) throw new TypeError("maxHealth must be a positive finite number");
      this._combatant.maxHealth = value;
      this._combatant.setHealth(Math.min(this._combatant.health, value));
    } else this._maxHealth = value;
  }
  /** Health reads the authoritative Combatant after binding and writes through its validated health path. */
  get health() {
    return this._combatant?.health ?? this._health;
  }
  set health(value) {
    if (this._combatant) this._combatant.setHealth(value);
    else this._health = value;
  }
  /** Bind this legacy stat component to the authoritative Combatant health state. */
  bindCombatant(combatant) {
    if (!combatant || typeof combatant.setHealth !== "function" || typeof combatant.receiveDamage !== "function" || !Number.isFinite(combatant.health)) {
      throw new TypeError("Stats.bindCombatant requires a Combatant-compatible instance");
    }
    this.unbindCombatant();
    this._health = combatant.health;
    this._maxHealth = combatant.maxHealth;
    this._combatant = combatant;
    this._unsubscribeCombatant = combatant.onHealthChanged?.(({ type, amount, killed }) => {
      if (type === "destroy") {
        this.unbindCombatant();
        return;
      }
      if (type === "damage" && amount > 0) this.onDamage?.(amount);
      if (type === "heal" && amount > 0) this.onHeal?.(amount);
      if (killed) this.onDeath?.();
    }) ?? null;
    return this;
  }
  /** Stop mirroring a Combatant, retaining the last authoritative health value. */
  unbindCombatant() {
    if (!this._combatant) return false;
    this._health = this._combatant.health;
    this._maxHealth = this._combatant.maxHealth;
    this._unsubscribeCombatant?.();
    this._unsubscribeCombatant = null;
    this._combatant = null;
    return true;
  }
  /**
   * Take damage (reduced by defense).
   * @param {number} amount - Raw damage amount.
   * @returns {number} Actual damage taken.
   */
  takeDamage(amount) {
    if (this._combatant) {
      const effectiveDefense2 = this.getModifiedStat("defense");
      const result = this._combatant.receiveDamage({ amount: Math.max(1, amount - effectiveDefense2), type: "physical" });
      return result.damage;
    }
    const effectiveDefense = this.getModifiedStat("defense");
    const actualDamage = Math.max(1, amount - effectiveDefense);
    this.health = Math.max(0, this.health - actualDamage);
    if (this.onDamage) this.onDamage(actualDamage);
    if (this.health <= 0 && this.onDeath) this.onDeath();
    return actualDamage;
  }
  /**
   * Heal health.
   * @param {number} amount 
   */
  heal(amount) {
    if (this._combatant) return this._combatant.heal(amount);
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.onHeal) this.onHeal(this.health - oldHealth);
  }
  /**
   * Use stamina.
   * @param {number} amount 
   * @returns {boolean} True if had enough stamina.
   */
  useStamina(amount) {
    if (this.stamina >= amount) {
      this.stamina -= amount;
      return true;
    }
    return false;
  }
  /**
   * Regenerate stamina.
   * @param {number} amount 
   */
  regenStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }
  /**
   * Apply a status effect.
   * @param {string} name 
   * @param {number} duration - Duration in seconds.
   * @param {Object} modifier - { stat: multiplier }
   */
  applyEffect(name, duration, modifier) {
    this.effects.push({ name, duration, modifier });
  }
  /**
   * Update status effects.
   * @param {number} deltaTime 
   */
  updateEffects(deltaTime) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].duration -= deltaTime;
      if (this.effects[i].duration <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }
  /**
   * Get stat with modifiers applied.
   * @param {string} statName 
   * @returns {number}
   */
  getModifiedStat(statName) {
    let base = this[statName] ?? 0;
    let multiplier = 1;
    for (const effect of this.effects) {
      if (effect.modifier[statName]) {
        multiplier *= effect.modifier[statName];
      }
    }
    return base * multiplier;
  }
  /**
   * Check if alive.
   */
  get isAlive() {
    return this.health > 0;
  }
  destroy() {
    this.unbindCombatant();
    super.destroy();
  }
};

// src/larissa/itemSystem.js
init_component();
var EQUIPMENT_SLOTS = Object.freeze(["mainHand", "offHand", "armor", "accessory"]);
function isValidEquipmentSlot(slot) {
  return typeof slot === "string" && EQUIPMENT_SLOTS.includes(slot);
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
var ItemRegistry = class {
  /**
   * @param {Array.<Object>|Object} [items] - Initial item definitions.
   */
  constructor(items = []) {
    this._items = /* @__PURE__ */ new Map();
    if (Array.isArray(items)) {
      for (const item of items) {
        this.register(item);
      }
    } else if (items && typeof items === "object") {
      for (const item of Object.values(items)) {
        this.register(item);
      }
    }
  }
  /**
   * Register an item definition.
   * @param {Object} itemDef - Item definition object.
   * @returns {Object} Registered immutable item definition.
   */
  register(itemDef) {
    if (!itemDef || typeof itemDef !== "object" || Array.isArray(itemDef)) {
      throw new TypeError("Item definition must be an object");
    }
    if (typeof itemDef.id !== "string" || !itemDef.id.trim()) {
      throw new TypeError("Item id must be a non-empty string");
    }
    const id = itemDef.id.trim();
    const type = typeof itemDef.type === "string" ? itemDef.type : "misc";
    const name = typeof itemDef.name === "string" ? itemDef.name : id;
    const description = typeof itemDef.description === "string" ? itemDef.description : "";
    let maxStack = 1;
    if (Number.isInteger(itemDef.maxStack) && itemDef.maxStack >= 1) {
      maxStack = itemDef.maxStack;
    } else if (Number.isInteger(itemDef.stackable) && itemDef.stackable >= 1) {
      maxStack = itemDef.stackable;
    } else if (type === "consumable") {
      maxStack = 99;
    }
    const value = Number.isFinite(itemDef.value) ? Math.max(0, itemDef.value) : 0;
    let slot = itemDef.slot ?? null;
    let allowedSlots = [];
    if (Array.isArray(itemDef.allowedSlots)) {
      allowedSlots = itemDef.allowedSlots.filter((s) => isValidEquipmentSlot(s));
    }
    if (!slot) {
      if (type === "weapon") slot = "mainHand";
      else if (type === "armor") slot = "armor";
      else if (type === "accessory") slot = "accessory";
    }
    if (typeof slot === "string" && !allowedSlots.includes(slot)) {
      allowedSlots.push(slot);
    }
    const stats = {};
    const sourceStats = itemDef.stats ?? itemDef.statModifiers ?? {};
    if (sourceStats && typeof sourceStats === "object") {
      for (const [statKey, statVal] of Object.entries(sourceStats)) {
        if (Number.isFinite(statVal)) {
          stats[statKey] = statVal;
        }
      }
    }
    const effects = {};
    const sourceEffects = itemDef.effects ?? {};
    if (sourceEffects && typeof sourceEffects === "object") {
      if (Number.isFinite(sourceEffects.health)) effects.health = sourceEffects.health;
      if (Number.isFinite(sourceEffects.stamina)) effects.stamina = sourceEffects.stamina;
      if (sourceEffects.stats && typeof sourceEffects.stats === "object") {
        effects.stats = { ...sourceEffects.stats };
      }
      if (sourceEffects.statModifiers && typeof sourceEffects.statModifiers === "object") {
        effects.stats = { ...sourceEffects.statModifiers };
      }
      if (sourceEffects.statusEffect && typeof sourceEffects.statusEffect === "object") {
        effects.statusEffect = structuredClone(sourceEffects.statusEffect);
      }
    }
    const registered = {
      ...itemDef,
      id,
      name,
      type,
      slot,
      allowedSlots: Object.freeze(allowedSlots),
      maxStack,
      stackable: maxStack,
      value,
      stats: Object.freeze(stats),
      statModifiers: Object.freeze(stats),
      effects: deepFreeze(effects),
      description
    };
    deepFreeze(registered);
    this._items.set(id, registered);
    return registered;
  }
  /**
   * Alias for register.
   * @param {Object} itemDef
   * @returns {Object}
   */
  registerItem(itemDef) {
    return this.register(itemDef);
  }
  /**
   * Retrieve an item definition by id.
   * @param {string} id
   * @returns {Object|null}
   */
  get(id) {
    if (typeof id !== "string") return null;
    return this._items.get(id) ?? null;
  }
  /**
   * Alias for get.
   * @param {string} id
   * @returns {Object|null}
   */
  getItem(id) {
    return this.get(id);
  }
  /**
   * Check if an item id exists.
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    if (typeof id !== "string") return false;
    return this._items.has(id);
  }
  /**
   * Alias for has.
   * @param {string} id
   * @returns {boolean}
   */
  hasItem(id) {
    return this.has(id);
  }
  /**
   * Unregister an item by id.
   * @param {string} id
   * @returns {boolean}
   */
  unregister(id) {
    if (typeof id !== "string") return false;
    return this._items.delete(id);
  }
  /**
   * Get all registered items.
   * @returns {Array.<Object>}
   */
  getAll() {
    return Array.from(this._items.values());
  }
  /**
   * Clear all registered items.
   */
  clear() {
    this._items.clear();
  }
};
var EquipmentSystem = class extends Component {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    super();
    const target = config.target ?? null;
    this.target = target;
    this.inventory = config.inventory ?? null;
    this.slots = {
      mainHand: null,
      offHand: null,
      armor: null,
      accessory: null
    };
    Object.defineProperties(this.slots, {
      hand: {
        get: () => this.slots.mainHand,
        set: (val) => {
          this.slots.mainHand = val;
        },
        enumerable: false,
        configurable: true
      },
      weapon: {
        get: () => this.slots.mainHand,
        set: (val) => {
          this.slots.mainHand = val;
        },
        enumerable: false,
        configurable: true
      }
    });
    this.onEquip = null;
    this.onUnequip = null;
  }
  /**
   * Bind a Combatant, Stats, or composite target to receive equipment stat modifiers.
   * @param {Object} target
   * @returns {EquipmentSystem}
   */
  bindTarget(target) {
    if (this.target && this.target !== target) {
      this.unbindTarget();
    }
    this.target = target;
    if (this.target) {
      for (const item of Object.values(this.slots)) {
        if (item) {
          this._applyStats(item, this.target);
        }
      }
    }
    return this;
  }
  /**
   * Unbind current target, reverting any applied stat modifiers.
   * @returns {boolean}
   */
  unbindTarget() {
    if (!this.target) return false;
    for (const item of Object.values(this.slots)) {
      if (item) {
        this._revertStats(item, this.target);
      }
    }
    this.target = null;
    return true;
  }
  /**
   * Normalize slot name, mapping aliases like 'hand' or 'weapon' to 'mainHand'.
   * @param {string} slot
   * @returns {string|null}
   */
  normalizeSlot(slot) {
    if (typeof slot !== "string") return null;
    const normalized = slot.trim();
    if (normalized === "hand" || normalized === "weapon") return "mainHand";
    if (EQUIPMENT_SLOTS.includes(normalized)) return normalized;
    return null;
  }
  /**
   * Check if an item can be equipped into a designated slot.
   * Rejects incompatible items, consumables, or unknown slots.
   * @param {string} slot
   * @param {Object} item
   * @returns {boolean}
   */
  canEquip(slot, item) {
    const designatedSlot = this.normalizeSlot(slot);
    if (!designatedSlot) return false;
    if (!item || typeof item !== "object") return false;
    if (item.type === "consumable") return false;
    const allowed = /* @__PURE__ */ new Set();
    if (Array.isArray(item.allowedSlots)) {
      for (const s of item.allowedSlots) {
        const norm = this.normalizeSlot(s);
        if (norm) allowed.add(norm);
      }
    }
    if (typeof item.slot === "string") {
      const norm = this.normalizeSlot(item.slot);
      if (norm) allowed.add(norm);
    }
    if (allowed.size === 0) {
      if (item.type === "weapon") allowed.add("mainHand");
      else if (item.type === "armor") allowed.add("armor");
      else if (item.type === "accessory") allowed.add("accessory");
    }
    return allowed.has(designatedSlot);
  }
  /**
   * Equip an item into a designated slot.
   * Modifies bound Combatant/Stats and reverts previous item stats if replacing.
   * Rejects incompatible slots.
   * @param {string|Object} slotOrItem
   * @param {Object} [maybeItem]
   * @param {Object} [options]
   * @returns {Object|boolean} Returns previous item or equipped item on success, false on rejection.
   */
  equip(slotOrItem, maybeItem, options = {}) {
    let slot;
    let item;
    let opt = options;
    if (typeof slotOrItem === "string") {
      slot = slotOrItem;
      item = maybeItem;
    } else if (slotOrItem && typeof slotOrItem === "object") {
      item = slotOrItem;
      slot = item.slot ?? null;
      if (maybeItem && typeof maybeItem === "object") {
        opt = maybeItem;
      }
    }
    const designatedSlot = this.normalizeSlot(slot);
    if (!designatedSlot || !this.canEquip(designatedSlot, item)) {
      if (opt.throwOnError) {
        throw new Error(`Incompatible equipment slot '${slot}' for item '${item?.id ?? "unknown"}'`);
      }
      return false;
    }
    const target = opt.target ?? this.target;
    const previousItem = this.slots[designatedSlot];
    if (previousItem) {
      if (target) {
        this._revertStats(previousItem, target);
      }
      this.slots[designatedSlot] = null;
      if (this.onUnequip) {
        this.onUnequip(designatedSlot, previousItem);
      }
    }
    this.slots[designatedSlot] = item;
    if (target) {
      this._applyStats(item, target);
    }
    if (this.onEquip) {
      this.onEquip(designatedSlot, item);
    }
    return previousItem ?? item;
  }
  /**
   * Unequip item from a designated slot, reverting stats on bound Combatant/Stats.
   * @param {string} slot
   * @param {Object} [options]
   * @returns {Object|null} Unequipped item or null if slot was empty.
   */
  unequip(slot, options = {}) {
    const designatedSlot = this.normalizeSlot(slot);
    if (!designatedSlot) return null;
    const item = this.slots[designatedSlot];
    if (!item) return null;
    const target = options.target ?? this.target;
    if (target) {
      this._revertStats(item, target);
    }
    this.slots[designatedSlot] = null;
    if (this.onUnequip) {
      this.onUnequip(designatedSlot, item);
    }
    return item;
  }
  /**
   * Get item in a designated slot.
   * @param {string} slot
   * @returns {Object|null}
   */
  getSlot(slot) {
    const designatedSlot = this.normalizeSlot(slot);
    if (!designatedSlot) return null;
    return this.slots[designatedSlot] ?? null;
  }
  /**
   * Alias for getSlot.
   * @param {string} slot
   * @returns {Object|null}
   */
  getEquippedItem(slot) {
    return this.getSlot(slot);
  }
  /**
   * Compute total stat modifier for a specific stat across all equipped items.
   * @param {string} statName
   * @returns {number}
   */
  getStatModifier(statName) {
    if (typeof statName !== "string" || !statName) return 0;
    let total = 0;
    for (const slotName of EQUIPMENT_SLOTS) {
      const item = this.slots[slotName];
      if (item) {
        const statMods = item.stats ?? item.statModifiers ?? {};
        if (Number.isFinite(statMods[statName])) {
          total += statMods[statName];
        }
      }
    }
    return total;
  }
  /**
   * Compute aggregate stat modifiers across all equipped items.
   * @returns {Object}
   */
  getAllStatModifiers() {
    const totals = {};
    for (const slotName of EQUIPMENT_SLOTS) {
      const item = this.slots[slotName];
      if (item) {
        const statMods = item.stats ?? item.statModifiers ?? {};
        for (const [name, val] of Object.entries(statMods)) {
          if (Number.isFinite(val)) {
            totals[name] = (totals[name] ?? 0) + val;
          }
        }
      }
    }
    return totals;
  }
  /**
   * Apply an item's stat modifiers to a target (Combatant, Stats, or both).
   * @private
   * @param {Object} item
   * @param {Object} target
   */
  _applyStats(item, target) {
    if (!item || !target) return;
    const stats = item.stats ?? item.statModifiers ?? {};
    const targets = [];
    if (target.combatant) targets.push(target.combatant);
    if (target.stats) targets.push(target.stats);
    if (!targets.includes(target)) targets.push(target);
    for (const [statName, amount] of Object.entries(stats)) {
      if (!Number.isFinite(amount)) continue;
      for (const t of targets) {
        if (statName === "maxHealth") {
          if (Number.isFinite(t.maxHealth)) {
            t.maxHealth += amount;
          }
        } else if (t.resistances && Object.hasOwn(t.resistances, statName)) {
          t.resistances[statName] = Math.max(0, Math.min(1, (t.resistances[statName] ?? 0) + amount));
        } else if (typeof t[statName] === "number") {
          t[statName] += amount;
        }
      }
    }
  }
  /**
   * Revert an item's stat modifiers from a target (Combatant, Stats, or both).
   * @private
   * @param {Object} item
   * @param {Object} target
   */
  _revertStats(item, target) {
    if (!item || !target) return;
    const stats = item.stats ?? item.statModifiers ?? {};
    const targets = [];
    if (target.combatant) targets.push(target.combatant);
    if (target.stats) targets.push(target.stats);
    if (!targets.includes(target)) targets.push(target);
    for (const [statName, amount] of Object.entries(stats)) {
      if (!Number.isFinite(amount)) continue;
      for (const t of targets) {
        if (statName === "maxHealth") {
          if (Number.isFinite(t.maxHealth)) {
            t.maxHealth = Math.max(1, t.maxHealth - amount);
            if (t.health > t.maxHealth) {
              if (typeof t.setHealth === "function") {
                t.setHealth(t.maxHealth);
              } else {
                t.health = t.maxHealth;
              }
            }
          }
        } else if (t.resistances && Object.hasOwn(t.resistances, statName)) {
          t.resistances[statName] = Math.max(0, Math.min(1, (t.resistances[statName] ?? 0) - amount));
        } else if (typeof t[statName] === "number") {
          t[statName] -= amount;
        }
      }
    }
  }
  /**
   * Create persistence snapshot of equipped items.
   * @returns {Object}
   */
  createSnapshot() {
    const slotsData = {};
    for (const slotName of EQUIPMENT_SLOTS) {
      slotsData[slotName] = this.slots[slotName] ? structuredClone(this.slots[slotName]) : null;
    }
    return {
      slots: slotsData
    };
  }
  /**
   * Restore equipped items from snapshot, maintaining stat modifier binding.
   * @param {Object} snapshot
   * @param {Object} [options]
   * @returns {boolean}
   */
  restoreSnapshot(snapshot, options = {}) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new TypeError("Invalid equipment snapshot data");
    }
    const slotsData = snapshot.slots ?? snapshot;
    const registry = options.registry ?? null;
    const target = options.target ?? this.target;
    for (const slotName of EQUIPMENT_SLOTS) {
      if (this.slots[slotName]) {
        this.unequip(slotName, { target });
      }
    }
    for (const slotName of EQUIPMENT_SLOTS) {
      let item = slotsData[slotName] ?? null;
      if (typeof item === "string" && registry) {
        item = registry.get(item);
      }
      if (item) {
        this.equip(slotName, item, { target });
      }
    }
    return true;
  }
  /**
   * Export to plain JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return this.createSnapshot().slots;
  }
  /**
   * Load from JSON representation.
   * @param {Object} data
   */
  loadJSON(data) {
    this.restoreSnapshot(data);
  }
};
var Inventory = class extends Component {
  /**
   * @param {number|Object} [maxSlotsOrConfig] - Max slots number or configuration object.
   * @param {Object} [config] - Optional configuration when first param is number.
   */
  constructor(maxSlotsOrConfig = 20, config = {}) {
    super();
    let maxSlots = 20;
    let maxStack = 99;
    let gold = 0;
    let registry = null;
    if (typeof maxSlotsOrConfig === "number") {
      maxSlots = maxSlotsOrConfig;
      if (config && typeof config === "object") {
        if (Number.isInteger(config.maxStack) && config.maxStack >= 1) maxStack = config.maxStack;
        if (Number.isFinite(config.gold)) gold = Math.max(0, config.gold);
        if (Number.isFinite(config.currency)) gold = Math.max(0, config.currency);
        if (config.registry) registry = config.registry;
      }
    } else if (maxSlotsOrConfig && typeof maxSlotsOrConfig === "object") {
      if (Number.isInteger(maxSlotsOrConfig.maxSlots)) maxSlots = maxSlotsOrConfig.maxSlots;
      if (Number.isInteger(maxSlotsOrConfig.maxStack) && maxSlotsOrConfig.maxStack >= 1) maxStack = maxSlotsOrConfig.maxStack;
      if (Number.isFinite(maxSlotsOrConfig.gold)) gold = Math.max(0, maxSlotsOrConfig.gold);
      if (Number.isFinite(maxSlotsOrConfig.currency)) gold = Math.max(0, maxSlotsOrConfig.currency);
      if (maxSlotsOrConfig.registry) registry = maxSlotsOrConfig.registry;
    }
    this.maxSlots = maxSlots;
    this.maxStack = maxStack;
    this.slots = [];
    this.gold = gold;
    this.registry = registry;
    this.equipmentSystem = new EquipmentSystem({ inventory: this });
    this.onItemAdded = null;
    this.onItemRemoved = null;
  }
  /**
   * Currency alias for gold.
   * @type {number}
   */
  get currency() {
    return this.gold;
  }
  set currency(value) {
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError("Currency must be a non-negative finite number");
    }
    this.gold = value;
  }
  /**
   * Equipment mapping getter mirroring the equipment system slots.
   * Non-null slots are enumerable so Object.entries(equipment) reflects only equipped items,
   * while direct slot property access (e.g. equipment.mainHand or equipment.weapon) returns the item or null.
   * @type {Object}
   */
  get equipment() {
    const slots = this.equipmentSystem.slots;
    return new Proxy(slots, {
      get(target, prop) {
        if (prop === "weapon" || prop === "hand") {
          return target.mainHand ?? null;
        }
        if (typeof prop === "string" && prop in target) {
          return target[prop] ?? null;
        }
        return target[prop];
      },
      has(target, prop) {
        if (prop === "weapon" || prop === "hand") {
          return target.mainHand !== null;
        }
        return prop in target && target[prop] !== null;
      },
      ownKeys(target) {
        const keys = [];
        for (const k of Object.keys(target)) {
          if (target[k] !== null) {
            const item = target[k];
            if (k === "mainHand" && item?.slot === "weapon") {
              keys.push("weapon");
            } else {
              keys.push(k);
            }
          }
        }
        return keys;
      },
      getOwnPropertyDescriptor(target, prop) {
        if ((prop === "weapon" || prop === "hand") && target.mainHand) {
          return {
            value: target.mainHand,
            writable: true,
            enumerable: true,
            configurable: true
          };
        }
        if (target[prop] !== null && target[prop] !== void 0) {
          return {
            value: target[prop],
            writable: true,
            enumerable: true,
            configurable: true
          };
        }
        return void 0;
      }
    });
  }
  set equipment(value) {
    if (value && typeof value === "object") {
      this.equipmentSystem.restoreSnapshot(value);
    }
  }
  /**
   * Check if inventory is full.
   * @type {boolean}
   */
  get isFull() {
    return this.slots.length >= this.maxSlots;
  }
  /**
   * Resolve an item object from item or item id.
   * @private
   * @param {Object|string} itemOrId
   * @returns {Object|null}
   */
  _resolveItem(itemOrId) {
    if (!itemOrId) return null;
    if (typeof itemOrId === "object" && itemOrId.id) return itemOrId;
    if (typeof itemOrId === "string" && this.registry) return this.registry.get(itemOrId);
    return null;
  }
  /**
   * Resolve the maxStack limit for an item.
   * @param {Object} item
   * @returns {number}
   */
  getItemMaxStack(item) {
    if (!item) return 1;
    if (Number.isInteger(item.maxStack) && item.maxStack >= 1) return item.maxStack;
    if (Number.isInteger(item.stackable) && item.stackable >= 1) return item.stackable;
    if (item.type === "consumable") return this.maxStack;
    return 1;
  }
  /**
   * Check whether an item quantity can be added without exceeding capacity limits.
   * @param {Object|string} itemOrId
   * @param {number} [quantity]
   * @returns {boolean}
   */
  canAddItem(itemOrId, quantity = 1) {
    const item = this._resolveItem(itemOrId);
    if (!item || !Number.isInteger(quantity) || quantity < 1) return false;
    const maxStack = this.getItemMaxStack(item);
    let remaining = quantity;
    if (maxStack > 1) {
      for (const slot of this.slots) {
        if (slot.item.id === item.id && slot.quantity < maxStack) {
          remaining -= Math.max(0, maxStack - slot.quantity);
        }
      }
    }
    const needed = maxStack > 1 ? Math.ceil(Math.max(0, remaining) / maxStack) : remaining;
    return this.slots.length + needed <= this.maxSlots;
  }
  /**
   * Add an item to the inventory.
   * Stacks with existing matching slots up to maxStack, then allocates new slots.
   * Enforces maxSlots capacity limits to prevent overflow.
   * @param {Object|string} itemOrId
   * @param {number} [quantity]
   * @param {Object} [options]
   * @returns {boolean} True if added successfully, false if rejected due to capacity.
   */
  addItem(itemOrId, quantity = 1, options = {}) {
    const item = this._resolveItem(itemOrId);
    if (!item || !Number.isInteger(quantity) || quantity < 1) return false;
    const allowPartial = options.allowPartial ?? false;
    if (!allowPartial && !this.canAddItem(item, quantity)) {
      return false;
    }
    const maxStack = this.getItemMaxStack(item);
    let remaining = quantity;
    if (maxStack > 1) {
      for (const slot of this.slots) {
        if (slot.item.id === item.id && slot.quantity < maxStack) {
          const addAmount = Math.min(remaining, maxStack - slot.quantity);
          slot.quantity += addAmount;
          remaining -= addAmount;
          if (this.onItemAdded) this.onItemAdded(item, addAmount);
          if (remaining === 0) return true;
        }
      }
    }
    while (remaining > 0 && this.slots.length < this.maxSlots) {
      const addAmount = maxStack > 1 ? Math.min(remaining, maxStack) : 1;
      this.slots.push({ item, quantity: addAmount });
      remaining -= addAmount;
      if (this.onItemAdded) this.onItemAdded(item, addAmount);
    }
    return remaining === 0;
  }
  /**
   * Remove an item quantity from the inventory.
   * @param {string} itemId
   * @param {number} [quantity]
   * @returns {boolean} True if removed successfully, false if insufficient items.
   */
  removeItem(itemId, quantity = 1) {
    if (typeof itemId !== "string" || !Number.isInteger(quantity) || quantity < 1) return false;
    if (this.getItemCount(itemId) < quantity) return false;
    let remaining = quantity;
    for (let i = this.slots.length - 1; i >= 0 && remaining > 0; i--) {
      if (this.slots[i].item.id === itemId) {
        const removeAmount = Math.min(remaining, this.slots[i].quantity);
        this.slots[i].quantity -= removeAmount;
        remaining -= removeAmount;
        if (this.onItemRemoved) this.onItemRemoved(this.slots[i].item, removeAmount);
        if (this.slots[i].quantity === 0) {
          this.slots.splice(i, 1);
        }
      }
    }
    return remaining === 0;
  }
  /**
   * Check if inventory contains at least quantity of an item.
   * @param {string} itemId
   * @param {number} [quantity]
   * @returns {boolean}
   */
  hasItem(itemId, quantity = 1) {
    if (typeof itemId !== "string" || !Number.isInteger(quantity) || quantity < 1) return false;
    return this.getItemCount(itemId) >= quantity;
  }
  /**
   * Get total quantity of an item across all slots.
   * @param {string} itemId
   * @returns {number}
   */
  getItemCount(itemId) {
    if (typeof itemId !== "string") return 0;
    let count = 0;
    for (const slot of this.slots) {
      if (slot.item.id === itemId) {
        count += slot.quantity;
      }
    }
    return count;
  }
  /**
   * Consume a consumable item, applying its effects to the target and decrementing count.
   * Supports targets that are Combatant, Stats, or custom entities.
   * @param {string} itemId
   * @param {Object} target - Target Combatant or Stats.
   * @returns {boolean} True if consumed successfully, false otherwise.
   */
  consume(itemId, target) {
    if (typeof itemId !== "string") return false;
    const slot = this.slots.find((entry) => entry.item.id === itemId);
    if (!slot || slot.item.type !== "consumable") return false;
    const item = slot.item;
    const effects = item.effects ?? {};
    if (Number.isFinite(effects.health)) {
      if (typeof target?.heal === "function") {
        target.heal(effects.health);
      } else if (Number.isFinite(target?.health)) {
        const max = target.maxHealth ?? Infinity;
        target.health = Math.min(max, target.health + effects.health);
      }
    }
    if (Number.isFinite(effects.stamina) && Number.isFinite(target?.stamina)) {
      const maxStamina = target.maxStamina ?? Infinity;
      target.stamina = Math.min(maxStamina, target.stamina + effects.stamina);
    }
    const statMods = effects.stats ?? effects.statModifiers ?? {};
    for (const [statName, amount] of Object.entries(statMods)) {
      if (Number.isFinite(amount)) {
        if (Number.isFinite(target?.[statName])) {
          target[statName] += amount;
        } else if (target?.stats && Number.isFinite(target.stats[statName])) {
          target.stats[statName] += amount;
        }
      }
    }
    if (effects.statusEffect && typeof target?.applyEffect === "function") {
      target.applyEffect(effects.statusEffect);
    }
    if (typeof item.onUse === "function") {
      item.onUse(target, item);
    }
    this.removeItem(itemId, 1);
    return true;
  }
  /**
   * Alias for consume.
   * @param {string} itemId
   * @param {Object} target
   * @returns {boolean}
   */
  useItem(itemId, target) {
    return this.consume(itemId, target);
  }
  /**
   * Alias for consume.
   * @param {string} itemId
   * @param {Object} target
   * @returns {boolean}
   */
  consumeItem(itemId, target) {
    return this.consume(itemId, target);
  }
  /**
   * Equip an item from inventory into designated equipment slot.
   * @param {string} slotOrItemId
   * @param {string} [maybeItemId]
   * @returns {Object|boolean}
   */
  equip(slotOrItemId, maybeItemId) {
    let slotName = null;
    let itemId = null;
    if (maybeItemId !== void 0) {
      slotName = slotOrItemId;
      itemId = maybeItemId;
    } else {
      itemId = slotOrItemId;
    }
    const slotIndex = this.slots.findIndex((entry) => entry.item.id === itemId);
    if (slotIndex === -1) return false;
    const item = this.slots[slotIndex].item;
    if (!slotName) {
      slotName = item.slot ?? (item.type === "weapon" ? "mainHand" : item.type === "armor" ? "armor" : item.type === "accessory" ? "accessory" : null);
    }
    const designatedSlot = this.equipmentSystem.normalizeSlot(slotName);
    if (!designatedSlot || !this.equipmentSystem.canEquip(designatedSlot, item)) {
      return false;
    }
    const prior = this.equipmentSystem.slots[designatedSlot];
    this.removeItem(itemId, 1);
    this.equipmentSystem.equip(designatedSlot, item);
    if (prior) {
      this.addItem(prior, 1);
    }
    return prior ?? item;
  }
  /**
   * Unequip an item from equipment slot back into inventory.
   * Rejects if inventory has no capacity to store the unequipped item.
   * @param {string} slot
   * @returns {Object|boolean} Unequipped item or false if failed.
   */
  unequip(slot) {
    const designatedSlot = this.equipmentSystem.normalizeSlot(slot);
    if (!designatedSlot) return false;
    const item = this.equipmentSystem.slots[designatedSlot];
    if (!item) return false;
    if (!this.canAddItem(item, 1)) {
      return false;
    }
    this.equipmentSystem.unequip(designatedSlot);
    this.addItem(item, 1);
    return item;
  }
  /**
   * Add currency (gold).
   * @param {number} amount
   * @returns {number} Total currency.
   */
  addCurrency(amount) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RangeError("Currency amount must be a non-negative finite number");
    }
    this.gold += amount;
    return this.gold;
  }
  /**
   * Deduct currency (gold) if sufficient.
   * @param {number} amount
   * @returns {boolean} True if deducted, false if insufficient.
   */
  removeCurrency(amount) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RangeError("Currency amount must be a non-negative finite number");
    }
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }
  /**
   * Check if inventory has at least currency amount.
   * @param {number} amount
   * @returns {boolean}
   */
  hasCurrency(amount) {
    if (!Number.isFinite(amount) || amount < 0) return false;
    return this.gold >= amount;
  }
  /**
   * Create persistence snapshot of inventory, equipment, and currency.
   * @returns {Object}
   */
  createSnapshot() {
    return {
      version: 1,
      maxSlots: this.maxSlots,
      maxStack: this.maxStack,
      currency: this.gold,
      gold: this.gold,
      slots: this.slots.map((s) => ({
        itemId: s.item.id,
        quantity: s.quantity,
        item: structuredClone(s.item)
      })),
      equipment: this.equipmentSystem.createSnapshot()
    };
  }
  /**
   * Restore inventory, equipment, and currency from persistence snapshot.
   * @param {Object} snapshot
   * @param {Object} [options]
   * @returns {boolean}
   */
  restoreSnapshot(snapshot, options = {}) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new TypeError("Invalid inventory snapshot data");
    }
    if (Number.isInteger(snapshot.maxSlots) && snapshot.maxSlots >= 0) {
      this.maxSlots = snapshot.maxSlots;
    }
    if (Number.isInteger(snapshot.maxStack) && snapshot.maxStack >= 1) {
      this.maxStack = snapshot.maxStack;
    }
    this.gold = Number.isFinite(snapshot.currency) ? Math.max(0, snapshot.currency) : Number.isFinite(snapshot.gold) ? Math.max(0, snapshot.gold) : 0;
    const registry = options.registry ?? this.registry;
    const target = options.target ?? null;
    this.slots = [];
    if (Array.isArray(snapshot.slots)) {
      for (const slotData of snapshot.slots) {
        let item = slotData.item;
        if (!item && registry && slotData.itemId) {
          item = registry.get(slotData.itemId);
        }
        if (item && Number.isInteger(slotData.quantity) && slotData.quantity > 0) {
          this.slots.push({
            item: structuredClone(item),
            quantity: slotData.quantity
          });
        }
      }
    }
    if (snapshot.equipment) {
      this.equipmentSystem.restoreSnapshot(snapshot.equipment, { registry, target });
    }
    return true;
  }
  /**
   * Export to plain JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return {
      maxSlots: this.maxSlots,
      gold: this.gold,
      currency: this.gold,
      slots: this.slots.map((slot) => ({
        item: structuredClone(slot.item),
        quantity: slot.quantity
      })),
      equipment: structuredClone(this.equipmentSystem.toJSON())
    };
  }
  /**
   * Load state from plain JSON representation.
   * @param {Object} data
   */
  loadJSON(data) {
    if (!data || !Number.isInteger(data.maxSlots) || data.maxSlots < 0 || !Array.isArray(data.slots) || !Number.isFinite(data.gold) || data.gold < 0) {
      throw new TypeError("Invalid inventory data");
    }
    if (data.slots.length > data.maxSlots || data.slots.some((slot) => !slot.item || !Number.isInteger(slot.quantity) || slot.quantity < 1 || slot.quantity > (slot.item.maxStack ?? slot.item.stackable ?? 1))) {
      throw new TypeError("Invalid inventory slots");
    }
    this.maxSlots = data.maxSlots;
    this.gold = data.gold;
    this.slots = data.slots.map((slot) => ({ item: structuredClone(slot.item), quantity: slot.quantity }));
    for (const slot of EQUIPMENT_SLOTS) {
      this.equipmentSystem.slots[slot] = null;
    }
    if (data.equipment) {
      const eqData = data.equipment.slots ?? data.equipment;
      for (const [k, v] of Object.entries(eqData)) {
        const designatedSlot = this.equipmentSystem.normalizeSlot(k);
        if (designatedSlot && v) {
          this.equipmentSystem.slots[designatedSlot] = structuredClone(v);
        }
      }
    }
  }
};
var LootTable = class _LootTable {
  /**
   * @param {Array.<Object>} [entries] - Initial loot entries.
   * @param {Object} [config] - Optional configuration { id, name }.
   */
  constructor(entries = [], config = {}) {
    this.id = config.id ?? null;
    this.name = config.name ?? null;
    this.entries = [];
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        this.addEntry(entry);
      }
    }
  }
  /**
   * Add a drop entry to the loot table.
   * @param {Object} entry - { itemId, weight, minQuantity, maxQuantity, chance, item }
   * @returns {LootTable}
   */
  addEntry(entry) {
    if (!entry || typeof entry !== "object") {
      throw new TypeError("LootTable entry must be an object");
    }
    const itemId = entry.itemId ?? entry.id;
    if (typeof itemId !== "string" || !itemId.trim()) {
      throw new TypeError("LootTable entry itemId must be a non-empty string");
    }
    const weight = Number.isFinite(entry.weight) ? Math.max(0, entry.weight) : 1;
    const chance = Number.isFinite(entry.chance) ? Math.min(1, Math.max(0, entry.chance)) : 1;
    let minQuantity = 1;
    if (Number.isInteger(entry.minQuantity) && entry.minQuantity >= 1) minQuantity = entry.minQuantity;
    else if (Number.isInteger(entry.min) && entry.min >= 1) minQuantity = entry.min;
    else if (Number.isInteger(entry.quantity) && entry.quantity >= 1) minQuantity = entry.quantity;
    let maxQuantity = minQuantity;
    if (Number.isInteger(entry.maxQuantity) && entry.maxQuantity >= minQuantity) maxQuantity = entry.maxQuantity;
    else if (Number.isInteger(entry.max) && entry.max >= minQuantity) maxQuantity = entry.max;
    this.entries.push({
      itemId: itemId.trim(),
      weight,
      chance,
      minQuantity,
      maxQuantity,
      item: entry.item ?? null
    });
    return this;
  }
  /**
   * Convenience method to add an item drop.
   * @param {string} itemId
   * @param {number} [weight]
   * @param {number} [minQuantity]
   * @param {number} [maxQuantity]
   * @param {number} [chance]
   * @returns {LootTable}
   */
  addItem(itemId, weight = 1, minQuantity = 1, maxQuantity = 1, chance = 1) {
    return this.addEntry({ itemId, weight, minQuantity, maxQuantity, chance });
  }
  /**
   * Remove a drop entry by item id.
   * @param {string} itemId
   * @returns {boolean}
   */
  removeEntry(itemId) {
    if (typeof itemId !== "string") return false;
    const initialLen = this.entries.length;
    this.entries = this.entries.filter((e) => e.itemId !== itemId);
    return this.entries.length < initialLen;
  }
  /**
   * Roll drops from this loot table.
   * Supports weighted roll mode (default) and independent chance mode.
   * Produces random quantities between minQuantity and maxQuantity inclusive.
   * @param {Object|Function} [optionsOrRandom] - Options object or custom random function.
   * @returns {Array.<Object>} Array of generated drops { itemId, quantity, [item] }
   */
  roll(optionsOrRandom = {}) {
    let random = Math.random;
    let rolls = 1;
    let mode = "weighted";
    if (typeof optionsOrRandom === "function") {
      random = optionsOrRandom;
    } else if (optionsOrRandom && typeof optionsOrRandom === "object") {
      if (typeof optionsOrRandom.random === "function") random = optionsOrRandom.random;
      if (Number.isInteger(optionsOrRandom.rolls) && optionsOrRandom.rolls >= 1) rolls = optionsOrRandom.rolls;
      if (typeof optionsOrRandom.mode === "string") mode = optionsOrRandom.mode;
    }
    if (this.entries.length === 0) return [];
    if (mode === "independent") {
      const results2 = [];
      for (const entry of this.entries) {
        const rollVal = random();
        if (rollVal <= entry.chance) {
          const quantity = this._rollQuantity(entry, random);
          if (quantity > 0) {
            results2.push({
              itemId: entry.itemId,
              quantity,
              item: entry.item
            });
          }
        }
      }
      return results2;
    }
    const totalWeight = this.entries.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight <= 0) return [];
    const results = [];
    for (let r = 0; r < rolls; r++) {
      let rollPick = random() * totalWeight;
      let selected = this.entries[this.entries.length - 1];
      for (const entry of this.entries) {
        if (rollPick < entry.weight) {
          selected = entry;
          break;
        }
        rollPick -= entry.weight;
      }
      if (selected.chance < 1 && random() > selected.chance) {
        continue;
      }
      const quantity = this._rollQuantity(selected, random);
      if (quantity > 0) {
        const existing = results.find((d) => d.itemId === selected.itemId);
        if (existing) {
          existing.quantity += quantity;
        } else {
          results.push({
            itemId: selected.itemId,
            quantity,
            item: selected.item
          });
        }
      }
    }
    return results;
  }
  /**
   * Compute quantity between minQuantity and maxQuantity inclusive.
   * @private
   * @param {Object} entry
   * @param {Function} random
   * @returns {number}
   */
  _rollQuantity(entry, random) {
    if (entry.minQuantity === entry.maxQuantity) {
      return entry.minQuantity;
    }
    const delta = entry.maxQuantity - entry.minQuantity;
    const randVal = Math.min(0.999999, Math.max(0, random()));
    return entry.minQuantity + Math.floor(randVal * (delta + 1));
  }
  /**
   * Export to plain JSON representation.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      entries: this.entries.map((e) => ({ ...e }))
    };
  }
  /**
   * Reconstruct a LootTable from JSON data.
   * @param {Object} data
   * @returns {LootTable}
   */
  static fromJSON(data) {
    if (!data || !Array.isArray(data.entries)) {
      throw new TypeError("Invalid LootTable data");
    }
    return new _LootTable(data.entries, { id: data.id, name: data.name });
  }
};
function createRPGSnapshot({ inventory: inventory2 = null, equipment: equipment2 = null, currency = 0 } = {}) {
  return {
    version: 1,
    timestamp: Date.now(),
    currency: Number.isFinite(currency) ? currency : inventory2?.gold ?? 0,
    inventory: inventory2 ? inventory2.createSnapshot() : null,
    equipment: equipment2 ? equipment2.createSnapshot() : inventory2?.equipmentSystem ? inventory2.equipmentSystem.createSnapshot() : null
  };
}
function restoreRPGSnapshot(snapshot, { inventory: inventory2 = null, equipment: equipment2 = null, target = null, registry = null } = {}) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new TypeError("Invalid RPG snapshot");
  }
  if (inventory2 && snapshot.inventory) {
    inventory2.restoreSnapshot(snapshot.inventory, { registry, target });
  } else if (inventory2 && Number.isFinite(snapshot.currency)) {
    inventory2.gold = snapshot.currency;
  }
  if (equipment2 && snapshot.equipment) {
    equipment2.restoreSnapshot(snapshot.equipment, { registry, target });
  }
  return true;
}

// src/larissa/enemyAI.js
init_component();
init_tilemap();

// src/larissa/combat.js
init_component();
var finiteNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a finite non-negative number`);
};
var deepFreeze2 = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze2(child);
    Object.freeze(value);
  }
  return value;
};
var AttackDefinition = class {
  constructor(config = {}) {
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new TypeError("AttackDefinition requires an object");
    if (typeof config.name !== "string" || !config.name.trim()) throw new TypeError("Attack name must be a non-empty string");
    const requestedMode = config.mode ?? "melee";
    if (!["melee", "ranged", "projectile", "area"].includes(requestedMode)) throw new TypeError("Attack mode must be melee, ranged, projectile, or area");
    const mode = requestedMode === "ranged" ? "projectile" : requestedMode;
    const timings = {
      startup: config.startup ?? 0,
      active: config.active ?? 0.1,
      recovery: config.recovery ?? 0,
      cooldown: config.cooldown ?? 0
    };
    for (const [name, value] of Object.entries(timings)) finiteNonNegative(value, `Attack ${name}`);
    if (timings.active <= 0) throw new TypeError("Attack active duration must be greater than zero");
    const range = config.range ?? 32;
    const damage = config.damage ?? 1;
    finiteNonNegative(range, "Attack range");
    finiteNonNegative(damage, "Attack damage");
    if (range <= 0) throw new TypeError("Attack range must be greater than zero");
    const targeting = config.targeting ?? "hostile";
    if (!["hostile", "friendly", "any"].includes(targeting)) throw new TypeError("Attack targeting must be hostile, friendly, or any");
    const hitbox = config.hitbox ?? {};
    const shape = { width: hitbox.width ?? range, height: hitbox.height ?? range, offsetX: hitbox.offsetX ?? 0, offsetY: hitbox.offsetY ?? 0 };
    if (![shape.width, shape.height, shape.offsetX, shape.offsetY].every(Number.isFinite) || shape.width <= 0 || shape.height <= 0) {
      throw new TypeError("Attack hitbox dimensions must be positive finite numbers and offsets must be finite");
    }
    const knockback = config.knockback ?? { x: 0, y: 0 };
    if (!knockback || !Number.isFinite(knockback.x) || !Number.isFinite(knockback.y)) throw new TypeError("Attack knockback requires finite x and y values");
    const projectileSpeed = config.projectileSpeed ?? 0;
    finiteNonNegative(projectileSpeed, "Projectile speed");
    if (mode === "projectile" && projectileSpeed <= 0) throw new TypeError("Projectile attacks require a positive projectileSpeed");
    const statusEffect = config.statusEffect ?? null;
    if (statusEffect !== null && (!statusEffect || typeof statusEffect.name !== "string" || !statusEffect.name || !Number.isFinite(statusEffect.duration) || statusEffect.duration <= 0)) {
      throw new TypeError("Attack statusEffect requires a name and positive finite duration");
    }
    const damageType = config.damageType ?? "physical";
    if (typeof damageType !== "string" || !damageType) throw new TypeError("Attack damageType must be a non-empty string");
    const piercing = config.piercing ?? false;
    if (typeof piercing !== "boolean") throw new TypeError("Attack piercing must be a boolean");
    Object.assign(this, {
      name: config.name,
      mode,
      ...timings,
      range,
      damage,
      targeting,
      hitbox: shape,
      knockback: { x: knockback.x, y: knockback.y },
      projectileSpeed,
      piercing,
      statusEffect: statusEffect ? structuredClone(statusEffect) : null,
      damageType,
      staggerDuration: config.staggerDuration ?? 0
    });
    finiteNonNegative(this.staggerDuration, "Attack staggerDuration");
    Object.freeze(this.hitbox);
    Object.freeze(this.knockback);
    if (this.statusEffect) deepFreeze2(this.statusEffect);
    Object.freeze(this);
  }
};
var Combatant = class _Combatant extends Component {
  constructor(config = {}) {
    super();
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new TypeError("Combatant requires an object");
    this.id = config.id ?? `combatant-${_Combatant._nextId++}`;
    if (typeof this.id !== "string" || !this.id) throw new TypeError("Combatant id must be a non-empty string");
    this.faction = config.faction ?? "neutral";
    if (typeof this.faction !== "string" || !this.faction) throw new TypeError("Combatant faction must be a non-empty string");
    this._maxHealth = config.maxHealth ?? 100;
    if (!Number.isFinite(this._maxHealth) || this._maxHealth <= 0) throw new TypeError("maxHealth must be a positive finite number");
    this._health = config.health ?? this._maxHealth;
    if (!Number.isFinite(this._health) || this._health < 0 || this._health > this._maxHealth) throw new TypeError("health must be a finite value between zero and maxHealth");
    this.position = { x: config.x ?? 0, y: config.y ?? 0 };
    if (!Number.isFinite(this.position.x) || !Number.isFinite(this.position.y)) throw new TypeError("Combatant position must be finite");
    this.hurtbox = { width: config.hurtbox?.width ?? 16, height: config.hurtbox?.height ?? 16 };
    if (![this.hurtbox.width, this.hurtbox.height].every(Number.isFinite) || this.hurtbox.width <= 0 || this.hurtbox.height <= 0) throw new TypeError("Hurtbox dimensions must be positive finite numbers");
    const resistances = config.resistances ?? {};
    if (!resistances || typeof resistances !== "object" || Array.isArray(resistances)) throw new TypeError("resistances must be an object");
    this.resistances = { ...resistances };
    for (const [type, resistance] of Object.entries(this.resistances)) {
      if (typeof type !== "string" || !Number.isFinite(resistance) || resistance < 0 || resistance > 1) throw new TypeError("Resistances must be finite fractions from zero to one");
    }
    this.invulnerabilityDuration = config.invulnerabilityDuration ?? 0.5;
    finiteNonNegative(this.invulnerabilityDuration, "invulnerabilityDuration");
    this.invulnerableRemaining = 0;
    this.staggerRemaining = 0;
    this.effects = [];
    this.body = config.body ?? null;
    this.cooldowns = /* @__PURE__ */ new Map();
    this.onDeath = null;
    this.onDamage = null;
    this.onHeal = null;
    this._healthListeners = /* @__PURE__ */ new Set();
    this._deathNotified = !this.isAlive;
  }
  static _nextId = 1;
  get isAlive() {
    return this.health > 0;
  }
  get isStaggered() {
    return this.staggerRemaining > 0;
  }
  get maxHealth() {
    return this._maxHealth;
  }
  set maxHealth(value) {
    if (!Number.isFinite(value) || value <= 0) throw new TypeError("maxHealth must be a positive finite number");
    this._maxHealth = value;
    if (this._health > value) this.setHealth(value, { notify: false });
  }
  get health() {
    return this._health;
  }
  // Preserve legacy direct-assignment behavior; use setHealth for observable changes.
  set health(value) {
    this.setHealth(value, { notify: false });
  }
  /** Explicitly link the legacy Stats view to this authoritative health state. */
  bindStats(stats) {
    if (!stats || typeof stats.bindCombatant !== "function") throw new TypeError("bindStats requires a Stats component");
    stats.bindCombatant(this);
    return stats;
  }
  onHealthChanged(listener) {
    if (typeof listener !== "function") throw new TypeError("onHealthChanged requires a listener");
    this._healthListeners.add(listener);
    return () => this._healthListeners.delete(listener);
  }
  _emitHealthChanged(type, amount, killed = false) {
    if (amount <= 0) return;
    const event = { type, amount, killed, combatant: this };
    if (type === "damage") this.onDamage?.(amount, this);
    else this.onHeal?.(amount, this);
    for (const listener of [...this._healthListeners]) listener(event);
  }
  /** Set health through the validated authoritative path; used by Stats compatibility writes. */
  setHealth(value, { notify = true } = {}) {
    if (!Number.isFinite(value) || value < 0 || value > this.maxHealth) throw new TypeError("health must be a finite value between zero and maxHealth");
    const before = this._health;
    this._health = value;
    const killed = before > 0 && value === 0;
    if (value > 0) this._deathNotified = false;
    if (killed && !this._deathNotified) {
      this._deathNotified = true;
      if (notify) this.onDeath?.(this);
    }
    const delta = Math.abs(value - before);
    if (notify) this._emitHealthChanged(value < before ? "damage" : "heal", delta, killed);
    return delta;
  }
  /** Restore health up to maxHealth and return the amount restored. */
  heal(amount) {
    finiteNonNegative(amount, "Healing amount");
    return this.setHealth(Math.min(this.maxHealth, this.health + amount));
  }
  canTarget(targeting, other) {
    if (!(other instanceof _Combatant) || other === this || !other.isAlive) return false;
    return targeting === "any" || (targeting === "hostile" ? other.faction !== this.faction : other.faction === this.faction);
  }
  getModifiedStat(stat, baseValue = 1) {
    if (typeof stat !== "string" || !stat || !Number.isFinite(baseValue)) throw new TypeError("getModifiedStat requires a stat name and finite base value");
    return this.effects.reduce((value, effect) => Object.hasOwn(effect.modifiers, stat) ? value * effect.modifiers[stat] : value, baseValue);
  }
  receiveDamage({ amount, type = "physical", stagger = 0, knockback = null } = {}) {
    finiteNonNegative(amount, "Damage amount");
    finiteNonNegative(stagger, "Stagger duration");
    if (typeof type !== "string" || !type) throw new TypeError("Damage type must be a non-empty string");
    if (!this.isAlive || this.invulnerableRemaining > 0) return { applied: false, damage: 0, killed: false };
    const resistance = this.resistances[type] ?? 0;
    const damage = Math.max(0, amount * (1 - resistance));
    const actual = this.setHealth(Math.max(0, this.health - damage));
    this.invulnerableRemaining = this.invulnerabilityDuration;
    this.staggerRemaining = Math.max(this.staggerRemaining, stagger);
    if (knockback && typeof knockback.applyKnockback === "function") knockback.applyKnockback(knockback.x, knockback.y);
    const killed = this.health === 0;
    return { applied: true, damage: actual, killed };
  }
  applyEffect(effect) {
    if (!effect || typeof effect.name !== "string" || !effect.name || !Number.isFinite(effect.duration) || effect.duration <= 0) {
      throw new TypeError("Status effect requires a name and positive finite duration");
    }
    const modifiers = effect.modifiers ?? {};
    if (!modifiers || typeof modifiers !== "object" || Array.isArray(modifiers)) throw new TypeError("Status effect modifiers must be an object");
    for (const [stat, multiplier] of Object.entries(modifiers)) {
      if (!stat || !Number.isFinite(multiplier) || multiplier < 0) throw new TypeError("Status effect modifiers must have named stats and finite non-negative multipliers");
    }
    const entry = { name: effect.name, duration: effect.duration, modifiers: structuredClone(modifiers) };
    const existing = this.effects.find((item) => item.name === entry.name);
    if (existing) {
      existing.duration = Math.max(existing.duration, entry.duration);
      existing.modifiers = entry.modifiers;
    } else this.effects.push(entry);
    return entry;
  }
  update(deltaTime) {
    finiteNonNegative(deltaTime, "Combatant deltaTime");
    this.invulnerableRemaining = Math.max(0, this.invulnerableRemaining - deltaTime);
    this.staggerRemaining = Math.max(0, this.staggerRemaining - deltaTime);
    for (const effect of this.effects) effect.duration -= deltaTime;
    this.effects = this.effects.filter((effect) => effect.duration > 0);
    for (const [name, remaining] of this.cooldowns) {
      const next = Math.max(0, remaining - deltaTime);
      if (next === 0) this.cooldowns.delete(name);
      else this.cooldowns.set(name, next);
    }
  }
  destroy() {
    for (const listener of [...this._healthListeners]) listener({ type: "destroy", amount: 0, killed: false, combatant: this });
    this._healthListeners.clear();
    super.destroy();
  }
};
var CombatSystem = class {
  constructor() {
    this._attacks = /* @__PURE__ */ new Map();
    this._projectiles = [];
    this._listeners = /* @__PURE__ */ new Map();
    this._serial = 1;
    this._step = 0;
  }
  on(event, listener) {
    if (typeof event !== "string" || !event || typeof listener !== "function") throw new TypeError("CombatSystem.on requires an event and listener");
    if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
    this._listeners.get(event).add(listener);
    return () => this._listeners.get(event)?.delete(listener);
  }
  _emit(event, payload) {
    for (const listener of [...this._listeners.get(event) ?? []]) listener({ event, ...payload });
  }
  /** Publish an environment interaction (hazard, landing, trigger, etc.) for feedback consumers. */
  reportEnvironmentContact(combatant, contact) {
    if (!(combatant instanceof Combatant)) throw new TypeError("reportEnvironmentContact requires a Combatant");
    if (!contact || typeof contact !== "object" || Array.isArray(contact) || typeof contact.type !== "string" || !contact.type) {
      throw new TypeError("Environment contact requires an object with a non-empty type");
    }
    this._emit("environment", { combatant, contact: { ...contact } });
    return true;
  }
  startAttack(attacker, definition, aim = { x: 1, y: 0 }) {
    if (!(attacker instanceof Combatant) || !(definition instanceof AttackDefinition)) throw new TypeError("startAttack requires a Combatant and AttackDefinition");
    if (!attacker.isAlive) return false;
    if (attacker.isStaggered || attacker.cooldowns.has(definition.name) || this._attacks.has(attacker)) return false;
    if (!aim || !Number.isFinite(aim.x) || !Number.isFinite(aim.y) || Math.hypot(aim.x, aim.y) === 0) throw new TypeError("Attack aim must be a non-zero finite vector");
    const length = Math.hypot(aim.x, aim.y);
    const state = { id: this._serial++, attacker, definition, phase: "startup", elapsed: 0, targetsHit: /* @__PURE__ */ new Set(), aim: { x: aim.x / length, y: aim.y / length }, spawned: false };
    this._attacks.set(attacker, state);
    this._emit("attackStart", { attacker, definition, attackId: state.id });
    return true;
  }
  _hitTargets(state, targets) {
    const { attacker, definition } = state;
    const centerX = attacker.position.x + definition.hitbox.offsetX + state.aim.x * (definition.mode === "melee" ? definition.range / 2 : 0);
    const centerY = attacker.position.y + definition.hitbox.offsetY + state.aim.y * (definition.mode === "melee" ? definition.range / 2 : 0);
    const attackBounds = {
      left: centerX - definition.hitbox.width / 2,
      right: centerX + definition.hitbox.width / 2,
      top: centerY - definition.hitbox.height / 2,
      bottom: centerY + definition.hitbox.height / 2
    };
    for (const target of targets) {
      if (!attacker.canTarget(definition.targeting, target) || state.targetsHit.has(target)) continue;
      if (Math.hypot(target.position.x - attacker.position.x, target.position.y - attacker.position.y) > definition.range) continue;
      if (target !== attacker && this._overlap(attackBounds, target.position, target.hurtbox)) this._applyHit(state, target);
    }
  }
  _overlap(bounds, position, box) {
    const other = {
      left: position.x - box.width / 2,
      right: position.x + box.width / 2,
      top: position.y - box.height / 2,
      bottom: position.y + box.height / 2
    };
    return bounds.left < other.right && bounds.right > other.left && bounds.top < other.bottom && bounds.bottom > other.top;
  }
  _applyHit(state, target) {
    state.targetsHit.add(target);
    const { attacker, definition } = state;
    const result = target.receiveDamage({ amount: definition.damage * attacker.getModifiedStat("attack", 1), type: definition.damageType, stagger: definition.staggerDuration });
    if (result.applied && definition.statusEffect) {
      target.applyEffect(definition.statusEffect);
      this._emit("status", { attacker, target, definition, effect: definition.statusEffect });
    }
    if (result.applied && definition.staggerDuration > 0) this._emit("stagger", { attacker, target, definition, duration: definition.staggerDuration });
    if (result.applied && target.body && typeof target.body.applyKnockback === "function") {
      target.body.applyKnockback(definition.knockback.x, definition.knockback.y);
      this._emit("knockback", { attacker, target, definition, velocity: { ...definition.knockback } });
    }
    this._emit("hit", { attacker, target, definition, result });
    if (result.applied) {
      this._emit("damage", { attacker, target, definition, result });
      this._emit("hurt", { attacker, target, definition, result });
    }
    if (result.killed) this._emit("death", { attacker, target, definition });
  }
  _segmentOverlap(startX, startY, endX, endY, target, width, height) {
    const left = target.position.x - target.hurtbox.width / 2 - width / 2;
    const right = target.position.x + target.hurtbox.width / 2 + width / 2;
    const top = target.position.y - target.hurtbox.height / 2 - height / 2;
    const bottom = target.position.y + target.hurtbox.height / 2 + height / 2;
    let minimum = 0, maximum = 1;
    for (const [origin, delta, low, high] of [[startX, endX - startX, left, right], [startY, endY - startY, top, bottom]]) {
      if (delta === 0) {
        if (origin <= low || origin >= high) return false;
        continue;
      }
      let near = (low - origin) / delta;
      let far = (high - origin) / delta;
      if (near > far) [near, far] = [far, near];
      minimum = Math.max(minimum, near);
      maximum = Math.min(maximum, far);
      if (minimum > maximum) return false;
    }
    return true;
  }
  _spawnProjectile(state) {
    if (state.spawned) return;
    state.spawned = true;
    const d = state.definition;
    this._projectiles.push({
      attacker: state.attacker,
      definition: d,
      x: state.attacker.position.x,
      y: state.attacker.position.y,
      vx: state.aim.x * d.projectileSpeed,
      vy: state.aim.y * d.projectileSpeed,
      travelled: 0,
      targetsHit: /* @__PURE__ */ new Set(),
      id: state.id,
      bornStep: this._step
    });
    this._emit("projectile", { attacker: state.attacker, definition: d, attackId: state.id });
  }
  update(deltaTime, combatants = []) {
    finiteNonNegative(deltaTime, "CombatSystem deltaTime");
    if (!Array.isArray(combatants) || combatants.some((item) => !(item instanceof Combatant))) throw new TypeError("CombatSystem.update expects an array of Combatants");
    const ids = /* @__PURE__ */ new Set();
    for (const combatant of combatants) {
      if (ids.has(combatant.id)) throw new TypeError(`Duplicate combatant id: ${combatant.id}`);
      ids.add(combatant.id);
    }
    const world = [...combatants].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    this._step++;
    for (const combatant of world) combatant.update(deltaTime);
    for (const state of [...this._attacks.values()]) {
      let remaining = deltaTime;
      while (this._attacks.has(state.attacker)) {
        const duration = state.definition[state.phase];
        if (duration === 0) {
          if (state.phase === "startup") {
            state.phase = "active";
            this._emit("attackActive", { attacker: state.attacker, definition: state.definition });
          } else if (state.phase === "active") {
            state.phase = "recovery";
            this._emit("attackRecovery", { attacker: state.attacker, definition: state.definition });
          } else {
            state.attacker.cooldowns.set(state.definition.name, state.definition.cooldown);
            this._attacks.delete(state.attacker);
            this._emit("attackComplete", { attacker: state.attacker, definition: state.definition });
          }
          if (state.phase === "active" && state.definition.mode === "projectile") this._spawnProjectile(state);
          continue;
        }
        const slice = Math.min(remaining, Math.max(0, duration - state.elapsed));
        state.elapsed += slice;
        remaining -= slice;
        if (state.phase === "active") {
          if (state.definition.mode === "projectile") this._spawnProjectile(state);
          else this._hitTargets(state, world);
        }
        if (state.elapsed >= duration) {
          state.elapsed = 0;
          if (state.phase === "startup") {
            state.phase = "active";
            this._emit("attackActive", { attacker: state.attacker, definition: state.definition });
          } else if (state.phase === "active") {
            state.phase = "recovery";
            this._emit("attackRecovery", { attacker: state.attacker, definition: state.definition });
          } else {
            state.attacker.cooldowns.set(state.definition.name, state.definition.cooldown);
            this._attacks.delete(state.attacker);
            this._emit("attackComplete", { attacker: state.attacker, definition: state.definition });
          }
          if (state.phase === "active" && state.definition.mode === "projectile") this._spawnProjectile(state);
        }
        if (remaining <= 0 && this._attacks.has(state.attacker)) break;
      }
    }
    const nextProjectiles = [];
    for (const projectile of this._projectiles) {
      if (projectile.bornStep === this._step) {
        nextProjectiles.push(projectile);
        continue;
      }
      const step = Math.min(deltaTime, (projectile.definition.range - projectile.travelled) / projectile.definition.projectileSpeed);
      const startX = projectile.x, startY = projectile.y;
      projectile.x += projectile.vx * step;
      projectile.y += projectile.vy * step;
      projectile.travelled += projectile.definition.projectileSpeed * step;
      let consumed = false;
      for (const target of world) {
        if (projectile.attacker.canTarget(projectile.definition.targeting, target) && !projectile.targetsHit.has(target) && this._segmentOverlap(startX, startY, projectile.x, projectile.y, target, projectile.definition.hitbox.width, projectile.definition.hitbox.height)) {
          projectile.targetsHit.add(target);
          this._applyHit(projectile, target);
          if (!projectile.definition.piercing) {
            consumed = true;
            break;
          }
        }
      }
      if (!consumed && projectile.travelled < projectile.definition.range) nextProjectiles.push(projectile);
    }
    this._projectiles = nextProjectiles;
  }
};

// src/larissa/enemyAI.js
var finiteNonNegative2 = (value, name) => {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a finite non-negative number`);
};
var EnemyAI = class extends Component {
  constructor(config = {}) {
    super();
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new TypeError("EnemyAI requires a configuration object");
    if (!(config.tilemap instanceof Tilemap)) throw new TypeError("EnemyAI requires a Tilemap");
    if (config.actor === void 0 || config.actor === null) throw new TypeError("EnemyAI requires an occupant actor");
    this.tilemap = config.tilemap;
    this.actor = config.actor;
    this.spawn = { x: config.spawn?.x, y: config.spawn?.y };
    if (this.tilemap.gridIndex(this.spawn.x, this.spawn.y) === null) throw new TypeError("EnemyAI spawn must be inside the tilemap");
    this.patrolPoints = config.patrolPoints ?? [];
    if (!Array.isArray(this.patrolPoints) || this.patrolPoints.some((point) => !point || this.tilemap.gridIndex(point.x, point.y) === null)) {
      throw new TypeError("EnemyAI patrolPoints must be valid tile coordinates");
    }
    this.perceptionRadius = config.perceptionRadius ?? 6;
    this.attackRange = config.attackRange ?? 1;
    this.moveInterval = config.moveInterval ?? 0.2;
    this.attackCooldown = config.attackCooldown ?? 1;
    this.fleeHealthFraction = config.fleeHealthFraction ?? null;
    finiteNonNegative2(this.perceptionRadius, "perceptionRadius");
    finiteNonNegative2(this.attackRange, "attackRange");
    finiteNonNegative2(this.moveInterval, "moveInterval");
    finiteNonNegative2(this.attackCooldown, "attackCooldown");
    if (this.fleeHealthFraction !== null && (!Number.isFinite(this.fleeHealthFraction) || this.fleeHealthFraction < 0 || this.fleeHealthFraction > 1)) {
      throw new TypeError("fleeHealthFraction must be null or between zero and one");
    }
    this.attackDefinition = config.attackDefinition ?? null;
    if (this.attackDefinition !== null && !(this.attackDefinition instanceof AttackDefinition)) throw new TypeError("attackDefinition must be an AttackDefinition");
    this.combatSystem = config.combatSystem ?? null;
    if (this.combatSystem !== null && !(this.combatSystem instanceof CombatSystem)) throw new TypeError("combatSystem must be a CombatSystem");
    this.combatant = config.combatant ?? null;
    if (this.combatant !== null && !(this.combatant instanceof Combatant)) throw new TypeError("combatant must be a Combatant");
    this.group = config.group ?? null;
    if (this.group !== null && (typeof this.group !== "object" || Array.isArray(this.group))) throw new TypeError("group must be a shared object");
    this.onAttack = typeof config.onAttack === "function" ? config.onAttack : null;
    this.state = "idle";
    this.target = null;
    this.patrolIndex = 0;
    this._moveTimer = 0;
    this._attackTimer = 0;
    this.onStateChange = null;
  }
  _position(actor) {
    for (const [index, occupant] of this.tilemap.occupants) {
      if (occupant === actor) return { x: index % this.tilemap.width, y: Math.floor(index / this.tilemap.width) };
    }
    return null;
  }
  _setState(state) {
    if (this.state === state) return;
    const previous = this.state;
    this.state = state;
    if (this.onStateChange) this.onStateChange({ previous, state, target: this.target });
  }
  _setMovementCooldown(position) {
    const slowdown = this.tilemap.getResolvedMetadata(position.x, position.y)?.slowdown ?? 0;
    const interval = this.moveInterval * (1 + slowdown);
    this._moveTimer = Number.isFinite(interval) ? interval : Number.MAX_VALUE;
  }
  _stepToward(goal) {
    const position = this._position(this.actor);
    if (!position || !goal) return false;
    const next = this.tilemap.moveOccupantToward(this.actor, goal.x, goal.y);
    if (!next || next.x === position.x && next.y === position.y) return false;
    this._setMovementCooldown(next);
    return true;
  }
  _approachGoal(targetPosition) {
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    let best = null;
    const current = this._position(this.actor);
    for (const [dx, dy] of directions) {
      const x = targetPosition.x + dx, y = targetPosition.y + dy;
      if (!this.tilemap.isWalkable(x, y, this.actor)) continue;
      const path = current && this.tilemap.findPath(current.x, current.y, x, y, this.actor);
      if (path && (!best || path.length < best.pathLength)) best = { x, y, pathLength: path.length };
    }
    return best;
  }
  _flee(targetPosition) {
    const current = this._position(this.actor);
    if (!current || this._moveTimer > 0) return false;
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const options = [];
    for (const [dx, dy] of directions) {
      const x = current.x + dx, y = current.y + dy;
      if (this.tilemap.isWalkable(x, y, this.actor)) options.push({ x, y, distance: Math.abs(x - targetPosition.x) + Math.abs(y - targetPosition.y) });
    }
    options.sort((a, b) => b.distance - a.distance);
    if (options.length === 0) return false;
    const moved = this.tilemap.moveOccupant(this.actor, options[0].x, options[0].y);
    if (moved) this._setMovementCooldown(options[0]);
    return moved;
  }
  _attack(target) {
    if (this._attackTimer > 0) return false;
    let started = false;
    if (this.onAttack) started = this.onAttack(target, this) !== false;
    else if (this.combatSystem && this.combatant && this.attackDefinition) {
      started = this.combatSystem.startAttack(this.combatant, this.attackDefinition, { x: target.x - this.combatant.position.x, y: target.y - this.combatant.position.y });
    }
    if (started) this._attackTimer = this.attackCooldown;
    return started;
  }
  /** Update behavior. Target is an occupant on the same tilemap; healthFraction optionally drives flee state. */
  update(deltaTime, { target = null, healthFraction = 1 } = {}) {
    finiteNonNegative2(deltaTime, "EnemyAI deltaTime");
    if (!Number.isFinite(healthFraction) || healthFraction < 0 || healthFraction > 1) throw new TypeError("healthFraction must be between zero and one");
    this._moveTimer = Math.max(0, this._moveTimer - deltaTime);
    this._attackTimer = Math.max(0, this._attackTimer - deltaTime);
    const position = this._position(this.actor);
    if (!position) {
      this._setState("idle");
      return false;
    }
    const sharedTarget = target ? null : this.group?.target ?? null;
    target = target ?? sharedTarget;
    const targetPosition = target ? this._position(target) : null;
    const distance = targetPosition ? Math.abs(targetPosition.x - position.x) + Math.abs(targetPosition.y - position.y) : Infinity;
    const perceived = targetPosition && (sharedTarget === target || distance <= this.perceptionRadius);
    this.target = perceived ? target : null;
    if (perceived && !sharedTarget && this.group) this.group.target = target;
    if (perceived && this.fleeHealthFraction !== null && healthFraction <= this.fleeHealthFraction) {
      this._setState("flee");
      if (this._moveTimer === 0) this._flee(targetPosition);
      return true;
    }
    if (perceived) {
      if (distance <= this.attackRange) {
        this._setState("attack");
        this._attack(targetPosition);
      } else {
        this._setState("chase");
        if (this._moveTimer === 0) this._stepToward(this._approachGoal(targetPosition));
      }
      return true;
    }
    this.target = null;
    if (this.patrolPoints.length > 0) {
      const patrol = this.patrolPoints[this.patrolIndex % this.patrolPoints.length];
      const atPoint = position.x === patrol.x && position.y === patrol.y;
      if (atPoint) this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
      const nextPoint = this.patrolPoints[this.patrolIndex % this.patrolPoints.length];
      this._setState("patrol");
      if (this._moveTimer === 0 && (position.x !== nextPoint.x || position.y !== nextPoint.y)) this._stepToward(nextPoint);
      return true;
    }
    if (position.x !== this.spawn.x || position.y !== this.spawn.y) {
      this._setState("return");
      if (this._moveTimer === 0) this._stepToward(this.spawn);
    } else this._setState("idle");
    return true;
  }
};

// src/larissa/bossAI.js
init_component();
var BossAI = class extends Component {
  constructor() {
    super();
    this.phases = [];
    this.currentPhase = 0;
    this.currentPattern = 0;
    this.patternTimer = 0;
    this.patternDuration = 2;
    this.target = null;
    this.state = "idle";
    this.stateTimer = 0;
    this.onPhaseChange = null;
    this.onAttack = null;
  }
  /**
   * Add a phase.
   * @param {number} healthThreshold - Health percent to trigger (1.0 = 100%).
   * @param {Function[]} patterns - Array of attack pattern functions.
   */
  addPhase(healthThreshold, patterns) {
    if (!Number.isFinite(healthThreshold) || healthThreshold < 0 || healthThreshold > 1) throw new TypeError("Boss phase threshold must be between zero and one");
    if (!Array.isArray(patterns) || patterns.some((pattern) => typeof pattern !== "function")) throw new TypeError("Boss phase patterns must be an array of functions");
    this.phases.push({ threshold: healthThreshold, patterns });
    this.phases.sort((a, b) => b.threshold - a.threshold);
  }
  /** Add a phase that selects among data-driven attacks through a CombatSystem. */
  addAttackPhase(healthThreshold, attacks, combatSystem, combatant) {
    if (!Number.isFinite(healthThreshold) || healthThreshold < 0 || healthThreshold > 1) throw new TypeError("Boss phase threshold must be between zero and one");
    if (!Array.isArray(attacks) || attacks.some((attack) => !(attack instanceof AttackDefinition))) throw new TypeError("Boss attacks must be an array of AttackDefinition instances");
    if (!(combatSystem instanceof CombatSystem) || !(combatant instanceof Combatant)) throw new TypeError("Boss attack phases require a CombatSystem and Combatant");
    this.phases.push({ threshold: healthThreshold, patterns: attacks, combatSystem, combatant });
    this.phases.sort((a, b) => b.threshold - a.threshold);
  }
  /**
   * Set the target to attack.
   * @param {Entity} target 
   */
  setTarget(target) {
    this.target = target;
  }
  /**
   * Update AI behavior.
   * @param {number} deltaTime 
   * @param {Stats} stats - Boss stats component.
   */
  update(deltaTime, stats) {
    if (!stats || !stats.isAlive) {
      this.state = "idle";
      return;
    }
    const healthPercent = stats.health / stats.maxHealth;
    const newPhaseIndex = this.phases.findLastIndex((p) => healthPercent <= p.threshold);
    if (newPhaseIndex !== -1 && newPhaseIndex > this.currentPhase) {
      this.currentPhase = newPhaseIndex;
      this.currentPattern = 0;
      this.state = "transitioning";
      this.stateTimer = 1;
      if (this.onPhaseChange) this.onPhaseChange(this.currentPhase);
      return;
    }
    switch (this.state) {
      case "transitioning":
        this.stateTimer -= deltaTime;
        if (this.stateTimer <= 0) {
          this.state = "attacking";
          this.patternTimer = 0;
        }
        break;
      case "stunned":
        this.stateTimer -= deltaTime;
        if (this.stateTimer <= 0) {
          this.state = "attacking";
        }
        break;
      case "attacking":
        this.patternTimer -= deltaTime;
        if (this.patternTimer <= 0) {
          this._executePattern();
          this.patternTimer = this.patternDuration;
        }
        break;
      case "idle":
      default:
        if (this.target) {
          this.state = "attacking";
        }
        break;
    }
  }
  /**
   * Execute current attack pattern.
   * @private
   */
  _executePattern() {
    if (this.phases.length === 0) return;
    const phase = this.phases[this.currentPhase];
    if (!phase || phase.patterns.length === 0) return;
    const pattern = phase.patterns[this.currentPattern];
    let started = false;
    if (typeof pattern === "function") {
      pattern(this, this.target);
      started = true;
    } else if (pattern instanceof AttackDefinition && phase.combatSystem && phase.combatant) {
      const targetPosition = this.target instanceof Combatant ? this.target.position : null;
      const aim = targetPosition ? { x: targetPosition.x - phase.combatant.position.x, y: targetPosition.y - phase.combatant.position.y } : { x: 1, y: 0 };
      started = phase.combatSystem.startAttack(phase.combatant, pattern, aim);
    }
    if (started && this.onAttack) this.onAttack(this.currentPattern);
    this.currentPattern = (this.currentPattern + 1) % phase.patterns.length;
  }
  /**
   * Stun the boss temporarily.
   * @param {number} duration 
   */
  stun(duration) {
    this.state = "stunned";
    this.stateTimer = duration;
  }
};

// src/larissa/progression.js
init_component();
var Progression = class _Progression extends Component {
  constructor({ level = 1, experience = 0, baseExperience = 100, growthRate = 1.5, stats = {} } = {}) {
    super();
    if (!Number.isInteger(level) || level < 1) throw new RangeError("Level must be a positive integer");
    if (!Number.isFinite(experience) || experience < 0) throw new RangeError("Experience must be non-negative");
    if (!Number.isFinite(baseExperience) || baseExperience <= 0) throw new RangeError("baseExperience must be positive");
    if (!Number.isFinite(growthRate) || growthRate < 1) throw new RangeError("growthRate must be at least 1");
    this.level = level;
    this.experience = experience;
    this.baseExperience = baseExperience;
    this.growthRate = growthRate;
    this.stats = { ...stats };
    this.skills = /* @__PURE__ */ new Set();
    this.listeners = /* @__PURE__ */ new Set();
  }
  experienceToNextLevel(level = this.level) {
    return Math.floor(this.baseExperience * this.growthRate ** (level - 1));
  }
  onProgression(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  grantExperience(amount) {
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError("Experience must be non-negative");
    this.experience += amount;
    const levels = [];
    while (this.experience >= this.experienceToNextLevel()) {
      this.experience -= this.experienceToNextLevel();
      this.level += 1;
      levels.push(this.level);
      for (const listener of this.listeners) listener({ type: "level-up", level: this.level, experience: this.experience });
    }
    return levels;
  }
  unlockSkill(skillId) {
    if (typeof skillId !== "string" || !skillId) throw new TypeError("skillId must be a non-empty string");
    if (this.skills.has(skillId)) return false;
    this.skills.add(skillId);
    for (const listener of this.listeners) listener({ type: "skill-unlocked", skillId, level: this.level });
    return true;
  }
  toJSON() {
    return { level: this.level, experience: this.experience, baseExperience: this.baseExperience, growthRate: this.growthRate, stats: { ...this.stats }, skills: [...this.skills] };
  }
  static fromJSON(data) {
    const progression2 = new _Progression(data);
    for (const skill of data.skills ?? []) progression2.skills.add(skill);
    return progression2;
  }
};
var GameData = class _GameData {
  constructor({ items = {}, lootTables = {}, shops = {}, quests = {}, rewards = {} } = {}) {
    this.items = new Map(Object.entries(items));
    this.lootTables = new Map(Object.entries(lootTables));
    this.shops = new Map(Object.entries(shops));
    this.quests = new Map(Object.entries(quests));
    this.rewards = new Map(Object.entries(rewards));
  }
  getItem(id) {
    return this.items.get(id) ?? null;
  }
  rollLoot(tableId, random = Math.random) {
    const table = this.lootTables.get(tableId);
    if (!table) throw new RangeError(`Unknown loot table: ${tableId}`);
    return table.filter((entry) => random() < (entry.chance ?? 1)).map((entry) => ({ itemId: entry.itemId, quantity: entry.quantity ?? 1 }));
  }
  toJSON() {
    return Object.fromEntries(["items", "lootTables", "shops", "quests", "rewards"].map((key) => [key, Object.fromEntries(this[key])]));
  }
  static fromJSON(data) {
    return new _GameData(data);
  }
};
var RewardSystem = class {
  constructor(data) {
    this.data = data;
    this.listeners = /* @__PURE__ */ new Set();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  grant(rewardId, { inventory: inventory2, progression: progression2 } = {}) {
    const reward = this.data.rewards.get(rewardId);
    if (!reward) throw new RangeError(`Unknown reward: ${rewardId}`);
    const events = [];
    const items = reward.items ?? [];
    const quantities = /* @__PURE__ */ new Map();
    for (const entry of items) quantities.set(entry.itemId, (quantities.get(entry.itemId) ?? 0) + (entry.quantity ?? 1));
    for (const [itemId, quantity] of quantities) {
      const item = this.data.getItem(itemId);
      if (!item || !inventory2?.canAddItem(item, quantity)) throw new Error(`Cannot grant ${itemId}: missing inventory item or capacity`);
    }
    if (reward.experience && progression2) for (const level of progression2.grantExperience(reward.experience)) events.push({ type: "level-up", level });
    if (reward.gold && inventory2) inventory2.gold += reward.gold;
    for (const item of items) {
      inventory2.addItem(this.data.getItem(item.itemId), item.quantity ?? 1);
      events.push({ type: "item-reward", itemId: item.itemId, quantity: item.quantity ?? 1 });
    }
    events.push({ type: "reward-granted", rewardId });
    for (const event of events) for (const listener of this.listeners) listener(event);
    return events;
  }
};
var Shop = class {
  constructor(data, shopId) {
    this.data = data;
    this.definition = data.shops.get(shopId);
    if (!this.definition) throw new RangeError(`Unknown shop: ${shopId}`);
  }
  buy(inventory2, itemId, quantity = 1) {
    const offer = this.definition.items?.find((entry) => entry.itemId === itemId);
    const item = this.data.getItem(itemId);
    if (!offer || !item) return false;
    const cost = (offer.price ?? item.value ?? 0) * quantity;
    if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(cost) || cost < 0 || inventory2.gold < cost || !inventory2.canAddItem(item, quantity)) return false;
    if (!inventory2.addItem(item, quantity)) return false;
    inventory2.gold -= cost;
    return true;
  }
};
var QuestLog = class {
  constructor(data) {
    this.data = data;
    this.states = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  start(questId) {
    if (!this.data.quests.has(questId) || this.states.has(questId)) return false;
    this.states.set(questId, { status: "active", progress: {} });
    this.#emit({ type: "quest-started", questId });
    return true;
  }
  advance(questId, objectiveId, amount = 1) {
    const state = this.states.get(questId), quest = this.data.quests.get(questId);
    const objective = quest?.objectives?.find((entry) => entry.id === objectiveId);
    if (!state || state.status !== "active" || !objective || !Number.isFinite(amount) || amount <= 0) return false;
    state.progress[objectiveId] = Math.min(objective.required ?? 1, (state.progress[objectiveId] ?? 0) + amount);
    if (quest.objectives.every((entry) => (state.progress[entry.id] ?? 0) >= (entry.required ?? 1))) state.status = "complete";
    this.#emit({ type: state.status === "complete" ? "quest-completed" : "quest-progress", questId, objectiveId, progress: state.progress[objectiveId] });
    return true;
  }
  #emit(event) {
    for (const listener of this.listeners) listener(event);
  }
  toJSON() {
    return Object.fromEntries([...this.states].map(([id, state]) => [id, { status: state.status, progress: { ...state.progress } }]));
  }
  loadJSON(states) {
    for (const [id, state] of Object.entries(states)) {
      if (!this.data.quests.has(id) || !["active", "complete"].includes(state.status) || !state.progress || typeof state.progress !== "object") throw new TypeError(`Invalid quest state: ${id}`);
    }
    this.states = new Map(Object.entries(states).map(([id, state]) => [id, { status: state.status, progress: { ...state.progress } }]));
  }
};

// src/larissa/progressionSystem.js
init_component();
function finiteNumber2(value, name, min = 0) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    throw new TypeError(`${name} must be a finite number >= ${min}`);
  }
  return value;
}
function nonEmptyString2(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}
var LevelProgression = class _LevelProgression extends Component {
  /**
   * @param {Object} [config]
   * @param {number} [config.level=1]
   * @param {number} [config.experience=0]
   * @param {number} [config.baseExperience=100]
   * @param {number} [config.growthRate=1.5]
   * @param {number} [config.maxLevel=100]
   * @param {Object} [config.statGains] Stat increases per level
   * @param {Object} [config.baseStats] Initial stats at level 1
   */
  constructor({
    level = 1,
    experience = 0,
    baseExperience = 100,
    growthRate = 1.5,
    maxLevel = 100,
    statGains = {},
    baseStats = {}
  } = {}) {
    super();
    if (!Number.isInteger(level) || level < 1) throw new RangeError("Level must be a positive integer");
    finiteNumber2(experience, "experience", 0);
    finiteNumber2(baseExperience, "baseExperience", 1);
    finiteNumber2(growthRate, "growthRate", 1);
    if (!Number.isInteger(maxLevel) || maxLevel < 1) throw new RangeError("maxLevel must be a positive integer");
    this.level = Math.min(level, maxLevel);
    this.experience = experience;
    this.baseExperience = baseExperience;
    this.growthRate = growthRate;
    this.maxLevel = maxLevel;
    this.statGains = { ...statGains };
    this.baseStats = { ...baseStats };
    this.statPoints = 0;
    this.unspentStatPoints = 0;
    this.statPointsPerLevel = 3;
    this.listeners = /* @__PURE__ */ new Set();
  }
  /**
   * Calculate experience needed to advance from given level to next.
   * @param {number} [level=this.level]
   * @returns {number}
   */
  experienceToNextLevel(level = this.level) {
    if (level >= this.maxLevel) return Infinity;
    return Math.floor(this.baseExperience * this.growthRate ** (level - 1));
  }
  /**
   * Add a listener for progression events (level-up, exp-gained).
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  onProgression(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  _emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  /**
   * Grant experience, potentially climbing multiple levels in one call.
   * @param {number} amount
   * @returns {Array} Array of level numbers reached
   */
  grantExperience(amount) {
    finiteNumber2(amount, "amount", 0);
    if (amount === 0 || this.level >= this.maxLevel) return [];
    this.experience += amount;
    this._emit({ type: "experience-gained", amount, totalExperience: this.experience });
    const levelsGained = [];
    while (this.level < this.maxLevel && this.experience >= this.experienceToNextLevel()) {
      this.experience -= this.experienceToNextLevel();
      this.level += 1;
      this.statPoints += this.statPointsPerLevel;
      this.unspentStatPoints += this.statPointsPerLevel;
      levelsGained.push(this.level);
      this._emit({
        type: "level-up",
        level: this.level,
        remainingExperience: this.experience,
        statPointsAwarded: this.statPointsPerLevel,
        stats: this.getCalculatedStats()
      });
    }
    if (this.level >= this.maxLevel) {
      this.experience = 0;
    }
    return levelsGained;
  }
  /**
   * Get computed total stats for the current level.
   * @returns {Object}
   */
  getCalculatedStats() {
    const result = { ...this.baseStats };
    const levelOffset = this.level - 1;
    for (const [stat, gain] of Object.entries(this.statGains)) {
      const current = result[stat] ?? 0;
      result[stat] = current + gain * levelOffset;
    }
    return result;
  }
  /**
   * Apply calculated stats to a Combatant or Stats component.
   * @param {Object} target
   */
  applyToTarget(target) {
    if (!target || typeof target !== "object") return;
    const stats = this.getCalculatedStats();
    if (typeof target.maxHealth === "number" && stats.maxHealth) {
      target.maxHealth = stats.maxHealth;
      if (target.health > target.maxHealth) target.health = target.maxHealth;
    }
    if (target.stats && typeof target.stats === "object") {
      Object.assign(target.stats, stats);
    }
  }
  /**
   * Create snapshot for serialization.
   * @returns {Object}
   */
  toJSON() {
    return {
      level: this.level,
      experience: this.experience,
      baseExperience: this.baseExperience,
      growthRate: this.growthRate,
      maxLevel: this.maxLevel,
      statGains: { ...this.statGains },
      baseStats: { ...this.baseStats },
      statPoints: this.statPoints,
      unspentStatPoints: this.unspentStatPoints,
      statPointsPerLevel: this.statPointsPerLevel
    };
  }
  /**
   * Restore from serialized state.
   * @param {Object} data
   * @returns {LevelProgression}
   */
  static fromJSON(data) {
    if (!data || typeof data !== "object") throw new TypeError("data must be an object");
    const progression2 = new _LevelProgression(data);
    if (Number.isInteger(data.statPoints)) progression2.statPoints = data.statPoints;
    if (Number.isInteger(data.unspentStatPoints)) progression2.unspentStatPoints = data.unspentStatPoints;
    if (Number.isInteger(data.statPointsPerLevel)) progression2.statPointsPerLevel = data.statPointsPerLevel;
    return progression2;
  }
};
var StatusEffectManager = class _StatusEffectManager extends Component {
  /**
   * @param {Object} [config]
   * @param {Object} [config.target] Target combatant or entity
   */
  constructor({ target = null } = {}) {
    super();
    this.target = target;
    this.effects = [];
    this.listeners = /* @__PURE__ */ new Set();
    this._isPaused = false;
  }
  /**
   * Set paused state. When paused, effect durations and tick intervals do not advance.
   * @param {boolean} paused
   */
  setPaused(paused) {
    this._isPaused = Boolean(paused);
  }
  get isPaused() {
    return this._isPaused;
  }
  /**
   * Listen for status events: applied, refreshed, ticked, expired, cleansed.
   * @param {Function} listener
   * @returns {Function} Unsubscribe
   */
  onStatusEvent(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  _emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  /**
   * Apply or stack a status effect.
   * @param {Object} effectConfig
   * @param {string} effectConfig.name Unique effect identifier
   * @param {number} effectConfig.duration Duration in seconds
   * @param {string} [effectConfig.stackMode="replace"] 'replace'|'duration_stack'|'intensity_stack'|'independent'
   * @param {number} [effectConfig.maxStacks=5] Max stacks allowed for intensity_stack
   * @param {number} [effectConfig.maxDuration=60] Max duration for duration_stack
   * @param {number} [effectConfig.intensity=1] Initial intensity/multiplier
   * @param {Object} [effectConfig.modifiers={}] Stat multipliers or deltas
   * @param {number} [effectConfig.tickInterval=0] Periodic interval in seconds (0 = no periodic tick)
   * @param {Function} [effectConfig.onTick] Callback on periodic tick: (effect, target) => void
   * @param {string} [effectConfig.category="neutral"] 'buff'|'debuff'|'neutral'
   * @param {Array<string>} [effectConfig.tags=[]] Categorical tags (e.g. ['poison', 'curse'])
   * @returns {Object} The active effect record
   */
  applyEffect(effectConfig) {
    if (!effectConfig || typeof effectConfig !== "object") throw new TypeError("effectConfig must be an object");
    const name = nonEmptyString2(effectConfig.name, "effectConfig.name");
    const duration = finiteNumber2(effectConfig.duration, "effectConfig.duration", 1e-3);
    const stackMode = effectConfig.stackMode ?? "replace";
    const maxStacks = effectConfig.maxStacks ?? 5;
    const maxDuration = effectConfig.maxDuration ?? 60;
    const intensity = effectConfig.intensity ?? 1;
    const modifiers = { ...effectConfig.modifiers ?? {} };
    const tickInterval = effectConfig.tickInterval ?? 0;
    const onTick = typeof effectConfig.onTick === "function" ? effectConfig.onTick : null;
    const category = effectConfig.category ?? "neutral";
    const tags = Array.isArray(effectConfig.tags) ? [...effectConfig.tags] : [];
    let record;
    const existing = this.effects.find((e) => e.name === name);
    if (existing && stackMode !== "independent") {
      if (stackMode === "replace") {
        existing.duration = duration;
        existing.maxDuration = Math.max(existing.maxDuration, duration);
        existing.intensity = intensity;
        existing.modifiers = modifiers;
        existing.tickTimer = 0;
        record = existing;
        this._emit({ type: "refreshed", effect: record, stackMode });
      } else if (stackMode === "duration_stack") {
        existing.duration = Math.min(maxDuration, existing.duration + duration);
        existing.modifiers = modifiers;
        record = existing;
        this._emit({ type: "refreshed", effect: record, stackMode });
      } else if (stackMode === "intensity_stack") {
        existing.stacks = Math.min(maxStacks, (existing.stacks ?? 1) + 1);
        existing.duration = duration;
        existing.modifiers = modifiers;
        record = existing;
        this._emit({ type: "stacked", effect: record, stacks: existing.stacks });
      }
    } else {
      record = {
        id: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        duration,
        maxDuration: Math.max(duration, maxDuration),
        stackMode,
        stacks: 1,
        maxStacks,
        intensity,
        modifiers,
        tickInterval,
        tickTimer: 0,
        onTick,
        category,
        tags
      };
      this.effects.push(record);
      this._emit({ type: "applied", effect: record });
    }
    return record;
  }
  /**
   * Advance elapsed time for active effects.
   * When paused, timers do not decrement and no periodic ticks fire.
   * @param {number} deltaTime
   * @param {Object} [options]
   * @param {boolean} [options.paused=false]
   */
  update(deltaTime, { paused = false } = {}) {
    finiteNumber2(deltaTime, "deltaTime", 0);
    if (this._isPaused || paused || deltaTime === 0) return;
    const remaining = [];
    for (const effect of this.effects) {
      effect.duration -= deltaTime;
      if (effect.tickInterval > 0) {
        effect.tickTimer += deltaTime;
        while (effect.tickTimer >= effect.tickInterval) {
          effect.tickTimer -= effect.tickInterval;
          if (effect.onTick) {
            effect.onTick(effect, this.target);
          }
          this._emit({ type: "ticked", effect, target: this.target });
        }
      }
      if (effect.duration > 0) {
        remaining.push(effect);
      } else {
        this._emit({ type: "expired", effect });
      }
    }
    this.effects = remaining;
  }
  /**
   * Remove all effects matching a tag or category.
   * @param {string} tagOrCategory E.g. 'poison', 'debuff', 'buff'
   * @returns {number} Count of removed effects
   */
  cleanse(tagOrCategory) {
    nonEmptyString2(tagOrCategory, "tagOrCategory");
    const before = this.effects.length;
    const retained = [];
    for (const effect of this.effects) {
      const matches = effect.category === tagOrCategory || effect.tags.includes(tagOrCategory) || effect.name === tagOrCategory;
      if (matches) {
        this._emit({ type: "cleansed", effect });
      } else {
        retained.push(effect);
      }
    }
    this.effects = retained;
    return before - retained.length;
  }
  /**
   * Clear all active status effects unconditionally.
   */
  clearAll() {
    for (const effect of this.effects) {
      this._emit({ type: "cleansed", effect });
    }
    this.effects = [];
  }
  /**
   * Calculate compound stat multiplier across all active status effects.
   * For intensity_stack effects, multiplier applies per stack: 1 + (mod - 1) * stacks.
   * @param {string} stat Name of stat
   * @param {number} [baseValue=1]
   * @returns {number}
   */
  getModifiedStat(stat, baseValue = 1) {
    let value = baseValue;
    for (const effect of this.effects) {
      if (Object.hasOwn(effect.modifiers, stat)) {
        const multiplier = effect.modifiers[stat];
        if (effect.stackMode === "intensity_stack" && effect.stacks > 1) {
          const delta = multiplier - 1;
          value *= 1 + delta * effect.stacks;
        } else {
          value *= multiplier;
        }
      }
    }
    return value;
  }
  /**
   * Check if a status effect is active by name.
   * @param {string} name
   * @returns {boolean}
   */
  hasEffect(name) {
    return this.effects.some((e) => e.name === name);
  }
  /**
   * Get effect record by name.
   * @param {string} name
   * @returns {Object|null}
   */
  getEffect(name) {
    return this.effects.find((e) => e.name === name) ?? null;
  }
  toJSON() {
    return {
      effects: this.effects.map((e) => ({
        name: e.name,
        duration: e.duration,
        maxDuration: e.maxDuration,
        stackMode: e.stackMode,
        stacks: e.stacks,
        maxStacks: e.maxStacks,
        intensity: e.intensity,
        modifiers: { ...e.modifiers },
        tickInterval: e.tickInterval,
        category: e.category,
        tags: [...e.tags]
      })),
      isPaused: this._isPaused
    };
  }
  static fromJSON(data) {
    const manager = new _StatusEffectManager();
    if (data && Array.isArray(data.effects)) {
      for (const item of data.effects) {
        manager.applyEffect(item);
      }
    }
    if (data && typeof data.isPaused === "boolean") {
      manager.setPaused(data.isPaused);
    }
    return manager;
  }
};
var DeathRetryManager = class _DeathRetryManager extends Component {
  /**
   * @param {Object} [config]
   * @param {Object} [config.target] Player combatant/entity
   * @param {LevelProgression} [config.progression] Progression system
   * @param {StatusEffectManager} [config.statusManager] Status effect manager
   * @param {number} [config.experienceLossRatio=0.1] Ratio of unspent experience lost on death (0.0 to 1.0)
   */
  constructor({
    target = null,
    progression: progression2 = null,
    statusManager = null,
    experienceLossRatio = 0.1
  } = {}) {
    super();
    this.target = target;
    this.progression = progression2;
    this.statusManager = statusManager;
    this.experienceLossRatio = Math.max(0, Math.min(1, experienceLossRatio));
    this.checkpoint = null;
    this.deathCount = 0;
    this.retryCount = 0;
    this.isDead = false;
    this.listeners = /* @__PURE__ */ new Set();
  }
  onDeathRetryEvent(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  _emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  /**
   * Save current game state as the active checkpoint.
   * @param {Object} [metadata={}] Optional scene, position, or flag data
   * @returns {Object} Checkpoint snapshot
   */
  recordCheckpoint(metadata = {}) {
    this.checkpoint = {
      timestamp: Date.now(),
      progression: this.progression ? this.progression.toJSON() : null,
      targetHealth: this.target?.health ?? null,
      targetMaxHealth: this.target?.maxHealth ?? null,
      metadata: { ...metadata }
    };
    this._emit({ type: "checkpoint-saved", checkpoint: this.checkpoint });
    return this.checkpoint;
  }
  /**
   * Process actor death: cleanses temporary buffs/debuffs, applies experience penalty.
   * @returns {Object} Death summary
   */
  handleDeath() {
    this.isDead = true;
    this.deathCount += 1;
    let expLost = 0;
    if (this.progression && this.experienceLossRatio > 0) {
      expLost = Math.floor(this.progression.experience * this.experienceLossRatio);
      this.progression.experience = Math.max(0, this.progression.experience - expLost);
    }
    if (this.statusManager) {
      this.statusManager.clearAll();
    }
    const summary = {
      deathCount: this.deathCount,
      experienceLost: expLost,
      remainingExperience: this.progression?.experience ?? 0,
      hasCheckpoint: this.checkpoint !== null
    };
    this._emit({ type: "death", ...summary });
    return summary;
  }
  /**
   * Retry from last checkpoint. Restores health, resets dead status, and applies checkpoint progression.
   * Can be invoked repeatedly across multiple death cycles without state corruption.
   * @returns {Object} Retry result
   */
  retry() {
    if (!this.checkpoint) {
      this.isDead = false;
      this.retryCount += 1;
      if (this.target) {
        if (typeof this.target.maxHealth === "number") {
          this.target.health = this.target.maxHealth;
        }
        if (typeof this.target.isAlive === "boolean") {
          this.target.isAlive = true;
        }
      }
      if (this.statusManager) {
        this.statusManager.clearAll();
      }
      const fallbackResult = {
        retryCount: this.retryCount,
        restoredFromCheckpoint: false,
        currentHealth: this.target?.health ?? 0
      };
      this._emit({ type: "retry", ...fallbackResult });
      return fallbackResult;
    }
    this.isDead = false;
    this.retryCount += 1;
    if (this.target) {
      const maxHp = this.checkpoint.targetMaxHealth ?? this.target.maxHealth ?? 100;
      this.target.maxHealth = maxHp;
      this.target.health = maxHp;
      if (typeof this.target.isAlive === "boolean") {
        this.target.isAlive = true;
      }
    }
    if (this.statusManager) {
      this.statusManager.clearAll();
    }
    const result = {
      retryCount: this.retryCount,
      restoredFromCheckpoint: true,
      checkpoint: this.checkpoint,
      currentHealth: this.target?.health ?? 0
    };
    this._emit({ type: "retry", ...result });
    return result;
  }
  toJSON() {
    return {
      deathCount: this.deathCount,
      retryCount: this.retryCount,
      isDead: this.isDead,
      experienceLossRatio: this.experienceLossRatio,
      checkpoint: this.checkpoint ? structuredClone(this.checkpoint) : null
    };
  }
  static fromJSON(data, { target = null, progression: progression2 = null, statusManager = null } = {}) {
    const manager = new _DeathRetryManager({
      target,
      progression: progression2,
      statusManager,
      experienceLossRatio: data.experienceLossRatio ?? 0.1
    });
    manager.deathCount = data.deathCount ?? 0;
    manager.retryCount = data.retryCount ?? 0;
    manager.isDead = Boolean(data.isDead);
    manager.checkpoint = data.checkpoint ? structuredClone(data.checkpoint) : null;
    return manager;
  }
};

// src/larissa/abilityValidator.js
var ABILITY_NODE_VOCABULARY = Object.freeze([
  "target",
  "filter",
  "sequence",
  "condition",
  "projectile",
  "area_effect",
  "damage",
  "heal",
  "status",
  "knockback",
  "timed_action",
  "presentation"
]);
var ABILITY_NODE_TYPES = ABILITY_NODE_VOCABULARY;
var NODE_TYPE_SET = new Set(ABILITY_NODE_VOCABULARY);
var VALID_TARGET_TYPES = Object.freeze([
  "self",
  "caster",
  "target",
  "cursor",
  "point",
  "direction",
  "directional",
  "area",
  "cone",
  "radius",
  "nearest_enemy",
  "nearest_ally",
  "hostile",
  "friendly",
  "any",
  "allies",
  "enemies",
  "entity",
  "enemy",
  "ally",
  "neutral",
  "player",
  "npc"
]);
var TARGET_TYPE_SET = new Set(VALID_TARGET_TYPES);
var VALID_DIRECTION_MODES = Object.freeze([
  "cursor",
  "target",
  "forward",
  "caster_facing",
  "target_facing",
  "away_from_caster",
  "towards_caster",
  "away_from_source",
  "towards_source",
  "movement",
  "cardinal",
  "random"
]);
var DIRECTION_MODE_SET = new Set(VALID_DIRECTION_MODES);
var AbilityValidationError = class extends Error {
  constructor(message, diagnostics = {}) {
    super(message);
    this.name = "AbilityValidationError";
    this.errors = diagnostics.errors ?? [];
    this.warnings = diagnostics.warnings ?? [];
  }
};
function isPositiveNumber(val) {
  return typeof val === "number" && Number.isFinite(val) && val > 0;
}
function isNonNegativeNumber(val) {
  return typeof val === "number" && Number.isFinite(val) && val >= 0;
}
function isPositiveInteger(val) {
  return typeof val === "number" && Number.isInteger(val) && val > 0;
}
function isValidDirection(val) {
  if (typeof val === "string") {
    return DIRECTION_MODE_SET.has(val.toLowerCase());
  }
  if (val && typeof val === "object") {
    return Number.isFinite(val.x) && Number.isFinite(val.y) && (val.x !== 0 || val.y !== 0);
  }
  return false;
}
function isValidTargetType(val) {
  if (typeof val !== "string") return false;
  return TARGET_TYPE_SET.has(val.toLowerCase());
}
function getOutgoingEdges(node) {
  const edges = [];
  if (!node || typeof node !== "object") return edges;
  if (typeof node.next === "string" && node.next) {
    edges.push({ targetId: node.next, field: "next" });
  }
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      if (typeof node.children[i] === "string" && node.children[i]) {
        edges.push({ targetId: node.children[i], field: `children[${i}]` });
      }
    }
  }
  const singleRefFields = [
    "onTrue",
    "onFalse",
    "onExpire",
    "onComplete",
    "onTick",
    "onMiss",
    "targetNode",
    "success",
    "failure"
  ];
  for (const field of singleRefFields) {
    if (typeof node[field] === "string" && node[field]) {
      edges.push({ targetId: node[field], field });
    }
  }
  if (typeof node.onHit === "string" && node.onHit) {
    edges.push({ targetId: node.onHit, field: "onHit" });
  } else if (Array.isArray(node.onHit)) {
    for (let i = 0; i < node.onHit.length; i++) {
      if (typeof node.onHit[i] === "string" && node.onHit[i]) {
        edges.push({ targetId: node.onHit[i], field: `onHit[${i}]` });
      }
    }
  }
  return edges;
}
var AbilityValidator = class _AbilityValidator {
  /**
   * Validates an ability graph definition against structural, parameter, and graph rules.
   * @param {Object} abilityDef
   * @returns {{ valid: boolean, errors: Array<{ code: string, message: string, path: string, nodeId: string|null }>, warnings: Array<{ message: string, path: string, nodeId: string|null }> }}
   */
  static validate(abilityDef) {
    const errors = [];
    const warnings = [];
    if (!abilityDef || typeof abilityDef !== "object" || Array.isArray(abilityDef)) {
      errors.push({
        code: "INVALID_ROOT",
        message: "Ability definition must be a non-null object",
        path: "",
        nodeId: null
      });
      return { valid: false, errors, warnings };
    }
    if (typeof abilityDef.id !== "string" || !abilityDef.id.trim()) {
      errors.push({
        code: "MISSING_ROOT_FIELD",
        message: "Ability 'id' must be a non-empty string",
        path: "id",
        nodeId: null
      });
    }
    if (typeof abilityDef.name !== "string" || !abilityDef.name.trim()) {
      errors.push({
        code: "MISSING_ROOT_FIELD",
        message: "Ability 'name' must be a non-empty string",
        path: "name",
        nodeId: null
      });
    }
    if (!abilityDef.nodes || typeof abilityDef.nodes !== "object") {
      errors.push({
        code: "MISSING_ROOT_FIELD",
        message: "Ability 'nodes' must be a non-null object or array",
        path: "nodes",
        nodeId: null
      });
    }
    if (typeof abilityDef.entryNodeId !== "string" || !abilityDef.entryNodeId.trim()) {
      errors.push({
        code: "MISSING_ROOT_FIELD",
        message: "Ability 'entryNodeId' must be a non-empty string",
        path: "entryNodeId",
        nodeId: null
      });
    }
    if (errors.length > 0 && !abilityDef.nodes) {
      return { valid: false, errors, warnings };
    }
    const nodeMap = /* @__PURE__ */ new Map();
    if (Array.isArray(abilityDef.nodes)) {
      if (abilityDef.nodes.length === 0) {
        errors.push({
          code: "EMPTY_NODES",
          message: "Ability 'nodes' array cannot be empty",
          path: "nodes",
          nodeId: null
        });
      }
      for (let i = 0; i < abilityDef.nodes.length; i++) {
        const item = abilityDef.nodes[i];
        if (!item || typeof item !== "object") {
          errors.push({
            code: "INVALID_NODE",
            message: `Node at index ${i} must be an object`,
            path: `nodes[${i}]`,
            nodeId: null
          });
          continue;
        }
        if (typeof item.id !== "string" || !item.id.trim()) {
          errors.push({
            code: "MISSING_NODE_ID",
            message: `Node at index ${i} is missing a string 'id'`,
            path: `nodes[${i}].id`,
            nodeId: null
          });
          continue;
        }
        if (nodeMap.has(item.id)) {
          errors.push({
            code: "DUPLICATE_NODE_ID",
            message: `Duplicate node ID '${item.id}'`,
            path: `nodes[${i}].id`,
            nodeId: item.id
          });
          continue;
        }
        nodeMap.set(item.id, { node: item, path: `nodes[${i}]` });
      }
    } else if (abilityDef.nodes && typeof abilityDef.nodes === "object") {
      const entries = Object.entries(abilityDef.nodes);
      if (entries.length === 0) {
        errors.push({
          code: "EMPTY_NODES",
          message: "Ability 'nodes' object cannot be empty",
          path: "nodes",
          nodeId: null
        });
      }
      for (const [key, item] of entries) {
        if (!item || typeof item !== "object") {
          errors.push({
            code: "INVALID_NODE",
            message: `Node '${key}' must be an object`,
            path: `nodes.${key}`,
            nodeId: key
          });
          continue;
        }
        if (item.id !== void 0 && item.id !== key) {
          errors.push({
            code: "MISMATCHED_NODE_ID",
            message: `Node key '${key}' does not match node.id '${item.id}'`,
            path: `nodes.${key}.id`,
            nodeId: key
          });
        }
        nodeMap.set(key, { node: item, path: `nodes.${key}` });
      }
    }
    if (abilityDef.entryNodeId && typeof abilityDef.entryNodeId === "string") {
      if (!nodeMap.has(abilityDef.entryNodeId)) {
        errors.push({
          code: "MISSING_ENTRY_NODE",
          message: `Entry node '${abilityDef.entryNodeId}' not found in 'nodes'`,
          path: "entryNodeId",
          nodeId: abilityDef.entryNodeId
        });
      }
    }
    for (const [nodeId, { node, path }] of nodeMap.entries()) {
      if (typeof node.type !== "string" || !node.type.trim()) {
        errors.push({
          code: "MISSING_NODE_TYPE",
          message: `Node '${nodeId}' is missing a valid 'type'`,
          path: `${path}.type`,
          nodeId
        });
        continue;
      }
      if (!NODE_TYPE_SET.has(node.type)) {
        errors.push({
          code: "UNKNOWN_NODE_TYPE",
          message: `Unknown node type '${node.type}' in node '${nodeId}'`,
          path: `${path}.type`,
          nodeId
        });
        continue;
      }
      switch (node.type) {
        case "target": {
          if (node.targetType !== void 0 && !isValidTargetType(node.targetType)) {
            errors.push({
              code: "INVALID_TARGET_TYPE",
              message: `Invalid targetType '${node.targetType}' in target node '${nodeId}'`,
              path: `${path}.targetType`,
              nodeId
            });
          }
          if (node.mode !== void 0 && !isValidTargetType(node.mode)) {
            errors.push({
              code: "INVALID_TARGET_TYPE",
              message: `Invalid targeting mode '${node.mode}' in target node '${nodeId}'`,
              path: `${path}.mode`,
              nodeId
            });
          }
          if (node.targeting !== void 0 && !["hostile", "friendly", "any", "allies", "enemies"].includes(node.targeting)) {
            errors.push({
              code: "INVALID_TARGET_TYPE",
              message: `Invalid targeting '${node.targeting}' in target node '${nodeId}'`,
              path: `${path}.targeting`,
              nodeId
            });
          }
          if (node.range !== void 0 && !isPositiveNumber(node.range)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'range' in node '${nodeId}' must be a positive number, got ${node.range}`,
              path: `${path}.range`,
              nodeId
            });
          }
          if (node.radius !== void 0 && !isPositiveNumber(node.radius)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'radius' in node '${nodeId}' must be a positive number, got ${node.radius}`,
              path: `${path}.radius`,
              nodeId
            });
          }
          if (node.angle !== void 0 && !isPositiveNumber(node.angle)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'angle' in node '${nodeId}' must be a positive number, got ${node.angle}`,
              path: `${path}.angle`,
              nodeId
            });
          }
          if (node.maxTargets !== void 0 && !isPositiveInteger(node.maxTargets)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'maxTargets' in node '${nodeId}' must be a positive integer, got ${node.maxTargets}`,
              path: `${path}.maxTargets`,
              nodeId
            });
          }
          if (node.duration !== void 0 && !isPositiveNumber(node.duration)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'duration' in node '${nodeId}' must be a positive number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          break;
        }
        case "filter": {
          if (node.targetType !== void 0 && !isValidTargetType(node.targetType)) {
            errors.push({
              code: "INVALID_TARGET_TYPE",
              message: `Invalid targetType '${node.targetType}' in filter node '${nodeId}'`,
              path: `${path}.targetType`,
              nodeId
            });
          }
          if (node.maxTargets !== void 0 && !isPositiveInteger(node.maxTargets)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'maxTargets' in node '${nodeId}' must be a positive integer, got ${node.maxTargets}`,
              path: `${path}.maxTargets`,
              nodeId
            });
          }
          break;
        }
        case "sequence": {
          if (!Array.isArray(node.children) || node.children.length === 0) {
            errors.push({
              code: "INVALID_PARAMETER",
              message: `Sequence node '${nodeId}' must have a non-empty array of children`,
              path: `${path}.children`,
              nodeId
            });
          }
          break;
        }
        case "condition": {
          if (!node.onTrue && !node.onFalse && !node.next) {
            errors.push({
              code: "INVALID_PARAMETER",
              message: `Condition node '${nodeId}' must define at least 'onTrue', 'onFalse', or 'next'`,
              path,
              nodeId
            });
          }
          break;
        }
        case "projectile": {
          const speed = node.speed ?? node.projectileSpeed;
          if (speed === void 0 || !isPositiveNumber(speed)) {
            const field = node.projectileSpeed !== void 0 ? "projectileSpeed" : "speed";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${speed}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const range = node.range ?? node.maxDistance;
          if (range !== void 0 && !isPositiveNumber(range)) {
            const field = node.maxDistance !== void 0 ? "maxDistance" : "range";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${range}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const radius = node.radius ?? node.size;
          if (radius !== void 0 && !isPositiveNumber(radius)) {
            const field = node.size !== void 0 ? "size" : "radius";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${radius}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const duration = node.duration ?? node.lifetime;
          if (duration !== void 0 && !isPositiveNumber(duration)) {
            const field = node.lifetime !== void 0 ? "lifetime" : "duration";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${duration}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const dir = node.direction ?? node.directionMode;
          if (dir !== void 0 && !isValidDirection(dir)) {
            const field = node.directionMode !== void 0 ? "directionMode" : "direction";
            errors.push({
              code: "INVALID_DIRECTION_MODE",
              message: `Invalid direction mode in projectile node '${nodeId}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }
        case "area_effect": {
          if (node.radius !== void 0 && !isPositiveNumber(node.radius)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'radius' in area_effect node '${nodeId}' must be a positive number, got ${node.radius}`,
              path: `${path}.radius`,
              nodeId
            });
          }
          if (node.width !== void 0 && !isPositiveNumber(node.width)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'width' in area_effect node '${nodeId}' must be a positive number, got ${node.width}`,
              path: `${path}.width`,
              nodeId
            });
          }
          if (node.height !== void 0 && !isPositiveNumber(node.height)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'height' in area_effect node '${nodeId}' must be a positive number, got ${node.height}`,
              path: `${path}.height`,
              nodeId
            });
          }
          if (node.range !== void 0 && !isPositiveNumber(node.range)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'range' in area_effect node '${nodeId}' must be a positive number, got ${node.range}`,
              path: `${path}.range`,
              nodeId
            });
          }
          if (node.duration !== void 0 && !isNonNegativeNumber(node.duration)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'duration' in area_effect node '${nodeId}' must be a non-negative number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          const tickRate = node.tickRate ?? node.interval;
          if (tickRate !== void 0 && !isPositiveNumber(tickRate)) {
            const field = node.interval !== void 0 ? "interval" : "tickRate";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in area_effect node '${nodeId}' must be a positive number, got ${tickRate}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const dir = node.direction ?? node.directionMode;
          if (dir !== void 0 && !isValidDirection(dir)) {
            const field = node.directionMode !== void 0 ? "directionMode" : "direction";
            errors.push({
              code: "INVALID_DIRECTION_MODE",
              message: `Invalid direction mode in area_effect node '${nodeId}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }
        case "damage": {
          const dmg = node.amount ?? node.damage ?? node.value;
          if (dmg === void 0 || !isPositiveNumber(dmg)) {
            const field = node.damage !== void 0 ? "damage" : node.value !== void 0 ? "value" : "amount";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in damage node '${nodeId}' must be a positive number, got ${dmg}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          if (node.multiplier !== void 0 && !isPositiveNumber(node.multiplier)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'multiplier' in damage node '${nodeId}' must be a positive number, got ${node.multiplier}`,
              path: `${path}.multiplier`,
              nodeId
            });
          }
          if (node.criticalMultiplier !== void 0 && !isPositiveNumber(node.criticalMultiplier)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'criticalMultiplier' in damage node '${nodeId}' must be a positive number, got ${node.criticalMultiplier}`,
              path: `${path}.criticalMultiplier`,
              nodeId
            });
          }
          if (node.criticalChance !== void 0 && (!Number.isFinite(node.criticalChance) || node.criticalChance < 0 || node.criticalChance > 1)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'criticalChance' in damage node '${nodeId}' must be a number between 0 and 1, got ${node.criticalChance}`,
              path: `${path}.criticalChance`,
              nodeId
            });
          }
          break;
        }
        case "heal": {
          const heal = node.amount ?? node.heal ?? node.value;
          if (heal === void 0 || !isPositiveNumber(heal)) {
            const field = node.heal !== void 0 ? "heal" : node.value !== void 0 ? "value" : "amount";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in heal node '${nodeId}' must be a positive number, got ${heal}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }
        case "status": {
          const statusId = node.statusId ?? node.status ?? node.name ?? node.effect;
          if (typeof statusId !== "string" || !statusId.trim()) {
            errors.push({
              code: "INVALID_PARAMETER",
              message: `Status node '${nodeId}' requires a non-empty status identifier string`,
              path: `${path}.status`,
              nodeId
            });
          }
          if (node.duration === void 0 || !isPositiveNumber(node.duration)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'duration' in status node '${nodeId}' must be a positive number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          if (node.stacks !== void 0 && !isPositiveInteger(node.stacks)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'stacks' in status node '${nodeId}' must be a positive integer, got ${node.stacks}`,
              path: `${path}.stacks`,
              nodeId
            });
          }
          if (node.maxStacks !== void 0 && !isPositiveInteger(node.maxStacks)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'maxStacks' in status node '${nodeId}' must be a positive integer, got ${node.maxStacks}`,
              path: `${path}.maxStacks`,
              nodeId
            });
          }
          const tickRate = node.tickRate ?? node.interval;
          if (tickRate !== void 0 && !isPositiveNumber(tickRate)) {
            const field = node.interval !== void 0 ? "interval" : "tickRate";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in status node '${nodeId}' must be a positive number, got ${tickRate}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }
        case "knockback": {
          const force = node.force ?? node.distance ?? node.speed;
          if (force === void 0 || !isPositiveNumber(force)) {
            const field = node.distance !== void 0 ? "distance" : node.speed !== void 0 ? "speed" : "force";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in knockback node '${nodeId}' must be a positive number, got ${force}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const dir = node.direction ?? node.directionMode;
          if (dir !== void 0 && !isValidDirection(dir)) {
            const field = node.directionMode !== void 0 ? "directionMode" : "direction";
            errors.push({
              code: "INVALID_DIRECTION_MODE",
              message: `Invalid direction mode in knockback node '${nodeId}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          if (node.duration !== void 0 && !isPositiveNumber(node.duration)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'duration' in knockback node '${nodeId}' must be a positive number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          break;
        }
        case "timed_action": {
          const dur = node.duration ?? node.delay;
          if (dur === void 0 || !isPositiveNumber(dur)) {
            const field = node.delay !== void 0 ? "delay" : "duration";
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property '${field}' in timed_action node '${nodeId}' must be a positive number, got ${dur}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }
        case "presentation": {
          if (node.duration !== void 0 && !isNonNegativeNumber(node.duration)) {
            errors.push({
              code: "OUT_OF_RANGE_NUMERIC",
              message: `Property 'duration' in presentation node '${nodeId}' must be a non-negative number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          break;
        }
      }
      if (node.next !== void 0) {
        if (typeof node.next !== "string" || !node.next.trim()) {
          errors.push({
            code: "INVALID_NODE_REFERENCE",
            message: `Reference 'next' in node '${nodeId}' must be a non-empty string`,
            path: `${path}.next`,
            nodeId
          });
        } else if (!nodeMap.has(node.next)) {
          errors.push({
            code: "MISSING_NODE_REFERENCE",
            message: `Node '${nodeId}' references non-existent node '${node.next}' in 'next'`,
            path: `${path}.next`,
            nodeId
          });
        }
      }
      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          const childId = node.children[i];
          if (typeof childId !== "string" || !childId.trim()) {
            errors.push({
              code: "INVALID_NODE_REFERENCE",
              message: `Child reference at index ${i} in node '${nodeId}' must be a non-empty string`,
              path: `${path}.children[${i}]`,
              nodeId
            });
          } else if (!nodeMap.has(childId)) {
            errors.push({
              code: "MISSING_NODE_REFERENCE",
              message: `Sequence node '${nodeId}' references non-existent node '${childId}' in 'children'`,
              path: `${path}.children[${i}]`,
              nodeId
            });
          }
        }
      }
      const singleRefProps = [
        "onTrue",
        "onFalse",
        "onComplete",
        "onExpire",
        "onTick",
        "onMiss",
        "targetNode",
        "success",
        "failure"
      ];
      for (const field of singleRefProps) {
        if (node[field] !== void 0) {
          if (typeof node[field] !== "string" || !node[field].trim()) {
            errors.push({
              code: "INVALID_NODE_REFERENCE",
              message: `Reference '${field}' in node '${nodeId}' must be a non-empty string`,
              path: `${path}.${field}`,
              nodeId
            });
          } else if (!nodeMap.has(node[field])) {
            errors.push({
              code: "MISSING_NODE_REFERENCE",
              message: `Node '${nodeId}' references non-existent node '${node[field]}' in '${field}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
        }
      }
      if (node.onHit !== void 0) {
        if (typeof node.onHit === "string") {
          if (!node.onHit.trim()) {
            errors.push({
              code: "INVALID_NODE_REFERENCE",
              message: `Reference 'onHit' in node '${nodeId}' must be a non-empty string`,
              path: `${path}.onHit`,
              nodeId
            });
          } else if (!nodeMap.has(node.onHit)) {
            errors.push({
              code: "MISSING_NODE_REFERENCE",
              message: `Node '${nodeId}' references non-existent node '${node.onHit}' in 'onHit'`,
              path: `${path}.onHit`,
              nodeId
            });
          }
        } else if (Array.isArray(node.onHit)) {
          for (let i = 0; i < node.onHit.length; i++) {
            const hitRef = node.onHit[i];
            if (typeof hitRef !== "string" || !hitRef.trim()) {
              errors.push({
                code: "INVALID_NODE_REFERENCE",
                message: `Reference 'onHit[${i}]' in node '${nodeId}' must be a non-empty string`,
                path: `${path}.onHit[${i}]`,
                nodeId
              });
            } else if (!nodeMap.has(hitRef)) {
              errors.push({
                code: "MISSING_NODE_REFERENCE",
                message: `Node '${nodeId}' references non-existent node '${hitRef}' in 'onHit'`,
                path: `${path}.onHit[${i}]`,
                nodeId
              });
            }
          }
        }
      }
    }
    if (abilityDef.entryNodeId && nodeMap.has(abilityDef.entryNodeId)) {
      const reachable = /* @__PURE__ */ new Set();
      const markReachable = (id) => {
        if (reachable.has(id) || !nodeMap.has(id)) return;
        reachable.add(id);
        const edges = getOutgoingEdges(nodeMap.get(id)?.node);
        for (const edge of edges) {
          markReachable(edge.targetId);
        }
      };
      markReachable(abilityDef.entryNodeId);
      for (const [id, { path }] of nodeMap.entries()) {
        if (!reachable.has(id)) {
          warnings.push({
            message: `Node '${id}' is unreachable from entryNodeId '${abilityDef.entryNodeId}'`,
            path,
            nodeId: id
          });
        }
      }
    }
    const visited = /* @__PURE__ */ new Set();
    const visiting = /* @__PURE__ */ new Map();
    const currentPath = [];
    const detectedCycles = /* @__PURE__ */ new Set();
    function dfs(currentId) {
      visiting.set(currentId, currentPath.length);
      currentPath.push(currentId);
      const nodeInfo = nodeMap.get(currentId);
      const outgoing = getOutgoingEdges(nodeInfo?.node);
      for (const edge of outgoing) {
        const nextId = edge.targetId;
        if (!nodeMap.has(nextId)) continue;
        if (visiting.has(nextId)) {
          const cycleStartIdx = visiting.get(nextId);
          const cycleNodes = currentPath.slice(cycleStartIdx).concat(nextId);
          const cycleKey = cycleNodes.join(" -> ");
          if (!detectedCycles.has(cycleKey)) {
            detectedCycles.add(cycleKey);
            errors.push({
              code: "CYCLE_DETECTED",
              message: `Cycle detected in graph flow: ${cycleKey}`,
              path: `${nodeInfo.path}.${edge.field}`,
              nodeId: currentId,
              cycle: cycleNodes,
              nodePath: cycleNodes
            });
          }
        } else if (!visited.has(nextId)) {
          dfs(nextId);
        }
      }
      visiting.delete(currentId);
      currentPath.pop();
      visited.add(currentId);
    }
    if (abilityDef.entryNodeId && nodeMap.has(abilityDef.entryNodeId)) {
      dfs(abilityDef.entryNodeId);
    }
    for (const id of nodeMap.keys()) {
      if (!visited.has(id)) {
        dfs(id);
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Asserts that an ability definition is valid, throwing AbilityValidationError on failure.
   * @param {Object} abilityDef
   * @returns {{ valid: true, errors: Array, warnings: Array }}
   */
  static assertValid(abilityDef) {
    const result = _AbilityValidator.validate(abilityDef);
    if (!result.valid) {
      const summary = result.errors.map((e) => `[${e.code}] ${e.path ? `${e.path}: ` : ""}${e.message}`).join("\n  ");
      throw new AbilityValidationError(
        `Ability '${abilityDef?.id || "unknown"}' validation failed with ${result.errors.length} error(s):
  ${summary}`,
        result
      );
    }
    return result;
  }
  validate(abilityDef) {
    return _AbilityValidator.validate(abilityDef);
  }
  assertValid(abilityDef) {
    return _AbilityValidator.assertValid(abilityDef);
  }
};

// src/larissa/abilityExecutor.js
var AbilityBudgetExceededError = class extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message = "Execution operation budget exceeded") {
    super(message);
    this.name = "AbilityBudgetExceededError";
  }
};
var AbilityExecutionError = class extends Error {
  /**
   * @param {string} [message]
   * @param {Object} [context]
   */
  constructor(message = "Ability execution failed", context = {}) {
    super(message);
    this.name = "AbilityExecutionError";
    this.context = context;
  }
};
function isActorAlive(actor) {
  if (!actor) return false;
  if (typeof actor.isAlive === "boolean") return actor.isAlive;
  if (typeof actor.isAlive === "function") return actor.isAlive();
  if (actor.isDestroyed) return false;
  if (typeof actor.health === "number") return actor.health > 0;
  if (typeof actor._health === "number") return actor._health > 0;
  return true;
}
function getActorPosition(actor) {
  if (!actor) return { x: 0, y: 0 };
  if (actor.position && Number.isFinite(actor.position.x) && Number.isFinite(actor.position.y)) {
    return { x: actor.position.x, y: actor.position.y };
  }
  if (Number.isFinite(actor.x) && Number.isFinite(actor.y)) {
    return { x: actor.x, y: actor.y };
  }
  return { x: 0, y: 0 };
}
function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}
function getNode(abilityDef, nodeId) {
  if (!abilityDef || !abilityDef.nodes || !nodeId) return null;
  if (Array.isArray(abilityDef.nodes)) {
    return abilityDef.nodes.find(function(item) {
      return item && item.id === nodeId;
    }) || null;
  }
  if (typeof abilityDef.nodes === "object") {
    return abilityDef.nodes[nodeId] || null;
  }
  return null;
}
var AbilityExecutor = class {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxOperationsPerTick=1000] - Operation budget per tick to prevent infinite processing
   * @param {Object} [options.eventBus=null] - Optional event bus for emitting presentation and lifecycle cues
   * @param {Array} [options.actors=[]] - Default actor collection for target resolution
   */
  constructor(options = {}) {
    this.maxOperationsPerTick = Number.isFinite(options.maxOperationsPerTick) && options.maxOperationsPerTick > 0 ? options.maxOperationsPerTick : 1e3;
    this.eventBus = options.eventBus || null;
    this.actors = Array.isArray(options.actors) ? options.actors : [];
    this._instances = /* @__PURE__ */ new Map();
    this._cooldowns = /* @__PURE__ */ new Map();
    this._listeners = /* @__PURE__ */ new Map();
    this._serial = 1;
    this._operationsInCurrentTick = 0;
  }
  /**
   * Subscribe to executor events.
   * @param {string} event
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  on(event, listener) {
    if (typeof event !== "string" || !event || typeof listener !== "function") {
      throw new TypeError("AbilityExecutor.on requires an event string and a listener function");
    }
    if (!this._listeners.has(event)) {
      this._listeners.set(event, /* @__PURE__ */ new Set());
    }
    this._listeners.get(event).add(listener);
    const self = this;
    return function() {
      const set = self._listeners.get(event);
      if (set) set.delete(listener);
    };
  }
  /**
   * Remove an event listener.
   * @param {string} event
   * @param {Function} listener
   * @returns {boolean}
   */
  off(event, listener) {
    const set = this._listeners.get(event);
    if (!set) return false;
    return set.delete(listener);
  }
  /**
   * Emit an event to local listeners and optional external event bus.
   * @param {string} event
   * @param {Object} payload
   */
  _emit(event, payload = {}) {
    const listeners = this._listeners.get(event);
    if (listeners && listeners.size > 0) {
      for (const listener of Array.from(listeners)) {
        try {
          listener(payload);
        } catch (err) {
          console.error(`Error in AbilityExecutor listener for '${event}':`, err);
        }
      }
    }
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      try {
        this.eventBus.emit(event, payload);
      } catch (err) {
        console.error(`Error emitting to eventBus for '${event}':`, err);
      }
    }
  }
  /**
   * Consume an operation from the execution budget.
   * @param {Object} instance
   */
  _consumeOperation(instance) {
    this._operationsInCurrentTick++;
    if (this._operationsInCurrentTick > this.maxOperationsPerTick) {
      if (instance) {
        instance.status = "failed";
        instance.cancelReason = "budget_exceeded";
        this._instances.delete(instance.id);
      }
      throw new AbilityBudgetExceededError(
        `Execution operation budget of ${this.maxOperationsPerTick} exceeded in tick`
      );
    }
  }
  /**
   * Check if an ability is currently on cooldown for a given caster.
   * @param {string} casterId
   * @param {string} abilityId
   * @returns {boolean}
   */
  isOnCooldown(casterId, abilityId) {
    return this.getCooldown(casterId, abilityId) > 0;
  }
  /**
   * Get the remaining cooldown time for an ability and caster in seconds.
   * @param {string} casterId
   * @param {string} abilityId
   * @returns {number} Remaining cooldown in seconds, or 0
   */
  getCooldown(casterId, abilityId) {
    if (!casterId || !abilityId) return 0;
    const casterMap = this._cooldowns.get(casterId);
    if (!casterMap) return 0;
    return casterMap.get(abilityId) || 0;
  }
  /**
   * Set a cooldown duration for a caster and ability.
   * @param {string} casterId
   * @param {string} abilityId
   * @param {number} duration - Cooldown in seconds
   */
  setCooldown(casterId, abilityId, duration) {
    if (!casterId || !abilityId) return;
    if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
      this.resetCooldown(casterId, abilityId);
      return;
    }
    if (!this._cooldowns.has(casterId)) {
      this._cooldowns.set(casterId, /* @__PURE__ */ new Map());
    }
    this._cooldowns.get(casterId).set(abilityId, duration);
  }
  /**
   * Reset cooldown for a specific caster and ability.
   * @param {string} casterId
   * @param {string} abilityId
   */
  resetCooldown(casterId, abilityId) {
    const casterMap = this._cooldowns.get(casterId);
    if (casterMap) {
      casterMap.delete(abilityId);
      if (casterMap.size === 0) {
        this._cooldowns.delete(casterId);
      }
    }
  }
  /**
   * Reset all tracked cooldowns across all casters.
   */
  resetAllCooldowns() {
    this._cooldowns.clear();
  }
  /**
   * Get all active execution instances, optionally filtered by caster ID.
   * @param {string} [casterId]
   * @returns {Array}
   */
  getActiveInstances(casterId) {
    const list = Array.from(this._instances.values());
    if (casterId) {
      return list.filter(function(inst) {
        return inst.casterId === casterId;
      });
    }
    return list;
  }
  /**
   * Cancel all running executions across all casters.
   * @param {string} [reason="cancelled"]
   * @returns {number} Number of instances cancelled
   */
  cancelAll(reason = "cancelled") {
    let count = 0;
    for (const instance of Array.from(this._instances.values())) {
      this._cancelInstance(instance, reason);
      count++;
    }
    return count;
  }
  /**
   * Cancel all running executions for a specific caster.
   * @param {string} casterId
   * @param {string} [reason="cancelled"]
   * @returns {number} Number of instances cancelled
   */
  cancelByCaster(casterId, reason = "cancelled") {
    if (!casterId) return 0;
    let count = 0;
    for (const instance of Array.from(this._instances.values())) {
      if (instance.casterId === casterId) {
        this._cancelInstance(instance, reason);
        count++;
      }
    }
    return count;
  }
  /**
   * Internal helper to cancel an instance cleanly.
   * @param {Object} instance
   * @param {string} reason
   */
  _cancelInstance(instance, reason) {
    instance.status = "cancelled";
    instance.cancelReason = reason;
    instance.activeTimedActions = [];
    instance.activeProjectiles = [];
    instance.pendingSequences = [];
    this._instances.delete(instance.id);
    this._emit("ability:cancelled", { instance, reason, casterId: instance.casterId, abilityId: instance.abilityDef.id });
  }
  /**
   * Execute an ability graph definition against an execution context.
   * Validates the graph, enforces cooldowns and caster survival, and steps execution.
   * @param {Object} abilityDef - Validated or validatable ability definition graph
   * @param {Object} [context={}] - Execution context (caster, target, targets, cursor, world, actors)
   * @returns {Object} Execution result { success, instance, status, reason }
   */
  execute(abilityDef, context = {}) {
    AbilityValidator.assertValid(abilityDef);
    const caster = context.caster || null;
    const casterId = caster && caster.id ? caster.id : typeof caster === "string" ? caster : context.casterId || "caster";
    if (caster && !isActorAlive(caster)) {
      return {
        success: false,
        reason: "caster_dead",
        status: "failed",
        instance: null
      };
    }
    const cooldownDuration = Number.isFinite(abilityDef.cooldown) && abilityDef.cooldown > 0 ? abilityDef.cooldown : Number.isFinite(context.cooldown) && context.cooldown > 0 ? context.cooldown : 0;
    if (cooldownDuration > 0 && this.isOnCooldown(casterId, abilityDef.id)) {
      return {
        success: false,
        reason: "cooldown",
        status: "blocked",
        remainingCooldown: this.getCooldown(casterId, abilityDef.id),
        instance: null
      };
    }
    if (cooldownDuration > 0) {
      this.setCooldown(casterId, abilityDef.id, cooldownDuration);
      if (caster && caster.cooldowns instanceof Map) {
        caster.cooldowns.set(abilityDef.id, cooldownDuration);
      }
    }
    this._operationsInCurrentTick = 0;
    const initialTargets = context.targets ? context.targets.filter(Boolean) : context.target ? [context.target] : [];
    const instance = {
      id: this._serial++,
      abilityDef,
      caster,
      casterId,
      context: { ...context },
      status: "running",
      cancelReason: null,
      currentTargets: initialTargets,
      cursor: context.cursor ? { x: context.cursor.x, y: context.cursor.y } : null,
      impactPoint: null,
      targetPoint: null,
      activeTimedActions: [],
      activeProjectiles: [],
      pendingSequences: []
    };
    this._instances.set(instance.id, instance);
    this._emit("ability:start", { instance, caster, abilityId: abilityDef.id });
    this._executeNode(instance, abilityDef.entryNodeId);
    if (this._isInstanceFinished(instance)) {
      instance.status = "completed";
      this._instances.delete(instance.id);
      this._emit("ability:completed", { instance, caster, abilityId: abilityDef.id });
    }
    return {
      success: true,
      instance,
      status: instance.status
    };
  }
  /**
   * Alias for execute().
   * @param {Object} abilityDef
   * @param {Object} [context]
   * @returns {Object}
   */
  cast(abilityDef, context) {
    return this.execute(abilityDef, context);
  }
  /**
   * Helper to determine whether an execution instance has completed all active work.
   * @param {Object} instance
   * @returns {boolean}
   */
  _isInstanceFinished(instance) {
    if (instance.status !== "running") return true;
    return instance.activeTimedActions.length === 0 && instance.activeProjectiles.length === 0 && instance.pendingSequences.length === 0;
  }
  /**
   * Execute a single node in the ability graph.
   * @param {Object} instance
   * @param {string} nodeId
   */
  _executeNode(instance, nodeId) {
    if (!nodeId || instance.status !== "running") return;
    if (instance.caster && !isActorAlive(instance.caster)) {
      this._cancelInstance(instance, "caster_death");
      return;
    }
    this._consumeOperation(instance);
    const node = getNode(instance.abilityDef, nodeId);
    if (!node) {
      return;
    }
    switch (node.type) {
      case "target":
        this._executeTargetNode(instance, node, nodeId);
        break;
      case "filter":
        this._executeFilterNode(instance, node, nodeId);
        break;
      case "sequence":
        this._executeSequenceNode(instance, node, nodeId);
        break;
      case "condition":
        this._executeConditionNode(instance, node, nodeId);
        break;
      case "projectile":
        this._executeProjectileNode(instance, node, nodeId);
        break;
      case "area_effect":
        this._executeAreaEffectNode(instance, node, nodeId);
        break;
      case "damage":
        this._executeDamageNode(instance, node, nodeId);
        break;
      case "heal":
        this._executeHealNode(instance, node, nodeId);
        break;
      case "status":
        this._executeStatusNode(instance, node, nodeId);
        break;
      case "knockback":
        this._executeKnockbackNode(instance, node, nodeId);
        break;
      case "timed_action":
        this._executeTimedActionNode(instance, node, nodeId);
        break;
      case "presentation":
        this._executePresentationNode(instance, node, nodeId);
        break;
      default:
        if (node.next) this._executeNode(instance, node.next);
        break;
    }
  }
  /**
   * Collect candidate actors for targeting from context and executor defaults.
   * @param {Object} instance
   * @returns {Array}
   */
  _getCandidateActors(instance) {
    const set = /* @__PURE__ */ new Set();
    const ctx2 = instance.context;
    if (Array.isArray(ctx2.actors)) {
      for (const a of ctx2.actors) if (a) set.add(a);
    }
    if (ctx2.world) {
      if (typeof ctx2.world.getActors === "function") {
        const actors = ctx2.world.getActors();
        if (Array.isArray(actors)) {
          for (const a of actors) if (a) set.add(a);
        }
      } else if (Array.isArray(ctx2.world.actors)) {
        for (const a of ctx2.world.actors) if (a) set.add(a);
      }
    }
    if (Array.isArray(ctx2.targets)) {
      for (const t of ctx2.targets) if (t) set.add(t);
    }
    if (ctx2.target) set.add(ctx2.target);
    if (Array.isArray(this.actors)) {
      for (const a of this.actors) if (a) set.add(a);
    }
    return Array.from(set);
  }
  /**
   * Execute 'target' node: resolves target actors (caster, enemies, allies, cursor, cone, radius).
   */
  _executeTargetNode(instance, node, nodeId) {
    const mode = (node.mode || node.targetType || "cursor").toLowerCase();
    const caster = instance.caster;
    const casterPos = getActorPosition(caster);
    const candidateActors = this._getCandidateActors(instance);
    let resolvedTargets = [];
    switch (mode) {
      case "self":
      case "caster": {
        if (caster) resolvedTargets = [caster];
        break;
      }
      case "cursor":
      case "point": {
        const cursor = instance.context.cursor || instance.cursor || instance.context.targetPosition || { x: 0, y: 0 };
        let targetX = cursor.x;
        let targetY = cursor.y;
        if (Number.isFinite(node.range) && node.range > 0) {
          const dx = targetX - casterPos.x;
          const dy = targetY - casterPos.y;
          const dist = Math.hypot(dx, dy);
          if (dist > node.range && dist > 0) {
            targetX = casterPos.x + dx / dist * node.range;
            targetY = casterPos.y + dy / dist * node.range;
          }
        }
        instance.cursor = { x: targetX, y: targetY };
        instance.targetPoint = { x: targetX, y: targetY };
        resolvedTargets = [];
        break;
      }
      case "cone": {
        const range = Number.isFinite(node.range) ? node.range : 64;
        const angleDeg = Number.isFinite(node.angle) ? node.angle : 90;
        const halfAngleRad = angleDeg * Math.PI / 360;
        let aimDirX = 1;
        let aimDirY = 0;
        if (instance.context.aim && Number.isFinite(instance.context.aim.x) && Number.isFinite(instance.context.aim.y)) {
          aimDirX = instance.context.aim.x;
          aimDirY = instance.context.aim.y;
        } else if (instance.context.cursor || instance.cursor) {
          const c = instance.context.cursor || instance.cursor;
          const dx = c.x - casterPos.x;
          const dy = c.y - casterPos.y;
          const len = Math.hypot(dx, dy);
          if (len > 0) {
            aimDirX = dx / len;
            aimDirY = dy / len;
          }
        }
        const aimAngle = Math.atan2(aimDirY, aimDirX);
        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const pos = getActorPosition(actor);
          const dx = pos.x - casterPos.x;
          const dy = pos.y - casterPos.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= range) {
            if (dist === 0) {
              resolvedTargets.push(actor);
            } else {
              const actorAngle = Math.atan2(dy, dx);
              const diff = Math.abs(normalizeAngle(actorAngle - aimAngle));
              if (diff <= halfAngleRad) {
                resolvedTargets.push(actor);
              }
            }
          }
        }
        break;
      }
      case "radius":
      case "area": {
        const radius = Number.isFinite(node.radius) ? node.radius : Number.isFinite(node.range) ? node.range : 48;
        const center = instance.targetPoint || instance.cursor || casterPos;
        for (const actor of candidateActors) {
          if (!isActorAlive(actor)) continue;
          if (actor === caster && node.affectCaster !== true) continue;
          const pos = getActorPosition(actor);
          const dist = Math.hypot(pos.x - center.x, pos.y - center.y);
          if (dist <= radius) {
            resolvedTargets.push(actor);
          }
        }
        break;
      }
      case "nearest_enemy":
      case "enemy":
      case "hostile": {
        const casterFaction = caster ? caster.faction || "player" : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        let closest = null;
        let minDist = Infinity;
        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const actorFaction = actor.faction || "neutral";
          if (actorFaction !== casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range && dist < minDist) {
              minDist = dist;
              closest = actor;
            }
          }
        }
        if (closest) resolvedTargets = [closest];
        break;
      }
      case "nearest_ally":
      case "ally":
      case "friendly": {
        const casterFaction = caster ? caster.faction || "player" : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        let closest = null;
        let minDist = Infinity;
        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const actorFaction = actor.faction || "player";
          if (actorFaction === casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range && dist < minDist) {
              minDist = dist;
              closest = actor;
            }
          }
        }
        if (closest) resolvedTargets = [closest];
        break;
      }
      case "allies": {
        const casterFaction = caster ? caster.faction || "player" : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        for (const actor of candidateActors) {
          if (!isActorAlive(actor)) continue;
          const actorFaction = actor.faction || "player";
          if (actorFaction === casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range) resolvedTargets.push(actor);
          }
        }
        break;
      }
      case "enemies": {
        const casterFaction = caster ? caster.faction || "player" : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const actorFaction = actor.faction || "neutral";
          if (actorFaction !== casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range) resolvedTargets.push(actor);
          }
        }
        break;
      }
      default: {
        resolvedTargets = candidateActors.filter(function(a) {
          return a !== caster && isActorAlive(a);
        });
        break;
      }
    }
    if (Number.isInteger(node.maxTargets) && node.maxTargets > 0) {
      resolvedTargets = resolvedTargets.slice(0, node.maxTargets);
    }
    if (resolvedTargets.length > 0 || mode === "self" || mode === "caster") {
      instance.currentTargets = resolvedTargets;
    }
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'filter' node: filters current targets by faction, type, and maxTargets.
   */
  _executeFilterNode(instance, node, nodeId) {
    const caster = instance.caster;
    const casterFaction = caster ? caster.faction || "player" : "player";
    const filterType = (node.targetType || "enemy").toLowerCase();
    let filtered = [];
    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;
      const targetFaction = target.faction || "neutral";
      if (filterType === "enemy" || filterType === "hostile" || filterType === "enemies") {
        if (target !== caster && targetFaction !== casterFaction) {
          filtered.push(target);
        }
      } else if (filterType === "ally" || filterType === "friendly" || filterType === "allies") {
        if (targetFaction === casterFaction) {
          filtered.push(target);
        }
      } else if (filterType === "self") {
        if (target === caster) {
          filtered.push(target);
        }
      } else {
        filtered.push(target);
      }
    }
    if (Number.isInteger(node.maxTargets) && node.maxTargets > 0) {
      filtered = filtered.slice(0, node.maxTargets);
    }
    instance.currentTargets = filtered;
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'sequence' node: steps through child nodes sequentially, pausing on delays.
   */
  _executeSequenceNode(instance, node, nodeId) {
    if (!Array.isArray(node.children) || node.children.length === 0) {
      if (node.next) this._executeNode(instance, node.next);
      return;
    }
    const sequenceState = {
      sequenceNodeId: nodeId,
      children: node.children.slice(),
      nextChildIndex: 0,
      next: node.next || null
    };
    instance.pendingSequences.push(sequenceState);
    this._advanceSequence(instance, sequenceState);
  }
  /**
   * Advance a pending sequence until completion or until paused by an active delay.
   */
  _advanceSequence(instance, sequenceState) {
    while (sequenceState.nextChildIndex < sequenceState.children.length) {
      if (instance.status !== "running") return;
      const childId = sequenceState.children[sequenceState.nextChildIndex];
      sequenceState.nextChildIndex++;
      this._executeNode(instance, childId);
      if (instance.activeTimedActions.length > 0) {
        return;
      }
    }
    const idx = instance.pendingSequences.indexOf(sequenceState);
    if (idx !== -1) {
      instance.pendingSequences.splice(idx, 1);
    }
    if (sequenceState.next) {
      this._executeNode(instance, sequenceState.next);
    }
  }
  /**
   * Execute 'condition' node: branches to onTrue or onFalse based on check result.
   */
  _executeConditionNode(instance, node, nodeId) {
    const target = instance.currentTargets[0] || instance.caster || null;
    const check = (node.check || "").toLowerCase();
    let result = false;
    if (check === "health_below_max") {
      if (target) {
        const health = target.health ?? target._health ?? 100;
        const maxHealth = target.maxHealth ?? target._maxHealth ?? 100;
        result = health < maxHealth;
      }
    } else if (check === "is_alive") {
      result = isActorAlive(target);
    } else if (check === "health_at_max" || check === "health_full") {
      if (target) {
        const health = target.health ?? target._health ?? 100;
        const maxHealth = target.maxHealth ?? target._maxHealth ?? 100;
        result = health >= maxHealth;
      }
    } else if (check === "has_status") {
      if (target && Array.isArray(target.effects)) {
        const statusName = node.statusName || node.name || "";
        result = target.effects.some(function(e) {
          return e && e.name === statusName;
        });
      }
    } else if (instance.context.conditions && typeof instance.context.conditions[node.check] === "function") {
      result = Boolean(instance.context.conditions[node.check](instance, target, node));
    } else if (typeof node.evaluate === "function") {
      result = Boolean(node.evaluate(instance, target, node));
    }
    const nextNodeId = result ? node.onTrue || node.next || null : node.onFalse || node.next || null;
    if (nextNodeId) {
      this._executeNode(instance, nextNodeId);
    }
  }
  /**
   * Execute 'timed_action' node: registers a delay and pauses execution flow.
   */
  _executeTimedActionNode(instance, node, nodeId) {
    const duration = Number.isFinite(node.duration) ? node.duration : Number.isFinite(node.delay) ? node.delay : 0;
    if (duration <= 0) {
      if (node.next) this._executeNode(instance, node.next);
      return;
    }
    instance.activeTimedActions.push({
      nodeId,
      remaining: duration,
      next: node.next || null
    });
    this._emit("ability:delay_start", {
      instance,
      nodeId,
      duration,
      abilityId: instance.abilityDef.id
    });
  }
  /**
   * Execute 'projectile' node: launches a simulated projectile traveling toward cursor/target.
   */
  _executeProjectileNode(instance, node, nodeId) {
    const caster = instance.caster;
    const origin = getActorPosition(caster);
    const speed = Number.isFinite(node.speed) ? node.speed : Number.isFinite(node.projectileSpeed) ? node.projectileSpeed : 300;
    const maxRange = Number.isFinite(node.range) ? node.range : Number.isFinite(node.maxDistance) ? node.maxDistance : 400;
    const radius = Number.isFinite(node.radius) ? node.radius : Number.isFinite(node.size) ? node.size : 8;
    const cursor = instance.cursor || instance.context.cursor || { x: origin.x + 100, y: origin.y };
    const dx = cursor.x - origin.x;
    const dy = cursor.y - origin.y;
    const distToCursor = Math.hypot(dx, dy);
    let dirX = 1;
    let dirY = 0;
    if (distToCursor > 0) {
      dirX = dx / distToCursor;
      dirY = dy / distToCursor;
    }
    const targetFlightDistance = distToCursor > 0 ? Math.min(distToCursor, maxRange) : maxRange;
    const projectile = {
      id: this._serial++,
      nodeId,
      onHit: node.onHit || null,
      next: node.next || null,
      speed,
      maxDistance: targetFlightDistance,
      radius,
      x: origin.x,
      y: origin.y,
      dirX,
      dirY,
      travelled: 0,
      hitTargets: /* @__PURE__ */ new Set()
    };
    instance.activeProjectiles.push(projectile);
    this._emit("projectile", {
      instance,
      projectile,
      caster,
      abilityId: instance.abilityDef.id
    });
    this._emit("ability:projectile_spawn", {
      instance,
      projectile,
      caster,
      abilityId: instance.abilityDef.id
    });
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'area_effect' node: finds targets within radius and triggers onHit on them.
   */
  _executeAreaEffectNode(instance, node, nodeId) {
    const radius = Number.isFinite(node.radius) ? node.radius : 48;
    const center = instance.impactPoint || instance.targetPoint || instance.cursor || getActorPosition(instance.caster);
    const candidateActors = this._getCandidateActors(instance);
    const affectedTargets = [];
    for (const actor of candidateActors) {
      if (!isActorAlive(actor)) continue;
      if (actor === instance.caster && node.affectCaster !== true) continue;
      const pos = getActorPosition(actor);
      const dist = Math.hypot(pos.x - center.x, pos.y - center.y);
      if (dist <= radius) {
        affectedTargets.push(actor);
      }
    }
    instance.currentTargets = affectedTargets;
    this._emit("ability:area_effect", {
      instance,
      center,
      radius,
      targets: affectedTargets,
      abilityId: instance.abilityDef.id
    });
    if (node.onHit) {
      this._executeNode(instance, node.onHit);
    }
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'damage' node: applies damage to target Combatant / Stats.
   */
  _executeDamageNode(instance, node, nodeId) {
    const rawAmount = Number.isFinite(node.amount) ? node.amount : Number.isFinite(node.damage) ? node.damage : Number.isFinite(node.value) ? node.value : 0;
    const damageType = node.damageType || "physical";
    const multiplier = Number.isFinite(node.multiplier) ? node.multiplier : 1;
    let finalAmount = rawAmount * multiplier;
    if (Number.isFinite(node.criticalChance) && node.criticalChance > 0) {
      if (Math.random() < node.criticalChance) {
        finalAmount *= Number.isFinite(node.criticalMultiplier) ? node.criticalMultiplier : 2;
      }
    }
    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;
      let damageDealt = 0;
      let killed = false;
      if (typeof target.receiveDamage === "function") {
        const result = target.receiveDamage({ amount: finalAmount, type: damageType });
        damageDealt = result?.damage ?? finalAmount;
        killed = Boolean(result?.killed || !target.isAlive);
      } else if (typeof target.takeDamage === "function") {
        damageDealt = target.takeDamage(finalAmount);
        killed = Boolean(!target.isAlive || target.health <= 0);
      } else if (target && typeof target.health === "number") {
        const prev = target.health;
        target.health = Math.max(0, target.health - finalAmount);
        damageDealt = prev - target.health;
        killed = target.health === 0;
      }
      this._emit("damage", {
        caster: instance.caster,
        target,
        amount: damageDealt,
        damageType,
        killed,
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:damage", {
        caster: instance.caster,
        target,
        amount: damageDealt,
        damageType,
        killed,
        abilityId: instance.abilityDef.id
      });
    }
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'heal' node: applies healing to target Combatant / Stats.
   */
  _executeHealNode(instance, node, nodeId) {
    const rawAmount = Number.isFinite(node.amount) ? node.amount : Number.isFinite(node.heal) ? node.heal : Number.isFinite(node.value) ? node.value : 0;
    const multiplier = Number.isFinite(node.multiplier) ? node.multiplier : 1;
    const healAmount = rawAmount * multiplier;
    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;
      let healed = 0;
      if (typeof target.heal === "function") {
        healed = target.heal(healAmount);
      } else if (target && typeof target.health === "number") {
        const max = target.maxHealth ?? target._maxHealth ?? target.health;
        const prev = target.health;
        target.health = Math.min(max, target.health + healAmount);
        healed = target.health - prev;
      }
      this._emit("heal", {
        caster: instance.caster,
        target,
        amount: healed,
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:heal", {
        caster: instance.caster,
        target,
        amount: healed,
        abilityId: instance.abilityDef.id
      });
    }
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'status' node: applies status effect to targets.
   */
  _executeStatusNode(instance, node, nodeId) {
    const statusName = node.name || node.effect || node.status || "effect";
    const duration = Number.isFinite(node.duration) ? node.duration : 1;
    const modifiers = node.modifiers && typeof node.modifiers === "object" ? node.modifiers : {};
    const effect = {
      name: statusName,
      duration,
      stacks: Number.isInteger(node.stacks) ? node.stacks : 1,
      modifiers
    };
    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;
      if (typeof target.applyEffect === "function") {
        target.applyEffect(effect);
      } else if (Array.isArray(target.effects)) {
        const existing = target.effects.find(function(e) {
          return e && e.name === statusName;
        });
        if (existing) {
          existing.duration = Math.max(existing.duration, duration);
          if (effect.modifiers) existing.modifiers = { ...existing.modifiers, ...effect.modifiers };
        } else {
          target.effects.push({ ...effect });
        }
      }
      this._emit("status", {
        caster: instance.caster,
        target,
        effect,
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:status", {
        caster: instance.caster,
        target,
        effect,
        abilityId: instance.abilityDef.id
      });
    }
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'knockback' node: applies knockback to targets.
   */
  _executeKnockbackNode(instance, node, nodeId) {
    const force = Number.isFinite(node.force) ? node.force : Number.isFinite(node.distance) ? node.distance : Number.isFinite(node.speed) ? node.speed : 100;
    const duration = Number.isFinite(node.duration) ? node.duration : 0.2;
    const caster = instance.caster;
    const casterPos = getActorPosition(caster);
    const dirMode = node.direction || "away_from_caster";
    for (const target of instance.currentTargets) {
      if (!isActorAlive(target) || target === caster) continue;
      const targetPos = getActorPosition(target);
      let dirX = 1;
      let dirY = 0;
      if (typeof dirMode === "object" && dirMode && Number.isFinite(dirMode.x) && Number.isFinite(dirMode.y)) {
        const len = Math.hypot(dirMode.x, dirMode.y);
        if (len > 0) {
          dirX = dirMode.x / len;
          dirY = dirMode.y / len;
        }
      } else if (dirMode === "towards_caster") {
        const dx = casterPos.x - targetPos.x;
        const dy = casterPos.y - targetPos.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          dirX = dx / len;
          dirY = dy / len;
        }
      } else {
        const dx = targetPos.x - casterPos.x;
        const dy = targetPos.y - casterPos.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          dirX = dx / len;
          dirY = dy / len;
        }
      }
      const kx = dirX * force;
      const ky = dirY * force;
      if (target.body && typeof target.body.applyKnockback === "function") {
        target.body.applyKnockback(kx, ky);
      } else if (typeof target.applyKnockback === "function") {
        target.applyKnockback(kx, ky);
      } else if (target.position && Number.isFinite(target.position.x) && Number.isFinite(target.position.y)) {
        target.position.x += kx * duration;
        target.position.y += ky * duration;
      }
      target.lastKnockback = { x: kx, y: ky, force, direction: { x: dirX, y: dirY } };
      this._emit("knockback", {
        caster,
        target,
        force,
        direction: { x: dirX, y: dirY },
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:knockback", {
        caster,
        target,
        force,
        direction: { x: dirX, y: dirY },
        abilityId: instance.abilityDef.id
      });
    }
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Execute 'presentation' node: emits presentation cues via event bus.
   */
  _executePresentationNode(instance, node, nodeId) {
    const cue = node.cue || node.name || nodeId;
    const duration = Number.isFinite(node.duration) ? node.duration : 0;
    const payload = {
      type: "presentation",
      nodeId,
      cue,
      duration,
      abilityId: instance.abilityDef.id,
      caster: instance.caster,
      targets: instance.currentTargets.slice(),
      position: instance.impactPoint || instance.targetPoint || getActorPosition(instance.caster)
    };
    this._emit("presentation", payload);
    this._emit("presentation:cue", payload);
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }
  /**
   * Advance simulation time for all active executions and cooldowns.
   * Enforces caster death cancellation and operation budgets.
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime = 0) {
    if (typeof deltaTime !== "number" || !Number.isFinite(deltaTime) || deltaTime < 0) {
      throw new TypeError("deltaTime must be a non-negative finite number");
    }
    this._operationsInCurrentTick = 0;
    for (const [casterId, casterMap] of Array.from(this._cooldowns.entries())) {
      for (const [abilityId, remaining] of Array.from(casterMap.entries())) {
        const next = Math.max(0, remaining - deltaTime);
        if (next === 0) {
          casterMap.delete(abilityId);
        } else {
          casterMap.set(abilityId, next);
        }
      }
      if (casterMap.size === 0) {
        this._cooldowns.delete(casterId);
      }
    }
    for (const instance of Array.from(this._instances.values())) {
      if (instance.status !== "running") continue;
      if (instance.caster && !isActorAlive(instance.caster)) {
        this._cancelInstance(instance, "caster_death");
        continue;
      }
      if (instance.activeTimedActions.length > 0) {
        const finishedActions = [];
        for (let i = instance.activeTimedActions.length - 1; i >= 0; i--) {
          const action = instance.activeTimedActions[i];
          action.remaining -= deltaTime;
          if (action.remaining <= 0) {
            instance.activeTimedActions.splice(i, 1);
            finishedActions.push(action);
          }
        }
        for (const action of finishedActions) {
          if (instance.status !== "running") break;
          if (action.next) {
            this._executeNode(instance, action.next);
          }
        }
        if (instance.status === "running" && instance.activeTimedActions.length === 0 && instance.pendingSequences.length > 0) {
          const seq = instance.pendingSequences[instance.pendingSequences.length - 1];
          this._advanceSequence(instance, seq);
        }
      }
      if (instance.status === "running" && instance.activeProjectiles.length > 0) {
        const candidateActors = this._getCandidateActors(instance);
        const hitProjectiles = [];
        for (let i = instance.activeProjectiles.length - 1; i >= 0; i--) {
          const proj = instance.activeProjectiles[i];
          const stepDist = proj.speed * deltaTime;
          const remainingDist = proj.maxDistance - proj.travelled;
          const actualDist = Math.min(stepDist, remainingDist);
          proj.x += proj.dirX * actualDist;
          proj.y += proj.dirY * actualDist;
          proj.travelled += actualDist;
          let hitActor = null;
          for (const actor of candidateActors) {
            if (!isActorAlive(actor) || actor === instance.caster) continue;
            const pos = getActorPosition(actor);
            const dist = Math.hypot(
              actor.position ? actor.position.x - proj.x : pos.x - proj.x,
              actor.position ? actor.position.y - proj.y : pos.y - proj.y
            );
            const hitThreshold = proj.radius + (actor.hurtbox && actor.hurtbox.width ? actor.hurtbox.width / 2 : 12);
            if (dist <= hitThreshold) {
              hitActor = actor;
              break;
            }
          }
          if (hitActor || proj.travelled >= proj.maxDistance) {
            instance.activeProjectiles.splice(i, 1);
            hitProjectiles.push({ proj, hitActor });
          }
        }
        for (const { proj, hitActor } of hitProjectiles) {
          if (instance.status !== "running") break;
          instance.impactPoint = { x: proj.x, y: proj.y };
          if (hitActor) {
            instance.currentTargets = [hitActor];
          }
          this._emit("projectile_hit", {
            instance,
            projectile: proj,
            hitActor,
            position: instance.impactPoint,
            abilityId: instance.abilityDef.id
          });
          this._emit("ability:projectile_hit", {
            instance,
            projectile: proj,
            hitActor,
            position: instance.impactPoint,
            abilityId: instance.abilityDef.id
          });
          if (proj.onHit) {
            this._executeNode(instance, proj.onHit);
          }
          if (proj.next) {
            this._executeNode(instance, proj.next);
          }
        }
      }
      if (this._isInstanceFinished(instance)) {
        instance.status = "completed";
        this._instances.delete(instance.id);
        this._emit("ability:completed", {
          instance,
          caster: instance.caster,
          abilityId: instance.abilityDef.id
        });
      }
    }
  }
};

// src/larissa/perceptionMemory.js
init_component();
init_transform();
var ARCHETYPES = Object.freeze({
  sentinel: Object.freeze({
    visionRange: 350,
    fov: Math.PI * 0.5,
    hearingRadius: 120,
    alertRadius: 120,
    maxEntries: 8,
    decayRate: 0.05,
    forgetThreshold: 0
  }),
  patrol: Object.freeze({
    visionRange: 250,
    fov: Math.PI * 0.65,
    hearingRadius: 100,
    alertRadius: 100,
    maxEntries: 12,
    decayRate: 0.1,
    forgetThreshold: 0
  }),
  civilian: Object.freeze({
    visionRange: 150,
    fov: Math.PI * 0.75,
    hearingRadius: 80,
    alertRadius: 80,
    maxEntries: 4,
    decayRate: 0.25,
    forgetThreshold: 0
  }),
  boss: Object.freeze({
    visionRange: 500,
    fov: Math.PI * 0.9,
    hearingRadius: 250,
    alertRadius: 250,
    maxEntries: 25,
    decayRate: 0.02,
    forgetThreshold: 0
  })
});
function normalizeAngle2(rad) {
  let a = rad % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
function extractPosition(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj.GetComponent === "function") {
    const tr = obj.GetComponent(Transform);
    if (tr && tr.position && Number.isFinite(tr.position.x) && Number.isFinite(tr.position.y)) {
      return { x: tr.position.x, y: tr.position.y };
    }
  }
  if (obj.transform) {
    const tPos = obj.transform.position ?? obj.transform;
    if (Number.isFinite(tPos.x) && Number.isFinite(tPos.y)) {
      return { x: tPos.x, y: tPos.y };
    }
  }
  if (obj.position && Number.isFinite(obj.position.x) && Number.isFinite(obj.position.y)) {
    return { x: obj.position.x, y: obj.position.y };
  }
  if (Number.isFinite(obj.x) && Number.isFinite(obj.y)) {
    return { x: obj.x, y: obj.y };
  }
  if (Array.isArray(obj) && Number.isFinite(obj[0]) && Number.isFinite(obj[1])) {
    return { x: obj[0], y: obj[1] };
  }
  return null;
}
function extractFacing(obj) {
  if (!obj || typeof obj !== "object") return 0;
  let val = obj.facing ?? obj.direction ?? obj.rotation ?? obj.angle;
  if (val === void 0 && obj.transform) {
    val = obj.transform.rotation ?? obj.transform.facing ?? obj.transform.direction;
  }
  if (typeof val === "number") {
    if (Math.abs(val) > 2 * Math.PI) {
      return val * Math.PI / 180;
    }
    return val;
  }
  if (typeof val === "string") {
    const s = val.toLowerCase().trim();
    switch (s) {
      case "right":
      case "east":
        return 0;
      case "down-right":
      case "southeast":
        return Math.PI / 4;
      case "down":
      case "south":
        return Math.PI / 2;
      case "down-left":
      case "southwest":
        return Math.PI * 3 / 4;
      case "left":
      case "west":
        return Math.PI;
      case "up-left":
      case "northwest":
        return -Math.PI * 3 / 4;
      case "up":
      case "north":
        return -Math.PI / 2;
      case "up-right":
      case "northeast":
        return -Math.PI / 4;
      default: {
        const parsed = Number(s);
        if (Number.isFinite(parsed)) {
          return Math.abs(parsed) > 2 * Math.PI ? parsed * Math.PI / 180 : parsed;
        }
        return 0;
      }
    }
  }
  if (val && typeof val === "object" && Number.isFinite(val.x) && Number.isFinite(val.y)) {
    if (val.x !== 0 || val.y !== 0) {
      return Math.atan2(val.y, val.x);
    }
  }
  return 0;
}
function isDestroyed(entity) {
  if (!entity || typeof entity !== "object") return false;
  return entity._destroyed === true || entity.destroyed === true;
}
function segmentIntersectsSegment(p1, p2, p3, p4) {
  const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(d) < 1e-9) return false;
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;
  const eps = 1e-6;
  return ua > eps && ua < 1 - eps && ub >= 0 && ub <= 1;
}
function segmentIntersectsAABB(p1, p2, left, top, right, bottom) {
  const minX = Math.min(left, right);
  const maxX = Math.max(left, right);
  const minY = Math.min(top, bottom);
  const maxY = Math.max(top, bottom);
  if (p1.x < minX && p2.x < minX || p1.x > maxX && p2.x > maxX || p1.y < minY && p2.y < minY || p1.y > maxY && p2.y > maxY) {
    return false;
  }
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let t0 = 0;
  let t1 = 1;
  if (Math.abs(dx) < 1e-9) {
    if (p1.x < minX || p1.x > maxX) return false;
  } else {
    let tx1 = (minX - p1.x) / dx;
    let tx2 = (maxX - p1.x) / dx;
    if (tx1 > tx2) {
      const tmp = tx1;
      tx1 = tx2;
      tx2 = tmp;
    }
    t0 = Math.max(t0, tx1);
    t1 = Math.min(t1, tx2);
    if (t0 > t1) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (p1.y < minY || p1.y > maxY) return false;
  } else {
    let ty1 = (minY - p1.y) / dy;
    let ty2 = (maxY - p1.y) / dy;
    if (ty1 > ty2) {
      const tmp = ty1;
      ty1 = ty2;
      ty2 = tmp;
    }
    t0 = Math.max(t0, ty1);
    t1 = Math.min(t1, ty2);
    if (t0 > t1) return false;
  }
  const eps = 1e-5;
  return t1 > eps && t0 < 1 - eps;
}
function segmentIntersectsCircle(p1, p2, cx, cy, radius) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) {
    const distSq2 = (p1.x - cx) ** 2 + (p1.y - cy) ** 2;
    return distSq2 <= radius * radius;
  }
  let t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closeX = p1.x + t * dx;
  const closeY = p1.y + t * dy;
  const distSq = (closeX - cx) ** 2 + (closeY - cy) ** 2;
  const eps = 1e-5;
  return distSq <= radius * radius && t > eps && t < 1 - eps;
}
function rayIntersectsObstacle(p1, p2, obstacle) {
  if (!obstacle || typeof obstacle !== "object") return false;
  if (isDestroyed(obstacle)) return false;
  if (obstacle.blocksVision === false) return false;
  if (typeof obstacle.blocksLineOfSight === "function") {
    return obstacle.blocksLineOfSight(p1, p2);
  }
  if (typeof obstacle.intersectsRay === "function") {
    return obstacle.intersectsRay(p1, p2);
  }
  if (obstacle.start && obstacle.end) {
    return segmentIntersectsSegment(p1, p2, obstacle.start, obstacle.end);
  }
  if (Number.isFinite(obstacle.x1) && Number.isFinite(obstacle.y1) && Number.isFinite(obstacle.x2) && Number.isFinite(obstacle.y2)) {
    return segmentIntersectsSegment(
      p1,
      p2,
      { x: obstacle.x1, y: obstacle.y1 },
      { x: obstacle.x2, y: obstacle.y2 }
    );
  }
  if (Number.isFinite(obstacle.radius) && obstacle.radius > 0) {
    const center = obstacle.center ? extractPosition(obstacle.center) : extractPosition(obstacle);
    if (center) {
      return segmentIntersectsCircle(p1, p2, center.x, center.y, obstacle.radius);
    }
  }
  let bounds = null;
  if (typeof obstacle.getBounds === "function") {
    const pos = extractPosition(obstacle) || { x: 0, y: 0 };
    bounds = obstacle.getBounds(pos.x, pos.y);
  } else if (obstacle.bounds) {
    bounds = obstacle.bounds;
  } else if (obstacle.box) {
    bounds = obstacle.box;
  } else if (Number.isFinite(obstacle.left) && Number.isFinite(obstacle.right) && Number.isFinite(obstacle.top) && Number.isFinite(obstacle.bottom)) {
    bounds = obstacle;
  } else if (Number.isFinite(obstacle.width) && Number.isFinite(obstacle.height)) {
    const pos = extractPosition(obstacle) || { x: 0, y: 0 };
    bounds = {
      left: pos.x,
      top: pos.y,
      right: pos.x + obstacle.width,
      bottom: pos.y + obstacle.height
    };
  }
  if (bounds) {
    const left = bounds.left ?? bounds.x;
    const top = bounds.top ?? bounds.y;
    const right = bounds.right ?? (bounds.left !== void 0 ? bounds.right : left + (bounds.width ?? 0));
    const bottom = bounds.bottom ?? (bounds.top !== void 0 ? bounds.bottom : top + (bounds.height ?? 0));
    if (Number.isFinite(left) && Number.isFinite(top) && Number.isFinite(right) && Number.isFinite(bottom)) {
      return segmentIntersectsAABB(p1, p2, left, top, right, bottom);
    }
  }
  return false;
}
var PerceptionSystem = class {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.visionRange = config.visionRange ?? 200;
    this.fov = config.fov !== void 0 ? config.fov > 2 * Math.PI ? config.fov * Math.PI / 180 : config.fov : Math.PI * 0.5;
    this.hearingRadius = config.hearingRadius ?? config.alertRadius ?? 80;
    this.alertRadius = config.alertRadius ?? this.hearingRadius;
  }
  /**
   * Checks if line-of-sight from source to target is unobstructed by obstacles.
   * @param {Object} from
   * @param {Object} to
   * @param {Array} [obstacles]
   * @returns {boolean}
   */
  hasLineOfSight(from, to, obstacles = []) {
    const p1 = extractPosition(from);
    const p2 = extractPosition(to);
    if (!p1 || !p2) return false;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) return true;
    if (!Array.isArray(obstacles) || obstacles.length === 0) return true;
    for (const obstacle of obstacles) {
      if (!obstacle || obstacle === from || obstacle === to) continue;
      if (rayIntersectsObstacle(p1, p2, obstacle)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Checks if target is within observer's vision range.
   * @param {Object} observer
   * @param {Object} target
   * @returns {boolean}
   */
  isInVisionRange(observer, target) {
    const p1 = extractPosition(observer);
    const p2 = extractPosition(target);
    if (!p1 || !p2) return false;
    const maxRange = observer?.visionRange ?? observer?.sightRange ?? observer?.perceptionRadius ?? this.visionRange;
    const distSq = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    return distSq <= maxRange * maxRange;
  }
  /**
   * Checks if target is within observer's field of view (FOV) cone.
   * @param {Object} observer
   * @param {Object} target
   * @returns {boolean}
   */
  isInFov(observer, target) {
    const p1 = extractPosition(observer);
    const p2 = extractPosition(target);
    if (!p1 || !p2) return false;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) return true;
    let fov = observer?.fov ?? this.fov;
    if (fov > 2 * Math.PI) fov = fov * Math.PI / 180;
    if (fov >= 2 * Math.PI) return true;
    const facing = extractFacing(observer);
    const angle = Math.atan2(dy, dx);
    const diff = Math.abs(normalizeAngle2(angle - facing));
    return diff <= fov / 2 + 1e-6;
  }
  /**
   * Determines whether a candidate emits sound or alert signals.
   * @param {Object} candidate
   * @returns {boolean}
   */
  isAudibleCandidate(candidate) {
    if (!candidate || typeof candidate !== "object") return false;
    if (candidate.type === "sound" || candidate.type === "noise" || candidate.type === "audio") return true;
    if (candidate.isSound === true || candidate.isAudible === true || candidate.audible === true) return true;
    if (candidate.sound === true || typeof candidate.noise === "number" && candidate.noise > 0) return true;
    if (typeof candidate.soundRadius === "number" && candidate.soundRadius > 0) return true;
    if (candidate.type === "alert" || candidate.isAlert === true || candidate.alert === true) return true;
    if (candidate.audibleDanger === true || candidate.dangerSound === true) return true;
    return false;
  }
  /**
   * Checks if observer can see target (in range, in cone, and LOS unobstructed).
   * @param {Object} observer
   * @param {Object} target
   * @param {Array} [obstacles]
   * @returns {boolean}
   */
  canSee(observer, target, obstacles = []) {
    if (!observer || !target) return false;
    if (isDestroyed(target)) return false;
    if (!this.isInVisionRange(observer, target)) return false;
    if (!this.isInFov(observer, target)) return false;
    return this.hasLineOfSight(observer, target, obstacles);
  }
  /**
   * Checks if observer can hear target (within hearing/alert radius and emitting sound/alert).
   * @param {Object} observer
   * @param {Object} target
   * @returns {boolean}
   */
  canHear(observer, target) {
    if (!observer || !target) return false;
    if (isDestroyed(target)) return false;
    const p1 = extractPosition(observer);
    const p2 = extractPosition(target);
    if (!p1 || !p2) return false;
    const hearingRadius = observer?.hearingRadius ?? observer?.alertRadius ?? this.hearingRadius;
    const targetRadius = target?.soundRadius ?? target?.alertRadius ?? target?.radius ?? 0;
    const maxDist = hearingRadius + targetRadius;
    const distSq = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    if (distSq > maxDist * maxDist) return false;
    return this.isAudibleCandidate(target);
  }
  /**
   * Filters candidate entities, returning visible and audible candidates.
   * @param {Object} observer
   * @param {Array} candidates
   * @param {Array} [obstacles]
   * @param {Object} [options]
   * @returns {Array}
   */
  observe(observer, candidates = [], obstacles = [], options = {}) {
    if (!observer || !Array.isArray(candidates) || candidates.length === 0) {
      return [];
    }
    const visibleAudible = [];
    const observations = [];
    for (const candidate of candidates) {
      if (!candidate || isDestroyed(candidate)) continue;
      const visible = this.canSee(observer, candidate, obstacles);
      const audible = this.canHear(observer, candidate);
      if (visible || audible) {
        visibleAudible.push(candidate);
        const p1 = extractPosition(observer) || { x: 0, y: 0 };
        const p2 = extractPosition(candidate) || { x: 0, y: 0 };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        observations.push({
          target: candidate,
          candidate,
          visible,
          audible,
          sense: visible && audible ? "both" : visible ? "vision" : "hearing",
          distance: dist,
          angle,
          confidence: 1,
          timestamp: Date.now()
        });
      }
    }
    if (options.detailed === true) {
      return observations;
    }
    Object.defineProperty(visibleAudible, "observations", {
      value: observations,
      enumerable: false,
      configurable: true
    });
    return visibleAudible;
  }
};
var BoundedMemory = class {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.maxEntries = config.maxEntries ?? 10;
    this.decayRate = config.decayRate ?? 0.1;
    this.forgetThreshold = config.forgetThreshold ?? 0;
    this.defaultConfidence = config.defaultConfidence ?? 1;
    this._entries = /* @__PURE__ */ new Map();
    this._idCounter = 1;
  }
  get size() {
    return this._entries.size;
  }
  /**
   * Resolves a key for a target entity or id.
   * @param {Object|string|number} target
   * @returns {string|null}
   * @private
   */
  _getKey(target) {
    if (target === null || target === void 0) return null;
    if (typeof target === "string") return target;
    if (typeof target === "number") return String(target);
    if (typeof target === "object") {
      if (target.id !== void 0 && target.id !== null) return String(target.id);
      if (target.name !== void 0 && target.name !== null) return String(target.name);
      if (target.key !== void 0 && target.key !== null) return String(target.key);
      if (!target.__memoryId) {
        target.__memoryId = `mem_ent_${this._idCounter++}`;
      }
      return target.__memoryId;
    }
    return null;
  }
  /**
   * Evicts one entry from memory according to eviction rules:
   * 1. Destroyed/missing targets first.
   * 2. Lowest confidence entry.
   * 3. Oldest entry when confidence ties.
   * @private
   */
  _evictOne() {
    if (this._entries.size === 0) return;
    let candidateKey = null;
    let lowestConfidence = Infinity;
    let oldestTime = Infinity;
    for (const [key, entry] of this._entries) {
      if (isDestroyed(entry.target)) {
        candidateKey = key;
        break;
      }
      const conf = entry.confidence;
      const time = entry.lastSeen ?? entry.timestamp ?? 0;
      if (conf < lowestConfidence - 1e-4) {
        lowestConfidence = conf;
        oldestTime = time;
        candidateKey = key;
      } else if (Math.abs(conf - lowestConfidence) <= 1e-4) {
        if (time < oldestTime) {
          oldestTime = time;
          candidateKey = key;
        }
      }
    }
    if (candidateKey !== null) {
      this._entries.delete(candidateKey);
    } else {
      const firstKey = this._entries.keys().next().value;
      if (firstKey !== void 0) this._entries.delete(firstKey);
    }
  }
  /**
   * Removes all destroyed entities currently held in memory.
   * @returns {number}
   */
  pruneDestroyed() {
    const toDelete = [];
    for (const [key, entry] of this._entries) {
      if (isDestroyed(entry.target)) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this._entries.delete(key);
    }
    return toDelete.length;
  }
  /**
   * Records or refreshes an observation record in memory.
   * @param {Object|string} target
   * @param {Object} [options]
   * @returns {Object|null}
   */
  record(target, options = {}) {
    if (!target || isDestroyed(target)) return null;
    const key = this._getKey(target);
    if (!key) return null;
    const pos = extractPosition(options.position ?? target);
    const timestamp = options.timestamp ?? Date.now();
    const confidence = options.confidence ?? this.defaultConfidence;
    if (this._entries.has(key)) {
      const entry2 = this._entries.get(key);
      entry2.confidence = confidence;
      entry2.lastSeen = timestamp;
      entry2.timestamp = timestamp;
      if (pos) entry2.position = pos;
      entry2.target = target;
      entry2.entity = target;
      if (options.sense) entry2.sense = options.sense;
      if (options.data) entry2.data = { ...entry2.data, ...options.data };
      this._entries.delete(key);
      this._entries.set(key, entry2);
      return entry2;
    }
    this.pruneDestroyed();
    while (this._entries.size >= this.maxEntries) {
      this._evictOne();
    }
    const entry = {
      id: key,
      target,
      entity: target,
      position: pos ? { x: pos.x, y: pos.y } : null,
      confidence,
      lastSeen: timestamp,
      timestamp,
      sense: options.sense ?? "vision",
      decayRate: options.decayRate ?? this.decayRate,
      data: options.data ? { ...options.data } : {}
    };
    this._entries.set(key, entry);
    return entry;
  }
  /**
   * Alias for record.
   * @param {Object|string} target
   * @param {Object} [options]
   * @returns {Object|null}
   */
  remember(target, options = {}) {
    return this.record(target, options);
  }
  /**
   * Decays confidence over time and forgets expired entries.
   * @param {number} [deltaTime=1]
   */
  decay(deltaTime = 1) {
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;
    const toDelete = [];
    for (const [key, entry] of this._entries) {
      if (isDestroyed(entry.target)) {
        toDelete.push(key);
        continue;
      }
      const rate = entry.decayRate ?? this.decayRate;
      entry.confidence -= rate * deltaTime;
      if (entry.confidence <= this.forgetThreshold) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this._entries.delete(key);
    }
  }
  /**
   * Alias for decay.
   * @param {number} [deltaTime=1]
   */
  update(deltaTime = 1) {
    this.decay(deltaTime);
  }
  /**
   * Retrieves an entry for a target, handling destroyed and expired entities.
   * @param {Object|string} target
   * @returns {Object|null}
   */
  get(target) {
    if (!target) return null;
    const key = this._getKey(target);
    if (!key || !this._entries.has(key)) return null;
    const entry = this._entries.get(key);
    if (isDestroyed(entry.target) || entry.confidence <= this.forgetThreshold) {
      this._entries.delete(key);
      return null;
    }
    return entry;
  }
  /**
   * Returns true if target is remembered with valid confidence.
   * @param {Object|string} target
   * @returns {boolean}
   */
  has(target) {
    return this.get(target) !== null;
  }
  /**
   * Forgets a target immediately.
   * @param {Object|string} target
   * @returns {boolean}
   */
  forget(target) {
    if (!target) return false;
    const key = this._getKey(target);
    if (!key) return false;
    return this._entries.delete(key);
  }
  /**
   * Clears all memory records.
   */
  clear() {
    this._entries.clear();
  }
  /**
   * Returns all active, non-expired memory records.
   * @returns {Array}
   */
  values() {
    this.pruneDestroyed();
    const active = [];
    for (const entry of this._entries.values()) {
      if (!isDestroyed(entry.target) && entry.confidence > this.forgetThreshold) {
        active.push(entry);
      }
    }
    return active;
  }
  /**
   * Returns all active remembered entities.
   * @returns {Array}
   */
  getKnownTargets() {
    return this.values().map((e) => e.target).filter(Boolean);
  }
  /**
   * Serializes memory state for save game snapshot.
   * @returns {Object}
   */
  serialize() {
    this.pruneDestroyed();
    const entries = [];
    for (const entry of this._entries.values()) {
      entries.push({
        id: entry.id,
        targetId: entry.target?.id ?? entry.id,
        position: entry.position ? { x: entry.position.x, y: entry.position.y } : null,
        confidence: entry.confidence,
        lastSeen: entry.lastSeen,
        timestamp: entry.timestamp,
        sense: entry.sense,
        decayRate: entry.decayRate,
        data: entry.data ? structuredClone(entry.data) : {}
      });
    }
    return {
      maxEntries: this.maxEntries,
      decayRate: this.decayRate,
      forgetThreshold: this.forgetThreshold,
      defaultConfidence: this.defaultConfidence,
      entries
    };
  }
  /**
   * Restores memory state from a snapshot.
   * @param {Object} snapshot
   * @param {Function} [entityResolver]
   * @returns {BoundedMemory}
   */
  restore(snapshot, entityResolver = null) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new TypeError("Snapshot must be an object");
    }
    this.clear();
    if (Number.isFinite(snapshot.maxEntries)) this.maxEntries = snapshot.maxEntries;
    if (Number.isFinite(snapshot.decayRate)) this.decayRate = snapshot.decayRate;
    if (Number.isFinite(snapshot.forgetThreshold)) this.forgetThreshold = snapshot.forgetThreshold;
    if (Number.isFinite(snapshot.defaultConfidence)) this.defaultConfidence = snapshot.defaultConfidence;
    if (Array.isArray(snapshot.entries)) {
      for (const rec of snapshot.entries) {
        let target = null;
        if (typeof entityResolver === "function") {
          target = entityResolver(rec.targetId ?? rec.id);
        }
        if (!target) {
          target = { id: rec.targetId ?? rec.id, position: rec.position };
        }
        this._entries.set(rec.id, {
          id: rec.id,
          target,
          entity: target,
          position: rec.position ? { ...rec.position } : null,
          confidence: rec.confidence ?? this.defaultConfidence,
          lastSeen: rec.lastSeen ?? rec.timestamp ?? Date.now(),
          timestamp: rec.timestamp ?? rec.lastSeen ?? Date.now(),
          sense: rec.sense ?? "vision",
          decayRate: rec.decayRate ?? this.decayRate,
          data: rec.data ? structuredClone(rec.data) : {}
        });
      }
    }
    return this;
  }
  /**
   * JSON serialization support.
   * @returns {Object}
   */
  toJSON() {
    return this.serialize();
  }
};
var NPCKnowledge = class _NPCKnowledge extends Component {
  static ARCHETYPES = ARCHETYPES;
  /**
   * @param {string|Object} [archetypeOrConfig="patrol"]
   * @param {Object} [overrides={}]
   */
  constructor(archetypeOrConfig = "patrol", overrides = {}) {
    super();
    let archetype = "patrol";
    let config = {};
    if (typeof archetypeOrConfig === "string") {
      archetype = archetypeOrConfig;
      config = { ...overrides };
    } else if (archetypeOrConfig && typeof archetypeOrConfig === "object") {
      if (archetypeOrConfig instanceof Component || typeof archetypeOrConfig.AddComponent === "function") {
        this.entity = archetypeOrConfig;
        if (typeof overrides === "string") {
          archetype = overrides;
        } else if (typeof overrides === "object") {
          archetype = overrides.archetype ?? "patrol";
          config = { ...overrides };
        }
      } else {
        archetype = archetypeOrConfig.archetype ?? "patrol";
        config = { ...archetypeOrConfig, ...overrides };
      }
    }
    const baseProfile = _NPCKnowledge.ARCHETYPES[archetype] ?? _NPCKnowledge.ARCHETYPES.patrol;
    this.archetype = archetype in _NPCKnowledge.ARCHETYPES ? archetype : "custom";
    this.profile = { ...baseProfile, ...config };
    this.perception = new PerceptionSystem({
      visionRange: this.profile.visionRange,
      fov: this.profile.fov,
      hearingRadius: this.profile.hearingRadius,
      alertRadius: this.profile.alertRadius
    });
    this.memory = new BoundedMemory({
      maxEntries: this.profile.maxEntries,
      decayRate: this.profile.decayRate,
      forgetThreshold: this.profile.forgetThreshold ?? 0,
      defaultConfidence: this.profile.defaultConfidence ?? 1
    });
    this.facts = {};
    this.state = config.state ?? "idle";
  }
  /**
   * Performs observation on candidates and records visible/audible entities into memory.
   * @param {Array} [candidates=[]]
   * @param {Array} [obstacles=[]]
   * @param {Object} [observer=null]
   * @returns {Array}
   */
  observe(candidates = [], obstacles = [], observer = null) {
    const actor = observer ?? this.entity;
    const perceived = this.perception.observe(actor, candidates, obstacles);
    for (const cand of perceived) {
      this.memory.record(cand, {
        position: extractPosition(cand),
        timestamp: Date.now()
      });
    }
    return perceived;
  }
  /**
   * Updates NPC knowledge: decays memory confidence and optionally processes observations.
   * @param {number} [deltaTime=1]
   * @param {Array} [candidates=null]
   * @param {Array} [obstacles=null]
   * @param {Object} [observer=null]
   * @returns {Array}
   */
  update(deltaTime = 1, candidates = null, obstacles = null, observer = null) {
    this.memory.decay(deltaTime);
    if (candidates && Array.isArray(candidates)) {
      return this.observe(candidates, obstacles, observer);
    }
    return [];
  }
  /**
   * Records a target into memory.
   * @param {Object|string} target
   * @param {Object} [data={}]
   * @returns {Object|null}
   */
  remember(target, data = {}) {
    return this.memory.record(target, data);
  }
  /**
   * Forgets a target from memory.
   * @param {Object|string} target
   * @returns {boolean}
   */
  forget(target) {
    return this.memory.forget(target);
  }
  /**
   * Returns all remembered entities.
   * @returns {Array}
   */
  getKnownTargets() {
    return this.memory.getKnownTargets();
  }
  /**
   * Serializes NPCKnowledge for save game snapshots.
   * @returns {Object}
   */
  serialize() {
    return {
      archetype: this.archetype,
      state: this.state,
      facts: structuredClone(this.facts),
      profile: structuredClone(this.profile),
      perception: {
        visionRange: this.perception.visionRange,
        fov: this.perception.fov,
        hearingRadius: this.perception.hearingRadius,
        alertRadius: this.perception.alertRadius
      },
      memory: this.memory.serialize()
    };
  }
  /**
   * Restores NPCKnowledge from a serialized snapshot.
   * @param {Object} snapshot
   * @param {Function} [entityResolver]
   * @returns {NPCKnowledge}
   */
  restore(snapshot, entityResolver = null) {
    if (!snapshot || typeof snapshot !== "object") throw new TypeError("Snapshot must be an object");
    if (snapshot.archetype) {
      this.archetype = snapshot.archetype;
      const baseProfile = _NPCKnowledge.ARCHETYPES[this.archetype] ?? _NPCKnowledge.ARCHETYPES.patrol;
      this.profile = { ...baseProfile, ...snapshot.profile ?? {} };
    }
    if (snapshot.state !== void 0) this.state = snapshot.state;
    if (snapshot.facts) this.facts = structuredClone(snapshot.facts);
    if (snapshot.perception) {
      if (Number.isFinite(snapshot.perception.visionRange)) this.perception.visionRange = snapshot.perception.visionRange;
      if (Number.isFinite(snapshot.perception.fov)) this.perception.fov = snapshot.perception.fov;
      if (Number.isFinite(snapshot.perception.hearingRadius)) this.perception.hearingRadius = snapshot.perception.hearingRadius;
      if (Number.isFinite(snapshot.perception.alertRadius)) this.perception.alertRadius = snapshot.perception.alertRadius;
    }
    if (snapshot.memory) {
      this.memory.restore(snapshot.memory, entityResolver);
    }
    return this;
  }
  /**
   * Creates and restores an NPCKnowledge instance from a snapshot.
   * @param {Object} snapshot
   * @param {Function} [entityResolver]
   * @returns {NPCKnowledge}
   */
  static restore(snapshot, entityResolver = null) {
    const instance = new _NPCKnowledge(snapshot?.archetype ?? "patrol");
    instance.restore(snapshot, entityResolver);
    return instance;
  }
  /**
   * Populates the component properties from a data object during scene deserialization.
   * @param {Object} props
   */
  deserialize(props) {
    super.deserialize(props);
    if (props) {
      this.restore(props);
    }
  }
  /**
   * JSON serialization support.
   * @returns {Object}
   */
  toJSON() {
    return this.serialize();
  }
};

// src/larissa/utilityAI.js
init_component();
function clamp01(value) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
var UtilityCurves = Object.freeze({
  /**
   * Linear identity response: f(x) = x.
   * @param {number} x - Normalized input.
   * @returns {number}
   */
  linear(x) {
    return clamp01(x);
  },
  /**
   * Inverse linear response: f(x) = 1 - x.
   * @param {number} x - Normalized input.
   * @returns {number}
   */
  inverseLinear(x) {
    return clamp01(1 - clamp01(x));
  },
  /**
   * Quadratic response (accelerating / ease-in): f(x) = x^2.
   * @param {number} x - Normalized input.
   * @returns {number}
   */
  quadratic(x) {
    const c = clamp01(x);
    return c * c;
  },
  /**
   * Inverse quadratic response: f(x) = (1 - x)^2.
   * @param {number} x - Normalized input.
   * @returns {number}
   */
  inverseQuadratic(x) {
    const c = clamp01(1 - clamp01(x));
    return c * c;
  },
  /**
   * Exponential response: f(x) = x^exponent.
   * @param {number} x - Normalized input.
   * @param {number} [exponent=2] - Power exponent.
   * @returns {number}
   */
  exponential(x, exponent = 2) {
    const exp = Number.isFinite(exponent) ? exponent : 2;
    return clamp01(Math.pow(clamp01(x), exp));
  },
  /**
   * Logistic (sigmoidal) S-curve response.
   * @param {number} x - Normalized input.
   * @param {number} [steepness=10] - Curve steepness factor.
   * @param {number} [midpoint=0.5] - Inflection midpoint.
   * @returns {number}
   */
  logistic(x, steepness = 10, midpoint = 0.5) {
    const c = clamp01(x);
    const k = Number.isFinite(steepness) ? steepness : 10;
    const m = Number.isFinite(midpoint) ? midpoint : 0.5;
    const raw = 1 / (1 + Math.exp(-k * (c - m)));
    const low = 1 / (1 + Math.exp(k * m));
    const high = 1 / (1 + Math.exp(-k * (1 - m)));
    const range = high - low;
    if (range <= 0) return c;
    const normalized = (raw - low) / range;
    return clamp01(normalized);
  },
  /**
   * Smoothstep curve (Hermite interpolation): f(x) = 3x^2 - 2x^3.
   * @param {number} x - Normalized input.
   * @returns {number}
   */
  smoothstep(x) {
    const c = clamp01(x);
    return c * c * (3 - 2 * c);
  },
  /**
   * Binary step threshold response: 1 if x >= threshold, else 0.
   * @param {number} x - Normalized input.
   * @param {number} [threshold=0.5] - Activation threshold.
   * @returns {number}
   */
  step(x, threshold = 0.5) {
    return clamp01(x) >= threshold ? 1 : 0;
  },
  /**
   * Inverse binary step threshold response: 1 if x < threshold, else 0.
   * @param {number} x - Normalized input.
   * @param {number} [threshold=0.5] - Cutoff threshold.
   * @returns {number}
   */
  inverseStep(x, threshold = 0.5) {
    return clamp01(x) < threshold ? 1 : 0;
  }
});
var UtilityConsideration = class {
  /**
   * @param {Object} [config] - Consideration configuration.
   * @param {string} [config.id] - Consideration identifier.
   * @param {string} [config.name] - Alias for identifier.
   * @param {Function} [config.input] - Function extracting raw or normalized input from context.
   * @param {Function|string} [config.curve] - Curve function or curve name from UtilityCurves.
   * @param {Function} [config.evaluate] - Direct evaluation function returning a utility score (0..1).
   * @param {number} [config.weight=1.0] - Consideration weight multiplier.
   */
  constructor(config = {}) {
    this.id = config.id || config.name || "consideration";
    this.name = this.id;
    this.weight = Number.isFinite(config.weight) ? config.weight : 1;
    this.input = typeof config.input === "function" ? config.input : null;
    this.directEvaluate = typeof config.evaluate === "function" ? config.evaluate : null;
    if (typeof config.curve === "function") {
      this.curve = config.curve;
    } else if (typeof config.curve === "string" && UtilityCurves[config.curve]) {
      this.curve = UtilityCurves[config.curve];
    } else {
      this.curve = UtilityCurves.linear;
    }
  }
  /**
   * Evaluates this consideration against the given context.
   * @param {Object} context - Game context data.
   * @returns {Object} Result object containing id, rawInput, normalizedInput, and score.
   */
  evaluate(context) {
    if (this.directEvaluate) {
      const raw2 = this.directEvaluate(context);
      const num = Number.isFinite(raw2) ? raw2 : 0;
      const score = clamp01(num * this.weight);
      return {
        id: this.id,
        rawInput: num,
        normalizedInput: clamp01(num),
        score
      };
    }
    const raw = this.input ? this.input(context) : 0;
    const normalizedInput = clamp01(Number.isFinite(raw) ? raw : 0);
    const curved = this.curve(normalizedInput);
    const weighted = clamp01(curved * this.weight);
    return {
      id: this.id,
      rawInput: Number.isFinite(raw) ? raw : 0,
      normalizedInput,
      score: weighted
    };
  }
};
var UtilityAction = class {
  /**
   * @param {Object} config - Action configuration.
   * @param {string} config.id - Action identifier.
   * @param {number} [config.priority=0] - Deterministic tie-breaking and interruption priority.
   * @param {number} [config.weight=1.0] - Action utility weight multiplier.
   * @param {number} [config.threshold] - Action-specific minimum utility threshold.
   * @param {Array} [config.considerations=[]] - Considerations list.
   * @param {string} [config.compositeMode="multiplicative"] - "multiplicative" or "average".
   * @param {Function} [config.execute] - Execution function called when action is chosen.
   * @param {Function} [config.cleanup] - Cleanup function called when action ends or is interrupted.
   * @param {Function} [config.onInterrupt] - Callback called when action is interrupted.
   * @param {Function} [config.onExit] - Callback called on exit.
   * @param {Function} [config.update] - Per-tick update function while active.
   */
  constructor(config = {}) {
    if (!config || typeof config.id !== "string" || config.id.trim() === "") {
      throw new TypeError("UtilityAction requires a non-empty string id");
    }
    this.id = config.id.trim();
    this.priority = Number.isFinite(config.priority) ? config.priority : 0;
    this.weight = Number.isFinite(config.weight) ? config.weight : 1;
    this.threshold = Number.isFinite(config.threshold) ? config.threshold : null;
    this.compositeMode = config.compositeMode === "average" ? "average" : "multiplicative";
    this.execute = typeof config.execute === "function" ? config.execute : null;
    this.cleanup = typeof config.cleanup === "function" ? config.cleanup : null;
    this.onInterrupt = typeof config.onInterrupt === "function" ? config.onInterrupt : null;
    this.onExit = typeof config.onExit === "function" ? config.onExit : null;
    this.update = typeof config.update === "function" ? config.update : null;
    this.isActive = false;
    this.considerations = [];
    if (Array.isArray(config.considerations)) {
      for (const item of config.considerations) {
        this.addConsideration(item);
      }
    }
  }
  /**
   * Adds a consideration to this action.
   * @param {UtilityConsideration|Object|Function} consideration - Consideration instance or config.
   * @returns {UtilityAction} Self for chaining.
   */
  addConsideration(consideration) {
    if (!consideration) return this;
    if (consideration instanceof UtilityConsideration) {
      this.considerations.push(consideration);
    } else if (typeof consideration === "function") {
      this.considerations.push(new UtilityConsideration({
        id: `consideration_${this.considerations.length}`,
        evaluate: consideration
      }));
    } else if (typeof consideration === "object") {
      this.considerations.push(new UtilityConsideration(consideration));
    }
    return this;
  }
  /**
   * Evaluates all composite considerations for this action against context.
   * @param {Object} context - Game context data.
   * @returns {Object} Evaluation summary including composite utility score.
   */
  evaluate(context) {
    if (this.considerations.length === 0) {
      const rawScore = clamp01(this.weight);
      return {
        id: this.id,
        score: rawScore,
        priority: this.priority,
        threshold: this.threshold,
        considerations: []
      };
    }
    const evaluatedConsiderations = [];
    let composite = 1;
    let sum = 0;
    for (const consideration of this.considerations) {
      const result = consideration.evaluate(context);
      evaluatedConsiderations.push(result);
      composite *= result.score;
      sum += result.score;
    }
    let finalScore = 0;
    if (this.compositeMode === "average") {
      finalScore = clamp01(sum / this.considerations.length * this.weight);
    } else {
      finalScore = clamp01(composite * this.weight);
    }
    return {
      id: this.id,
      score: finalScore,
      priority: this.priority,
      threshold: this.threshold,
      considerations: evaluatedConsiderations
    };
  }
};
function extractHealthFraction(context) {
  if (!context || typeof context !== "object") return 1;
  if (Number.isFinite(context.healthFraction)) return clamp01(context.healthFraction);
  if (Number.isFinite(context.healthPercent)) {
    return clamp01(context.healthPercent <= 1 ? context.healthPercent : context.healthPercent / 100);
  }
  if (Number.isFinite(context.health) && Number.isFinite(context.maxHealth) && context.maxHealth > 0) {
    return clamp01(context.health / context.maxHealth);
  }
  if (context.stats && Number.isFinite(context.stats.health) && Number.isFinite(context.stats.maxHealth) && context.stats.maxHealth > 0) {
    return clamp01(context.stats.health / context.stats.maxHealth);
  }
  if (context.combatant && Number.isFinite(context.combatant.health) && Number.isFinite(context.combatant.maxHealth) && context.combatant.maxHealth > 0) {
    return clamp01(context.combatant.health / context.combatant.maxHealth);
  }
  if (Number.isFinite(context.health)) {
    return context.health <= 1 ? clamp01(context.health) : clamp01(context.health / 100);
  }
  return 1;
}
function extractDangerLevel(context) {
  if (!context || typeof context !== "object") return 0;
  if (Number.isFinite(context.dangerLevel)) return clamp01(context.dangerLevel);
  if (Number.isFinite(context.danger)) return clamp01(context.danger);
  if (context.inDanger === true) return 1;
  if (context.inDanger === false) return 0;
  if (Array.isArray(context.threats)) return context.threats.length > 0 ? 1 : 0;
  if (context.target) return 0.8;
  return 0;
}
function extractStaminaFraction(context) {
  if (!context || typeof context !== "object") return 1;
  if (Number.isFinite(context.staminaFraction)) return clamp01(context.staminaFraction);
  if (Number.isFinite(context.stamina) && Number.isFinite(context.maxStamina) && context.maxStamina > 0) {
    return clamp01(context.stamina / context.maxStamina);
  }
  if (Number.isFinite(context.stamina)) {
    return context.stamina <= 1 ? clamp01(context.stamina) : clamp01(context.stamina / 100);
  }
  if (Number.isFinite(context.energy)) {
    return context.energy <= 1 ? clamp01(context.energy) : clamp01(context.energy / 100);
  }
  return 1;
}
function extractRangeScore(context) {
  if (!context || typeof context !== "object") return 0;
  if (context.inAttackRange !== void 0) return context.inAttackRange ? 1 : 0;
  if (context.inRange !== void 0) return context.inRange ? 1 : 0;
  if (!context.target) return 0;
  const range = Number.isFinite(context.attackRange) && context.attackRange > 0 ? context.attackRange : 50;
  if (Number.isFinite(context.targetDistance)) {
    if (context.targetDistance <= range) return 1;
    if (context.targetDistance >= range * 2) return 0;
    return clamp01(1 - (context.targetDistance - range) / range);
  }
  const selfPos = context.actor?.position ?? context.entity?.transform?.position ?? context.position;
  const targetPos = context.target?.position ?? context.target?.transform?.position ?? (Number.isFinite(context.target?.x) ? context.target : null);
  if (selfPos && targetPos && Number.isFinite(selfPos.x) && Number.isFinite(selfPos.y) && Number.isFinite(targetPos.x) && Number.isFinite(targetPos.y)) {
    const dx = targetPos.x - selfPos.x;
    const dy = targetPos.y - selfPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= range) return 1;
    if (dist >= range * 2) return 0;
    return clamp01(1 - (dist - range) / range);
  }
  return 1;
}
function extractCanHeal(context) {
  if (!context || typeof context !== "object") return false;
  if (context.canHeal !== void 0) return Boolean(context.canHeal);
  if (Number.isFinite(context.potions)) return context.potions > 0;
  if (Number.isFinite(context.healCharges)) return context.healCharges > 0;
  if (Array.isArray(context.healingItems)) return context.healingItems.length > 0;
  return false;
}
function createDefaultActions(options = {}) {
  const flee = new UtilityAction({
    id: "flee",
    priority: 25,
    threshold: 0.15,
    execute: options.onFlee ?? ((ctx2) => typeof ctx2.onFlee === "function" ? ctx2.onFlee(ctx2) : null),
    cleanup: options.onFleeCleanup ?? ((ctx2, detail) => typeof ctx2.onFleeCleanup === "function" ? ctx2.onFleeCleanup(ctx2, detail) : null),
    considerations: [
      new UtilityConsideration({
        id: "low_health",
        input: (ctx2) => extractHealthFraction(ctx2),
        curve: UtilityCurves.inverseLinear
      }),
      new UtilityConsideration({
        id: "threat_presence",
        input: (ctx2) => extractDangerLevel(ctx2),
        curve: UtilityCurves.linear
      })
    ]
  });
  const heal = new UtilityAction({
    id: "heal",
    priority: 20,
    threshold: 0.15,
    execute: options.onHeal ?? ((ctx2) => typeof ctx2.onHeal === "function" ? ctx2.onHeal(ctx2) : null),
    cleanup: options.onHealCleanup ?? ((ctx2, detail) => typeof ctx2.onHealCleanup === "function" ? ctx2.onHealCleanup(ctx2, detail) : null),
    considerations: [
      new UtilityConsideration({
        id: "missing_health",
        input: (ctx2) => 1 - extractHealthFraction(ctx2),
        curve: UtilityCurves.linear
      }),
      new UtilityConsideration({
        id: "can_heal",
        input: (ctx2) => extractCanHeal(ctx2) ? 1 : 0,
        curve: UtilityCurves.linear
      })
    ]
  });
  const attack = new UtilityAction({
    id: "attack",
    priority: 15,
    threshold: 0.1,
    execute: options.onAttack ?? ((ctx2) => typeof ctx2.onAttack === "function" ? ctx2.onAttack(ctx2) : null),
    cleanup: options.onAttackCleanup ?? ((ctx2, detail) => typeof ctx2.onAttackCleanup === "function" ? ctx2.onAttackCleanup(ctx2, detail) : null),
    considerations: [
      new UtilityConsideration({
        id: "has_target",
        input: (ctx2) => ctx2.target ? 1 : 0,
        curve: UtilityCurves.linear
      }),
      new UtilityConsideration({
        id: "target_in_range",
        input: (ctx2) => extractRangeScore(ctx2),
        curve: UtilityCurves.linear
      }),
      new UtilityConsideration({
        id: "combat_readiness",
        input: (ctx2) => extractHealthFraction(ctx2),
        curve: UtilityCurves.linear
      })
    ]
  });
  const rest = new UtilityAction({
    id: "rest",
    priority: 10,
    threshold: 0.15,
    execute: options.onRest ?? ((ctx2) => typeof ctx2.onRest === "function" ? ctx2.onRest(ctx2) : null),
    cleanup: options.onRestCleanup ?? ((ctx2, detail) => typeof ctx2.onRestCleanup === "function" ? ctx2.onRestCleanup(ctx2, detail) : null),
    considerations: [
      new UtilityConsideration({
        id: "fatigue",
        input: (ctx2) => 1 - extractStaminaFraction(ctx2),
        curve: UtilityCurves.linear
      }),
      new UtilityConsideration({
        id: "safety",
        input: (ctx2) => 1 - extractDangerLevel(ctx2),
        curve: UtilityCurves.linear
      })
    ]
  });
  const patrol = new UtilityAction({
    id: "patrol",
    priority: 5,
    weight: 0.6,
    threshold: 0.1,
    execute: options.onPatrol ?? ((ctx2) => typeof ctx2.onPatrol === "function" ? ctx2.onPatrol(ctx2) : null),
    cleanup: options.onPatrolCleanup ?? ((ctx2, detail) => typeof ctx2.onPatrolCleanup === "function" ? ctx2.onPatrolCleanup(ctx2, detail) : null),
    considerations: [
      new UtilityConsideration({
        id: "calm_state",
        input: (ctx2) => 1 - extractDangerLevel(ctx2),
        curve: UtilityCurves.linear
      }),
      new UtilityConsideration({
        id: "stamina",
        input: (ctx2) => extractStaminaFraction(ctx2),
        curve: UtilityCurves.linear
      }),
      new UtilityConsideration({
        id: "health",
        input: (ctx2) => extractHealthFraction(ctx2),
        curve: UtilityCurves.linear
      })
    ]
  });
  return [flee, heal, attack, rest, patrol];
}
var UtilityAI = class extends Component {
  /**
   * @param {Object} [config] - Configuration options.
   * @param {Entity} [config.entity] - Entity attachment.
   * @param {Array} [config.actions] - Array of candidate actions.
   * @param {number} [config.defaultThreshold=0.1] - Default minimum utility threshold to execute an action.
   * @param {number} [config.maxTraces=100] - Maximum decision traces retained.
   * @param {boolean} [config.useDefaultActions=true] - Populate default actions (attack, flee, heal, patrol, rest) if none provided.
   * @param {Object} [config.context] - Default context object.
   * @param {Function} [config.contextProvider] - Context provider function (ai) => context.
   * @param {Function} [config.onActionChange] - Callback when active action changes.
   * @param {Function} [config.onActionInterrupted] - Callback when active action is interrupted.
   */
  constructor(config = {}) {
    super(config.entity ?? null);
    this.defaultThreshold = Number.isFinite(config.defaultThreshold) ? config.defaultThreshold : 0.1;
    this.maxTraces = Number.isFinite(config.maxTraces) ? Math.max(1, config.maxTraces) : 100;
    this.currentAction = null;
    this.lastInterruptedAction = null;
    this.actions = /* @__PURE__ */ new Map();
    this._decisionTraces = [];
    this.context = config.context ?? null;
    this.contextProvider = typeof config.contextProvider === "function" ? config.contextProvider : null;
    this.onActionChange = typeof config.onActionChange === "function" ? config.onActionChange : null;
    this.onActionInterrupted = typeof config.onActionInterrupted === "function" ? config.onActionInterrupted : null;
    if (Array.isArray(config.actions)) {
      for (const act of config.actions) {
        this.registerAction(act);
      }
    } else if (config.useDefaultActions !== false) {
      const defaults = createDefaultActions();
      for (const act of defaults) {
        this.registerAction(act);
      }
    }
  }
  /**
   * Current minimum score threshold to trigger an action.
   * @returns {number}
   */
  get threshold() {
    return this.defaultThreshold;
  }
  /**
   * @param {number} value
   */
  set threshold(value) {
    if (Number.isFinite(value)) {
      this.defaultThreshold = value;
    }
  }
  /**
   * Registers a candidate action.
   * @param {UtilityAction|Object} action - Action instance or configuration.
   * @returns {UtilityAction} Registered action instance.
   */
  registerAction(action) {
    if (!action) {
      throw new TypeError("Cannot register empty action");
    }
    const inst = action instanceof UtilityAction ? action : new UtilityAction(action);
    this.actions.set(inst.id, inst);
    return inst;
  }
  /**
   * Removes an action by identifier. Cleans up if currently active.
   * @param {string} actionId - Identifier of action to remove.
   * @param {Object} [context] - Context for cleanup.
   * @returns {boolean} True if removed.
   */
  removeAction(actionId, context = {}) {
    if (!this.actions.has(actionId)) return false;
    if (this.currentAction && this.currentAction.id === actionId) {
      this._cleanupActiveAction(context, {
        reason: "action_removed",
        details: `Action '${actionId}' was removed from UtilityAI`
      });
      this.currentAction = null;
    }
    return this.actions.delete(actionId);
  }
  /**
   * Retrieves an action by ID.
   * @param {string} actionId
   * @returns {UtilityAction|null}
   */
  getAction(actionId) {
    return this.actions.get(actionId) ?? null;
  }
  /**
   * Returns an array of all registered candidate actions.
   * @returns {UtilityAction[]}
   */
  getActions() {
    return Array.from(this.actions.values());
  }
  /**
   * Evaluates all candidate actions against context and returns winning decision.
   * Applies deterministic tie-breaking (priority then ID) and records a decision trace.
   * @param {Object} [context={}] - Context data.
   * @returns {Object} Evaluation result containing chosenAction, score, reason, trace, and candidateScores.
   */
  evaluate(context = {}) {
    const candidates = [];
    for (const action of this.actions.values()) {
      const result = action.evaluate(context);
      const actThreshold = action.threshold !== null && action.threshold !== void 0 ? action.threshold : this.defaultThreshold;
      candidates.push({
        action,
        id: action.id,
        score: result.score,
        priority: action.priority ?? 0,
        threshold: actThreshold,
        passedThreshold: result.score >= actThreshold && result.score > 0,
        considerations: result.considerations
      });
    }
    candidates.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 1e-6) {
        return scoreDiff;
      }
      const prioDiff = (b.priority ?? 0) - (a.priority ?? 0);
      if (prioDiff !== 0) {
        return prioDiff;
      }
      return String(a.id).localeCompare(String(b.id));
    });
    const best = candidates.length > 0 ? candidates[0] : null;
    const effectiveThreshold = best ? best.threshold : this.defaultThreshold;
    let chosenAction = null;
    let chosenScore = 0;
    let reason = "";
    if (!best) {
      reason = "No candidate actions registered.";
    } else if (best.score < effectiveThreshold || best.score <= 0) {
      reason = `All candidates scored below threshold (${effectiveThreshold.toFixed(4)}). Highest was '${best.id}' with score ${best.score.toFixed(4)}.`;
    } else {
      chosenAction = best.action;
      chosenScore = best.score;
      const second = candidates[1];
      if (second && Math.abs(best.score - second.score) <= 1e-6) {
        if ((best.priority ?? 0) !== (second.priority ?? 0)) {
          reason = `Action '${best.id}' selected with score ${best.score.toFixed(4)}; broke tie with '${second.id}' by priority (${best.priority} > ${second.priority})`;
        } else {
          reason = `Action '${best.id}' selected with score ${best.score.toFixed(4)}; broke tie with '${second.id}' by ID`;
        }
      } else {
        reason = `Action '${best.id}' selected with highest utility score ${best.score.toFixed(4)} (threshold: ${effectiveThreshold.toFixed(4)})`;
      }
    }
    const trace = {
      timestamp: this._getNow(),
      chosenAction: chosenAction ? chosenAction.id : null,
      chosenScore,
      reason,
      threshold: effectiveThreshold,
      interruptedAction: null,
      candidates: candidates.map((c) => ({
        id: c.id,
        score: c.score,
        priority: c.priority,
        threshold: c.threshold,
        passedThreshold: c.passedThreshold,
        considerations: c.considerations
      }))
    };
    this._recordTrace(trace);
    return {
      chosenAction,
      score: chosenScore,
      reason,
      trace,
      candidateScores: trace.candidates
    };
  }
  /**
   * Evaluates candidates and executes the highest-scoring action.
   * Cleans up superseded or active action states if interrupted or changed.
   * @param {Object} [context={}] - Context data.
   * @returns {Object} Result object with chosenAction, score, executed, result, and evaluation.
   */
  evaluateAndExecute(context = {}) {
    const evaluation = this.evaluate(context);
    const { chosenAction } = evaluation;
    if (!chosenAction) {
      if (this.currentAction) {
        this._cleanupActiveAction(context, {
          reason: "threshold_not_met",
          details: "All candidate actions scored below threshold"
        });
        this.currentAction = null;
      }
      return {
        chosenAction: null,
        score: 0,
        executed: false,
        result: null,
        evaluation
      };
    }
    const previousAction = this.currentAction;
    if (this.currentAction && this.currentAction.id !== chosenAction.id) {
      this._cleanupActiveAction(context, {
        reason: "interrupted",
        supersededBy: chosenAction.id,
        details: `Interrupted by higher-scoring action '${chosenAction.id}'`
      });
    }
    this.currentAction = chosenAction;
    chosenAction.isActive = true;
    let result = null;
    if (typeof chosenAction.execute === "function") {
      try {
        result = chosenAction.execute(context);
      } catch (err) {
        console.error(`Error executing action '${chosenAction.id}':`, err);
      }
    }
    if (this.onActionChange && (!previousAction || previousAction.id !== chosenAction.id)) {
      try {
        this.onActionChange(chosenAction, previousAction, context);
      } catch (err) {
        console.error("Error in onActionChange callback:", err);
      }
    }
    return {
      chosenAction,
      score: evaluation.score,
      executed: true,
      result,
      evaluation
    };
  }
  /**
   * Explicitly interrupts the currently active action with cleanup.
   * @param {string|Object} [reason="interrupted"] - Reason for interruption.
   * @param {Object} [context={}] - Context data.
   * @returns {boolean} True if an active action was interrupted.
   */
  interrupt(reason = "interrupted", context = {}) {
    if (!this.currentAction) return false;
    const interrupted = this.currentAction;
    const reasonStr = typeof reason === "string" ? reason : "interrupted";
    this._cleanupActiveAction(context, {
      reason: reasonStr,
      details: reason
    });
    this.currentAction = null;
    if (typeof this.onActionInterrupted === "function") {
      try {
        this.onActionInterrupted(interrupted, reason, context);
      } catch (err) {
        console.error("Error in onActionInterrupted callback:", err);
      }
    }
    this._recordTrace({
      timestamp: this._getNow(),
      chosenAction: null,
      chosenScore: 0,
      reason: `Active action '${interrupted.id}' interrupted: ${reasonStr}`,
      threshold: this.defaultThreshold,
      interruptedAction: interrupted.id,
      candidates: []
    });
    return true;
  }
  /**
   * Cleans up the active action.
   * @private
   * @param {Object} context - Game context.
   * @param {Object} detail - Detail payload for cleanup.
   */
  _cleanupActiveAction(context, detail) {
    const action = this.currentAction;
    if (!action) return;
    action.isActive = false;
    this.lastInterruptedAction = {
      actionId: action.id,
      detail,
      timestamp: this._getNow()
    };
    if (typeof action.cleanup === "function") {
      try {
        action.cleanup(context, detail);
      } catch (err) {
        console.error(`Error in cleanup for action '${action.id}':`, err);
      }
    }
    if (typeof action.onInterrupt === "function") {
      try {
        action.onInterrupt(context, detail);
      } catch (err) {
        console.error(`Error in onInterrupt for action '${action.id}':`, err);
      }
    }
    if (typeof action.onExit === "function") {
      try {
        action.onExit(context, detail);
      } catch (err) {
        console.error(`Error in onExit for action '${action.id}':`, err);
      }
    }
  }
  /**
   * Returns a copy of recorded decision traces.
   * @returns {Object[]} Array of decision traces.
   */
  getDecisionTraces() {
    return this._decisionTraces.map((t) => ({
      ...t,
      candidates: Array.isArray(t.candidates) ? t.candidates.map((c) => ({ ...c })) : []
    }));
  }
  /**
   * Clears all recorded decision traces.
   */
  clearTraces() {
    this._decisionTraces = [];
  }
  /**
   * Returns the most recent decision trace, or null if empty.
   * @returns {Object|null}
   */
  getLastDecisionTrace() {
    if (this._decisionTraces.length === 0) return null;
    return this._decisionTraces[this._decisionTraces.length - 1];
  }
  /**
   * Resolves the current context for evaluation.
   * @returns {Object}
   */
  getContext() {
    let ctx2 = {};
    if (typeof this.contextProvider === "function") {
      ctx2 = this.contextProvider(this) ?? {};
    } else if (this.context && typeof this.context === "object") {
      ctx2 = { ...this.context };
    }
    if (this.entity && !ctx2.entity) {
      ctx2.entity = this.entity;
    }
    return ctx2;
  }
  /**
   * Updates the UtilityAI component for a game loop tick.
   * @param {number} [deltaTime=0] - Delta time in seconds.
   * @param {Object} [overrideContext] - Optional context override.
   * @returns {Object} Result of evaluateAndExecute.
   */
  update(deltaTime = 0, overrideContext = null) {
    const context = overrideContext ?? this.getContext();
    context.deltaTime = deltaTime;
    if (this.currentAction && typeof this.currentAction.update === "function") {
      try {
        this.currentAction.update(context, deltaTime);
      } catch (err) {
        console.error(`Error in update for action '${this.currentAction.id}':`, err);
      }
    }
    return this.evaluateAndExecute(context);
  }
  /**
   * Records a decision trace into the bounded history.
   * @private
   * @param {Object} trace
   * @returns {Object}
   */
  _recordTrace(trace) {
    this._decisionTraces.push(trace);
    if (this._decisionTraces.length > this.maxTraces) {
      this._decisionTraces.shift();
    }
    return trace;
  }
  /**
   * Gets current high-resolution timestamp.
   * @private
   * @returns {number}
   */
  _getNow() {
    return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
  }
};
UtilityAI.Curves = UtilityCurves;
UtilityAI.Action = UtilityAction;
UtilityAI.Consideration = UtilityConsideration;
UtilityAI.createDefaultActions = createDefaultActions;
UtilityAI.clamp01 = clamp01;

// src/larissa/npcSchedules.js
init_component();
var ROUTINE_ACTIVITIES = Object.freeze({
  WORK: "work",
  REST: "rest",
  PATROL: "patrol",
  SLEEP: "sleep",
  WANDER: "wander",
  IDLE: "idle",
  ALERT: "alert",
  FLEE: "flee",
  COMBAT: "combat"
});
var FACTION_DISPOSITION = Object.freeze({
  FRIENDLY: "friendly",
  NEUTRAL: "neutral",
  HOSTILE: "hostile"
});
function parseHour(time) {
  if (typeof time === "number") {
    if (!Number.isFinite(time)) {
      throw new TypeError("Time number must be finite");
    }
    return (time % 24 + 24) % 24;
  }
  if (typeof time === "string") {
    const str = time.trim();
    if (str.includes(":")) {
      const parts = str.split(":");
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1] || "0");
      const seconds = parseFloat(parts[2] || "0");
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const totalHours = hours + minutes / 60 + seconds / 3600;
        return (totalHours % 24 + 24) % 24;
      }
    }
    const parsed = parseFloat(str);
    if (Number.isFinite(parsed)) {
      return (parsed % 24 + 24) % 24;
    }
  }
  if (time && typeof time === "object") {
    if (Number.isFinite(time.hour)) {
      const extra = Number.isFinite(time.minute) ? time.minute / 60 : 0;
      return ((time.hour + extra) % 24 + 24) % 24;
    }
    if (time.calendar && Number.isFinite(time.calendar.minuteOfDay)) {
      return time.calendar.minuteOfDay / 60 % 24;
    }
    if (Number.isFinite(time.minute) && Number.isFinite(time.minutesPerDay) && time.minutesPerDay > 0) {
      const minuteOfDay = time.minute % time.minutesPerDay;
      return (minuteOfDay / (time.minutesPerDay / 24) % 24 + 24) % 24;
    }
  }
  throw new TypeError(`Unable to parse time: ${time}`);
}
function isHourInSlot(hour, start, end) {
  const h = (hour % 24 + 24) % 24;
  const s = (start % 24 + 24) % 24;
  const e = (end % 24 + 24) % 24;
  if (s === e) {
    return true;
  }
  if (s < e) {
    return h >= s && h < e;
  }
  return h >= s || h < e;
}
function getPointKey(point) {
  if (point === null || point === void 0) return null;
  if (typeof point === "string" || typeof point === "number") return String(point);
  if (typeof point === "object") {
    if (point.id !== void 0 && point.id !== null) return String(point.id);
    if (point.name !== void 0 && point.name !== null) return String(point.name);
    if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
      return `pt_${point.x}_${point.y}`;
    }
  }
  return String(point);
}
var ScheduleSlot = class _ScheduleSlot {
  static _nextId = 1;
  /**
   * @param {Object} config - Configuration object.
   * @param {number|string} config.start - Start time (hour 0-24 or "HH:MM").
   * @param {number|string} config.end - End time (hour 0-24 or "HH:MM").
   * @param {string} [config.activity="idle"] - Scheduled activity.
   * @param {Object|string} [config.destination=null] - Primary destination point.
   * @param {Array} [config.fallbacks=[]] - Alternate destination points if primary is occupied.
   * @param {Object|string} [config.fallbackDestination=null] - Single fallback point shorthand.
   * @param {string} [config.fallbackActivity="idle"] - Activity if all destinations are occupied.
   * @param {string} [config.id] - Optional identifier for the slot.
   * @param {number} [config.priority=0] - Priority for overlapping slots (higher wins).
   * @param {boolean} [config.isAppointment=false] - Whether this slot represents an appointment.
   * @param {Function} [config.onEnter=null] - Lifecycle callback when slot becomes active.
   * @param {Function} [config.onExit=null] - Lifecycle callback when slot ends.
   * @param {Object} [config.data={}] - Additional custom metadata.
   */
  constructor(config = {}) {
    if (!config || typeof config !== "object") {
      throw new TypeError("ScheduleSlot configuration must be an object");
    }
    if (config.start === void 0 || config.end === void 0) {
      throw new TypeError("ScheduleSlot requires start and end times");
    }
    this.id = config.id || `slot-${_ScheduleSlot._nextId++}`;
    this.start = parseHour(config.start);
    this.end = parseHour(config.end);
    this.activity = config.activity || ROUTINE_ACTIVITIES.IDLE;
    this.destination = config.destination || null;
    const fallbacks = [];
    if (Array.isArray(config.fallbacks)) {
      fallbacks.push(...config.fallbacks);
    }
    if (config.fallbackDestination && !fallbacks.includes(config.fallbackDestination)) {
      fallbacks.push(config.fallbackDestination);
    }
    this.fallbacks = fallbacks;
    this.fallbackActivity = config.fallbackActivity || ROUTINE_ACTIVITIES.IDLE;
    this.priority = Number.isFinite(config.priority) ? config.priority : 0;
    this.isAppointment = Boolean(config.isAppointment);
    this.onEnter = typeof config.onEnter === "function" ? config.onEnter : null;
    this.onExit = typeof config.onExit === "function" ? config.onExit : null;
    this.data = config.data ? { ...config.data } : {};
  }
  /**
   * Whether this slot wraps around midnight (e.g. 22:00 to 06:00).
   * @returns {boolean}
   */
  get wrapsMidnight() {
    return this.start > this.end;
  }
  /**
   * Duration in hours of this slot.
   * @returns {number}
   */
  get duration() {
    if (this.start === this.end) return 24;
    if (this.start < this.end) return this.end - this.start;
    return 24 - this.start + this.end;
  }
  /**
   * Checks if this slot is active at the given game hour.
   * @param {number|string} hour - Hour to test.
   * @returns {boolean}
   */
  isActive(hour) {
    const h = parseHour(hour);
    return isHourInSlot(h, this.start, this.end);
  }
};
var NPCSchedule = class _NPCSchedule extends Component {
  static _nextId = 1;
  /**
   * @param {Object} [config={}] - Configuration options.
   * @param {string} [config.id] - Unique NPC identifier.
   * @param {Array} [config.slots=[]] - Initial schedule slots.
   * @param {string} [config.defaultActivity="idle"] - Fallback activity when no slot matches.
   * @param {number|string} [config.initialHour=0] - Initial game hour.
   * @param {string} [config.faction="neutral"] - NPC faction affiliation.
   * @param {ScheduleSystem} [config.system=null] - Reference to parent ScheduleSystem.
   * @param {Entity} [config.entity=null] - Neptune Entity this component attaches to.
   */
  constructor(config = {}) {
    super(config.entity || null);
    this.id = config.id || `npc-${_NPCSchedule._nextId++}`;
    this.slots = [];
    this.defaultActivity = config.defaultActivity || ROUTINE_ACTIVITIES.IDLE;
    this.currentHour = config.initialHour !== void 0 ? parseHour(config.initialHour) : 0;
    this.currentSlot = null;
    this.currentActivity = this.defaultActivity;
    this.currentDestination = null;
    this.destinationStatus = "none";
    this.claimedPoint = null;
    this.inDanger = false;
    this.dangerData = null;
    this.suspendedState = null;
    this.missedAppointments = [];
    this.faction = config.faction || "neutral";
    this.system = config.system || null;
    if (Array.isArray(config.slots)) {
      for (const slot of config.slots) {
        this.addSlot(slot);
      }
    }
  }
  /**
   * Whether schedule execution is currently suspended due to danger.
   * @returns {boolean}
   */
  get isSuspended() {
    return this.inDanger;
  }
  /**
   * Whether NPC is currently in danger.
   * @returns {boolean}
   */
  get isInDanger() {
    return this.inDanger;
  }
  /**
   * Adds a schedule slot to this NPC's routine.
   * @param {ScheduleSlot|Object} slot - Slot instance or config object.
   * @returns {ScheduleSlot} The added slot.
   */
  addSlot(slot) {
    const instance = slot instanceof ScheduleSlot ? slot : new ScheduleSlot(slot);
    this.slots.push(instance);
    this.slots.sort((a, b) => b.priority - a.priority);
    return instance;
  }
  /**
   * Removes a slot by its identifier.
   * @param {string} slotId - Identifier of slot to remove.
   * @returns {boolean} True if removed.
   */
  removeSlot(slotId) {
    const index = this.slots.findIndex((s) => s.id === slotId);
    if (index >= 0) {
      this.slots.splice(index, 1);
      return true;
    }
    return false;
  }
  /**
   * Finds the matching slot for a given hour based on priority and time interval.
   * @param {number|string} hour - Game hour.
   * @returns {ScheduleSlot|null} Matching slot or null.
   */
  getSlotForHour(hour) {
    const h = parseHour(hour);
    for (const slot of this.slots) {
      if (slot.isActive(h)) {
        return slot;
      }
    }
    return null;
  }
  /**
   * Updates the NPC schedule to the given hour.
   * Handles slot transitions, danger suspension, and destination fallback.
   * @param {number|string|Object} time - Current game hour or clock.
   * @returns {string} Current activity.
   */
  update(time) {
    const previousHour = this.currentHour;
    const h = parseHour(time);
    this.currentHour = h;
    if (this.inDanger) {
      this._checkMissedAppointments(previousHour, h);
      return this.currentActivity;
    }
    const nextSlot = this.getSlotForHour(h);
    const slotChanged = nextSlot !== this.currentSlot;
    if (slotChanged) {
      if (this.currentSlot && typeof this.currentSlot.onExit === "function") {
        this.currentSlot.onExit(this, this.currentSlot);
      }
      this._releaseClaimedPoint();
      const previousSlot = this.currentSlot;
      this.currentSlot = nextSlot;
      if (nextSlot) {
        this.currentActivity = nextSlot.activity;
        this._resolveAndClaimDestination(nextSlot);
        if (typeof nextSlot.onEnter === "function") {
          nextSlot.onEnter(this, nextSlot);
        }
      } else {
        this.currentActivity = this.defaultActivity;
        this.currentDestination = null;
        this.destinationStatus = "none";
      }
      if (this.system && typeof this.system.emit === "function") {
        this.system.emit("transition", {
          npcId: this.id,
          previousSlot,
          currentSlot: nextSlot,
          hour: h
        });
      }
    } else if (this.currentSlot && (this.destinationStatus === "none" || this.destinationStatus === "all_occupied")) {
      this._resolveAndClaimDestination(this.currentSlot);
    }
    return this.currentActivity;
  }
  /**
   * Suspends normal schedule execution in reaction to perceived danger.
   * @param {Object} [dangerData={}] - Details of the perceived threat.
   * @returns {NPCSchedule} This instance.
   */
  triggerDanger(dangerData = {}) {
    if (this.inDanger) {
      this.dangerData = { ...this.dangerData, ...dangerData };
      return this;
    }
    this.inDanger = true;
    this.dangerData = { ...dangerData };
    this.suspendedState = {
      slot: this.currentSlot,
      activity: this.currentActivity,
      destination: this.currentDestination,
      claimedPoint: this.claimedPoint,
      hour: this.currentHour
    };
    if (dangerData.vacatePoint !== false) {
      this._releaseClaimedPoint();
    }
    this.currentActivity = dangerData.activity || ROUTINE_ACTIVITIES.FLEE;
    this.currentDestination = dangerData.destination || null;
    this.destinationStatus = "danger";
    if (this.system && typeof this.system.emit === "function") {
      this.system.emit("danger_interrupted", {
        npcId: this.id,
        dangerData,
        hour: this.currentHour
      });
    }
    return this;
  }
  /**
   * Resolves the danger condition and resumes scheduled activity.
   * Evaluates current hour and seamlessly picks up the appropriate schedule slot.
   * @param {Object} [options={}] - Resumption options.
   * @returns {string} Resumed activity.
   */
  resolveDanger(options = {}) {
    if (!this.inDanger) {
      return this.currentActivity;
    }
    this.inDanger = false;
    const dangerData = this.dangerData;
    this.dangerData = null;
    const effectiveHour = options.hour !== void 0 ? parseHour(options.hour) : this.currentHour;
    this.currentHour = effectiveHour;
    const activeSlot = this.getSlotForHour(effectiveHour);
    this.currentSlot = activeSlot;
    if (activeSlot) {
      this.currentActivity = activeSlot.activity;
      this._resolveAndClaimDestination(activeSlot);
    } else {
      this.currentActivity = this.defaultActivity;
      this.currentDestination = null;
      this.destinationStatus = "none";
    }
    if (this.system && typeof this.system.emit === "function") {
      this.system.emit("danger_resolved", {
        npcId: this.id,
        resumedSlot: activeSlot,
        activity: this.currentActivity,
        hour: effectiveHour,
        dangerData
      });
    }
    return this.currentActivity;
  }
  /**
   * Resolves destination for a slot, falling back gracefully if points are occupied.
   * @private
   * @param {ScheduleSlot} slot - Active slot.
   */
  _resolveAndClaimDestination(slot) {
    if (!slot) return;
    const candidates = [];
    if (slot.destination) {
      candidates.push({ point: slot.destination, isPrimary: true });
    }
    if (Array.isArray(slot.fallbacks)) {
      for (const fb of slot.fallbacks) {
        if (fb) candidates.push({ point: fb, isPrimary: false });
      }
    }
    if (candidates.length === 0) {
      this.currentDestination = null;
      this.destinationStatus = "none";
      return;
    }
    for (const candidate of candidates) {
      const isOccupied = this._isPointOccupied(candidate.point);
      if (!isOccupied) {
        const claimed = this._claimPoint(candidate.point);
        if (claimed) {
          this.currentDestination = candidate.point;
          this.claimedPoint = candidate.point;
          this.destinationStatus = candidate.isPrimary ? "primary" : "fallback";
          this.currentActivity = slot.activity;
          return;
        }
      }
    }
    this.currentDestination = null;
    this.claimedPoint = null;
    this.destinationStatus = "all_occupied";
    if (slot.fallbackActivity) {
      this.currentActivity = slot.fallbackActivity;
    }
    if (this.system && typeof this.system.emit === "function") {
      this.system.emit("occupied_fallback", {
        npcId: this.id,
        slot,
        status: "all_occupied",
        fallbackActivity: this.currentActivity
      });
    }
  }
  /**
   * Checks if a point is occupied, delegating to parent ScheduleSystem if present.
   * @private
   * @param {Object|string} point
   * @returns {boolean}
   */
  _isPointOccupied(point) {
    if (!point) return false;
    if (this.system && typeof this.system.isPointOccupied === "function") {
      return this.system.isPointOccupied(point, this.id);
    }
    if (typeof point === "object" && point.occupied === true) {
      return true;
    }
    return false;
  }
  /**
   * Claims a destination point, delegating to parent ScheduleSystem if present.
   * @private
   * @param {Object|string} point
   * @returns {boolean} True if successfully claimed.
   */
  _claimPoint(point) {
    if (!point) return false;
    if (this.system && typeof this.system.occupyPoint === "function") {
      return this.system.occupyPoint(point, this.id);
    }
    if (typeof point === "object") {
      point.occupied = true;
    }
    return true;
  }
  /**
   * Releases currently claimed destination point.
   * @private
   */
  _releaseClaimedPoint() {
    if (!this.claimedPoint) return;
    if (this.system && typeof this.system.vacatePoint === "function") {
      this.system.vacatePoint(this.claimedPoint, this.id);
    } else if (typeof this.claimedPoint === "object") {
      this.claimedPoint.occupied = false;
    }
    this.claimedPoint = null;
  }
  /**
   * Checks for any scheduled appointments that were missed between previous and current hour.
   * @private
   * @param {number} fromHour
   * @param {number} toHour
   */
  _checkMissedAppointments(fromHour, toHour) {
    for (const slot of this.slots) {
      if (slot.isAppointment) {
        if (isHourInSlot(slot.start, fromHour, toHour)) {
          const alreadyRecorded = this.missedAppointments.some((m) => m.slot.id === slot.id && m.hour === slot.start);
          if (!alreadyRecorded) {
            const record = {
              slot,
              hour: slot.start,
              reason: this.inDanger ? "danger" : "interrupted",
              timestamp: Date.now()
            };
            this.missedAppointments.push(record);
            if (this.system && typeof this.system.emit === "function") {
              this.system.emit("missed_appointment", {
                npcId: this.id,
                ...record
              });
            }
          }
        }
      }
    }
  }
};
var ScheduleSystem = class {
  /**
   * @param {Object} [config={}] - System configuration.
   * @param {Object} [config.clock=null] - Optional GameClock instance.
   * @param {Array} [config.slots=null] - Initial slots for default single-NPC routine.
   * @param {string} [config.defaultActivity="idle"] - Default fallback activity.
   * @param {number|string} [config.initialHour=0] - Initial game hour.
   */
  constructor(config = {}) {
    this.clock = config.clock || null;
    this.defaultActivity = config.defaultActivity || ROUTINE_ACTIVITIES.IDLE;
    this.currentHour = config.initialHour !== void 0 ? parseHour(config.initialHour) : 0;
    this.schedules = /* @__PURE__ */ new Map();
    this._occupiedPoints = /* @__PURE__ */ new Map();
    this._listeners = /* @__PURE__ */ new Map();
    if (Array.isArray(config.slots) && config.slots.length > 0) {
      this.registerNPC("default", {
        slots: config.slots,
        defaultActivity: this.defaultActivity,
        initialHour: this.currentHour
      });
    }
  }
  /**
   * Subscribes a listener to a system event.
   * @param {string} event - Event name.
   * @param {Function} callback - Callback function.
   * @returns {ScheduleSystem} This instance.
   */
  on(event, callback) {
    if (typeof callback !== "function") return this;
    if (!this._listeners.has(event)) {
      this._listeners.set(event, /* @__PURE__ */ new Set());
    }
    this._listeners.get(event).add(callback);
    return this;
  }
  /**
   * Unsubscribes a listener from a system event.
   * @param {string} event - Event name.
   * @param {Function} callback - Callback function.
   * @returns {ScheduleSystem} This instance.
   */
  off(event, callback) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
    return this;
  }
  /**
   * Emits a system event to registered listeners.
   * @param {string} event - Event name.
   * @param {Object} data - Payload data.
   */
  emit(event, data) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in ScheduleSystem event listener (${event}):`, err);
        }
      }
    }
  }
  /**
   * Registers an NPC routine with the schedule system.
   * @param {string} npcId - Unique identifier for the NPC.
   * @param {Object|Array|NPCSchedule} config - Schedule configuration or slots array.
   * @returns {NPCSchedule} Registered schedule.
   */
  registerNPC(npcId, config = {}) {
    if (!npcId || typeof npcId !== "string") {
      throw new TypeError("registerNPC requires a non-empty string npcId");
    }
    let schedule2;
    if (config instanceof NPCSchedule) {
      schedule2 = config;
      schedule2.id = npcId;
      schedule2.system = this;
    } else if (Array.isArray(config)) {
      schedule2 = new NPCSchedule({
        id: npcId,
        slots: config,
        defaultActivity: this.defaultActivity,
        initialHour: this.currentHour,
        system: this
      });
    } else {
      const initialHour = config.initialHour !== void 0 ? parseHour(config.initialHour) : this.currentHour;
      schedule2 = new NPCSchedule({
        id: npcId,
        defaultActivity: this.defaultActivity,
        system: this,
        ...config,
        initialHour
      });
    }
    this.schedules.set(npcId, schedule2);
    schedule2.update(schedule2.currentHour);
    return schedule2;
  }
  /**
   * Unregisters an NPC routine and frees its claimed points.
   * @param {string} npcId - NPC identifier.
   * @returns {boolean} True if removed.
   */
  unregisterNPC(npcId) {
    this.vacateAllForNPC(npcId);
    return this.schedules.delete(npcId);
  }
  /**
   * Gets the schedule instance for an NPC.
   * @param {string} [npcId="default"] - NPC identifier.
   * @returns {NPCSchedule|null}
   */
  getSchedule(npcId = "default") {
    return this.schedules.get(npcId) || null;
  }
  /**
   * Adds a schedule slot to the default or specified NPC routine.
   * @param {Object|ScheduleSlot} slot - Slot configuration.
   * @param {string} [npcId="default"] - Target NPC identifier.
   * @returns {ScheduleSlot}
   */
  addSlot(slot, npcId = "default") {
    let schedule2 = this.getSchedule(npcId);
    if (!schedule2) {
      schedule2 = this.registerNPC(npcId);
    }
    return schedule2.addSlot(slot);
  }
  /**
   * Updates time across all registered NPC schedules.
   * Accepts a game hour float, time string, or GameClock instance.
   * @param {number|string|Object} [timeOrClock] - New time value or clock.
   * @returns {number} Current hour after update.
   */
  update(timeOrClock) {
    let hour = this.currentHour;
    if (timeOrClock !== void 0 && timeOrClock !== null) {
      hour = parseHour(timeOrClock);
    } else if (this.clock) {
      hour = parseHour(this.clock);
    }
    this.currentHour = hour;
    for (const schedule2 of this.schedules.values()) {
      schedule2.update(hour);
    }
    return this.currentHour;
  }
  /**
   * Advances time by the given amount and updates all schedules.
   * @param {number} delta - Amount of time to advance.
   * @param {string} [unit="hours"] - "hours" or "minutes".
   * @returns {number} New current hour.
   */
  advance(delta, unit = "hours") {
    if (!Number.isFinite(delta)) {
      throw new TypeError("Advance delta must be a finite number");
    }
    const deltaHours = unit === "minutes" ? delta / 60 : delta;
    return this.update(this.currentHour + deltaHours);
  }
  /**
   * Gets the current activity of an NPC.
   * @param {string} [npcId="default"] - NPC identifier.
   * @returns {string}
   */
  getActivity(npcId = "default") {
    const schedule2 = this.getSchedule(npcId);
    return schedule2 ? schedule2.currentActivity : this.defaultActivity;
  }
  /**
   * Gets the active schedule slot for an NPC.
   * @param {string} [npcId="default"] - NPC identifier.
   * @returns {ScheduleSlot|null}
   */
  getCurrentSlot(npcId = "default") {
    const schedule2 = this.getSchedule(npcId);
    return schedule2 ? schedule2.currentSlot : null;
  }
  /**
   * Gets the current destination point for an NPC.
   * @param {string} [npcId="default"] - NPC identifier.
   * @returns {Object|string|null}
   */
  getCurrentDestination(npcId = "default") {
    const schedule2 = this.getSchedule(npcId);
    return schedule2 ? schedule2.currentDestination : null;
  }
  /**
   * Checks whether an NPC schedule is currently suspended by danger.
   * @param {string} [npcId="default"] - NPC identifier.
   * @returns {boolean}
   */
  isSuspended(npcId = "default") {
    const schedule2 = this.getSchedule(npcId);
    return schedule2 ? schedule2.isSuspended : false;
  }
  /**
   * Alias for isSuspended.
   * @param {string} [npcId="default"] - NPC identifier.
   * @returns {boolean}
   */
  isInDanger(npcId = "default") {
    return this.isSuspended(npcId);
  }
  /**
   * Suspends an NPC's schedule with a danger reaction.
   * @param {string|Object} npcIdOrDanger - NPC identifier or danger data for default NPC.
   * @param {Object} [maybeDanger={}] - Danger configuration if npcId was provided.
   * @returns {boolean} True if danger was triggered.
   */
  triggerDanger(npcIdOrDanger, maybeDanger = {}) {
    let npcId = "default";
    let dangerData = maybeDanger;
    if (typeof npcIdOrDanger === "string") {
      npcId = npcIdOrDanger;
    } else if (npcIdOrDanger && typeof npcIdOrDanger === "object") {
      dangerData = npcIdOrDanger;
    }
    const schedule2 = this.getSchedule(npcId);
    if (schedule2) {
      schedule2.triggerDanger(dangerData);
      return true;
    }
    return false;
  }
  /**
   * Resolves danger reaction for an NPC, resuming normal schedule routine.
   * @param {string} [npcId="default"] - NPC identifier.
   * @param {Object} [options={}] - Options passed to resolveDanger.
   * @returns {string} Resumed activity.
   */
  resolveDanger(npcId = "default", options = {}) {
    const schedule2 = this.getSchedule(npcId);
    if (schedule2) {
      return schedule2.resolveDanger(options);
    }
    return this.defaultActivity;
  }
  /**
   * Evaluates a perceived target against a FactionRegistry and interrupts schedule if hostile.
   * @param {string} npcId - Observing NPC identifier.
   * @param {Object} target - Perceived target entity.
   * @param {FactionRegistry} factionRegistry - Faction registry to query.
   * @param {Object} [dangerOverrides={}] - Optional danger settings.
   * @returns {boolean} True if hostile danger reaction was triggered.
   */
  perceiveDanger(npcId, target, factionRegistry, dangerOverrides = {}) {
    const schedule2 = this.getSchedule(npcId);
    if (!schedule2 || !target || !factionRegistry) return false;
    const observerFaction = schedule2.faction;
    const targetFaction = FactionRegistry.resolveFaction(target);
    if (factionRegistry.isHostile(observerFaction, targetFaction)) {
      schedule2.triggerDanger({
        threat: target,
        activity: ROUTINE_ACTIVITIES.COMBAT,
        ...dangerOverrides
      });
      return true;
    }
    return false;
  }
  /**
   * Gets missed appointments recorded for an NPC.
   * @param {string} [npcId="default"] - NPC identifier.
   * @returns {Array} List of missed appointment records.
   */
  getMissedAppointments(npcId = "default") {
    const schedule2 = this.getSchedule(npcId);
    return schedule2 ? [...schedule2.missedAppointments] : [];
  }
  /**
   * Clears missed appointment history for an NPC.
   * @param {string} [npcId="default"] - NPC identifier.
   */
  clearMissedAppointments(npcId = "default") {
    const schedule2 = this.getSchedule(npcId);
    if (schedule2) {
      schedule2.missedAppointments.length = 0;
    }
  }
  /**
   * Checks if an activity point is currently occupied.
   * @param {Object|string} point - Activity point to check.
   * @param {string} [excludingNpcId] - Optional NPC identifier to ignore (e.g. self).
   * @returns {boolean} True if occupied.
   */
  isPointOccupied(point, excludingNpcId) {
    if (!point) return false;
    if (typeof point === "object" && point.occupied === true && !this._occupiedPoints.has(getPointKey(point))) {
      return true;
    }
    const key = getPointKey(point);
    if (!key) return false;
    const record = this._occupiedPoints.get(key);
    if (!record) return false;
    if (excludingNpcId && record.npcId === excludingNpcId) {
      return false;
    }
    return true;
  }
  /**
   * Claims an activity point for an NPC.
   * @param {Object|string} point - Activity point to claim.
   * @param {string} npcId - Claiming NPC identifier.
   * @returns {boolean} True if successfully claimed.
   */
  occupyPoint(point, npcId) {
    if (!point) return false;
    const key = getPointKey(point);
    if (!key) return false;
    const existing = this._occupiedPoints.get(key);
    if (existing && existing.npcId !== npcId) {
      return false;
    }
    this._occupiedPoints.set(key, { npcId, point });
    if (typeof point === "object") {
      point.occupied = true;
    }
    return true;
  }
  /**
   * Vacates a claimed activity point.
   * @param {Object|string} point - Point to vacate.
   * @param {string} [npcId] - Optional NPC identifier to ensure ownership.
   * @returns {boolean} True if vacated.
   */
  vacatePoint(point, npcId) {
    if (!point) return false;
    const key = getPointKey(point);
    if (!key) return false;
    const existing = this._occupiedPoints.get(key);
    if (!existing) return false;
    if (npcId && existing.npcId !== npcId) {
      return false;
    }
    this._occupiedPoints.delete(key);
    if (typeof existing.point === "object") {
      existing.point.occupied = false;
    }
    if (typeof point === "object") {
      point.occupied = false;
    }
    return true;
  }
  /**
   * Vacates all activity points claimed by an NPC.
   * @param {string} npcId - NPC identifier.
   */
  vacateAllForNPC(npcId) {
    for (const [key, record] of Array.from(this._occupiedPoints.entries())) {
      if (record.npcId === npcId) {
        this._occupiedPoints.delete(key);
        if (typeof record.point === "object") {
          record.point.occupied = false;
        }
      }
    }
  }
  /**
   * Gets the identifier of the NPC occupying a point.
   * @param {Object|string} point - Activity point.
   * @returns {string|null} Occupant NPC identifier or null.
   */
  getOccupant(point) {
    const key = getPointKey(point);
    if (!key) return null;
    const record = this._occupiedPoints.get(key);
    return record ? record.npcId : null;
  }
};
var FactionRegistry = class _FactionRegistry {
  /**
   * @param {Object} [config={}] - Registry configuration.
   * @param {string} [config.defaultDisposition="neutral"] - Disposition when no relation exists.
   * @param {number} [config.defaultReputation=0] - Default numerical reputation.
   * @param {number} [config.hostileThreshold=-25] - Reputation at or below which disposition is hostile.
   * @param {number} [config.friendlyThreshold=25] - Reputation at or above which disposition is friendly.
   * @param {Array} [config.factions=[]] - Initial faction names to register.
   */
  constructor(config = {}) {
    this.defaultDisposition = config.defaultDisposition || FACTION_DISPOSITION.NEUTRAL;
    this.defaultReputation = Number.isFinite(config.defaultReputation) ? config.defaultReputation : 0;
    this.hostileThreshold = Number.isFinite(config.hostileThreshold) ? config.hostileThreshold : -25;
    this.friendlyThreshold = Number.isFinite(config.friendlyThreshold) ? config.friendlyThreshold : 25;
    this._reputations = /* @__PURE__ */ new Map();
    this._dispositions = /* @__PURE__ */ new Map();
    this._factions = /* @__PURE__ */ new Set();
    if (Array.isArray(config.factions)) {
      for (const f of config.factions) {
        this.registerFaction(f);
      }
    }
  }
  /**
   * Resolves a faction name from a string, entity, or combatant.
   * @param {Object|string} target - Entity, combatant, or faction string.
   * @returns {string} Faction name.
   */
  static resolveFaction(target) {
    if (!target) return "neutral";
    if (typeof target === "string") return target.trim();
    if (typeof target.faction === "string" && target.faction.trim()) {
      return target.faction.trim();
    }
    if (typeof target.GetComponent === "function") {
      const combatant = target.GetComponent("Combatant");
      if (combatant && typeof combatant.faction === "string" && combatant.faction.trim()) {
        return combatant.faction.trim();
      }
    }
    return "neutral";
  }
  /**
   * Registers a faction name into the registry.
   * @param {string} name - Faction name.
   * @returns {FactionRegistry} This instance.
   */
  registerFaction(name) {
    const faction = _FactionRegistry.resolveFaction(name);
    if (faction) {
      this._factions.add(faction);
    }
    return this;
  }
  /**
   * Checks if a faction is registered.
   * @param {string} name - Faction name.
   * @returns {boolean}
   */
  hasFaction(name) {
    const faction = _FactionRegistry.resolveFaction(name);
    return this._factions.has(faction);
  }
  /**
   * Returns all registered faction names.
   * @returns {Array} List of faction names.
   */
  getFactions() {
    return Array.from(this._factions);
  }
  /**
   * Sets numerical reputation from source towards target.
   * Supports asymmetric (default) or bidirectional updates.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @param {number} value - Numerical reputation value.
   * @param {Object} [options={}] - Options object.
   * @param {boolean} [options.bidirectional=false] - Whether to set target->source as well.
   * @param {boolean} [options.keepOverride=false] - Whether to keep explicit disposition overrides.
   * @returns {FactionRegistry} This instance.
   */
  setReputation(source, target, value, options = {}) {
    if (!Number.isFinite(value)) {
      throw new TypeError("Reputation value must be a finite number");
    }
    const src = _FactionRegistry.resolveFaction(source);
    const tgt = _FactionRegistry.resolveFaction(target);
    this.registerFaction(src);
    this.registerFaction(tgt);
    const key = `${src}->${tgt}`;
    this._reputations.set(key, value);
    if (!options.keepOverride) {
      this._dispositions.delete(key);
    }
    if (options.bidirectional || options.symmetric) {
      const revKey = `${tgt}->${src}`;
      this._reputations.set(revKey, value);
      if (!options.keepOverride) {
        this._dispositions.delete(revKey);
      }
    }
    return this;
  }
  /**
   * Modifies numerical reputation between source and target by delta.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @param {number} delta - Amount to adjust reputation by.
   * @param {Object} [options={}] - Options object.
   * @param {boolean} [options.bidirectional=false] - Whether to adjust target->source as well.
   * @returns {number} New reputation score.
   */
  modifyReputation(source, target, delta, options = {}) {
    if (!Number.isFinite(delta)) {
      throw new TypeError("Reputation delta must be a finite number");
    }
    const current = this.getReputation(source, target);
    const next = current + delta;
    this.setReputation(source, target, next, options);
    return next;
  }
  /**
   * Gets the numerical reputation of source faction towards target.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @returns {number} Numerical reputation.
   */
  getReputation(source, target) {
    const src = _FactionRegistry.resolveFaction(source);
    const tgt = _FactionRegistry.resolveFaction(target);
    const key = `${src}->${tgt}`;
    if (this._reputations.has(key)) {
      return this._reputations.get(key);
    }
    if (src === tgt) {
      return 100;
    }
    return this.defaultReputation;
  }
  /**
   * Sets an explicit disposition override from source towards target.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @param {string} disposition - "friendly", "neutral", or "hostile".
   * @param {Object} [options={}] - Options object.
   * @param {boolean} [options.bidirectional=false] - Whether to set target->source as well.
   * @param {boolean} [options.setReputation=true] - Whether to synchronize numerical reputation baseline.
   * @returns {FactionRegistry} This instance.
   */
  setDisposition(source, target, disposition, options = {}) {
    const valid = Object.values(FACTION_DISPOSITION);
    if (!valid.includes(disposition)) {
      throw new TypeError(`Disposition must be one of: ${valid.join(", ")}`);
    }
    const src = _FactionRegistry.resolveFaction(source);
    const tgt = _FactionRegistry.resolveFaction(target);
    this.registerFaction(src);
    this.registerFaction(tgt);
    const key = `${src}->${tgt}`;
    this._dispositions.set(key, disposition);
    if (options.setReputation !== false) {
      let repVal = 0;
      if (disposition === FACTION_DISPOSITION.HOSTILE) repVal = this.hostileThreshold;
      else if (disposition === FACTION_DISPOSITION.FRIENDLY) repVal = this.friendlyThreshold;
      this._reputations.set(key, repVal);
    }
    if (options.bidirectional || options.symmetric) {
      const revKey = `${tgt}->${src}`;
      this._dispositions.set(revKey, disposition);
      if (options.setReputation !== false) {
        let repVal = 0;
        if (disposition === FACTION_DISPOSITION.HOSTILE) repVal = this.hostileThreshold;
        else if (disposition === FACTION_DISPOSITION.FRIENDLY) repVal = this.friendlyThreshold;
        this._reputations.set(revKey, repVal);
      }
    }
    return this;
  }
  /**
   * Gets the disposition of source towards target ("friendly", "neutral", or "hostile").
   * Respects explicit disposition overrides and derives from reputation thresholds.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @returns {string} Disposition string.
   */
  getDisposition(source, target) {
    const src = _FactionRegistry.resolveFaction(source);
    const tgt = _FactionRegistry.resolveFaction(target);
    const key = `${src}->${tgt}`;
    if (this._dispositions.has(key)) {
      return this._dispositions.get(key);
    }
    if (src === tgt) {
      return FACTION_DISPOSITION.FRIENDLY;
    }
    const rep = this.getReputation(src, tgt);
    if (rep <= this.hostileThreshold) {
      return FACTION_DISPOSITION.HOSTILE;
    }
    if (rep >= this.friendlyThreshold) {
      return FACTION_DISPOSITION.FRIENDLY;
    }
    return this.defaultDisposition;
  }
  /**
   * Checks if source faction considers target hostile.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @returns {boolean} True if hostile.
   */
  isHostile(source, target) {
    return this.getDisposition(source, target) === FACTION_DISPOSITION.HOSTILE;
  }
  /**
   * Checks if source faction considers target friendly.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @returns {boolean} True if friendly.
   */
  isFriendly(source, target) {
    return this.getDisposition(source, target) === FACTION_DISPOSITION.FRIENDLY;
  }
  /**
   * Checks if source faction considers target neutral.
   * @param {Object|string} source - Source faction or entity.
   * @param {Object|string} target - Target faction or entity.
   * @returns {boolean} True if neutral.
   */
  isNeutral(source, target) {
    return this.getDisposition(source, target) === FACTION_DISPOSITION.NEUTRAL;
  }
  /**
   * Clears all recorded standings and registrations.
   */
  clear() {
    this._reputations.clear();
    this._dispositions.clear();
    this._factions.clear();
  }
  /**
   * Serializes faction standings into a plain JSON-compatible object.
   * @returns {Object}
   */
  serialize() {
    return {
      defaultDisposition: this.defaultDisposition,
      defaultReputation: this.defaultReputation,
      hostileThreshold: this.hostileThreshold,
      friendlyThreshold: this.friendlyThreshold,
      factions: Array.from(this._factions),
      reputations: Object.fromEntries(this._reputations),
      dispositions: Object.fromEntries(this._dispositions)
    };
  }
  /**
   * Restores faction standings from serialized data.
   * @param {Object} data - Serialized state object.
   * @returns {FactionRegistry} This instance.
   */
  restore(data) {
    if (!data || typeof data !== "object") return this;
    if (data.defaultDisposition) this.defaultDisposition = data.defaultDisposition;
    if (Number.isFinite(data.defaultReputation)) this.defaultReputation = data.defaultReputation;
    if (Number.isFinite(data.hostileThreshold)) this.hostileThreshold = data.hostileThreshold;
    if (Number.isFinite(data.friendlyThreshold)) this.friendlyThreshold = data.friendlyThreshold;
    if (Array.isArray(data.factions)) {
      for (const f of data.factions) this.registerFaction(f);
    }
    if (data.reputations && typeof data.reputations === "object") {
      for (const [k, v] of Object.entries(data.reputations)) {
        this._reputations.set(k, v);
      }
    }
    if (data.dispositions && typeof data.dispositions === "object") {
      for (const [k, v] of Object.entries(data.dispositions)) {
        this._dispositions.set(k, v);
      }
    }
    return this;
  }
  /**
   * Creates and deserializes a new FactionRegistry instance.
   * @param {Object} data - Serialized data.
   * @returns {FactionRegistry}
   */
  static deserialize(data) {
    const reg = new _FactionRegistry(data);
    reg.restore(data);
    return reg;
  }
};

// src/nereid/index.js
var nereid_exports = {};
__export(nereid_exports, {
  Body: () => Body,
  Collider: () => Collider,
  CollisionLayers: () => CollisionLayers,
  CollisionSystem: () => CollisionSystem,
  ContactSolver: () => ContactSolver,
  ElevationFilter: () => ElevationFilter,
  HazardArea: () => HazardArea,
  HazardSystem: () => HazardSystem,
  Hitbox: () => Hitbox,
  Hurtbox: () => Hurtbox,
  InteractionArea: () => InteractionArea,
  KnockbackMotor: () => KnockbackMotor,
  PlatformerController: () => PlatformerController,
  SolidCollider: () => SolidCollider,
  SpatialHashGrid: () => SpatialHashGrid,
  SweptAABB: () => SweptAABB,
  TileCollision: () => TileCollision,
  TopDownController: () => TopDownController,
  TriggerCollider: () => TriggerCollider,
  TriggerLifecycleSystem: () => TriggerLifecycleSystem,
  boxColliderToCollider: () => boxColliderToCollider,
  canLayersCollide: () => canLayersCollide,
  createCollisionMask: () => createCollisionMask
});

// src/nereid/body.js
init_component();
init_vec2();
var Body = class extends Component {
  constructor() {
    super();
    this.velocity = new Vector2(0, 0);
    this.gravity = 980;
    this.maxFallSpeed = 800;
    this.grounded = false;
    this.friction = 0.9;
    this.drag = 0.98;
  }
  /**
   * Apply a force to the body.
   * @param {number} x 
   * @param {number} y 
   */
  applyForce(x, y) {
    this.velocity.x += x;
    this.velocity.y += y;
  }
  /**
   * Apply an impulse (instant velocity change).
   * @param {number} x 
   * @param {number} y 
   */
  impulse(x, y) {
    this.velocity.x = x;
    this.velocity.y = y;
  }
  /** Apply immediate knockback velocity, replacing the current velocity. */
  applyKnockback(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError("Knockback must use finite x and y values");
    this.impulse(x, y);
  }
  /**
   * Update physics.
   * @param {number} deltaTime - Time in seconds.
   */
  update(deltaTime) {
    if (!this.grounded) {
      this.velocity.y += this.gravity * deltaTime;
      this.velocity.y = Math.min(this.velocity.y, this.maxFallSpeed);
    }
    if (this.grounded) {
      this.velocity.x *= this.friction;
    } else {
      this.velocity.x *= this.drag;
    }
    if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
  }
};

// src/nereid/collisionSystem.js
init_entity();
var CollisionSystem = class {
  /** Determine whether a moving AABB crossed the allowed face of a one-way collider. */
  static canResolveOneWay(surface, surfaceBounds, previous, current) {
    if (!(surface instanceof Collider) || !surface.oneWay) return true;
    const bounds = [surfaceBounds, previous, current];
    if (bounds.some((box) => !box || ![box.left, box.top, box.right, box.bottom].every(Number.isFinite))) {
      throw new TypeError("One-way resolution requires finite surface, previous, and current AABB bounds");
    }
    if (current.left >= surfaceBounds.right || current.right <= surfaceBounds.left || current.top >= surfaceBounds.bottom || current.bottom <= surfaceBounds.top) return false;
    switch (surface.oneWay) {
      case "up":
        return previous.bottom <= surfaceBounds.top && current.bottom > surfaceBounds.top;
      case "down":
        return previous.top >= surfaceBounds.bottom && current.top < surfaceBounds.bottom;
      case "left":
        return previous.right <= surfaceBounds.left && current.right > surfaceBounds.left;
      case "right":
        return previous.left >= surfaceBounds.right && current.left < surfaceBounds.right;
      default:
        return true;
    }
  }
  constructor() {
    this._pairs = /* @__PURE__ */ new Map();
    this._ids = /* @__PURE__ */ new WeakMap();
    this._nextId = 1;
    this._listeners = /* @__PURE__ */ new Map();
  }
  on(event, listener) {
    if (typeof event !== "string" || !event || typeof listener !== "function") throw new TypeError("CollisionSystem.on requires an event name and function");
    if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
    this._listeners.get(event).add(listener);
    return () => this._listeners.get(event)?.delete(listener);
  }
  _id(collider) {
    if (!this._ids.has(collider)) this._ids.set(collider, this._nextId++);
    return this._ids.get(collider);
  }
  _publish(type, phase, first, second) {
    const payload = { type, phase, collider: first.collider, other: second.collider, entity: first.entity ?? null, otherEntity: second.entity ?? null };
    first.collider.emit(type === "overlap" ? phase : type, payload);
    const reverseType = type === "hit" ? "hurt" : type === "hurt" ? "hit" : type;
    second.collider.emit(reverseType === "overlap" ? phase : reverseType, { ...payload, collider: second.collider, other: first.collider, entity: second.entity ?? null, otherEntity: first.entity ?? null });
    for (const listener of [...this._listeners.get(`${type}:${phase}`) ?? []]) listener(payload);
    for (const listener of [...this._listeners.get(type) ?? []]) listener(payload);
  }
  _events(a, b, phase) {
    const roles = [a.collider.role, b.collider.role];
    if (roles.includes("hitbox") && roles.includes("hurtbox")) {
      const hitbox = a.collider.role === "hitbox" ? a : b;
      const hurtbox = hitbox === a ? b : a;
      this._publish("hit", phase, hitbox, hurtbox);
    }
    if (roles.includes("hazard")) {
      const hazard = a.collider.role === "hazard" ? a : b;
      const target = hazard === a ? b : a;
      this._publish("hazard", phase, hazard, target);
    }
    if (roles.includes("interaction")) {
      const area = a.collider.role === "interaction" ? a : b;
      const target = area === a ? b : a;
      this._publish("interaction", phase, area, target);
    }
    if (roles.includes("trigger") || roles.includes("hitbox") || roles.includes("hurtbox") || roles.includes("hazard") || roles.includes("interaction")) {
      this._publish("overlap", phase, a, b);
    } else {
      this._publish("collision", phase, a, b);
    }
    if (a.collider.climbable || b.collider.climbable) this._publish("climbable", phase, a, b);
  }
  /**
   * Process collider entries in stable array order. Each entry is { collider, x, y, entity? }.
   * Returns the current overlapping pair count.
   */
  step(entries) {
    if (!Array.isArray(entries)) throw new TypeError("CollisionSystem.step requires an array");
    const active = entries.map((entry) => {
      if (!entry || !(entry.collider instanceof Collider) || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
        throw new TypeError("Each collision entry requires a Collider and finite x/y coordinates");
      }
      return { ...entry, id: this._id(entry.collider) };
    }).filter((entry) => entry.collider.enabled && isEntityActive(entry.entity ?? entry.collider.entity)).sort((a, b) => a.id - b.id);
    const current = /* @__PURE__ */ new Map();
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j];
        if (a.collider === b.collider) continue;
        if ((a.collider.mask & b.collider.layer) >>> 0 === 0 || (b.collider.mask & a.collider.layer) >>> 0 === 0) continue;
        if (!a.collider.overlaps(b.collider, a.x, a.y, b.x, b.y)) continue;
        const key = `${a.id}:${b.id}`;
        current.set(key, [a, b]);
        this._events(a, b, this._pairs.has(key) ? "stay" : "enter");
      }
    }
    for (const [key, [a, b]] of this._pairs) {
      if (!current.has(key)) this._events(a, b, "exit");
    }
    this._pairs = current;
    return current.size;
  }
};

// src/nereid/collisionLayers.js
init_entity();
var CollisionLayers = Object.freeze({
  NONE: 0,
  DEFAULT: 1 << 0,
  // 1
  PLAYER: 1 << 1,
  // 2
  ENEMY: 1 << 2,
  // 4
  TERRAIN: 1 << 3,
  // 8
  PROJECTILE: 1 << 4,
  // 16
  TRIGGER: 1 << 5,
  // 32
  HAZARD: 1 << 6,
  // 64
  INTERACTION: 1 << 7,
  // 128
  ITEM: 1 << 8,
  // 256
  NPC: 1 << 9,
  // 512
  ALL: 4294967295
});
function createCollisionMask(...layers) {
  let mask = 0;
  for (const layer of layers) {
    if (Number.isInteger(layer)) {
      mask |= layer;
    }
  }
  return mask >>> 0;
}
function canLayersCollide(layerA, maskA, layerB, maskB, { symmetric = true } = {}) {
  const aDetectsB = (maskA & layerB) >>> 0 !== 0;
  if (!symmetric) {
    return aDetectsB;
  }
  const bDetectsA = (maskB & layerA) >>> 0 !== 0;
  return aDetectsB && bDetectsA;
}
var ContactSolver = class _ContactSolver {
  /**
   * Compute AABB intersection and separation normal/depth between box A and box B.
   * @param {Object} boundsA { left, right, top, bottom }
   * @param {Object} boundsB { left, right, top, bottom }
   * @returns {Object|null} Collision contact or null if no overlap
   */
  static getAABBContact(boundsA, boundsB) {
    const ox = Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
    const oy = Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top);
    if (ox <= 0 || oy <= 0) return null;
    const centerAX = (boundsA.left + boundsA.right) / 2;
    const centerAY = (boundsA.top + boundsA.bottom) / 2;
    const centerBX = (boundsB.left + boundsB.right) / 2;
    const centerBY = (boundsB.top + boundsB.bottom) / 2;
    let normalX = 0;
    let normalY = 0;
    let depth = 0;
    if (ox < oy) {
      depth = ox;
      normalX = centerAX < centerBX ? -1 : 1;
    } else if (oy < ox) {
      depth = oy;
      normalY = centerAY < centerBY ? -1 : 1;
    } else {
      depth = ox;
      normalX = centerAX < centerBX ? -1 : 1;
      normalY = centerAY < centerBY ? -1 : 1;
      const len = Math.hypot(normalX, normalY);
      normalX /= len;
      normalY /= len;
    }
    return {
      overlap: true,
      depth,
      overlapX: ox,
      overlapY: oy,
      normal: { x: normalX, y: normalY },
      separation: { x: normalX * depth, y: normalY * depth }
    };
  }
  /**
   * Separate an actor overlapping one or more static solid obstacles (e.g. overlapping spawn).
   * @param {Object} actorBounds { left, right, top, bottom }
   * @param {Array<Object>} obstacleBoundsList Array of { left, right, top, bottom }
   * @param {number} [maxIterations=8]
   * @returns {Object} { x: number, y: number, resolved: boolean } Displacements applied
   */
  static resolveOverlappingSpawn(actorBounds, obstacleBoundsList, maxIterations = 8) {
    let current = { ...actorBounds };
    let totalDisplacementX = 0;
    let totalDisplacementY = 0;
    let resolved = true;
    for (let iter = 0; iter < maxIterations; iter++) {
      let collisionFound = false;
      for (const obstacle of obstacleBoundsList) {
        const contact = _ContactSolver.getAABBContact(current, obstacle);
        if (contact) {
          collisionFound = true;
          const pushX = contact.normal.x * (contact.overlapX + 1e-3);
          const pushY = contact.normal.y * (contact.overlapY + 1e-3);
          if (contact.overlapX < contact.overlapY) {
            current.left += pushX;
            current.right += pushX;
            totalDisplacementX += pushX;
          } else {
            current.top += pushY;
            current.bottom += pushY;
            totalDisplacementY += pushY;
          }
        }
      }
      if (!collisionFound) {
        resolved = true;
        break;
      }
      if (iter === maxIterations - 1) {
        resolved = false;
      }
    }
    return {
      displacementX: totalDisplacementX,
      displacementY: totalDisplacementY,
      resolved
    };
  }
  /**
   * Slide movement against a contact surface normal (corner / wall sliding).
   * @param {number} vx
   * @param {number} vy
   * @param {number} normalX
   * @param {number} normalY
   * @returns {Object} { vx: number, vy: number }
   */
  static slideAlongNormal(vx, vy, normalX, normalY) {
    const dot = vx * normalX + vy * normalY;
    if (dot >= 0) {
      return { vx, vy };
    }
    return {
      vx: vx - dot * normalX,
      vy: vy - dot * normalY
    };
  }
};
var TriggerLifecycleSystem = class {
  constructor({ asymmetric = true } = {}) {
    this.asymmetric = Boolean(asymmetric);
    this.activePairs = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Map();
    this._nextId = 1;
    this._colliderIds = /* @__PURE__ */ new WeakMap();
  }
  _getColliderId(collider) {
    if (!this._colliderIds.has(collider)) {
      this._colliderIds.set(collider, this._nextId++);
    }
    return this._colliderIds.get(collider);
  }
  on(event, listener) {
    if (typeof event !== "string" || typeof listener !== "function") {
      throw new TypeError("on requires event name and callback function");
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }
  _publish(type, phase, entryA, entryB) {
    const payload = {
      type,
      phase,
      collider: entryA.collider,
      other: entryB.collider,
      entity: entryA.entity ?? null,
      otherEntity: entryB.entity ?? null
    };
    if (typeof entryA.collider.emit === "function") {
      entryA.collider.emit(phase, payload);
    }
    const listeners = [...this.listeners.get(`${type}:${phase}`) ?? [], ...this.listeners.get(phase) ?? []];
    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error("Error in trigger lifecycle listener:", err);
      }
    }
  }
  /**
   * Step the trigger lifecycle across a collection of active colliders.
   * Safely handles removal of colliders or entities during callbacks.
   * @param {Array<Object>} entries Array of { collider, x, y, entity? }
   * @returns {number} Current overlapping pair count
   */
  step(entries) {
    if (!Array.isArray(entries)) throw new TypeError("step requires an array of entries");
    const validEntries = [];
    for (const entry of entries) {
      if (!entry || !(entry.collider instanceof Collider) || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
        continue;
      }
      if (!entry.collider.enabled) continue;
      if (entry.entity && !isEntityActive(entry.entity)) continue;
      validEntries.push({
        ...entry,
        id: this._getColliderId(entry.collider)
      });
    }
    validEntries.sort((a, b) => a.id - b.id);
    const currentPairs = /* @__PURE__ */ new Map();
    for (let i = 0; i < validEntries.length; i++) {
      const a = validEntries[i];
      for (let j = i + 1; j < validEntries.length; j++) {
        const b = validEntries[j];
        const aDetectsB = canLayersCollide(
          a.collider.layer,
          a.collider.mask,
          b.collider.layer,
          b.collider.mask,
          { symmetric: false }
        );
        const bDetectsA = canLayersCollide(
          b.collider.layer,
          b.collider.mask,
          a.collider.layer,
          a.collider.mask,
          { symmetric: false }
        );
        const collides = this.asymmetric ? aDetectsB || bDetectsA : aDetectsB && bDetectsA;
        if (!collides) continue;
        if (!a.collider.overlaps(b.collider, a.x, a.y, b.x, b.y)) continue;
        const pairKey = `${a.id}:${b.id}`;
        currentPairs.set(pairKey, [a, b]);
        const wasOverlapping = this.activePairs.has(pairKey);
        const phase = wasOverlapping ? "stay" : "enter";
        const primary = aDetectsB ? a : b;
        const secondary = primary === a ? b : a;
        this._publish(primary.collider.role ?? "trigger", phase, primary, secondary);
      }
    }
    for (const [pairKey, [a, b]] of this.activePairs.entries()) {
      if (!currentPairs.has(pairKey)) {
        this._publish(a.collider.role ?? "trigger", "exit", a, b);
      }
    }
    this.activePairs = currentPairs;
    return currentPairs.size;
  }
  /**
   * Reset active pairs state.
   */
  clear() {
    this.activePairs.clear();
  }
};

// src/nereid/sweptCollision.js
init_component();
function finiteNumber3(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}
var SweptAABB = class _SweptAABB {
  /**
   * Compute swept AABB collision between a moving box and a static target box.
   * Uses Minkowski sum raycast against the expanded target box.
   *
   * @param {Object} movingBox Moving entity bounds { left, right, top, bottom }
   * @param {number} dx Displacement in X
   * @param {number} dy Displacement in Y
   * @param {Object} staticBox Obstacle bounds { left, right, top, bottom }
   * @returns {Object} { hit: boolean, toi: number, normal: {x: number, y: number}, contactPoint: {x: number, y: number} }
   */
  static sweepBoxAgainstBox(movingBox, dx, dy, staticBox) {
    finiteNumber3(dx, "dx");
    finiteNumber3(dy, "dy");
    const boxWidth = movingBox.right - movingBox.left;
    const boxHeight = movingBox.bottom - movingBox.top;
    const expandedLeft = staticBox.left - boxWidth / 2;
    const expandedRight = staticBox.right + boxWidth / 2;
    const expandedTop = staticBox.top - boxHeight / 2;
    const expandedBottom = staticBox.bottom + boxHeight / 2;
    const rayOriginX = (movingBox.left + movingBox.right) / 2;
    const rayOriginY = (movingBox.top + movingBox.bottom) / 2;
    if (rayOriginX >= expandedLeft && rayOriginX <= expandedRight && rayOriginY >= expandedTop && rayOriginY <= expandedBottom) {
      return {
        hit: true,
        toi: 0,
        normal: { x: 0, y: 0 },
        contactPoint: { x: rayOriginX, y: rayOriginY }
      };
    }
    let nearTimeX = -Infinity;
    let farTimeX = Infinity;
    let normalX = 0;
    if (dx !== 0) {
      const invDx = 1 / dx;
      const t1 = (expandedLeft - rayOriginX) * invDx;
      const t2 = (expandedRight - rayOriginX) * invDx;
      if (t1 < t2) {
        nearTimeX = t1;
        farTimeX = t2;
        normalX = -1;
      } else {
        nearTimeX = t2;
        farTimeX = t1;
        normalX = 1;
      }
    } else {
      if (rayOriginX <= expandedLeft || rayOriginX >= expandedRight) {
        return { hit: false, toi: 1, normal: { x: 0, y: 0 }, contactPoint: null };
      }
    }
    let nearTimeY = -Infinity;
    let farTimeY = Infinity;
    let normalY = 0;
    if (dy !== 0) {
      const invDy = 1 / dy;
      const t1 = (expandedTop - rayOriginY) * invDy;
      const t2 = (expandedBottom - rayOriginY) * invDy;
      if (t1 < t2) {
        nearTimeY = t1;
        farTimeY = t2;
        normalY = -1;
      } else {
        nearTimeY = t2;
        farTimeY = t1;
        normalY = 1;
      }
    } else {
      if (rayOriginY <= expandedTop || rayOriginY >= expandedBottom) {
        return { hit: false, toi: 1, normal: { x: 0, y: 0 }, contactPoint: null };
      }
    }
    const entryTime = Math.max(nearTimeX, nearTimeY);
    const exitTime = Math.min(farTimeX, farTimeY);
    if (entryTime > exitTime || entryTime < 0 || entryTime > 1) {
      return { hit: false, toi: 1, normal: { x: 0, y: 0 }, contactPoint: null };
    }
    let finalNormalX = 0;
    let finalNormalY = 0;
    if (nearTimeX > nearTimeY) {
      finalNormalX = normalX;
      finalNormalY = 0;
    } else if (nearTimeY > nearTimeX) {
      finalNormalX = 0;
      finalNormalY = normalY;
    } else {
      finalNormalX = normalX;
      finalNormalY = normalY;
    }
    const contactX = rayOriginX + dx * entryTime;
    const contactY = rayOriginY + dy * entryTime;
    return {
      hit: true,
      toi: entryTime,
      normal: { x: finalNormalX, y: finalNormalY },
      contactPoint: { x: contactX, y: contactY }
    };
  }
  /**
   * Cast moving box against multiple obstacles and find the earliest impact.
   * @param {Object} movingBox
   * @param {number} dx
   * @param {number} dy
   * @param {Array<Object>} staticObstacles
   * @returns {Object}
   */
  static sweepAgainstObstacles(movingBox, dx, dy, staticObstacles) {
    let earliestHit = null;
    let minToi = 1;
    for (const obs of staticObstacles) {
      const result = _SweptAABB.sweepBoxAgainstBox(movingBox, dx, dy, obs);
      if (result.hit && result.toi <= minToi) {
        minToi = result.toi;
        earliestHit = { ...result, obstacle: obs };
      }
    }
    if (earliestHit) {
      return earliestHit;
    }
    return {
      hit: false,
      toi: 1,
      normal: { x: 0, y: 0 },
      contactPoint: null,
      obstacle: null
    };
  }
};
var ElevationFilter = class {
  /**
   * Check if two elevation intervals overlap.
   * @param {number} elevation1 Base elevation of entity 1
   * @param {number} height1 Height span of entity 1
   * @param {number} elevation2 Base elevation of entity 2
   * @param {number} height2 Height span of entity 2
   * @returns {boolean}
   */
  static overlaps(elevation1 = 0, height1 = 1, elevation2 = 0, height2 = 1) {
    const top1 = elevation1 + height1;
    const top2 = elevation2 + height2;
    return Math.max(elevation1, elevation2) < Math.min(top1, top2);
  }
};
var KnockbackMotor = class extends Component {
  /**
   * @param {Object} [config]
   * @param {number} [config.decay=8.0] Friction/decay rate per second
   * @param {number} [config.minVelocity=0.01] Threshold to stop knockback
   */
  constructor({ decay = 8, minVelocity = 0.01 } = {}) {
    super();
    this.decay = Math.max(0.1, decay);
    this.minVelocity = minVelocity;
    this.vx = 0;
    this.vy = 0;
    this.isActive = false;
    this.listeners = /* @__PURE__ */ new Set();
  }
  onKnockbackEvent(listener) {
    if (typeof listener !== "function") throw new TypeError("Listener must be a function");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  _emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  /**
   * Apply a directional knockback impulse.
   * @param {number} vx
   * @param {number} vy
   */
  applyImpulse(vx, vy) {
    finiteNumber3(vx, "vx");
    finiteNumber3(vy, "vy");
    this.vx += vx;
    this.vy += vy;
    this.isActive = true;
    this._emit({ type: "impulse", vx: this.vx, vy: this.vy });
  }
  /**
   * Step knockback displacement against solid obstacles.
   * If knockback collides into a wall, movement stops at the wall surface
   * and normal velocity is zeroed (preventing wall clipping).
   *
   * @param {number} deltaTime
   * @param {Object} currentBounds Entity bounds { left, right, top, bottom }
   * @param {Array<Object>} solidObstacles List of static { left, right, top, bottom }
   * @returns {Object} { dx: number, dy: number, hitWall: boolean }
   */
  step(deltaTime, currentBounds, solidObstacles = []) {
    finiteNumber3(deltaTime, "deltaTime");
    if (!this.isActive || deltaTime <= 0) {
      return { dx: 0, dy: 0, hitWall: false };
    }
    let proposedDx = this.vx * deltaTime;
    let proposedDy = this.vy * deltaTime;
    let hitWall = false;
    if (solidObstacles.length > 0) {
      const sweep = SweptAABB.sweepAgainstObstacles(currentBounds, proposedDx, proposedDy, solidObstacles);
      if (sweep.hit) {
        hitWall = true;
        proposedDx *= sweep.toi;
        proposedDy *= sweep.toi;
        if (sweep.normal.x !== 0) this.vx = 0;
        if (sweep.normal.y !== 0) this.vy = 0;
        this._emit({ type: "wall-impact", normal: sweep.normal, contactPoint: sweep.contactPoint });
      }
    }
    const friction = Math.max(0, 1 - this.decay * deltaTime);
    this.vx *= friction;
    this.vy *= friction;
    if (Math.hypot(this.vx, this.vy) < this.minVelocity) {
      this.vx = 0;
      this.vy = 0;
      this.isActive = false;
      this._emit({ type: "stopped" });
    }
    return {
      dx: proposedDx,
      dy: proposedDy,
      hitWall
    };
  }
  /**
   * Clear active knockback immediately.
   */
  stop() {
    this.vx = 0;
    this.vy = 0;
    this.isActive = false;
  }
};
var HazardSystem = class {
  constructor() {
    this.zones = /* @__PURE__ */ new Map();
    this.activeTargets = /* @__PURE__ */ new Map();
    this._nextId = 1;
  }
  /**
   * Register a hazard zone.
   * @param {Object} config
   * @param {Object} config.bounds { left, right, top, bottom }
   * @param {number} [config.elevation=0]
   * @param {number} [config.height=2]
   * @param {number} [config.damagePerTick=10]
   * @param {number} [config.tickInterval=0.5]
   * @param {string} [config.damageType="hazard"]
   * @returns {string} Zone ID
   */
  addZone(config) {
    if (!config || !config.bounds) throw new TypeError("Hazard zone requires bounds");
    const id = `hazard_${this._nextId++}`;
    this.zones.set(id, {
      id,
      bounds: { ...config.bounds },
      elevation: config.elevation ?? 0,
      height: config.height ?? 2,
      damagePerTick: config.damagePerTick ?? 10,
      tickInterval: config.tickInterval ?? 0.5,
      damageType: config.damageType ?? "hazard",
      enabled: true
    });
    return id;
  }
  removeZone(id) {
    return this.zones.delete(id);
  }
  /**
   * Step hazard zones against targets (combatants/entities).
   * Targets only take damage if their 2D bounds overlap AND their elevation intervals overlap.
   *
   * @param {number} deltaTime
   * @param {Array<Object>} targets Array of { id, bounds, elevation?, height?, receiveDamage }
   * @returns {Array<Object>} List of damage events applied
   */
  step(deltaTime, targets) {
    finiteNumber3(deltaTime, "deltaTime");
    if (deltaTime <= 0 || !Array.isArray(targets)) return [];
    const damageEvents = [];
    for (const zone of this.zones.values()) {
      if (!zone.enabled) continue;
      for (const target of targets) {
        if (!target || !target.bounds) continue;
        const ox = Math.min(target.bounds.right, zone.bounds.right) - Math.max(target.bounds.left, zone.bounds.left);
        const oy = Math.min(target.bounds.bottom, zone.bounds.bottom) - Math.max(target.bounds.top, zone.bounds.top);
        const overlaps2D = ox > 0 && oy > 0;
        const targetElevation = target.elevation ?? 0;
        const targetHeight = target.height ?? 2;
        const overlapsElevation = ElevationFilter.overlaps(
          zone.elevation,
          zone.height,
          targetElevation,
          targetHeight
        );
        const key = `${target.id}:${zone.id}`;
        if (overlaps2D && overlapsElevation) {
          let state = this.activeTargets.get(key);
          if (!state) {
            state = { timer: 0 };
            this.activeTargets.set(key, state);
          }
          state.timer += deltaTime;
          if (state.timer >= zone.tickInterval) {
            state.timer -= zone.tickInterval;
            const event = {
              targetId: target.id,
              zoneId: zone.id,
              damage: zone.damagePerTick,
              damageType: zone.damageType
            };
            if (typeof target.receiveDamage === "function") {
              target.receiveDamage({
                amount: zone.damagePerTick,
                type: zone.damageType
              });
            }
            damageEvents.push(event);
          }
        } else {
          this.activeTargets.delete(key);
        }
      }
    }
    return damageEvents;
  }
};

// src/nereid/spatialHashGrid.js
init_component();
function finiteNumber4(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}
var SpatialHashGrid = class extends Component {
  /**
   * @param {Object} [config]
   * @param {number} [config.cellSize=64] Width and height of each spatial cell
   * @param {number} [config.maxCellSpan=32] Maximum cells an oversized object can span across one dimension
   */
  constructor({ cellSize = 64, maxCellSpan = 32 } = {}) {
    super();
    finiteNumber4(cellSize, "cellSize");
    if (cellSize <= 0) throw new RangeError("cellSize must be a positive number");
    this.cellSize = cellSize;
    this.maxCellSpan = Math.max(2, maxCellSpan);
    this.cells = /* @__PURE__ */ new Map();
    this.entryCells = /* @__PURE__ */ new Map();
    this.entryBounds = /* @__PURE__ */ new Map();
    this._nextId = 1;
    this._ids = /* @__PURE__ */ new WeakMap();
  }
  _id(entry) {
    if (!this._ids.has(entry)) {
      this._ids.set(entry, this._nextId++);
    }
    return this._ids.get(entry);
  }
  /**
   * Convert world coordinate to cell coordinate index.
   * Uses Math.floor to correctly handle negative coordinates.
   * @param {number} coord
   * @returns {number}
   */
  worldToCell(coord) {
    return Math.floor(coord / this.cellSize);
  }
  /**
   * Compute set of cell keys covered by an AABB.
   * Handles negative cells and clamps huge colliders to maxCellSpan.
   * @param {Object} bounds { left, right, top, bottom }
   * @returns {Set<string>}
   */
  getCellKeysForBounds(bounds) {
    if (!bounds || !Number.isFinite(bounds.left) || !Number.isFinite(bounds.right) || !Number.isFinite(bounds.top) || !Number.isFinite(bounds.bottom)) {
      throw new TypeError("Bounds must contain finite left, right, top, bottom");
    }
    const minCellX = this.worldToCell(Math.min(bounds.left, bounds.right));
    const maxCellX = this.worldToCell(Math.max(bounds.left, bounds.right));
    const minCellY = this.worldToCell(Math.min(bounds.top, bounds.bottom));
    const maxCellY = this.worldToCell(Math.max(bounds.top, bounds.bottom));
    const spanX = Math.min(maxCellX - minCellX, this.maxCellSpan);
    const spanY = Math.min(maxCellY - minCellY, this.maxCellSpan);
    const keys = /* @__PURE__ */ new Set();
    for (let cx = minCellX; cx <= minCellX + spanX; cx++) {
      for (let cy = minCellY; cy <= minCellY + spanY; cy++) {
        keys.add(`${cx},${cy}`);
      }
    }
    return keys;
  }
  /**
   * Insert an entry into the spatial grid.
   * @param {Object} entry Object identifier (collider, entity, etc.)
   * @param {Object} bounds { left, right, top, bottom }
   */
  insert(entry, bounds) {
    if (!entry) throw new TypeError("entry cannot be null or undefined");
    if (this.entryCells.has(entry)) {
      this.remove(entry);
    }
    const keys = this.getCellKeysForBounds(bounds);
    this.entryCells.set(entry, keys);
    this.entryBounds.set(entry, { ...bounds });
    for (const key of keys) {
      let bucket = this.cells.get(key);
      if (!bucket) {
        bucket = /* @__PURE__ */ new Set();
        this.cells.set(key, bucket);
      }
      bucket.add(entry);
    }
  }
  /**
   * Update an entry's position and bounding box.
   * If the cell coverage did not change, avoids bucket re-insertions.
   * @param {Object} entry
   * @param {Object} newBounds
   * @returns {boolean} Whether spatial bucket assignment changed
   */
  update(entry, newBounds) {
    if (!this.entryCells.has(entry)) {
      this.insert(entry, newBounds);
      return true;
    }
    const currentKeys = this.entryCells.get(entry);
    const newKeys = this.getCellKeysForBounds(newBounds);
    let changed = currentKeys.size !== newKeys.size;
    if (!changed) {
      for (const key of currentKeys) {
        if (!newKeys.has(key)) {
          changed = true;
          break;
        }
      }
    }
    this.entryBounds.set(entry, { ...newBounds });
    if (!changed) return false;
    for (const key of currentKeys) {
      if (!newKeys.has(key)) {
        const bucket = this.cells.get(key);
        if (bucket) {
          bucket.delete(entry);
          if (bucket.size === 0) this.cells.delete(key);
        }
      }
    }
    for (const key of newKeys) {
      if (!currentKeys.has(key)) {
        let bucket = this.cells.get(key);
        if (!bucket) {
          bucket = /* @__PURE__ */ new Set();
          this.cells.set(key, bucket);
        }
        bucket.add(entry);
      }
    }
    this.entryCells.set(entry, newKeys);
    return true;
  }
  /**
   * Teleport an entry instantly to new bounds.
   * @param {Object} entry
   * @param {Object} newBounds
   */
  teleport(entry, newBounds) {
    this.update(entry, newBounds);
  }
  /**
   * Remove an entry from all cells.
   * @param {Object} entry
   * @returns {boolean} Whether entry was present and removed
   */
  remove(entry) {
    const keys = this.entryCells.get(entry);
    if (!keys) return false;
    for (const key of keys) {
      const bucket = this.cells.get(key);
      if (bucket) {
        bucket.delete(entry);
        if (bucket.size === 0) {
          this.cells.delete(key);
        }
      }
    }
    this.entryCells.delete(entry);
    this.entryBounds.delete(entry);
    return true;
  }
  /**
   * Query all unique entries whose bounding box overlaps the given AABB.
   * @param {Object} bounds { left, right, top, bottom }
   * @returns {Array<Object>}
   */
  queryAABB(bounds) {
    const keys = this.getCellKeysForBounds(bounds);
    const candidateEntries = /* @__PURE__ */ new Set();
    for (const key of keys) {
      const bucket = this.cells.get(key);
      if (bucket) {
        for (const entry of bucket) {
          candidateEntries.add(entry);
        }
      }
    }
    const results = [];
    for (const entry of candidateEntries) {
      const b = this.entryBounds.get(entry);
      if (!b) continue;
      if (b.left < bounds.right && b.right > bounds.left && b.top < bounds.bottom && b.bottom > bounds.top) {
        results.push(entry);
      }
    }
    return results;
  }
  /**
   * Query all unique entries within a circular radius of a point.
   * @param {number} x Center X
   * @param {number} y Center Y
   * @param {number} radius Search radius
   * @returns {Array<Object>}
   */
  queryRadius(x, y, radius) {
    finiteNumber4(x, "x");
    finiteNumber4(y, "y");
    finiteNumber4(radius, "radius");
    if (radius < 0) throw new RangeError("radius must be non-negative");
    const aabb = {
      left: x - radius,
      right: x + radius,
      top: y - radius,
      bottom: y + radius
    };
    const candidates = this.queryAABB(aabb);
    const radiusSq = radius * radius;
    const results = [];
    for (const entry of candidates) {
      const b = this.entryBounds.get(entry);
      if (!b) continue;
      const closestX = Math.max(b.left, Math.min(x, b.right));
      const closestY = Math.max(b.top, Math.min(y, b.bottom));
      const distSq = (x - closestX) ** 2 + (y - closestY) ** 2;
      if (distSq <= radiusSq) {
        results.push(entry);
      }
    }
    return results;
  }
  /**
   * Generate unique potential collision pairs across all cells.
   * Returns an array of [entryA, entryB] pairs with deterministic ordering.
   * @returns {Array<Array>}
   */
  getPotentialCollisionPairs() {
    const seenPairs = /* @__PURE__ */ new Set();
    const pairs = [];
    for (const bucket of this.cells.values()) {
      if (bucket.size < 2) continue;
      const entries = [...bucket];
      for (let i = 0; i < entries.length; i++) {
        const a = entries[i];
        const idA = this._id(a);
        for (let j = i + 1; j < entries.length; j++) {
          const b = entries[j];
          const idB = this._id(b);
          const pairKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            const boundsA = this.entryBounds.get(a);
            const boundsB = this.entryBounds.get(b);
            if (boundsA && boundsB && boundsA.left < boundsB.right && boundsA.right > boundsB.left && boundsA.top < boundsB.bottom && boundsA.bottom > boundsB.top) {
              pairs.push(idA < idB ? [a, b] : [b, a]);
            }
          }
        }
      }
    }
    return pairs;
  }
  /**
   * Clear all cells and entries (e.g. on scene unload).
   */
  clear() {
    this.cells.clear();
    this.entryCells.clear();
    this.entryBounds.clear();
  }
  /**
   * Get the count of tracked entries.
   * @returns {number}
   */
  get size() {
    return this.entryCells.size;
  }
};

// src/nereid/tilecollision.js
init_transform();
init_entity();
var TileCollision = class {
  /**
   * @param {Tilemap} tilemap - The tilemap to check against.
   */
  constructor(tilemap) {
    this.tilemap = tilemap;
  }
  /**
   * Resolve collision for an entity with Body and Collider.
   * @param {Entity} entity 
   * @param {number} deltaTime 
   */
  resolve(entity, deltaTime) {
    if (!isEntityActive(entity)) return;
    const transform = entity.GetComponent(Transform);
    const body = entity.GetComponent(Body);
    const collider = entity.GetComponent(Collider);
    if (!transform || !body || !collider) return;
    const tw = this.tilemap.tileset.tileWidth * this.tilemap.scale;
    const th = this.tilemap.tileset.tileHeight * this.tilemap.scale;
    const newX = transform.position.x + body.velocity.x * deltaTime;
    const boundsX = collider.getBounds(newX, transform.position.y);
    const leftTile = Math.floor(boundsX.left / tw);
    const rightTile = Math.floor(boundsX.right / tw);
    const topTile = Math.floor(boundsX.top / th);
    const bottomTile = Math.floor(boundsX.bottom / th);
    let collisionX = false;
    for (let ty = topTile; ty <= bottomTile && !collisionX; ty++) {
      for (let tx = leftTile; tx <= rightTile && !collisionX; tx++) {
        if (this.tilemap.isSolid(tx, ty)) {
          collisionX = true;
          if (body.velocity.x > 0) {
            transform.position.x = tx * tw - collider.width - collider.offsetX;
          } else if (body.velocity.x < 0) {
            transform.position.x = (tx + 1) * tw - collider.offsetX;
          }
          body.velocity.x = 0;
        }
      }
    }
    if (!collisionX) {
      transform.position.x = newX;
    }
    const newY = transform.position.y + body.velocity.y * deltaTime;
    const boundsY = collider.getBounds(transform.position.x, newY);
    const leftTile2 = Math.floor(boundsY.left / tw);
    const rightTile2 = Math.floor(boundsY.right / tw);
    const topTile2 = Math.floor(boundsY.top / th);
    const bottomTile2 = Math.floor(boundsY.bottom / th);
    let collisionY = false;
    body.grounded = false;
    for (let ty = topTile2; ty <= bottomTile2 && !collisionY; ty++) {
      for (let tx = leftTile2; tx <= rightTile2 && !collisionY; tx++) {
        if (this.tilemap.isSolid(tx, ty)) {
          collisionY = true;
          if (body.velocity.y > 0) {
            transform.position.y = ty * th - collider.height - collider.offsetY;
            body.grounded = true;
          } else if (body.velocity.y < 0) {
            transform.position.y = (ty + 1) * th - collider.offsetY;
          }
          body.velocity.y = 0;
        }
      }
    }
    if (!collisionY) {
      transform.position.y = newY;
    }
  }
};

// src/nereid/platformerController.js
init_component();
var PlatformerController = class extends Component {
  constructor() {
    super();
    this.moveSpeed = 300;
    this.acceleration = 2e3;
    this.deceleration = 2500;
    this.jumpForce = 400;
    this.variableJumpMultiplier = 0.5;
    this.coyoteTime = 0.1;
    this.coyoteTimer = 0;
    this.jumpBufferTime = 0.1;
    this.jumpBufferTimer = 0;
    this.facingRight = true;
    this.isJumping = false;
    this._body = null;
  }
  /**
   * Move horizontally.
   * @param {number} direction - -1 for left, 1 for right, 0 for none.
   * @param {number} deltaTime 
   */
  move(direction, deltaTime) {
    if (!this._body && this.entity) {
      this._body = this.entity.GetComponent(Body);
    }
    if (!this._body) return;
    const targetSpeed = direction * this.moveSpeed;
    const speedDiff = targetSpeed - this._body.velocity.x;
    const accel = Math.abs(targetSpeed) > 0.1 ? this.acceleration : this.deceleration;
    const force = Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), accel * deltaTime);
    this._body.velocity.x += force;
    if (direction !== 0) {
      this.facingRight = direction > 0;
    }
  }
  /**
   * Request a jump. Uses coyote time and jump buffering.
   */
  jump() {
    this.jumpBufferTimer = this.jumpBufferTime;
  }
  /**
   * Release jump button (for variable jump height).
   */
  releaseJump() {
    if (!this._body) return;
    if (this.isJumping && this._body.velocity.y < 0) {
      this._body.velocity.y *= this.variableJumpMultiplier;
    }
    this.isJumping = false;
  }
  /**
   * Update controller state. Call each frame.
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    if (!this._body && this.entity) {
      this._body = this.entity.GetComponent(Body);
    }
    if (!this._body) return;
    if (this._body.grounded) {
      this.coyoteTimer = this.coyoteTime;
      this.isJumping = false;
    } else {
      this.coyoteTimer -= deltaTime;
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= deltaTime;
    }
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this._body.velocity.y = -this.jumpForce;
      this.isJumping = true;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this._body.grounded = false;
    }
  }
};

// src/nereid/topDownController.js
init_component();
init_transform();
init_sceneManager();
init_entity();
function boxColliderToCollider(box, options = {}) {
  if (!(box instanceof BoxCollider)) throw new TypeError("boxColliderToCollider requires a BoxCollider");
  const { width, height } = { width: box.size?.x, height: box.size?.y };
  const offsetX = box.offset?.x ?? 0;
  const offsetY = box.offset?.y ?? 0;
  if (![width, height, offsetX, offsetY].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new TypeError("BoxCollider must have positive finite dimensions and finite offsets");
  }
  const collider = new Collider(width, height, offsetX - width / 2, offsetY - height / 2, {
    role: options.role ?? "solid",
    layer: box.layer ?? box.properties?.layer ?? 1,
    mask: box.mask ?? box.properties?.mask ?? 4294967295
  });
  collider.enabled = options.enabled ?? (box.enabled !== false && box.properties?.enabled !== false);
  return collider;
}
function collidersForEntity(entity) {
  const result = [];
  for (const component of entity.components ?? []) {
    if (component instanceof Collider) result.push(component);
    else if (component instanceof BoxCollider) result.push(boxColliderToCollider(component));
  }
  return result;
}
function collectSceneEntries(scene, excludedEntity) {
  const entries = [];
  const visit = (entity) => {
    if (!isEntityActive(entity)) return;
    if (entity !== excludedEntity) {
      const transform = entity.GetComponent?.(Transform);
      if (transform) for (const collider of collidersForEntity(entity)) entries.push({ entity, collider, x: transform.position.x, y: transform.position.y });
    }
    for (const child of entity.children ?? []) visit(child);
  };
  for (const child of scene?.children ?? []) visit(child);
  return entries;
}
var TopDownController = class extends Component {
  constructor({ speed = 4, maxSubstep = 0.2, collider = null, obstacles = null } = {}) {
    super();
    if (!Number.isFinite(speed) || speed < 0) throw new TypeError("TopDownController speed must be finite and non-negative");
    if (!Number.isFinite(maxSubstep) || maxSubstep <= 0) throw new TypeError("maxSubstep must be positive and finite");
    if (collider !== null && !(collider instanceof Collider) && !(collider instanceof BoxCollider)) throw new TypeError("collider must be a Nereid Collider or BoxCollider");
    if (collider instanceof Collider && collider.role !== "solid") throw new TypeError("TopDownController requires a solid movement collider");
    if (obstacles !== null && !Array.isArray(obstacles)) throw new TypeError("obstacles must be an array of collider entries");
    this.speed = speed;
    this.maxSubstep = maxSubstep;
    this.collider = collider;
    this.obstacles = obstacles;
  }
  /** Move by a direction vector and elapsed seconds; returns the final position. */
  move(direction, deltaTime, obstacles = this.obstacles) {
    if (!direction || !Number.isFinite(direction.x) || !Number.isFinite(direction.y)) throw new TypeError("direction must have finite x and y");
    if (!Number.isFinite(deltaTime) || deltaTime < 0) throw new TypeError("deltaTime must be finite and non-negative");
    if (obstacles !== null && !Array.isArray(obstacles)) throw new TypeError("obstacles must be an array or null");
    const transform = this.entity?.GetComponent?.(Transform);
    if (!transform) throw new Error("TopDownController requires an entity with Transform");
    let collider = this.collider ?? collidersForEntity(this.entity).find((item) => item.role === "solid") ?? null;
    if (collider instanceof BoxCollider) collider = boxColliderToCollider(collider);
    if (!(collider instanceof Collider)) collider = new Collider(0.5, 0.5, -0.25, -0.25);
    const magnitude = Math.hypot(direction.x, direction.y);
    if (magnitude === 0 || deltaTime === 0 || this.speed === 0) return { x: transform.position.x, y: transform.position.y };
    const normalized = magnitude > 1 ? { x: direction.x / magnitude, y: direction.y / magnitude } : direction;
    const dx = normalized.x * this.speed * deltaTime;
    const dy = normalized.y * this.speed * deltaTime;
    const automatic = obstacles === null ? collectSceneEntries(SceneManager.GetActiveScene(), this.entity) : null;
    const entries = obstacles ?? automatic;
    const allEntries = entries.map((entry) => {
      if (entry instanceof Collider || entry instanceof BoxCollider) return { collider: entry instanceof BoxCollider ? boxColliderToCollider(entry) : entry, x: entry.entity?.GetComponent?.(Transform)?.position.x ?? 0, y: entry.entity?.GetComponent?.(Transform)?.position.y ?? 0, entity: entry.entity };
      if (!entry || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) throw new TypeError("Obstacle entries require finite x/y and a collider");
      const obstacle = entry.collider instanceof BoxCollider ? boxColliderToCollider(entry.collider) : entry.collider;
      if (!(obstacle instanceof Collider)) throw new TypeError("Obstacle entries require a Nereid Collider or BoxCollider");
      return { ...entry, collider: obstacle };
    }).filter((entry) => entry.collider.enabled && entry.collider.role === "solid" && entry.entity !== this.entity && isEntityActive(entry.entity ?? entry.collider.entity) && (collider.mask & entry.collider.layer) >>> 0 !== 0 && (entry.collider.mask & collider.layer) >>> 0 !== 0);
    const maxStep = Math.min(this.maxSubstep, collider.width / 2, collider.height / 2);
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep));
    if (steps > 256) throw new RangeError("TopDownController movement exceeds the safe 256-substep limit");
    const stepX = dx / steps, stepY = dy / steps;
    let x = transform.position.x, y = transform.position.y;
    const overlaps = (candidateX, candidateY) => allEntries.some((entry) => collider.overlaps(entry.collider, candidateX, candidateY, entry.x, entry.y));
    for (let index = 0; index < steps; index++) {
      const nextX = x + stepX;
      if (!overlaps(nextX, y)) x = nextX;
      const nextY = y + stepY;
      if (!overlaps(x, nextY)) y = nextY;
    }
    transform.position.x = x;
    transform.position.y = y;
    return { x, y };
  }
};

// src/input/actions.js
var keyCodes = KeyboardInput.KEY_CODE;
var aliases = { ARROWUP: "UPARROW", ARROWDOWN: "DOWNARROW", ARROWLEFT: "LEFTARROW", ARROWRIGHT: "RIGHTARROW", ESCAPE: "ESC" };
function normalizeKeys(keys) {
  const values = Array.isArray(keys) ? keys : [keys];
  if (!values.length) throw new TypeError("An input action requires at least one key binding");
  return [...new Set(values.map((key) => {
    if (Number.isInteger(key) && key >= 0) return key;
    if (typeof key !== "string" || !key.trim()) throw new TypeError("Input bindings must be key names or non-negative key codes");
    const name = key.trim().toUpperCase();
    const code = keyCodes[aliases[name] ?? name] ?? (name.length === 1 ? name.charCodeAt(0) : void 0);
    if (!Number.isInteger(code)) throw new TypeError(`Unknown keyboard binding '${key}'`);
    return code;
  }))];
}
var InputActions = class {
  #contexts = /* @__PURE__ */ new Map();
  #context = "default";
  #enabled = true;
  constructor(bindings = {}, { context = "default" } = {}) {
    if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) throw new TypeError("InputActions bindings must be an object");
    this.#context = context;
    for (const [action, keys] of Object.entries(bindings)) this.bind(action, keys);
  }
  bind(action, keys, context = this.#context) {
    if (typeof action !== "string" || !action.trim()) throw new TypeError("Input action name must be non-empty");
    if (typeof context !== "string" || !context.trim()) throw new TypeError("Input context name must be non-empty");
    if (!this.#contexts.has(context)) this.#contexts.set(context, /* @__PURE__ */ new Map());
    this.#contexts.get(context).set(action, normalizeKeys(keys));
    return this;
  }
  unbind(action, context = this.#context) {
    return this.#contexts.get(context)?.delete(action) ?? false;
  }
  setContext(context) {
    if (typeof context !== "string" || !context.trim()) throw new TypeError("Input context name must be non-empty");
    this.#context = context;
    return this;
  }
  get context() {
    return this.#context;
  }
  setEnabled(enabled) {
    this.#enabled = Boolean(enabled);
    return this;
  }
  get enabled() {
    return this.#enabled;
  }
  #keys(action) {
    return this.#enabled ? this.#contexts.get(this.#context)?.get(action) ?? [] : [];
  }
  pressed(action) {
    return this.#keys(action).some((key) => KeyboardInput.IsKeyPressed(key));
  }
  held(action) {
    return this.#keys(action).some((key) => KeyboardInput.IsKeyDown(key));
  }
  released(action) {
    return this.#keys(action).some((key) => KeyboardInput.IsKeyReleased(key));
  }
  state(action) {
    return { pressed: this.pressed(action), held: this.held(action), released: this.released(action) };
  }
  /** Clear bindings and disable this instance when its owning gameplay context ends. */
  dispose() {
    this.#contexts.clear();
    this.#enabled = false;
  }
};

// src/scripts/projectBehaviour.js
var api = Object.freeze({ Transform, Shape, Sprite, Color, KeyboardInput, InputActions, FixedStepper, SceneManager, SaveManager, BoxCollider, Camera, Larissa: larissa_exports, Nereid: nereid_exports });
function validateProjectModulePath(path) {
  if (typeof path !== "string" || path !== path.trim() || !path.endsWith(".js") || /[:\\?#%\0]/.test(path) || path.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("ProjectBehaviour.module must be a project-relative .js path");
  }
  return path;
}
var ProjectBehaviour = class extends Behaviour {
  constructor() {
    super("ProjectBehaviour");
    this._properties = { module: "", settings: {} };
    this.instance = null;
    this.error = null;
    this.disposed = false;
  }
  async loadModule() {
    let url;
    try {
      const path = validateProjectModulePath(this.properties.module);
      const response = await fetch(globalThis.__neptuneProjectResources ? `/${path}` : path);
      if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
      url = URL.createObjectURL(new Blob([await response.text()], { type: "text/javascript" }));
      const module = await import(
        /* @vite-ignore */
        url
      );
      if (this.disposed) return;
      if (typeof module.create !== "function") throw new Error(`${path} must export create(context)`);
      this.instance = module.create({ entity: this.entity, engine: api, properties: this.properties.settings });
      this.instance?.start?.();
    } catch (error) {
      if (!this.disposed) {
        this.error = error;
        try {
          this.instance?.destroy?.();
        } finally {
          this.instance = null;
        }
        console.error("PROJECT_BEHAVIOUR_LOAD_FAILED", error);
      }
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }
  Update(deltaTime) {
    if (!this.loading) {
      this.loading = true;
      void this.loadModule();
    }
    this.instance?.update?.(deltaTime);
  }
  destroy() {
    this.disposed = true;
    try {
      this.instance?.destroy?.();
    } finally {
      this.instance = null;
      super.destroy();
    }
  }
};

// src/neptune.js
init_math();
init_vec2();

// src/titan/pose.js
init_vec2();

// src/titan/animation.js
init_scene();

// src/titan/rig.js
init_component();
init_transform();

// src/titan/animator.js
init_component();

// src/thalassa/index.js
init_tileset();
init_tilemap();

// src/thalassa/parallax.js
init_component();

// src/sim/materialRegistry.js
var MaterialState = Object.freeze({
  DRY: "dry",
  WET: "wet",
  BURNING: "burning",
  CHARRED: "charred",
  EXTINGUISHED: "extinguished"
});
var InteractionType = Object.freeze({
  IGNITE: "IGNITE",
  DOUSE: "DOUSE",
  COOL: "COOL",
  DRY: "DRY",
  BURN: "BURN",
  BURNOUT: "BURNOUT",
  CHAR: "CHAR"
});
var BUILTIN_MATERIALS = Object.freeze({
  wood: Object.freeze({
    id: "wood",
    flammability: 0.6,
    conductivity: 0.1,
    viscosity: 0,
    traversalCost: 1,
    isSolid: true,
    burnDuration: 10
  }),
  stone: Object.freeze({
    id: "stone",
    flammability: 0,
    conductivity: 0.1,
    viscosity: 0,
    traversalCost: 1,
    isSolid: true,
    burnDuration: 0
  }),
  water: Object.freeze({
    id: "water",
    flammability: 0,
    conductivity: 0.8,
    viscosity: 1,
    traversalCost: 2,
    isSolid: false,
    burnDuration: 0
  }),
  grass: Object.freeze({
    id: "grass",
    flammability: 0.8,
    conductivity: 0.1,
    viscosity: 0,
    traversalCost: 1,
    isSolid: false,
    burnDuration: 4
  }),
  iron: Object.freeze({
    id: "iron",
    flammability: 0,
    conductivity: 1,
    viscosity: 0,
    traversalCost: 1,
    isSolid: true,
    burnDuration: 0
  }),
  cloth: Object.freeze({
    id: "cloth",
    flammability: 0.9,
    conductivity: 0.05,
    viscosity: 0,
    traversalCost: 1,
    isSolid: false,
    burnDuration: 5
  }),
  dirt: Object.freeze({
    id: "dirt",
    flammability: 0,
    conductivity: 0.1,
    viscosity: 0,
    traversalCost: 1,
    isSolid: false,
    burnDuration: 0
  })
});
var FALLBACK_MATERIAL = Object.freeze({
  id: "dirt",
  flammability: 0,
  conductivity: 0.1,
  viscosity: 0,
  traversalCost: 1,
  isSolid: false,
  burnDuration: 0,
  isFallback: true
});
function validateMaterialDefinition(id, def) {
  if (typeof id !== "string" || !id.trim()) {
    throw new TypeError("Material ID must be a non-empty string");
  }
  if (!def || typeof def !== "object") {
    throw new TypeError(`Material definition for "${id}" must be an object`);
  }
  const flammability = Number(def.flammability ?? 0);
  if (!Number.isFinite(flammability) || flammability < 0 || flammability > 1) {
    throw new RangeError(`Material "${id}" flammability must be a number between 0 and 1, got ${def.flammability}`);
  }
  const conductivity = Number(def.conductivity ?? 0);
  if (!Number.isFinite(conductivity) || conductivity < 0 || conductivity > 1) {
    throw new RangeError(`Material "${id}" conductivity must be a number between 0 and 1, got ${def.conductivity}`);
  }
  const viscosity = Number(def.viscosity ?? 0);
  if (!Number.isFinite(viscosity) || viscosity < 0) {
    throw new RangeError(`Material "${id}" viscosity must be a non-negative number, got ${def.viscosity}`);
  }
  const traversalCost = Number(def.traversalCost ?? 1);
  if (!Number.isFinite(traversalCost) || traversalCost < 1) {
    throw new RangeError(`Material "${id}" traversalCost must be a number >= 1, got ${def.traversalCost}`);
  }
  const isSolid = Boolean(def.isSolid);
  const burnDuration = Number(def.burnDuration ?? 0);
  if (!Number.isFinite(burnDuration) || burnDuration < 0) {
    throw new RangeError(`Material "${id}" burnDuration must be a non-negative number, got ${def.burnDuration}`);
  }
  return Object.freeze({
    id,
    flammability,
    conductivity,
    viscosity,
    traversalCost,
    isSolid,
    burnDuration,
    ...def.tags ? { tags: Object.freeze([...def.tags]) } : {},
    ...def.description ? { description: String(def.description) } : {}
  });
}
var MaterialRegistry = class _MaterialRegistry {
  static _defaultInstance = null;
  /**
   * Get the default singleton instance of MaterialRegistry.
   * @returns {MaterialRegistry}
   */
  static getDefault() {
    if (!_MaterialRegistry._defaultInstance) {
      _MaterialRegistry._defaultInstance = new _MaterialRegistry();
    }
    return _MaterialRegistry._defaultInstance;
  }
  /**
   * Static helper to register a material definition on the default registry.
   */
  static register(id, def) {
    return _MaterialRegistry.getDefault().register(id, def);
  }
  /**
   * Static helper to get a material definition from the default registry.
   */
  static get(id, options) {
    return _MaterialRegistry.getDefault().get(id, options);
  }
  /**
   * Static helper to check if a material definition exists in the default registry.
   */
  static has(id) {
    return _MaterialRegistry.getDefault().has(id);
  }
  /**
   * Static helper to reset the default registry to built-ins.
   */
  static reset() {
    return _MaterialRegistry.getDefault().reset();
  }
  /**
   * Static access to the default registry's diagnostic log.
   */
  static get diagnostics() {
    return _MaterialRegistry.getDefault().diagnostics;
  }
  constructor() {
    this._materials = /* @__PURE__ */ new Map();
    this.diagnostics = [];
    this._fallbackId = "dirt";
    this._customFallback = null;
    this.onDiagnostic = null;
    this._registerBuiltins();
  }
  _registerBuiltins() {
    for (const [id, def] of Object.entries(BUILTIN_MATERIALS)) {
      this._materials.set(id, def);
    }
  }
  /**
   * Register or update a material definition.
   * @param {string} id - Unique material identifier.
   * @param {object} def - Material properties.
   * @returns {object} The registered material definition.
   */
  register(id, def) {
    const validated = validateMaterialDefinition(id, def);
    this._materials.set(id, validated);
    return validated;
  }
  /**
   * Check if a material is registered.
   * @param {string} id - Material identifier.
   * @returns {boolean}
   */
  has(id) {
    if (typeof id !== "string") return false;
    return this._materials.has(id);
  }
  /**
   * Query a material definition by ID with fallback handling and diagnostic warning.
   * @param {string} id - Material identifier.
   * @param {object} [options]
   * @param {boolean} [options.suppressWarning=false] - Whether to suppress console warning.
   * @returns {object} The material definition or fallback.
   */
  get(id, { suppressWarning = false } = {}) {
    if (typeof id === "string" && this._materials.has(id)) {
      return this._materials.get(id);
    }
    const fallbackDef = this._getFallbackDefinition();
    const message = `[MaterialRegistry] Material "${id}" not found. Falling back to default material "${fallbackDef.id}".`;
    const diagnosticEntry = {
      type: "MISSING_MATERIAL",
      materialId: id,
      fallbackId: fallbackDef.id,
      message,
      timestamp: Date.now()
    };
    this.diagnostics.push(diagnosticEntry);
    if (typeof this.onDiagnostic === "function") {
      try {
        this.onDiagnostic(diagnosticEntry);
      } catch (err) {
        console.error("[MaterialRegistry] Error in diagnostic listener:", err);
      }
    }
    if (!suppressWarning) {
      console.warn(message);
    }
    return fallbackDef;
  }
  /**
   * Get fallback definition.
   * @private
   */
  _getFallbackDefinition() {
    if (this._customFallback) return this._customFallback;
    if (this._materials.has(this._fallbackId)) {
      return this._materials.get(this._fallbackId);
    }
    return FALLBACK_MATERIAL;
  }
  /**
   * Configure the fallback material.
   * @param {string|object} fallback - Material ID or definition.
   */
  setFallback(fallback) {
    if (typeof fallback === "string") {
      this._fallbackId = fallback;
      this._customFallback = null;
    } else if (fallback && typeof fallback === "object") {
      this._customFallback = validateMaterialDefinition(fallback.id || "custom_fallback", fallback);
    }
  }
  /**
   * Unregister a material definition.
   * @param {string} id
   * @returns {boolean}
   */
  unregister(id) {
    return this._materials.delete(id);
  }
  /**
   * Reset registry to default built-in materials and clear diagnostics.
   */
  reset() {
    this._materials.clear();
    this.diagnostics.length = 0;
    this._fallbackId = "dirt";
    this._customFallback = null;
    this._registerBuiltins();
  }
  /**
   * Get all registered material definitions as an array.
   * @returns {Array<object>}
   */
  getAll() {
    return Array.from(this._materials.values());
  }
  /**
   * Get all registered material IDs.
   * @returns {Array<string>}
   */
  getIds() {
    return Array.from(this._materials.keys());
  }
};
var InteractionResult = class {
  constructor({ state, previousState, materialId, material, intensity, interactions, applied }) {
    this.state = state;
    this.previousState = previousState;
    this.materialId = materialId;
    this.material = material;
    this.intensity = intensity;
    this.interactions = Object.freeze([...interactions]);
    this.applied = applied;
    const traversal = MaterialInteraction.getEffectiveTraversalCost({ materialId, state, material });
    this.traversalCost = traversal;
    const hazard = MaterialInteraction.getHazardStatus({ materialId, state, material });
    this.hazard = hazard;
    this.isHazard = hazard.isHazard;
  }
  toString() {
    return this.state;
  }
  valueOf() {
    return this.state;
  }
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return NaN;
    return this.state;
  }
};
var MaterialInteraction = class _MaterialInteraction {
  /**
   * Query effective traversal cost based on material attributes and current state.
   * Supports both getEffectiveTraversalCost(materialId, state) and getEffectiveTraversalCost({ materialId, state }).
   *
   * @param {string|object} arg1 - materialId or options object.
   * @param {string} [arg2] - state if arg1 is materialId.
   * @returns {number} Effective traversal cost (>= 1.0).
   */
  static getEffectiveTraversalCost(arg1, arg2) {
    let materialId;
    let state;
    let material = null;
    let registry = MaterialRegistry.getDefault();
    if (typeof arg1 === "object" && arg1 !== null) {
      materialId = arg1.materialId;
      state = arg1.state;
      material = arg1.material ?? null;
      if (arg1.registry) registry = arg1.registry;
    } else {
      materialId = arg1;
      state = arg2;
    }
    const normalizedState = (state || MaterialState.DRY).toLowerCase();
    const mat = material || (typeof materialId === "object" && materialId !== null ? materialId : registry.get(materialId));
    const baseCost = mat.traversalCost ?? 1;
    switch (normalizedState) {
      case MaterialState.BURNING:
        return Math.max(1, baseCost + 2);
      case MaterialState.WET:
        if (mat.id === "water") {
          return Math.max(1, baseCost);
        }
        return Math.max(1, baseCost * 1.5);
      case MaterialState.CHARRED:
        return Math.max(1, baseCost * 1.2);
      case MaterialState.EXTINGUISHED:
        return Math.max(1, baseCost * 1.3);
      case MaterialState.DRY:
      default:
        return Math.max(1, baseCost);
    }
  }
  /**
   * Query hazard status based on material attributes and current state.
   * Supports both getHazardStatus(materialId, state) and getHazardStatus({ materialId, state }).
   *
   * @param {string|object} arg1 - materialId or options object.
   * @param {string} [arg2] - state if arg1 is materialId.
   * @returns {{ isHazard: boolean, type: string|null, severity: number, description: string }}
   */
  static getHazardStatus(arg1, arg2) {
    let materialId;
    let state;
    let material = null;
    let registry = MaterialRegistry.getDefault();
    if (typeof arg1 === "object" && arg1 !== null) {
      materialId = arg1.materialId;
      state = arg1.state;
      material = arg1.material ?? null;
      if (arg1.registry) registry = arg1.registry;
    } else {
      materialId = arg1;
      state = arg2;
    }
    const normalizedState = (state || MaterialState.DRY).toLowerCase();
    const mat = material || (typeof materialId === "object" && materialId !== null ? materialId : registry.get(materialId));
    if (normalizedState === MaterialState.BURNING) {
      return Object.freeze({
        isHazard: true,
        type: "fire",
        severity: 2,
        description: `Burning ${mat.id || "material"} deals fire damage to occupants`
      });
    }
    return Object.freeze({
      isHazard: false,
      type: null,
      severity: 0,
      description: "Safe"
    });
  }
  /**
   * Check if the material and state combination constitutes a hazard.
   * @param {string|object} arg1 - materialId or options object.
   * @param {string} [arg2] - state.
   * @returns {boolean}
   */
  static isHazard(arg1, arg2) {
    return _MaterialInteraction.getHazardStatus(arg1, arg2).isHazard;
  }
  /**
   * Query traversal cost and hazard status together.
   * @param {object} query - Query parameters { materialId, state }.
   * @returns {object}
   */
  static query({ materialId, state, registry = MaterialRegistry.getDefault() }) {
    const mat = registry.get(materialId);
    return {
      materialId: mat.id,
      state: (state || MaterialState.DRY).toLowerCase(),
      traversalCost: _MaterialInteraction.getEffectiveTraversalCost({ materialId: mat.id, state, material: mat, registry }),
      hazard: _MaterialInteraction.getHazardStatus({ materialId: mat.id, state, material: mat, registry }),
      isHazard: _MaterialInteraction.isHazard({ materialId: mat.id, state, material: mat, registry })
    };
  }
  /**
   * Compute next state and apply interaction rules.
   *
   * @param {object} params
   * @param {string} params.state - Current state: 'dry', 'wet', 'burning', 'charred', 'extinguished'.
   * @param {string|Array<string>} [params.interaction] - Single interaction or list of interactions.
   * @param {Array<string>} [params.interactions] - Alternative array of interactions.
   * @param {string|object} params.materialId - Material identifier or definition object.
   * @param {number} [params.intensity=1] - Intensity of interaction (>= 0).
   * @param {number} [params.moistureThreshold=1.0] - Threshold that intensity must exceed to ignite wet material.
   * @param {MaterialRegistry} [params.registry] - Optional custom MaterialRegistry.
   * @param {number} [params.elapsedTicks] - Optional elapsed burn duration ticks.
   * @param {boolean} [params.returnStateOnly=false] - If true, returns only the state string.
   * @returns {InteractionResult|string}
   */
  static applyInteraction({
    state = MaterialState.DRY,
    interaction,
    interactions,
    materialId,
    intensity = 1,
    moistureThreshold = 1,
    registry = MaterialRegistry.getDefault(),
    elapsedTicks,
    returnStateOnly = false
  } = {}) {
    const normalizedCurrentState = (state || MaterialState.DRY).toLowerCase();
    const mat = typeof materialId === "object" && materialId !== null ? materialId : registry.get(materialId);
    const requestedList = [];
    if (Array.isArray(interaction)) {
      requestedList.push(...interaction);
    } else if (typeof interaction === "string") {
      const tokens = interaction.split(/[,_+&|\s]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
      requestedList.push(...tokens);
    }
    if (Array.isArray(interactions)) {
      requestedList.push(...interactions);
    }
    const normalizedInteractions = requestedList.map((i) => String(i).toUpperCase());
    const hasIgnite = normalizedInteractions.includes(InteractionType.IGNITE);
    const hasDouse = normalizedInteractions.includes(InteractionType.DOUSE) || normalizedInteractions.includes("EXTINGUISH");
    const hasCool = normalizedInteractions.includes(InteractionType.COOL);
    const hasDry = normalizedInteractions.includes(InteractionType.DRY);
    const hasBurnOut = normalizedInteractions.includes(InteractionType.BURN) || normalizedInteractions.includes(InteractionType.BURNOUT) || normalizedInteractions.includes(InteractionType.CHAR);
    let nextState = normalizedCurrentState;
    const effectiveInteractions = [...normalizedInteractions];
    if (hasIgnite && (hasDouse || hasCool)) {
      const igniteIndex = effectiveInteractions.indexOf(InteractionType.IGNITE);
      if (igniteIndex !== -1) {
        effectiveInteractions.splice(igniteIndex, 1);
      }
    }
    if (hasDouse) {
      if (normalizedCurrentState === MaterialState.BURNING) {
        nextState = MaterialState.EXTINGUISHED;
      } else if (normalizedCurrentState === MaterialState.DRY) {
        nextState = MaterialState.WET;
      } else if (normalizedCurrentState === MaterialState.WET) {
        nextState = MaterialState.WET;
      } else if (normalizedCurrentState === MaterialState.EXTINGUISHED) {
        nextState = MaterialState.EXTINGUISHED;
      } else if (normalizedCurrentState === MaterialState.CHARRED) {
        nextState = MaterialState.CHARRED;
      }
    } else if (hasCool) {
      if (normalizedCurrentState === MaterialState.BURNING) {
        nextState = MaterialState.EXTINGUISHED;
      }
    } else if (hasIgnite) {
      if ((mat.flammability ?? 0) === 0) {
        nextState = normalizedCurrentState;
      } else if (normalizedCurrentState === MaterialState.CHARRED) {
        nextState = MaterialState.CHARRED;
      } else if (normalizedCurrentState === MaterialState.WET) {
        if (intensity > moistureThreshold) {
          nextState = MaterialState.BURNING;
        } else {
          nextState = MaterialState.WET;
        }
      } else if (normalizedCurrentState === MaterialState.EXTINGUISHED) {
        if (intensity > moistureThreshold) {
          nextState = MaterialState.BURNING;
        } else {
          nextState = MaterialState.EXTINGUISHED;
        }
      } else if (normalizedCurrentState === MaterialState.DRY) {
        nextState = MaterialState.BURNING;
      } else if (normalizedCurrentState === MaterialState.BURNING) {
        nextState = MaterialState.BURNING;
      }
    } else if (hasDry) {
      if (normalizedCurrentState === MaterialState.WET || normalizedCurrentState === MaterialState.EXTINGUISHED) {
        nextState = MaterialState.DRY;
      }
    } else if (hasBurnOut) {
      if (normalizedCurrentState === MaterialState.BURNING) {
        nextState = MaterialState.CHARRED;
      }
    }
    if (nextState === MaterialState.BURNING && Number.isFinite(elapsedTicks)) {
      if (elapsedTicks >= (mat.burnDuration ?? 0)) {
        nextState = MaterialState.CHARRED;
      }
    }
    if (returnStateOnly) {
      return nextState;
    }
    return new InteractionResult({
      state: nextState,
      previousState: normalizedCurrentState,
      materialId: mat.id,
      material: mat,
      intensity,
      interactions: effectiveInteractions,
      applied: nextState !== normalizedCurrentState
    });
  }
  /**
   * Helper to compute only the next state string.
   * @param {object} params - Same parameters as applyInteraction.
   * @returns {string} The next state string.
   */
  static transition(params) {
    return _MaterialInteraction.applyInteraction({ ...params, returnStateOnly: true });
  }
  /**
   * Advance burning progression. Transitions to CHARRED when duration met.
   * @param {object} params
   * @param {string} params.state - Current state.
   * @param {string|object} params.materialId - Material identifier or definition.
   * @param {number} [params.elapsedTicks=1] - Ticks to advance or total elapsed ticks.
   * @param {number} [params.currentBurnTicks=0] - Ticks already burned.
   * @param {MaterialRegistry} [params.registry]
   * @returns {InteractionResult}
   */
  static advanceBurn({
    state = MaterialState.BURNING,
    materialId,
    elapsedTicks = 1,
    currentBurnTicks = 0,
    registry = MaterialRegistry.getDefault()
  } = {}) {
    const mat = typeof materialId === "object" && materialId !== null ? materialId : registry.get(materialId);
    const totalTicks = currentBurnTicks + elapsedTicks;
    const shouldChar = state === MaterialState.BURNING && totalTicks >= (mat.burnDuration ?? 0);
    return _MaterialInteraction.applyInteraction({
      state,
      interaction: shouldChar ? InteractionType.BURNOUT : void 0,
      materialId: mat.id,
      elapsedTicks: totalTicks,
      registry
    });
  }
};
var materialRegistry_default = {
  MaterialRegistry,
  MaterialInteraction,
  MaterialState,
  InteractionType,
  BUILTIN_MATERIALS,
  FALLBACK_MATERIAL
};

// src/thalassa/navigationGrid.js
var MinHeap = class {
  constructor() {
    this._heap = [];
  }
  /**
   * @returns {number} Number of items in heap.
   */
  get size() {
    return this._heap.length;
  }
  /**
   * @returns {boolean} True if empty.
   */
  isEmpty() {
    return this._heap.length === 0;
  }
  /**
   * Push an item into the priority queue.
   * @param {Object} item - Heap item with f, h, and order properties.
   */
  push(item) {
    this._heap.push(item);
    this._bubbleUp(this._heap.length - 1);
  }
  /**
   * Remove and return the lowest-cost item.
   * @returns {Object|null} Lowest cost item, or null if empty.
   */
  pop() {
    if (this._heap.length === 0) return null;
    const top = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0 && last !== void 0) {
      this._heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  /**
   * @private
   */
  _compare(a, b) {
    if (a.f !== b.f) return a.f - b.f;
    if (a.h !== b.h) return a.h - b.h;
    return a.order - b.order;
  }
  /**
   * @private
   */
  _bubbleUp(index) {
    const item = this._heap[index];
    while (index > 0) {
      const parentIndex = index - 1 >> 1;
      const parent = this._heap[parentIndex];
      if (this._compare(item, parent) >= 0) break;
      this._heap[index] = parent;
      index = parentIndex;
    }
    this._heap[index] = item;
  }
  /**
   * @private
   */
  _sinkDown(index) {
    const item = this._heap[index];
    const length = this._heap.length;
    const halfLength = length >> 1;
    while (index < halfLength) {
      const leftChild = (index << 1) + 1;
      const rightChild = leftChild + 1;
      let bestChild = leftChild;
      if (rightChild < length && this._compare(this._heap[rightChild], this._heap[leftChild]) < 0) {
        bestChild = rightChild;
      }
      if (this._compare(item, this._heap[bestChild]) <= 0) break;
      this._heap[index] = this._heap[bestChild];
      index = bestChild;
    }
    this._heap[index] = item;
  }
};
var NavigationPath = class extends Array {
  /**
   * Ensure built-in Array methods like map/filter/slice return standard Arrays.
   * @returns {Function}
   */
  static get [Symbol.species]() {
    return Array;
  }
  /**
   * @param {Object|Array|number} [options] - Result options, steps array, or length
   * @param {string} [options.status] - "success", "unreachable", "out_of_bounds", or "same_start_goal"
   * @param {boolean} [options.success] - Whether a valid path was found
   * @param {Array} [options.path] - List of { x, y } steps
   * @param {number} [options.cost] - Total traversal cost
   * @param {number} [options.visitedNodes] - Nodes expanded during search
   */
  constructor(options = {}) {
    let steps = [];
    let opts = {};
    if (Array.isArray(options)) {
      steps = options;
      opts = { success: true, status: "success" };
    } else if (typeof options === "number") {
      super(options);
      this.status = "unreachable";
      this.success = false;
      this.cost = Infinity;
      this.visitedNodes = 0;
      this.path = this;
      return;
    } else if (typeof options === "object" && options !== null) {
      steps = options.path || [];
      opts = options;
    }
    super(...steps);
    this.status = opts.status || (opts.success ? "success" : "unreachable");
    this.success = Boolean(opts.success);
    this.cost = Number.isFinite(opts.cost) ? opts.cost : this.success ? 0 : Infinity;
    this.visitedNodes = opts.visitedNodes || 0;
    this.path = this;
  }
  /**
   * Whether pathfinding succeeded.
   * @returns {boolean}
   */
  isSuccess() {
    return this.success;
  }
  /**
   * Whether goal was unreachable.
   * @returns {boolean}
   */
  isUnreachable() {
    return this.status === "unreachable";
  }
  /**
   * Whether start or goal was out of bounds.
   * @returns {boolean}
   */
  isOutOfBounds() {
    return this.status === "out_of_bounds";
  }
  /**
   * Whether start and goal are the same point.
   * @returns {boolean}
   */
  isSameStartGoal() {
    return this.status === "same_start_goal";
  }
};
var NavigationGrid = class _NavigationGrid {
  /**
   * @param {number|Object} [widthOrOptions=10] - Width in tiles, or options object
   * @param {number} [height=10] - Height in tiles
   * @param {Object} [options={}] - Grid configuration options
   * @param {number} [options.defaultCost=1.0] - Default movement cost per cell
   * @param {boolean} [options.defaultWalkable=true] - Default walkability flag
   * @param {number} [options.defaultElevation=0] - Default elevation level
   * @param {number} [options.maxClimbHeight=1] - Maximum traversable height difference between adjacent cells
   * @param {boolean} [options.allowDiagonal=true] - Allow 8-way diagonal movement
   * @param {number} [options.diagonalCostMultiplier] - Multiplier for diagonal steps (default Math.SQRT2)
   */
  constructor(widthOrOptions = 10, height = 10, options = {}) {
    let width = 10;
    let h = 10;
    let opts = {};
    if (typeof widthOrOptions === "object" && widthOrOptions !== null) {
      opts = widthOrOptions;
      width = opts.width ?? 10;
      h = opts.height ?? 10;
    } else {
      width = widthOrOptions;
      h = height ?? 10;
      opts = options || {};
    }
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(h) || h <= 0) {
      throw new TypeError("NavigationGrid width and height must be positive integers");
    }
    this.width = width;
    this.height = h;
    this.defaultCost = Number.isFinite(opts.defaultCost) && opts.defaultCost >= 1 ? opts.defaultCost : 1;
    this.defaultWalkable = opts.defaultWalkable !== false;
    this.defaultElevation = Number.isFinite(opts.defaultElevation) ? opts.defaultElevation : 0;
    this.maxClimbHeight = Number.isFinite(opts.maxClimbHeight) && opts.maxClimbHeight >= 0 ? opts.maxClimbHeight : 1;
    this.allowDiagonal = opts.allowDiagonal !== false;
    this.diagonalCostMultiplier = Number.isFinite(opts.diagonalCostMultiplier) && opts.diagonalCostMultiplier > 0 ? opts.diagonalCostMultiplier : Math.SQRT2;
    const size = width * h;
    this._walkable = new Uint8Array(size).fill(this.defaultWalkable ? 1 : 0);
    this._cost = new Float32Array(size).fill(this.defaultCost);
    this._elevation = new Float32Array(size).fill(this.defaultElevation);
    this._obstacles = /* @__PURE__ */ new Map();
    this._obstacleCells = /* @__PURE__ */ new Map();
    this._nextObstacleId = 0;
    this._chunkLinks = /* @__PURE__ */ new Map();
    this._chunkLinksById = /* @__PURE__ */ new Map();
    this._nextLinkId = 0;
    this.routeVersion = 0;
    this._registeredRoutes = /* @__PURE__ */ new Map();
    this._invalidationListeners = /* @__PURE__ */ new Set();
  }
  /**
   * Map (x, y) to a flat array index.
   * @private
   * @param {number} x
   * @param {number} y
   * @returns {number} Array index, or -1 if out of bounds.
   */
  _index(x, y) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return -1;
    }
    return y * this.width + x;
  }
  /**
   * Check whether (x, y) is inside the grid bounds.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  inBounds(x, y) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  /**
   * Get cell properties at (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {Object|null} Cell state or null if out of bounds.
   */
  getCell(x, y) {
    const idx = this._index(x, y);
    if (idx === -1) return null;
    return {
      x,
      y,
      walkable: this._walkable[idx] === 1,
      cost: this._cost[idx],
      elevation: this._elevation[idx],
      isBlockedByObstacle: this.isCellBlockedByObstacle(x, y),
      effectiveWalkable: this.isWalkable(x, y)
    };
  }
  /**
   * Set multiple cell properties at once.
   * @param {number} x
   * @param {number} y
   * @param {Object} [props={}]
   * @param {boolean} [props.walkable]
   * @param {number} [props.cost]
   * @param {number} [props.elevation]
   * @returns {boolean} True if in bounds.
   */
  setCell(x, y, props = {}) {
    const idx = this._index(x, y);
    if (idx === -1) return false;
    if (props.walkable !== void 0) {
      this._walkable[idx] = props.walkable ? 1 : 0;
    }
    if (Number.isFinite(props.cost) && props.cost >= 1) {
      this._cost[idx] = props.cost;
    }
    if (Number.isFinite(props.elevation)) {
      this._elevation[idx] = props.elevation;
    }
    this.routeVersion++;
    return true;
  }
  /**
   * Check if a cell is walkable and not blocked by dynamic obstacles.
   * @param {number} x
   * @param {number} y
   * @param {boolean} [checkObstacles=true] - Whether dynamic obstacles block walkability
   * @returns {boolean}
   */
  isWalkable(x, y, checkObstacles = true) {
    const idx = this._index(x, y);
    if (idx === -1) return false;
    if (this._walkable[idx] === 0) return false;
    if (checkObstacles && this._obstacleCells.has(idx) && this._obstacleCells.get(idx).size > 0) {
      return false;
    }
    return true;
  }
  /**
   * Set walkability flag for a cell.
   * @param {number} x
   * @param {number} y
   * @param {boolean} walkable
   * @returns {boolean} True if updated.
   */
  setWalkable(x, y, walkable) {
    const idx = this._index(x, y);
    if (idx === -1) return false;
    this._walkable[idx] = walkable ? 1 : 0;
    this.routeVersion++;
    return true;
  }
  /**
   * Get traversal cost for a cell.
   * @param {number} x
   * @param {number} y
   * @returns {number} Cost value (>= 1.0) or Infinity if out of bounds / unwalkable.
   */
  getCost(x, y) {
    const idx = this._index(x, y);
    if (idx === -1 || !this.isWalkable(x, y)) return Infinity;
    return this._cost[idx];
  }
  /**
   * Set traversal cost for a cell.
   * @param {number} x
   * @param {number} y
   * @param {number} cost - Movement cost (must be >= 1.0)
   * @returns {boolean} True if updated.
   */
  setCost(x, y, cost) {
    const idx = this._index(x, y);
    if (idx === -1) return false;
    const num = Number(cost);
    if (!Number.isFinite(num) || num < 1) {
      throw new RangeError(`Traversal cost must be a finite number >= 1.0, got ${cost}`);
    }
    this._cost[idx] = num;
    this.routeVersion++;
    return true;
  }
  /**
   * Get elevation level for a cell.
   * @param {number} x
   * @param {number} y
   * @returns {number|null} Elevation level or null if out of bounds.
   */
  getElevation(x, y) {
    const idx = this._index(x, y);
    if (idx === -1) return null;
    return this._elevation[idx];
  }
  /**
   * Set elevation level for a cell.
   * @param {number} x
   * @param {number} y
   * @param {number} elevation
   * @returns {boolean} True if updated.
   */
  setElevation(x, y, elevation) {
    const idx = this._index(x, y);
    if (idx === -1) return false;
    const num = Number(elevation);
    if (!Number.isFinite(num)) {
      throw new TypeError(`Elevation must be a finite number, got ${elevation}`);
    }
    this._elevation[idx] = num;
    this.routeVersion++;
    return true;
  }
  /**
   * Set cell properties based on material definitions from SIM-01.
   * @param {number} x
   * @param {number} y
   * @param {string} materialId - Material ID (e.g., 'water', 'grass', 'wood')
   * @param {string} [state='dry'] - Material state (e.g., 'dry', 'wet', 'frozen')
   * @param {Object} [registry] - Optional MaterialRegistry instance
   * @returns {boolean} True if set.
   */
  setCellMaterial(x, y, materialId, state = "dry", registry = null) {
    const idx = this._index(x, y);
    if (idx === -1) return false;
    let cost = 1;
    try {
      cost = MaterialInteraction.getEffectiveTraversalCost({ materialId, state, registry });
    } catch (_) {
      try {
        cost = MaterialInteraction.getEffectiveTraversalCost(materialId, state);
      } catch (_2) {
        cost = 1;
      }
    }
    this._cost[idx] = Math.max(1, cost);
    this.routeVersion++;
    return true;
  }
  /**
   * Set maximum climb height difference between adjacent cells.
   * @param {number} height
   */
  setMaxClimbHeight(height) {
    const num = Number(height);
    if (!Number.isFinite(num) || num < 0) {
      throw new RangeError(`maxClimbHeight must be a finite number >= 0, got ${height}`);
    }
    this.maxClimbHeight = num;
    this.routeVersion++;
  }
  /**
   * Get maximum climb height difference.
   * @returns {number}
   */
  getMaxClimbHeight() {
    return this.maxClimbHeight;
  }
  // =========================================================================
  // Dynamic Obstacles
  // =========================================================================
  /**
   * Add a dynamic obstacle blocking one or more cells.
   * Supports both addObstacle(id, x, y, width, height) and addObstacle({ id, x, y, width, height, cells }).
   * @param {string|Object} idOrConfig
   * @param {number} [x=0]
   * @param {number} [y=0]
   * @param {number} [width=1]
   * @param {number} [height=1]
   * @returns {Object} The registered obstacle record.
   */
  addObstacle(idOrConfig, x = 0, y = 0, width = 1, height = 1) {
    let id;
    let obstacle;
    if (typeof idOrConfig === "object" && idOrConfig !== null) {
      obstacle = { ...idOrConfig };
      id = obstacle.id ? String(obstacle.id) : `obstacle_${++this._nextObstacleId}`;
    } else {
      id = String(idOrConfig || `obstacle_${++this._nextObstacleId}`);
      obstacle = { id, x, y, width, height };
    }
    if (this._obstacles.has(id)) {
      this.removeObstacle(id);
    }
    const blockedIndices = /* @__PURE__ */ new Set();
    if (Array.isArray(obstacle.cells)) {
      for (const cell of obstacle.cells) {
        const cx = Array.isArray(cell) ? cell[0] : cell.x;
        const cy = Array.isArray(cell) ? cell[1] : cell.y;
        const idx = this._index(cx, cy);
        if (idx !== -1) blockedIndices.add(idx);
      }
    } else {
      const ox = obstacle.x ?? 0;
      const oy = obstacle.y ?? 0;
      const ow = obstacle.width ?? 1;
      const oh = obstacle.height ?? 1;
      for (let row = 0; row < oh; row++) {
        for (let col = 0; col < ow; col++) {
          const idx = this._index(ox + col, oy + row);
          if (idx !== -1) blockedIndices.add(idx);
        }
      }
    }
    for (const idx of blockedIndices) {
      if (!this._obstacleCells.has(idx)) {
        this._obstacleCells.set(idx, /* @__PURE__ */ new Set());
      }
      this._obstacleCells.get(idx).add(id);
    }
    const record = {
      id,
      ...obstacle,
      blockedIndices: Array.from(blockedIndices)
    };
    this._obstacles.set(id, record);
    this.routeVersion++;
    this._notifyInvalidation({ type: "obstacle_added", obstacle: record });
    return record;
  }
  /**
   * Remove a dynamic obstacle by ID.
   * @param {string} id
   * @returns {boolean} True if removed.
   */
  removeObstacle(id) {
    const key = String(id);
    const record = this._obstacles.get(key);
    if (!record) return false;
    for (const idx of record.blockedIndices) {
      const set = this._obstacleCells.get(idx);
      if (set) {
        set.delete(key);
        if (set.size === 0) {
          this._obstacleCells.delete(idx);
        }
      }
    }
    this._obstacles.delete(key);
    this.routeVersion++;
    this._notifyInvalidation({ type: "obstacle_removed", obstacle: record });
    return true;
  }
  /**
   * Check if obstacle exists by ID.
   * @param {string} id
   * @returns {boolean}
   */
  hasObstacle(id) {
    return this._obstacles.has(String(id));
  }
  /**
   * Get obstacle by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getObstacle(id) {
    return this._obstacles.get(String(id)) || null;
  }
  /**
   * Get all active obstacles.
   * @returns {Object[]}
   */
  getObstacles() {
    return Array.from(this._obstacles.values());
  }
  /**
   * Remove all dynamic obstacles.
   */
  clearObstacles() {
    this._obstacles.clear();
    this._obstacleCells.clear();
    this.routeVersion++;
    this._notifyInvalidation({ type: "obstacles_cleared" });
  }
  /**
   * Check if a specific cell is blocked by dynamic obstacles.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isCellBlockedByObstacle(x, y) {
    const idx = this._index(x, y);
    if (idx === -1) return false;
    return this._obstacleCells.has(idx) && this._obstacleCells.get(idx).size > 0;
  }
  // =========================================================================
  // Chunk Links / Portals
  // =========================================================================
  /**
   * Add a chunk link or portal connecting two coordinates.
   * Supports both addChunkLink(fromX, fromY, toX, toY, options) and addChunkLink({ from, to, cost, bidirectional, id }).
   * @param {number|Object} linkOrFromX
   * @param {number} [fromY]
   * @param {number} [toX]
   * @param {number} [toY]
   * @param {Object} [options={}]
   * @returns {Object} The created chunk link.
   */
  addChunkLink(linkOrFromX, fromY, toX, toY, options = {}) {
    let link;
    if (typeof linkOrFromX === "object" && linkOrFromX !== null) {
      link = { ...linkOrFromX };
    } else {
      link = {
        from: { x: linkOrFromX, y: fromY },
        to: { x: toX, y: toY },
        ...options
      };
    }
    if (!link.id) {
      link.id = `link_${++this._nextLinkId}`;
    }
    link.cost = Number.isFinite(link.cost) && link.cost >= 0 ? link.cost : 1;
    link.bidirectional = link.bidirectional !== false;
    link.enabled = link.enabled !== false;
    link.from = { x: Math.floor(link.from.x), y: Math.floor(link.from.y) };
    link.to = { x: Math.floor(link.to.x), y: Math.floor(link.to.y) };
    const fromIdx = this._index(link.from.x, link.from.y);
    if (fromIdx !== -1) {
      if (!this._chunkLinks.has(fromIdx)) {
        this._chunkLinks.set(fromIdx, []);
      }
      this._chunkLinks.get(fromIdx).push(link);
    }
    if (link.bidirectional) {
      const toIdx = this._index(link.to.x, link.to.y);
      if (toIdx !== -1) {
        const reverseLink = {
          id: `${link.id}_reverse`,
          from: { x: link.to.x, y: link.to.y },
          to: { x: link.from.x, y: link.from.y },
          cost: link.cost,
          bidirectional: false,
          enabled: link.enabled,
          isReverse: true,
          parentLinkId: link.id
        };
        if (!this._chunkLinks.has(toIdx)) {
          this._chunkLinks.set(toIdx, []);
        }
        this._chunkLinks.get(toIdx).push(reverseLink);
      }
    }
    this._chunkLinksById.set(link.id, link);
    this.routeVersion++;
    this._notifyInvalidation({ type: "chunk_link_added", link });
    return link;
  }
  /**
   * Alias for addChunkLink.
   * @param {number|Object} linkOrFromX
   * @param {number} [fromY]
   * @param {number} [toX]
   * @param {number} [toY]
   * @param {Object} [options={}]
   * @returns {Object}
   */
  addPortal(linkOrFromX, fromY, toX, toY, options = {}) {
    return this.addChunkLink(linkOrFromX, fromY, toX, toY, options);
  }
  /**
   * Remove a chunk link by ID.
   * @param {string} id
   * @returns {boolean} True if removed.
   */
  removeChunkLink(id) {
    const link = this._chunkLinksById.get(id);
    if (!link) return false;
    const fromIdx = this._index(link.from.x, link.from.y);
    if (fromIdx !== -1 && this._chunkLinks.has(fromIdx)) {
      const list = this._chunkLinks.get(fromIdx).filter((l) => l.id !== id);
      if (list.length === 0) this._chunkLinks.delete(fromIdx);
      else this._chunkLinks.set(fromIdx, list);
    }
    if (link.bidirectional) {
      const revId = `${id}_reverse`;
      const toIdx = this._index(link.to.x, link.to.y);
      if (toIdx !== -1 && this._chunkLinks.has(toIdx)) {
        const list = this._chunkLinks.get(toIdx).filter((l) => l.id !== revId);
        if (list.length === 0) this._chunkLinks.delete(toIdx);
        else this._chunkLinks.set(toIdx, list);
      }
    }
    this._chunkLinksById.delete(id);
    this.routeVersion++;
    this._notifyInvalidation({ type: "chunk_link_removed", linkId: id });
    return true;
  }
  /**
   * Get outgoing chunk links from coordinate (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {Object[]}
   */
  getChunkLinks(x, y) {
    const idx = this._index(x, y);
    if (idx === -1 || !this._chunkLinks.has(idx)) return [];
    return this._chunkLinks.get(idx).filter((l) => l.enabled !== false);
  }
  /**
   * Clear all chunk links.
   */
  clearChunkLinks() {
    this._chunkLinks.clear();
    this._chunkLinksById.clear();
    this.routeVersion++;
    this._notifyInvalidation({ type: "chunk_links_cleared" });
  }
  // =========================================================================
  // Route Validation and Invalidation
  // =========================================================================
  /**
   * Validate whether an existing path remains walkable and unbroken.
   * @param {Array} path - Sequence of { x, y } step objects
   * @param {Object} [options={}] - Validation options
   * @returns {Object} Validation report { valid, blockedIndex, blockedCell, reason }
   */
  validateRoute(path, options = {}) {
    if (!Array.isArray(path) || path.length === 0) {
      return { valid: true, blockedIndex: -1, blockedCell: null, reason: null };
    }
    const maxClimb = Number.isFinite(options.maxClimbHeight) ? options.maxClimbHeight : this.maxClimbHeight;
    const preventCornerCutting = options.preventCornerCutting !== false;
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      if (!this.inBounds(step.x, step.y)) {
        return { valid: false, blockedIndex: i, blockedCell: step, reason: "out_of_bounds" };
      }
      if (!this.isWalkable(step.x, step.y)) {
        return {
          valid: false,
          blockedIndex: i,
          blockedCell: step,
          reason: this.isCellBlockedByObstacle(step.x, step.y) ? "obstacle_blocked" : "cell_unwalkable"
        };
      }
      if (i > 0) {
        const prev = path[i - 1];
        if (step.isChunkLink) {
          continue;
        }
        const dx = step.x - prev.x;
        const dy = step.y - prev.y;
        const elevDiff = Math.abs(this.getElevation(step.x, step.y) - this.getElevation(prev.x, prev.y));
        if (elevDiff > maxClimb) {
          return { valid: false, blockedIndex: i, blockedCell: step, reason: "climb_limit_exceeded" };
        }
        if (dx !== 0 && dy !== 0 && preventCornerCutting) {
          if (!this.isWalkable(prev.x + dx, prev.y) || !this.isWalkable(prev.x, prev.y + dy)) {
            return { valid: false, blockedIndex: i, blockedCell: step, reason: "corner_cutting_blocked" };
          }
        }
      }
    }
    return { valid: true, blockedIndex: -1, blockedCell: null, reason: null };
  }
  /**
   * Check if an existing path remains valid.
   * @param {Array} path - Array of { x, y }
   * @param {Object} [options={}]
   * @returns {boolean}
   */
  isRouteValid(path, options = {}) {
    return this.validateRoute(path, options).valid;
  }
  /**
   * Register a route to monitor for invalidation when obstacles change.
   * @param {string} id - Identifier for the route
   * @param {Array} path - Array of { x, y } steps
   */
  registerRoute(id, path) {
    this._registeredRoutes.set(String(id), {
      id: String(id),
      path: Array.from(path),
      registeredVersion: this.routeVersion
    });
  }
  /**
   * Unregister a monitored route.
   * @param {string} id
   * @returns {boolean} True if removed.
   */
  unregisterRoute(id) {
    return this._registeredRoutes.delete(String(id));
  }
  /**
   * Get a registered route by ID.
   * @param {string} id
   * @returns {Array|null}
   */
  getRegisteredRoute(id) {
    const entry = this._registeredRoutes.get(String(id));
    return entry ? entry.path : null;
  }
  /**
   * Query which registered routes are currently invalid.
   * @returns {string[]} List of invalidated route IDs.
   */
  getInvalidatedRoutes() {
    const invalidated = [];
    for (const [id, entry] of this._registeredRoutes) {
      if (!this.isRouteValid(entry.path)) {
        invalidated.push(id);
      }
    }
    return invalidated;
  }
  /**
   * Explicitly invalidate routes and increment version.
   * @returns {string[]} IDs of registered routes that are invalid.
   */
  invalidateRoutes() {
    this.routeVersion++;
    const invalidated = this.getInvalidatedRoutes();
    this._notifyInvalidation({ type: "routes_invalidated", invalidatedRoutes: invalidated });
    return invalidated;
  }
  /**
   * Subscribe to route invalidation events.
   * @param {Function} callback - Event listener
   * @returns {Function} Unsubscribe function
   */
  onRouteInvalidated(callback) {
    if (typeof callback === "function") {
      this._invalidationListeners.add(callback);
    }
    return () => this.offRouteInvalidated(callback);
  }
  /**
   * Remove an invalidation listener.
   * @param {Function} callback
   */
  offRouteInvalidated(callback) {
    this._invalidationListeners.delete(callback);
  }
  /**
   * @private
   */
  _notifyInvalidation(event) {
    if (this._invalidationListeners.size === 0) return;
    for (const listener of this._invalidationListeners) {
      try {
        listener({ ...event, version: this.routeVersion });
      } catch (_) {
      }
    }
  }
  // =========================================================================
  // A* Pathfinding
  // =========================================================================
  /**
   * Compute the lowest-cost path from start to goal using A*.
   * Supports both findPath(start, goal, options) and findPath(startX, startY, goalX, goalY, options).
   * @param {Object|Array|number} startArg - Starting point { x, y }, [x, y], or startX number
   * @param {Object|Array|number} goalArg - Goal point { x, y }, [x, y], or startY number
   * @param {Object|number} [optionsOrGoalX] - Options object, or goalX number
   * @param {number} [goalY] - goalY number if coordinates were passed numerically
   * @param {Object} [options] - Options object if coordinates were passed numerically
   * @param {boolean} [options.allowDiagonal] - Allow diagonal steps (default this.allowDiagonal)
   * @param {boolean} [options.preventCornerCutting=true] - Strict corner-cutting prevention past solid walls
   * @param {number} [options.maxClimbHeight] - Max traversable height diff (default this.maxClimbHeight)
   * @param {number} [options.diagonalCostMultiplier] - Multiplier for diagonal steps
   * @param {boolean} [options.includeStart=false] - Whether to include the starting tile in the path
   * @param {boolean} [options.useChunkLinks=true] - Whether to traverse chunk links/portals
   * @param {number} [options.maxCost] - Search cost cutoff limit
   * @param {Function} [options.isWalkable] - Custom walkability predicate (x, y) => boolean
   * @returns {NavigationPath} Path result containing status, success, cost, and steps.
   */
  findPath(startArg, goalArg, optionsOrGoalX, goalY, options) {
    let start = null;
    let goal = null;
    let opts = {};
    if (typeof startArg === "number" && typeof goalArg === "number" && typeof optionsOrGoalX === "number" && typeof goalY === "number") {
      start = { x: Math.floor(startArg), y: Math.floor(goalArg) };
      goal = { x: Math.floor(optionsOrGoalX), y: Math.floor(goalY) };
      opts = options || {};
    } else {
      const normalize = (pt) => {
        if (!pt) return null;
        if (Array.isArray(pt)) return { x: Math.floor(pt[0]), y: Math.floor(pt[1]) };
        if (typeof pt === "object" && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
          return { x: Math.floor(pt.x), y: Math.floor(pt.y) };
        }
        return null;
      };
      start = normalize(startArg);
      goal = normalize(goalArg);
      opts = typeof optionsOrGoalX === "object" && optionsOrGoalX !== null ? optionsOrGoalX : options || {};
    }
    if (!start || !goal || !this.inBounds(start.x, start.y) || !this.inBounds(goal.x, goal.y)) {
      return new NavigationPath({
        status: "out_of_bounds",
        success: false,
        path: [],
        cost: Infinity,
        visitedNodes: 0
      });
    }
    if (start.x === goal.x && start.y === goal.y) {
      const path = opts.includeStart ? [{ x: start.x, y: start.y, cost: 0 }] : [];
      return new NavigationPath({
        status: "same_start_goal",
        success: true,
        path,
        cost: 0,
        visitedNodes: 0
      });
    }
    const customWalkable = typeof opts.isWalkable === "function" ? opts.isWalkable : null;
    const isTileWalkable = (tx, ty) => {
      if (customWalkable) return customWalkable(tx, ty);
      return this.isWalkable(tx, ty);
    };
    if (!isTileWalkable(start.x, start.y) || !isTileWalkable(goal.x, goal.y)) {
      return new NavigationPath({
        status: "unreachable",
        success: false,
        path: [],
        cost: Infinity,
        visitedNodes: 0
      });
    }
    const allowDiagonal = opts.allowDiagonal !== void 0 ? Boolean(opts.allowDiagonal) : this.allowDiagonal;
    const preventCornerCutting = opts.preventCornerCutting !== false;
    const maxClimb = Number.isFinite(opts.maxClimbHeight) ? opts.maxClimbHeight : this.maxClimbHeight;
    const diagMultiplier = Number.isFinite(opts.diagonalCostMultiplier) ? opts.diagonalCostMultiplier : this.diagonalCostMultiplier;
    const useChunkLinks = opts.useChunkLinks !== false;
    const maxCost = Number.isFinite(opts.maxCost) ? opts.maxCost : Infinity;
    const baseDistance = (x1, y1, x2, y2) => {
      const dx = Math.abs(x1 - x2);
      const dy = Math.abs(y1 - y2);
      if (allowDiagonal) {
        const minD = Math.min(dx, dy);
        const maxD = Math.max(dx, dy);
        return minD * diagMultiplier + (maxD - minD);
      }
      return dx + dy;
    };
    const activePortals = [];
    if (useChunkLinks && this._chunkLinks.size > 0) {
      for (const linkList of this._chunkLinks.values()) {
        for (let i = 0; i < linkList.length; i++) {
          const l = linkList[i];
          if (l.enabled !== false && this.inBounds(l.to.x, l.to.y) && isTileWalkable(l.to.x, l.to.y)) {
            activePortals.push({
              from: l.from,
              to: l.to,
              cost: l.cost,
              toGoal: baseDistance(l.to.x, l.to.y, goal.x, goal.y) + l.cost
            });
          }
        }
      }
    }
    const heuristic = (x, y) => {
      let minH = baseDistance(x, y, goal.x, goal.y);
      for (let p = 0; p < activePortals.length; p++) {
        const port = activePortals[p];
        const via = baseDistance(x, y, port.from.x, port.from.y) + port.toGoal;
        if (via < minH) minH = via;
      }
      return minH;
    };
    const startIdx = this._index(start.x, start.y);
    const goalIdx = this._index(goal.x, goal.y);
    const queue = new MinHeap();
    const gScores = /* @__PURE__ */ new Map();
    const cameFrom = /* @__PURE__ */ new Map();
    const closedSet = /* @__PURE__ */ new Set();
    let insertionOrder = 0;
    let visitedNodesCount = 0;
    gScores.set(startIdx, 0);
    const startH = heuristic(start.x, start.y);
    queue.push({
      index: startIdx,
      x: start.x,
      y: start.y,
      g: 0,
      h: startH,
      f: startH,
      order: insertionOrder++
    });
    const directions = allowDiagonal ? [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ] : [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ];
    while (!queue.isEmpty()) {
      const current = queue.pop();
      if (!current) break;
      if (closedSet.has(current.index)) continue;
      if (current.g > (gScores.get(current.index) ?? Infinity)) continue;
      closedSet.add(current.index);
      visitedNodesCount++;
      if (current.index === goalIdx) {
        const steps = [];
        let stepIdx = current.index;
        while (stepIdx !== startIdx) {
          const edge = cameFrom.get(stepIdx);
          if (!edge) break;
          const stepObj = {
            x: edge.toX,
            y: edge.toY,
            cost: edge.stepCost
          };
          if (edge.isChunkLink) {
            stepObj.isChunkLink = true;
            if (edge.linkId) stepObj.linkId = edge.linkId;
          }
          steps.push(stepObj);
          stepIdx = edge.fromIdx;
        }
        if (opts.includeStart) {
          steps.push({ x: start.x, y: start.y, cost: 0 });
        }
        steps.reverse();
        return new NavigationPath({
          status: "success",
          success: true,
          path: steps,
          cost: current.g,
          visitedNodes: visitedNodesCount
        });
      }
      if (useChunkLinks) {
        const links = this.getChunkLinks(current.x, current.y);
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          const tx = link.to.x;
          const ty = link.to.y;
          if (!this.inBounds(tx, ty) || !isTileWalkable(tx, ty)) continue;
          const tIdx = this._index(tx, ty);
          if (closedSet.has(tIdx)) continue;
          const stepCost = link.cost;
          const tentG = current.g + stepCost;
          if (tentG > maxCost) continue;
          if (tentG < (gScores.get(tIdx) ?? Infinity)) {
            gScores.set(tIdx, tentG);
            cameFrom.set(tIdx, {
              fromIdx: current.index,
              toX: tx,
              toY: ty,
              stepCost,
              isChunkLink: true,
              linkId: link.id
            });
            const h = heuristic(tx, ty);
            queue.push({
              index: tIdx,
              x: tx,
              y: ty,
              g: tentG,
              h,
              f: tentG + h,
              order: insertionOrder++
            });
          }
        }
      }
      for (let d = 0; d < directions.length; d++) {
        const [dx, dy] = directions[d];
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (!this.inBounds(nx, ny)) continue;
        if (!isTileWalkable(nx, ny)) continue;
        const nIdx = this._index(nx, ny);
        if (closedSet.has(nIdx)) continue;
        const elevDiff = Math.abs(this._elevation[nIdx] - this._elevation[current.index]);
        if (elevDiff > maxClimb) continue;
        const isDiagonal = dx !== 0 && dy !== 0;
        if (isDiagonal && preventCornerCutting) {
          const ortho1 = isTileWalkable(current.x + dx, current.y);
          const ortho2 = isTileWalkable(current.x, current.y + dy);
          if (!ortho1 || !ortho2) {
            continue;
          }
        }
        const distance = isDiagonal ? diagMultiplier : 1;
        const cellCost = this._cost[nIdx];
        const stepCost = distance * cellCost;
        const tentG = current.g + stepCost;
        if (tentG > maxCost) continue;
        if (tentG < (gScores.get(nIdx) ?? Infinity)) {
          gScores.set(nIdx, tentG);
          cameFrom.set(nIdx, {
            fromIdx: current.index,
            toX: nx,
            toY: ny,
            stepCost,
            isChunkLink: false
          });
          const h = heuristic(nx, ny);
          queue.push({
            index: nIdx,
            x: nx,
            y: ny,
            g: tentG,
            h,
            f: tentG + h,
            order: insertionOrder++
          });
        }
      }
    }
    return new NavigationPath({
      status: "unreachable",
      success: false,
      path: [],
      cost: Infinity,
      visitedNodes: visitedNodesCount
    });
  }
  /**
   * Create a clone of this NavigationGrid.
   * @returns {NavigationGrid}
   */
  clone() {
    const copy = new _NavigationGrid(this.width, this.height, {
      defaultCost: this.defaultCost,
      defaultWalkable: this.defaultWalkable,
      defaultElevation: this.defaultElevation,
      maxClimbHeight: this.maxClimbHeight,
      allowDiagonal: this.allowDiagonal,
      diagonalCostMultiplier: this.diagonalCostMultiplier
    });
    copy._walkable.set(this._walkable);
    copy._cost.set(this._cost);
    copy._elevation.set(this._elevation);
    for (const [id, obs] of this._obstacles) {
      copy.addObstacle({ ...obs });
    }
    for (const [id, link] of this._chunkLinksById) {
      copy.addChunkLink({ ...link });
    }
    return copy;
  }
  /**
   * Construct a NavigationGrid from a Thalassa Tilemap.
   * @param {Object} tilemap - Tilemap instance
   * @param {Object} [options={}] - Grid options
   * @returns {NavigationGrid}
   */
  static fromTilemap(tilemap, options = {}) {
    if (!tilemap || typeof tilemap.width !== "number" || typeof tilemap.height !== "number") {
      throw new TypeError("fromTilemap requires a Tilemap instance with width and height");
    }
    const grid = new _NavigationGrid(tilemap.width, tilemap.height, options);
    for (let y = 0; y < tilemap.height; y++) {
      for (let x = 0; x < tilemap.width; x++) {
        const meta = typeof tilemap.getResolvedMetadata === "function" ? tilemap.getResolvedMetadata(x, y) : null;
        if (meta) {
          if (meta.walkable !== void 0) {
            grid.setWalkable(x, y, meta.walkable);
          }
          if (Number.isFinite(meta.movementCost) && meta.movementCost >= 1) {
            grid.setCost(x, y, meta.movementCost);
          }
          if (Number.isFinite(meta.elevation)) {
            grid.setElevation(x, y, meta.elevation);
          }
        }
      }
    }
    return grid;
  }
  /**
   * Construct a NavigationGrid from an ASCII layout.
   * Legend maps characters to properties like { walkable, cost, elevation }.
   * @param {string} ascii - Multiline text representation of the grid
   * @param {Object} [legend={}] - Mapping from character to cell properties
   * @param {Object} [options={}] - Grid options
   * @returns {NavigationGrid}
   */
  static fromAscii(ascii, legend = {}, options = {}) {
    if (typeof ascii !== "string") {
      throw new TypeError("fromAscii expects an ASCII string");
    }
    const rawLines = ascii.split("\n").filter((line) => line.trim().length > 0);
    if (rawLines.length === 0) {
      throw new Error("fromAscii received empty grid string");
    }
    let minIndent = Infinity;
    for (let i = 0; i < rawLines.length; i++) {
      const match = rawLines[i].match(/^(\s*)/);
      if (match) {
        minIndent = Math.min(minIndent, match[1].length);
      }
    }
    if (!Number.isFinite(minIndent)) minIndent = 0;
    const lines = rawLines.map((line) => line.slice(minIndent).trimEnd());
    const height = lines.length;
    const width = Math.max(...lines.map((l) => l.length));
    const grid = new _NavigationGrid(width, height, options);
    for (let y = 0; y < height; y++) {
      const line = lines[y];
      for (let x = 0; x < width; x++) {
        const ch = line[x] || " ";
        const def = legend[ch];
        if (def) {
          if (def.walkable !== void 0) grid.setWalkable(x, y, def.walkable);
          if (def.cost !== void 0) grid.setCost(x, y, def.cost);
          if (def.elevation !== void 0) grid.setElevation(x, y, def.elevation);
        } else if (ch === "#") {
          grid.setWalkable(x, y, false);
        }
      }
    }
    return grid;
  }
};

// src/thalassa/worldMetadata.js
init_component();
function finiteNumber5(value, name, min = 0) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    throw new TypeError(`${name} must be a finite number >= ${min}`);
  }
  return value;
}
function nonEmptyString3(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}
var SEMANTIC_LAYER_TYPES = Object.freeze(["visual", "collision", "elevation", "zones", "materials"]);
var WorldMetadataRegistry = class _WorldMetadataRegistry extends Component {
  constructor() {
    super();
    this.tileDefinitions = /* @__PURE__ */ new Map();
    this.layers = /* @__PURE__ */ new Map();
    this.zones = /* @__PURE__ */ new Map();
  }
  /**
   * Register semantic metadata for a tile type.
   * @param {number|string} tileId
   * @param {Object} metadata
   * @param {string} [metadata.name]
   * @param {boolean} [metadata.walkable=true]
   * @param {string} [metadata.material="stone"] SIM-01 material name
   * @param {number} [metadata.traversalCost=1.0]
   * @param {number} [metadata.elevation=0]
   * @param {boolean} [metadata.climbable=false]
   * @param {Object} [metadata.hazard=null]
   * @param {Object} [metadata.interaction=null]
   * @returns {Object} Registered definition
   */
  registerTile(tileId, metadata = {}) {
    if (tileId === void 0 || tileId === null) {
      throw new TypeError("tileId is required");
    }
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new TypeError("Tile metadata must be an object");
    }
    const walkable = metadata.walkable !== false;
    const material = metadata.material ? nonEmptyString3(metadata.material, "material") : "stone";
    let traversalCost = 1;
    if (metadata.traversalCost !== void 0) {
      if (metadata.traversalCost === Infinity) {
        traversalCost = Infinity;
      } else {
        traversalCost = finiteNumber5(metadata.traversalCost, "traversalCost", 0);
      }
    }
    const elevation = metadata.elevation !== void 0 ? finiteNumber5(metadata.elevation, "elevation", 0) : 0;
    const climbable = Boolean(metadata.climbable);
    const def = {
      id: tileId,
      name: metadata.name ?? `Tile_${tileId}`,
      walkable,
      material,
      traversalCost,
      elevation,
      climbable,
      hazard: metadata.hazard ? { ...metadata.hazard } : null,
      interaction: metadata.interaction ? { ...metadata.interaction } : null
    };
    this.tileDefinitions.set(tileId, def);
    return def;
  }
  /**
   * Get tile metadata definition.
   * Throws an Error if tileId is unknown.
   * @param {number|string} tileId
   * @returns {Object}
   */
  getTile(tileId) {
    if (!this.tileDefinitions.has(tileId)) {
      throw new Error(`Unknown tile id: ${tileId}. No semantic metadata registered for this tile.`);
    }
    return this.tileDefinitions.get(tileId);
  }
  /**
   * Check if a tile ID is registered.
   * @param {number|string} tileId
   * @returns {boolean}
   */
  hasTile(tileId) {
    return this.tileDefinitions.has(tileId);
  }
  /**
   * Add a layer to the world metadata registry.
   * @param {Object} layer
   * @param {string} layer.id Unique layer ID
   * @param {string} [layer.name] Display name
   * @param {string} [layer.type="visual"] 'visual'|'collision'|'elevation'|'zones'|'materials'
   * @param {number} [layer.elevation=0] Base elevation for layer
   * @param {number} [layer.zIndex=0] Drawing / evaluation priority
   * @param {number} [layer.width=10]
   * @param {number} [layer.height=10]
   * @param {Array<Array<number>>} [layer.data] 2D grid of tile IDs
   * @returns {Object} Layer record
   */
  addLayer(layer) {
    if (!layer || typeof layer !== "object") throw new TypeError("Layer must be an object");
    const id = nonEmptyString3(layer.id, "layer.id");
    const type = layer.type ?? "visual";
    if (!SEMANTIC_LAYER_TYPES.includes(type)) {
      throw new TypeError(`Invalid layer type: ${type}. Must be one of: ${SEMANTIC_LAYER_TYPES.join(", ")}`);
    }
    const elevation = layer.elevation !== void 0 ? finiteNumber5(layer.elevation, "layer.elevation", 0) : 0;
    const zIndex = layer.zIndex !== void 0 ? Number(layer.zIndex) : 0;
    const width = layer.width !== void 0 ? finiteNumber5(layer.width, "layer.width", 1) : 10;
    const height = layer.height !== void 0 ? finiteNumber5(layer.height, "layer.height", 1) : 10;
    let data;
    if (Array.isArray(layer.data)) {
      data = layer.data.map((row) => Array.isArray(row) ? [...row] : new Array(width).fill(null));
    } else {
      data = Array.from({ length: height }, () => new Array(width).fill(null));
    }
    const layerRecord = {
      id,
      name: layer.name ?? id,
      type,
      elevation,
      zIndex,
      width,
      height,
      visible: layer.visible !== false,
      data
    };
    this.layers.set(id, layerRecord);
    return layerRecord;
  }
  /**
   * Get a layer by ID. Throws if layer does not exist.
   * @param {string} layerId
   * @returns {Object}
   */
  getLayer(layerId) {
    nonEmptyString3(layerId, "layerId");
    if (!this.layers.has(layerId)) {
      throw new Error(`Missing layer: ${layerId}. Layer has not been added to WorldMetadataRegistry.`);
    }
    return this.layers.get(layerId);
  }
  /**
   * Set a tile in a layer at specific grid coordinate.
   * @param {string} layerId
   * @param {number} x Grid X
   * @param {number} y Grid Y
   * @param {number|string|null} tileId
   */
  setTileAt(layerId, x, y, tileId) {
    const layer = this.getLayer(layerId);
    if (x < 0 || x >= layer.width || y < 0 || y >= layer.height) {
      throw new RangeError(`Coordinates (${x}, ${y}) out of layer bounds [${layer.width}x${layer.height}]`);
    }
    if (tileId !== null && !this.tileDefinitions.has(tileId)) {
      throw new Error(`Cannot place unknown tile: ${tileId}`);
    }
    layer.data[y][x] = tileId;
  }
  /**
   * Register a semantic zone (e.g. safe area, dungeon entrance, hazard field).
   * @param {Object} zoneConfig
   * @param {string} zoneConfig.id Unique zone ID
   * @param {string} [zoneConfig.name]
   * @param {string} [zoneConfig.type="region"]
   * @param {Object} zoneConfig.bounds { left, right, top, bottom }
   * @param {number} [zoneConfig.elevation=0]
   * @param {number} [zoneConfig.height=2]
   * @param {Object} [zoneConfig.metadata={}]
   * @returns {Object} Registered zone
   */
  addZone(zoneConfig) {
    if (!zoneConfig || typeof zoneConfig !== "object") throw new TypeError("zoneConfig must be an object");
    const id = nonEmptyString3(zoneConfig.id, "zoneConfig.id");
    if (!zoneConfig.bounds || !Number.isFinite(zoneConfig.bounds.left)) {
      throw new TypeError("Zone requires bounds { left, right, top, bottom }");
    }
    const elevation = zoneConfig.elevation !== void 0 ? finiteNumber5(zoneConfig.elevation, "zoneConfig.elevation", 0) : 0;
    const height = zoneConfig.height !== void 0 ? finiteNumber5(zoneConfig.height, "zoneConfig.height", 1e-3) : 2;
    const zone = {
      id,
      name: zoneConfig.name ?? id,
      type: zoneConfig.type ?? "region",
      bounds: { ...zoneConfig.bounds },
      elevation,
      height,
      metadata: { ...zoneConfig.metadata ?? {} }
    };
    this.zones.set(id, zone);
    return zone;
  }
  /**
   * Get all zones containing world position (x, y) with matching elevation interval.
   * @param {number} x
   * @param {number} y
   * @param {number} [elevation=0]
   * @returns {Array<Object>}
   */
  getZonesAt(x, y, elevation = 0) {
    const matches = [];
    for (const zone of this.zones.values()) {
      if (x >= zone.bounds.left && x <= zone.bounds.right && y >= zone.bounds.top && y <= zone.bounds.bottom) {
        if (elevation >= zone.elevation && elevation <= zone.elevation + zone.height) {
          matches.push(zone);
        }
      }
    }
    return matches;
  }
  /**
   * Resolve composite metadata at coordinate (x, y) across all layers with override conflict resolution.
   * Higher zIndex layers override lower zIndex layers for collision/walkability and material.
   * Explicit collision layer takes precedence over visual layer.
   *
   * @param {number} x Grid X
   * @param {number} y Grid Y
   * @returns {Object} Composite tile metadata
   */
  getComposedMetadataAt(x, y) {
    finiteNumber5(x, "x");
    finiteNumber5(y, "y");
    const sortedLayers = [...this.layers.values()].sort((a, b) => a.zIndex - b.zIndex);
    let walkable = true;
    let material = "stone";
    let traversalCost = 1;
    let elevation = 0;
    let hazard = null;
    let interaction = null;
    let climbable = false;
    let hasTile = false;
    for (const layer of sortedLayers) {
      if (x < 0 || x >= layer.width || y < 0 || y >= layer.height) continue;
      const tileId = layer.data[y]?.[x];
      if (tileId === null || tileId === void 0) continue;
      const tileDef = this.tileDefinitions.get(tileId);
      if (!tileDef) continue;
      hasTile = true;
      if (layer.type === "collision") {
        walkable = tileDef.walkable;
      } else if (layer.zIndex > 0 || !tileDef.walkable) {
        if (!tileDef.walkable) walkable = false;
      }
      if (tileDef.material) {
        material = tileDef.material;
      }
      if (tileDef.traversalCost !== void 0) {
        traversalCost = tileDef.traversalCost;
      }
      elevation = Math.max(elevation, layer.elevation + tileDef.elevation);
      if (tileDef.hazard) hazard = tileDef.hazard;
      if (tileDef.interaction) interaction = tileDef.interaction;
      if (tileDef.climbable) climbable = true;
    }
    return {
      hasTile,
      walkable,
      material,
      traversalCost,
      elevation,
      climbable,
      hazard,
      interaction
    };
  }
  toJSON() {
    return {
      tileDefinitions: Array.from(this.tileDefinitions.entries()),
      layers: Array.from(this.layers.values()).map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        elevation: l.elevation,
        zIndex: l.zIndex,
        width: l.width,
        height: l.height,
        visible: l.visible,
        data: l.data
      })),
      zones: Array.from(this.zones.values())
    };
  }
  static fromJSON(json) {
    const registry = new _WorldMetadataRegistry();
    if (json && Array.isArray(json.tileDefinitions)) {
      for (const [id, def] of json.tileDefinitions) {
        registry.registerTile(id, def);
      }
    }
    if (json && Array.isArray(json.layers)) {
      for (const layer of json.layers) {
        registry.addLayer(layer);
      }
    }
    if (json && Array.isArray(json.zones)) {
      for (const zone of json.zones) {
        registry.addZone(zone);
      }
    }
    return registry;
  }
};

// src/proteus/soundPool.js
init_scene();

// src/galatea/storyGraph.js
function evaluateSingleCondition(condition, facts2, context = null) {
  if (!condition) return true;
  if (typeof condition === "function") {
    return Boolean(condition(facts2, context));
  }
  if (typeof condition !== "object") {
    return Boolean(condition);
  }
  if (condition.not) {
    return !evaluateSingleCondition(condition.not, facts2, context);
  }
  if (Array.isArray(condition.allOf)) {
    return condition.allOf.every((c) => evaluateSingleCondition(c, facts2, context));
  }
  if (Array.isArray(condition.anyOf)) {
    return condition.anyOf.some((c) => evaluateSingleCondition(c, facts2, context));
  }
  if ("fact" in condition || "key" in condition) {
    const factKey = condition.fact || condition.key;
    const actualValue = facts2 ? facts2.get(factKey) : void 0;
    const op = condition.op || condition.operator || "==";
    const expectedValue = condition.value;
    if ("min" in condition || "max" in condition) {
      if (typeof actualValue !== "number") return false;
      if ("min" in condition && actualValue < condition.min) return false;
      if ("max" in condition && actualValue > condition.max) return false;
      return true;
    }
    switch (op) {
      case "==":
      case "===":
      case "eq":
      case "equals":
        return actualValue === expectedValue;
      case "!=":
      case "!==":
      case "neq":
      case "not_equals":
        return actualValue !== expectedValue;
      case ">":
      case "gt":
        return typeof actualValue === "number" && actualValue > expectedValue;
      case ">=":
      case "gte":
        return typeof actualValue === "number" && actualValue >= expectedValue;
      case "<":
      case "lt":
        return typeof actualValue === "number" && actualValue < expectedValue;
      case "<=":
      case "lte":
        return typeof actualValue === "number" && actualValue <= expectedValue;
      case "includes":
      case "contains":
        if (Array.isArray(actualValue)) return actualValue.includes(expectedValue);
        if (typeof actualValue === "string") return actualValue.includes(String(expectedValue));
        return false;
      case "in":
        if (Array.isArray(expectedValue)) return expectedValue.includes(actualValue);
        if (typeof expectedValue === "string") return expectedValue.includes(String(actualValue));
        return false;
      case "has":
      case "exists":
        return facts2 ? facts2.has(factKey) : false;
      case "lacks":
      case "not_exists":
        return facts2 ? !facts2.has(factKey) : true;
      default:
        return actualValue === expectedValue;
    }
  }
  if (facts2) {
    for (const [k, v] of Object.entries(condition)) {
      if (k === "op" || k === "value" || k === "operator") continue;
      const actual = facts2.get(k);
      if (typeof v === "object" && v !== null) {
        if ("min" in v && (typeof actual !== "number" || actual < v.min)) return false;
        if ("max" in v && (typeof actual !== "number" || actual > v.max)) return false;
        if ("op" in v) {
          if (!evaluateSingleCondition({ fact: k, ...v }, facts2, context)) return false;
        }
      } else if (actual !== v) {
        return false;
      }
    }
    return true;
  }
  return true;
}
function evaluateConditions(conditions, facts2, context = null) {
  if (!conditions) return true;
  if (Array.isArray(conditions)) {
    if (conditions.length === 0) return true;
    return conditions.every((c) => evaluateSingleCondition(c, facts2, context));
  }
  return evaluateSingleCondition(conditions, facts2, context);
}
function applyEffects(effects, facts2) {
  if (!effects || !facts2) return;
  if (typeof effects === "function") {
    effects(facts2);
    return;
  }
  const effectList = Array.isArray(effects) ? effects : [effects];
  for (const eff of effectList) {
    if (!eff) continue;
    if (typeof eff === "function") {
      eff(facts2);
      continue;
    }
    if (eff.set && typeof eff.set === "object") {
      for (const [k, v] of Object.entries(eff.set)) {
        facts2.set(k, v);
      }
      continue;
    }
    const key = eff.fact || eff.key;
    if (!key) continue;
    const op = eff.op || eff.operation || "set";
    if (op === "set") {
      facts2.set(key, eff.value);
    } else if (op === "add" || op === "+" || op === "increment") {
      const current = facts2.get(key, 0);
      const delta = typeof eff.value === "number" ? eff.value : typeof eff.amount === "number" ? eff.amount : 1;
      facts2.set(key, (typeof current === "number" ? current : 0) + delta);
    } else if (op === "subtract" || op === "-" || op === "decrement") {
      const current = facts2.get(key, 0);
      const delta = typeof eff.value === "number" ? eff.value : typeof eff.amount === "number" ? eff.amount : 1;
      facts2.set(key, (typeof current === "number" ? current : 0) - delta);
    } else if (op === "toggle") {
      facts2.set(key, !facts2.get(key, false));
    } else if (op === "delete" || op === "remove") {
      facts2.delete(key);
    } else {
      facts2.set(key, eff.value);
    }
  }
}
function detectContradictions(conditions) {
  const list = Array.isArray(conditions) ? conditions : conditions && typeof conditions === "object" ? [conditions] : [];
  const contradictions = [];
  const flattened = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    if (item.contradictory === true || item.contradiction === true) {
      contradictions.push({
        fact: item.fact || item.key || "unknown",
        message: "Explicit contradictory condition flag"
      });
      continue;
    }
    if (Array.isArray(item.allOf)) {
      flattened.push(...item.allOf);
    } else if ("fact" in item || "key" in item) {
      flattened.push(item);
    } else {
      for (const [k, v] of Object.entries(item)) {
        if (k === "op" || k === "value") continue;
        if (typeof v === "object" && v !== null) {
          flattened.push({ fact: k, ...v });
        } else {
          flattened.push({ fact: k, op: "==", value: v });
        }
      }
    }
  }
  for (const item of flattened) {
    if (typeof item.min === "number" && typeof item.max === "number" && item.min > item.max) {
      contradictions.push({
        fact: item.fact || item.key || "unknown",
        message: `Condition specifies min (${item.min}) greater than max (${item.max})`
      });
    }
  }
  const byFact = /* @__PURE__ */ new Map();
  for (const item of flattened) {
    const fact = item.fact || item.key;
    if (!fact) continue;
    if (!byFact.has(fact)) byFact.set(fact, []);
    byFact.get(fact).push(item);
  }
  for (const [fact, conds] of byFact.entries()) {
    let exactValue = void 0;
    let hasExact = false;
    let notValues = /* @__PURE__ */ new Set();
    let lowerBound = -Infinity;
    let lowerStrict = false;
    let upperBound = Infinity;
    let upperStrict = false;
    for (const c of conds) {
      const op = c.op || c.operator || "==";
      const val = c.value;
      if (op === "==" || op === "===" || op === "eq" || op === "equals") {
        if (hasExact && exactValue !== val) {
          contradictions.push({
            fact,
            message: `Fact '${fact}' cannot simultaneously equal '${exactValue}' and '${val}'`
          });
        }
        exactValue = val;
        hasExact = true;
      } else if (op === "!=" || op === "!==" || op === "neq" || op === "not_equals") {
        notValues.add(val);
      } else if (op === ">" || op === "gt") {
        if (typeof val === "number") {
          if (val > lowerBound || val === lowerBound && !lowerStrict) {
            lowerBound = val;
            lowerStrict = true;
          }
        }
      } else if (op === ">=" || op === "gte" || "min" in c) {
        const bound = typeof val === "number" ? val : c.min;
        if (typeof bound === "number" && bound > lowerBound) {
          lowerBound = bound;
          lowerStrict = false;
        }
      } else if (op === "<" || op === "lt") {
        if (typeof val === "number") {
          if (val < upperBound || val === upperBound && !upperStrict) {
            upperBound = val;
            upperStrict = true;
          }
        }
      } else if (op === "<=" || op === "lte" || "max" in c) {
        const bound = typeof val === "number" ? val : c.max;
        if (typeof bound === "number" && bound < upperBound) {
          upperBound = bound;
          upperStrict = false;
        }
      }
    }
    if (hasExact && notValues.has(exactValue)) {
      contradictions.push({
        fact,
        message: `Fact '${fact}' required to equal '${exactValue}' but also required not to equal '${exactValue}'`
      });
    }
    if (lowerBound > upperBound) {
      contradictions.push({
        fact,
        message: `Fact '${fact}' has lower bound (${lowerBound}) exceeding upper bound (${upperBound})`
      });
    } else if (lowerBound === upperBound && (lowerStrict || upperStrict)) {
      contradictions.push({
        fact,
        message: `Fact '${fact}' requires value strictly between ${lowerBound} and ${upperBound}`
      });
    }
    if (hasExact && typeof exactValue === "number") {
      if (lowerStrict ? exactValue <= lowerBound : exactValue < lowerBound) {
        contradictions.push({
          fact,
          message: `Fact '${fact}' exact value (${exactValue}) violates lower bound (${lowerBound})`
        });
      }
      if (upperStrict ? exactValue >= upperBound : exactValue > upperBound) {
        contradictions.push({
          fact,
          message: `Fact '${fact}' exact value (${exactValue}) violates upper bound (${upperBound})`
        });
      }
    }
  }
  return contradictions;
}
var StoryGraph = class _StoryGraph {
  #nodes = /* @__PURE__ */ new Map();
  #visitedNodes = /* @__PURE__ */ new Set();
  #history = [];
  #currentNodeId = null;
  #state = "unstarted";
  /**
   * @param {Object} [definition]
   */
  constructor(definition = {}) {
    this.id = definition.id || `story_graph_${Math.random().toString(36).slice(2, 9)}`;
    this.name = definition.name || this.id;
    this.initialNodeId = definition.initialNodeId || definition.startNodeId || definition.entryNodeId || null;
    this.facts = definition.facts instanceof WorldFacts ? definition.facts : null;
    if (Array.isArray(definition.nodes)) {
      for (const node of definition.nodes) {
        this.addNode(node);
      }
    } else if (definition.nodes && typeof definition.nodes === "object") {
      for (const [id, node] of Object.entries(definition.nodes)) {
        this.addNode({ id, ...node });
      }
    }
  }
  /**
   * Current dialogue node ID.
   * @returns {string|null}
   */
  get currentNodeId() {
    return this.#currentNodeId;
  }
  /**
   * Current story state ('unstarted', 'active', 'completed').
   * @returns {string}
   */
  get state() {
    return this.#state;
  }
  /**
   * Sequence of visited node IDs in order.
   * @returns {string[]}
   */
  get history() {
    return [...this.#history];
  }
  /**
   * Set of unique visited node IDs.
   * @returns {Set}
   */
  get visitedNodes() {
    return new Set(this.#visitedNodes);
  }
  /**
   * Adds a dialogue node to the graph.
   * @param {Object} node
   * @returns {this}
   */
  addNode(node) {
    if (!node || typeof node !== "object") {
      throw new TypeError("Story node must be an object");
    }
    if (!node.id || typeof node.id !== "string") {
      throw new TypeError("Story node must have a non-empty string 'id'");
    }
    const normalizedNode = {
      id: node.id,
      speaker: node.speaker !== void 0 ? node.speaker : "",
      text: node.text || "",
      choices: Array.isArray(node.choices) ? node.choices.map((c, i) => ({
        id: c.id || `choice_${i}`,
        text: c.text || "",
        targetNodeId: c.targetNodeId || c.next || c.target || null,
        condition: c.condition || c.conditions || c.when || null,
        consequence: c.consequence || c.effects || c.action || null,
        metadata: c.metadata || {}
      })) : [],
      next: node.next || node.targetNodeId || null,
      conditions: node.conditions || node.condition || null,
      effects: node.effects || node.consequence || node.onEnter || null,
      metadata: node.metadata || {}
    };
    this.#nodes.set(normalizedNode.id, normalizedNode);
    if (!this.initialNodeId) {
      this.initialNodeId = normalizedNode.id;
    }
    return this;
  }
  /**
   * Gets a node by ID.
   * @param {string} nodeId
   * @returns {Object|null}
   */
  getNode(nodeId) {
    const node = this.#nodes.get(nodeId);
    return node ? { ...node, choices: node.choices.map((c) => ({ ...c })) } : null;
  }
  /**
   * Checks if a node ID exists in the graph.
   * @param {string} nodeId
   * @returns {boolean}
   */
  hasNode(nodeId) {
    return this.#nodes.has(nodeId);
  }
  /**
   * Binds or updates the authoritative WorldFacts instance.
   * @param {WorldFacts} facts
   * @returns {this}
   */
  setFacts(facts2) {
    this.facts = facts2 instanceof WorldFacts ? facts2 : null;
    return this;
  }
  /**
   * Starts the dialogue sequence at the given node or initialNodeId.
   * @param {string} [nodeId]
   * @param {WorldFacts} [facts]
   * @returns {Object} Current node
   */
  start(nodeId = null, facts2 = null) {
    if (facts2 instanceof WorldFacts) {
      this.setFacts(facts2);
    }
    const targetId = nodeId || this.initialNodeId;
    if (!targetId || !this.#nodes.has(targetId)) {
      throw new Error(`Cannot start story graph: node '${targetId}' not found`);
    }
    this.#state = "active";
    this.#currentNodeId = targetId;
    this.#history = [targetId];
    this.#visitedNodes = /* @__PURE__ */ new Set([targetId]);
    const node = this.#nodes.get(targetId);
    if (node.effects && this.facts) {
      applyEffects(node.effects, this.facts);
    }
    return this.getCurrentNode();
  }
  /**
   * Returns the current node enriched with available choices.
   * @returns {Object|null}
   */
  getCurrentNode() {
    if (!this.#currentNodeId || this.#state !== "active") return null;
    const node = this.getNode(this.#currentNodeId);
    if (!node) return null;
    return {
      ...node,
      availableChoices: this.getAvailableChoices(this.#currentNodeId)
    };
  }
  /**
   * Returns all choices for a node with their availability evaluated against facts.
   * @param {string} [nodeId]
   * @returns {Array<Object>}
   */
  getChoices(nodeId = null) {
    const id = nodeId || this.#currentNodeId;
    if (!id || !this.#nodes.has(id)) return [];
    const node = this.#nodes.get(id);
    return node.choices.map((choice) => {
      const isAvailable = choice.condition ? evaluateConditions(choice.condition, this.facts) : true;
      return {
        ...choice,
        available: isAvailable
      };
    });
  }
  /**
   * Returns only the choices currently available according to WorldFacts.
   * @param {string} [nodeId]
   * @returns {Array<Object>}
   */
  getAvailableChoices(nodeId = null) {
    return this.getChoices(nodeId).filter((c) => c.available);
  }
  /**
   * Selects a dialogue choice by index or ID, applies consequences, and transitions.
   * @param {number|string} choiceIndexOrId
   * @returns {Object|null} The new current node, or null if dialogue ended
   */
  choose(choiceIndexOrId) {
    if (this.#state !== "active" || !this.#currentNodeId) {
      throw new Error("Cannot choose: dialogue is not active");
    }
    const choices = this.getChoices(this.#currentNodeId);
    let selectedChoice = null;
    if (typeof choiceIndexOrId === "number") {
      selectedChoice = choices[choiceIndexOrId];
    } else if (typeof choiceIndexOrId === "string") {
      selectedChoice = choices.find((c) => c.id === choiceIndexOrId);
    }
    if (!selectedChoice) {
      throw new Error(`Choice '${choiceIndexOrId}' not found on current node '${this.#currentNodeId}'`);
    }
    if (!selectedChoice.available) {
      throw new Error(`Choice '${selectedChoice.text || selectedChoice.id}' is locked: condition not satisfied`);
    }
    if (selectedChoice.consequence && this.facts) {
      applyEffects(selectedChoice.consequence, this.facts);
    }
    const nextId = selectedChoice.targetNodeId;
    if (!nextId || nextId === "end" || nextId === "exit") {
      this.#state = "completed";
      this.#currentNodeId = null;
      return null;
    }
    if (!this.#nodes.has(nextId)) {
      throw new Error(`Choice target node '${nextId}' does not exist in story graph`);
    }
    this.#currentNodeId = nextId;
    this.#history.push(nextId);
    this.#visitedNodes.add(nextId);
    const nextNode = this.#nodes.get(nextId);
    if (nextNode.effects && this.facts) {
      applyEffects(nextNode.effects, this.facts);
    }
    return this.getCurrentNode();
  }
  /**
   * Advances linear dialogue to the next node (when node has no choices but defines 'next').
   * @returns {Object|null}
   */
  advance() {
    if (this.#state !== "active" || !this.#currentNodeId) {
      throw new Error("Cannot advance: dialogue is not active");
    }
    const node = this.#nodes.get(this.#currentNodeId);
    const nextId = node.next;
    if (!nextId || nextId === "end" || nextId === "exit") {
      this.#state = "completed";
      this.#currentNodeId = null;
      return null;
    }
    if (!this.#nodes.has(nextId)) {
      throw new Error(`Next node '${nextId}' does not exist in story graph`);
    }
    this.#currentNodeId = nextId;
    this.#history.push(nextId);
    this.#visitedNodes.add(nextId);
    const nextNode = this.#nodes.get(nextId);
    if (nextNode.effects && this.facts) {
      applyEffects(nextNode.effects, this.facts);
    }
    return this.getCurrentNode();
  }
  /**
   * Checks if dialogue sequence is active.
   * @returns {boolean}
   */
  isActive() {
    return this.#state === "active";
  }
  /**
   * Checks if dialogue sequence has completed.
   * @returns {boolean}
   */
  isCompleted() {
    return this.#state === "completed";
  }
  /**
   * Resets dialogue to unstarted state.
   */
  reset() {
    this.#state = "unstarted";
    this.#currentNodeId = null;
    this.#history = [];
    this.#visitedNodes.clear();
  }
  /**
   * Serializes runtime dialogue state for save games.
   * @returns {Object}
   */
  snapshot() {
    return {
      id: this.id,
      state: this.#state,
      currentNodeId: this.#currentNodeId,
      history: [...this.#history],
      visitedNodes: Array.from(this.#visitedNodes)
    };
  }
  /**
   * Restores dialogue state from snapshot.
   * @param {Object} snapshot
   * @returns {this}
   */
  restore(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new TypeError("StoryGraph snapshot must be an object");
    }
    this.#state = snapshot.state || "unstarted";
    this.#currentNodeId = snapshot.currentNodeId || null;
    this.#history = Array.isArray(snapshot.history) ? [...snapshot.history] : [];
    this.#visitedNodes = new Set(Array.isArray(snapshot.visitedNodes) ? snapshot.visitedNodes : []);
    return this;
  }
  /**
   * Runs comprehensive diagnostics on the story graph:
   * detects missing node references, absent speakers, and contradictory conditions.
   * @returns {{ valid: boolean, errors: Array<Object>, warnings: Array<Object> }}
   */
  diagnostics() {
    return _StoryGraph.validate({
      initialNodeId: this.initialNodeId,
      nodes: Array.from(this.#nodes.values())
    });
  }
  /**
   * Validates a story graph definition structure.
   * @param {Object} storyDef
   * @returns {{ valid: boolean, errors: Array<Object>, warnings: Array<Object> }}
   */
  static validate(storyDef) {
    const errors = [];
    const warnings = [];
    if (!storyDef || typeof storyDef !== "object") {
      errors.push({
        code: "INVALID_DEFINITION",
        message: "Story definition must be a non-null object"
      });
      return { valid: false, errors, warnings };
    }
    const nodes = Array.isArray(storyDef.nodes) ? storyDef.nodes : storyDef.nodes && typeof storyDef.nodes === "object" ? Object.entries(storyDef.nodes).map(([id, n]) => ({ id, ...n })) : [];
    const nodeIds = new Set(nodes.map((n) => n.id).filter(Boolean));
    const initialId = storyDef.initialNodeId || storyDef.startNodeId || storyDef.entryNodeId;
    if (initialId && !nodeIds.has(initialId)) {
      errors.push({
        code: "MISSING_NODE_REFERENCE",
        message: `Initial node '${initialId}' does not exist in graph`,
        nodeId: initialId
      });
    }
    for (const node of nodes) {
      const nodeId = node.id || "unnamed";
      if (node.speaker === void 0 || node.speaker === null || typeof node.speaker === "string" && !node.speaker.trim()) {
        errors.push({
          code: "ABSENT_SPEAKER",
          message: `Dialogue node '${nodeId}' has missing or empty speaker`,
          nodeId
        });
      }
      if (node.next && typeof node.next === "string" && node.next !== "end" && node.next !== "exit") {
        if (!nodeIds.has(node.next)) {
          errors.push({
            code: "MISSING_NODE_REFERENCE",
            message: `Node '${nodeId}' references non-existent node '${node.next}' in 'next'`,
            nodeId,
            targetNodeId: node.next
          });
        }
      }
      if (node.conditions || node.condition) {
        const conds = node.conditions || node.condition;
        const nodeContradictions = detectContradictions(conds);
        for (const c of nodeContradictions) {
          errors.push({
            code: "CONTRADICTORY_CONDITIONS",
            message: `Node '${nodeId}' condition contradiction: ${c.message}`,
            nodeId,
            fact: c.fact
          });
        }
      }
      if (Array.isArray(node.choices)) {
        for (let i = 0; i < node.choices.length; i++) {
          const choice = node.choices[i];
          const targetId = choice.targetNodeId || choice.next || choice.target;
          if (targetId && typeof targetId === "string" && targetId !== "end" && targetId !== "exit") {
            if (!nodeIds.has(targetId)) {
              errors.push({
                code: "MISSING_NODE_REFERENCE",
                message: `Choice [${i}] in node '${nodeId}' references non-existent node '${targetId}'`,
                nodeId,
                targetNodeId: targetId
              });
            }
          }
          if (choice.condition || choice.conditions) {
            const conds = choice.condition || choice.conditions;
            const choiceContradictions = detectContradictions(conds);
            for (const c of choiceContradictions) {
              errors.push({
                code: "CONTRADICTORY_CONDITIONS",
                message: `Choice [${i}] in node '${nodeId}' has contradictory conditions: ${c.message}`,
                nodeId,
                choiceIndex: i,
                fact: c.fact
              });
            }
          }
        }
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// src/sim/cellSimulation.js
function normalizeCellData(data, defaults) {
  if (typeof data === "string") {
    const materialId2 = data;
    const isWater2 = materialId2 === "water";
    return {
      materialId: materialId2,
      state: isWater2 ? MaterialState.WET : MaterialState.DRY,
      moisture: isWater2 ? 1 : 0,
      burnTicks: 0,
      temperature: defaults.ambientTemperature,
      isSource: isWater2,
      flowDistance: 0,
      originalMaterialId: null
    };
  }
  const obj = data && typeof data === "object" ? data : {};
  const materialId = typeof obj.materialId === "string" ? obj.materialId : defaults.defaultMaterial;
  const isWater = materialId === "water";
  let state = obj.state;
  if (!state) {
    state = isWater ? MaterialState.WET : MaterialState.DRY;
  }
  const moisture = Number.isFinite(obj.moisture) ? Number(obj.moisture) : isWater || state === MaterialState.WET ? 1 : 0;
  const burnTicks = Number.isFinite(obj.burnTicks) ? Math.max(0, Number(obj.burnTicks)) : 0;
  let temperature = defaults.ambientTemperature;
  if (Number.isFinite(obj.temperature)) {
    temperature = Number(obj.temperature);
  } else if (state === MaterialState.BURNING) {
    temperature = defaults.burningTemperature;
  }
  const isSource = obj.isSource !== void 0 ? Boolean(obj.isSource) : isWater;
  const flowDistance = Number.isFinite(obj.flowDistance) ? Math.max(0, Number(obj.flowDistance)) : 0;
  const originalMaterialId = obj.originalMaterialId ?? null;
  return {
    materialId,
    state,
    moisture,
    burnTicks,
    temperature,
    isSource,
    flowDistance,
    originalMaterialId
  };
}
var CellGridSimulation = class {
  /**
   * Creates a new CellGridSimulation instance.
   * @param {number|object} [widthOrOptions=16] - Grid width or options object.
   * @param {number} [height=16] - Grid height if first argument was width.
   * @param {object} [options={}] - Configuration options.
   */
  constructor(widthOrOptions = 16, height = 16, options = {}) {
    let opts = {};
    let w = 16;
    let h = 16;
    if (typeof widthOrOptions === "object" && widthOrOptions !== null) {
      opts = widthOrOptions;
      w = Number(opts.width) || 16;
      h = Number(opts.height) || 16;
    } else {
      w = Number(widthOrOptions) || 16;
      h = Number(height) || 16;
      opts = options || {};
    }
    this.width = Math.max(1, Math.floor(w));
    this.height = Math.max(1, Math.floor(h));
    this.registry = opts.registry || MaterialRegistry.getDefault();
    this.eventBus = opts.eventBus || null;
    this.maxCellUpdatesPerTick = Number.isFinite(opts.maxCellUpdatesPerTick) ? Math.max(1, Number(opts.maxCellUpdatesPerTick)) : 1e4;
    this.ambientTemperature = Number.isFinite(opts.ambientTemperature) ? Number(opts.ambientTemperature) : 20;
    this.burningTemperature = Number.isFinite(opts.burningTemperature) ? Number(opts.burningTemperature) : 100;
    this.heatTransferRate = Number.isFinite(opts.heatTransferRate) ? Number(opts.heatTransferRate) : 25;
    this.coolingRate = Number.isFinite(opts.coolingRate) ? Number(opts.coolingRate) : 5;
    this.dryingRate = Number.isFinite(opts.dryingRate) ? Number(opts.dryingRate) : 0.2;
    this.defaultMaterial = typeof opts.defaultMaterial === "string" ? opts.defaultMaterial : "dirt";
    this.waterFlow = opts.waterFlow !== void 0 ? Boolean(opts.waterFlow) : true;
    this.maxWaterFlowDistance = Number.isFinite(opts.maxWaterFlowDistance) ? Math.max(0, Number(opts.maxWaterFlowDistance)) : 3;
    this._updateCursor = 0;
    this._cells = new Array(this.width * this.height);
    this._initCells();
  }
  /**
   * Initializes all grid cells to default state.
   * @private
   */
  _initCells() {
    const defaults = {
      ambientTemperature: this.ambientTemperature,
      burningTemperature: this.burningTemperature,
      defaultMaterial: this.defaultMaterial
    };
    for (let i = 0; i < this._cells.length; i++) {
      this._cells[i] = normalizeCellData(this.defaultMaterial, defaults);
    }
  }
  /**
   * Checks if coordinates are within the grid bounds.
   * Coordinates outside the grid boundary are safely identified.
   * @param {number} x - Column index.
   * @param {number} y - Row index.
   * @returns {boolean}
   */
  isInBounds(x, y) {
    return typeof x === "number" && typeof y === "number" && Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  /**
   * Gets 1D flat array index for (x, y) coordinates.
   * @param {number} x
   * @param {number} y
   * @returns {number} Index, or -1 if out of bounds.
   */
  getIndex(x, y) {
    if (!this.isInBounds(x, y)) return -1;
    return y * this.width + x;
  }
  /**
   * Converts a 1D flat array index to { x, y } coordinates.
   * @param {number} index
   * @returns {object} { x, y } coordinates.
   */
  getCoordinates(index) {
    return {
      x: index % this.width,
      y: Math.floor(index / this.width)
    };
  }
  /**
   * Queries a cell safely. Returns null if coordinates are out of bounds.
   * @param {number} x - Column index.
   * @param {number} y - Row index.
   * @returns {object|null} The cell object, or null if out of bounds.
   */
  getCell(x, y) {
    const idx = this.getIndex(x, y);
    if (idx === -1) return null;
    return this._cells[idx];
  }
  /**
   * Sets or updates cell data safely. Safely ignores out-of-bounds coordinates.
   * @param {number} x - Column index.
   * @param {number} y - Row index.
   * @param {string|object} data - Material ID or partial cell properties.
   * @returns {object|null} The updated cell object or null if out of bounds.
   */
  setCell(x, y, data) {
    const idx = this.getIndex(x, y);
    if (idx === -1) return null;
    const defaults = {
      ambientTemperature: this.ambientTemperature,
      burningTemperature: this.burningTemperature,
      defaultMaterial: this.defaultMaterial
    };
    const existing = this._cells[idx];
    if (typeof data === "string") {
      this._cells[idx] = normalizeCellData(data, defaults);
    } else if (data && typeof data === "object") {
      const materialChanged = data.materialId !== void 0 && data.materialId !== existing.materialId;
      const merged = { ...existing, ...data };
      if (materialChanged && data.moisture === void 0) {
        merged.moisture = data.materialId === "water" ? 1 : data.state === MaterialState.WET ? 1 : 0;
      }
      if (materialChanged && data.isSource === void 0) {
        merged.isSource = data.materialId === "water";
      }
      if (data.state === MaterialState.DRY && data.moisture === void 0) {
        merged.moisture = 0;
      }
      this._cells[idx] = normalizeCellData(merged, defaults);
    }
    return this._cells[idx];
  }
  /**
   * Convenience helper to set material ID and optional state on a cell.
   * @param {number} x - Column index.
   * @param {number} y - Row index.
   * @param {string} materialId - Material ID.
   * @param {string} [state] - Material interaction state.
   * @returns {object|null}
   */
  setMaterial(x, y, materialId, state) {
    return this.setCell(x, y, { materialId, state });
  }
  /**
   * Queries the 4-cardinal in-bounds neighbors of a cell.
   * Out-of-bounds coordinates are filtered out safely.
   * @param {number} x
   * @param {number} y
   * @returns {Array<object>} Array of { x, y, index, cell }.
   */
  getNeighbors(x, y) {
    const cardinalOffsets = [
      { x: 0, y: -1 },
      // North
      { x: 1, y: 0 },
      // East
      { x: 0, y: 1 },
      // South
      { x: -1, y: 0 }
      // West
    ];
    const neighbors = [];
    for (let i = 0; i < cardinalOffsets.length; i++) {
      const nx = x + cardinalOffsets[i].x;
      const ny = y + cardinalOffsets[i].y;
      if (this.isInBounds(nx, ny)) {
        const idx = this.getIndex(nx, ny);
        neighbors.push({
          x: nx,
          y: ny,
          index: idx,
          cell: this._cells[idx]
        });
      }
    }
    return neighbors;
  }
  /**
   * Computes the effective ignition threshold temperature for a material.
   * Non-flammable materials (flammability === 0) return Infinity.
   * @param {string} materialId
   * @returns {number} Threshold temperature.
   */
  getIgnitionThreshold(materialId) {
    const mat = this.registry.get(materialId, { suppressWarning: true });
    if (!mat || mat.flammability <= 0) {
      return Infinity;
    }
    if (typeof mat.ignitionThreshold === "number") {
      return mat.ignitionThreshold;
    }
    return this.ambientTemperature + (1 - mat.flammability) * 50;
  }
  /**
   * Manually ignites a cell at (x, y) if the material is flammable and not charred.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} True if cell successfully ignited.
   */
  ignite(x, y) {
    const cell = this.getCell(x, y);
    if (!cell) return false;
    const mat = this.registry.get(cell.materialId);
    if (mat.flammability <= 0 || cell.state === MaterialState.CHARRED) {
      return false;
    }
    const prev = cell.state;
    cell.state = MaterialState.BURNING;
    cell.burnTicks = 0;
    cell.temperature = Math.max(cell.temperature, this.burningTemperature);
    cell.moisture = 0;
    this._emitEvent("sim:ignited", {
      x,
      y,
      materialId: cell.materialId,
      state: MaterialState.BURNING,
      previousState: prev,
      cell
    });
    return true;
  }
  /**
   * Manually extinguishes a cell at (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {boolean} True if cell was extinguished.
   */
  extinguish(x, y) {
    const cell = this.getCell(x, y);
    if (!cell) return false;
    const prev = cell.state;
    cell.state = MaterialState.EXTINGUISHED;
    cell.temperature = this.ambientTemperature;
    cell.moisture = Math.max(cell.moisture, 1);
    cell.burnTicks = 0;
    this._emitEvent("sim:extinguished", {
      x,
      y,
      materialId: cell.materialId,
      state: MaterialState.EXTINGUISHED,
      previousState: prev,
      cell
    });
    return true;
  }
  /**
   * Emits a typed event to the TypedEventBus if one is attached.
   * Also emits an alias under `material:` namespace for compatibility.
   * @private
   * @param {string} eventName
   * @param {object} data
   */
  _emitEvent(eventName, data) {
    if (!this.eventBus || typeof this.eventBus.emit !== "function") return;
    this.eventBus.emit(eventName, data);
    if (eventName.startsWith("sim:")) {
      const alias = "material:" + eventName.slice(4);
      this.eventBus.emit(alias, data);
    }
  }
  /**
   * Advances the simulation by one step (dt).
   * Handles:
   * - Local fire spread & heat transfer to 4-cardinal neighbors.
   * - Burning progression and burnout transition to charred.
   * - Water flow & extinguishing (extinguishing takes precedence).
   * - Out-of-bounds boundary safety.
   * - Update budget capping via maxCellUpdatesPerTick.
   * - Typed event dispatching.
   *
   * @param {number} [dt=1] - Time step delta.
   * @param {object} [options={}] - Override step options.
   * @returns {object} Step summary statistics.
   */
  step(dt = 1, options = {}) {
    const totalCells = this._cells.length;
    const maxUpdates = options.maxCellUpdatesPerTick !== void 0 ? Math.max(0, Number(options.maxCellUpdatesPerTick)) : this.maxCellUpdatesPerTick;
    const limit = Math.min(maxUpdates, totalCells);
    if (limit === 0) {
      return {
        updatesProcessed: 0,
        ignitedCount: 0,
        extinguishedCount: 0,
        charredCount: 0,
        activeFires: 0
      };
    }
    const heatTransferRate = Number.isFinite(options.heatTransferRate) ? Number(options.heatTransferRate) : this.heatTransferRate;
    const coolingRate = Number.isFinite(options.coolingRate) ? Number(options.coolingRate) : this.coolingRate;
    const dryingRate = Number.isFinite(options.dryingRate) ? Number(options.dryingRate) : this.dryingRate;
    const prevCells = new Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      const c = this._cells[i];
      prevCells[i] = {
        materialId: c.materialId,
        state: c.state,
        moisture: c.moisture,
        burnTicks: c.burnTicks,
        temperature: c.temperature,
        isSource: c.isSource,
        flowDistance: c.flowDistance,
        originalMaterialId: c.originalMaterialId
      };
    }
    let ignitedCount = 0;
    let extinguishedCount = 0;
    let charredCount = 0;
    let updatesProcessed = 0;
    for (let stepCount = 0; stepCount < limit; stepCount++) {
      const idx = (this._updateCursor + stepCount) % totalCells;
      updatesProcessed++;
      const { x, y } = this.getCoordinates(idx);
      const prev = prevCells[idx];
      const curr = this._cells[idx];
      const mat = this.registry.get(prev.materialId, { suppressWarning: true });
      const neighbors = this.getNeighbors(x, y);
      const burningNeighbors = [];
      const waterNeighbors = [];
      for (let n = 0; n < neighbors.length; n++) {
        const nIdx = neighbors[n].index;
        const nPrev = prevCells[nIdx];
        const nMat = this.registry.get(nPrev.materialId, { suppressWarning: true });
        if (nPrev.state === MaterialState.BURNING) {
          burningNeighbors.push(nPrev);
        }
        if (nMat.id === "water" || nPrev.materialId === "water") {
          waterNeighbors.push(nPrev);
        }
      }
      const hasWaterNeighbor = waterNeighbors.length > 0;
      const hasBurningNeighbor = burningNeighbors.length > 0;
      if (prev.state === MaterialState.BURNING) {
        if (hasWaterNeighbor) {
          curr.state = MaterialState.EXTINGUISHED;
          curr.temperature = this.ambientTemperature;
          curr.moisture = 1;
          curr.burnTicks = 0;
          extinguishedCount++;
          this._emitEvent("sim:extinguished", {
            x,
            y,
            materialId: curr.materialId,
            state: MaterialState.EXTINGUISHED,
            previousState: MaterialState.BURNING,
            cell: curr
          });
        } else {
          const newBurnTicks = prev.burnTicks + 1;
          curr.burnTicks = newBurnTicks;
          curr.temperature = Math.max(prev.temperature, this.burningTemperature);
          if (newBurnTicks >= (mat.burnDuration || 0)) {
            curr.state = MaterialState.CHARRED;
            curr.temperature = Math.max(this.ambientTemperature, prev.temperature - coolingRate);
            charredCount++;
            this._emitEvent("sim:charred", {
              x,
              y,
              materialId: curr.materialId,
              state: MaterialState.CHARRED,
              previousState: MaterialState.BURNING,
              cell: curr
            });
          }
        }
        continue;
      }
      if (prev.state === MaterialState.CHARRED) {
        if (hasWaterNeighbor) {
          curr.moisture = 1;
          curr.temperature = this.ambientTemperature;
        } else if (curr.temperature > this.ambientTemperature) {
          curr.temperature = Math.max(this.ambientTemperature, curr.temperature - coolingRate);
        }
        continue;
      }
      if (prev.materialId === "water") {
        curr.state = MaterialState.WET;
        curr.moisture = 1;
        curr.temperature = this.ambientTemperature;
        curr.burnTicks = 0;
        if (!prev.isSource) {
          const hasUpstream = waterNeighbors.some(
            (wn) => wn.materialId === "water" && wn.flowDistance < prev.flowDistance
          );
          if (!hasUpstream) {
            curr.materialId = prev.originalMaterialId || this.defaultMaterial;
            curr.state = MaterialState.WET;
            curr.flowDistance = 0;
          }
        }
        continue;
      }
      if (hasBurningNeighbor && hasWaterNeighbor) {
        curr.state = MaterialState.WET;
        curr.moisture = 1;
        curr.temperature = this.ambientTemperature;
        curr.burnTicks = 0;
        continue;
      }
      if (hasWaterNeighbor) {
        if (curr.state === MaterialState.DRY) {
          curr.state = MaterialState.WET;
        }
        curr.moisture = 1;
        curr.temperature = this.ambientTemperature;
        continue;
      }
      if (hasBurningNeighbor) {
        const heatReceived = burningNeighbors.length * heatTransferRate;
        const newTemp = prev.temperature + heatReceived;
        curr.temperature = newTemp;
        const threshold = this.getIgnitionThreshold(curr.materialId);
        if (mat.flammability > 0 && newTemp >= threshold) {
          const interactionIntensity = (newTemp - this.ambientTemperature) / 25;
          const result = MaterialInteraction.applyInteraction({
            state: prev.state,
            interaction: InteractionType.IGNITE,
            materialId: curr.materialId,
            intensity: interactionIntensity,
            moistureThreshold: prev.moisture || 1,
            registry: this.registry
          });
          if (result.state === MaterialState.BURNING) {
            curr.state = MaterialState.BURNING;
            curr.temperature = Math.max(newTemp, this.burningTemperature);
            curr.burnTicks = 0;
            curr.moisture = 0;
            ignitedCount++;
            this._emitEvent("sim:ignited", {
              x,
              y,
              materialId: curr.materialId,
              state: MaterialState.BURNING,
              previousState: prev.state,
              cell: curr
            });
          }
        }
        continue;
      }
      if (curr.temperature > this.ambientTemperature) {
        curr.temperature = Math.max(this.ambientTemperature, curr.temperature - coolingRate);
      }
      if (curr.state === MaterialState.WET || curr.state === MaterialState.EXTINGUISHED) {
        const newMoisture = Math.max(0, prev.moisture - dryingRate);
        curr.moisture = newMoisture;
        if (newMoisture <= 0) {
          curr.state = MaterialState.DRY;
        }
      }
    }
    this._updateCursor = (this._updateCursor + limit) % totalCells;
    let activeFires = 0;
    for (let i = 0; i < totalCells; i++) {
      if (this._cells[i].state === MaterialState.BURNING) {
        activeFires++;
      }
    }
    return {
      updatesProcessed,
      ignitedCount,
      extinguishedCount,
      charredCount,
      activeFires
    };
  }
  /**
   * Resets all cells to default material and temperature.
   */
  clear() {
    this._updateCursor = 0;
    this._initCells();
  }
  /**
   * Serializes the cell grid state for save games.
   * @returns {object} Serializable snapshot object.
   */
  snapshot() {
    const cells = new Array(this._cells.length);
    for (let i = 0; i < this._cells.length; i++) {
      const c = this._cells[i];
      cells[i] = {
        materialId: c.materialId,
        state: c.state,
        moisture: c.moisture,
        burnTicks: c.burnTicks,
        temperature: c.temperature,
        isSource: c.isSource,
        flowDistance: c.flowDistance,
        originalMaterialId: c.originalMaterialId
      };
    }
    return {
      version: 1,
      timestamp: Date.now(),
      width: this.width,
      height: this.height,
      updateCursor: this._updateCursor,
      ambientTemperature: this.ambientTemperature,
      burningTemperature: this.burningTemperature,
      defaultMaterial: this.defaultMaterial,
      cells
    };
  }
  /**
   * Restores cell grid state from a snapshot.
   * @param {object} snapshot - Saved snapshot object.
   * @returns {CellGridSimulation} this instance.
   */
  restore(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new TypeError("Snapshot must be an object");
    }
    if (Number.isFinite(snapshot.width) && Number.isFinite(snapshot.height)) {
      this.width = Math.max(1, Math.floor(snapshot.width));
      this.height = Math.max(1, Math.floor(snapshot.height));
    }
    if (!Array.isArray(snapshot.cells)) {
      throw new TypeError("Snapshot must contain a cells array");
    }
    if (Number.isFinite(snapshot.updateCursor)) {
      this._updateCursor = snapshot.updateCursor % (this.width * this.height);
    } else {
      this._updateCursor = 0;
    }
    if (Number.isFinite(snapshot.ambientTemperature)) {
      this.ambientTemperature = snapshot.ambientTemperature;
    }
    if (Number.isFinite(snapshot.burningTemperature)) {
      this.burningTemperature = snapshot.burningTemperature;
    }
    if (typeof snapshot.defaultMaterial === "string") {
      this.defaultMaterial = snapshot.defaultMaterial;
    }
    const defaults = {
      ambientTemperature: this.ambientTemperature,
      burningTemperature: this.burningTemperature,
      defaultMaterial: this.defaultMaterial
    };
    const total = this.width * this.height;
    this._cells = new Array(total);
    for (let i = 0; i < total; i++) {
      const raw = snapshot.cells[i] || {};
      this._cells[i] = normalizeCellData(raw, defaults);
    }
    return this;
  }
  /**
   * Counts the number of cells matching a predicate function.
   * @param {Function} predicate - (cell, x, y) => boolean.
   * @returns {number}
   */
  countCells(predicate) {
    if (typeof predicate !== "function") return 0;
    let count = 0;
    for (let i = 0; i < this._cells.length; i++) {
      const { x, y } = this.getCoordinates(i);
      if (predicate(this._cells[i], x, y)) {
        count++;
      }
    }
    return count;
  }
  /**
   * Finds coordinates of all cells matching a predicate function.
   * @param {Function} predicate - (cell, x, y) => boolean.
   * @returns {Array<object>} Array of { x, y, cell }.
   */
  findCells(predicate) {
    if (typeof predicate !== "function") return [];
    const matches = [];
    for (let i = 0; i < this._cells.length; i++) {
      const { x, y } = this.getCoordinates(i);
      if (predicate(this._cells[i], x, y)) {
        matches.push({ x, y, cell: this._cells[i] });
      }
    }
    return matches;
  }
};

// src/sim/index.js
var sim_default = {
  ...materialRegistry_default,
  CellGridSimulation
};

// src/neptune.js
init_componentRegistry();
init_sceneLoader();
var application = new Application();
window.game = application;
ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("ProjectBehaviour", ProjectBehaviour);
ComponentRegistry.register("Sprite", Sprite);
ComponentRegistry.register("BoxCollider", BoxCollider);
ComponentRegistry.register("Shape", Shape);
ComponentRegistry.register("TriggerCollider", TriggerCollider);
ComponentRegistry.register("Hitbox", Hitbox);
ComponentRegistry.register("Hurtbox", Hurtbox);
ComponentRegistry.register("Dialogue", Dialogue);
ComponentRegistry.register("QuestDefinition", QuestDefinition);
ComponentRegistry.register("EnemyConfig", EnemyConfig);
ComponentRegistry.register("SceneTransition", SceneTransition);
ComponentRegistry.register("SpawnPoint", SpawnPoint);
ComponentRegistry.register("NPCKnowledge", NPCKnowledge);
ComponentRegistry.register("NPCSchedule", NPCSchedule);
ComponentRegistry.register("UtilityAI", UtilityAI);
ComponentRegistry.register("LevelProgression", LevelProgression);
ComponentRegistry.register("StatusEffectManager", StatusEffectManager);
ComponentRegistry.register("DeathRetryManager", DeathRetryManager);
ComponentRegistry.register("KnockbackMotor", KnockbackMotor);
ComponentRegistry.register("SpatialHashGrid", SpatialHashGrid);
ComponentRegistry.register("WorldMetadataRegistry", WorldMetadataRegistry);
ComponentRegistry.register("AudioBusSystem", AudioBusSystem);

// examples/showcase/showcase.js
var COLS = 38;
var ROWS = 22;
var TILE_SIZE = 20;
var CANVAS_W = COLS * TILE_SIZE;
var CANVAS_H = ROWS * TILE_SIZE;
var canvas = typeof document !== "undefined" ? document.getElementById("showcase-canvas") : null;
var ctx = canvas ? canvas.getContext("2d") : null;
var audioCtx = null;
function getAudioCtx() {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) audioCtx = new AudioCtor();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
    });
  }
  return audioCtx;
}
var worldMetadata = new WorldMetadataRegistry();
worldMetadata.registerTile("stone", { layer: "ground", elevation: 0, traversalCost: Infinity, friction: 0.9, isWall: true });
worldMetadata.registerTile("grass", { layer: "ground", elevation: 0, traversalCost: 1, friction: 0.8 });
worldMetadata.registerTile("water", { layer: "ground", elevation: 0, traversalCost: 2.5, friction: 0.5 });
worldMetadata.registerTile("chasm", { layer: "ground", elevation: 0, traversalCost: Infinity, isHazard: true });
worldMetadata.registerTile("bridge", { layer: "elevated", elevation: 1, traversalCost: 1, friction: 0.85 });
var mapData = new Uint8Array(COLS * ROWS);
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const idx = y * COLS + x;
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
      mapData[idx] = 1;
    } else if (x >= 8 && x <= 12 && y >= 12 && y <= 17) {
      mapData[idx] = 2;
    } else if (x === 24 && (y < 9 || y > 13)) {
      mapData[idx] = 3;
    } else if (x === 24 && y >= 9 && y <= 13) {
      mapData[idx] = 4;
    } else if (x === 18 && y >= 4 && y <= 8 || x === 18 && y >= 14 && y <= 18) {
      mapData[idx] = 1;
    } else {
      mapData[idx] = 0;
    }
  }
}
var navGrid = new NavigationGrid({ width: COLS, height: ROWS, defaultCost: 1 });
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const tile = mapData[y * COLS + x];
    if (tile === 1 || tile === 3) {
      navGrid.setWalkable(x, y, false);
    } else if (tile === 2) {
      navGrid.setCost(x, y, 2.5);
    }
  }
}
var activePath = [];
var materialReg = new MaterialRegistry();
materialReg.register("sand", { flammability: 0, conductivity: 0.1, viscosity: 0.5, traversalCost: 1.5, isSolid: true, burnDuration: 0 });
materialReg.register("steam", { flammability: 0, conductivity: 0.2, viscosity: 0.1, traversalCost: 1, isSolid: false, burnDuration: 0 });
var cellSim = new CellGridSimulation(COLS, ROWS, { registry: materialReg });
var simRunning = true;
for (let cy = 6; cy <= 8; cy++) {
  for (let cx = 14; cx <= 16; cx++) {
    cellSim.setCell(cx, cy, "wood");
  }
}
var audioBuses = new AudioBusSystem();
function playSynthesizedTone(freq, duration = 0.15, type = "sine", bus = "sfx") {
  try {
    const actx = getAudioCtx();
    if (!actx) return;
    const effectiveGain = audioBuses.getEffectiveVolume(bus);
    if (effectiveGain <= 1e-3) return;
    const osc = actx.createOscillator();
    const gainNode = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    gainNode.gain.setValueAtTime(effectiveGain * 0.2, actx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(1e-4, actx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + duration);
  } catch (_) {
  }
}
var progression = new LevelProgression({
  level: 1,
  experience: 0,
  baseExperience: 100,
  growthRate: 1.5,
  maxLevel: 20
});
var statusEffects = new StatusEffectManager();
var itemRegistry = new ItemRegistry();
itemRegistry.register({ id: "flame_wand", name: "Flame Wand", slot: "mainHand", type: "equipment", rarity: "rare", stats: { atk: 12, manaCostReduction: 2 } });
itemRegistry.register({ id: "iron_shield", name: "Iron Shield", slot: "offHand", type: "equipment", rarity: "uncommon", stats: { def: 8, maxHp: 20 } });
itemRegistry.register({ id: "mage_robe", name: "Mage Robe", slot: "armor", type: "equipment", rarity: "rare", stats: { def: 6, maxMp: 30 } });
itemRegistry.register({ id: "swift_ring", name: "Swift Ring", slot: "accessory", type: "equipment", rarity: "epic", stats: { spd: 35 } });
itemRegistry.register({ id: "health_pot", name: "Health Potion", slot: "consumable", type: "consumable", rarity: "common", healAmount: 40 });
var inventory = new Inventory(16, { registry: itemRegistry });
var equipment = inventory.equipmentSystem;
equipment.equip("mainHand", itemRegistry.get("flame_wand"));
equipment.equip("armor", itemRegistry.get("mage_robe"));
equipment.equip("accessory", itemRegistry.get("swift_ring"));
inventory.addItem("health_pot", 1);
inventory.addItem("iron_shield", 1);
var lootTable = new LootTable();
lootTable.addEntry({ itemId: "health_pot", weight: 50 });
lootTable.addEntry({ itemId: "iron_shield", weight: 25 });
lootTable.addEntry({ itemId: "swift_ring", weight: 10 });
lootTable.addEntry({ itemId: "flame_wand", weight: 15 });
var facts = new WorldFacts();
var eventBus = new TypedEventBus();
var ruleEngine = new RuleEngine({ facts, bus: eventBus });
facts.set("player_level", 1);
facts.set("has_bridge_pass", false);
facts.set("guard_attitude", "friendly");
facts.set("fires_extinguished", 0);
facts.set("enemies_bested", 0);
ruleEngine.addRule({
  id: "unlock_chasm_passage",
  event: "level_up",
  condition: ({ facts: f }) => f.get("player_level") >= 2,
  action: ({ facts: f }) => {
    f.set("has_bridge_pass", true);
    triggerNotification("Citadel Pass Granted! Bridge is fully unlocked.");
  }
});
var storyGraph = new StoryGraph({
  id: "citadel_story",
  initialNodeId: "guard_greeting",
  facts
});
storyGraph.addNode({
  id: "guard_greeting",
  speaker: "Town Guard Roderick",
  text: "Halt, traveler. The Citadel is on high alert. Flammable brush and wild sparks threaten our supplies.",
  choices: [
    { text: "Can I cross the chasm bridge?", next: "bridge_query" },
    { text: "I am here to assist with fire control.", next: "volunteer" },
    { text: "Step aside or face my magic.", next: "threaten" }
  ]
});
storyGraph.addNode({
  id: "bridge_query",
  speaker: "Town Guard Roderick",
  text: "Cross freely if you possess the Citadel Pass. Otherwise, prove your merit by reaching Level 2+.",
  choices: [
    { text: "Understood.", next: "guard_greeting" }
  ]
});
storyGraph.addNode({
  id: "volunteer",
  speaker: "Town Guard Roderick",
  text: "Good. Extinguish burning cells with Frost Nova, or burn through wood barricades to clear paths.",
  choices: [
    { text: "On it!", next: null }
  ]
});
storyGraph.addNode({
  id: "threaten",
  speaker: "Town Guard Roderick",
  text: "Is that a threat? You will find my blade swift and true!",
  choices: [
    { text: "En garde!", next: null }
  ]
});
var factions = new FactionRegistry();
factions.registerFaction("town_guard");
factions.registerFaction("player_guild");
factions.setReputation("town_guard", "player_guild", 50);
var schedule = new NPCSchedule();
schedule.addSlot(new ScheduleSlot({ start: 6, end: 12, activity: "PATROL", destination: { x: 360, y: 160 } }));
schedule.addSlot(new ScheduleSlot({ start: 12, end: 18, activity: "GUARD", destination: { x: 480, y: 220 } }));
schedule.addSlot(new ScheduleSlot({ start: 18, end: 22, activity: "TAVERN", destination: { x: 260, y: 320 } }));
schedule.addSlot(new ScheduleSlot({ start: 22, end: 6, activity: "REST", destination: { x: 520, y: 100 } }));
var scheduleSystem = new ScheduleSystem({ schedule });
var worldHour = 10;
var autoAdvanceTime = false;
var perception = new PerceptionSystem({ fovAngle: Math.PI / 2, fovRadius: 160, hearingRadius: 140 });
var npcMemory = new BoundedMemory({ capacity: 10, decayRate: 0.1 });
var npcKnowledge = new NPCKnowledge({ memory: npcMemory });
var utilityAI = new UtilityAI({ useDefaultActions: false, defaultThreshold: 0.05 });
utilityAI.registerAction(new UtilityAction({
  id: "attack",
  priority: 10,
  considerations: [
    new UtilityConsideration({ id: "player_visible", evaluate: (ctx2) => ctx2.spotted ? 1 : 0 }),
    new UtilityConsideration({ id: "is_hostile", evaluate: (ctx2) => ctx2.isHostile ? 1 : 0 }),
    new UtilityConsideration({ id: "health_ratio", evaluate: (ctx2) => ctx2.npcHp / ctx2.npcMaxHp })
  ]
}));
utilityAI.registerAction(new UtilityAction({
  id: "flee",
  priority: 20,
  considerations: [
    new UtilityConsideration({ id: "low_health", evaluate: (ctx2) => ctx2.npcHp / ctx2.npcMaxHp < 0.3 ? 1 : 0 }),
    new UtilityConsideration({ id: "under_attack", evaluate: (ctx2) => ctx2.spotted && ctx2.isHostile ? 0.9 : 0.1 })
  ]
}));
utilityAI.registerAction(new UtilityAction({
  id: "heal",
  priority: 5,
  considerations: [
    new UtilityConsideration({ id: "wounded", evaluate: (ctx2) => 1 - ctx2.npcHp / ctx2.npcMaxHp }),
    new UtilityConsideration({ id: "safe_distance", evaluate: (ctx2) => ctx2.spotted ? 0.2 : 0.8 })
  ]
}));
utilityAI.registerAction(new UtilityAction({
  id: "patrol",
  priority: 1,
  considerations: [
    new UtilityConsideration({ id: "not_hostile", evaluate: (ctx2) => !ctx2.isHostile || !ctx2.spotted ? 0.85 : 0.05 })
  ]
}));
var abilitySpecs = {
  fireball: { id: "fireball", manaCost: 20, cooldown: 1, budgetCost: 15 },
  frost_nova: { id: "frost_nova", manaCost: 25, cooldown: 3, budgetCost: 25 },
  heal_surge: { id: "heal_surge", manaCost: 30, cooldown: 5, budgetCost: 20 }
};
var abilityCooldowns = { fireball: 0, frost_nova: 0, heal_surge: 0 };
var spatialHash = new SpatialHashGrid({ cellSize: 40 });
var player = {
  x: 140,
  y: 220,
  w: 16,
  h: 16,
  vx: 0,
  vy: 0,
  hp: 100,
  maxHp: 100,
  mp: 100,
  maxMp: 100,
  elevation: 0,
  layer: CollisionLayers?.PLAYER || 1,
  motor: new KnockbackMotor({ friction: 8 })
};
var npc = {
  x: 480,
  y: 220,
  w: 16,
  h: 16,
  vx: 0,
  vy: 0,
  hp: 120,
  maxHp: 120,
  facingAngle: Math.PI,
  elevation: 0,
  layer: CollisionLayers?.ENEMY || 2,
  motor: new KnockbackMotor({ friction: 8 })
};
var projectiles = [];
var noisePulse = null;
var saveEngine = new VersionedSaveEngine({
  currentVersion: 1,
  validateReferences: false,
  autoRecoverCorrupt: false
});
var activeTool = "move";
var keysDown = /* @__PURE__ */ new Set();
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    keysDown.add(e.key.toLowerCase());
    if (e.key === "1") triggerAbility("fireball");
    if (e.key === "2") triggerAbility("frost_nova");
    if (e.key === "3") triggerAbility("heal_surge");
  });
  window.addEventListener("keyup", (e) => {
    keysDown.delete(e.key.toLowerCase());
  });
}
if (canvas) {
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cellX = Math.floor(mx / TILE_SIZE);
    const cellY = Math.floor(my / TILE_SIZE);
    if (activeTool === "move") {
      const startTileX = Math.floor(player.x / TILE_SIZE);
      const startTileY = Math.floor(player.y / TILE_SIZE);
      const allowDiag = document.getElementById("chk-allow-diagonal")?.checked ?? true;
      const path = navGrid.findPath(startTileX, startTileY, cellX, cellY, { allowDiagonal: allowDiag });
      if (path && path.length > 0) {
        activePath = path.map((p) => ({ x: (p.x + 0.5) * TILE_SIZE, y: (p.y + 0.5) * TILE_SIZE }));
        const el = document.getElementById("path-nodes-count");
        if (el) el.textContent = path.length;
      }
    } else if (activeTool === "wood" || activeTool === "fire" || activeTool === "water" || activeTool === "sand") {
      cellSim.setCell(cellX, cellY, activeTool);
      playSynthesizedTone(300, 0.08, "square", "ui");
    } else if (activeTool === "erase") {
      cellSim.setCell(cellX, cellY, "empty");
    }
  });
}
function triggerAbility(id) {
  if (abilityCooldowns[id] > 0) return;
  const ab = abilitySpecs[id];
  if (!ab || player.mp < ab.manaCost) return;
  player.mp -= ab.manaCost;
  abilityCooldowns[id] = ab.cooldown;
  if (id === "fireball") {
    const dx = npc.x - player.x;
    const dy = npc.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 260;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: dx / dist * speed,
      vy: dy / dist * speed,
      radius: 6,
      type: "fire"
    });
    playSynthesizedTone(440, 0.18, "sawtooth", "sfx");
    triggerNoisePulse(player.x, player.y);
  } else if (id === "frost_nova") {
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const cx = px + dx;
        const cy = py + dy;
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
          const c = cellSim.getCell(cx, cy);
          if (c && c.materialId === "fire") {
            cellSim.setCell(cx, cy, "empty");
            facts.set("fires_extinguished", (facts.get("fires_extinguished") || 0) + 1);
          }
        }
      }
    }
    const distToNpc = Math.hypot(npc.x - player.x, npc.y - player.y);
    if (distToNpc < 100) {
      statusEffects.applyEffect({
        name: "chilled",
        duration: 4,
        stackMode: "replace",
        category: "debuff"
      });
    }
    playSynthesizedTone(600, 0.25, "triangle", "sfx");
    triggerNoisePulse(player.x, player.y);
  } else if (id === "heal_surge") {
    statusEffects.applyEffect({
      name: "regeneration",
      duration: 5,
      stackMode: "replace",
      tickInterval: 1,
      category: "buff",
      onTick: () => {
        player.hp = Math.min(player.maxHp, player.hp + 8);
      }
    });
    playSynthesizedTone(523.25, 0.3, "sine", "sfx");
  }
}
function triggerNoisePulse(x, y) {
  noisePulse = { x, y, radius: 10, maxRadius: 140, alpha: 1 };
  const d = Math.hypot(npc.x - x, npc.y - y);
  if (d <= 140) {
    npc.facingAngle = Math.atan2(y - npc.y, x - npc.x);
    npcMemory.record({ type: "heard_noise", x, y, timestamp: performance.now() });
  }
}
function toggleFaction(forceHostile = false) {
  const current = facts.get("guard_attitude");
  const next = forceHostile ? "hostile" : current === "friendly" ? "hostile" : "friendly";
  facts.set("guard_attitude", next);
  const rep = next === "friendly" ? 50 : -50;
  factions.setReputation("town_guard", "player_guild", rep);
  const el = document.getElementById("faction-attitude");
  if (el) {
    el.textContent = next.toUpperCase();
    el.style.color = next === "friendly" ? "var(--accent-emerald)" : "var(--accent-rose)";
  }
}
function triggerNotification(text) {
  const el = document.getElementById("save-status-msg");
  if (el) {
    el.textContent = text;
    el.style.color = "var(--accent-cyan)";
    setTimeout(() => {
      el.textContent = "Ready";
    }, 4e3);
  }
}
if (typeof document !== "undefined" && typeof document.querySelectorAll === "function") {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTool = btn.dataset.tool;
    });
  });
  document.getElementById("btn-ability-1")?.addEventListener("click", () => triggerAbility("fireball"));
  document.getElementById("btn-ability-2")?.addEventListener("click", () => triggerAbility("frost_nova"));
  document.getElementById("btn-ability-3")?.addEventListener("click", () => triggerAbility("heal_surge"));
  document.getElementById("btn-sim-toggle")?.addEventListener("click", (e) => {
    simRunning = !simRunning;
    e.target.textContent = simRunning ? "Pause Sim" : "Resume Sim";
  });
  document.getElementById("btn-sim-step")?.addEventListener("click", () => cellSim.step());
  document.getElementById("btn-sim-clear")?.addEventListener("click", () => cellSim.clear());
  document.getElementById("btn-make-noise")?.addEventListener("click", () => triggerNoisePulse(player.x, player.y));
  document.getElementById("btn-toggle-faction")?.addEventListener("click", () => toggleFaction());
  document.getElementById("btn-recompute-nav")?.addEventListener("click", () => {
    activePath = [];
  });
  document.getElementById("btn-test-knockback")?.addEventListener("click", () => {
    player.motor.applyImpulse(-180, -90);
    playSynthesizedTone(180, 0.15, "sawtooth", "sfx");
  });
  document.getElementById("btn-gain-xp")?.addEventListener("click", () => {
    const levelsGained = progression.grantExperience(50);
    facts.set("player_level", progression.level);
    if (levelsGained.length > 0) {
      eventBus.emit("level_up", { level: progression.level });
      player.hp = player.maxHp;
      playSynthesizedTone(880, 0.4, "sine", "sfx");
    }
    updateRPGUI();
  });
  document.getElementById("btn-roll-loot")?.addEventListener("click", () => {
    const drops = lootTable.roll();
    if (drops && drops.length > 0) {
      const drop = drops[0];
      const it = itemRegistry.get(drop.itemId);
      if (it) {
        inventory.addItem(it.id, drop.quantity || 1);
        facts.set("enemies_bested", (facts.get("enemies_bested") || 0) + 1);
        playSynthesizedTone(587.33, 0.15, "triangle", "ui");
        updateInventoryUI();
      }
    }
  });
  ["master", "music", "sfx", "ui"].forEach((bus) => {
    const slider = document.getElementById(`vol-${bus}`);
    const valLabel = document.getElementById(`val-${bus}`);
    const muteBtn = document.getElementById(`mute-${bus}`);
    if (slider) {
      slider.addEventListener("input", (e) => {
        const vol = parseFloat(e.target.value);
        audioBuses.setVolume(bus, vol);
        if (valLabel) valLabel.textContent = `${Math.round(vol * 100)}%`;
      });
    }
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        const isMuted = audioBuses.isMuted(bus);
        audioBuses.setMuted(bus, !isMuted);
        muteBtn.style.color = !isMuted ? "var(--accent-rose)" : "inherit";
      });
    }
  });
  document.getElementById("btn-test-sound")?.addEventListener("click", () => {
    playSynthesizedTone(440, 0.2, "sine", "sfx");
  });
  const storyModal = document.getElementById("story-modal");
  document.getElementById("btn-talk-guard")?.addEventListener("click", () => openDialogue("guard_greeting"));
  document.getElementById("btn-close-dialogue")?.addEventListener("click", () => {
    if (storyModal) storyModal.hidden = true;
  });
  document.getElementById("btn-save-game")?.addEventListener("click", () => {
    const snapshot = {
      player: { x: player.x, y: player.y, hp: player.hp, mp: player.mp },
      facts: facts.toObject(),
      inventory: inventory.slots.map((s) => ({ id: s.item.id, quantity: s.quantity })),
      equipped: {
        mainHand: equipment.getSlot("mainHand")?.id || null,
        armor: equipment.getSlot("armor")?.id || null,
        accessory: equipment.getSlot("accessory")?.id || null
      },
      level: progression.level,
      xp: progression.experience,
      worldHour
    };
    const serialized = saveEngine.save("slot_1", snapshot);
    const msgEl = document.getElementById("save-status-msg");
    const prevEl = document.getElementById("save-preview");
    if (msgEl) msgEl.textContent = "Snapshot saved successfully!";
    if (prevEl) prevEl.textContent = JSON.stringify(serialized, null, 2).slice(0, 300) + "...";
    playSynthesizedTone(523.25, 0.15, "sine", "ui");
  });
  document.getElementById("btn-load-game")?.addEventListener("click", () => {
    try {
      const loaded = saveEngine.load("slot_1");
      if (loaded.player) {
        player.x = loaded.player.x;
        player.y = loaded.player.y;
        player.hp = loaded.player.hp;
        player.mp = loaded.player.mp;
      }
      worldHour = loaded.worldHour || 10;
      if (loaded.facts) {
        for (const [k, v] of Object.entries(loaded.facts)) {
          facts.set(k, v);
        }
      }
      if (loaded.level) {
        progression.level = loaded.level;
        progression.experience = loaded.xp || 0;
      }
      const msgEl = document.getElementById("save-status-msg");
      if (msgEl) {
        msgEl.textContent = "Save loaded cleanly!";
        msgEl.style.color = "var(--accent-emerald)";
      }
      playSynthesizedTone(659.25, 0.2, "sine", "ui");
      updateRPGUI();
    } catch (err) {
      const msgEl = document.getElementById("save-status-msg");
      if (msgEl) {
        msgEl.textContent = `Load Failed: ${err.message}`;
        msgEl.style.color = "var(--accent-rose)";
      }
    }
  });
  document.getElementById("btn-test-corrupt")?.addEventListener("click", () => {
    try {
      saveEngine.recoverCorruptJson('{"invalid_json": true, incomplete', { throwOnError: true });
    } catch (err) {
      const msgEl = document.getElementById("save-status-msg");
      if (msgEl) {
        msgEl.textContent = `Correctly caught: ${err.name} (${err.message})`;
        msgEl.style.color = "var(--accent-rose)";
      }
      playSynthesizedTone(150, 0.3, "sawtooth", "sfx");
    }
  });
}
function openDialogue(nodeId) {
  const storyModal = document.getElementById("story-modal");
  if (!storyModal) return;
  const node = storyGraph.getNode(nodeId);
  if (!node) {
    storyModal.hidden = true;
    return;
  }
  storyModal.hidden = false;
  const speakerEl = document.getElementById("dialogue-speaker");
  const textEl = document.getElementById("dialogue-text");
  if (speakerEl) speakerEl.textContent = node.speaker || "NPC";
  if (textEl) textEl.textContent = typeof node.text === "function" ? node.text() : node.text;
  const choiceContainer = document.getElementById("dialogue-choices");
  if (choiceContainer && typeof choiceContainer.appendChild === "function") {
    choiceContainer.innerHTML = "";
    if (node.choices) {
      node.choices.forEach((ch) => {
        const b = document.createElement("button");
        b.className = "choice-btn";
        b.textContent = ch.text;
        b.onclick = () => {
          if (ch.next) openDialogue(ch.next);
          else storyModal.hidden = true;
        };
        choiceContainer.appendChild(b);
      });
    }
  }
}
var lastTime = typeof performance !== "undefined" ? performance.now() : 0;
var fpsCounter = 0;
var fpsTimer = 0;
function updateShowcase(dt) {
  dt = Math.max(0, Number.isFinite(dt) ? dt : 0);
  for (const k in abilityCooldowns) {
    if (abilityCooldowns[k] > 0) abilityCooldowns[k] = Math.max(0, abilityCooldowns[k] - dt);
  }
  player.mp = Math.min(player.maxMp, player.mp + 5 * dt);
  statusEffects.update(dt);
  if (simRunning) {
    cellSim.step();
    const cellCountEl = document.getElementById("active-cells-count");
    if (cellCountEl) {
      let count = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = cellSim.getCell(x, y);
          if (c && c.materialId !== "air" && c.materialId !== "empty") count++;
        }
      }
      cellCountEl.textContent = count;
    }
  }
  if (autoAdvanceTime) {
    worldHour = (worldHour + dt) % 24;
    const timeSlider = document.getElementById("time-slider");
    if (timeSlider) timeSlider.value = worldHour;
  }
  const hourInt = Math.floor(worldHour);
  const minInt = Math.floor(worldHour % 1 * 60);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  const displayHour = hourInt % 12 || 12;
  const clockEl = document.getElementById("world-clock");
  if (clockEl) clockEl.textContent = `${displayHour}:${minInt < 10 ? "0" : ""}${minInt} ${ampm}`;
  const currentSlot = schedule.getSlotForHour(worldHour);
  const routineEl = document.getElementById("npc-routine-name");
  if (currentSlot && routineEl) {
    routineEl.textContent = currentSlot.activity;
  }
  let moveX = 0;
  let moveY = 0;
  if (keysDown.has("w") || keysDown.has("arrowup")) moveY -= 1;
  if (keysDown.has("s") || keysDown.has("arrowdown")) moveY += 1;
  if (keysDown.has("a") || keysDown.has("arrowleft")) moveX -= 1;
  if (keysDown.has("d") || keysDown.has("arrowright")) moveX += 1;
  if (activePath.length > 0 && moveX === 0 && moveY === 0) {
    const nextWaypoint = activePath[0];
    const dx2 = nextWaypoint.x - player.x;
    const dy2 = nextWaypoint.y - player.y;
    const d = Math.hypot(dx2, dy2);
    if (d < 4) {
      activePath.shift();
      const pathEl = document.getElementById("path-nodes-count");
      if (pathEl) pathEl.textContent = activePath.length;
    } else {
      moveX = dx2 / d;
      moveY = dy2 / d;
    }
  }
  const speed = 160 + (equipment.getSlot("accessory")?.stats?.spd || 0);
  const len = Math.hypot(moveX, moveY);
  if (len > 0) {
    player.vx = moveX / len * speed;
    player.vy = moveY / len * speed;
  } else {
    player.vx = 0;
    player.vy = 0;
  }
  const staticObstacles = [];
  const startTileX = Math.max(0, Math.floor((player.x - 40) / TILE_SIZE));
  const endTileX = Math.min(COLS - 1, Math.floor((player.x + 40) / TILE_SIZE));
  const startTileY = Math.max(0, Math.floor((player.y - 40) / TILE_SIZE));
  const endTileY = Math.min(ROWS - 1, Math.floor((player.y + 40) / TILE_SIZE));
  for (let ty = startTileY; ty <= endTileY; ty++) {
    for (let tx = startTileX; tx <= endTileX; tx++) {
      const tile = mapData[ty * COLS + tx];
      if (tile === 1 || tile === 3 && player.elevation === 0) {
        staticObstacles.push({
          left: tx * TILE_SIZE,
          right: (tx + 1) * TILE_SIZE,
          top: ty * TILE_SIZE,
          bottom: (ty + 1) * TILE_SIZE
        });
      }
    }
  }
  const playerBounds = {
    left: player.x - player.w / 2,
    right: player.x + player.w / 2,
    top: player.y - player.h / 2,
    bottom: player.y + player.h / 2
  };
  if (player.vx !== 0 || player.vy !== 0) {
    const sweep = SweptAABB.sweepAgainstObstacles(playerBounds, player.vx * dt, player.vy * dt, staticObstacles);
    if (sweep.hit) {
      player.x += player.vx * dt * sweep.toi;
      player.y += player.vy * dt * sweep.toi;
    } else {
      player.x += player.vx * dt;
      player.y += player.vy * dt;
    }
  }
  if (player.motor.isActive) {
    const kb = player.motor.step(dt, playerBounds, staticObstacles);
    player.x += kb.dx;
    player.y += kb.dy;
  }
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const tileX = Math.floor(p.x / TILE_SIZE);
    const tileY = Math.floor(p.y / TILE_SIZE);
    if (tileX <= 0 || tileX >= COLS - 1 || tileY <= 0 || tileY >= ROWS - 1 || mapData[tileY * COLS + tileX] === 1) {
      projectiles.splice(i, 1);
      continue;
    }
    const cell = cellSim.getCell(tileX, tileY);
    if (cell && (cell.materialId === "wood" || cell.materialId === "dry_wood")) {
      cellSim.setCell(tileX, tileY, "fire");
      projectiles.splice(i, 1);
      continue;
    }
    const distToNpc = Math.hypot(p.x - npc.x, p.y - npc.y);
    if (distToNpc < npc.w) {
      npc.hp = Math.max(0, npc.hp - 25);
      npc.motor.applyImpulse(p.vx * 0.4, p.vy * 0.4);
      statusEffects.applyEffect({ name: "burning", duration: 3, category: "debuff" });
      toggleFaction(true);
      projectiles.splice(i, 1);
      playSynthesizedTone(220, 0.2, "sawtooth", "sfx");
    }
  }
  const dx = player.x - npc.x;
  const dy = player.y - npc.y;
  const distToPlayer = Math.hypot(dx, dy);
  const fovRange = parseFloat(document.getElementById("fov-range")?.value || 160);
  const fovAngleDeg = parseFloat(document.getElementById("fov-angle")?.value || 90);
  const fovAngleRad = fovAngleDeg * Math.PI / 180;
  perception.fovRadius = fovRange;
  perception.fovAngle = fovAngleRad;
  const playerAngle = Math.atan2(dy, dx);
  let angleDiff = Math.abs(playerAngle - npc.facingAngle);
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
  const canSeePlayer = distToPlayer <= fovRange && angleDiff <= fovAngleRad / 2;
  const isHostile = facts.get("guard_attitude") === "hostile";
  const awareStatusEl = document.getElementById("ai-awareness-status");
  if (canSeePlayer) {
    npcMemory.record({ type: "spotted_player", x: player.x, y: player.y, timestamp: performance.now() });
    if (awareStatusEl) {
      awareStatusEl.textContent = isHostile ? "ENGAGING (HOSTILE)" : "OBSERVING";
      awareStatusEl.style.color = isHostile ? "var(--accent-rose)" : "var(--accent-cyan)";
    }
  } else {
    if (awareStatusEl) {
      awareStatusEl.textContent = "UNAWARE";
      awareStatusEl.style.color = "var(--accent-emerald)";
    }
  }
  const aiContext = {
    spotted: canSeePlayer,
    isHostile,
    npcHp: npc.hp,
    npcMaxHp: npc.maxHp,
    distToPlayer
  };
  const decision = utilityAI.evaluate(aiContext);
  if (decision) {
    const scores = {};
    if (decision.candidateScores) {
      for (const c of decision.candidateScores) {
        scores[c.id] = c.score;
      }
    }
    const scorePatrolEl = document.getElementById("ai-score-patrol");
    const scoreAttackEl = document.getElementById("ai-score-attack");
    const scoreFleeEl = document.getElementById("ai-score-flee");
    const scoreHealEl = document.getElementById("ai-score-heal");
    if (scorePatrolEl) scorePatrolEl.textContent = scores.patrol?.toFixed(2) || "0.00";
    if (scoreAttackEl) scoreAttackEl.textContent = scores.attack?.toFixed(2) || "0.00";
    if (scoreFleeEl) scoreFleeEl.textContent = scores.flee?.toFixed(2) || "0.00";
    if (scoreHealEl) scoreHealEl.textContent = scores.heal?.toFixed(2) || "0.00";
    const chosenId = decision.chosenAction ? decision.chosenAction.id : "patrol";
    const traceEl = document.getElementById("ai-decision-trace");
    if (traceEl) {
      traceEl.textContent = `Selected: [${chosenId.toUpperCase()}]
Scores: ${JSON.stringify(scores, null, 1)}`;
    }
    if (chosenId === "attack" && distToPlayer > 30) {
      npc.vx = dx / distToPlayer * 80;
      npc.vy = dy / distToPlayer * 80;
      npc.facingAngle = Math.atan2(dy, dx);
    } else if (chosenId === "flee") {
      npc.vx = -dx / distToPlayer * 100;
      npc.vy = -dy / distToPlayer * 100;
      npc.facingAngle = Math.atan2(-dy, -dx);
    } else {
      npc.vx = 0;
      npc.vy = 0;
    }
  }
  npc.x += npc.vx * dt;
  npc.y += npc.vy * dt;
  if (npc.motor.isActive) {
    const kb = npc.motor.step(dt, { left: npc.x - 8, right: npc.x + 8, top: npc.y - 8, bottom: npc.y + 8 }, []);
    npc.x += kb.dx;
    npc.y += kb.dy;
  }
  if (noisePulse) {
    noisePulse.radius += 180 * dt;
    noisePulse.alpha = Math.max(0, 1 - noisePulse.radius / noisePulse.maxRadius);
    if (noisePulse.alpha <= 0) noisePulse = null;
  }
  const hpBar = document.getElementById("hp-bar");
  const hpText = document.getElementById("hp-text");
  const manaBar = document.getElementById("mana-bar");
  const manaText = document.getElementById("mana-text");
  if (hpBar) hpBar.style.width = `${Math.round(player.hp / player.maxHp * 100)}%`;
  if (hpText) hpText.textContent = `${Math.round(player.hp)}/${player.maxHp}`;
  if (manaBar) manaBar.style.width = `${Math.round(player.mp / player.maxMp * 100)}%`;
  if (manaText) manaText.textContent = `${Math.round(player.mp)}/${player.maxMp}`;
  updateFactsTable();
}
function renderShowcase() {
  if (!ctx || typeof ctx.beginPath !== "function") return;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = mapData[y * COLS + x];
      if (tile === 1) {
        ctx.fillStyle = "#2d3748";
      } else if (tile === 2) {
        ctx.fillStyle = "#1e3a5f";
      } else if (tile === 3) {
        ctx.fillStyle = "#0a0d14";
      } else if (tile === 4) {
        ctx.fillStyle = "#4a5568";
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#1a2332" : "#17202e";
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = cellSim.getCell(x, y);
      if (!cell || cell.materialId === "air" || cell.materialId === "empty") continue;
      if (cell.materialId === "wood" || cell.materialId === "dry_wood") {
        ctx.fillStyle = "#854d0e";
      } else if (cell.materialId === "fire") {
        ctx.fillStyle = Math.random() > 0.4 ? "#ef4444" : "#f97316";
      } else if (cell.materialId === "water") {
        ctx.fillStyle = "#38bdf8";
      } else if (cell.materialId === "sand") {
        ctx.fillStyle = "#fbbf24";
      } else if (cell.materialId === "steam") {
        ctx.fillStyle = "rgba(203, 213, 225, 0.4)";
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  if (document.getElementById("chk-spatial-grid")?.checked) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  }
  if (activePath.length > 0) {
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    activePath.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#38bdf8";
    activePath.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  const fovRange = perception.fovRadius;
  const fovAngle = perception.fovAngle;
  ctx.save();
  ctx.fillStyle = facts.get("guard_attitude") === "hostile" ? "rgba(239, 68, 68, 0.12)" : "rgba(56, 189, 248, 0.12)";
  ctx.strokeStyle = facts.get("guard_attitude") === "hostile" ? "rgba(239, 68, 68, 0.35)" : "rgba(56, 189, 248, 0.35)";
  ctx.beginPath();
  ctx.moveTo(npc.x, npc.y);
  ctx.arc(npc.x, npc.y, fovRange, npc.facingAngle - fovAngle / 2, npc.facingAngle + fovAngle / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (noisePulse) {
    ctx.save();
    ctx.strokeStyle = `rgba(52, 211, 153, ${noisePulse.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(noisePulse.x, noisePulse.y, noisePulse.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = facts.get("guard_attitude") === "hostile" ? "#ef4444" : "#10b981";
  ctx.beginPath();
  ctx.arc(npc.x, npc.y, npc.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(npc.x, npc.y);
  ctx.lineTo(npc.x + Math.cos(npc.facingAngle) * 14, npc.y + Math.sin(npc.facingAngle) * 14);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  projectiles.forEach((p) => {
    ctx.save();
    ctx.fillStyle = "#f97316";
    ctx.shadowColor = "#ea580c";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const rawDt = (timestamp - lastTime) / 1e3;
  const dt = Math.max(0, Math.min(Number.isFinite(rawDt) ? rawDt : 0.016, 0.1));
  lastTime = timestamp;
  fpsCounter++;
  fpsTimer += dt;
  if (fpsTimer >= 1) {
    const fpsEl = document.getElementById("fps-display");
    if (fpsEl) fpsEl.textContent = fpsCounter;
    fpsCounter = 0;
    fpsTimer = 0;
  }
  updateShowcase(dt);
  renderShowcase();
  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(gameLoop);
  }
}
function updateRPGUI() {
  const lvlEl = document.getElementById("rpg-level");
  const xpEl = document.getElementById("rpg-xp");
  if (lvlEl) lvlEl.textContent = progression.level;
  if (xpEl) xpEl.textContent = `${progression.experience} / ${progression.experienceToNextLevel()}`;
  const baseAtk = 15 + progression.level * 2;
  const baseDef = 5 + progression.level;
  const gearAtk = equipment.getSlot("mainHand")?.stats?.atk || 0;
  const gearDef = (equipment.getSlot("armor")?.stats?.def || 0) + (equipment.getSlot("offHand")?.stats?.def || 0);
  const atkEl = document.getElementById("stat-atk");
  const defEl = document.getElementById("stat-def");
  if (atkEl) atkEl.textContent = baseAtk + gearAtk;
  if (defEl) defEl.textContent = baseDef + gearDef;
}
function updateInventoryUI() {
  const container = document.getElementById("inventory-grid-container");
  if (!container || typeof container.appendChild !== "function") return;
  container.innerHTML = "";
  inventory.slots.forEach((slotData, idx) => {
    const it = slotData.item;
    const slot = document.createElement("div");
    slot.className = "inventory-slot";
    slot.textContent = `${it.name}${slotData.quantity > 1 ? ` (${slotData.quantity})` : ""}`;
    slot.onclick = () => {
      if (it.type === "consumable" || it.slot === "consumable") {
        player.hp = Math.min(player.maxHp, player.hp + (it.healAmount || 30));
        inventory.removeItem(it.id, 1);
        playSynthesizedTone(440, 0.15, "sine", "ui");
      } else {
        equipment.equip(it.slot || "mainHand", it);
        inventory.removeItem(it.id, 1);
        playSynthesizedTone(520, 0.15, "triangle", "ui");
        updateEquipmentDisplay();
        updateRPGUI();
      }
      updateInventoryUI();
    };
    container.appendChild(slot);
  });
}
function updateEquipmentDisplay() {
  const mainHand = equipment.getSlot("mainHand");
  const armor = equipment.getSlot("armor");
  const acc = equipment.getSlot("accessory");
  const mhEl = document.getElementById("gear-mainhand-name");
  const arEl = document.getElementById("gear-armor-name");
  const acEl = document.getElementById("gear-acc-name");
  if (mhEl) mhEl.textContent = mainHand ? mainHand.name : "(Empty)";
  if (arEl) arEl.textContent = armor ? armor.name : "(Empty)";
  if (acEl) acEl.textContent = acc ? acc.name : "(Empty)";
}
function updateFactsTable() {
  const el = document.getElementById("world-facts-table");
  if (!el) return;
  const entries = facts.entries();
  el.innerHTML = Array.from(entries).map(([k, v]) => `<div><span style="color:var(--text-muted)">${k}:</span> <span style="color:var(--accent-cyan)">${v}</span></div>`).join("");
}
if (typeof document !== "undefined" && typeof document.createElement === "function") {
  updateRPGUI();
  updateInventoryUI();
  updateEquipmentDisplay();
  updateFactsTable();
}
if (typeof window !== "undefined" && typeof process === "undefined" && typeof requestAnimationFrame !== "undefined") {
  requestAnimationFrame(gameLoop);
}
export {
  audioBuses,
  cellSim,
  equipment,
  eventBus,
  factions,
  facts,
  inventory,
  itemRegistry,
  lootTable,
  materialReg,
  navGrid,
  npc,
  perception,
  player,
  progression,
  renderShowcase,
  ruleEngine,
  saveEngine,
  schedule,
  scheduleSystem,
  statusEffects,
  storyGraph,
  updateShowcase,
  utilityAI,
  worldMetadata
};
