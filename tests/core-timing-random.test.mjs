import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { SeededRandom } from '../src/core/seededRandom.js';
import { FixedStepper } from '../src/core/fixedStepper.js';

test('CORE-02: SeededRandom generates deterministic reproducible sequences', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    for (let i = 0; i < 20; i++) {
        assert.equal(rng1.next(), rng2.next());
        assert.equal(rng1.nextInt(1, 100), rng2.nextInt(1, 100));
        assert.equal(rng1.nextFloat(-10, 10), rng2.nextFloat(-10, 10));
        assert.equal(rng1.nextBool(0.3), rng2.nextBool(0.3));
    }
});

test('CORE-02: SeededRandom state save and restore reproduces exact future sequence', () => {
    const rng = new SeededRandom(999);
    // Burn 15 numbers
    for (let i = 0; i < 15; i++) rng.next();

    const snapshot = rng.getState();
    const futureSequence = [];
    for (let i = 0; i < 10; i++) {
        futureSequence.push(rng.nextInt(10, 50));
    }

    // Restore state
    rng.setState(snapshot);
    const replayedSequence = [];
    for (let i = 0; i < 10; i++) {
        replayedSequence.push(rng.nextInt(10, 50));
    }

    assert.deepEqual(replayedSequence, futureSequence);
});

test('CORE-02: SeededRandom choice and shuffle are deterministic', () => {
    const rngA = new SeededRandom(42);
    const rngB = new SeededRandom(42);

    const items = ['sword', 'shield', 'potion', 'ring', 'boots'];
    for (let i = 0; i < 5; i++) {
        assert.equal(rngA.choice(items), rngB.choice(items));
    }

    const shuffledA = rngA.shuffle([...items]);
    const shuffledB = rngB.shuffle([...items]);
    assert.deepEqual(shuffledA, shuffledB);
});

test('CORE-02: SeededRandom validates inputs cleanly', () => {
    assert.throws(() => new SeededRandom(NaN), /Seed must be a finite number/);
    const rng = new SeededRandom(1);
    assert.throws(() => rng.nextInt(10, 5), /min must be less than or equal to max/);
    assert.throws(() => rng.nextFloat(5, 5), /min must be strictly less than max/);
    assert.throws(() => rng.nextBool(-0.1), /chance must be between 0 and 1/);
    assert.throws(() => rng.choice('not an array'), /choice requires an array/);
    assert.throws(() => rng.shuffle(null), /shuffle requires an array/);
});

test('CORE-02: FixedStepper supports timeScale (slow-motion and fast-forward)', () => {
    const stepper = new FixedStepper({ step: 1 / 60, maxSteps: 10 });
    let totalTime = 0;
    const update = (dt) => { totalTime += dt; };

    // Normal speed
    stepper.setTimeScale(1.0);
    let steps = stepper.advance(1 / 30, update);
    assert.equal(steps, 2);

    // Half speed (slow-mo)
    stepper.reset();
    totalTime = 0;
    stepper.setTimeScale(0.5);
    steps = stepper.advance(1 / 30, update); // 1/30 * 0.5 = 1/60
    assert.equal(steps, 1);

    // Double speed (fast-forward)
    stepper.reset();
    totalTime = 0;
    stepper.setTimeScale(2.0);
    steps = stepper.advance(1 / 30, update); // 1/30 * 2.0 = 4/60
    assert.equal(steps, 4);
});

test('CORE-02: FixedStepper pause suppresses steps mid-attack and resumes seamlessly', () => {
    const stepper = new FixedStepper({ step: 1 / 60 });
    let attackFrames = 0;
    const tickAttack = () => { attackFrames++; };

    // Advance 3 frames
    stepper.advance(3 / 60, tickAttack);
    assert.equal(attackFrames, 3);

    // Pause mid-attack
    stepper.pause();
    assert.equal(stepper.paused, true);
    const pausedSteps = stepper.advance(5 / 60, tickAttack);
    assert.equal(pausedSteps, 0);
    assert.equal(attackFrames, 3);

    // Resume
    stepper.resume();
    assert.equal(stepper.paused, false);
    stepper.advance(2 / 60, tickAttack);
    assert.equal(attackFrames, 5);
});

test('CORE-02: FixedStepper prevents spiral of death on long frames/suspended tab', () => {
    const stepper = new FixedStepper({ step: 1 / 60, maxSteps: 5, maxFrameDelta: 0.25 });
    let stepsRun = 0;

    // Simulate 2 second tab suspension
    const steps = stepper.advance(2.0, () => { stepsRun++; });
    assert.equal(steps, 5, 'should cap steps at maxSteps to avoid freezing');
    assert.equal(stepsRun, 5);
    assert.ok(stepper.droppedTime > 1.5, 'excess frame time was safely dropped');
});
