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

export function appendHierarchyBranch(
    entities: Record<string, SceneEntity>,
    branch: Record<string, any>,
    parentId: string
): Record<string, SceneEntity> {
    const parent = entities[parentId];
    if (!parent || typeof branch?.id !== "string" || entities[branch.id]) return entities;

    const additions: Record<string, SceneEntity> = {};
    const append = (node: Record<string, any>, nodeParentId: string) => {
        if (typeof node.id !== "string" || additions[node.id]) return;
        const childNodes = Array.isArray(node.children) ? node.children.filter(child => child && typeof child === "object") : [];
        additions[node.id] = {
            id: node.id,
            parentId: nodeParentId,
            name: typeof node.name === "string" ? node.name : "Entity",
            type: node.type || "entity",
            children: childNodes.map(child => child.id).filter((id): id is string => typeof id === "string"),
            active: node.active !== false,
            locked: false,
            expanded: false
        };
        childNodes.forEach(child => append(child, node.id));
    };

    append(branch, parentId);
    if (!additions[branch.id]) return entities;
    return {
        ...entities,
        [parentId]: { ...parent, children: [...parent.children, branch.id] },
        ...additions
    };
}
