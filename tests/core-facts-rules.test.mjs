import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldFacts, TypedEventBus, RuleEngine } from '../src/core/worldFacts.js';
import { application, Application, SaveManager } from '../src/neptune.js';

test('TypedEventBus: self-removing listeners during active emission', () => {
    const bus = new TypedEventBus();
    const calls = [];

    // 1. Single listener self-removing during emission
    let unbind1;
    unbind1 = bus.on('test:self-remove', () => {
        calls.push('listener-1');
        unbind1();
    });

    const unbind2 = bus.on('test:self-remove', () => {
        calls.push('listener-2');
    });

    // First emit: both should run
    bus.emit('test:self-remove');
    assert.deepEqual(calls, ['listener-1', 'listener-2'], 'both listeners execute on first emit');
    assert.equal(bus.listenerCount('test:self-remove'), 1, 'listener-1 has unbonded itself');

    // Second emit: only listener-2 should run
    calls.length = 0;
    bus.emit('test:self-remove');
    assert.deepEqual(calls, ['listener-2'], 'only listener-2 executes on second emit');

    unbind2();
    assert.equal(bus.listenerCount('test:self-remove'), 0);

    // 2. Cross-removing listener: listener A unbinds listener B before B executes
    const crossCalls = [];
    let unbindCrossB;
    const unbindCrossA = bus.on('test:cross', () => {
        crossCalls.push('A');
        unbindCrossB(); // unbind B before B executes
    }, { priority: 10 });

    unbindCrossB = bus.on('test:cross', () => {
        crossCalls.push('B');
    }, { priority: 5 });

    bus.emit('test:cross');
    assert.deepEqual(crossCalls, ['A'], 'B was unbound during iteration and should not run');
    assert.equal(bus.listenerCount('test:cross'), 1);
    unbindCrossA();

    // 3. Multiple concurrent self-removing listeners
    const multiCalls = [];
    const unbinds = [];
    for (let i = 0; i < 5; i++) {
        const u = bus.on('test:multi-self', () => {
            multiCalls.push(i);
            u();
        });
        unbinds.push(u);
    }
    assert.equal(bus.listenerCount('test:multi-self'), 5);
    bus.emit('test:multi-self');
    assert.deepEqual(multiCalls, [0, 1, 2, 3, 4], 'all 5 self-removing listeners execute on first emit');
    assert.equal(bus.listenerCount('test:multi-self'), 0, 'all 5 listeners cleaned up cleanly');

    multiCalls.length = 0;
    bus.emit('test:multi-self');
    assert.deepEqual(multiCalls, [], 'no listeners execute on second emit');

    // 4. once() subscriptions self-remove automatically
    const onceCalls = [];
    bus.once('test:once', data => onceCalls.push(data.val));
    assert.equal(bus.listenerCount('test:once'), 1);
    bus.emit('test:once', { val: 'first' });
    bus.emit('test:once', { val: 'second' });
    assert.deepEqual(onceCalls, ['first']);
    assert.equal(bus.listenerCount('test:once'), 0);

    // 5. Listener added during emission does not execute in current emission
    const addCalls = [];
    bus.on('test:add-during', () => {
        addCalls.push('first');
        bus.on('test:add-during', () => {
            addCalls.push('second');
        });
    });
    bus.emit('test:add-during');
    assert.deepEqual(addCalls, ['first'], 'listener added during emit does not fire in current emit');
    addCalls.length = 0;
    bus.emit('test:add-during');
    assert.deepEqual(addCalls, ['first', 'second'], 'listener fires on subsequent emits');

    // 6. Duplicate listener guard
    const dupCalls = [];
    const dupFn = () => dupCalls.push('hit');
    const uDup1 = bus.on('test:dup', dupFn);
    const uDup2 = bus.on('test:dup', dupFn);
    assert.equal(bus.listenerCount('test:dup'), 1, 'identical listener function deduplicated');
    bus.emit('test:dup');
    assert.deepEqual(dupCalls, ['hit'], 'deduplicated listener only executed once');
    uDup1();
    assert.equal(bus.listenerCount('test:dup'), 0);

    // 7. Idempotent unbinding
    assert.doesNotThrow(() => {
        unbind1();
        unbind1();
        unbind2();
        unbind2();
    });
});

test('TypedEventBus: recursive event dispatching and recursion depth guarding', () => {
    const bus = new TypedEventBus({ maxRecursionDepth: 10 });
    const log = [];

    // 1. Safe bounded recursive dispatching
    bus.on('step:down', (data) => {
        log.push(data.count);
        if (data.count > 0) {
            bus.emit('step:down', { count: data.count - 1 });
        }
    });

    bus.emit('step:down', { count: 3 });
    assert.deepEqual(log, [3, 2, 1, 0], 'clean recursive emission completes in expected order');

    // 2. Cascade cross-event recursion
    const cascadeLog = [];
    bus.on('event:A', () => {
        cascadeLog.push('A');
        bus.emit('event:B');
    });
    bus.on('event:B', () => {
        cascadeLog.push('B');
        bus.emit('event:C');
    });
    bus.on('event:C', () => {
        cascadeLog.push('C');
    });

    bus.emit('event:A');
    assert.deepEqual(cascadeLog, ['A', 'B', 'C']);

    // 3. Runaway recursion depth guard triggers RangeError
    let runawayCount = 0;
    bus.on('runaway:loop', () => {
        runawayCount++;
        bus.emit('runaway:loop');
    });

    assert.throws(
        () => bus.emit('runaway:loop'),
        (err) => err instanceof RangeError && err.message.includes('recursion depth exceeded'),
        'runaway recursion exceeds maxRecursionDepth limit and throws RangeError'
    );
    assert.equal(runawayCount, 10, 'recursion count reached exactly maxRecursionDepth limit');

    // 4. Recovery: verify internal depth counter cleaned up after error so subsequent emits work
    const recoveryLog = [];
    bus.on('recovery:check', () => recoveryLog.push('healthy'));
    assert.doesNotThrow(() => bus.emit('recovery:check'));
    assert.deepEqual(recoveryLog, ['healthy'], 'bus recovers cleanly after caught recursion overflow');
});

test('TypedEventBus and RuleEngine: prioritized listeners, rule execution, and stopPropagation', () => {
    const bus = new TypedEventBus();
    const order = [];

    // 1. Prioritized bus dispatch
    bus.on('order:test', () => order.push('low'), { priority: -10 });
    bus.on('order:test', () => order.push('urgent'), { priority: 100 });
    bus.on('order:test', () => order.push('normal-1'), { priority: 0 });
    bus.on('order:test', () => order.push('high'), { priority: 50 });
    bus.on('order:test', () => order.push('normal-2'), { priority: 0 });

    bus.emit('order:test');
    assert.deepEqual(order, ['urgent', 'high', 'normal-1', 'normal-2', 'low'], 'dispatch honors descending priority and FIFO ties');

    // 2. stopPropagation on TypedEventBus
    const stopOrder = [];
    bus.on('stop:test', () => stopOrder.push('high'), { priority: 100 });
    bus.on('stop:test', (_data, ctx) => {
        stopOrder.push('stopper');
        ctx.stopPropagation();
    }, { priority: 50 });
    bus.on('stop:test', () => stopOrder.push('low'), { priority: 0 });

    const result = bus.emit('stop:test');
    assert.equal(result.stopped, true);
    assert.deepEqual(stopOrder, ['high', 'stopper'], 'lower priority listener skipped after stopPropagation');

    // 3. RuleEngine prioritized execution and stopPropagation
    const facts = new WorldFacts();
    const engine = new RuleEngine({ facts, bus });
    const ruleLog = [];

    facts.set('player.shield', true);
    facts.set('player.hp', 100);

    engine.addRule({
        id: 'shield_block',
        event: 'combat:damage',
        priority: 100,
        condition: ({ facts }) => facts.get('player.shield') === true,
        action: ({ event, stopPropagation, facts }) => {
            ruleLog.push('shield_blocked');
            event.blocked = true;
            facts.set('player.shield', false, 'shield_break');
            stopPropagation();
        }
    });

    engine.addRule({
        id: 'apply_damage',
        event: 'combat:damage',
        priority: 10,
        action: ({ facts, event }) => {
            ruleLog.push('damage_applied');
            facts.set('player.hp', facts.get('player.hp') - event.amount, 'damage_rule');
        }
    });

    // Also add a low-priority bus listener to verify engine stopPropagation propagates to bus
    let busListenerRan = false;
    bus.on('combat:damage', () => {
        busListenerRan = true;
    }, { priority: 0 });

    const damageEvent = { amount: 30 };
    bus.emit('combat:damage', damageEvent);

    assert.equal(damageEvent.blocked, true);
    assert.deepEqual(ruleLog, ['shield_blocked'], 'apply_damage was skipped due to stopPropagation');
    assert.equal(busListenerRan, false, 'subsequent bus listener was also stopped');
    assert.equal(facts.get('player.hp'), 100, 'hp remained unchanged because damage was blocked');
    assert.equal(facts.get('player.shield'), false, 'shield consumed');

    // Second hit without shield: apply_damage should run now
    ruleLog.length = 0;
    busListenerRan = false;
    bus.emit('combat:damage', { amount: 25 });
    assert.deepEqual(ruleLog, ['damage_applied']);
    assert.equal(busListenerRan, true);
    assert.equal(facts.get('player.hp'), 75);
});

test('WorldFacts: dot-notated/string keys, provenance tracking, snapshot/restore, and onChange', () => {
    const facts = new WorldFacts();

    // 1. Setting and getting with dot notation and provenance
    const customTime = 1700000000000;
    facts.set('player.stats.health', 100, { source: 'spawn', timestamp: customTime });
    facts.set('player.stats.mana', 50, 'class_init');
    facts.set('world.weather', 'clear');

    assert.equal(facts.get('player.stats.health'), 100);
    assert.equal(facts.get('player.stats.mana'), 50);
    assert.equal(facts.get('world.weather'), 'clear');
    assert.equal(facts.get('nonexistent.key', 'fallback'), 'fallback');

    // Provenance verification
    const healthProv = facts.getProvenance('player.stats.health');
    assert.equal(healthProv.source, 'spawn');
    assert.equal(healthProv.timestamp, customTime);

    const manaProv = facts.getProvenance('player.stats.mana');
    assert.equal(manaProv.source, 'class_init');
    assert.equal(typeof manaProv.timestamp, 'number');

    const weatherProv = facts.getProvenance('world.weather');
    assert.equal(weatherProv.source, 'system');
    assert.equal(typeof weatherProv.timestamp, 'number');

    // Namespace resolution
    const playerStats = facts.get('player.stats');
    assert.deepEqual(playerStats, { health: 100, mana: 50 }, 'aggregates child keys into nested object');

    // Setting root object allows dot navigation
    facts.set('boss', { name: 'Ember Drake', phase: 1 });
    assert.equal(facts.get('boss.name'), 'Ember Drake');
    assert.equal(facts.get('boss.phase'), 1);

    // 2. onChange listeners with unbind
    const changes = [];
    const unbindAll = facts.onChange((key, newVal, oldVal, prov) => {
        changes.push({ key, newVal, oldVal, source: prov.source });
    });

    const specificChanges = [];
    const unbindSpecific = facts.onChange('player.stats.health', (newVal, oldVal, prov) => {
        specificChanges.push({ newVal, oldVal, source: prov.source });
    });

    facts.set('player.stats.health', 80, { source: 'hazard' });
    assert.deepEqual(changes, [{ key: 'player.stats.health', newVal: 80, oldVal: 100, source: 'hazard' }]);
    assert.deepEqual(specificChanges, [{ newVal: 80, oldVal: 100, source: 'hazard' }]);

    // Unbind specific listener
    unbindSpecific();
    changes.length = 0;
    specificChanges.length = 0;

    facts.set('player.stats.health', 60, { source: 'poison' });
    assert.equal(changes.length, 1);
    assert.equal(specificChanges.length, 0, 'unbound specific listener did not receive update');

    // Unbind global listener
    unbindAll();
    changes.length = 0;
    facts.set('player.stats.health', 40);
    assert.equal(changes.length, 0, 'unbound global listener did not receive update');

    // 3. Snapshot and restore for save games
    facts.set('quest.emberfall.stage', 2, { source: 'cutscene', timestamp: 12345678 });
    const snap = facts.snapshot();

    // Verify snapshot decoupling
    facts.set('quest.emberfall.stage', 3, 'cheat');
    facts.set('player.stats.health', 0, 'death');
    assert.equal(snap.facts['quest.emberfall.stage'].value, 2, 'snapshot is immutable against live changes');

    // Restore into a fresh WorldFacts
    const restored = new WorldFacts();
    restored.restore(snap);

    assert.equal(restored.get('quest.emberfall.stage'), 2);
    assert.equal(restored.get('player.stats.health'), 40);
    assert.equal(restored.getProvenance('quest.emberfall.stage').source, 'cutscene');
    assert.equal(restored.getProvenance('quest.emberfall.stage').timestamp, 12345678);

    // 4. Wildcard pattern listeners and fact deletion
    const wildcardHits = [];
    const unbindWildcard = facts.onChange('quest.*', (newVal, oldVal, prov, key) => {
        wildcardHits.push({ key, newVal, oldVal, source: prov.source });
    });

    facts.set('quest.sidequest1', 'started', { source: 'dialogue' });
    facts.set('quest.sidequest2', 'ready');
    facts.set('other.key', 123); // Should not trigger wildcard

    assert.equal(wildcardHits.length, 2);
    assert.equal(wildcardHits[0].key, 'quest.sidequest1');
    assert.equal(wildcardHits[1].key, 'quest.sidequest2');

    // Deletion triggers onChange with undefined newVal
    const deleted = facts.delete('quest.sidequest1', 'quest_abandon');
    assert.equal(deleted, true);
    assert.equal(facts.has('quest.sidequest1'), false);
    assert.equal(wildcardHits.length, 3);
    assert.equal(wildcardHits[2].key, 'quest.sidequest1');
    assert.equal(wildcardHits[2].newVal, undefined);
    assert.equal(wildcardHits[2].oldVal, 'started');
    assert.equal(wildcardHits[2].source, 'quest_abandon');

    unbindWildcard();

    // 5. SaveManager round-trip compatibility
    const saveManager = new SaveManager({ prefix: 'neptune.facts.test' });
    saveManager.save('slot_world_facts', facts.snapshot());
    const loadedState = saveManager.load('slot_world_facts');

    const loadedFacts = new WorldFacts();
    loadedFacts.restore(loadedState);
    assert.equal(loadedFacts.get('quest.emberfall.stage'), 3);
    assert.equal(loadedFacts.get('player.stats.health'), 0);
});

test('RuleEngine: decision traces, rule evaluations, and subscription cleanup', () => {
    const facts = new WorldFacts();
    const bus = new TypedEventBus();
    const engine = new RuleEngine({ facts, bus });

    facts.set('player.level', 5);
    facts.set('quest.bossDefeated', false);

    // 1. Add rule and evaluate
    const unbindRule1 = engine.addRule({
        id: 'unlock_gate',
        event: 'boss:defeated',
        priority: 50,
        condition: ({ facts }) => facts.get('player.level') >= 5,
        action: ({ facts }) => {
            facts.set('gate.open', true, 'rule:unlock_gate');
        }
    });

    const unbindRule2 = engine.addRule({
        id: 'bonus_xp',
        event: 'boss:defeated',
        priority: 10,
        condition: ({ facts }) => facts.get('player.level') < 3, // Condition will fail
        action: ({ facts }) => {
            facts.set('bonus_given', true);
        }
    });

    assert.equal(bus.listenerCount('boss:defeated'), 2, 'two rules subscribed to event');

    // Trigger via bus
    bus.emit('boss:defeated');
    assert.equal(facts.get('gate.open'), true, 'unlock_gate action ran');
    assert.equal(facts.get('bonus_given'), undefined, 'bonus_xp condition failed');

    // 2. Decision trace validation
    const traces = engine.getDecisionTraces({ eventType: 'boss:defeated' });
    assert.equal(traces.length, 2);

    const unlockTrace = traces.find(t => t.ruleId === 'unlock_gate');
    assert.ok(unlockTrace, 'unlock_gate trace recorded');
    assert.equal(unlockTrace.conditionMatched, true);
    assert.equal(unlockTrace.actionExecuted, true);
    assert.equal(unlockTrace.stoppedPropagation, false);
    assert.equal(typeof unlockTrace.timestamp, 'number');

    const bonusTrace = traces.find(t => t.ruleId === 'bonus_xp');
    assert.ok(bonusTrace, 'bonus_xp trace recorded');
    assert.equal(bonusTrace.conditionMatched, false);
    assert.equal(bonusTrace.actionExecuted, false);

    // 3. Clear decision traces
    engine.clearDecisionTraces();
    assert.equal(engine.getDecisionTraces().length, 0);

    // 4. Rule subscription cleanup via unbind
    unbindRule1();
    assert.equal(bus.listenerCount('boss:defeated'), 1, 'rule1 listener removed from bus');

    facts.delete('gate.open');
    bus.emit('boss:defeated');
    assert.equal(facts.get('gate.open'), undefined, 'unbound rule1 was not triggered');

    // 5. Rule removal and clearRules
    assert.equal(engine.hasRule('bonus_xp'), true);
    engine.removeRule('bonus_xp');
    assert.equal(engine.hasRule('bonus_xp'), false);
    assert.equal(bus.listenerCount('boss:defeated'), 0, 'all bus subscriptions cleaned up');

    // 6. Duplicate rule ID guard: replacing rule with same ID cleans up previous subscription
    engine.addRule({
        id: 'dup_rule',
        event: 'dup:event',
        action: () => {}
    });
    assert.equal(bus.listenerCount('dup:event'), 1);

    engine.addRule({
        id: 'dup_rule',
        event: 'dup:event',
        action: () => {}
    });
    assert.equal(bus.listenerCount('dup:event'), 1, 'replacing rule with same id cleans up old subscription');

    // 7. Direct engine.evaluate() evaluation with priority and stopPropagation
    const directLog = [];
    engine.addRule({
        id: 'direct_high',
        priority: 100,
        condition: () => true,
        action: ({ stopPropagation }) => {
            directLog.push('high');
            stopPropagation();
        }
    });
    engine.addRule({
        id: 'direct_low',
        priority: 10,
        condition: () => true,
        action: () => {
            directLog.push('low');
        }
    });

    const evalResult = engine.evaluate();
    assert.equal(evalResult.stoppedPropagation, true);
    assert.equal(evalResult.matchedCount, 1);
    assert.deepEqual(directLog, ['high'], 'direct evaluation stopped propagation before lower priority rule');

    engine.dispose();
    assert.equal(engine.ruleCount, 0);
    assert.equal(bus.listenerCount('dup:event'), 0);
});

test('Neptune integration: Application singleton wires WorldFacts, TypedEventBus, and RuleEngine', () => {
    assert.ok(application.worldFacts instanceof WorldFacts, 'application.worldFacts is a WorldFacts instance');
    assert.ok(application.eventBus instanceof TypedEventBus, 'application.eventBus is a TypedEventBus instance');
    assert.ok(application.ruleEngine instanceof RuleEngine, 'application.ruleEngine is a RuleEngine instance');
    assert.equal(application.ruleEngine.facts, application.worldFacts, 'ruleEngine is connected to application.worldFacts');
    assert.equal(application.ruleEngine.bus, application.eventBus, 'ruleEngine is connected to application.eventBus');
});
