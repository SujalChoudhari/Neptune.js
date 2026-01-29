/**
 * Triton Editor - Tilemap Editor
 * Handles tilemap painting, erasing, and flood fill
 */

/**
 * TilemapEditor - Manages tilemap editing operations
 */
export class TilemapEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentTilemap = null;
        this.selectedTile = null;
        this.brushSize = 1;
    }

    /**
     * Initialize the tilemap editor
     */
    init() {
        // Subscribe to tile selection
        this.editor.events.on('tile:selected', ({ tileIndex }) => {
            this.selectedTile = tileIndex;
        });

        // Subscribe to layer changes
        this.editor.state.subscribe('activeLayer', () => {
            this.updateCurrentTilemap();
        });

        this.editor.state.subscribe('currentScene', () => {
            this.updateCurrentTilemap();
        });
    }

    /**
     * Update reference to current tilemap layer
     */
    updateCurrentTilemap() {
        const scene = this.editor.state.get('currentScene');
        const activeIndex = this.editor.state.get('activeLayer');

        if (!scene || activeIndex === undefined) {
            this.currentTilemap = null;
            return;
        }

        const layer = scene.layers?.[activeIndex];
        if (layer?.type === 'tilemap') {
            this.currentTilemap = layer;
        } else {
            this.currentTilemap = null;
        }
    }

    /**
     * Get the current tilemap layer
     */
    getCurrentTilemap() {
        return this.currentTilemap;
    }

    /**
     * Paint a tile at the given tilemap coordinates
     */
    paintTile(tileX, tileY, tileIndex = null) {
        const tilemap = this.currentTilemap;
        if (!tilemap || tilemap.locked) return false;

        const tile = tileIndex !== null ? tileIndex : this.selectedTile;
        if (tile === null) return false;

        // Ensure data array exists and is properly sized
        if (!tilemap.data) {
            tilemap.data = [];
        }

        // Expand data if needed
        const requiredSize = tilemap.width * tilemap.height;
        while (tilemap.data.length < requiredSize) {
            tilemap.data.push(-1); // -1 = empty
        }

        // Check bounds
        if (tileX < 0 || tileX >= tilemap.width || tileY < 0 || tileY >= tilemap.height) {
            return false;
        }

        const index = tileY * tilemap.width + tileX;
        const oldTile = tilemap.data[index];

        // Skip if same tile
        if (oldTile === tile) return false;

        // Apply with undo support
        const command = {
            execute: () => {
                tilemap.data[index] = tile;
                this.editor.events.emit('tilemap:changed', { tileX, tileY, tile });
            },
            undo: () => {
                tilemap.data[index] = oldTile;
                this.editor.events.emit('tilemap:changed', { tileX, tileY, tile: oldTile });
            },
            description: `Paint tile at (${tileX}, ${tileY})`
        };

        this.editor.history.execute(command);
        return true;
    }

    /**
     * Erase a tile (set to -1)
     */
    eraseTile(tileX, tileY) {
        return this.paintTile(tileX, tileY, -1);
    }

    /**
     * Paint multiple tiles (for brush size > 1)
     */
    paintArea(centerX, centerY, tileIndex = null) {
        const halfSize = Math.floor(this.brushSize / 2);
        const commands = [];

        for (let dy = -halfSize; dy <= halfSize; dy++) {
            for (let dx = -halfSize; dx <= halfSize; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                this.paintTile(x, y, tileIndex);
            }
        }
    }

    /**
     * Flood fill from a starting point
     */
    floodFill(startX, startY, tileIndex = null) {
        const tilemap = this.currentTilemap;
        if (!tilemap || tilemap.locked) return;

        const tile = tileIndex !== null ? tileIndex : this.selectedTile;
        if (tile === null) return;

        if (!tilemap.data || tilemap.data.length === 0) {
            // Initialize empty tilemap
            tilemap.data = new Array(tilemap.width * tilemap.height).fill(-1);
        }

        const startIndex = startY * tilemap.width + startX;
        const targetTile = tilemap.data[startIndex];

        // Don't fill if same tile
        if (targetTile === tile) return;

        // Store original state for undo
        const originalData = [...tilemap.data];
        const filledPositions = [];

        // BFS flood fill
        const queue = [{ x: startX, y: startY }];
        const visited = new Set();

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) continue;

            const idx = y * tilemap.width + x;
            if (tilemap.data[idx] !== targetTile) continue;

            visited.add(key);
            tilemap.data[idx] = tile;
            filledPositions.push({ x, y });

            // Add neighbors
            queue.push({ x: x + 1, y });
            queue.push({ x: x - 1, y });
            queue.push({ x, y: y + 1 });
            queue.push({ x, y: y - 1 });
        }

        // Create undo command for entire fill
        const newData = [...tilemap.data];
        const command = {
            execute: () => {
                tilemap.data = [...newData];
                this.editor.events.emit('tilemap:changed', { filled: filledPositions.length });
            },
            undo: () => {
                tilemap.data = [...originalData];
                this.editor.events.emit('tilemap:changed', { filled: -filledPositions.length });
            },
            description: `Flood fill ${filledPositions.length} tiles`
        };

        // Re-execute to register in history (we already applied the fill)
        tilemap.data = [...originalData];
        this.editor.history.execute(command);

        this.editor.console.log('info', `Filled ${filledPositions.length} tiles`);
    }

    /**
     * Get tile at tilemap coordinates
     */
    getTileAt(tileX, tileY) {
        const tilemap = this.currentTilemap;
        if (!tilemap || !tilemap.data) return -1;

        if (tileX < 0 || tileX >= tilemap.width || tileY < 0 || tileY >= tilemap.height) {
            return -1;
        }

        const index = tileY * tilemap.width + tileX;
        return tilemap.data[index] ?? -1;
    }

    /**
     * Convert world coordinates to tilemap coordinates
     */
    worldToTile(worldX, worldY, tileSize = 32) {
        return {
            x: Math.floor(worldX / tileSize),
            y: Math.floor(worldY / tileSize)
        };
    }

    /**
     * Convert tilemap coordinates to world coordinates
     */
    tileToWorld(tileX, tileY, tileSize = 32) {
        return {
            x: tileX * tileSize,
            y: tileY * tileSize
        };
    }

    /**
     * Clear entire tilemap
     */
    clearTilemap() {
        const tilemap = this.currentTilemap;
        if (!tilemap || tilemap.locked) return;

        const originalData = tilemap.data ? [...tilemap.data] : [];
        const emptyData = new Array(tilemap.width * tilemap.height).fill(-1);

        const command = {
            execute: () => {
                tilemap.data = [...emptyData];
                this.editor.events.emit('tilemap:changed', { cleared: true });
            },
            undo: () => {
                tilemap.data = [...originalData];
                this.editor.events.emit('tilemap:changed', { cleared: false });
            },
            description: 'Clear tilemap'
        };

        this.editor.history.execute(command);
    }

    /**
     * Resize tilemap (destructive if shrinking)
     */
    resizeTilemap(newWidth, newHeight) {
        const tilemap = this.currentTilemap;
        if (!tilemap) return;

        const oldWidth = tilemap.width;
        const oldHeight = tilemap.height;
        const oldData = tilemap.data ? [...tilemap.data] : [];

        const newData = new Array(newWidth * newHeight).fill(-1);

        // Copy existing data
        const copyWidth = Math.min(oldWidth, newWidth);
        const copyHeight = Math.min(oldHeight, newHeight);

        for (let y = 0; y < copyHeight; y++) {
            for (let x = 0; x < copyWidth; x++) {
                const oldIndex = y * oldWidth + x;
                const newIndex = y * newWidth + x;
                newData[newIndex] = oldData[oldIndex] ?? -1;
            }
        }

        const command = {
            execute: () => {
                tilemap.width = newWidth;
                tilemap.height = newHeight;
                tilemap.data = [...newData];
                this.editor.events.emit('tilemap:resized', { width: newWidth, height: newHeight });
            },
            undo: () => {
                tilemap.width = oldWidth;
                tilemap.height = oldHeight;
                tilemap.data = [...oldData];
                this.editor.events.emit('tilemap:resized', { width: oldWidth, height: oldHeight });
            },
            description: `Resize tilemap to ${newWidth}x${newHeight}`
        };

        this.editor.history.execute(command);
    }
}
