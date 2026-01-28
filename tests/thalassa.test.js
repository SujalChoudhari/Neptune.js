import { describe, it, expect, beforeEach } from "./tester.js";
import { Tileset, Tilemap, ParallaxLayer, ParallaxBackground, Camera } from "../src/thalassa/index.js";
import { Vector2 } from "../src/neptune.js";

// ============================================
// Tileset Tests
// ============================================
describe('Tileset', () => {
    it('creates tileset with dimensions', () => {
        const ts = new Tileset("test.png", 16, 16);
        expect(ts.tileWidth).toBe(16);
        expect(ts.tileHeight).toBe(16);
    });

    it('getTileRect calculates correct position', () => {
        const ts = new Tileset("test.png", 16, 16);
        ts.columns = 10; // Mock loaded state

        const rect = ts.getTileRect(15); // Row 1, Col 5
        expect(rect.x).toBe(80); // 5 * 16
        expect(rect.y).toBe(16); // 1 * 16
    });
});

// ============================================
// Tilemap Tests
// ============================================
describe('Tilemap', () => {
    let tileset;
    let tilemap;

    beforeEach(() => {
        tileset = new Tileset("test.png", 16, 16);
        tilemap = new Tilemap(tileset, 5, 5);
    });

    it('creates empty tilemap', () => {
        expect(tilemap.width).toBe(5);
        expect(tilemap.height).toBe(5);
        expect(tilemap.getTile(0, 0)).toBe(-1);
    });

    it('setTile and getTile work correctly', () => {
        tilemap.setTile(2, 3, 5);
        expect(tilemap.getTile(2, 3)).toBe(5);
    });

    it('loadFromArray populates map', () => {
        tilemap.loadFromArray([
            [0, 1, 2],
            [3, 4, 5]
        ]);
        expect(tilemap.width).toBe(3);
        expect(tilemap.height).toBe(2);
        expect(tilemap.getTile(1, 1)).toBe(4);
    });

    it('isSolid returns true for non-empty tiles', () => {
        tilemap.setTile(1, 1, 0);
        expect(tilemap.isSolid(1, 1)).toBe(true);
        expect(tilemap.isSolid(0, 0)).toBe(false);
    });

    it('worldToTile converts correctly', () => {
        tilemap.scale = 1;
        const pos = tilemap.worldToTile(32, 48);
        expect(pos.x).toBe(2);
        expect(pos.y).toBe(3);
    });
});

// ============================================
// ParallaxLayer Tests
// ============================================
describe('ParallaxLayer', () => {
    it('creates layer with scroll factor', () => {
        const layer = new ParallaxLayer("bg.png", 0.5);
        expect(layer.scrollFactor).toBe(0.5);
    });

    it('updateOffset applies scroll factor', () => {
        const layer = new ParallaxLayer("bg.png", 0.5);
        layer.updateOffset(100, 200);
        expect(layer.offsetX).toBe(50);
        expect(layer.offsetY).toBe(100);
    });
});

// ============================================
// ParallaxBackground Tests
// ============================================
describe('ParallaxBackground', () => {
    it('adds and sorts layers by scroll factor', () => {
        const bg = new ParallaxBackground();
        bg.addLayer(new ParallaxLayer("fg.png", 0.8));
        bg.addLayer(new ParallaxLayer("bg.png", 0.2));

        expect(bg.layers[0].scrollFactor).toBe(0.2);
        expect(bg.layers[1].scrollFactor).toBe(0.8);
    });
});

// ============================================
// Camera Tests
// ============================================
describe('Camera', () => {
    let camera;

    beforeEach(() => {
        camera = new Camera(800, 600);
    });

    it('creates camera with viewport size', () => {
        expect(camera.viewWidth).toBe(800);
        expect(camera.viewHeight).toBe(600);
    });

    it('setBounds limits camera position', () => {
        camera.setBounds(0, 0, 1600, 1200);
        camera.position.x = -100;
        camera.position.y = -100;
        camera.update(0.016);

        expect(camera.position.x).toBe(0);
        expect(camera.position.y).toBe(0);
    });

    it('shake modifies offset', () => {
        camera.shake(10, 0.5);
        camera.update(0.016);

        // Shake offset should be non-zero
        expect(camera.shakeDuration).toBeLessThan(0.5);
    });

    it('screenToWorld converts correctly', () => {
        camera.position.x = 100;
        camera.position.y = 50;
        const world = camera.screenToWorld(0, 0);
        expect(world.x).toBe(100);
        expect(world.y).toBe(50);
    });

    it('worldToScreen converts correctly', () => {
        camera.position.x = 100;
        camera.position.y = 50;
        const screen = camera.worldToScreen(100, 50);
        expect(screen.x).toBe(0);
        expect(screen.y).toBe(0);
    });
});
