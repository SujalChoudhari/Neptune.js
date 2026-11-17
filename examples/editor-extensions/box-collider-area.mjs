export const extension = {
    id: "neptune.box-collider-area",
    apiVersion: 1,
    activate(api) {
        const getCollider = entity => entity?.components?.BoxCollider ?? entity?.components?.boxCollider ?? null;
        const getSize = entity => {
            const size = getCollider(entity)?.size;
            const width = Number(size?.x ?? getCollider(entity)?.width);
            const height = Number(size?.y ?? getCollider(entity)?.height);
            return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 ? { x: width, y: height } : null;
        };
        const getArea = id => {
            const entity = api.query.entity(id);
            const size = getSize(entity);
            const position = entity?.transform?.position;
            if (!size || !position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return null;
            return { x: position.x - size.x / 2, y: position.y - size.y / 2, width: size.x, height: size.y };
        };
        api.registerInspector("box-collider-area", {
            component: "BoxCollider",
            label: "Area (world units)",
            read: entity => getSize(entity),
            edit: (entityId, size) => {
                if (!Number.isFinite(size?.x) || size.x <= 0 || !Number.isFinite(size?.y) || size.y <= 0) return false;
                return api.commands.updateComponent(entityId, "BoxCollider", { size: { x: size.x, y: size.y } });
            }
        });
        api.registerContextAction("show-box-collider-area", {
            label: "Show Collider Area",
            when: entity => Boolean(getSize(entity)),
            run: entity => api.selection.set([entity.id])
        });
        api.registerTool("box-collider-area", {
            component: "BoxCollider",
            getArea,
            beginResize: entityId => {
                const entity = api.query.entity(entityId);
                if (!getSize(entity)) return null;
                return { transaction: api.commands.begin("Resize Box Collider"), entityId, before: getSize(entity) };
            },
            resize: (drag, size) => {
                if (!drag || !Number.isFinite(size?.x) || size.x <= 0 || !Number.isFinite(size?.y) || size.y <= 0) return false;
                return api.commands.updateComponent(drag.entityId, "BoxCollider", { size: { x: size.x, y: size.y } });
            },
            commit: drag => drag?.transaction.commit(),
            cancel: drag => drag?.transaction.cancel()
        });
    }
};

export default extension;
