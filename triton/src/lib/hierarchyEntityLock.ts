import type { SceneEntity } from "../types/engine";

export function setHierarchyEntityLocked(
    entities: Record<string, SceneEntity>,
    id: string,
    locked: boolean
): Record<string, SceneEntity> {
    const entity = entities[id];
    if (!entity || entity.locked === locked) return entities;
    return { ...entities, [id]: { ...entity, locked } };
}
