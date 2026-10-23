export function createRuntimeEntity(game, engineModule, payload) {
    const findEntity = (root, id) => {
        if (!root) return null;
        if (root.id === id) return root;
        for (const child of root.children || []) {
            const found = findEntity(child, id);
            if (found) return found;
        }
        return null;
    };
    if (!game?.scene || !engineModule?.Entity || !engineModule?.Transform || !engineModule?.Vector2
        || !engineModule?.ComponentRegistry || typeof payload?.id !== "string" || !payload.id.trim()
        || typeof payload?.name !== "string") return null;
    if (findEntity(game.scene, payload.id)) return findEntity(game.scene, payload.id);

    const parent = payload.parentId === "root" ? game.scene : findEntity(game.scene, payload.parentId);
    if (!parent || typeof parent.AddChild !== "function") return null;

    const descriptors = Array.isArray(payload.components) ? payload.components : [];
    const transformDescriptor = descriptors.find(component => component?.type?.toLowerCase() === "transform");
    const transformData = transformDescriptor?.props || payload.transform || {};
    const position = transformData.position || transformData.pos || { x: 0, y: 0 };
    const scale = transformData.scale || { x: 1, y: 1 };
    const transform = engineModule.ComponentRegistry.create("Transform");
    if (!transform) return null;
    transform.position = new engineModule.Vector2(position.x ?? 0, position.y ?? 0);
    transform.rotation = transformData.rotation ?? transformData.rot ?? 0;
    transform.scale = new engineModule.Vector2(scale.x ?? 1, scale.y ?? 1);
    if (typeof transformDescriptor?.id === "string") transform.id = transformDescriptor.id;

    const runtimeComponents = [];
    for (const descriptor of descriptors) {
        if (!descriptor || typeof descriptor.type !== "string" || descriptor.type.toLowerCase() === "transform") continue;
        const props = descriptor.props && typeof descriptor.props === "object" ? descriptor.props : {};
        const constructorArgs = descriptor.type.toLowerCase() === "sprite"
            ? [props.path ?? props.texture ?? props.asset ?? props.reference]
            : [];
        const component = engineModule.ComponentRegistry.create(descriptor.type, ...constructorArgs);
        if (!component) return null;
        if (typeof component.deserialize === "function") component.deserialize(props);
        else Object.assign(component, props);
        if (typeof descriptor.id === "string") component.id = descriptor.id;
        runtimeComponents.push(component);
    }

    const entity = new engineModule.Entity(payload.name);
    entity.id = payload.id;
    entity.active = payload.active !== false;
    entity.AddComponent(transform);
    runtimeComponents.forEach(component => entity.AddComponent(component));
    parent.AddChild(entity);
    return entity;
}

export const runtimeEntityBridgeScript = `(() => {
    const createRuntimeEntity = ${createRuntimeEntity.toString()};
    window.addEventListener('message', event => {
        const message = event.data;
        if (!message || message.type !== 'editor:create-entity') return;
        createRuntimeEntity(window.game, window.__neptuneEngineModule, message.payload);
    });
})();`;
