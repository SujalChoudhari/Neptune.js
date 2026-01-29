/**
 * Triton Editor - Tileset Panel
 * UI for loading and selecting tiles from tilesets
 */

import { Panel } from './panelSystem.js';

/**
 * TilesetPanel - Shows tileset and allows tile selection
 */
export class TilesetPanel extends Panel {
    constructor(editor) {
        super('tileset', 'Tileset');
        this.editor = editor;
        this.tileset = null;
        this.tileWidth = 32;
        this.tileHeight = 32;
        this.selectedTile = null;
        this.tilesetImage = null;
    }

    init() {
        super.init();

        // Subscribe to tileset changes
        this.editor.events.on('tileset:loaded', (data) => {
            this.setTileset(data.tileset, data.image);
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        const content = document.getElementById('tileset-content');
        if (!content) return;

        // Load tileset button
        content.addEventListener('click', (e) => {
            if (e.target.id === 'btn-load-tileset') {
                this.loadTileset();
            }
        });
    }

    /**
     * Load a tileset from file
     */
    async loadTileset() {
        try {
            const result = await window.electronAPI.showOpenDialog({
                filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
                properties: ['openFile']
            });

            if (result.canceled || result.filePaths.length === 0) return;

            const path = result.filePaths[0];
            await this.loadTilesetFromPath(path);

        } catch (error) {
            this.editor.console.log('error', `Failed to load tileset: ${error.message}`);
        }
    }

    /**
     * Load tileset from a file path
     */
    async loadTilesetFromPath(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.tilesetImage = img;
                this.tileset = {
                    path,
                    width: img.width,
                    height: img.height,
                    columns: Math.floor(img.width / this.tileWidth),
                    rows: Math.floor(img.height / this.tileHeight)
                };

                this.editor.events.emit('tileset:loaded', {
                    tileset: this.tileset,
                    image: img
                });

                this.update();
                this.editor.console.log('info', `Loaded tileset: ${this.tileset.columns}x${this.tileset.rows} tiles`);
                resolve(this.tileset);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = path;
        });
    }

    /**
     * Set tileset data
     */
    setTileset(tileset, image) {
        this.tileset = tileset;
        this.tilesetImage = image;
        this.selectedTile = null;
        this.update();
    }

    render() {
        if (!this.tileset) {
            return `
                <div class="tileset-empty">
                    <button id="btn-load-tileset" class="primary-btn">Load Tileset</button>
                    <div class="empty-state">No tileset loaded</div>
                </div>
            `;
        }

        return `
            <div class="tileset-toolbar">
                <button id="btn-load-tileset" class="icon-btn" title="Load Tileset">📂</button>
                <span class="tileset-info">${this.tileset.columns}x${this.tileset.rows}</span>
            </div>
            <div class="tileset-grid-container">
                <canvas id="tileset-canvas" 
                        width="${this.tileset.width}" 
                        height="${this.tileset.height}">
                </canvas>
            </div>
        `;
    }

    update() {
        super.update();
        this.renderTilesetCanvas();
        this.setupTilesetClick();
    }

    /**
     * Render the tileset to canvas
     */
    renderTilesetCanvas() {
        const canvas = document.getElementById('tileset-canvas');
        if (!canvas || !this.tilesetImage) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw tileset image
        ctx.drawImage(this.tilesetImage, 0, 0);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= this.tileset.columns; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileWidth, 0);
            ctx.lineTo(x * this.tileWidth, this.tileset.height);
            ctx.stroke();
        }

        for (let y = 0; y <= this.tileset.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileHeight);
            ctx.lineTo(this.tileset.width, y * this.tileHeight);
            ctx.stroke();
        }

        // Highlight selected tile
        if (this.selectedTile !== null) {
            const tx = this.selectedTile % this.tileset.columns;
            const ty = Math.floor(this.selectedTile / this.tileset.columns);

            ctx.strokeStyle = '#4a90d9';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                tx * this.tileWidth + 1,
                ty * this.tileHeight + 1,
                this.tileWidth - 2,
                this.tileHeight - 2
            );
        }
    }

    /**
     * Setup click handler for tile selection
     */
    setupTilesetClick() {
        const canvas = document.getElementById('tileset-canvas');
        if (!canvas) return;

        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const x = Math.floor((e.clientX - rect.left) * scaleX / this.tileWidth);
            const y = Math.floor((e.clientY - rect.top) * scaleY / this.tileHeight);

            if (x >= 0 && x < this.tileset.columns && y >= 0 && y < this.tileset.rows) {
                this.selectedTile = y * this.tileset.columns + x;
                this.renderTilesetCanvas();

                this.editor.events.emit('tile:selected', {
                    tileIndex: this.selectedTile,
                    tileX: x,
                    tileY: y
                });

                // Auto-switch to brush tool
                this.editor.state.set('tool', 'brush');
            }
        };
    }

    /**
     * Get tile image data for a specific tile index
     */
    getTileImage(tileIndex) {
        if (!this.tilesetImage || tileIndex === null) return null;

        const tx = tileIndex % this.tileset.columns;
        const ty = Math.floor(tileIndex / this.tileset.columns);

        return {
            image: this.tilesetImage,
            sx: tx * this.tileWidth,
            sy: ty * this.tileHeight,
            sw: this.tileWidth,
            sh: this.tileHeight
        };
    }
}
