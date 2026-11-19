import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const tester = new URL('./tester.js', import.meta.url).href;
const run = source => spawnSync(process.execPath, ['--input-type=module', '--eval', source], { encoding: 'utf8', timeout: 10000 });

test('legacy runner awaits async tests and hooks, reports failures and runs cleanup in order', () => {
    const result = run(`
        import {describe,it,beforeEach,afterEach,expect,printResults} from ${JSON.stringify(tester)};
        const events=[];
        describe('async runner contract',()=>{
            beforeEach(async()=>{await Promise.resolve();events.push('before');});
            afterEach(async()=>{await Promise.resolve();events.push('after');});
            it('delayed failure',async()=>{events.push('first');await new Promise(r=>setTimeout(r,15));expect(false).toBe(true);});
            it('next test succeeds',async()=>{events.push('second');expect(events).toEqual(['before','first','after','before','second']);});
        });
        const counts=await printResults();
        console.log('COUNTS='+JSON.stringify(counts));
        console.log('EVENTS='+JSON.stringify(events));
        if(counts.failed)process.exitCode=1;
    `);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /COUNTS=\{"passed":1,"failed":1\}/);
    assert.match(result.stdout, /EVENTS=\["before","first","after","before","second","after"\]/);
    assert.match(result.stderr, /Expectation failed/);
    assert.doesNotMatch(result.stderr, /unhandledRejection|uncaughtException/);
});

test('async setup and cleanup failures are counted instead of escaping or stopping later tests', () => {
    const result = run(`
        import {describe,it,beforeEach,afterEach,printResults} from ${JSON.stringify(tester)};
        let cleanup=0;
        describe('setup failure',()=>{
            beforeEach(async()=>{throw new Error('setup rejected');});
            afterEach(async()=>{cleanup++;});
            it('must not execute',()=>{throw new Error('callback should be skipped');});
        });
        describe('cleanup failure',()=>{
            afterEach(async()=>{throw new Error('cleanup rejected');});
            it('cleanup is part of test',async()=>{});
        });
        describe('later module',()=>{it('still executes',async()=>{});});
        const counts=await printResults();
        console.log('COUNTS='+JSON.stringify(counts)+';cleanup='+cleanup);
        if(counts.failed)process.exitCode=1;
    `);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /COUNTS=\{"passed":1,"failed":2\};cleanup=1/);
    assert.match(result.stderr, /setup rejected/);
    assert.match(result.stderr, /cleanup rejected/);
    assert.doesNotMatch(result.stderr, /callback should be skipped/);
});
