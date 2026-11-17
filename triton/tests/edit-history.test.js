import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditHistory } from '../src/lib/editHistory.mjs';

test('edit history supports atomic undo/redo and preserves history on callback failure', () => {
    const history = createEditHistory();
    let value = 1;
    history.run('set value', () => { value = 2; }, () => { value = 1; });
    assert.equal(value, 2);
    assert.equal(history.undo(), true);
    assert.equal(value, 1);
    history.undo();
    assert.equal(value, 1);
    assert.equal(history.redo(), true);
    assert.equal(value, 2);
    const broken = createEditHistory();
    broken.run('stable', () => {}, () => { throw new Error('revert rejected'); });
    assert.throws(() => broken.undo(), /revert rejected/);
    assert.equal(broken.canUndo, true);
    assert.equal(broken.canRedo, false);
});

test('transactions commit as one entry and cancel without leaving history', () => {
    const history = createEditHistory();
    let value = 0;
    const transaction = history.begin('drag');
    history.run('first move', () => { value = 1; }, () => { value = 0; });
    history.run('second move', () => { value = 2; }, () => { value = 1; });
    assert.equal(history.canUndo, false);
    assert.equal(transaction.commit(), true);
    assert.equal(history.undoLabel, 'drag');
    history.undo();
    assert.equal(value, 0);
    history.redo();
    assert.equal(value, 2);

    const cancel = history.begin('cancel drag');
    history.run('move', () => { value = 3; }, () => { value = 2; });
    assert.equal(cancel.cancel(), true);
    assert.equal(value, 2);
    assert.equal(history.undoLabel, 'drag');
});

test('no-op edits do not clear redo and undo/redo stacks respect the configured limit', () => {
    const history = createEditHistory({ limit: 2 });
    let value = 0;
    history.run('one', () => { value = 1; }, () => { value = 0; });
    history.undo();
    history.run('no-op', () => false, () => {});
    assert.equal(history.canRedo, true);
    history.redo();
    history.run('two', () => { value = 2; }, () => { value = 1; });
    history.run('three', () => { value = 3; }, () => { value = 2; });
    assert.equal(history.undoLabel, 'three');
    history.undo();
    history.undo();
    assert.equal(history.canUndo, false);
});
