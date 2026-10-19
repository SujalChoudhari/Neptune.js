export function readRuntimeSelection(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || !Array.isArray(payload.ids)) return null;
    const ids = [...new Set(payload.ids.filter(id => typeof id === "string" && id.trim()))];
    const data = {};
    const source = payload.data;
    const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
    if (Array.isArray(source)) {
        source.forEach(entity => {
            if (isRecord(entity) && typeof entity.id === "string" && entity.id.trim()) data[entity.id] = entity;
        });
    } else if (isRecord(source)) {
        if (typeof source.id === "string" && source.id.trim()) data[source.id] = source;
        else Object.entries(source).forEach(([id, entity]) => {
            if (isRecord(entity)) data[id] = entity;
        });
    }
    return { ids, data };
}

export function pickRuntimeEntityAt(scene, screenX, screenY, pixelsPerMeter = 64) {
    if (!scene || !Number.isFinite(screenX) || !Number.isFinite(screenY)) return null;
    const camera = scene.activeCamera;
    const point = camera?.screenToWorld
        ? camera.screenToWorld(screenX, screenY)
        : {
            x: screenX + (scene.cameraSettings?.bounds?.x || 0) * pixelsPerMeter,
            y: screenY + (scene.cameraSettings?.bounds?.y || 0) * pixelsPerMeter
        };
    let picked = null;
    const visit = entity => {
        if (!entity || typeof entity !== "object") return;
        if (entity.active === false) return;
        const components = Array.isArray(entity.components) ? entity.components : [];
        const sprite = components.find(component => component?.constructor?.name?.toLowerCase() === "sprite");
        const transform = components.find(component => component?.constructor?.name?.toLowerCase() === "transform") || entity.transform;
        if (sprite && transform && typeof entity.id === "string") {
            const position = transform.position || { x: 0, y: 0 };
            const scale = transform.scale || { x: 1, y: 1 };
            const dx = point.x - position.x * pixelsPerMeter;
            const dy = point.y - position.y * pixelsPerMeter;
            const rotation = Number(transform.rotation) || 0;
            const localX = dx * Math.cos(rotation) + dy * Math.sin(rotation);
            const localY = -dx * Math.sin(rotation) + dy * Math.cos(rotation);
            const scaleX = Math.abs(scale.x * pixelsPerMeter) || 1;
            const scaleY = Math.abs(scale.y * pixelsPerMeter) || 1;
            const width = Number(sprite.width ?? sprite._properties?.width) || 0;
            const height = Number(sprite.height ?? sprite._properties?.height) || 0;
            if (Math.abs(localX / scaleX) <= width / 2 && Math.abs(localY / scaleY) <= height / 2) picked = entity.id;
        }
        entity.children?.forEach(visit);
    };
    scene.children?.forEach(visit);
    return picked;
}

export const runtimeSelectionBridgeScript = `
(() => {
    const pickRuntimeEntityAt = ${pickRuntimeEntityAt.toString()};
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

    const containsEntityId = (root, targetId, visited = new Set()) => {
        if (!root || visited.has(root)) return false;
        if (root.id === targetId) return true;
        visited.add(root);
        return Array.isArray(root.children) && root.children.some(child => containsEntityId(child, targetId, visited));
    };

    const moveRuntimeEntities = (scene, ids, targetParentId, targetIndex) => {
        if (!scene || !Array.isArray(ids) || ids.length === 0 || !Array.isArray(scene.children)) return false;
        const entities = ids.map(id => findEntity(scene, id));
        if (entities.some(entity => !entity)) return false;
        const moving = entities.filter(entity => !entities.some(other => other !== entity && containsEntityId(other, entity.id)));
        if (moving.length === 0) return false;
        const target = targetParentId === "root" ? scene : findEntity(scene, targetParentId);
        if (!target || !Array.isArray(target.children) || moving.some(entity => containsEntityId(entity, target.id))) return false;

        const sourceLists = moving.map(entity => entity.parent?.children || scene.children);
        if (moving.some((entity, index) => sourceLists[index].indexOf(entity) < 0)) return false;
        moving.forEach((entity, index) => {
            sourceLists[index].splice(sourceLists[index].indexOf(entity), 1);
        });

        const insertionIndex = typeof targetIndex === "number"
            ? Math.max(0, Math.min(targetIndex, target.children.length))
            : target.children.length;
        target.children.splice(insertionIndex, 0, ...moving);
        moving.forEach(entity => { entity.parent = target; });
        return true;
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
            return;
        }
        if (event.data?.type === "editor:move-entities") {
            const payload = event.data.payload || {};
            moveRuntimeEntities(window.game?.scene, normalizeIds(payload.ids), payload.targetParentId, payload.index);
            return;
        }
        if (event.data?.type === "editor:set-active") {
            const { id, active } = event.data.payload || {};
            if (typeof id !== "string" || typeof active !== "boolean") return;
            const entity = findEntity(window.game?.scene, id);
            if (entity) entity.active = active;
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

    window.addEventListener("pointerdown", event => {
        const canvas = window.document?.getElementById("neptune-canvas");
        if (!canvas || event.target !== canvas || event.button !== 0) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (event.clientX - rect.left) * ((canvas.width || rect.width) / rect.width);
        const y = (event.clientY - rect.top) * ((canvas.height || rect.height) / rect.height);
        const id = pickRuntimeEntityAt(window.game?.scene, x, y);
        window.dispatchEvent(new CustomEvent("neptune:selection-changed", { detail: { ids: id ? [id] : [] } }));
    });
})();
`;
