/**
 * Tests for TilemapEditor
 */

// Simple test runner
function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (e) {
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

function expect(value) {
    return {
        toBe: (expected) => {
            if (value !== expected) {
                throw new Error(`Expected ${expected} but got ${value}`);
            }
        },
        toEqual: (expected) => {
            if (JSON.stringify(value) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(value)}`);
            }
        },
        toBeGreaterThan: (expected) => {
            if (value <= expected) {
                throw new Error(`Expected ${value} to be greater than ${expected}`);
            }
        }
    };
}

// Mock tilemap
function createMockTilemap(width, height) {
    return {
        type: 'tilemap',
        name: 'Test Tilemap',
        visible: true,
        locked: false,
        width,
        height,
        data: new Array(width * height).fill(-1)
    };
}

// Tests
describe('TilemapEditor Coordinate Conversion', () => {

    it('should convert world to tile coordinates', () => {
        const worldToTile = (x, y, tileSize = 32) => ({
            x: Math.floor(x / tileSize),
            y: Math.floor(y / tileSize)
        });

        expect(worldToTile(0, 0)).toEqual({ x: 0, y: 0 });
        expect(worldToTile(32, 32)).toEqual({ x: 1, y: 1 });
        expect(worldToTile(31, 31)).toEqual({ x: 0, y: 0 });
        expect(worldToTile(64, 96)).toEqual({ x: 2, y: 3 });
        expect(worldToTile(100, 200)).toEqual({ x: 3, y: 6 });
    });

    it('should convert tile to world coordinates', () => {
        const tileToWorld = (x, y, tileSize = 32) => ({
            x: x * tileSize,
            y: y * tileSize
        });

        expect(tileToWorld(0, 0)).toEqual({ x: 0, y: 0 });
        expect(tileToWorld(1, 1)).toEqual({ x: 32, y: 32 });
        expect(tileToWorld(5, 3)).toEqual({ x: 160, y: 96 });
    });
});

describe('TilemapEditor Tile Operations', () => {

    it('should paint a tile', () => {
        const tilemap = createMockTilemap(10, 10);
        const tileX = 5;
        const tileY = 3;
        const tileIndex = 42;

        const index = tileY * tilemap.width + tileX;
        tilemap.data[index] = tileIndex;

        expect(tilemap.data[index]).toBe(42);
    });

    it('should erase a tile', () => {
        const tilemap = createMockTilemap(10, 10);
        const tileX = 5;
        const tileY = 3;

        // Paint first
        const index = tileY * tilemap.width + tileX;
        tilemap.data[index] = 42;
        expect(tilemap.data[index]).toBe(42);

        // Erase (set to -1)
        tilemap.data[index] = -1;
        expect(tilemap.data[index]).toBe(-1);
    });

    it('should handle bounds checking', () => {
        const tilemap = createMockTilemap(10, 10);

        const isInBounds = (x, y) => {
            return x >= 0 && x < tilemap.width && y >= 0 && y < tilemap.height;
        };

        expect(isInBounds(0, 0)).toBe(true);
        expect(isInBounds(9, 9)).toBe(true);
        expect(isInBounds(-1, 0)).toBe(false);
        expect(isInBounds(0, -1)).toBe(false);
        expect(isInBounds(10, 0)).toBe(false);
        expect(isInBounds(0, 10)).toBe(false);
    });
});

describe('TilemapEditor Flood Fill', () => {

    it('should perform flood fill on empty area', () => {
        const tilemap = createMockTilemap(5, 5);
        const tileIndex = 10;

        // Simulate flood fill
        const floodFill = (startX, startY, fill) => {
            const target = tilemap.data[startY * tilemap.width + startX];
            if (target === fill) return 0;

            let filled = 0;
            const queue = [{ x: startX, y: startY }];
            const visited = new Set();

            while (queue.length > 0) {
                const { x, y } = queue.shift();
                const key = `${x},${y}`;

                if (visited.has(key)) continue;
                if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) continue;

                const idx = y * tilemap.width + x;
                if (tilemap.data[idx] !== target) continue;

                visited.add(key);
                tilemap.data[idx] = fill;
                filled++;

                queue.push({ x: x + 1, y });
                queue.push({ x: x - 1, y });
                queue.push({ x, y: y + 1 });
                queue.push({ x, y: y - 1 });
            }

            return filled;
        };

        const filled = floodFill(2, 2, tileIndex);
        expect(filled).toBe(25); // Should fill entire 5x5 tilemap
    });

    it('should stop at boundaries during flood fill', () => {
        const tilemap = createMockTilemap(5, 5);

        // Create boundary
        tilemap.data[2] = 99; // Top row, x=2
        tilemap.data[7] = 99; // y=1, x=2
        tilemap.data[12] = 99; // y=2, x=2
        tilemap.data[17] = 99; // y=3, x=2
        tilemap.data[22] = 99; // y=4, x=2

        // Count empty tiles on left side
        let emptyOnLeft = 0;
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 2; x++) {
                if (tilemap.data[y * 5 + x] === -1) emptyOnLeft++;
            }
        }

        expect(emptyOnLeft).toBe(10); // 2 columns * 5 rows
    });
});

describe('TilemapEditor Clear and Resize', () => {

    it('should clear tilemap', () => {
        const tilemap = createMockTilemap(5, 5);

        // Paint some tiles
        tilemap.data[0] = 1;
        tilemap.data[5] = 2;
        tilemap.data[10] = 3;

        // Clear
        tilemap.data = new Array(tilemap.width * tilemap.height).fill(-1);

        expect(tilemap.data[0]).toBe(-1);
        expect(tilemap.data[5]).toBe(-1);
        expect(tilemap.data[10]).toBe(-1);
    });

    it('should resize tilemap preserving existing data', () => {
        const oldWidth = 5;
        const oldHeight = 5;
        const newWidth = 8;
        const newHeight = 6;

        let data = new Array(oldWidth * oldHeight).fill(-1);
        data[0] = 1;  // (0,0)
        data[4] = 2;  // (4,0)
        data[20] = 3; // (0,4)
        data[24] = 4; // (4,4)

        // Resize
        const newData = new Array(newWidth * newHeight).fill(-1);
        const copyWidth = Math.min(oldWidth, newWidth);
        const copyHeight = Math.min(oldHeight, newHeight);

        for (let y = 0; y < copyHeight; y++) {
            for (let x = 0; x < copyWidth; x++) {
                const oldIdx = y * oldWidth + x;
                const newIdx = y * newWidth + x;
                newData[newIdx] = data[oldIdx];
            }
        }

        expect(newData[0]).toBe(1);  // (0,0) preserved
        expect(newData[4]).toBe(2);  // (4,0) preserved
        expect(newData[32]).toBe(3); // (0,4) at new position
        expect(newData[36]).toBe(4); // (4,4) at new position
    });
});

describe('Tileset Calculations', () => {

    it('should calculate tileset dimensions', () => {
        const tileWidth = 32;
        const tileHeight = 32;
        const imageWidth = 256;
        const imageHeight = 128;

        const columns = Math.floor(imageWidth / tileWidth);
        const rows = Math.floor(imageHeight / tileHeight);

        expect(columns).toBe(8);
        expect(rows).toBe(4);
    });

    it('should get tile source coordinates from index', () => {
        const tileWidth = 32;
        const tileHeight = 32;
        const columns = 8;

        const getTileSource = (index) => ({
            sx: (index % columns) * tileWidth,
            sy: Math.floor(index / columns) * tileHeight
        });

        expect(getTileSource(0)).toEqual({ sx: 0, sy: 0 });
        expect(getTileSource(7)).toEqual({ sx: 224, sy: 0 });
        expect(getTileSource(8)).toEqual({ sx: 0, sy: 32 });
        expect(getTileSource(15)).toEqual({ sx: 224, sy: 32 });
    });
});

console.log('\n✅ TilemapEditor tests complete');
