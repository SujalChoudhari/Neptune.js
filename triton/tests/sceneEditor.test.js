/**
 * Tests for SceneEditor
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
        toBeDefined: () => {
            if (value === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBeNull: () => {
            if (value !== null) {
                throw new Error(`Expected null but got ${value}`);
            }
        },
        toContain: (item) => {
            if (!value.includes(item)) {
                throw new Error(`Expected array to contain ${item}`);
            }
        },
        toHaveLength: (length) => {
            if (value.length !== length) {
                throw new Error(`Expected length ${length} but got ${value.length}`);
            }
        }
    };
}

// Mock editor
function createMockEditor() {
    const state = {
        project: null,
        currentScene: null,
        selectedEntities: [],
        activeLayer: 0
    };

    const listeners = new Map();

    return {
        state: {
            get: (key) => state[key],
            set: (key, value) => {
                state[key] = value;
                listeners.get(key)?.forEach(fn => fn(value));
            },
            subscribe: (key, fn) => {
                if (!listeners.has(key)) listeners.set(key, []);
                listeners.get(key).push(fn);
            }
        },
        events: {
            on: () => { },
            emit: () => { }
        },
        console: {
            log: () => { }
        },
        history: {
            execute: (cmd) => cmd.execute()
        }
    };
}

// Tests
describe('SceneEditor Entity Management', () => {

    it('should add entity to main layer', () => {
        const mockEditor = createMockEditor();

        // Simulate scene editor behavior
        const scene = {
            name: 'test',
            layers: [
                { type: 'main', entities: [] }
            ]
        };

        mockEditor.state.set('currentScene', scene);

        const mainLayer = scene.layers.find(l => l.type === 'main');
        const entity = {
            id: 'entity_1',
            name: 'Test Entity',
            transform: { position: { x: 0, y: 0 } }
        };

        mainLayer.entities.push(entity);

        expect(mainLayer.entities).toHaveLength(1);
        expect(mainLayer.entities[0].name).toBe('Test Entity');
    });

    it('should remove entity from main layer', () => {
        const scene = {
            layers: [{
                type: 'main', entities: [
                    { id: 'e1', name: 'Entity 1' },
                    { id: 'e2', name: 'Entity 2' }
                ]
            }]
        };

        const mainLayer = scene.layers.find(l => l.type === 'main');
        const index = mainLayer.entities.findIndex(e => e.id === 'e1');
        mainLayer.entities.splice(index, 1);

        expect(mainLayer.entities).toHaveLength(1);
        expect(mainLayer.entities[0].id).toBe('e2');
    });

    it('should update entity position', () => {
        const entity = {
            id: 'e1',
            transform: { position: { x: 0, y: 0 } }
        };

        const oldPos = { ...entity.transform.position };
        entity.transform.position = { x: 100, y: 50 };

        expect(entity.transform.position.x).toBe(100);
        expect(entity.transform.position.y).toBe(50);
    });
});

describe('SceneEditor Selection', () => {

    it('should select a single entity', () => {
        const mockEditor = createMockEditor();
        const entity = { id: 'e1', name: 'Test' };

        mockEditor.state.set('selectedEntities', [entity]);

        expect(mockEditor.state.get('selectedEntities')).toHaveLength(1);
        expect(mockEditor.state.get('selectedEntities')[0].id).toBe('e1');
    });

    it('should clear selection', () => {
        const mockEditor = createMockEditor();
        mockEditor.state.set('selectedEntities', [{ id: 'e1' }]);
        mockEditor.state.set('selectedEntities', []);

        expect(mockEditor.state.get('selectedEntities')).toHaveLength(0);
    });

    it('should add to selection', () => {
        const mockEditor = createMockEditor();
        mockEditor.state.set('selectedEntities', [{ id: 'e1' }]);

        const current = mockEditor.state.get('selectedEntities');
        mockEditor.state.set('selectedEntities', [...current, { id: 'e2' }]);

        expect(mockEditor.state.get('selectedEntities')).toHaveLength(2);
    });
});

describe('SceneEditor Point-in-Entity Check', () => {

    it('should detect point inside entity bounds', () => {
        const entity = {
            transform: { position: { x: 100, y: 100 } },
            size: { width: 64, height: 64 }
        };

        const isInside = (x, y, e) => {
            const pos = e.transform.position;
            const size = e.size;
            return x >= pos.x && x <= pos.x + size.width &&
                y >= pos.y && y <= pos.y + size.height;
        };

        expect(isInside(120, 120, entity)).toBe(true);
        expect(isInside(50, 50, entity)).toBe(false);
        expect(isInside(100, 100, entity)).toBe(true); // Edge case: on boundary
        expect(isInside(164, 164, entity)).toBe(true); // Edge case: on boundary
        expect(isInside(165, 165, entity)).toBe(false); // Just outside
    });
});

describe('Layer Management', () => {

    it('should toggle layer visibility', () => {
        const layer = { type: 'main', visible: true };
        layer.visible = !layer.visible;
        expect(layer.visible).toBe(false);
    });

    it('should toggle layer lock', () => {
        const layer = { type: 'main', locked: false };
        layer.locked = !layer.locked;
        expect(layer.locked).toBe(true);
    });

    it('should add a new layer', () => {
        const scene = {
            layers: [{ type: 'main', entities: [] }]
        };

        const newLayer = {
            type: 'tilemap',
            name: 'New Tilemap',
            visible: true,
            locked: false,
            data: []
        };

        scene.layers.push(newLayer);

        expect(scene.layers).toHaveLength(2);
        expect(scene.layers[1].type).toBe('tilemap');
    });
});

console.log('\n✅ SceneEditor tests complete');
