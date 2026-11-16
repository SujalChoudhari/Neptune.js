import test from 'node:test';
import assert from 'node:assert/strict';
import { ScriptManager } from '../src/scripts/scriptManager.js';

test('runtime script updates do not flood the editor console each frame', () => {
  const messages = [];
  const original = console.log;
  console.log = (...args) => messages.push(args.join(' '));
  try {
    ScriptManager.behaviourUpdate(1 / 60);
    ScriptManager.behaviourUpdate(1 / 60);
  } finally {
    console.log = original;
  }
  assert.deepEqual(messages, []);
});
