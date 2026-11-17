import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Stats } from '../src/larissa/stats.js';
import { Combatant } from '../src/larissa/combat.js';
import { BoxCollider } from '../src/components/boxCollider.js';
import { Transform } from '../src/components/transform.js';
import { Vector2 } from '../src/math/vec2.js';
import { Entity } from '../src/core/entity.js';
import { Scene } from '../src/core/scene.js';
import { SceneManager } from '../src/core/sceneManager.js';
import { TopDownController } from '../src/nereid/topDownController.js';
import { Collider } from '../src/nereid/collider.js';
import { InputActions } from '../src/input/actions.js';
import { KeyboardInput } from '../src/input/keyboardinput.js';
import { FixedStepper } from '../src/core/fixedStepper.js';
import { Application } from '../src/core/application.js';
import { Behaviour } from '../src/scripts/script.js';

test('Combatant health remains authoritative through the explicit legacy Stats bridge', () => {
    const combatant = new Combatant({ maxHealth: 20, health: 12, invulnerabilityDuration: 0 });
    const stats = combatant.bindStats(new Stats({ maxHealth: 100, health: 90, defense: 5 }));
    const events = [];
    stats.onDamage = amount => events.push(['damage', amount]);
    stats.onHeal = amount => events.push(['heal', amount]);
    stats.onDeath = () => events.push(['death']);

    assert.equal(stats.health, 12, 'binding adopts the Combatant value instead of replacing it');
    assert.equal(stats.maxHealth, 20);
    assert.equal(stats.takeDamage(10), 5, 'legacy defense remains in place while damage reaches Combatant');
    assert.equal(combatant.health, 7);
    assert.equal(stats.health, 7);
    combatant.receiveDamage({ amount: 7 });
    assert.equal(stats.health, 0);
    assert.equal(stats.isAlive, false);
    assert.deepEqual(events, [['damage', 5], ['damage', 7], ['death']]);

    stats.heal(4);
    assert.equal(combatant.health, 4);
    stats.health = 19;
    assert.equal(combatant.health, 19);
    stats.maxHealth = 15;
    assert.equal(combatant.health, 15);
    assert.equal(stats.maxHealth, 15);
    assert.equal(stats.unbindCombatant(), true);
    combatant.setHealth(3);
    assert.equal(stats.health, 15, 'unbound Stats retains its last standalone snapshot');

    const owner = new Entity('Health owner');
    const ownedCombatant = new Combatant({ health: 8 });
    const ownedStats = new Stats();
    owner.AddComponent(ownedCombatant);
    owner.AddComponent(ownedStats);
    ownedStats.bindCombatant(ownedCombatant);
    owner.destroy();
    ownedCombatant.health = 1;
    assert.equal(ownedStats.health, 8, 'destroying a Combatant releases its Stats compatibility listener');

    const standalone = new Stats({ maxHealth: 10, defense: 2 });
    assert.equal(standalone.takeDamage(5), 3);
    assert.equal(standalone.health, 7);
});

test('top-down movement normalizes diagonals, adapts BoxCollider, and stops at solid overlap', () => {
    SceneManager.removeAllScenes();
    const scene = new Scene('Top-down movement');
    const player = new Entity('Player');
    player.AddComponent(new Transform(new Vector2(0, 0)));
    player.AddComponent(new BoxCollider(0.5, 0.5));
    const controller = new TopDownController({ speed: 2 });
    player.AddComponent(controller);
    scene.AddChild(player);
    const wall = new Entity('Wall');
    wall.AddComponent(new Transform(new Vector2(1, 0)));
    wall.AddComponent(new BoxCollider(0.5, 2));
    scene.AddChild(wall);
    SceneManager.LoadScene(scene.id);

    const result = controller.move({ x: 1, y: 0 }, 1);
    assert.ok(result.x <= 0.500001, `player should not cross the wall (x=${result.x})`);
    assert.ok(result.x >= 0.3, 'movement should approach the wall rather than stop early');
    assert.equal(result.y, 0, 'axis separation preserves slide movement');

    const open = new Entity('Open');
    open.AddComponent(new Transform(new Vector2(5, 5)));
    const diagonal = new TopDownController({ speed: 2 });
    open.AddComponent(diagonal);
    scene.AddChild(open);
    const before = open.GetComponent(Transform).position.Copy();
    const moved = diagonal.move({ x: 1, y: 1 }, 0.1, []);
    assert.ok(Math.abs(Math.hypot(moved.x - before.x, moved.y - before.y) - 0.2) < 1e-8,
        'diagonal direction must use the configured world speed');
    const thinWall = new Collider(0.01, 1, -0.005, -0.5);
    const fast = new Entity('Fast mover');
    fast.AddComponent(new Transform(new Vector2(0, 0)));
    const fastController = new TopDownController({ speed: 2, collider: new Collider(0.1, 0.1, -0.05, -0.05) });
    fast.AddComponent(fastController);
    const stopped = fastController.move({ x: 1, y: 0 }, 1, [{ collider: thinWall, x: 0.5, y: 0 }]);
    assert.ok(stopped.x < 0.46, 'substeps should detect a narrow solid wall');
    const beforeRejectedMove = fast.GetComponent(Transform).position.x;
    fastController.speed = 1000;
    assert.throws(() => fastController.move({ x: 1, y: 0 }, 1, []), /256-substep/);
    assert.equal(fast.GetComponent(Transform).position.x, beforeRejectedMove, 'rejected travel must not partially move the entity');
    scene.destroy();
    SceneManager.removeAllScenes();
});

test('action input retains quick taps and releases, supports rebinding/contexts, and clears on focus loss', () => {
    KeyboardInput.init({});
    const actions = new InputActions({ attack: 'Space', north: 'W' });
    const space = KeyboardInput.KEY_CODE.SPACE;
    window.dispatchEvent({ type: 'keydown', keyCode: space });
    assert.deepEqual(actions.state('attack'), { pressed: true, held: true, released: false });
    window.dispatchEvent({ type: 'keyup', keyCode: space });
    assert.deepEqual(actions.state('attack'), { pressed: true, held: false, released: true });
    KeyboardInput.clear();
    assert.deepEqual(actions.state('attack'), { pressed: false, held: false, released: false });

    actions.bind('attack', 'J', 'menu').setContext('menu');
    window.dispatchEvent({ type: 'keydown', keyCode: KeyboardInput.KEY_CODE.J });
    assert.equal(actions.held('attack'), true);
    window.dispatchEvent({ type: 'blur' });
    assert.deepEqual(actions.state('attack'), { pressed: false, held: false, released: true });
    actions.setEnabled(false);
    assert.deepEqual(actions.state('attack'), { pressed: false, held: false, released: false });
    actions.dispose();
    KeyboardInput.dispose();
});

test('fixed stepper matches simulation time across render rates and bounds catch-up', () => {
    const run = hz => {
        const stepper = new FixedStepper();
        let steps = 0;
        for (let frame = 0; frame < hz * 2; frame++) stepper.advance(1 / hz, dt => {
            assert.equal(dt, 1 / 60);
            steps++;
        });
        return { stepper, steps };
    };
    assert.equal(run(30).steps, 120);
    assert.equal(run(144).steps, 120);
    const bounded = new FixedStepper({ step: 0.01, maxSteps: 3, maxFrameDelta: 0.1 });
    let updates = 0;
    assert.equal(bounded.advance(10, () => updates++), 3);
    assert.equal(updates, 3);
    assert.ok(bounded.droppedTime > 9.9);
    assert.ok(bounded.accumulator < bounded.step);
});

test('Application drives behaviours with fixed updates and discards the queued frame after Stop', () => {
    const previous = {
        document: globalThis.document,
        window: globalThis.window,
        requestAnimationFrame: globalThis.requestAnimationFrame,
        performance: globalThis.performance
    };
    const elements = new Map();
    const context = { clearRect() {}, fillRect() {}, save() {}, restore() {} };
    const createElement = () => {
        const attributes = {};
        const listeners = new Map();
        return {
            attributes, style: {},
            setAttribute(name, value) { attributes[name] = value; if (name === 'id') this.id = value; },
            getAttribute(name) { return attributes[name]; },
            focus() {}, remove() { elements.delete(this.id); },
            getContext() { return context; },
            addEventListener(type, handler) { const list = listeners.get(type) ?? []; list.push(handler); listeners.set(type, list); },
            removeEventListener(type, handler) { listeners.set(type, (listeners.get(type) ?? []).filter(item => item !== handler)); }
        };
    };
    const listeners = new Map();
    globalThis.document = {
        body: { appendChild(element) { elements.set(element.id, element); } },
        head: { appendChild() {} },
        getElementById(id) { return elements.get(id) ?? null; },
        createElement
    };
    globalThis.window = {
        innerWidth: 640, innerHeight: 480, outerWidth: 640, outerHeight: 480,
        addEventListener(type, handler) { const list = listeners.get(type) ?? []; list.push(handler); listeners.set(type, list); },
        removeEventListener(type, handler) { listeners.set(type, (listeners.get(type) ?? []).filter(item => item !== handler)); }
    };
    globalThis.performance = { now: () => 0 };
    const frames = [];
    globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
    SceneManager.removeAllScenes();
    const scene = new Scene('Fixed application test');
    const entity = new Entity('Ticker');
    const deltas = [];
    const ticker = new Behaviour('Ticker');
    ticker.Update = delta => deltas.push(delta);
    entity.AddComponent(ticker);
    scene.AddChild(entity);

    const application = new Application();
    try {
        application.start();
        assert.equal(frames.length, 1);
        frames.shift()(1000 / 30);
        frames.shift()(2000 / 30);
        assert.equal(deltas.length, 4, 'two 30Hz render intervals produce four 60Hz simulation ticks');
        assert.ok(deltas.every(delta => delta === 1 / 60));
        application.stop();
        const staleFrame = frames.shift();
        staleFrame?.(500);
        assert.equal(deltas.length, 4, 'an already queued RAF cannot advance the stopped simulation');
    } finally {
        application.resetProject();
        SceneManager.removeAllScenes();
        globalThis.document = previous.document;
        globalThis.window = previous.window;
        globalThis.requestAnimationFrame = previous.requestAnimationFrame;
        globalThis.performance = previous.performance;
    }
});
