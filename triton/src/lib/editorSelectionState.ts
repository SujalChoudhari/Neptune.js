export function getEditorSelectionAfterClick(selectedIds: string[] | undefined, id: string, multi: boolean): string[] {
    const current = Array.isArray(selectedIds)
        ? [...new Set(selectedIds.filter(value => typeof value === "string" && value.trim()))]
        : [];
    if (typeof id !== "string" || !id.trim()) return [];
    if (!multi) return [id];
    return current.includes(id) ? current : [...current, id];
}
