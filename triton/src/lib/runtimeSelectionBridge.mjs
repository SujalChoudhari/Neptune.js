export function isRuntimeViewMessageSource(source, frames) {
    if (!source || !frames || typeof frames[Symbol.iterator] !== "function") return false;
    for (const frame of frames) {
        if (frame?.contentWindow === source) return true;
    }
    return false;
}

export function readRuntimeMessage(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (typeof data.type !== "string" || !data.type.startsWith("game:")) return null;
    return { type: data.type, payload: data.payload };
}

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
    let traversalOrder = 0;
    let pickedTraversalOrder = -1;
    const visitedRenderableEntities = new Set();
    const identityMatrix = [1, 0, 0, 1, 0, 0];
    const multiplyMatrices = (left, right) => [
        left[0] * right[0] + left[2] * right[1],
        left[1] * right[0] + left[3] * right[1],
        left[0] * right[2] + left[2] * right[3],
        left[1] * right[2] + left[3] * right[3],
        left[0] * right[4] + left[2] * right[5] + left[4],
        left[1] * right[4] + left[3] * right[5] + left[5]
    ];
    const getWorldMatrix = (entity, parentMatrix) => {
        const components = Array.isArray(entity.components) ? entity.components : [];
        const transform = components.find(component => component?.constructor?.name?.toLowerCase() === "transform") || entity.transform;
        const position = transform?.position || {};
        const scale = transform?.scale || {};
        const rotation = Number(transform?.rotation) || 0;
        const scaleX = (Number.isFinite(scale.x) ? scale.x : 1) * pixelsPerMeter;
        const scaleY = (Number.isFinite(scale.y) ? scale.y : 1) * pixelsPerMeter;
        const cosine = Math.cos(rotation);
        const sine = Math.sin(rotation);
        return multiplyMatrices(parentMatrix, [
            cosine * scaleX,
            sine * scaleX,
            -sine * scaleY,
            cosine * scaleY,
            (Number(position.x) || 0) * pixelsPerMeter,
            (Number(position.y) || 0) * pixelsPerMeter
        ]);
    };
    const collectRenderableRoots = (container, containerMatrix = identityMatrix) => {
        const roots = [];
        const visited = new Set([container]);
        const stack = [...(container?.children || [])].reverse()
            .map(entity => ({ entity, parentMatrix: containerMatrix }));
        while (stack.length > 0) {
            const { entity, parentMatrix } = stack.pop();
            if (!entity || visited.has(entity)) continue;
            visited.add(entity);
            if (entity.active === false) continue;
            const worldMatrix = getWorldMatrix(entity, parentMatrix);
            const components = Array.isArray(entity.components) ? entity.components : [];
            const renderables = components.filter(component =>
                component && Number.isFinite(component.renderOrder) && typeof component.draw === "function" &&
                component?.properties?.enabled !== false && component?.enabled !== false);
            if (renderables.length > 0) {
                renderables.forEach(component => roots.push({ entity, component, worldMatrix, insertionOrder: roots.length }));
                continue;
            }
            for (const child of [...(entity.children || [])].reverse()) stack.push({ entity: child, parentMatrix: worldMatrix });
        }
        return roots.sort((a, b) => {
            const orderA = Number.isFinite(a.component.renderOrder) ? a.component.renderOrder : 0;
            const orderB = Number.isFinite(b.component.renderOrder) ? b.component.renderOrder : 0;
            return orderA - orderB || a.insertionOrder - b.insertionOrder;
        });
    };
    const visitRenderable = ({ entity, component, worldMatrix }) => {
        const currentTraversalOrder = traversalOrder++;
        if (component?.constructor?.name?.toLowerCase() === "sprite" && typeof entity.id === "string") {
            const [a, b, c, d, e, f] = worldMatrix;
            const determinant = a * d - b * c;
            if (Number.isFinite(determinant) && Math.abs(determinant) > Number.EPSILON) {
                const translatedX = point.x - e;
                const translatedY = point.y - f;
                const localX = (d * translatedX - c * translatedY) / determinant;
                const localY = (-b * translatedX + a * translatedY) / determinant;
                const width = Number(component.width ?? component._properties?.width) || 0;
                const height = Number(component.height ?? component._properties?.height) || 0;
                if (Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2 &&
                    currentTraversalOrder > pickedTraversalOrder) {
                    picked = entity.id;
                    pickedTraversalOrder = currentTraversalOrder;
                }
            }
        }
        if (visitedRenderableEntities.has(entity)) return;
        visitedRenderableEntities.add(entity);
        collectRenderableRoots(entity, worldMatrix).forEach(visitRenderable);
    };
    collectRenderableRoots(scene).forEach(visitRenderable);
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
        if (scene) applyEditorSelection(validIds);
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
