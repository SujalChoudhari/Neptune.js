/**
 * Tests for HistoryManager (Undo/Redo)
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
    }
});

// Mock Command and HistoryManager
class Command {
    execute() {
        throw new Error('Command.execute() must be implemented');
    }
    undo() {
        throw new Error('Command.undo() must be implemented');
    }
    get description() {
        return 'Unknown Action';
    }
}

class HistoryManager {
    constructor(maxSize = 100) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = maxSize;
        this.onChange = null;
    }

    execute(command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = [];
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        this.notifyChange();
    }

    undo() {
        if (!this.canUndo) return false;
        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
        this.notifyChange();
        return true;
    }

    redo() {
        if (!this.canRedo) return false;
        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
        this.notifyChange();
        return true;
    }

    get canUndo() {
        return this.undoStack.length > 0;
    }

    get canRedo() {
        return this.redoStack.length > 0;
    }

    get undoDescription() {
        if (!this.canUndo) return null;
        return this.undoStack[this.undoStack.length - 1].description;
    }

    get redoDescription() {
        if (!this.canRedo) return null;
        return this.redoStack[this.redoStack.length - 1].description;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.notifyChange();
    }

    notifyChange() {
        if (this.onChange) {
            this.onChange({
                canUndo: this.canUndo,
                canRedo: this.canRedo,
                undoDescription: this.undoDescription,
                redoDescription: this.redoDescription
            });
        }
    }
}

// Test command
class SetValueCommand extends Command {
    constructor(target, prop, value) {
        super();
        this.target = target;
        this.prop = prop;
        this.newValue = value;
        this.oldValue = target[prop];
        this._description = `Set ${prop}`;
    }

    execute() {
        this.target[this.prop] = this.newValue;
    }

    undo() {
        this.target[this.prop] = this.oldValue;
    }

    get description() {
        return this._description;
    }
}

// Tests
describe('HistoryManager', () => {
    test('should execute commands', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 10));

        expect(obj.value).toBe(10);
    });

    test('should undo commands', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 10));
        expect(obj.value).toBe(10);

        history.undo();
        expect(obj.value).toBe(0);
    });

    test('should redo commands', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 10));
        history.undo();
        expect(obj.value).toBe(0);

        history.redo();
        expect(obj.value).toBe(10);
    });

    test('should clear redo stack on new command', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 10));
        history.undo();
        expect(history.canRedo).toBeTruthy();

        history.execute(new SetValueCommand(obj, 'value', 20));
        expect(history.canRedo).toBeFalsy();
    });

    test('should report canUndo correctly', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        expect(history.canUndo).toBeFalsy();

        history.execute(new SetValueCommand(obj, 'value', 10));
        expect(history.canUndo).toBeTruthy();

        history.undo();
        expect(history.canUndo).toBeFalsy();
    });

    test('should report canRedo correctly', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        expect(history.canRedo).toBeFalsy();

        history.execute(new SetValueCommand(obj, 'value', 10));
        expect(history.canRedo).toBeFalsy();

        history.undo();
        expect(history.canRedo).toBeTruthy();
    });

    test('should limit history size', () => {
        const history = new HistoryManager(3);
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 1));
        history.execute(new SetValueCommand(obj, 'value', 2));
        history.execute(new SetValueCommand(obj, 'value', 3));
        history.execute(new SetValueCommand(obj, 'value', 4));

        expect(history.undoStack.length).toBe(3);

        // First command should be dropped
        history.undo(); // 4 -> 3
        history.undo(); // 3 -> 2
        history.undo(); // 2 -> 1
        expect(obj.value).toBe(1);

        // Cannot undo further (first command was dropped)
        expect(history.canUndo).toBeFalsy();
    });

    test('should return undo description', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 10));

        expect(history.undoDescription).toBe('Set value');
    });

    test('should return redo description', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 10));
        history.undo();

        expect(history.redoDescription).toBe('Set value');
    });

    test('should clear all history', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 10));
        history.undo();

        history.clear();

        expect(history.canUndo).toBeFalsy();
        expect(history.canRedo).toBeFalsy();
    });

    test('should notify onChange callback', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };
        let notified = false;

        history.onChange = () => {
            notified = true;
        };

        history.execute(new SetValueCommand(obj, 'value', 10));

        expect(notified).toBeTruthy();
    });

    test('should handle multiple undo/redo operations', () => {
        const history = new HistoryManager();
        const obj = { value: 0 };

        history.execute(new SetValueCommand(obj, 'value', 1));
        history.execute(new SetValueCommand(obj, 'value', 2));
        history.execute(new SetValueCommand(obj, 'value', 3));

        expect(obj.value).toBe(3);

        history.undo();
        expect(obj.value).toBe(2);

        history.undo();
        expect(obj.value).toBe(1);

        history.redo();
        expect(obj.value).toBe(2);

        history.redo();
        expect(obj.value).toBe(3);
    });
});

console.log('\n✅ HistoryManager tests complete');
