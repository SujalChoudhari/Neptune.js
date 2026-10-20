import type { EntityData, SceneEntity } from "../types/engine";

export function createHierarchyEntityData(entity: SceneEntity): EntityData;
export function createHierarchyEntityDataBranch(branch: Record<string, any>): Record<string, EntityData>;
