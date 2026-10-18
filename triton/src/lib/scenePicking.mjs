export function pickEntityAt(root, x, y, tolerance = 12) {
    if (!root || !Number.isFinite(x) || !Number.isFinite(y)) return null;

    let best = null;
    let bestDistance = Infinity;
    const visit = (entity) => {
        if (!entity) return;
        const transform = entity.components?.find((component) =>
            component && component.position && component.scale
        );
        const position = transform?.position;
        if (entity.id && position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
            const sprite = entity.components.find((component) => component?.width && component?.height);
            const collider = entity.components.find((component) => component?.constructor?.name?.toLowerCase().includes('collider'));
            const halfWidth = Math.max(tolerance, (sprite?.width || collider?.width || 0) * Math.abs(transform.scale.x) / 2);
            const halfHeight = Math.max(tolerance, (sprite?.height || collider?.height || 0) * Math.abs(transform.scale.y) / 2);
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
