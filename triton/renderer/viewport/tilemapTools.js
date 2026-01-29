/**
 * Triton Editor - Tilemap Tools
 * Brush, eraser, and fill tools for tilemap editing
 */

import { Tool } from './tools.js';

/**
 * TileBrushTool - Paint tiles onto tilemap
 */
export class TileBrushTool extends Tool {
    constructor(viewport) {
        super(viewport);
        this.name = 'brush';
        this.cursor = 'crosshair';
        this.painting = false;
        this.lastTilePos = null;
    }

    onMouseDown(e) {
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor?.getCurrentTilemap()) {
            this.editor.console.log('warn', 'Select a tilemap layer first');
            return;
        }

        this.painting = true;
        this.paintAt(e.offsetX, e.offsetY);
    }

    onMouseMove(e) {
        if (this.painting) {
            this.paintAt(e.offsetX, e.offsetY);
        }

        // Update cursor preview
        this.viewport.renderGizmos();
    }

    onMouseUp(e) {
        this.painting = false;
        this.lastTilePos = null;
    }

    paintAt(screenX, screenY) {
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor) return;

        const worldPos = this.viewport.screenToWorld(screenX, screenY);
        const tilePos = tilemapEditor.worldToTile(worldPos.x, worldPos.y);

        // Skip if same tile as last
        if (this.lastTilePos &&
            this.lastTilePos.x === tilePos.x &&
            this.lastTilePos.y === tilePos.y) {
            return;
        }

        this.lastTilePos = tilePos;
        tilemapEditor.paintTile(tilePos.x, tilePos.y);
        this.viewport.render();
    }

    render(ctx) {
        // Draw tile cursor preview
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor?.getCurrentTilemap()) return;

        const mousePos = this.viewport.lastMousePos;
        if (!mousePos) return;

        const worldPos = this.viewport.screenToWorld(mousePos.x, mousePos.y);
        const tilePos = tilemapEditor.worldToTile(worldPos.x, worldPos.y);
        const worldTile = tilemapEditor.tileToWorld(tilePos.x, tilePos.y);

        ctx.strokeStyle = '#4a90d9';
        ctx.lineWidth = 2 / this.viewport.zoom;
        ctx.strokeRect(worldTile.x, worldTile.y, 32, 32);
    }
}

/**
 * TileEraserTool - Erase tiles from tilemap
 */
export class TileEraserTool extends Tool {
    constructor(viewport) {
        super(viewport);
        this.name = 'eraser';
        this.cursor = 'crosshair';
        this.erasing = false;
        this.lastTilePos = null;
    }

    onMouseDown(e) {
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor?.getCurrentTilemap()) {
            this.editor.console.log('warn', 'Select a tilemap layer first');
            return;
        }

        this.erasing = true;
        this.eraseAt(e.offsetX, e.offsetY);
    }

    onMouseMove(e) {
        if (this.erasing) {
            this.eraseAt(e.offsetX, e.offsetY);
        }
        this.viewport.renderGizmos();
    }

    onMouseUp(e) {
        this.erasing = false;
        this.lastTilePos = null;
    }

    eraseAt(screenX, screenY) {
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor) return;

        const worldPos = this.viewport.screenToWorld(screenX, screenY);
        const tilePos = tilemapEditor.worldToTile(worldPos.x, worldPos.y);

        if (this.lastTilePos &&
            this.lastTilePos.x === tilePos.x &&
            this.lastTilePos.y === tilePos.y) {
            return;
        }

        this.lastTilePos = tilePos;
        tilemapEditor.eraseTile(tilePos.x, tilePos.y);
        this.viewport.render();
    }

    render(ctx) {
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor?.getCurrentTilemap()) return;

        const mousePos = this.viewport.lastMousePos;
        if (!mousePos) return;

        const worldPos = this.viewport.screenToWorld(mousePos.x, mousePos.y);
        const tilePos = tilemapEditor.worldToTile(worldPos.x, worldPos.y);
        const worldTile = tilemapEditor.tileToWorld(tilePos.x, tilePos.y);

        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 2 / this.viewport.zoom;
        ctx.strokeRect(worldTile.x, worldTile.y, 32, 32);

        // Draw X
        ctx.beginPath();
        ctx.moveTo(worldTile.x + 8, worldTile.y + 8);
        ctx.lineTo(worldTile.x + 24, worldTile.y + 24);
        ctx.moveTo(worldTile.x + 24, worldTile.y + 8);
        ctx.lineTo(worldTile.x + 8, worldTile.y + 24);
        ctx.stroke();
    }
}

/**
 * TileFillTool - Flood fill tiles
 */
export class TileFillTool extends Tool {
    constructor(viewport) {
        super(viewport);
        this.name = 'fill';
        this.cursor = 'crosshair';
    }

    onMouseDown(e) {
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor?.getCurrentTilemap()) {
            this.editor.console.log('warn', 'Select a tilemap layer first');
            return;
        }

        if (tilemapEditor.selectedTile === null) {
            this.editor.console.log('warn', 'Select a tile first');
            return;
        }

        const worldPos = this.viewport.screenToWorld(e.offsetX, e.offsetY);
        const tilePos = tilemapEditor.worldToTile(worldPos.x, worldPos.y);

        tilemapEditor.floodFill(tilePos.x, tilePos.y);
        this.viewport.render();
    }

    render(ctx) {
        const tilemapEditor = this.editor.tilemapEditor;
        if (!tilemapEditor?.getCurrentTilemap()) return;

        const mousePos = this.viewport.lastMousePos;
        if (!mousePos) return;

        const worldPos = this.viewport.screenToWorld(mousePos.x, mousePos.y);
        const tilePos = tilemapEditor.worldToTile(worldPos.x, worldPos.y);
        const worldTile = tilemapEditor.tileToWorld(tilePos.x, tilePos.y);

        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2 / this.viewport.zoom;
        ctx.strokeRect(worldTile.x, worldTile.y, 32, 32);

        // Draw fill icon
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.fillRect(worldTile.x + 4, worldTile.y + 4, 24, 24);
    }
}
