export function handleHierarchyShortcut(
    event: Pick<KeyboardEvent, 'key' | 'preventDefault'>,
    focused: Element | null,
    selectedIds: string[],
    removeEntity: (id: string) => void,
    renameEntity: (id: string) => void
) {
    if (focused && (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(focused.tagName) ||
        (focused as HTMLElement).isContentEditable ||
        focused.closest?.('[contenteditable]')
    )) return

    if (event.key === 'F2' && selectedIds.length === 1) {
        renameEntity(selectedIds[0])
        event.preventDefault()
    }
    if (event.key === 'Delete' && selectedIds.length) {
        selectedIds.forEach(removeEntity)
        event.preventDefault()
    }
}
