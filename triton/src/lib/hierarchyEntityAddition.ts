import type { SceneEntity } from "../types/engine";

export function appendHierarchyEntity(
    entities: Record<string, SceneEntity>,
    entity: SceneEntity
): Record<string, SceneEntity> {
    const parentId = entity.parentId || "root";
    const parent = entities[parentId];
    if (!parent || entities[entity.id]) return entities;

    return {
        ...entities,
        [parentId]: { ...parent, children: [...parent.children, entity.id] },
        [entity.id]: { ...entity, children: [...entity.children] }
    };
}
