/** Viewport tools. These IDs describe editor interactions, not engine components. */
export const SCENE_TOOLS = Object.freeze([
    { id: 'hand', key: 'Q', label: 'Hand', description: 'Pan the scene' },
    { id: 'move', key: 'W', label: 'Move', description: 'Move the selection' },
    { id: 'rotate', key: 'E', label: 'Rotate', description: 'Rotate the selection' },
    { id: 'scale', key: 'R', label: 'Scale', description: 'Scale the selection' },
    { id: 'rect', key: 'T', label: 'Rect', description: 'Resize the selection bounds' },
    { id: 'transform', key: 'Y', label: 'Transform', description: 'Combined transform handles' }
].map(tool => Object.freeze(tool)));

export function isSceneShortcutTargetBlocked(target) {
    if (!target || typeof target !== 'object') return false;
    const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
    if (['input', 'textarea', 'select', 'iframe'].includes(tagName) || target.isContentEditable) return true;
    if (typeof target.closest !== 'function') return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"], dialog'));
}

/** Caller must additionally ensure its viewport is active; shortcuts never focus a hidden dock. */
export function getSceneToolShortcut(event, { modalOpen = false, activeElement } = {}) {
    if (!event || event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || modalOpen) return null;
    if (isSceneShortcutTargetBlocked(event.target) || isSceneShortcutTargetBlocked(activeElement)) return null;
    const key = typeof event.key === 'string' ? event.key.toUpperCase() : '';
    return SCENE_TOOLS.find(tool => tool.key === key)?.id ?? null;
}

/** Converts a CSS-pixel pointer displacement to engine units exactly once. */
export function getSceneDragDelta(deltaX, deltaY, { zoom, pixelsPerUnit = 64, fine = false, coarse = false } = {}) {
    if (![deltaX, deltaY, zoom, pixelsPerUnit].every(Number.isFinite) || zoom <= 0 || pixelsPerUnit <= 0) {
        throw new TypeError('Scene dragging requires finite coordinates and positive zoom/pixels-per-unit');
    }
    const precision = fine ? 0.1 : coarse ? 10 : 1;
    return { x: deltaX * precision / (zoom * pixelsPerUnit), y: deltaY * precision / (zoom * pixelsPerUnit) };
}

export function snapSceneValue(value, step) {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) throw new TypeError('Snapping requires a finite value and positive increment');
    const snapped = Math.round(value / step) * step;
    return Object.is(snapped, -0) ? 0 : Number(snapped.toPrecision(12));
}

/** CSS pixel geometry for a world-unit grid aligned with the engine camera. */
export function getSceneGridMetrics(pan, zoom, pixelsPerUnit = 64) {
    if (!pan || ![pan.x, pan.y, zoom, pixelsPerUnit].every(Number.isFinite) || zoom <= 0 || pixelsPerUnit <= 0) {
        throw new TypeError('Scene grid needs finite pan and positive zoom/pixels-per-unit');
    }
    const majorSpacing = pixelsPerUnit * zoom;
    const subdivisions = zoom >= 2.5 ? 4 : zoom >= 1.25 ? 2 : 1;
    const minorSpacing = majorSpacing / subdivisions;
    return {
        majorSpacing,
        minorSpacing,
        subdivisions,
        offsetX: Object.is(-pan.x * zoom, -0) ? 0 : -pan.x * zoom,
        offsetY: Object.is(-pan.y * zoom, -0) ? 0 : -pan.y * zoom,
        axisX: Object.is(-pan.x * zoom, -0) ? 0 : -pan.x * zoom,
        axisY: Object.is(-pan.y * zoom, -0) ? 0 : -pan.y * zoom,
        showMinor: subdivisions > 1
    };
}

/** Snap the final world position, rather than its delta, so off-grid selections align. */
export function moveScenePosition(start, delta, { axis = 'both', snapStep = null } = {}) {
    if (!start || !delta || ![start.x, start.y, delta.x, delta.y].every(Number.isFinite) || !['x', 'y', 'both'].includes(axis)) {
        throw new TypeError('Moving a selection requires finite positions and a supported axis');
    }
    const apply = value => snapStep === null ? value : snapSceneValue(value, snapStep);
    return { x: axis === 'y' ? start.x : apply(start.x + delta.x), y: axis === 'x' ? start.y : apply(start.y + delta.y) };
}

/** Rect-tool resize in world axes. The caller supplies the rendered starting size.
 * This returns scale only; the caller chooses the fixed pivot/anchor explicitly.
 */
export function resizeSceneScale(scale, size, delta, { uniform = false, minSize = 0.01 } = {}) {
    if (!scale || !size || !delta || ![scale.x, scale.y, size.width, size.height, delta.x, delta.y, minSize].every(Number.isFinite)
        || scale.x === 0 || scale.y === 0 || size.width <= 0 || size.height <= 0 || minSize <= 0) {
        throw new TypeError('Rect resizing requires a nonzero scale and positive rendered dimensions');
    }
    let factorX = Math.max(minSize, size.width + delta.x) / size.width;
    let factorY = Math.max(minSize, size.height + delta.y) / size.height;
    if (uniform) factorX = factorY = Math.abs(factorX - 1) >= Math.abs(factorY - 1) ? factorX : factorY;
    return { x: scale.x * factorX, y: scale.y * factorY };
}

/** Immutable starting state for Escape rollback and one edit transaction per drag. */
export function captureTransformSnapshot(ids, entities) {
    if (!Array.isArray(ids) || ids.length === 0 || !entities) return null;
    const snapshot = Object.create(null);
    for (const id of ids) {
        const transform = entities[id]?.transform;
        if (!transform?.position || !transform?.scale || ![transform.position.x, transform.position.y, transform.rotation ?? 0, transform.scale.x, transform.scale.y].every(Number.isFinite)) return null;
        snapshot[id] = Object.freeze({ position: Object.freeze({ ...transform.position }), rotation: transform.rotation ?? 0, scale: Object.freeze({ ...transform.scale }) });
    }
    return Object.freeze(snapshot);
}
