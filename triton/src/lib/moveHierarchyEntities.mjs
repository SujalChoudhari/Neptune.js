// Project the canonical scene move into the editor's flat hierarchy snapshot.
export function moveHierarchyEntities(entities, ids, targetParentId, index) {
    const target = entities[targetParentId];
    if (!target || !Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some(id => !entities[id] || id === 'root')) return entities;
    const moving = ids.filter(id => !ids.some(other => other !== id && isAncestor(entities, other, id)));
    if (moving.some(id => id === targetParentId || isAncestor(entities, id, targetParentId))) return entities;

    const next = { ...entities };
    for (const id of moving) {
        const parentId = entities[id].parentId;
        const parent = next[parentId];
        if (!parent || !parent.children.includes(id)) return entities;
        next[parentId] = { ...parent, children: parent.children.filter(child => child !== id) };
    }
    const children = [...next[targetParentId].children];
    const position = typeof index === 'number' ? Math.max(0, Math.min(index, children.length)) : children.length;
    children.splice(position, 0, ...moving);
    next[targetParentId] = { ...next[targetParentId], children };
    for (const id of moving) next[id] = { ...next[id], parentId: targetParentId };
    return next;
}

function isAncestor(entities, ancestorId, id) {
    const visited = new Set();
    let parentId = entities[id]?.parentId;
    while (parentId && !visited.has(parentId)) {
        if (parentId === ancestorId) return true;
        visited.add(parentId);
        parentId = entities[parentId]?.parentId;
    }
    return false;
}
