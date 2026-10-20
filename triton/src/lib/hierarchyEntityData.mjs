export function createHierarchyEntityData(entity) {
    return {
        id: entity.id,
        name: entity.name,
        active: entity.active,
        transform: {
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            z: 0
        },
        components: {}
    };
}
