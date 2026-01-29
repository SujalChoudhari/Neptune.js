/**
 * Triton Editor - History Manager
 * Undo/Redo system using Command pattern
 */

/**
 * Base Command class
 * All commands must implement execute() and undo()
 */
export class Command {
    /**
     * Execute the command
     */
    execute() {
        throw new Error('Command.execute() must be implemented');
    }

    /**
     * Undo the command
     */
    undo() {
        throw new Error('Command.undo() must be implemented');
    }

    /**
     * Get command description for UI
     * @returns {string}
     */
    get description() {
        return 'Unknown Action';
    }
}

/**
 * HistoryManager class for undo/redo stack
 */
export class HistoryManager {
    /**
     * @param {number} maxSize - Maximum history size
     */
    constructor(maxSize = 100) {
        /** @type {Command[]} */
        this.undoStack = [];
        /** @type {Command[]} */
        this.redoStack = [];
        this.maxSize = maxSize;
        this.onChange = null;
    }

    /**
     * Execute a command and add to history
     * @param {Command} command - Command to execute
     */
    execute(command) {
        command.execute();
        this.undoStack.push(command);

        // Clear redo stack on new action
        this.redoStack = [];

        // Limit history size
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }

        this.notifyChange();
    }

    /**
     * Undo the last command
     * @returns {boolean} True if undo was performed
     */
    undo() {
        if (!this.canUndo) {
            return false;
        }

        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);

        this.notifyChange();
        return true;
    }

    /**
     * Redo the last undone command
     * @returns {boolean} True if redo was performed
     */
    redo() {
        if (!this.canRedo) {
            return false;
        }

        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);

        this.notifyChange();
        return true;
    }

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    get canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    get canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Get description of next undo action
     * @returns {string|null}
     */
    get undoDescription() {
        if (!this.canUndo) return null;
        return this.undoStack[this.undoStack.length - 1].description;
    }

    /**
     * Get description of next redo action
     * @returns {string|null}
     */
    get redoDescription() {
        if (!this.canRedo) return null;
        return this.redoStack[this.redoStack.length - 1].description;
    }

    /**
     * Clear all history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.notifyChange();
    }

    /**
     * Notify change callback
     */
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

// ============================================
// Common Commands
// ============================================

/**
 * Command to set a property value
 */
export class SetPropertyCommand extends Command {
    constructor(target, property, newValue, oldValue) {
        super();
        this.target = target;
        this.property = property;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }

    execute() {
        this.target[this.property] = this.newValue;
    }

    undo() {
        this.target[this.property] = this.oldValue;
    }

    get description() {
        return `Set ${this.property}`;
    }
}

/**
 * Command to move an entity
 */
export class MoveEntityCommand extends Command {
    constructor(entity, newPosition, oldPosition) {
        super();
        this.entity = entity;
        this.newPosition = { ...newPosition };
        this.oldPosition = { ...oldPosition };
    }

    execute() {
        if (this.entity.transform) {
            this.entity.transform.position = { ...this.newPosition };
        }
    }

    undo() {
        if (this.entity.transform) {
            this.entity.transform.position = { ...this.oldPosition };
        }
    }

    get description() {
        return `Move ${this.entity.name || 'Entity'}`;
    }
}

/**
 * Command to add an entity
 */
export class AddEntityCommand extends Command {
    constructor(parent, entity) {
        super();
        this.parent = parent;
        this.entity = entity;
    }

    execute() {
        this.parent.addChild(this.entity);
    }

    undo() {
        this.parent.removeChild(this.entity);
    }

    get description() {
        return `Add ${this.entity.name || 'Entity'}`;
    }
}

/**
 * Command to remove an entity
 */
export class RemoveEntityCommand extends Command {
    constructor(parent, entity) {
        super();
        this.parent = parent;
        this.entity = entity;
        this.index = parent.children?.indexOf(entity) ?? -1;
    }

    execute() {
        this.parent.removeChild(this.entity);
    }

    undo() {
        this.parent.addChild(this.entity, this.index);
    }

    get description() {
        return `Remove ${this.entity.name || 'Entity'}`;
    }
}

/**
 * Command to set a tile
 */
export class SetTileCommand extends Command {
    constructor(tilemap, x, y, newTile, oldTile) {
        super();
        this.tilemap = tilemap;
        this.x = x;
        this.y = y;
        this.newTile = newTile;
        this.oldTile = oldTile;
    }

    execute() {
        this.tilemap.setTile(this.x, this.y, this.newTile);
    }

    undo() {
        this.tilemap.setTile(this.x, this.y, this.oldTile);
    }

    get description() {
        return 'Paint Tile';
    }
}

/**
 * Batch command for multiple operations
 */
export class BatchCommand extends Command {
    constructor(commands, description = 'Batch Action') {
        super();
        this.commands = commands;
        this._description = description;
    }

    execute() {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo() {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }

    get description() {
        return this._description;
    }
}
