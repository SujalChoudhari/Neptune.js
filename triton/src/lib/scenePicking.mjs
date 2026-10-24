export function translateOnAxis(position, deltaX, deltaY, zoom, axis) {
    if (!position || ![position.x, position.y, deltaX, deltaY, zoom].every(Number.isFinite) || zoom <= 0) {
        throw new TypeError('Gizmo translation needs finite coordinates and a positive zoom');
    }
    if (axis !== 'x' && axis !== 'y') throw new TypeError('Gizmo axis must be x or y');
    return {
        x: position.x + (axis === 'x' ? deltaX / zoom : 0),
        y: position.y + (axis === 'y' ? deltaY / zoom : 0)
    };
}

export function zoomAtPoint(pan, zoom, nextZoom, screenX, screenY) {
    if (!pan || ![pan.x, pan.y, zoom, nextZoom, screenX, screenY].every(Number.isFinite)
        || zoom <= 0 || nextZoom <= 0) {
        throw new TypeError('Camera zoom needs finite coordinates and positive zoom levels');
    }
    return {
        x: pan.x + screenX / zoom - screenX / nextZoom,
        y: pan.y + screenY / zoom - screenY / nextZoom
    };
}

export function getFramingCamera(bounds, viewportWidth, viewportHeight, padding = 48, minZoom = 0.1, maxZoom = 5) {
    if (!Array.isArray(bounds) || bounds.length === 0
        || ![viewportWidth, viewportHeight, padding, minZoom, maxZoom].every(Number.isFinite)
        || viewportWidth <= padding * 2 || viewportHeight <= padding * 2
        || padding < 0 || minZoom <= 0 || maxZoom < minZoom
        || bounds.some((bound) => !bound || typeof bound !== 'object'
            || ![bound.x, bound.y, bound.width, bound.height].every(Number.isFinite)
            || bound.width < 0 || bound.height < 0)) return null;

    const left = Math.min(...bounds.map(({ x }) => x));
    const top = Math.min(...bounds.map(({ y }) => y));
    const right = Math.max(...bounds.map(({ x, width }) => x + width));
    const bottom = Math.max(...bounds.map(({ y, height }) => y + height));
    if (![left, top, right, bottom].every(Number.isFinite)) return null;
    const worldWidth = Math.max(right - left, 1);
    const worldHeight = Math.max(bottom - top, 1);
    const zoom = Math.max(minZoom, Math.min(maxZoom,
        Math.min((viewportWidth - padding * 2) / worldWidth, (viewportHeight - padding * 2) / worldHeight)));
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    return {
        zoom,
        x: centerX - viewportWidth / (2 * zoom),
        y: centerY - viewportHeight / (2 * zoom)
    };
}

export function resizeColliderBounds(size, deltaX, deltaY, zoom, minSize = 0.05) {
    if (!size || ![size.width, size.height, deltaX, deltaY, zoom, minSize].every(Number.isFinite) || zoom <= 0 || minSize <= 0) {
        throw new TypeError('Collider resizing needs finite dimensions, deltas, and positive zoom/minimum size');
    }
    return {
        width: Math.max(minSize, size.width + deltaX / zoom),
        height: Math.max(minSize, size.height + deltaY / zoom)
    };
}

export function updateSelection(currentIds, selectedId, additive = false) {
    const selection = Array.isArray(currentIds)
        ? [...new Set(currentIds.filter((id) => typeof id === 'string' && id.length > 0))]
        : [];
    if (!additive) return typeof selectedId === 'string' && selectedId.length > 0 ? [selectedId] : [];
    if (typeof selectedId !== 'string' || selectedId.length === 0) return selection;
    return selection.includes(selectedId)
        ? selection.filter((id) => id !== selectedId)
        : [...selection, selectedId];
}

export function hasCompleteGroupTransformSelection(ids, entitiesData) {
    if (!Array.isArray(ids) || ids.length < 2 || !entitiesData || typeof entitiesData !== 'object') return false;
    return ids.every((id) => {
        const position = entitiesData[id]?.transform?.position;
        return position && Number.isFinite(position.x) && Number.isFinite(position.y);
    });
}

export function getEntitySelectionBounds(entity, fallbackSize = 16) {
    const position = entity?.transform?.position;
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)
        || !Number.isFinite(fallbackSize) || fallbackSize <= 0) return null;
    const scale = entity.transform.scale || { x: 1, y: 1 };
    const components = entity.components && typeof entity.components === 'object' ? entity.components : {};
    const sprite = Object.entries(components).find(([type, component]) => {
        if (/collider|hitbox|hurtbox/i.test(type)) return false;
        const width = component?.width ?? component?._properties?.width;
        const height = component?.height ?? component?._properties?.height;
        return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;
    })?.[1];
    const width = sprite?.width ?? sprite?._properties?.width ?? fallbackSize;
    const height = sprite?.height ?? sprite?._properties?.height ?? fallbackSize;
    const scaledWidth = width * Math.abs(Number.isFinite(scale.x) ? scale.x : 1);
    const scaledHeight = height * Math.abs(Number.isFinite(scale.y) ? scale.y : 1);
    return {
        id: typeof entity.id === 'string' ? entity.id : '',
        name: typeof entity.name === 'string' ? entity.name : '',
        x: position.x - scaledWidth / 2,
        y: position.y - scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight
    };
}

export function pickEntityAt(root, x, y, tolerance = 12) {
    if (!root || !Number.isFinite(x) || !Number.isFinite(y)) return null;

    let best = null;
    let bestDistance = Infinity;
    const visit = (entity) => {
        if (!entity) return;
        const components = Array.isArray(entity.components) ? entity.components : [];
        const transform = components.find((component) =>
            component && component.position && component.scale
        ) || entity.transform;
        const position = transform?.position;
        if (entity.id && position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
            const isCollider = (component) => /collider|hitbox|hurtbox/i.test(
                component?.constructor?.name || component?.type || ''
            );
            const sprite = components.find((component) => {
                if (isCollider(component)) return false;
                const width = component?.width ?? component?._properties?.width;
                const height = component?.height ?? component?._properties?.height;
                return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
            });
            let hitDistance = Infinity;
            let hasBounds = false;

            if (sprite) {
                const width = sprite.width ?? sprite._properties?.width;
                const height = sprite.height ?? sprite._properties?.height;
                const halfWidth = width * Math.abs(transform.scale.x) / 2;
                const halfHeight = height * Math.abs(transform.scale.y) / 2;
                const dx = Math.abs(x - position.x);
                const dy = Math.abs(y - position.y);
                hasBounds = true;
                if (dx <= halfWidth && dy <= halfHeight) hitDistance = dx * dx + dy * dy;
            }

            for (const collider of components.filter(isCollider)) {
                const properties = collider?._properties || collider?.props || {};
                const width = collider.width ?? properties.width ?? properties.size?.x;
                const height = collider.height ?? properties.height ?? properties.size?.y;
                if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue;
                hasBounds = true;
                const offsetX = collider.offsetX ?? properties.offsetX ?? properties.offset?.x ?? 0;
                const offsetY = collider.offsetY ?? properties.offsetY ?? properties.offset?.y ?? 0;
                const left = position.x + offsetX;
                const top = position.y + offsetY;
                if (x >= left && x <= left + width && y >= top && y <= top + height) {
                    const dx = x - (left + width / 2);
                    const dy = y - (top + height / 2);
                    hitDistance = Math.min(hitDistance, dx * dx + dy * dy);
                }
            }

            if (!hasBounds) {
                const dx = Math.abs(x - position.x);
                const dy = Math.abs(y - position.y);
                if (dx <= tolerance && dy <= tolerance) hitDistance = dx * dx + dy * dy;
            }

            if (Number.isFinite(hitDistance) && hitDistance <= bestDistance) {
                best = entity;
                bestDistance = hitDistance;
            }
        }
        for (const child of entity.children || []) visit(child);
    };

    visit(root);
    return best;
}

export function getColliderOverlayBounds(entity) {
    const position = entity?.transform?.position;
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return [];

    const components = entity?.components || {};
    const colliderTypes = [
        { type: 'Hitbox', color: '#fb7185' },
        { type: 'Hurtbox', color: '#38bdf8' },
        { type: 'TriggerCollider', color: '#facc15' },
        { type: 'BoxCollider', color: '#a78bfa' }
    ];
    return colliderTypes.flatMap(({ type, color }) => {
        const collider = components[type];
        if (!collider || typeof collider !== 'object') return [];
        const width = collider.width ?? collider.size?.x;
        const height = collider.height ?? collider.size?.y;
        const offsetX = collider.offsetX ?? collider.offset?.x ?? 0;
        const offsetY = collider.offsetY ?? collider.offset?.y ?? 0;
        if (![width, height, offsetX, offsetY].every(Number.isFinite) || width <= 0 || height <= 0) return [];
        return [{ type, color, x: position.x + offsetX, y: position.y + offsetY, width, height }];
    });
}

export function isSceneViewBridgeMessageSource(source, iframeWindow) {
    return iframeWindow !== null && iframeWindow !== undefined && source === iframeWindow;
}
