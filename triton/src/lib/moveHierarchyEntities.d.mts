import type { SceneEntity } from '../types/engine';

export function moveHierarchyEntities(
    entities: Record<string, SceneEntity>,
    ids: string[],
    targetParentId: string,
    index?: number
): Record<string, SceneEntity>;
