import { Component } from "../components/component.js";

/**
 * Parallax layer for scrolling backgrounds.
 * @class ParallaxLayer
 * @extends Component
 */
export class ParallaxLayer extends Component {
    /**
     * @param {string} imagePath - Path to background image.
     * @param {number} scrollFactor - Scroll speed relative to camera (0 = fixed, 1 = normal, <1 = slower).
     */
    constructor(imagePath, scrollFactor = 0.5) {
        super();
        this.imagePath = imagePath;
        this.scrollFactor = scrollFactor;
        this.offsetX = 0;
        this.offsetY = 0;
        this.repeatX = true;
        this.repeatY = false;

        this.image = new Image();
        this.image.src = imagePath;
        this.loaded = false;
        this.image.onload = () => { this.loaded = true; };
    }

    /**
     * Update parallax offset based on camera position.
     * @param {number} cameraX 
     * @param {number} cameraY 
     */
    updateOffset(cameraX, cameraY) {
        this.offsetX = cameraX * this.scrollFactor;
        this.offsetY = cameraY * this.scrollFactor;
    }

    /**
     * Draw the parallax layer.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} viewWidth - Viewport width.
     * @param {number} viewHeight - Viewport height.
     */
    draw(ctx, viewWidth, viewHeight) {
        if (!this.loaded) return;

        const imgW = this.image.width;
        const imgH = this.image.height;

        if (this.repeatX) {
            // Tile horizontally
            const startX = -(this.offsetX % imgW);
            for (let x = startX; x < viewWidth; x += imgW) {
                ctx.drawImage(this.image, x, -this.offsetY);
            }
        } else {
            ctx.drawImage(this.image, -this.offsetX, -this.offsetY);
        }
    }
}

/**
 * Manages multiple parallax layers.
 * @class ParallaxBackground
 */
export class ParallaxBackground {
    constructor() {
        this.layers = [];
    }

    /**
     * Add a layer.
     * @param {ParallaxLayer} layer 
     * @returns {ParallaxBackground}
     */
    addLayer(layer) {
        this.layers.push(layer);
        this.layers.sort((a, b) => a.scrollFactor - b.scrollFactor); // Back to front
        return this;
    }

    /**
     * Update all layers.
     * @param {number} cameraX 
     * @param {number} cameraY 
     */
    update(cameraX, cameraY) {
        for (const layer of this.layers) {
            layer.updateOffset(cameraX, cameraY);
        }
    }

    /**
     * Draw all layers.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} viewWidth 
     * @param {number} viewHeight 
     */
    draw(ctx, viewWidth, viewHeight) {
        for (const layer of this.layers) {
            layer.draw(ctx, viewWidth, viewHeight);
        }
    }
}
