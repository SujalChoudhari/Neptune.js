/**
 * Tests for StateManager
 */

// Simple test framework
const describe = (name, fn) => {
    console.log(`\n📦 ${name}`);
    fn();
};

const test = (name, fn) => {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.error(`  ✗ ${name}`);
        console.error(`    ${error.message}`);
    }
};

const expect = (value) => ({
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
    toBeTruthy: () => {
        if (!value) {
            throw new Error(`Expected truthy value but got ${value}`);
        }
    },
    toBeFalsy: () => {
        if (value) {
            throw new Error(`Expected falsy value but got ${value}`);
        }
    },
    toBeNull: () => {
        if (value !== null) {
            throw new Error(`Expected null but got ${value}`);
        }
    },
    toBeUndefined: () => {
        if (value !== undefined) {
            throw new Error(`Expected undefined but got ${value}`);
        }
    }
});

// Mock StateManager
class StateManager {
    constructor() {
        this.state = {
            project: null,
            currentScene: null,
            selectedEntities: [],
            tool: 'select',
            layers: [],
            activeLayer: null,
            zoom: 1,
            pan: { x: 0, y: 0 }
        };
        this.subscribers = new Map();
    }

    get(path) {
        if (!path) return this.state;

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }

        return value;
    }

    set(path, value) {
        if (!path) {
            throw new Error('Path is required');
        }

        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        for (const key of keys) {
            if (target[key] === undefined) {
                target[key] = {};
            }
            target = target[key];
        }

        const oldValue = target[lastKey];
        target[lastKey] = value;
        this.notify(path, value, oldValue);
    }

    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);

        return () => {
            const subs = this.subscribers.get(path);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }

    notify(path, newValue, oldValue) {
        const exactSubs = this.subscribers.get(path);
        if (exactSubs) {
            exactSubs.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in state subscriber for "${path}":`, error);
                }
            });
        }

        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            const parentSubs = this.subscribers.get(parentPath);
            if (parentSubs) {
                const parentValue = this.get(parentPath);
                parentSubs.forEach(callback => {
                    try {
                        callback(parentValue, null);
                    } catch (error) {
                        console.error(`Error in state subscriber for "${parentPath}":`, error);
                    }
                });
            }
        }

        const rootSubs = this.subscribers.get('*');
        if (rootSubs) {
            rootSubs.forEach(callback => {
                try {
                    callback({ path, newValue, oldValue });
                } catch (error) {
                    console.error('Error in root state subscriber:', error);
                }
            });
        }
    }

    batch(updates) {
        for (const [path, value] of Object.entries(updates)) {
            this.set(path, value);
        }
    }

    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    reset() {
        this.state = {
            project: null,
            currentScene: null,
            selectedEntities: [],
            tool: 'select',
            layers: [],
            activeLayer: null,
            zoom: 1,
            pan: { x: 0, y: 0 }
        };
        this.notify('*', this.state, null);
    }
}

// Tests
describe('StateManager', () => {
    test('should get simple values', () => {
        const state = new StateManager();

        expect(state.get('tool')).toBe('select');
        expect(state.get('zoom')).toBe(1);
    });

    test('should get nested values with dot notation', () => {
        const state = new StateManager();

        expect(state.get('pan.x')).toBe(0);
        expect(state.get('pan.y')).toBe(0);
    });

    test('should set simple values', () => {
        const state = new StateManager();

        state.set('tool', 'move');

        expect(state.get('tool')).toBe('move');
    });

    test('should set nested values', () => {
        const state = new StateManager();

        state.set('pan.x', 100);

        expect(state.get('pan.x')).toBe(100);
        expect(state.get('pan.y')).toBe(0);
    });

    test('should create nested paths automatically', () => {
        const state = new StateManager();

        state.set('project.name', 'Test Project');

        expect(state.get('project.name')).toBe('Test Project');
    });

    test('should notify subscribers on change', () => {
        const state = new StateManager();
        let received = null;

        state.subscribe('tool', (newVal, oldVal) => {
            received = { newVal, oldVal };
        });

        state.set('tool', 'brush');

        expect(received.newVal).toBe('brush');
        expect(received.oldVal).toBe('select');
    });

    test('should allow unsubscribe', () => {
        const state = new StateManager();
        let count = 0;

        const unsub = state.subscribe('tool', () => count++);

        state.set('tool', 'move');
        expect(count).toBe(1);

        unsub();

        state.set('tool', 'brush');
        expect(count).toBe(1);
    });

    test('should notify parent path subscribers', () => {
        const state = new StateManager();
        let received = null;

        state.subscribe('pan', (newVal) => {
            received = newVal;
        });

        state.set('pan.x', 50);

        expect(received.x).toBe(50);
        expect(received.y).toBe(0);
    });

    test('should handle batch updates', () => {
        const state = new StateManager();

        state.batch({
            'tool': 'eraser',
            'zoom': 2,
            'pan.x': 25
        });

        expect(state.get('tool')).toBe('eraser');
        expect(state.get('zoom')).toBe(2);
        expect(state.get('pan.x')).toBe(25);
    });

    test('should return snapshot copy', () => {
        const state = new StateManager();

        const snapshot = state.getSnapshot();
        snapshot.tool = 'modified';

        expect(state.get('tool')).toBe('select');
    });

    test('should reset to initial state', () => {
        const state = new StateManager();

        state.set('tool', 'brush');
        state.set('zoom', 3);

        state.reset();

        expect(state.get('tool')).toBe('select');
        expect(state.get('zoom')).toBe(1);
    });

    test('should return undefined for missing paths', () => {
        const state = new StateManager();

        expect(state.get('nonexistent')).toBeUndefined();
        expect(state.get('deep.nested.path')).toBeUndefined();
    });

    test('should return entire state when no path provided', () => {
        const state = new StateManager();

        const all = state.get();

        expect(all.tool).toBe('select');
        expect(all.zoom).toBe(1);
    });
});

console.log('\n✅ StateManager tests complete');
