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

    const removeRuntimeEntity = (scene, id) => {
        const entity = findEntity(scene, id);
        if (!entity) return [];
        const removedIds = [];
        const collectIds = current => {
            if (!current || removedIds.includes(current.id)) return;
            removedIds.push(current.id);
            current.children?.forEach(collectIds);
        };
        collectIds(entity);
        const siblings = Array.isArray(entity.parent?.children) ? entity.parent.children : scene?.children;
        if (!Array.isArray(siblings)) return [];
        const index = siblings.indexOf(entity);
        if (index < 0) return [];
        siblings.splice(index, 1);
        if (entity.parent) entity.parent = null;
        return removedIds;
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
        if (event.source !== window.parent) return;
        if (event.data?.type === "editor:select") {
            applyEditorSelection(normalizeIds(event.data.payload?.ids));
            return;
        }
        if (event.data?.type === "editor:delete") {
            const game = window.game;
            const id = event.data.payload?.id;
            if (typeof id !== "string") return;
            const removedIds = new Set(removeRuntimeEntity(game?.scene, id));
            if (removedIds.size === 0) return;
            const remainingSelection = normalizeIds(game.editorSelection).filter(selectedId => !removedIds.has(selectedId));
            game.editorSelection = remainingSelection;
            window.dispatchEvent(new CustomEvent("neptune:editor-selection-changed", {
                detail: { ids: remainingSelection, entities: remainingSelection.map(selectedId => findEntity(game.scene, selectedId)) }
            }));
        }
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
