import { Component } from "../components/component.js";
import { Tileset } from "./tileset.js";

/**
 * Tilemap component renders a grid of tiles from a tileset.
 * @class Tilemap
 * @extends Component
 */
export class Tilemap extends Component {
    /**
     * @param {Tileset} tileset - The tileset to use.
     * @param {number} width - Map width in tiles.
     * @param {number} height - Map height in tiles.
     */
    constructor(tileset, width = 10, height = 10) {
        super();
        this.tileset = tileset;
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.data = new Array(width * height).fill(-1); // -1 = empty
    }

    /**
     * Set a tile at position.
     * @param {number} x - X position in tiles.
     * @param {number} y - Y position in tiles.
     * @param {number} tileId - Tile ID from tileset (-1 for empty).
     */
    setTile(x, y, tileId) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.data[y * this.width + x] = tileId;
        }
    }

    /**
     * Get a tile at position.
     * @param {number} x - X position in tiles.
     * @param {number} y - Y position in tiles.
     * @returns {number} Tile ID or -1 if empty/out of bounds.
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.data[y * this.width + x];
        }
        return -1;
    }

    /**
     * Load tilemap from 2D array.
     * @param {number[][]} data - 2D array of tile IDs.
     */
    loadFromArray(data) {
        this.height = data.length;
        this.width = data[0]?.length || 0;
        this.data = new Array(this.width * this.height);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.data[y * this.width + x] = data[y][x] ?? -1;
            }
        }
    }

    /**
     * Get pixel width of the tilemap.
     */
    get pixelWidth() {
        return this.width * this.tileset.tileWidth * this.scale;
    }

    /**
     * Get pixel height of the tilemap.
     */
    get pixelHeight() {
        return this.height * this.tileset.tileHeight * this.scale;
    }

    /**
     * Convert world position to tile position.
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{ x: number, y: number }}
     */
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / (this.tileset.tileWidth * this.scale)),
            y: Math.floor(worldY / (this.tileset.tileHeight * this.scale))
        };
    }

    /**
     * Check if a tile is solid (non-empty).
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isSolid(x, y) {
        return this.getTile(x, y) >= 0;
    }

    /**
     * Draw the tilemap.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} offsetX - Camera offset X.
     * @param {number} offsetY - Camera offset Y.
     */
    draw(ctx, offsetX = 0, offsetY = 0) {
        const tw = this.tileset.tileWidth * this.scale;
        const th = this.tileset.tileHeight * this.scale;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileId = this.data[y * this.width + x];
                if (tileId >= 0) {
                    this.tileset.drawTile(
                        ctx,
                        tileId,
                        x * tw - offsetX,
                        y * th - offsetY,
                        this.scale
                    );
                }
            }
        }
    }
}
