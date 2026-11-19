import './setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AbilityExecutor,
  AbilityBudgetExceededError,
  AbilityExecutionError
} from '../src/larissa/abilityExecutor.js';
import {
  AbilityValidator,
  AbilityValidationError
} from '../src/larissa/abilityValidator.js';
import { Combatant, Stats } from '../src/larissa/index.js';
import { Larissa, AbilityExecutor as NeptuneAbilityExecutor } from '../src/neptune.js';

// ============================================================================
// Proof Ability Definitions from ABILITY-01 specification
// ============================================================================

const fireballDef = {
  id: 'projectile_fireball',
  name: 'Fireball',
  cooldown: 1.5,
  entryNodeId: 'cast_sequence',
  nodes: {
    cast_sequence: {
      type: 'sequence',
      children: ['target_cursor', 'launch_projectile']
    },
    target_cursor: {
      type: 'target',
      mode: 'cursor',
      targetType: 'point',
      range: 400
    },
    launch_projectile: {
      type: 'projectile',
      speed: 300,
      range: 400,
      radius: 8,
      direction: 'cursor',
      onHit: 'impact_area'
    },
    impact_area: {
      type: 'area_effect',
      radius: 48,
      onHit: 'fire_damage'
    },
    fire_damage: {
      type: 'damage',
      amount: 45,
      damageType: 'fire',
      next: 'burn_status'
    },
    burn_status: {
      type: 'status',
      name: 'burning',
      duration: 3,
      stacks: 1,
      next: 'explosion_presentation'
    },
    explosion_presentation: {
      type: 'presentation',
      duration: 0.5
    }
  }
};

const meleeCleaveDef = {
  id: 'melee_cleave',
  name: 'Melee Cleave',
  cooldown: 2.0,
  entryNodeId: 'cleave_sequence',
  nodes: {
    cleave_sequence: {
      type: 'sequence',
      children: ['windup_delay', 'cone_target', 'cleave_fx']
    },
    windup_delay: {
      type: 'timed_action',
      duration: 0.12
    },
    cone_target: {
      type: 'target',
      mode: 'cone',
      angle: 90,
      range: 64,
      next: 'enemy_filter'
    },
    enemy_filter: {
      type: 'filter',
      targetType: 'enemy',
      maxTargets: 5,
      next: 'slash_damage'
    },
    slash_damage: {
      type: 'damage',
      amount: 28,
      damageType: 'physical',
      next: 'cleave_knockback'
    },
    cleave_knockback: {
      type: 'knockback',
      force: 140,
      direction: 'away_from_caster',
      duration: 0.2
    },
    cleave_fx: {
      type: 'presentation',
      duration: 0.25
    }
  }
};

const selfHealDef = {
  id: 'rejuvenation',
  name: 'Rejuvenation',
  cooldown: 3.0,
  entryNodeId: 'rejuv_sequence',
  nodes: {
    rejuv_sequence: {
      type: 'sequence',
      children: ['target_self', 'check_hp']
    },
    target_self: {
      type: 'target',
      mode: 'self',
      targetType: 'self'
    },
    check_hp: {
      type: 'condition',
      check: 'health_below_max',
      onTrue: 'apply_heal',
      onFalse: 'buff_status'
    },
    apply_heal: {
      type: 'heal',
      amount: 35,
      next: 'buff_status'
    },
    buff_status: {
      type: 'status',
      name: 'regeneration',
      duration: 5,
      next: 'glow_presentation'
    },
    glow_presentation: {
      type: 'presentation',
      duration: 0.4
    }
  }
};

// ============================================================================
// Tests
// ============================================================================

test('ABILITY-02: Module exports and re-exports match contract', () => {
  assert.equal(typeof AbilityExecutor, 'function');
  assert.equal(typeof AbilityBudgetExceededError, 'function');
  assert.equal(typeof AbilityExecutionError, 'function');

  // Exported in Larissa namespace
  assert.equal(Larissa.AbilityExecutor, AbilityExecutor);
  assert.equal(Larissa.AbilityBudgetExceededError, AbilityBudgetExceededError);
  assert.equal(Larissa.AbilityExecutionError, AbilityExecutionError);

  // Exported in Neptune root
  assert.equal(NeptuneAbilityExecutor, AbilityExecutor);
});

test('ABILITY-02: Proof ability 1 (Fireball projectile) travels, impacts, applies fire damage, status, and presentation', () => {
  const executor = new AbilityExecutor();
  const events = [];
  executor.on('presentation', e => events.push(e));
  executor.on('damage', e => events.push(e));
  executor.on('projectile_hit', e => events.push(e));

  const caster = new Combatant({ id: 'pyromancer', faction: 'hero', x: 0, y: 0 });
  const goblin = new Combatant({
    id: 'goblin',
    faction: 'monsters',
    x: 150,
    y: 0,
    maxHealth: 100,
    health: 100,
    hurtbox: { width: 16, height: 16 }
  });

  // Cast Fireball towards cursor at (150, 0)
  const result = executor.execute(fireballDef, {
    caster,
    cursor: { x: 150, y: 0 },
    actors: [goblin]
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'running');
  assert.equal(executor.getActiveInstances().length, 1);

  // Before projectile arrives: goblin is untouched
  assert.equal(goblin.health, 100);

  // Advance time: 0.25s at 300 speed = 75 units traveled (at x=75, goblin at x=150)
  executor.update(0.25);
  assert.equal(goblin.health, 100);
  assert.equal(executor.getActiveInstances().length, 1);

  // Advance time: another 0.3s (travels 90 more units, reaches 165 >= 150, hits goblin!)
  executor.update(0.3);

  // Goblin took 45 fire damage
  assert.equal(goblin.health, 55);

  // Goblin received burning status for 3 seconds
  assert.ok(goblin.effects.some(e => e.name === 'burning' && e.duration === 3));

  // Presentation event emitted
  assert.ok(events.some(e => e.type === 'presentation' && e.cue === 'explosion_presentation'));

  // Execution completed cleanly
  assert.equal(result.instance.status, 'completed');
  assert.equal(executor.getActiveInstances().length, 0);
});

test('ABILITY-02: Proof ability 2 (Melee Cleave) enforces windup delay, cone targeting, enemy filter, damage, and knockback', () => {
  const executor = new AbilityExecutor();
  const presentationCues = [];
  executor.on('presentation:cue', cue => presentationCues.push(cue));

  const caster = new Combatant({ id: 'knight', faction: 'hero', x: 0, y: 0 });

  let enemy1Knocked = false;
  let enemy2Knocked = false;

  // In-cone enemy 1 (at x=30, y=0)
  const enemy1 = new Combatant({
    id: 'orc1',
    faction: 'monsters',
    x: 30,
    y: 0,
    maxHealth: 100,
    health: 100,
    body: {
      applyKnockback(x, y) {
        if (x > 0) enemy1Knocked = true;
      }
    }
  });

  // In-cone enemy 2 (at x=25, y=15)
  const enemy2 = new Combatant({
    id: 'orc2',
    faction: 'monsters',
    x: 25,
    y: 15,
    maxHealth: 100,
    health: 100,
    body: {
      applyKnockback(x, y) {
        if (x > 0) enemy2Knocked = true;
      }
    }
  });

  // In-cone ally (at x=20, y=0)
  const ally = new Combatant({
    id: 'cleric',
    faction: 'hero',
    x: 20,
    y: 0,
    maxHealth: 100,
    health: 100
  });

  // Out of range enemy (at x=100, y=0, range is 64)
  const farEnemy = new Combatant({
    id: 'far_orc',
    faction: 'monsters',
    x: 100,
    y: 0,
    maxHealth: 100,
    health: 100
  });

  // Execute Cleave aiming along positive X axis
  const result = executor.execute(meleeCleaveDef, {
    caster,
    cursor: { x: 50, y: 0 },
    actors: [enemy1, enemy2, ally, farEnemy]
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'running');

  // During windup (0.06s of 0.12s): no damage or knockback applied yet
  executor.update(0.06);
  assert.equal(enemy1.health, 100);
  assert.equal(enemy2.health, 100);
  assert.equal(enemy1Knocked, false);

  // When windup finishes (0.06s more, total 0.12s)
  executor.update(0.06);

  // Enemy 1 and 2 took 28 damage
  assert.equal(enemy1.health, 72);
  assert.equal(enemy2.health, 72);
  assert.equal(enemy1Knocked, true);
  assert.equal(enemy2Knocked, true);

  // Ally is filtered out and untouched
  assert.equal(ally.health, 100);

  // Far enemy was outside cone range and untouched
  assert.equal(farEnemy.health, 100);

  // Cleave fx presentation cue emitted
  assert.ok(presentationCues.some(c => c.cue === 'cleave_fx'));
  assert.equal(result.instance.status, 'completed');
  assert.equal(executor.getActiveInstances().length, 0);
});

test('ABILITY-02: Proof ability 3 (Self-buff / heal) branches conditionally on health below max', () => {
  const executor = new AbilityExecutor();

  // Case A: Caster is injured (health: 60/100) -> heals 35 and gains regeneration
  const injuredCaster = new Combatant({
    id: 'paladin',
    faction: 'hero',
    maxHealth: 100,
    health: 60
  });

  const resInjured = executor.execute(selfHealDef, { caster: injuredCaster });
  assert.equal(resInjured.success, true);
  assert.equal(resInjured.status, 'completed');
  assert.equal(injuredCaster.health, 95);
  assert.ok(injuredCaster.effects.some(e => e.name === 'regeneration' && e.duration === 5));

  // Case B: Caster is full health (100/100) -> onFalse branch bypasses heal, gains regeneration
  const fullCaster = new Combatant({
    id: 'paladin_full',
    faction: 'hero',
    maxHealth: 100,
    health: 100
  });

  const resFull = executor.execute(selfHealDef, { caster: fullCaster });
  assert.equal(resFull.success, true);
  assert.equal(resFull.status, 'completed');
  assert.equal(fullCaster.health, 100);
  assert.ok(fullCaster.effects.some(e => e.name === 'regeneration' && e.duration === 5));
});

test('ABILITY-02: Proof ability executes and modifies Stats component directly and through Combatant binding', () => {
  const executor = new AbilityExecutor();

  // Standalone Stats component
  const stats = new Stats({ maxHealth: 100, health: 50, defense: 0 });
  const healDef = {
    id: 'simple_heal',
    name: 'Simple Heal',
    entryNodeId: 'heal_node',
    nodes: {
      heal_node: {
        type: 'heal',
        amount: 25
      }
    }
  };

  executor.execute(healDef, { caster: stats, targets: [stats] });
  assert.equal(stats.health, 75);

  // Bound Stats component to Combatant
  const combatant = new Combatant({ id: 'hero', maxHealth: 100, health: 75 });
  stats.bindCombatant(combatant);

  const damageDef = {
    id: 'direct_smite',
    name: 'Smite',
    entryNodeId: 'smite_dmg',
    nodes: {
      smite_dmg: {
        type: 'damage',
        amount: 30,
        damageType: 'physical'
      }
    }
  };

  executor.execute(damageDef, { caster: stats, targets: [stats] });
  assert.equal(combatant.health, 45);
  assert.equal(stats.health, 45);
});

test('ABILITY-02: Caster death mid-cast cleanly halts and cancels active delay/sequence', () => {
  const executor = new AbilityExecutor();
  const cancelledEvents = [];
  executor.on('ability:cancelled', e => cancelledEvents.push(e));

  const caster = new Combatant({ id: 'caster', faction: 'hero', maxHealth: 100, health: 100 });
  const enemy = new Combatant({ id: 'enemy', faction: 'monsters', x: 20, y: 0, maxHealth: 100, health: 100 });

  // Cast melee cleave (has 0.12s windup delay)
  const result = executor.execute(meleeCleaveDef, {
    caster,
    cursor: { x: 50, y: 0 },
    actors: [enemy]
  });

  assert.equal(result.status, 'running');
  assert.equal(executor.getActiveInstances().length, 1);

  // Mid-cast: caster dies before windup elapses
  caster.setHealth(0);
  assert.equal(caster.isAlive, false);

  // Update time for the windup delay
  executor.update(0.12);

  // Execution must be cancelled, not finished
  assert.equal(result.instance.status, 'cancelled');
  assert.equal(result.instance.cancelReason, 'caster_death');
  assert.equal(executor.getActiveInstances().length, 0);

  // Enemy never received damage
  assert.equal(enemy.health, 100);
  assert.ok(cancelledEvents.some(e => e.reason === 'caster_death'));
});

test('ABILITY-02: Missing target handling safely handles null, empty, or destroyed targets', () => {
  const executor = new AbilityExecutor();

  const caster = new Combatant({ id: 'caster', faction: 'hero', x: 0, y: 0 });

  // 1. Cleave with empty actors list (no targets found)
  assert.doesNotThrow(() => {
    const res = executor.execute(meleeCleaveDef, {
      caster,
      cursor: { x: 50, y: 0 },
      actors: []
    });
    executor.update(0.15);
    assert.equal(res.instance.status, 'completed');
  });

  // 2. Direct damage with null target
  const singleDamageDef = {
    id: 'bolt',
    name: 'Bolt',
    entryNodeId: 'bolt_damage',
    nodes: {
      bolt_damage: {
        type: 'damage',
        amount: 20
      }
    }
  };

  assert.doesNotThrow(() => {
    const res = executor.execute(singleDamageDef, {
      caster,
      target: null
    });
    assert.equal(res.status, 'completed');
  });

  // 3. Target dies during projectile travel before hit
  const enemy = new Combatant({ id: 'target_goblin', faction: 'monsters', x: 100, y: 0, maxHealth: 50, health: 50 });
  const projRes = executor.execute(fireballDef, {
    caster,
    cursor: { x: 100, y: 0 },
    actors: [enemy]
  });

  // Destroy enemy while projectile is mid-air
  executor.update(0.1);
  enemy.destroy();
  enemy.setHealth(0);

  // Finish projectile arrival
  assert.doesNotThrow(() => {
    executor.update(0.5);
    assert.equal(projRes.instance.status, 'completed');
  });
});

test('ABILITY-02: Cooldown management tracks and enforces cooldowns per ability and caster', () => {
  const executor = new AbilityExecutor();
  const caster = new Combatant({ id: 'hero', faction: 'hero' });
  const target = new Combatant({ id: 'dummy', faction: 'monsters' });

  const cdDef = {
    id: 'shield_slam',
    name: 'Shield Slam',
    cooldown: 2.0,
    entryNodeId: 'slam_damage',
    nodes: {
      slam_damage: {
        type: 'damage',
        amount: 15
      }
    }
  };

  // First cast: succeeds
  const first = executor.execute(cdDef, { caster, target });
  assert.equal(first.success, true);
  assert.equal(executor.isOnCooldown(caster.id, cdDef.id), true);
  assert.equal(executor.getCooldown(caster.id, cdDef.id), 2.0);

  // Immediate second cast: blocked by cooldown
  const second = executor.execute(cdDef, { caster, target });
  assert.equal(second.success, false);
  assert.equal(second.reason, 'cooldown');
  assert.equal(second.status, 'blocked');
  assert.equal(second.remainingCooldown, 2.0);

  // Advance 1.0s: still on cooldown
  executor.update(1.0);
  assert.equal(executor.isOnCooldown(caster.id, cdDef.id), true);
  assert.equal(executor.getCooldown(caster.id, cdDef.id), 1.0);

  // Advance 1.0s: cooldown expires
  executor.update(1.0);
  assert.equal(executor.isOnCooldown(caster.id, cdDef.id), false);
  assert.equal(executor.getCooldown(caster.id, cdDef.id), 0);

  // Third cast: succeeds
  const third = executor.execute(cdDef, { caster, target });
  assert.equal(third.success, true);

  // Reset cooldown manually
  executor.resetCooldown(caster.id, cdDef.id);
  assert.equal(executor.isOnCooldown(caster.id, cdDef.id), false);

  // Reset all cooldowns
  executor.setCooldown('casterA', 'abilityX', 5);
  executor.setCooldown('casterB', 'abilityY', 5);
  executor.resetAllCooldowns();
  assert.equal(executor.isOnCooldown('casterA', 'abilityX'), false);
  assert.equal(executor.isOnCooldown('casterB', 'abilityY'), false);
});

test('ABILITY-02: cancelAll and cancelByCaster cleanly cancel active executions', () => {
  const executor = new AbilityExecutor();

  const casterA = new Combatant({ id: 'casterA', faction: 'hero' });
  const casterB = new Combatant({ id: 'casterB', faction: 'hero' });

  // Both start long delays
  const longDelayDef = {
    id: 'channel',
    name: 'Channel',
    entryNodeId: 'delay_node',
    nodes: {
      delay_node: {
        type: 'timed_action',
        duration: 5.0
      }
    }
  };

  const resA = executor.execute(longDelayDef, { caster: casterA });
  const resB = executor.execute(longDelayDef, { caster: casterB });

  assert.equal(executor.getActiveInstances().length, 2);

  // Cancel only caster A
  const cancelledCount = executor.cancelByCaster('casterA');
  assert.equal(cancelledCount, 1);
  assert.equal(resA.instance.status, 'cancelled');
  assert.equal(executor.getActiveInstances().length, 1);
  assert.equal(resB.instance.status, 'running');

  // Cancel all remaining
  const allCancelled = executor.cancelAll();
  assert.equal(allCancelled, 1);
  assert.equal(resB.instance.status, 'cancelled');
  assert.equal(executor.getActiveInstances().length, 0);
});

test('ABILITY-02: Execution operation budget prevents runaway processing and throws AbilityBudgetExceededError', () => {
  // Executor with very strict operation budget
  const strictExecutor = new AbilityExecutor({ maxOperationsPerTick: 3 });

  const caster = new Combatant({ id: 'caster', faction: 'hero' });

  // Ability with 5 nodes in sequence
  const fiveNodeDef = {
    id: 'multi_node',
    name: 'Multi Node',
    entryNodeId: 'seq',
    nodes: {
      seq: {
        type: 'sequence',
        children: ['n1', 'n2', 'n3', 'n4']
      },
      n1: { type: 'presentation', duration: 0.1 },
      n2: { type: 'presentation', duration: 0.1 },
      n3: { type: 'presentation', duration: 0.1 },
      n4: { type: 'presentation', duration: 0.1 }
    }
  };

  // Exceeds maxOperationsPerTick = 3
  assert.throws(() => {
    strictExecutor.execute(fiveNodeDef, { caster });
  }, AbilityBudgetExceededError);

  // Normal executor with standard budget executes fiveNodeDef without error
  const standardExecutor = new AbilityExecutor({ maxOperationsPerTick: 100 });
  assert.doesNotThrow(() => {
    const res = standardExecutor.execute(fiveNodeDef, { caster });
    assert.equal(res.status, 'completed');
  });

  // Exceeding budget during update(dt)
  const delayThenManyDef = {
    id: 'delay_many',
    name: 'Delay Many',
    entryNodeId: 'seq',
    nodes: {
      seq: {
        type: 'sequence',
        children: ['delay_step', 'step1', 'step2', 'step3']
      },
      delay_step: { type: 'timed_action', duration: 0.1 },
      step1: { type: 'presentation', duration: 0 },
      step2: { type: 'presentation', duration: 0 },
      step3: { type: 'presentation', duration: 0 }
    }
  };

  const budgetedExecutor = new AbilityExecutor({ maxOperationsPerTick: 100 });
  budgetedExecutor.execute(delayThenManyDef, { caster });
  assert.equal(budgetedExecutor.getActiveInstances().length, 1);

  // Set tight budget before tick update
  budgetedExecutor.maxOperationsPerTick = 2;
  assert.throws(() => {
    budgetedExecutor.update(0.1);
  }, AbilityBudgetExceededError);
});

test('ABILITY-02: Invalid ability definition throws AbilityValidationError on execute', () => {
  const executor = new AbilityExecutor();
  const invalidDef = {
    id: 'bad_ability',
    name: 'Bad',
    entryNodeId: 'missing_node',
    nodes: {}
  };

  assert.throws(() => {
    executor.execute(invalidDef);
  }, AbilityValidationError);
});
