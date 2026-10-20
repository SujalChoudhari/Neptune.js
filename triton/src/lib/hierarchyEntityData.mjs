export function createHierarchyEntityData(entity) {
    const serializedComponents = Array.isArray(entity.components) ? entity.components : [];
    const components = Object.fromEntries(serializedComponents
        .filter(component => component && typeof component.type === "string")
        .map(component => [component.type, component.props && typeof component.props === "object" ? component.props : {}]));
    const sourceTransform = entity.transform || {};
    const position = sourceTransform.position || sourceTransform.pos || { x: 0, y: 0 };
    const scale = sourceTransform.scale || { x: 1, y: 1 };
    return {
        id: entity.id,
        name: entity.name,
        active: entity.active !== false,
        transform: {
            position: { x: position.x || 0, y: position.y || 0 },
            rotation: sourceTransform.rotation ?? sourceTransform.rot ?? 0,
            scale: { x: scale.x ?? 1, y: scale.y ?? 1 },
            z: sourceTransform.z || 0
        },
        components
    };
}

export function createHierarchyEntityDataBranch(branch) {
    const result = {};
    const visit = entity => {
        if (!entity || typeof entity !== "object" || typeof entity.id !== "string") return;
        result[entity.id] = createHierarchyEntityData(entity);
        if (Array.isArray(entity.children)) entity.children.forEach(visit);
    };
    visit(branch);
    return result;
}
