export function applyRuntimeComponentUpdate(game, payload) {
    if (!game?.scene || typeof payload?.id !== 'string' || typeof payload.component !== 'string') return false;
    const find = root => {
        if (!root) return null;
        if (root.id === payload.id) return root;
        for (const child of root.children || []) {
            const found = find(child);
            if (found) return found;
        }
        return null;
    };
    const entity = find(game.scene);
    if (!entity) return false;
    if (payload.component.toLowerCase() === 'active') {
        if (typeof payload.data !== 'boolean') return false;
        entity.active = payload.data;
        return true;
    }
    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) return false;
    const component = entity.components?.find(item => item.constructor.name.toLowerCase() === payload.component.toLowerCase())
        || (payload.component.toLowerCase() === 'transform' ? entity.transform : null);
    if (!component) return false;
    if (typeof component.deserialize === 'function') component.deserialize(payload.data);
    else Object.assign(component, payload.data);
    return true;
}

export const runtimeComponentBridgeScript = `(() => {
    const applyRuntimeComponentUpdate = ${applyRuntimeComponentUpdate.toString()};
    window.addEventListener('message', event => {
        if (event.source !== window.parent || event.data?.type !== 'editor:update-component') return;
        applyRuntimeComponentUpdate(window.game, event.data.payload);
    });
})();`;
