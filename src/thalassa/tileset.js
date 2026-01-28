/**
 * Tileset manages a spritesheet of tiles for use with Tilemap.
 * @class Tileset
 */
export class Tileset {
    /**
     * @param {string} imagePath - Path to the tileset image.
     * @param {number} tileWidth - Width of each tile in pixels.
     * @param {number} tileHeight - Height of each tile in pixels.
     */
    constructor(imagePath, tileWidth = 16, tileHeight = 16) {
        this.imagePath = imagePath;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.image = new Image();
        this.image.src = imagePath;
        this.loaded = false;
        this.columns = 0;
        this.rows = 0;

        this.image.onload = () => {
            this.loaded = true;
            this.columns = Math.floor(this.image.width / this.tileWidth);
            this.rows = Math.floor(this.image.height / this.tileHeight);
        };
    }

    /**
     * Get the source rectangle for a tile by its ID.
     * @param {number} tileId - Tile ID (0-indexed, left-to-right, top-to-bottom).
     * @returns {{ x: number, y: number, w: number, h: number }}
     */
    getTileRect(tileId) {
        if (this.columns === 0) return { x: 0, y: 0, w: this.tileWidth, h: this.tileHeight };

        const col = tileId % this.columns;
        const row = Math.floor(tileId / this.columns);

        return {
            x: col * this.tileWidth,
            y: row * this.tileHeight,
            w: this.tileWidth,
            h: this.tileHeight
        };
    }

    /**
     * Draw a specific tile to a canvas context.
     * @param {CanvasRenderingContext2D} ctx - Canvas context.
     * @param {number} tileId - Tile ID.
     * @param {number} destX - Destination X position.
     * @param {number} destY - Destination Y position.
     * @param {number} scale - Scale factor.
     */
    drawTile(ctx, tileId, destX, destY, scale = 1) {
        if (!this.loaded) return;

        const rect = this.getTileRect(tileId);
        ctx.drawImage(
            this.image,
            rect.x, rect.y, rect.w, rect.h,
            destX, destY,
            this.tileWidth * scale, this.tileHeight * scale
        );
    }
}
