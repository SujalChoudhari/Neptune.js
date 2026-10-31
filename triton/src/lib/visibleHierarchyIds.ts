import type { SceneEntity } from '../types/engine';

export function visibleHierarchyIds(entities: Record<string, SceneEntity>, searchQuery: string): string[] {
    const list: string[] = [];
    const query = searchQuery.trim().toLowerCase();
    const matching = new Set<string>();
    if (query) Object.values(entities).forEach(entity => {
        if (!entity.name.toLowerCase().includes(query)) return;
        let current: SceneEntity | undefined = entity;
        while (current && !matching.has(current.id)) {
            matching.add(current.id);
            current = current.parentId ? entities[current.parentId] : undefined;
        }
    });
    const traverse = (id: string) => {
        if (query && !matching.has(id)) return;
        if (id !== 'root') list.push(id);
        if (id === 'root' || entities[id]?.expanded || query) {
            entities[id]?.children.forEach(traverse);
        }
    };
    if (entities.root) traverse('root');
    return list;
}

export function hierarchySelectionForClick(visibleIds: string[], anchorId: string, clickedId: string): string[] {
    const start = visibleIds.indexOf(anchorId);
    const end = visibleIds.indexOf(clickedId);
    if (start === -1 || end === -1) return [clickedId];
    return visibleIds.slice(Math.min(start, end), Math.max(start, end) + 1);
}
