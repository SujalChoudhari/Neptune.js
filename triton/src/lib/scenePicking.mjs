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
            const sprite = components.find((component) => {
                const width = component?.width ?? component?._properties?.width;
                const height = component?.height ?? component?._properties?.height;
                return Number.isFinite(width) && Number.isFinite(height);
            });
            const collider = components.find((component) => component?.constructor?.name?.toLowerCase().includes('collider'));
            const width = sprite?.width ?? sprite?._properties?.width ?? collider?.width ?? collider?._properties?.width ?? 0;
            const height = sprite?.height ?? sprite?._properties?.height ?? collider?.height ?? collider?._properties?.height ?? 0;
            const halfWidth = Math.max(tolerance, width * Math.abs(transform.scale.x) / 2);
            const halfHeight = Math.max(tolerance, height * Math.abs(transform.scale.y) / 2);
            const dx = Math.abs(x - position.x);
            const dy = Math.abs(y - position.y);
            if (dx <= halfWidth && dy <= halfHeight) {
                const distance = dx * dx + dy * dy;
                if (distance <= bestDistance) {
                    best = entity;
                    bestDistance = distance;
                }
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
