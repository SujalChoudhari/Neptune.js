console.time("Tester.js");

let modulesData = [];
let currentModule = null;
let beforeEachCallbacks = [];
let afterEachCallbacks = [];
let currentTestFailed = false;
const pendingTests = [];
let draining = null;

/**
 * Helper to mark current test as failed and throw
 */
function fail(message) {
    currentTestFailed = true;
    throw new Error(message);
}

export function describe(description, callback) {
    const parent = currentModule;
    const parentBefore = beforeEachCallbacks;
    const parentAfter = afterEachCallbacks;
    beforeEachCallbacks = parent ? [...parentBefore] : [];
    afterEachCallbacks = parent ? [...parentAfter] : [];

    currentModule = {
        description,
        passed: 0,
        failed: 0,
        tests: []
    };
    modulesData.push(currentModule);
    console.groupCollapsed(`Module: ${description}`);
    try { callback(); }
    finally {
        console.groupEnd();
        currentModule = parent;
        beforeEachCallbacks = parentBefore;
        afterEachCallbacks = parentAfter;
    }
}

export function beforeEach(callback) {
    beforeEachCallbacks.push(callback);
}

export function afterEach(callback) {
    afterEachCallbacks.push(callback);
}

export function it(description, callback) {
    if (!currentModule || typeof callback !== 'function') throw new TypeError('it() needs a describe() module and a test callback');
    pendingTests.push({ description, callback, module: currentModule, before: [...beforeEachCallbacks], after: [...afterEachCallbacks] });
}

async function runPendingTests() {
    if (draining) return draining;
    draining = (async () => {
        while (pendingTests.length) {
            const test = pendingTests.shift();
            currentTestFailed = false;
            let failure = null;
            try {
                for (const setup of test.before) await setup();
                await test.callback();
                if (currentTestFailed) failure = new Error('A test expectation failed.');
            } catch (error) { failure = error; }
            for (const cleanup of [...test.after].reverse()) {
                try { await cleanup(); }
                catch (error) { failure ||= error; }
            }
            if (failure) {
                console.error(`  ❌ ${test.description} - Failed`);
                console.error(failure);
                test.module.failed++;
                test.module.tests.push({ description: test.description, passed: false, error: failure.message || String(failure) });
            } else {
                console.log(`  ✅ ${test.description} - Passed`);
                test.module.passed++;
                test.module.tests.push({ description: test.description, passed: true });
            }
        }
    })();
    try { await draining; }
    finally { draining = null; }
}

export function expect(actual) {
    const matchers = {
        toBe(expected) {
            if (actual === expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} === ${expected}`);
            } else {
                fail(`Expectation failed: ${actual} !== ${expected}`);
            }
        },

        toBeInstanceOf(expected) {
            if (actual instanceof expected) {
                console.log(`\t\t✅ Expectation passed: value is an instance of ${expected.name}`);
            } else {
                fail(`Expectation failed: value is not an instance of ${expected.name}`);
            }
        },

        toBeTruthy() {
            if (actual) {
                console.log(`\t\t✅ Expectation passed: ${actual} is truthy`);
            } else {
                fail(`Expectation failed: ${actual} is falsy`);
            }
        },

        toBeFalsy() {
            if (!actual) {
                console.log(`\t\t✅ Expectation passed: value is falsy`);
            } else {
                fail(`Expectation failed: ${actual} is truthy`);
            }
        },

        toEqual(expected) {
            if (JSON.stringify(actual) === JSON.stringify(expected)) {
                console.log(`\t\t✅ Expectation passed: values are deeply equal`);
            } else {
                fail(`Expectation failed: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
            }
        },

        toContain(expected) {
            if (actual.includes(expected)) {
                console.log(`\t\t✅ Expectation passed: array/string contains ${expected}`);
            } else {
                fail(`Expectation failed: ${actual} does not contain ${expected}`);
            }
        },

        toBeUndefined() {
            if (actual === undefined) {
                console.log(`\t\t✅ Expectation passed: value is undefined`);
            } else {
                fail(`Expectation failed: ${actual} is not undefined`);
            }
        },

        toBeDefined() {
            if (actual !== undefined) {
                console.log(`\t\t✅ Expectation passed: value is defined`);
            } else {
                fail(`Expectation failed: value is undefined`);
            }
        },

        toBeNull() {
            if (actual === null) {
                console.log(`\t\t✅ Expectation passed: value is null`);
            } else {
                fail(`Expectation failed: ${actual} is not null`);
            }
        },

        toBeGreaterThan(expected) {
            if (actual > expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} > ${expected}`);
            } else {
                fail(`Expectation failed: ${actual} is not greater than ${expected}`);
            }
        },

        toBeLessThan(expected) {
            if (actual < expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} < ${expected}`);
            } else {
                fail(`Expectation failed: ${actual} is not less than ${expected}`);
            }
        },

        toBeGreaterThanOrEqual(expected) {
            if (actual >= expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} >= ${expected}`);
            } else {
                fail(`Expectation failed: ${actual} is not >= ${expected}`);
            }
        },

        toBeLessThanOrEqual(expected) {
            if (actual <= expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} <= ${expected}`);
            } else {
                fail(`Expectation failed: ${actual} is not <= ${expected}`);
            }
        },

        toBeCloseTo(expected, precision = 2) {
            const tolerance = Math.pow(10, -precision) / 2;
            if (Math.abs(actual - expected) < tolerance) {
                console.log(`\t\t✅ Expectation passed: ${actual} ≈ ${expected} (precision: ${precision})`);
            } else {
                fail(`Expectation failed: ${actual} is not close to ${expected} (precision: ${precision})`);
            }
        },

        toThrow(expectedError) {
            if (typeof actual !== 'function') {
                fail(`Expectation failed: expected a function, got ${typeof actual}`);
                return;
            }
            let threw = false;
            let thrownError = null;
            try {
                actual();
            } catch (e) {
                threw = true;
                thrownError = e;
            }
            if (!threw) {
                fail(`Expectation failed: function did not throw`);
            } else if (expectedError !== undefined) {
                if (expectedError instanceof RegExp) {
                    if (!expectedError.test(thrownError.message)) {
                        fail(`Expectation failed: error message "${thrownError.message}" does not match ${expectedError}`);
                    } else {
                        console.log(`\t\t✅ Expectation passed: function threw matching error`);
                    }
                } else if (typeof expectedError === 'string') {
                    if (!thrownError.message.includes(expectedError)) {
                        fail(`Expectation failed: error message "${thrownError.message}" does not include "${expectedError}"`);
                    } else {
                        console.log(`\t\t✅ Expectation passed: function threw error containing "${expectedError}"`);
                    }
                } else {
                    console.log(`\t\t✅ Expectation passed: function threw`);
                }
            } else {
                console.log(`\t\t✅ Expectation passed: function threw`);
            }
        },

        toHaveLength(expected) {
            if (actual.length === expected) {
                console.log(`\t\t✅ Expectation passed: length is ${expected}`);
            } else {
                fail(`Expectation failed: length is ${actual.length}, expected ${expected}`);
            }
        },

        not: {
            toBe(expected) {
                if (actual !== expected) {
                    console.log(`\t\t✅ Expectation passed: ${actual} !== ${expected}`);
                } else {
                    fail(`Expectation failed: ${actual} === ${expected}`);
                }
            },

            toBeInstanceOf(expected) {
                if (!(actual instanceof expected)) {
                    console.log(`\t\t✅ Expectation passed: value is not an instance of ${expected.name}`);
                } else {
                    fail(`Expectation failed: value is an instance of ${expected.name}`);
                }
            },

            toContain(expected) {
                if (!actual.includes(expected)) {
                    console.log(`\t\t✅ Expectation passed: does not contain ${expected}`);
                } else {
                    fail(`Expectation failed: ${actual} contains ${expected}`);
                }
            },

            toBeNull() {
                if (actual !== null) {
                    console.log(`\t\t✅ Expectation passed: value is not null`);
                } else {
                    fail(`Expectation failed: value is null`);
                }
            },

            toBeUndefined() {
                if (actual !== undefined) {
                    console.log(`\t\t✅ Expectation passed: value is not undefined`);
                } else {
                    fail(`Expectation failed: value is undefined`);
                }
            },

            toThrow() {
                if (typeof actual !== 'function') {
                    fail(`Expectation failed: expected a function, got ${typeof actual}`);
                    return;
                }
                let threw = false;
                try {
                    actual();
                } catch (e) {
                    threw = true;
                }
                if (threw) {
                    fail(`Expectation failed: function threw when it should not have`);
                } else {
                    console.log(`\t\t✅ Expectation passed: function did not throw`);
                }
            },

            toEqual(expected) {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    console.log(`\t\t✅ Expectation passed: values are not deeply equal`);
                } else {
                    fail(`Expectation failed: values are deeply equal`);
                }
            }
        }
    };

    return matchers;
}

export async function printResults() {
    await runPendingTests();
    let totalPassed = 0;
    let totalFailed = 0;

    console.group("Test Results");
    modulesData.forEach(module => {
        const moduleStatus = module.failed <= 0 ? "✅ Passed" : "❌ Failed";
        console.log(`${moduleStatus}: ${module.description} (${module.passed}/${module.passed + module.failed})`);
        totalPassed += module.passed;
        totalFailed += module.failed;
    });
    console.log(`\n📊 Total: ${totalPassed} passed, ${totalFailed} failed out of ${totalPassed + totalFailed} tests`);
    console.log(`${modulesData.length} module(s) tested.`);
    console.timeEnd("Tester.js");
    console.groupEnd();

    return { passed: totalPassed, failed: totalFailed };
}
