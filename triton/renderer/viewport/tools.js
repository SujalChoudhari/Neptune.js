/**
 * Triton Editor - Tool System
 * Base tool class and common tool implementations
 */

/**
 * Base Tool class
 */
export class Tool {
    constructor(viewport) {
        this.viewport = viewport;
        this.editor = viewport.editor;
        this.active = false;
        this.name = 'tool';
        this.cursor = 'default';
    }

    activate() {
        this.active = true;
        this.viewport.gizmoCanvas.style.cursor = this.cursor;
    }

    deactivate() {
        this.active = false;
    }

    onMouseDown(e) { }
    onMouseMove(e) { }
    onMouseUp(e) { }
    onKeyDown(e) { }
    render(ctx) { }
}

/**
 * Select Tool - Pick and select entities
 */
export class SelectTool extends Tool {
    constructor(viewport) {
        super(viewport);
        this.name = 'select';
        this.cursor = 'default';
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionEnd = null;
    }

    onMouseDown(e) {
        const worldPos = this.viewport.screenToWorld(e.offsetX, e.offsetY);

        // Try to pick an entity
        const entity = this.editor.sceneEditor?.pickEntity(worldPos.x, worldPos.y);

        if (entity) {
            // Select entity (add to selection if shift key)
            this.editor.sceneEditor.selectEntity(entity.id, e.shiftKey);
        } else {
            // Start marquee selection
            this.isSelecting = true;
            this.selectionStart = worldPos;
            this.selectionEnd = worldPos;

            if (!e.shiftKey) {
                this.editor.sceneEditor?.clearSelection();
            }
        }
    }

    onMouseMove(e) {
        if (this.isSelecting) {
            this.selectionEnd = this.viewport.screenToWorld(e.offsetX, e.offsetY);
            this.viewport.renderGizmos();
        }
    }

    onMouseUp(e) {
        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            // TODO: Select all entities in marquee
            this.isSelecting = false;
            this.selectionStart = null;
            this.selectionEnd = null;
            this.viewport.renderGizmos();
        }
    }

    render(ctx) {
        // Draw marquee selection
        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
            const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const w = Math.abs(this.selectionEnd.x - this.selectionStart.x);
            const h = Math.abs(this.selectionEnd.y - this.selectionStart.y);

            ctx.strokeStyle = '#4a90d9';
            ctx.fillStyle = 'rgba(74, 144, 217, 0.2)';
            ctx.lineWidth = 1 / this.viewport.zoom;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
        }
    }
}

/**
 * Move Tool - Drag entities to move them
 */
export class MoveTool extends Tool {
    constructor(viewport) {
        super(viewport);
        this.name = 'move';
        this.cursor = 'move';
        this.isDragging = false;
        this.dragStart = null;
        this.dragOffset = null;
        this.draggedEntity = null;
        this.originalPosition = null;
    }

    onMouseDown(e) {
        const worldPos = this.viewport.screenToWorld(e.offsetX, e.offsetY);

        // Pick entity to drag
        const entity = this.editor.sceneEditor?.pickEntity(worldPos.x, worldPos.y);

        if (entity) {
            this.isDragging = true;
            this.draggedEntity = entity;
            this.originalPosition = { ...entity.transform.position };
            this.dragOffset = {
                x: worldPos.x - entity.transform.position.x,
                y: worldPos.y - entity.transform.position.y
            };

            // Also select it
            this.editor.sceneEditor?.selectEntity(entity.id);
        }
    }

    onMouseMove(e) {
        if (this.isDragging && this.draggedEntity) {
            const worldPos = this.viewport.screenToWorld(e.offsetX, e.offsetY);

            // Update entity position (without command for now, we'll commit on mouse up)
            this.draggedEntity.transform.position = {
                x: worldPos.x - this.dragOffset.x,
                y: worldPos.y - this.dragOffset.y
            };

            this.viewport.render();
        }
    }

    onMouseUp(e) {
        if (this.isDragging && this.draggedEntity) {
            const newPosition = { ...this.draggedEntity.transform.position };

            // Only create command if position actually changed
            if (newPosition.x !== this.originalPosition.x ||
                newPosition.y !== this.originalPosition.y) {

                // Reset to original, then execute command (which will set new position)
                this.draggedEntity.transform.position = { ...this.originalPosition };
                this.editor.sceneEditor?.moveEntity(this.draggedEntity.id, newPosition);
            }

            this.isDragging = false;
            this.draggedEntity = null;
            this.dragOffset = null;
            this.originalPosition = null;
        }
    }

    render(ctx) {
        // Draw move cross for dragged entity
        if (this.isDragging && this.draggedEntity) {
            const pos = this.draggedEntity.transform.position;
            const size = 20 / this.viewport.zoom;

            ctx.strokeStyle = '#4a90d9';
            ctx.lineWidth = 2 / this.viewport.zoom;

            // Cross
            ctx.beginPath();
            ctx.moveTo(pos.x - size, pos.y);
            ctx.lineTo(pos.x + size, pos.y);
            ctx.moveTo(pos.x, pos.y - size);
            ctx.lineTo(pos.x, pos.y + size);
            ctx.stroke();
        }
    }
}

/**
 * ToolManager - Manages tool switching
 */
export class ToolManager {
    constructor(viewport) {
        this.viewport = viewport;
        this.tools = new Map();
        this.currentTool = null;

        // Register default tools
        this.register('select', new SelectTool(viewport));
        this.register('move', new MoveTool(viewport));
    }

    register(name, tool) {
        this.tools.set(name, tool);
    }

    setTool(name) {
        if (this.currentTool) {
            this.currentTool.deactivate();
        }

        this.currentTool = this.tools.get(name) || this.tools.get('select');
        this.currentTool.activate();

        return this.currentTool;
    }

    onMouseDown(e) {
        this.currentTool?.onMouseDown(e);
    }

    onMouseMove(e) {
        this.currentTool?.onMouseMove(e);
    }

    onMouseUp(e) {
        this.currentTool?.onMouseUp(e);
    }

    onKeyDown(e) {
        this.currentTool?.onKeyDown(e);
    }

    render(ctx) {
        this.currentTool?.render(ctx);
    }
}
