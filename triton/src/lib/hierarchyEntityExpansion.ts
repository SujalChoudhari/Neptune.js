import type { SceneEntity } from "../types/engine";

export function setHierarchyEntityExpanded(
    entities: Record<string, SceneEntity>,
    id: string,
    expanded: boolean
): Record<string, SceneEntity> {
    const entity = entities[id];
    if (!entity || entity.expanded === expanded) return entities;
    return { ...entities, [id]: { ...entity, expanded } };
}

export function setAllHierarchyEntitiesExpanded(
    entities: Record<string, SceneEntity>,
    expanded: boolean
): Record<string, SceneEntity> {
    let changed = false;
    const next = Object.fromEntries(Object.entries(entities).map(([id, entity]) => {
        const entityExpanded = id === "root" || expanded;
        if (entity.expanded !== entityExpanded) changed = true;
        return [id, entity.expanded === entityExpanded ? entity : { ...entity, expanded: entityExpanded }];
    }));
    return changed ? next : entities;
}
