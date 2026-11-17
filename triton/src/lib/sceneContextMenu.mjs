export function clampSceneMenuPosition(x, y, menuWidth, menuHeight, viewportWidth, viewportHeight) {
    return {
        x: Math.max(4, Math.min(x, Math.max(4, viewportWidth - menuWidth - 4))),
        y: Math.max(4, Math.min(y, Math.max(4, viewportHeight - menuHeight - 4)))
    };
}

/** A right-click on a selected member preserves the group; locks block authoring actions. */
export function sceneContextSelection(clickedId, selectedIds, entities) {
    if (!clickedId) return [];
    if (entities?.[clickedId]?.locked) return [];
    return selectedIds.includes(clickedId) ? [...selectedIds] : [clickedId];
}
