export interface HierarchyEntityRecord {
    parentId?: string | null;
    children?: string[];
}

export interface HierarchyRemovalResult<T extends HierarchyEntityRecord> {
    entities: Record<string, T>;
    removedIds: string[];
}

export function removeEntityBranch<T extends HierarchyEntityRecord>(
    entities: Record<string, T>,
    id: string
): HierarchyRemovalResult<T> {
    if (!entities[id]) return { entities, removedIds: [] };

    const removedIds: string[] = [];
    const removed = new Set<string>();
    const collectBranch = (entityId: string) => {
        if (removed.has(entityId)) return;
        removed.add(entityId);
        removedIds.push(entityId);
        entities[entityId]?.children?.forEach(collectBranch);
    };
    collectBranch(id);

    const nextEntities = { ...entities };
    const parentId = entities[id].parentId;
    if (parentId && nextEntities[parentId]) {
        const parent = nextEntities[parentId];
        nextEntities[parentId] = {
            ...parent,
            children: (parent.children || []).filter(childId => childId !== id)
        } as T;
    }
    removedIds.forEach(removedId => delete nextEntities[removedId]);

    return { entities: nextEntities, removedIds };
}
