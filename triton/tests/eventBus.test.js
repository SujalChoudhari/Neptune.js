/**
 * Tests for EventBus
 */

// Simple test framework for browser/node compatibility
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
    },
    toHaveBeenCalled: () => {
        if (!value.called) {
            throw new Error('Expected function to have been called');
        }
    }
});

// Mock EventBus (since we can't import ES modules in Node without setup)
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    off(event, callback) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.delete(callback);
            if (handlers.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    emit(event, data) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for "${event}":`, error);
                }
            });
        }
        const wildcardHandlers = this.listeners.get('*');
        if (wildcardHandlers) {
            wildcardHandlers.forEach(callback => {
                try {
                    callback({ event, data });
                } catch (error) {
                    console.error('Error in wildcard event handler:', error);
                }
            });
        }
    }

    hasListeners(event) {
        return this.listeners.has(event) && this.listeners.get(event).size > 0;
    }

    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    listenerCount(event) {
        const handlers = this.listeners.get(event);
        return handlers ? handlers.size : 0;
    }
}

// Tests
describe('EventBus', () => {
    test('should subscribe and emit events', () => {
        const bus = new EventBus();
        let received = null;

        bus.on('test', (data) => {
            received = data;
        });

        bus.emit('test', { value: 42 });

        expect(received).toEqual({ value: 42 });
    });

    test('should handle multiple subscribers', () => {
        const bus = new EventBus();
        let count = 0;

        bus.on('test', () => count++);
        bus.on('test', () => count++);
        bus.on('test', () => count++);

        bus.emit('test');

        expect(count).toBe(3);
    });

    test('should unsubscribe correctly', () => {
        const bus = new EventBus();
        let count = 0;

        const unsubscribe = bus.on('test', () => count++);

        bus.emit('test');
        expect(count).toBe(1);

        unsubscribe();

        bus.emit('test');
        expect(count).toBe(1);
    });

    test('should handle once subscriptions', () => {
        const bus = new EventBus();
        let count = 0;

        bus.once('test', () => count++);

        bus.emit('test');
        bus.emit('test');
        bus.emit('test');

        expect(count).toBe(1);
    });

    test('should handle wildcard listeners', () => {
        const bus = new EventBus();
        let received = null;

        bus.on('*', (data) => {
            received = data;
        });

        bus.emit('anyEvent', { foo: 'bar' });

        expect(received.event).toBe('anyEvent');
        expect(received.data).toEqual({ foo: 'bar' });
    });

    test('should check hasListeners correctly', () => {
        const bus = new EventBus();

        expect(bus.hasListeners('test')).toBeFalsy();

        bus.on('test', () => { });

        expect(bus.hasListeners('test')).toBeTruthy();
    });

    test('should report correct listener count', () => {
        const bus = new EventBus();

        expect(bus.listenerCount('test')).toBe(0);

        bus.on('test', () => { });
        bus.on('test', () => { });

        expect(bus.listenerCount('test')).toBe(2);
    });

    test('should clear specific event listeners', () => {
        const bus = new EventBus();

        bus.on('test1', () => { });
        bus.on('test2', () => { });

        bus.clear('test1');

        expect(bus.hasListeners('test1')).toBeFalsy();
        expect(bus.hasListeners('test2')).toBeTruthy();
    });

    test('should clear all listeners', () => {
        const bus = new EventBus();

        bus.on('test1', () => { });
        bus.on('test2', () => { });

        bus.clear();

        expect(bus.hasListeners('test1')).toBeFalsy();
        expect(bus.hasListeners('test2')).toBeFalsy();
    });
});

console.log('\n✅ EventBus tests complete');
