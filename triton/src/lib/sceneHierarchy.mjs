export function createSceneHierarchyEntity(data, parentId, fallbackId) {
    const id = data.id || fallbackId;
    return {
        id,
        parentId,
        name: data.name || "Entity",
        type: data.type || "entity",
        children: [],
        active: data.active !== false,
        locked: false,
        expanded: false
    };
}

export function projectInspectorComponent(component) {
    const props = component?.props ?? {};
    if (component?.type === "Sprite") {
        return { sprite: {
            path: props.path ?? "",
            width: props.width ?? 1,
            height: props.height ?? 1,
            blendMode: props.blendMode ?? "normal",
            color: props.color ?? "#ffffff"
        } };
    }
    if (component?.type === "BoxCollider") {
        return { collider: {
            width: props.width ?? 1,
            height: props.height ?? 1,
            offsetX: props.offsetX ?? 0,
            offsetY: props.offsetY ?? 0,
            isTrigger: props.isTrigger ?? false
        } };
    }
    if (component?.type === "PlayerController" || component?.type === "PlatformerBody") {
        return { body: {
            velocityX: 0,
            velocityY: 0,
            gravity: props.gravity ?? 9.8,
            maxFallSpeed: props.maxFallSpeed ?? 10,
            grounded: false,
            friction: props.friction ?? 0,
            drag: props.drag ?? 0
        } };
    }
    return {};
}
