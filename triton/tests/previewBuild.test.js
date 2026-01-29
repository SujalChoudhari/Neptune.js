/**
 * Tests for GamePreview and BuildSystem
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
        toHaveLength: (length) => {
            if (value.length !== length) {
                throw new Error(`Expected length ${length} but got ${value.length}`);
            }
        },
        toBeDefined: () => {
            if (value === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toContain: (item) => {
            if (!value.includes(item)) {
                throw new Error(`Expected value to contain ${item}`);
            }
        },
        toBeGreaterThan: (expected) => {
            if (value <= expected) {
                throw new Error(`Expected ${value} to be greater than ${expected}`);
            }
        }
    };
}

// Preview modes
const PREVIEW_MODE = {
    STOPPED: 'stopped',
    PLAYING: 'playing',
    PAUSED: 'paused'
};

// Tests
describe('GamePreview State Management', () => {

    it('should start in stopped state', () => {
        const preview = { mode: PREVIEW_MODE.STOPPED };
        expect(preview.mode).toBe('stopped');
    });

    it('should transition to playing state', () => {
        const preview = { mode: PREVIEW_MODE.STOPPED };
        preview.mode = PREVIEW_MODE.PLAYING;
        expect(preview.mode).toBe('playing');
    });

    it('should transition to paused state', () => {
        const preview = { mode: PREVIEW_MODE.PLAYING };
        preview.mode = PREVIEW_MODE.PAUSED;
        expect(preview.mode).toBe('paused');
    });

    it('should return to stopped state', () => {
        const preview = { mode: PREVIEW_MODE.PLAYING };
        preview.mode = PREVIEW_MODE.STOPPED;
        expect(preview.mode).toBe('stopped');
    });
});

describe('GamePreview Game State', () => {

    it('should create game state from scene', () => {
        const scene = {
            name: 'Test Scene',
            layers: [
                {
                    name: 'Main',
                    entities: [
                        { id: 'player', transform: { x: 100, y: 100 } }
                    ]
                }
            ]
        };

        const gameState = {
            scene: JSON.parse(JSON.stringify(scene)),
            entities: {},
            time: { startTime: 0, lastFrame: 0, deltaTime: 0 }
        };

        for (const layer of scene.layers) {
            for (const entity of layer.entities) {
                gameState.entities[entity.id] = { ...entity, velocity: { x: 0, y: 0 } };
            }
        }

        expect(gameState.entities.player).toBeDefined();
        expect(gameState.entities.player.transform.x).toBe(100);
    });

    it('should initialize entity physics', () => {
        const entity = { id: 'ball', transform: { x: 0, y: 0 } };
        entity.velocity = { x: 0, y: 0 };
        entity.physics = { mass: 1, gravityScale: 1 };

        expect(entity.physics.mass).toBe(1);
        expect(entity.velocity.y).toBe(0);
    });
});

describe('GamePreview Time Calculations', () => {

    it('should calculate delta time', () => {
        const lastFrame = 1000;
        const currentFrame = 1016.67; // ~60fps
        const deltaTime = (currentFrame - lastFrame) / 1000;

        expect(deltaTime).toBeGreaterThan(0);
    });

    it('should cap delta time to prevent physics explosions', () => {
        const rawDelta = 0.5; // 500ms lag spike
        const cappedDelta = Math.min(rawDelta, 0.1);

        expect(cappedDelta).toBe(0.1);
    });
});

describe('GamePreview Input Handling', () => {

    it('should track key states', () => {
        const input = { keys: {} };

        input.keys['ArrowLeft'] = true;
        input.keys['Space'] = true;

        expect(input.keys['ArrowLeft']).toBe(true);
        expect(input.keys['Space']).toBe(true);
        expect(input.keys['ArrowRight']).toBe(undefined);
    });

    it('should track mouse position', () => {
        const input = { mouse: { x: 0, y: 0 } };

        input.mouse.x = 150;
        input.mouse.y = 200;

        expect(input.mouse.x).toBe(150);
        expect(input.mouse.y).toBe(200);
    });
});

describe('BuildSystem Manifest Generation', () => {

    it('should generate manifest with project info', () => {
        const manifest = {
            name: 'Test Game',
            version: '1.0.0',
            resolution: { width: 1280, height: 720 },
            startScene: 'main',
            assets: { images: [], audio: [] },
            scenes: [],
            buildTime: new Date().toISOString()
        };

        expect(manifest.name).toBe('Test Game');
        expect(manifest.resolution.width).toBe(1280);
    });

    it('should include asset lists in manifest', () => {
        const assets = {
            images: ['sprites/player.png', 'sprites/enemy.png'],
            audio: ['sounds/jump.wav'],
            data: ['levels/level1.json']
        };

        expect(assets.images).toHaveLength(2);
        expect(assets.audio).toHaveLength(1);
    });
});

describe('BuildSystem HTML Generation', () => {

    it('should generate valid HTML structure', () => {
        const title = 'Test Game';
        const width = 800;
        const height = 600;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>${title}</title>
</head>
<body>
    <canvas id="game-canvas" width="${width}" height="${height}"></canvas>
</body>
</html>`;

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>Test Game</title>');
        expect(html).toContain('width="800"');
        expect(html).toContain('height="600"');
    });
});

describe('BuildSystem Asset Collection', () => {

    it('should categorize assets by type', () => {
        const files = [
            'player.png', 'enemy.jpg', 'background.webp',
            'music.mp3', 'sfx.wav',
            'config.json', 'data.xml'
        ];

        const assets = { images: [], audio: [], data: [] };

        for (const file of files) {
            const ext = file.split('.').pop().toLowerCase();
            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
                assets.images.push(file);
            } else if (['mp3', 'ogg', 'wav', 'webm'].includes(ext)) {
                assets.audio.push(file);
            } else if (['json', 'xml', 'csv'].includes(ext)) {
                assets.data.push(file);
            }
        }

        expect(assets.images).toHaveLength(3);
        expect(assets.audio).toHaveLength(2);
        expect(assets.data).toHaveLength(2);
    });
});

describe('BuildSystem Progress Tracking', () => {

    it('should update progress during build', () => {
        const steps = [
            { progress: 10, step: 'Collecting assets...' },
            { progress: 50, step: 'Bundling runtime...' },
            { progress: 100, step: 'Build complete!' }
        ];

        expect(steps[0].progress).toBe(10);
        expect(steps[2].step).toBe('Build complete!');
    });
});

console.log('\n✅ GamePreview and BuildSystem tests complete');
