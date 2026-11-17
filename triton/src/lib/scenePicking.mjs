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
    const dimensions = (component) => {
        const param = component?.param ?? component?._properties?.param;
        if ((component?.geometry ?? component?._properties?.geometry) === 0 && Number.isFinite(param?.radius)) {
            return { width: param.radius * 2, height: param.radius * 2, circle: true };
        }
        return {
            width: component?.width ?? component?._properties?.width ?? param?.width,
            height: component?.height ?? component?._properties?.height ?? param?.height
        };
    };
    const sprite = Object.entries(components).find(([type, component]) => {
        if (/collider|hitbox|hurtbox/i.test(type)) return false;
        const { width, height } = dimensions(component);
        return component?.enabled !== false && Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;
    })?.[1];
    const width = dimensions(sprite).width ?? fallbackSize;
    const height = dimensions(sprite).height ?? fallbackSize;
    const scaledWidth = width * Math.abs(Number.isFinite(scale.x) ? scale.x : 1);
    const scaledHeight = height * Math.abs(Number.isFinite(scale.y) ? scale.y : 1);
    const angle = Number.isFinite(entity.transform.rotation) ? entity.transform.rotation : 0;
    const circle = dimensions(sprite).circle;
    const boundsWidth = circle
        ? Math.hypot(Math.cos(angle) * scaledWidth, Math.sin(angle) * scaledHeight)
        : Math.abs(Math.cos(angle)) * scaledWidth + Math.abs(Math.sin(angle)) * scaledHeight;
    const boundsHeight = circle
        ? Math.hypot(Math.sin(angle) * scaledWidth, Math.cos(angle) * scaledHeight)
        : Math.abs(Math.sin(angle)) * scaledWidth + Math.abs(Math.cos(angle)) * scaledHeight;
    return {
        id: typeof entity.id === 'string' ? entity.id : '',
        name: typeof entity.name === 'string' ? entity.name : '',
        x: position.x - boundsWidth / 2,
        y: position.y - boundsHeight / 2,
        width: boundsWidth,
        height: boundsHeight
    };
}

const matrixProduct = (left, right) => ({
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f
});

const isRenderableEntity = entity => Object.entries(entity?.components || {}).some(([type, component]) =>
    component?.enabled !== false && /^(sprite|shape|text|bitmaptext|animatedsprite|particleemitter)$/i.test(type));

/** Canvas affine matrix for the transforms actually nested by Renderable.drawChildren. */
export function getEntityWorldMatrix(id, hierarchy, data, includeSelf = true) {
    const entity = hierarchy?.[id];
    if (!entity || !data?.[id]) return null;
    const chain = [];
    let current = entity;
    while (current && current.id !== 'root') {
        chain.push(current);
        current = current.parentId ? hierarchy[current.parentId] : null;
    }
    chain.reverse();
    let matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    for (let index = 0; index < chain.length; index += 1) {
        const item = chain[index];
        const isSelf = index === chain.length - 1;
        if (!isSelf && !isRenderableEntity(data[item.id])) continue;
        if (isSelf && !includeSelf && !isRenderableEntity(data[item.id])) continue;
        const transform = data[item.id]?.transform;
        const position = transform?.position;
        const scale = transform?.scale || { x: 1, y: 1 };
        const rotation = transform?.rotation || 0;
        if (!position || ![position.x, position.y, scale.x, scale.y, rotation].every(Number.isFinite)) return null;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        matrix = matrixProduct(matrix, {
            a: cos * scale.x * 64, b: sin * scale.x * 64,
            c: -sin * scale.y * 64, d: cos * scale.y * 64,
            e: position.x * 64, f: position.y * 64
        });
    }
    return Object.values(matrix).every(Number.isFinite) ? matrix : null;
}

export function getEntityWorldSelectionGeometry(id, hierarchy, data, fallbackSize = 16) {
    const entity = data?.[id];
    const matrix = getEntityWorldMatrix(id, hierarchy, data);
    if (!entity || !matrix || !Number.isFinite(fallbackSize) || fallbackSize <= 0) return null;
    const components = entity.components || {};
    const component = Object.entries(components).find(([type, value]) => isRenderableEntity({ components: { [type]: value } })
        && value?.enabled !== false);
    const props = component?.[1] || {};
    const param = props.param || props._properties?.param || {};
    const pixelWidth = props.width ?? props._properties?.width ?? param.width ?? (Number.isFinite(param.radius) ? param.radius * 2 : fallbackSize);
    const pixelHeight = props.height ?? props._properties?.height ?? param.height ?? (Number.isFinite(param.radius) ? param.radius * 2 : fallbackSize);
    if (![pixelWidth, pixelHeight].every(Number.isFinite) || pixelWidth <= 0 || pixelHeight <= 0) return null;
    const halfWidth = pixelWidth / 2;
    const halfHeight = pixelHeight / 2;
    const corners = [[-halfWidth, -halfHeight], [halfWidth, -halfHeight], [halfWidth, halfHeight], [-halfWidth, halfHeight]]
        .map(([x, y]) => ({ x: (matrix.a * x + matrix.c * y + matrix.e) / 64,
            y: (matrix.b * x + matrix.d * y + matrix.f) / 64 }));
    const bounds = {
        x: Math.min(...corners.map(point => point.x)), y: Math.min(...corners.map(point => point.y)),
        width: Math.max(...corners.map(point => point.x)) - Math.min(...corners.map(point => point.x)),
        height: Math.max(...corners.map(point => point.y)) - Math.min(...corners.map(point => point.y))
    };
    return { id, name: entity.name || hierarchy[id]?.name || id, matrix, corners, bounds };
}

/** Convert a world-space pixel delta to the selected child's local translation. */
export function worldDeltaToEntityLocal(id, delta, hierarchy, data) {
    if (!delta || ![delta.x, delta.y].every(Number.isFinite)) return null;
    const parentId = hierarchy?.[id]?.parentId;
    if (!parentId || parentId === 'root') return { ...delta };
    const parent = getEntityWorldMatrix(parentId, hierarchy, data, false);
    if (!parent) return null;
    const determinant = parent.a * parent.d - parent.b * parent.c;
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-10) return null;
    const x = delta.x * 64;
    const y = delta.y * 64;
    return {
        x: (parent.d * x - parent.c * y) / determinant / 64,
        y: (-parent.b * x + parent.a * y) / determinant / 64
    };
}

export function pickEntityAt(root, x, y, tolerance = 12) {
    if (!root || !Number.isFinite(x) || !Number.isFinite(y)) return null;

    let best = null;
    let bestDistance = Infinity;
    const visit = (entity) => {
        if (!entity || entity.active === false) return;
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
                if (component?.enabled === false || isCollider(component)) return false;
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
                const angle = Number.isFinite(transform.rotation) ? transform.rotation : 0;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const offsetX = x - position.x;
                const offsetY = y - position.y;
                // Match Sprite.draw's translate/rotate/scale transform in local space.
                const dx = Math.abs(offsetX * cos + offsetY * sin);
                const dy = Math.abs(-offsetX * sin + offsetY * cos);
                hasBounds = true;
                if (dx <= halfWidth && dy <= halfHeight) hitDistance = dx * dx + dy * dy;
            }

            for (const collider of components.filter((component) => component?.enabled !== false && isCollider(component))) {
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
        if (!collider || typeof collider !== 'object' || collider.enabled === false) return [];
        const width = collider.width ?? collider.size?.x;
        const height = collider.height ?? collider.size?.y;
        const offsetX = collider.offsetX ?? collider.offset?.x ?? 0;
        const offsetY = collider.offsetY ?? collider.offset?.y ?? 0;
        if (![width, height, offsetX, offsetY].every(Number.isFinite) || width <= 0 || height <= 0) return [];
        // Legacy BoxCollider size is centred on Transform; Nereid offsets are top-left based.
        return [{ type, color, x: position.x + offsetX - (type === 'BoxCollider' ? width / 2 : 0),
            y: position.y + offsetY - (type === 'BoxCollider' ? height / 2 : 0), width, height }];
    });
}

export function isSceneViewBridgeMessageSource(source, iframeWindow) {
    return iframeWindow !== null && iframeWindow !== undefined && source === iframeWindow;
}
