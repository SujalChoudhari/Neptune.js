export const runtimeSelectionBridgeScript = `
(() => {
    const findEntity = (root, id) => {
        if (!root || typeof root !== "object") return null;
        if (root.id === id) return root;
        if (Array.isArray(root.children)) {
            for (const child of root.children) {
                const found = findEntity(child, id);
                if (found) return found;
            }
        }
        return null;
    };

    const normalizeIds = (ids) => Array.isArray(ids)
        ? [...new Set(ids.filter(id => typeof id === "string" && id.trim()))]
        : [];

    let pendingEditorSelection = null;
    const applyEditorSelection = (ids) => {
        const game = window.game;
        if (!game || !game.scene) {
            pendingEditorSelection = ids;
            return;
        }
        const validIds = ids.filter(id => findEntity(game.scene, id));
        pendingEditorSelection = null;
        game.editorSelection = validIds;
        window.dispatchEvent(new CustomEvent("neptune:editor-selection-changed", {
            detail: { ids: validIds, entities: validIds.map(id => findEntity(game.scene, id)) }
        }));
    };

    window.addEventListener("message", event => {
        if (event.source !== window.parent || event.data?.type !== "editor:select") return;
        applyEditorSelection(normalizeIds(event.data.payload?.ids));
    });

    window.addEventListener("neptune:editor-selection-ready", () => {
        if (pendingEditorSelection !== null) applyEditorSelection(pendingEditorSelection);
    });

    window.addEventListener("neptune:selection-changed", event => {
        const ids = normalizeIds(event.detail?.ids);
        const scene = window.game?.scene;
        const validIds = scene ? ids.filter(id => findEntity(scene, id)) : ids;
        window.parent.postMessage({
            type: "game:selection-changed",
            payload: { ids: validIds }
        }, "*");
    });
})();
`;
