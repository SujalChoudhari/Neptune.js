let passed = 0;
let failed = 0;
let modules = 0;
let beforeEachCallbacks = [];
let afterEachCallbacks = [];

export function describe(description, callback) {
    console.log( "====================================");
    console.log(`\t${description}`);
    modules++;
    callback();
}

export function beforeEach(callback) {
    beforeEachCallbacks.push(callback);
}

export function afterEach(callback) {
    afterEachCallbacks.push(callback);
}

export async function it(description, callback) {
    beforeEachCallbacks.forEach(callback => callback());
    try {
        callback();
        console.log(`\t✅ ${description} - Passed`);
        passed++;
    } catch (error) {
        console.error(`\t❌ ${description} - Failed`);
        console.error(error);
        failed++;
    }
    afterEachCallbacks.forEach(callback => callback());
}

export function expect(actual) {
    const matchers = {
        toBe(expected) {
            if (actual === expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} is equal to ${expected}`);
            } else {
                throw new Error(`Expectation failed: ${actual} is not equal to ${expected}`);
            }
        },

        toNotBe(expected) {
            if (actual !== expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} is not equal to ${expected}`);
            } else {
                throw new Error(`Expectation failed: ${actual} is equal to ${expected}`);
            }
        },

        toBeInstanceOf(expected) {
            if (actual instanceof expected) {
                console.log(`\t\t✅ Expectation passed: ${actual} is an instance of ${expected.name}`);
            } else {
                throw new Error(`Expectation failed: ${actual} is not an instance of ${expected.name}`);
            }
        },

        toBeTruthy() {
            if (actual) {
                console.log(`\t\t✅ Expectation passed: ${actual} is truthy`);
            } else {
                throw new Error(`Expectation failed: ${actual} is falsy`);
            }
        },

        toBeFalsy() {
            if (!actual) {
                console.log(`\t\t✅ Expectation passed: ${actual} is falsy`);
            } else {
                throw new Error(`Expectation failed: ${actual} is truthy`);
            }
        },

        toEqual(expected) {
            if (JSON.stringify(actual) === JSON.stringify(expected)) {
                console.log(`\t\t✅ Expectation passed: ${actual} is equal to ${expected}`);
            } else {
                throw new Error(`Expectation failed: ${actual} is not equal to ${expected}`);
            }
        },

        toContain(expected) {
            if (actual.includes(expected)) {
                console.log(`\t\t✅ Expectation passed: ${actual} contains ${expected}`);
            } else {
                throw new Error(`Expectation failed: ${actual} does not contain ${expected}`);
            }
        }
    };

    return matchers;
}


export async function printResults() {
    console.log(`${modules} modules tested.`);
    console.log(`${passed} tests passed.`);
    console.log(`${failed} tests failed.`);
}