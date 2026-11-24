import { Vector2 } from "../math/vec2.js";

/**
 * Robust coordinate conversion utilities across screen pixels, high-DPI canvas pixels,
 * viewport cameras, and world-space units.
 */
export class InputCoordinates {
    /**
     * Convert screen client coordinates (e.g. from mouse or touch event) into canvas internal pixels.
     * Accurately corrects for CSS letterboxing, scaling, and high-DPI ratios.
     * @param {{ clientX: number, clientY: number }} screenPoint
     * @param {HTMLCanvasElement} canvas
     * @returns {Vector2}
     */
    static screenToCanvas(screenPoint, canvas) {
        if (!screenPoint || !Number.isFinite(screenPoint.clientX) || !Number.isFinite(screenPoint.clientY)) {
            throw new TypeError("screenPoint must have finite clientX and clientY");
        }
        if (!canvas) throw new TypeError("canvas element is required");

        const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width || 800, height: canvas.height || 600 };
        const cssX = screenPoint.clientX - rect.left;
        const cssY = screenPoint.clientY - rect.top;

        const scaleX = rect.width > 0 ? (canvas.width || rect.width) / rect.width : 1;
        const scaleY = rect.height > 0 ? (canvas.height || rect.height) / rect.height : 1;

        return new Vector2(cssX * scaleX, cssY * scaleY);
    }

    /**
     * Convert canvas internal pixel coordinates to world units based on a Camera.
     * @param {{ x: number, y: number }} canvasPoint - Coordinates in canvas pixels
     * @param {object} camera - Camera with position { x, y } and zoom number
     * @param {number} [canvasWidth] - Canvas pixel width (defaults to 1024 or camera/canvas dimensions)
     * @param {number} [canvasHeight] - Canvas pixel height (defaults to 768 or camera/canvas dimensions)
     * @param {number} [pixelsPerUnit=64] - Engine world unit conversion (64 px = 1 unit)
     * @returns {Vector2}
     */
    static canvasToWorld(canvasPoint, camera, canvasWidth = 1024, canvasHeight = 768, pixelsPerUnit = 64) {
        if (!canvasPoint || !Number.isFinite(canvasPoint.x) || !Number.isFinite(canvasPoint.y)) {
            throw new TypeError("canvasPoint must have finite x and y");
        }
        const camX = camera?.position?.x ?? 0;
        const camY = camera?.position?.y ?? 0;
        const zoom = (camera?.zoom && Number.isFinite(camera.zoom) && camera.zoom > 0) ? camera.zoom : 1;

        const halfW = canvasWidth / 2;
        const halfH = canvasHeight / 2;

        const worldX = camX + (canvasPoint.x - halfW) / (zoom * pixelsPerUnit);
        const worldY = camY + (canvasPoint.y - halfH) / (zoom * pixelsPerUnit);

        return new Vector2(worldX, worldY);
    }

    /**
     * Convert world units back to canvas pixel coordinates.
     * @param {{ x: number, y: number }} worldPoint
     * @param {object} camera
     * @param {number} [canvasWidth=1024]
     * @param {number} [canvasHeight=768]
     * @param {number} [pixelsPerUnit=64]
     * @returns {Vector2}
     */
    static worldToCanvas(worldPoint, camera, canvasWidth = 1024, canvasHeight = 768, pixelsPerUnit = 64) {
        if (!worldPoint || !Number.isFinite(worldPoint.x) || !Number.isFinite(worldPoint.y)) {
            throw new TypeError("worldPoint must have finite x and y");
        }
        const camX = camera?.position?.x ?? 0;
        const camY = camera?.position?.y ?? 0;
        const zoom = (camera?.zoom && Number.isFinite(camera.zoom) && camera.zoom > 0) ? camera.zoom : 1;

        const halfW = canvasWidth / 2;
        const halfH = canvasHeight / 2;

        const canvasX = halfW + (worldPoint.x - camX) * (zoom * pixelsPerUnit);
        const canvasY = halfH + (worldPoint.y - camY) * (zoom * pixelsPerUnit);

        return new Vector2(canvasX, canvasY);
    }

    /**
     * Combined pipeline: convert screen client coordinates directly to world units.
     * @param {{ clientX: number, clientY: number }} screenPoint
     * @param {HTMLCanvasElement} canvas
     * @param {object} camera
     * @param {number} [pixelsPerUnit=64]
     * @returns {Vector2}
     */
    static screenToWorld(screenPoint, canvas, camera, pixelsPerUnit = 64) {
        const canvasPoint = InputCoordinates.screenToCanvas(screenPoint, canvas);
        return InputCoordinates.canvasToWorld(canvasPoint, camera, canvas.width, canvas.height, pixelsPerUnit);
    }
}
