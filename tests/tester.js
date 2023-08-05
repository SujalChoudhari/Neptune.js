console.time("Tester.js");

let modulesData = [];
let currentModule = null;
let beforeEachCallbacks = [];
let afterEachCallbacks = [];

export function describe(description, callback) {
    currentModule = {
        description,
        passed: 0,
        failed: 0,
        tests: []
    };
    modulesData.push(currentModule);
    console.groupCollapsed(`Module: ${description}`);
    callback();
    console.groupEnd();
    currentModule = null;
}

export function beforeEach(callback) {
    beforeEachCallbacks.push(callback);
}

export function afterEach(callback) {
    afterEachCallbacks.push(callback);
}

export async function it(description, callback) {
    beforeEachCallbacks.forEach((callback) => callback());
    try {
        callback();
        console.log(`  ✅ ${description} - Passed`);
        currentModule.passed++;
        currentModule.tests.push({ description, passed: true });
    } catch (error) {
        console.error(`  ❌ ${description} - Failed`);
        console.error(error);
        currentModule.failed++;
        currentModule.tests.push({ description, passed: false });
    }
    afterEachCallbacks.forEach((callback) => callback());
}



export function expect(actual) {
    const matchers = {
        toBe(expected) {
            if (actual === expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} is equal to ${expected}`);
            } else {
                console.error(`\t\t❌ Expectation failed: ${actual} is not equal to ${expected}`);
            }
        },

        toBeInstanceOf(expected) {
            if (actual instanceof expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} is an instance of ${expected.name}`);
            } else {
                console.error(`\t\t❌ Expectation failed: ${actual} is not an instance of ${expected.name}`);
            }
        },

        toBeTruthy() {
            if (actual) {
                console.log(`\t\t✅ Expectation passed: ${actual} is truthy`);
            } else {
                console.error(`\t\t❌ Expectation failed: ${actual} is falsy`);
            }
        },

        toBeFalsy() {
            if (!actual) {
                console.log(`\t\t✅ Expectation passed: ${actual} is falsy`);
            } else {
                console.error(`\t\t❌ Expectation failed: ${actual} is truthy`);
            }
        },

        toEqual(expected) {
            if (JSON.stringify(actual) === JSON.stringify(expected)) {
                console.log(`\t\t✅ Expectation passed: ${actual} is equal to ${expected}`);
            } else {
                console.error(`\t\t❌ Expectation failed: ${actual} is not equal to ${expected}`);
            }
        },

        toContain(expected) {
            if (actual.includes(expected)) {
                console.log(`\t\t✅ Expectation passed: ${actual} contains ${expected}`);
            } else {
                console.error(`\t\t❌ Expectation failed: ${actual} does not contain ${expected}`);
            }
        },
        toBeUndefined() {
            if (actual === undefined) {
                console.log(`\t\t✅ Expectation passed: ${actual} is undefined`);
            } else {
                console.error(`\t\t❌ Expectation failed: ${actual} is not undefined`);
            }
        },
        not: {
            toBe(expected) {
                if (actual !== expected) {
                    console.log(`\t\t✅ Expectation passed: ${actual} is not equal to ${expected}`);
                } else {
                    console.error(`\t\t❌ Expectation failed: ${actual} is equal to ${expected}`);
                }
            },

            toBeInstanceOf(expected) {
                if (!(actual instanceof expected)) {
                    console.log(`\t\t✅ Expectation passed: ${actual} is not an instance of ${expected.name}`);
                } else {
                    console.error(`\t\t❌ Expectation failed: ${actual} is an instance of ${expected.name}`);
                }
            },

            toContain(expected) {
                if (!actual.includes(expected)) {
                    console.log(`\t\t✅ Expectation passed: ${actual} does not contain ${expected}`);
                } else {
                    console.error(`\t\t❌ Expectation failed: ${actual} contains ${expected}`);
                }
            },

            beEmpty() {
                if (actual.length === 0) {
                    console.log(`\t\t✅ Expectation passed: ${actual} is empty`);
                }
                else {
                    console.error(`\t\t❌ Expectation failed: ${actual} is not empty`);
                }
            }

        }
    };

    return matchers;
}

export async function printResults() {

    console.group("Test Results");
    modulesData.forEach(module => {
        const moduleStatus = module.failed <= 0 ? "✅ Passed" : "❌ Failed";
        console.log(`${moduleStatus}: ${module.description}`);
    });
    console.log(`${modulesData.length} module(s) tested.`);
    console.timeEnd("Tester.js");
    console.groupEnd();
}
