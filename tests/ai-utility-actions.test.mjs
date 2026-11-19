import './setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    UtilityAI,
    UtilityAction,
    UtilityConsideration,
    UtilityCurves,
    clamp01,
    createDefaultActions,
    extractHealthFraction,
    extractDangerLevel,
    extractStaminaFraction,
    extractRangeScore,
    extractCanHeal
} from '../src/larissa/utilityAI.js';

import {
    UtilityAI as LarissaUtilityAI,
    UtilityAction as LarissaUtilityAction,
    UtilityConsideration as LarissaUtilityConsideration,
    UtilityCurves as LarissaUtilityCurves
} from '../src/larissa/index.js';

import {
    Larissa,
    UtilityAI as NeptuneUtilityAI,
    Entity,
    ComponentRegistry
} from '../src/neptune.js';

test('Exports: UtilityAI and helpers are exported from all expected entrypoints', () => {
    assert.equal(typeof UtilityAI, 'function');
    assert.equal(typeof UtilityAction, 'function');
    assert.equal(typeof UtilityConsideration, 'function');
    assert.equal(typeof UtilityCurves, 'object');
    assert.equal(typeof clamp01, 'function');
    assert.equal(typeof createDefaultActions, 'function');

    // Larissa entrypoint exports
    assert.equal(LarissaUtilityAI, UtilityAI);
    assert.equal(LarissaUtilityAction, UtilityAction);
    assert.equal(LarissaUtilityConsideration, UtilityConsideration);
    assert.equal(LarissaUtilityCurves, UtilityCurves);
    assert.equal(Larissa.UtilityAI, UtilityAI);

    // Neptune top-level exports
    assert.equal(NeptuneUtilityAI, UtilityAI);
    assert.ok(ComponentRegistry.has('UtilityAI'));

    // Component registration & entity attachment
    const entity = new Entity('TestActor');
    const ai = new UtilityAI({ entity });
    assert.equal(ai.entity, entity);
});

test('Context-based action execution: flee at low health in danger', () => {
    let fleeExecuted = false;
    let attackExecuted = false;
    let healExecuted = false;

    const ai = new UtilityAI({
        actions: createDefaultActions({
            onFlee: () => { fleeExecuted = true; return 'fleeing'; },
            onAttack: () => { attackExecuted = true; return 'attacking'; },
            onHeal: () => { healExecuted = true; return 'healing'; }
        })
    });

    // Context: critically low health (10%) and hostile threat present
    const lowHealthContext = {
        health: 10,
        maxHealth: 100,
        dangerLevel: 1.0,
        target: { id: 'goblin', x: 20, y: 0 },
        targetDistance: 20,
        attackRange: 50,
        canHeal: false
    };

    const result = ai.evaluateAndExecute(lowHealthContext);

    assert.equal(result.executed, true);
    assert.ok(result.chosenAction);
    assert.equal(result.chosenAction.id, 'flee');
    assert.equal(fleeExecuted, true);
    assert.equal(attackExecuted, false);
    assert.equal(healExecuted, false);
    assert.equal(result.result, 'fleeing');

    // Verify flee score is high (health 10% -> low_health curve 0.9 * threat 1.0 = 0.9)
    assert.ok(result.score >= 0.85, `Expected flee score >= 0.85, got ${result.score}`);
});

test('Context-based action execution: attack when healthy and target in range', () => {
    let fleeExecuted = false;
    let attackExecuted = false;
    let patrolExecuted = false;

    const ai = new UtilityAI({
        actions: createDefaultActions({
            onFlee: () => { fleeExecuted = true; },
            onAttack: () => { attackExecuted = true; return 'slashed'; },
            onPatrol: () => { patrolExecuted = true; }
        })
    });

    // Context: healthy (90%), enemy within attack range (15 <= 40)
    const attackContext = {
        health: 90,
        maxHealth: 100,
        target: { id: 'enemy_slime', x: 15, y: 0 },
        targetDistance: 15,
        attackRange: 40,
        dangerLevel: 0.8,
        canHeal: false
    };

    const result = ai.evaluateAndExecute(attackContext);

    assert.equal(result.executed, true);
    assert.ok(result.chosenAction);
    assert.equal(result.chosenAction.id, 'attack');
    assert.equal(attackExecuted, true);
    assert.equal(fleeExecuted, false);
    assert.equal(patrolExecuted, false);
    assert.equal(result.result, 'slashed');
    assert.ok(result.score >= 0.7, `Expected attack score >= 0.7, got ${result.score}`);
});

test('Context-based action execution: heal when damaged with potions available', () => {
    let healExecuted = false;
    const ai = new UtilityAI({
        actions: createDefaultActions({
            onHeal: () => { healExecuted = true; return 'healed'; }
        })
    });

    // Context: damaged (35% health), safe environment (no immediate danger), has 2 potions
    const healContext = {
        health: 35,
        maxHealth: 100,
        potions: 2,
        canHeal: true,
        dangerLevel: 0.0,
        target: null
    };

    const result = ai.evaluateAndExecute(healContext);

    assert.equal(result.executed, true);
    assert.ok(result.chosenAction);
    assert.equal(result.chosenAction.id, 'heal');
    assert.equal(healExecuted, true);
    assert.equal(result.result, 'healed');
});

test('Context-based action execution: rest when exhausted and environment is safe', () => {
    let restExecuted = false;
    const ai = new UtilityAI({
        actions: createDefaultActions({
            onRest: () => { restExecuted = true; return 'resting'; }
        })
    });

    // Context: stamina 10%, safe environment, healthy
    const restContext = {
        health: 100,
        maxHealth: 100,
        stamina: 10,
        maxStamina: 100,
        dangerLevel: 0.0,
        target: null
    };

    const result = ai.evaluateAndExecute(restContext);

    assert.equal(result.executed, true);
    assert.ok(result.chosenAction);
    assert.equal(result.chosenAction.id, 'rest');
    assert.equal(restExecuted, true);
    assert.equal(result.result, 'resting');
});

test('Context-based action execution: patrol when calm, healthy, and energized', () => {
    let patrolExecuted = false;
    const ai = new UtilityAI({
        actions: createDefaultActions({
            onPatrol: () => { patrolExecuted = true; return 'patrolling'; }
        })
    });

    // Context: calm, full health, full stamina, no threats
    const calmContext = {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        dangerLevel: 0.0,
        target: null
    };

    const result = ai.evaluateAndExecute(calmContext);

    assert.equal(result.executed, true);
    assert.ok(result.chosenAction);
    assert.equal(result.chosenAction.id, 'patrol');
    assert.equal(patrolExecuted, true);
    assert.equal(result.result, 'patrolling');
});

test('Tie-breaking: deterministic resolution on equal scores by priority', () => {
    const ai = new UtilityAI({ useDefaultActions: false });

    // Two actions returning exact same utility score (0.80)
    const lowPriorityAction = new UtilityAction({
        id: 'action_low_prio',
        priority: 5,
        considerations: [() => 0.8]
    });

    const highPriorityAction = new UtilityAction({
        id: 'action_high_prio',
        priority: 20,
        considerations: [() => 0.8]
    });

    ai.registerAction(lowPriorityAction);
    ai.registerAction(highPriorityAction);

    const evalResult = ai.evaluate({});
    assert.ok(evalResult.chosenAction);
    assert.equal(evalResult.chosenAction.id, 'action_high_prio');
    assert.ok(evalResult.reason.includes('broke tie with \'action_low_prio\' by priority'));

    // Even if registration order is reversed, result remains strictly deterministic
    const aiReversed = new UtilityAI({ useDefaultActions: false });
    aiReversed.registerAction(highPriorityAction);
    aiReversed.registerAction(lowPriorityAction);

    const reversedEval = aiReversed.evaluate({});
    assert.equal(reversedEval.chosenAction.id, 'action_high_prio');
});

test('Tie-breaking: deterministic resolution on equal scores and equal priority by action ID', () => {
    const ai = new UtilityAI({ useDefaultActions: false });

    // Two actions with identical score (0.75) and identical priority (10)
    const actionBeta = new UtilityAction({
        id: 'bravo_action',
        priority: 10,
        considerations: [() => 0.75]
    });

    const actionAlpha = new UtilityAction({
        id: 'alpha_action',
        priority: 10,
        considerations: [() => 0.75]
    });

    ai.registerAction(actionBeta);
    ai.registerAction(actionAlpha);

    const evalResult = ai.evaluate({});
    assert.ok(evalResult.chosenAction);
    // 'alpha_action' comes before 'bravo_action' lexicographically
    assert.equal(evalResult.chosenAction.id, 'alpha_action');
    assert.ok(evalResult.reason.includes('broke tie with \'bravo_action\' by ID'));

    // Reverse insertion order
    const ai2 = new UtilityAI({ useDefaultActions: false });
    ai2.registerAction(actionAlpha);
    ai2.registerAction(actionBeta);
    const eval2 = ai2.evaluate({});
    assert.equal(eval2.chosenAction.id, 'alpha_action');
});

test('Fallback / no-action handling when all candidates fall below threshold', () => {
    const ai = new UtilityAI({
        defaultThreshold: 0.5,
        useDefaultActions: false
    });

    let executed = false;
    let cleanedUp = false;

    const weakAction = new UtilityAction({
        id: 'weak_candidate',
        priority: 1,
        considerations: [() => 0.25], // below 0.5 threshold
        execute: () => { executed = true; },
        cleanup: () => { cleanedUp = true; }
    });

    ai.registerAction(weakAction);

    const evalResult = ai.evaluate({});
    assert.equal(evalResult.chosenAction, null);
    assert.equal(evalResult.score, 0);
    assert.ok(evalResult.reason.includes('below threshold'));

    const runResult = ai.evaluateAndExecute({});
    assert.equal(runResult.chosenAction, null);
    assert.equal(runResult.executed, false);
    assert.equal(executed, false);

    // If an action was previously active, verify it is cleaned up when threshold not met
    ai.currentAction = weakAction;
    weakAction.isActive = true;

    const runAfterActive = ai.evaluateAndExecute({});
    assert.equal(runAfterActive.chosenAction, null);
    assert.equal(ai.currentAction, null);
    assert.equal(weakAction.isActive, false);
    assert.equal(cleanedUp, true);
});

test('Decision trace logging: explains chosen actions and records candidate scores', () => {
    const ai = new UtilityAI({
        actions: createDefaultActions()
    });

    ai.clearTraces();
    assert.equal(ai.getDecisionTraces().length, 0);

    // Decision 1: Low health -> flee
    ai.evaluateAndExecute({
        health: 15,
        maxHealth: 100,
        dangerLevel: 1.0,
        target: { id: 'boss' }
    });

    // Decision 2: Healthy, target in range -> attack
    ai.evaluateAndExecute({
        health: 95,
        maxHealth: 100,
        target: { id: 'goblin' },
        targetDistance: 10,
        attackRange: 50,
        dangerLevel: 0.5
    });

    const traces = ai.getDecisionTraces();
    assert.equal(traces.length, 2);

    const trace1 = traces[0];
    assert.equal(trace1.chosenAction, 'flee');
    assert.ok(trace1.chosenScore > 0.8);
    assert.ok(typeof trace1.reason === 'string');
    assert.ok(trace1.reason.includes('flee'));
    assert.ok(Array.isArray(trace1.candidates));
    assert.ok(trace1.candidates.length >= 5);

    // Verify candidate details in trace
    const fleeCandidate = trace1.candidates.find((c) => c.id === 'flee');
    assert.ok(fleeCandidate);
    assert.equal(fleeCandidate.passedThreshold, true);
    assert.ok(Array.isArray(fleeCandidate.considerations));
    assert.ok(fleeCandidate.considerations.length >= 2);

    const trace2 = traces[1];
    assert.equal(trace2.chosenAction, 'attack');
    assert.ok(trace2.reason.includes('attack'));

    const lastTrace = ai.getLastDecisionTrace();
    assert.equal(lastTrace.chosenAction, 'attack');

    // Test clearTraces()
    ai.clearTraces();
    assert.equal(ai.getDecisionTraces().length, 0);
    assert.equal(ai.getLastDecisionTrace(), null);
});

test('Decision trace logging: respects maxTraces capacity limit', () => {
    const ai = new UtilityAI({
        maxTraces: 3,
        useDefaultActions: false
    });

    const simpleAction = new UtilityAction({
        id: 'ping',
        considerations: [() => 0.9]
    });
    ai.registerAction(simpleAction);

    for (let i = 0; i < 7; i++) {
        ai.evaluate({});
    }

    const traces = ai.getDecisionTraces();
    assert.equal(traces.length, 3);
});

test('Interrupted action cleanup: active action cleaned up when superseded by higher-priority action', () => {
    let patrolCleanedUp = false;
    let patrolCleanupDetail = null;
    let patrolInterrupted = false;

    const patrol = new UtilityAction({
        id: 'patrol',
        priority: 5,
        threshold: 0.1,
        considerations: [(ctx) => (ctx.isPatrolling ? 0.7 : 0.0)],
        execute: () => 'patrolling',
        cleanup: (ctx, detail) => {
            patrolCleanedUp = true;
            patrolCleanupDetail = detail;
        },
        onInterrupt: () => {
            patrolInterrupted = true;
        }
    });

    const flee = new UtilityAction({
        id: 'flee',
        priority: 25,
        threshold: 0.1,
        considerations: [(ctx) => (ctx.isDanger ? 0.95 : 0.0)],
        execute: () => 'fleeing'
    });

    const ai = new UtilityAI({ useDefaultActions: false });
    ai.registerAction(patrol);
    ai.registerAction(flee);

    // Step 1: Start patrolling
    const step1 = ai.evaluateAndExecute({ isPatrolling: true, isDanger: false });
    assert.equal(step1.chosenAction.id, 'patrol');
    assert.equal(ai.currentAction.id, 'patrol');
    assert.equal(patrol.isActive, true);
    assert.equal(patrolCleanedUp, false);

    // Step 2: Danger arrives -> flee supersedes patrol
    const step2 = ai.evaluateAndExecute({ isPatrolling: true, isDanger: true });
    assert.equal(step2.chosenAction.id, 'flee');
    assert.equal(ai.currentAction.id, 'flee');
    assert.equal(flee.isActive, true);

    // Verify patrol action was cleanly interrupted
    assert.equal(patrol.isActive, false);
    assert.equal(patrolCleanedUp, true);
    assert.equal(patrolInterrupted, true);
    assert.ok(patrolCleanupDetail);
    assert.equal(patrolCleanupDetail.reason, 'interrupted');
    assert.equal(patrolCleanupDetail.supersededBy, 'flee');
});

test('Interrupted action cleanup: explicit interrupt() invocation resets active state and logs trace', () => {
    let cleanupDetail = null;
    let onInterruptCalled = false;
    let eventCallbackReceived = null;

    const action = new UtilityAction({
        id: 'channel_spell',
        priority: 10,
        considerations: [() => 0.8],
        cleanup: (ctx, detail) => {
            cleanupDetail = detail;
        },
        onInterrupt: () => {
            onInterruptCalled = true;
        }
    });

    const ai = new UtilityAI({
        useDefaultActions: false,
        onActionInterrupted: (act, reason) => {
            eventCallbackReceived = { actionId: act.id, reason };
        }
    });
    ai.registerAction(action);

    ai.evaluateAndExecute({});
    assert.equal(ai.currentAction.id, 'channel_spell');
    assert.equal(action.isActive, true);

    // Interrupt with higher priority event reason
    const wasInterrupted = ai.interrupt('stunned_by_lightning', { caster: 'boss' });
    assert.equal(wasInterrupted, true);
    assert.equal(ai.currentAction, null);
    assert.equal(action.isActive, false);

    assert.ok(cleanupDetail);
    assert.equal(cleanupDetail.reason, 'stunned_by_lightning');
    assert.equal(onInterruptCalled, true);
    assert.deepEqual(eventCallbackReceived, { actionId: 'channel_spell', reason: 'stunned_by_lightning' });

    // Decision traces record the interruption event
    const lastTrace = ai.getLastDecisionTrace();
    assert.ok(lastTrace);
    assert.equal(lastTrace.interruptedAction, 'channel_spell');
    assert.ok(lastTrace.reason.includes('stunned_by_lightning'));

    // Calling interrupt when no action is active returns false safely
    assert.equal(ai.interrupt('nothing_active'), false);
});

test('Composite consideration curves: evaluates curve transformations and multiplicative veto', () => {
    // Test UtilityCurves functions
    assert.equal(UtilityCurves.linear(0.5), 0.5);
    assert.equal(UtilityCurves.inverseLinear(0.2), 0.8);
    assert.equal(UtilityCurves.quadratic(0.5), 0.25);
    assert.equal(UtilityCurves.inverseQuadratic(0.5), 0.25);
    assert.equal(UtilityCurves.exponential(0.5, 3), 0.125);
    assert.equal(UtilityCurves.step(0.4, 0.5), 0);
    assert.equal(UtilityCurves.step(0.6, 0.5), 1);
    assert.equal(UtilityCurves.inverseStep(0.4, 0.5), 1);
    assert.equal(UtilityCurves.inverseStep(0.6, 0.5), 0);
    assert.equal(UtilityCurves.smoothstep(0.5), 0.5);

    // Multiplicative veto: if one consideration is 0, overall score is 0
    const vetoAction = new UtilityAction({
        id: 'veto_test',
        considerations: [
            new UtilityConsideration({ id: 'c1', evaluate: () => 0.9 }),
            new UtilityConsideration({ id: 'c2', evaluate: () => 0.0 }), // Veto
            new UtilityConsideration({ id: 'c3', evaluate: () => 0.9 })
        ]
    });

    const result = vetoAction.evaluate({});
    assert.equal(result.score, 0);

    // When all considerations pass
    const passingAction = new UtilityAction({
        id: 'pass_test',
        considerations: [
            new UtilityConsideration({ id: 'c1', evaluate: () => 0.5 }),
            new UtilityConsideration({ id: 'c2', evaluate: () => 0.5 })
        ]
    });
    const passResult = passingAction.evaluate({});
    assert.equal(passResult.score, 0.25);
});

test('Action management: dynamic registration, retrieval, and removal', () => {
    const ai = new UtilityAI({ useDefaultActions: false });
    assert.equal(ai.getActions().length, 0);

    const actA = ai.registerAction({ id: 'act_a', priority: 1 });
    const actB = ai.registerAction(new UtilityAction({ id: 'act_b', priority: 2 }));

    assert.equal(ai.getActions().length, 2);
    assert.equal(ai.getAction('act_a'), actA);
    assert.equal(ai.getAction('act_b'), actB);
    assert.equal(ai.getAction('nonexistent'), null);

    // Test removing action while active cleans it up
    ai.currentAction = actA;
    actA.isActive = true;

    const removed = ai.removeAction('act_a');
    assert.equal(removed, true);
    assert.equal(ai.actions.has('act_a'), false);
    assert.equal(ai.currentAction, null);
    assert.equal(actA.isActive, false);

    assert.equal(ai.removeAction('act_a'), false);
});

test('Context helpers: safe extraction across diverse entity and stats representations', () => {
    // Health extraction
    assert.equal(extractHealthFraction({ healthFraction: 0.42 }), 0.42);
    assert.equal(extractHealthFraction({ healthPercent: 75 }), 0.75);
    assert.equal(extractHealthFraction({ health: 50, maxHealth: 200 }), 0.25);
    assert.equal(extractHealthFraction({ stats: { health: 30, maxHealth: 60 } }), 0.5);
    assert.equal(extractHealthFraction({ combatant: { health: 20, maxHealth: 40 } }), 0.5);
    assert.equal(extractHealthFraction(null), 1.0);

    // Danger extraction
    assert.equal(extractDangerLevel({ dangerLevel: 0.6 }), 0.6);
    assert.equal(extractDangerLevel({ inDanger: true }), 1.0);
    assert.equal(extractDangerLevel({ inDanger: false }), 0.0);
    assert.equal(extractDangerLevel({ threats: ['orc'] }), 1.0);
    assert.equal(extractDangerLevel(null), 0.0);

    // Stamina extraction
    assert.equal(extractStaminaFraction({ staminaFraction: 0.8 }), 0.8);
    assert.equal(extractStaminaFraction({ stamina: 40, maxStamina: 80 }), 0.5);
    assert.equal(extractStaminaFraction({ energy: 90 }), 0.9);

    // Range score extraction
    assert.equal(extractRangeScore({ inAttackRange: true }), 1.0);
    assert.equal(extractRangeScore({ inRange: false }), 0.0);
    assert.equal(extractRangeScore({ target: {}, targetDistance: 20, attackRange: 50 }), 1.0);
    assert.equal(extractRangeScore({ target: {}, targetDistance: 100, attackRange: 50 }), 0.0);

    // Heal ability extraction
    assert.equal(extractCanHeal({ canHeal: true }), true);
    assert.equal(extractCanHeal({ potions: 3 }), true);
    assert.equal(extractCanHeal({ potions: 0 }), false);
    assert.equal(extractCanHeal({ healingItems: ['herb'] }), true);
    assert.equal(extractCanHeal({}), false);
});
