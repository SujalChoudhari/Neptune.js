/**
 * Triton Editor - Scene Editor
 * Manages scene editing, entity manipulation, and layer coordination
 */

/**
 * SceneEditor - Coordinates scene editing operations
 */
export class SceneEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentScene = null;
        this.selectedEntities = [];
    }

    /**
     * Initialize the scene editor
     */
    init() {
        // Subscribe to state changes
        this.editor.state.subscribe('currentScene', (scene) => {
            this.currentScene = scene;
            this.onSceneLoaded(scene);
        });

        this.editor.state.subscribe('selectedEntities', (entities) => {
            this.selectedEntities = entities;
            this.onSelectionChanged(entities);
        });

        // Subscribe to events
        this.editor.events.on('layer:selected', ({ index }) => {
            this.onLayerSelected(index);
        });
    }

    /**
     * Called when a scene is loaded
     */
    onSceneLoaded(scene) {
        if (!scene) return;

        // Set active layer to main layer by default
        const mainLayerIndex = scene.layers?.findIndex(l => l.type === 'main');
        if (mainLayerIndex !== -1) {
            this.editor.state.set('activeLayer', mainLayerIndex);
        }

        // Clear selection
        this.editor.state.set('selectedEntities', []);

        // Trigger viewport refresh
        this.editor.events.emit('scene:refresh');
    }

    /**
     * Called when layer selection changes
     */
    onLayerSelected(index) {
        const scene = this.currentScene;
        if (!scene || !scene.layers[index]) return;

        const layer = scene.layers[index];
        this.editor.console.log('info', `Selected layer: ${layer.name || layer.type}`);
    }

    /**
     * Called when entity selection changes
     */
    onSelectionChanged(entities) {
        // Update inspector
        this.editor.events.emit('inspector:update', { entities });
    }

    /**
     * Get the active layer
     */
    getActiveLayer() {
        const scene = this.currentScene;
        const activeIndex = this.editor.state.get('activeLayer');
        return scene?.layers?.[activeIndex] || null;
    }

    /**
     * Get the main layer
     */
    getMainLayer() {
        return this.currentScene?.layers?.find(l => l.type === 'main') || null;
    }

    /**
     * Add entity to current scene
     */
    addEntity(entityData) {
        const mainLayer = this.getMainLayer();
        if (!mainLayer) {
            this.editor.console.log('error', 'No main layer found');
            return null;
        }

        if (!mainLayer.entities) {
            mainLayer.entities = [];
        }

        // Generate unique ID
        const entity = {
            id: `entity_${Date.now()}`,
            name: entityData.name || 'New Entity',
            transform: {
                position: entityData.position || { x: 0, y: 0 },
                scale: { x: 1, y: 1 },
                rotation: 0
            },
            components: entityData.components || [],
            ...entityData
        };

        mainLayer.entities.push(entity);

        // Update state
        this.editor.state.set('currentScene', { ...this.currentScene });
        this.editor.events.emit('entity:added', { entity });

        this.editor.console.log('info', `Added entity: ${entity.name}`);
        return entity;
    }

    /**
     * Remove entity from scene
     */
    removeEntity(entityId) {
        const mainLayer = this.getMainLayer();
        if (!mainLayer || !mainLayer.entities) return;

        const index = mainLayer.entities.findIndex(e => e.id === entityId);
        if (index === -1) return;

        const removed = mainLayer.entities.splice(index, 1)[0];

        // Clear from selection
        const selected = this.editor.state.get('selectedEntities');
        this.editor.state.set('selectedEntities',
            selected.filter(e => e.id !== entityId)
        );

        this.editor.state.set('currentScene', { ...this.currentScene });
        this.editor.events.emit('entity:removed', { entity: removed });

        this.editor.console.log('info', `Removed entity: ${removed.name}`);
    }

    /**
     * Select entity by ID
     */
    selectEntity(entityId, addToSelection = false) {
        const mainLayer = this.getMainLayer();
        if (!mainLayer || !mainLayer.entities) return;

        const entity = mainLayer.entities.find(e => e.id === entityId);
        if (!entity) return;

        if (addToSelection) {
            const current = this.editor.state.get('selectedEntities');
            if (!current.find(e => e.id === entityId)) {
                this.editor.state.set('selectedEntities', [...current, entity]);
            }
        } else {
            this.editor.state.set('selectedEntities', [entity]);
        }
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.editor.state.set('selectedEntities', []);
    }

    /**
     * Move entity (with command for undo)
     */
    moveEntity(entityId, newPosition) {
        const mainLayer = this.getMainLayer();
        if (!mainLayer || !mainLayer.entities) return;

        const entity = mainLayer.entities.find(e => e.id === entityId);
        if (!entity || !entity.transform) return;

        const oldPosition = { ...entity.transform.position };

        // Create command for undo
        const command = {
            execute: () => {
                entity.transform.position = { ...newPosition };
                this.editor.state.set('currentScene', { ...this.currentScene });
                this.editor.events.emit('entity:moved', { entity, oldPosition, newPosition });
            },
            undo: () => {
                entity.transform.position = { ...oldPosition };
                this.editor.state.set('currentScene', { ...this.currentScene });
                this.editor.events.emit('entity:moved', { entity, oldPosition: newPosition, newPosition: oldPosition });
            },
            description: `Move ${entity.name}`
        };

        this.editor.history.execute(command);
    }

    /**
     * Get entity at world position
     */
    pickEntity(worldX, worldY) {
        const mainLayer = this.getMainLayer();
        if (!mainLayer || !mainLayer.entities) return null;

        // Check entities in reverse order (top-most first)
        for (let i = mainLayer.entities.length - 1; i >= 0; i--) {
            const entity = mainLayer.entities[i];
            if (this.isPointInEntity(worldX, worldY, entity)) {
                return entity;
            }
        }
        return null;
    }

    /**
     * Check if point is inside entity bounds
     */
    isPointInEntity(x, y, entity) {
        if (!entity.transform) return false;

        const pos = entity.transform.position;
        const size = entity.size || { width: 64, height: 64 };

        return x >= pos.x && x <= pos.x + size.width &&
            y >= pos.y && y <= pos.y + size.height;
    }
}
