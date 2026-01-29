/**
 * Triton Editor - Viewport
 * Canvas viewport for scene editing
 */

import { ToolManager } from './tools.js';
import { TileBrushTool, TileEraserTool, TileFillTool } from './tilemapTools.js';

/**
 * Viewport class for scene rendering and interaction
 */
export class Viewport {
    constructor(editor) {
        this.editor = editor;
        this.gameCanvas = null;
        this.gizmoCanvas = null;
        this.gameCtx = null;
        this.gizmoCtx = null;

        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.isPanning = false;
        this.lastMousePos = { x: 0, y: 0 };

        this.width = 0;
        this.height = 0;

        this.toolManager = null;
    }

    /**
     * Initialize the viewport
     */
    async init() {
        this.gameCanvas = document.getElementById('game-canvas');
        this.gizmoCanvas = document.getElementById('gizmo-canvas');

        if (!this.gameCanvas || !this.gizmoCanvas) {
            throw new Error('Viewport canvases not found');
        }

        this.gameCtx = this.gameCanvas.getContext('2d');
        this.gizmoCtx = this.gizmoCanvas.getContext('2d');

        // Initialize tool manager
        this.toolManager = new ToolManager(this);
        this.toolManager.register('brush', new TileBrushTool(this));
        this.toolManager.register('eraser', new TileEraserTool(this));
        this.toolManager.register('fill', new TileFillTool(this));
        this.toolManager.setTool('select');

        // Setup resize observer
        this.setupResize();

        // Setup mouse handlers
        this.setupInput();

        // Initial render
        this.render();
    }

    /**
     * Setup canvas resize observer
     */
    setupResize() {
        const container = document.getElementById('viewport');
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.resize(width, height);
            }
        });
        resizeObserver.observe(container);
    }

    /**
     * Resize canvases
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        const dpr = window.devicePixelRatio || 1;

        // Resize both canvases
        [this.gameCanvas, this.gizmoCanvas].forEach(canvas => {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        });

        // Scale contexts for DPR
        this.gameCtx.scale(dpr, dpr);
        this.gizmoCtx.scale(dpr, dpr);

        this.render();
    }

    /**
     * Setup mouse/keyboard input
     */
    setupInput() {
        const container = document.getElementById('viewport');

        // Pan with middle mouse or shift+drag
        container.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                this.isPanning = true;
                this.lastMousePos = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            } else if (e.button === 0) {
                // Pass to tool manager
                this.toolManager?.onMouseDown(e);
            }
        });

        container.addEventListener('mousemove', (e) => {
            // Update tracked mouse position
            this.lastMousePos = { x: e.offsetX, y: e.offsetY };

            if (this.isPanning) {
                const dx = e.clientX - this.lastMousePos.x;
                const dy = e.clientY - this.lastMousePos.y;
                this.pan.x += dx;
                this.pan.y += dy;
                this.lastMousePos = { x: e.clientX, y: e.clientY };
                this.editor.state.set('pan', { ...this.pan });
                this.render();
            } else {
                // Pass to tool manager
                this.toolManager?.onMouseMove(e);
            }
        });

        container.addEventListener('mouseup', (e) => {
            if (e.button === 1 || this.isPanning) {
                this.isPanning = false;
            } else if (e.button === 0) {
                // Pass to tool manager
                this.toolManager?.onMouseUp(e);
            }
        });

        container.addEventListener('mouseleave', () => {
            this.isPanning = false;
        });

        // Zoom with scroll wheel
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.setZoom(this.zoom + delta);
        });
    }

    /**
     * Set zoom level
     * @param {number} zoom - Zoom level (0.1 - 5)
     */
    setZoom(zoom) {
        this.zoom = Math.max(0.1, Math.min(5, zoom));
        this.editor.state.set('zoom', this.zoom);
        document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%';
        this.render();
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.setZoom(this.zoom + 0.1);
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.setZoom(this.zoom - 0.1);
    }

    /**
     * Convert screen coordinates to world coordinates
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {{x: number, y: number}}
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.pan.x) / this.zoom,
            y: (screenY - this.pan.y) / this.zoom
        };
    }

    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{x: number, y: number}}
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.zoom + this.pan.x,
            y: worldY * this.zoom + this.pan.y
        };
    }

    /**
     * Main render loop
     */
    render() {
        this.renderGame();
        this.renderGizmos();
    }

    /**
     * Render game content
     */
    renderGame() {
        const ctx = this.gameCtx;
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, this.width, this.height);

        // Apply transform
        ctx.save();
        ctx.translate(this.pan.x, this.pan.y);
        ctx.scale(this.zoom, this.zoom);

        // Draw grid
        this.drawGrid(ctx);

        // Draw scene content
        const scene = this.editor.state.get('currentScene');
        if (scene) {
            // TODO: Render scene layers
        }

        ctx.restore();
    }

    /**
     * Draw editor grid
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawGrid(ctx) {
        const gridSize = 32;
        const startX = Math.floor(-this.pan.x / this.zoom / gridSize) * gridSize;
        const startY = Math.floor(-this.pan.y / this.zoom / gridSize) * gridSize;
        const endX = startX + this.width / this.zoom + gridSize * 2;
        const endY = startY + this.height / this.zoom + gridSize * 2;

        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1 / this.zoom;

        ctx.beginPath();

        // Vertical lines
        for (let x = startX; x < endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }

        // Horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }

        ctx.stroke();

        // Draw origin
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2 / this.zoom;
        ctx.beginPath();
        ctx.moveTo(0, startY);
        ctx.lineTo(0, endY);
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, 0);
        ctx.stroke();
    }

    /**
     * Render editor gizmos (selection, handles, etc.)
     */
    renderGizmos() {
        const ctx = this.gizmoCtx;
        if (!ctx) return;

        // Clear gizmo layer
        ctx.clearRect(0, 0, this.width, this.height);

        // Apply transform
        ctx.save();
        ctx.translate(this.pan.x, this.pan.y);
        ctx.scale(this.zoom, this.zoom);

        // Draw selection boxes
        const selected = this.editor.state.get('selectedEntities');
        if (selected && selected.length > 0) {
            ctx.strokeStyle = '#4a90d9';
            ctx.lineWidth = 2 / this.zoom;

            for (const entity of selected) {
                this.drawSelectionBox(ctx, entity);
            }
        }

        // Draw current tool gizmos
        this.toolManager?.render(ctx);

        ctx.restore();
    }

    /**
     * Draw selection box around entity
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} entity 
     */
    drawSelectionBox(ctx, entity) {
        if (!entity.transform) return;

        const { x, y } = entity.transform.position || { x: 0, y: 0 };
        const size = entity.size || { width: 64, height: 64 };

        ctx.strokeRect(x, y, size.width, size.height);

        // Draw handles
        const handleSize = 8 / this.zoom;
        ctx.fillStyle = '#4a90d9';
        ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + size.width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x - handleSize / 2, y + size.height - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + size.width - handleSize / 2, y + size.height - handleSize / 2, handleSize, handleSize);
    }
}
