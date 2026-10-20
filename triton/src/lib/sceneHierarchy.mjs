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
