import type { SceneEntity } from "../types/engine";

const branchContains = (entities: Record<string, SceneEntity>, rootId: string, targetId: string): boolean => {
    if (rootId === targetId) return true;
    const root = entities[rootId];
    return Boolean(root?.children.some(childId => branchContains(entities, childId, targetId)));
};

export function moveHierarchyEntities(
    entities: Record<string, SceneEntity>,
    ids: string[],
    targetParentId: string,
    targetIndex?: number
): Record<string, SceneEntity> {
    if (!Array.isArray(ids) || ids.length === 0 || new Set(ids).size !== ids.length || !entities[targetParentId]) return entities;
    if (ids.some(id => typeof id !== "string" || !entities[id])) return entities;

    const movingIds = ids.filter(id => !ids.some(otherId => otherId !== id && branchContains(entities, otherId, id)));
    if (movingIds.length === 0 || movingIds.some(id => branchContains(entities, id, targetParentId))) return entities;

    const next = { ...entities };
    const oldParentIds = new Set(movingIds.map(id => entities[id].parentId).filter((id): id is string => typeof id === "string"));
    oldParentIds.forEach(parentId => {
        const parent = next[parentId];
        if (parent) next[parentId] = { ...parent, children: parent.children.filter(childId => !movingIds.includes(childId)) };
    });

    const target = next[targetParentId];
    const children = [...target.children];
    const insertionIndex = typeof targetIndex === "number"
        ? Math.max(0, Math.min(targetIndex, children.length))
        : children.length;
    children.splice(insertionIndex, 0, ...movingIds);
    next[targetParentId] = { ...target, children };
    movingIds.forEach(id => {
        next[id] = { ...entities[id], parentId: targetParentId };
    });
    return next;
}
