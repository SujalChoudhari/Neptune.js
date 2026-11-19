/** Small reversible command stack shared by Triton's scene editing surfaces. */
export function createEditHistory({ limit = 100, onChange = () => {} } = {}) {
    if (!Number.isInteger(limit) || limit < 1) throw new TypeError('History limit must be a positive integer');
    const undoStack = [];
    const redoStack = [];
    let transaction = null;
    const state = () => onChange({ canUndo: undoStack.length > 0 && transaction === null, canRedo: redoStack.length > 0 && transaction === null });

    const run = (label, apply, revert) => {
        if (typeof label !== 'string' || !label.trim() || typeof apply !== 'function' || typeof revert !== 'function') {
            throw new TypeError('An edit needs a label, apply function, and revert function');
        }
        try {
            if (apply() === false) return false;
        } catch (error) {
            try { revert(); } catch { /* Keep the original apply failure visible. */ }
            throw error;
        }
        const command = { label: label.trim(), apply, revert };
        if (transaction) transaction.commands.push(command);
        else {
            undoStack.push(command);
            if (undoStack.length > limit) undoStack.shift();
            redoStack.length = 0;
            state();
        }
        return true;
    };

    const undo = () => {
        if (transaction || !undoStack.length) return false;
        const command = undoStack.at(-1);
        if (command.revert() === false) return false;
        undoStack.pop();
        redoStack.push(command);
        state();
        return true;
    };
    const redo = () => {
        if (transaction || !redoStack.length) return false;
        const command = redoStack.at(-1);
        if (command.apply() === false) return false;
        redoStack.pop();
        undoStack.push(command);
        state();
        return true;
    };

    const begin = (label) => {
        if (typeof label !== 'string' || !label.trim()) throw new TypeError('An edit transaction needs a label');
        if (transaction) throw new Error('A scene edit transaction is already active');
        const current = { label: label.trim(), commands: [] };
        transaction = current;
        state();
        let closed = false;
        const finish = (commit) => {
            if (closed || transaction !== current) return false;
            closed = true;
            transaction = null;
            if (!commit) {
                const reverted = [];
                try {
                    for (let index = current.commands.length - 1; index >= 0; index -= 1) {
                        if (current.commands[index].revert() === false) throw new Error(`Could not cancel '${current.commands[index].label}'.`);
                        reverted.push(current.commands[index]);
                    }
                } catch (error) {
                    for (let index = reverted.length - 1; index >= 0; index -= 1) {
                        try { reverted[index].apply(); } catch { /* Preserve the rollback failure. */ }
                    }
                    transaction = current;
                    closed = false;
                    state();
                    throw error;
                }
                state();
                return true;
            }
            if (!current.commands.length) { state(); return false; }
            const commands = current.commands;
            undoStack.push({
                label: current.label,
                apply: () => {
                    const applied = [];
                    try {
                        for (const command of commands) {
                            if (command.apply() === false) throw new Error(`Could not redo '${command.label}'.`);
                            applied.push(command);
                        }
                    } catch (error) {
                        for (let index = applied.length - 1; index >= 0; index -= 1) {
                            try { applied[index].revert(); } catch { /* Preserve the apply failure. */ }
                        }
                        throw error;
                    }
                },
                revert: () => {
                    const reverted = [];
                    try {
                        for (let index = commands.length - 1; index >= 0; index -= 1) {
                            if (commands[index].revert() === false) throw new Error(`Could not undo '${commands[index].label}'.`);
                            reverted.push(commands[index]);
                        }
                    } catch (error) {
                        for (let index = reverted.length - 1; index >= 0; index -= 1) {
                            try { reverted[index].apply(); } catch { /* Preserve the revert failure. */ }
                        }
                        throw error;
                    }
                }
            });
            if (undoStack.length > limit) undoStack.shift();
            redoStack.length = 0;
            state();
            return true;
        };
        return { commit: () => finish(true), cancel: () => finish(false) };
    };

    return {
        run, begin, undo, redo,
        clear() {
            if (transaction) {
                const current = transaction;
                const reverted = [];
                try {
                    for (let index = current.commands.length - 1; index >= 0; index -= 1) {
                        if (current.commands[index].revert() === false) throw new Error(`Could not cancel '${current.label}'.`);
                        reverted.push(current.commands[index]);
                    }
                    transaction = null;
                } catch (error) {
                    for (let index = reverted.length - 1; index >= 0; index -= 1) {
                        try { reverted[index].apply(); } catch { /* Preserve the cancellation failure. */ }
                    }
                    throw error;
                }
            }
            undoStack.length = 0;
            redoStack.length = 0;
            state();
        },
        get canUndo() { return undoStack.length > 0 && transaction === null; },
        get canRedo() { return redoStack.length > 0 && transaction === null; },
        get active() { return transaction !== null; },
        get undoLabel() { return undoStack.at(-1)?.label ?? null; },
        get redoLabel() { return redoStack.at(-1)?.label ?? null; }
    };
}
