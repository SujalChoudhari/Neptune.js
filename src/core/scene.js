import { Renderable } from "../rendering/renderable.js";
import { Entity } from "./entity.js";
import { SceneManager } from "./sceneManager.js";
import { Maths } from "../math/math.js";

export const SCENE_SCHEMA_VERSION = 1;
export const SCENE_DATA_VERSION = "1.0.0";

export const RESOURCE_REFERENCE_ERROR_CODE = "RESOURCE_REFERENCE_INVALID";

const RESOURCE_TYPES = {
    tileset: new Set(["tileset", "image", "texture", "resource", "asset"]),
    sprite: new Set(["sprite", "image", "texture", "resource", "asset"]),
    animation: new Set(["animation", "resource", "asset"]),
    audio: new Set(["audio", "sound", "music", "resource", "asset"]),
    prefab: new Set(["prefab", "scene", "resource", "asset"]),
    tilemap: new Set(["tilemap", "map", "resource", "asset"])
};

const describeReference = (value) => {
    if (value === undefined || value === null) return "<missing>";
    if (typeof value === "string") return value.trim() || "<empty>";
    if (typeof value !== "object") return String(value);
    for (const key of ["id", "path", "uri", "key", "ref"]) {
        if (typeof value[key] === "string" && value[key].trim()) return value[key];
    }
    return "<malformed>";
};

/**
 * Error raised when a serialized resource reference cannot be used safely.
 * The code and fields are stable so editor and runtime diagnostics can consume
 * the same failure without parsing the human-readable message.
 */
export class ResourceReferenceError extends Error {
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
}

/** Return the usable string target from a serialized reference. */
export function getResourceReferenceTarget(value, kind, sourceLocation = kind) {
    assertResourceReference(value, kind, sourceLocation);
    if (typeof value === "string") return value.trim();
    for (const key of ["path", "uri", "id", "key", "ref"]) {
        if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
    }
    return null;
}

/** Validate a serialized resource reference without checking the filesystem. */
export function assertResourceReference(value, kind, sourceLocation = kind) {
    const types = RESOURCE_TYPES[kind] || new Set([kind, "resource", "asset"]);
    if (value === undefined || value === null) {
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
    if (declaredType !== undefined &&
        (typeof declaredType !== "string" || !types.has(declaredType.toLowerCase()))) {
        throw new ResourceReferenceError(kind, value, sourceLocation,
            `declared type '${String(declaredType)}' is incompatible`);
    }

    const targetKeys = ["path", "uri", "id", "key", "ref"];
    const target = targetKeys.find(key => typeof value[key] === "string" && value[key].trim());
    if (!target) {
        throw new ResourceReferenceError(kind, value, sourceLocation, "reference object has no usable target");
    }
    return value[target].trim();
}

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

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
        assertResourceReference(props.path ?? props.texture ?? props.asset ?? props.reference,
            "sprite", `${propsLocation}.path`);
    } else if (componentType === "sound" || componentType === "soundpool" || componentType === "audio") {
        assertResourceReference(props.src ?? props.path ?? props.audio ?? props.asset ?? props.reference,
            "audio", `${propsLocation}.${props.src !== undefined ? "src" : "path"}`);
    } else if (componentType === "tilemap") {
        assertResourceReference(props.tileset ?? props.tilesetRef ?? props.asset,
            "tileset", `${propsLocation}.tileset`);
    } else if (componentType === "animation") {
        assertResourceReference(props.path ?? props.animation ?? props.asset ?? props.reference,
            "animation", `${propsLocation}.animation`);
    } else if (componentType === "animator") {
        const animations = props.animations;
        if (Array.isArray(animations)) {
            animations.forEach((animation, index) => assertResourceReference(animation, "animation",
                `${propsLocation}.animations[${index}]`));
        } else if (animations !== undefined) {
            if (isObject(animations) && !("path" in animations || "uri" in animations || "id" in animations || "key" in animations || "ref" in animations)) {
                Object.entries(animations).forEach(([name, animation]) => assertResourceReference(animation, "animation",
                    `${propsLocation}.animations.${name}`));
            } else {
                assertResourceReference(animations, "animation", `${propsLocation}.animations`);
            }
        }
        if (props.currentAnimation !== undefined) {
            assertResourceReference(props.currentAnimation, "animation", `${propsLocation}.currentAnimation`);
        }
    }
}

function validateEntityReferences(entity, sourceLocation) {
    if (!isObject(entity)) return;
    if (entity.prefab !== undefined) assertResourceReference(entity.prefab, "prefab", `${sourceLocation}.prefab`);
    if (entity.prefabRef !== undefined) assertResourceReference(entity.prefabRef, "prefab", `${sourceLocation}.prefabRef`);
    if (Array.isArray(entity.components)) {
        entity.components.forEach((component, index) =>
            validateComponentReferences(component, `${sourceLocation}.components[${index}]`));
    }
    if (Array.isArray(entity.children)) {
        entity.children.forEach((child, index) => validateEntityReferences(child, `${sourceLocation}.children[${index}]`));
    }
}

/** Validate resource references in a serialized scene before instantiation. */
export function validateSceneResourceReferences(data, sourceLocation = "scene") {
    if (!isObject(data)) return data;
    if (Array.isArray(data.layers)) {
        data.layers.forEach((layer, layerIndex) => {
            const layerLocation = `${sourceLocation}.layers[${layerIndex}]`;
            if (!isObject(layer)) return;
            if (layer.type === "tilemap") {
                assertResourceReference(layer.src, "tilemap", `${layerLocation}.src`);
            }
            if (layer.prefab !== undefined) {
                assertResourceReference(layer.prefab, "prefab", `${layerLocation}.prefab`);
            }
            if (Array.isArray(layer.entities)) {
                layer.entities.forEach((entity, entityIndex) =>
                    validateEntityReferences(entity, `${layerLocation}.entities[${entityIndex}]`));
            }
        });
    }
    if (Array.isArray(data.entities)) {
        data.entities.forEach((entity, index) => validateEntityReferences(entity, `${sourceLocation}.entities[${index}]`));
    }
    if (data.prefab !== undefined) assertResourceReference(data.prefab, "prefab", `${sourceLocation}.prefab`);
    if (Array.isArray(data.prefabs)) {
        data.prefabs.forEach((prefab, index) => assertResourceReference(prefab, "prefab", `${sourceLocation}.prefabs[${index}]`));
    } else if (isObject(data.prefabs)) {
        Object.entries(data.prefabs).forEach(([name, prefab]) =>
            assertResourceReference(prefab, "prefab", `${sourceLocation}.prefabs.${name}`));
    }
    return data;
}

const cloneSerializable = (value, seen = new WeakSet()) => {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return undefined;
    seen.add(value);
    if (Array.isArray(value)) return value.map(item => cloneSerializable(item, seen));
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        const cloned = cloneSerializable(item, seen);
        if (cloned !== undefined) result[key] = cloned;
    }
    return result;
};

/**
 * Scene is a container for entities. It is used to organize the game objects in the game.
 * SceneManager is used to load and unload scenes. A scene can be used to only load specific entities.
 * If any entity is not part of a scene, it will be loaded by default.
 * @class Scene
 * @extends Entity
 * @property {number} id - Id of the scene. This is used to load the scene.
 */
export class Scene extends Entity {

    static SCHEMA_VERSION = SCENE_SCHEMA_VERSION;
    static DATA_VERSION = SCENE_DATA_VERSION;

    /** Called when The scene is loaded */
    OnSceneLoad = () => { };
    /** Called when the scene is unloaded */
    OnSceneUnload = () => { };
    /** Called when the scene is loaded in additive mode */
    OnSceneLoadAdditive = () => { };
    /** Called when the scene is unloaded in additive mode */
    OnSceneUnloadAdditive = () => { };

    constructor(name) {
        super(name);
        this.id = SceneManager.getIdForNewScene();
        SceneManager.addScene(this);
    }

    /** Serialize the scene graph using the versioned scene contract. */
    serialize() {
        return {
            type: "scene",
            version: SCENE_DATA_VERSION,
            schemaVersion: SCENE_SCHEMA_VERSION,
            id: this.id,
            name: this.name,
            camera: this.cameraSettings ? cloneSerializable(this.cameraSettings) : undefined,
            layers: [{
                name: "Main",
                type: "object_layer",
                root: true,
                entities: this.children.map(child => child.serialize())
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
    draw(ctx) {
        ctx.save();
        if (this.activeCamera) {
            this.activeCamera.apply(ctx);
        } else if (this.cameraSettings && this.cameraSettings.bounds) {
            const x = this.cameraSettings.bounds.x || 0;
            const y = this.cameraSettings.bounds.y || 0;
            const px = Maths.MeterToPixel(x);
            const py = Maths.MeterToPixel(y);
            ctx.translate(-px, -py);
        }

        this.GetComponentsInChildren(Renderable).forEach(renderable => {
            renderable.draw(ctx);
        });
        ctx.restore();
    }
}
