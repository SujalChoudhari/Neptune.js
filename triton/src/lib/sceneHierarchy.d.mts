import type { SceneEntity } from "../types/engine";

export function createSceneHierarchyEntity(data: Record<string, any>, parentId: string, fallbackId: string): SceneEntity;
export function projectInspectorComponent(component: { type?: string; props?: Record<string, any> } | null | undefined): Record<string, any>;
