/**
 * Triton Tests - Test Runner
 * Runs all test files and provides summary
 */

console.log('═══════════════════════════════════════════');
console.log('           TRITON EDITOR TESTS             ');
console.log('═══════════════════════════════════════════');

// Import test files
import './eventBus.test.js';
import './stateManager.test.js';
import './historyManager.test.js';
import './projectIO.test.js';
import './fileWatcher.test.js';

console.log('\n═══════════════════════════════════════════');
console.log('         ALL TESTS COMPLETE                ');
console.log('═══════════════════════════════════════════\n');
