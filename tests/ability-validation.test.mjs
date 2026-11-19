import './setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABILITY_NODE_VOCABULARY,
  ABILITY_NODE_TYPES,
  AbilityValidator,
  AbilityValidationError,
  VALID_TARGET_TYPES,
  VALID_DIRECTION_MODES
} from '../src/larissa/abilityValidator.js';
import { Larissa } from '../src/neptune.js';

test('Fixed node vocabulary matches required specification', () => {
  const expectedVocabulary = [
    'target',
    'filter',
    'sequence',
    'condition',
    'projectile',
    'area_effect',
    'damage',
    'heal',
    'status',
    'knockback',
    'timed_action',
    'presentation'
  ];

  assert.deepEqual(Array.from(ABILITY_NODE_VOCABULARY), expectedVocabulary);
  assert.deepEqual(Array.from(ABILITY_NODE_TYPES), expectedVocabulary);
  assert.equal(Object.isFrozen(ABILITY_NODE_VOCABULARY), true);

  // Also exported via Larissa namespace
  assert.equal(Larissa.AbilityValidator, AbilityValidator);
  assert.equal(Larissa.AbilityValidationError, AbilityValidationError);
  assert.deepEqual(Array.from(Larissa.ABILITY_NODE_VOCABULARY), expectedVocabulary);
});

test('Proof ability 1: projectile fireball passes validation', () => {
  const fireballDef = {
    id: 'projectile_fireball',
    name: 'Fireball',
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

  const result = AbilityValidator.validate(fireballDef);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);

  const asserted = AbilityValidator.assertValid(fireballDef);
  assert.equal(asserted.valid, true);
});

test('Proof ability 2: melee cleave passes validation', () => {
  const meleeCleaveDef = {
    id: 'melee_cleave',
    name: 'Melee Cleave',
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

  const result = AbilityValidator.validate(meleeCleaveDef);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);

  const asserted = AbilityValidator.assertValid(meleeCleaveDef);
  assert.equal(asserted.valid, true);
});

test('Proof ability 3: self-buff / heal passes validation with branches', () => {
  const selfHealDef = {
    id: 'rejuvenation',
    name: 'Rejuvenation',
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

  const result = AbilityValidator.validate(selfHealDef);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);

  const asserted = AbilityValidator.assertValid(selfHealDef);
  assert.equal(asserted.valid, true);
});

test('Validates ability definitions with array node format', () => {
  const arrayDef = {
    id: 'smite',
    name: 'Smite',
    entryNodeId: 'target_node',
    nodes: [
      { id: 'target_node', type: 'target', mode: 'nearest_enemy', range: 120, next: 'smite_damage' },
      { id: 'smite_damage', type: 'damage', amount: 50, damageType: 'holy' }
    ]
  };

  const result = AbilityValidator.validate(arrayDef);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.doesNotThrow(() => AbilityValidator.assertValid(arrayDef));
});

test('Rejects invalid root structures and missing root fields', () => {
  const nullResult = AbilityValidator.validate(null);
  assert.equal(nullResult.valid, false);
  assert.equal(nullResult.errors.some(e => e.code === 'INVALID_ROOT'), true);

  const emptyDefResult = AbilityValidator.validate({});
  assert.equal(emptyDefResult.valid, false);
  const rootFieldErrors = emptyDefResult.errors.filter(e => e.code === 'MISSING_ROOT_FIELD');
  assert.equal(rootFieldErrors.length >= 4, true);

  const emptyNodesResult = AbilityValidator.validate({
    id: 'bad',
    name: 'Bad',
    entryNodeId: 'start',
    nodes: {}
  });
  assert.equal(emptyNodesResult.valid, false);
  assert.equal(emptyNodesResult.errors.some(e => e.code === 'EMPTY_NODES'), true);
});

test('Rejects missing entry node or entry node not in nodes', () => {
  const missingEntryDef = {
    id: 'ghost_entry',
    name: 'Ghost Entry',
    entryNodeId: 'nonexistent_node',
    nodes: {
      actual_node: {
        type: 'damage',
        amount: 10
      }
    }
  };

  const result = AbilityValidator.validate(missingEntryDef);
  assert.equal(result.valid, false);
  const entryErr = result.errors.find(e => e.code === 'MISSING_ENTRY_NODE');
  assert.ok(entryErr, 'Missing entry node error should be present');
  assert.equal(entryErr.nodeId, 'nonexistent_node');
  assert.equal(entryErr.path, 'entryNodeId');

  assert.throws(
    () => AbilityValidator.assertValid(missingEntryDef),
    err => {
      assert.ok(err instanceof AbilityValidationError);
      assert.match(err.message, /MISSING_ENTRY_NODE/);
      assert.match(err.message, /nonexistent_node/);
      return true;
    }
  );
});

test('Rejects missing child, target, and next node references', () => {
  const brokenReferencesDef = {
    id: 'broken_refs',
    name: 'Broken Refs',
    entryNodeId: 'seq',
    nodes: {
      seq: {
        type: 'sequence',
        children: ['valid_step', 'missing_child']
      },
      valid_step: {
        type: 'target',
        mode: 'cursor',
        next: 'missing_next',
        targetNode: 'missing_target'
      },
      cond: {
        type: 'condition',
        onTrue: 'missing_true',
        onFalse: 'missing_false'
      },
      proj: {
        type: 'projectile',
        speed: 100,
        onHit: ['missing_hit1', 'missing_hit2']
      },
      timed: {
        type: 'timed_action',
        duration: 1,
        onComplete: 'missing_complete'
      }
    }
  };

  const result = AbilityValidator.validate(brokenReferencesDef);
  assert.equal(result.valid, false);

  const missingRefs = result.errors.filter(e => e.code === 'MISSING_NODE_REFERENCE');
  assert.ok(missingRefs.some(e => e.message.includes('missing_child')));
  assert.ok(missingRefs.some(e => e.message.includes('missing_next')));
  assert.ok(missingRefs.some(e => e.message.includes('missing_target')));
  assert.ok(missingRefs.some(e => e.message.includes('missing_true')));
  assert.ok(missingRefs.some(e => e.message.includes('missing_false')));
  assert.ok(missingRefs.some(e => e.message.includes('missing_hit1')));
  assert.ok(missingRefs.some(e => e.message.includes('missing_complete')));
});

test('Rejects unknown node types', () => {
  const unknownTypeDef = {
    id: 'unknown_nodes',
    name: 'Unknown Nodes',
    entryNodeId: 'alien_node',
    nodes: {
      alien_node: {
        type: 'laser_satellite',
        power: 9000
      },
      summon_node: {
        type: 'summon_golem',
        count: 2
      }
    }
  };

  const result = AbilityValidator.validate(unknownTypeDef);
  assert.equal(result.valid, false);
  const unknownErrors = result.errors.filter(e => e.code === 'UNKNOWN_NODE_TYPE');
  assert.equal(unknownErrors.length, 2);
  assert.ok(unknownErrors.some(e => e.message.includes('laser_satellite')));
  assert.ok(unknownErrors.some(e => e.message.includes('summon_golem')));

  assert.throws(
    () => AbilityValidator.assertValid(unknownTypeDef),
    err => {
      assert.ok(err instanceof AbilityValidationError);
      assert.match(err.message, /UNKNOWN_NODE_TYPE/);
      return true;
    }
  );
});

test('Rejects wrong target types and invalid direction modes', () => {
  const invalidTargetAndDirDef = {
    id: 'bad_target_and_dir',
    name: 'Bad Target and Dir',
    entryNodeId: 'target_node',
    nodes: {
      target_node: {
        type: 'target',
        targetType: 'invulnerable_alien_spacecraft',
        mode: 'subterranean_radar',
        next: 'filter_node'
      },
      filter_node: {
        type: 'filter',
        targetType: 'non_existent_faction',
        next: 'proj_node'
      },
      proj_node: {
        type: 'projectile',
        speed: 150,
        direction: 'sideways_through_time',
        next: 'kb_node'
      },
      kb_node: {
        type: 'knockback',
        force: 50,
        direction: 'nowhere_fast'
      }
    }
  };

  const result = AbilityValidator.validate(invalidTargetAndDirDef);
  assert.equal(result.valid, false);

  const targetTypeErrors = result.errors.filter(e => e.code === 'INVALID_TARGET_TYPE');
  assert.ok(targetTypeErrors.length >= 2, 'Should reject invalid targetType and targeting mode');

  const dirErrors = result.errors.filter(e => e.code === 'INVALID_DIRECTION_MODE');
  assert.ok(dirErrors.length >= 2, 'Should reject invalid direction modes');
});

test('Rejects out-of-range numeric properties', () => {
  const badNumbersDef = {
    id: 'negative_numbers',
    name: 'Negative Numbers',
    entryNodeId: 'bad_damage',
    nodes: {
      bad_damage: {
        type: 'damage',
        amount: -25,
        multiplier: -2,
        criticalChance: 1.5,
        next: 'bad_heal'
      },
      bad_heal: {
        type: 'heal',
        amount: 0,
        next: 'bad_proj'
      },
      bad_proj: {
        type: 'projectile',
        speed: -100,
        range: 0,
        radius: -5,
        duration: -1,
        next: 'bad_area'
      },
      bad_area: {
        type: 'area_effect',
        radius: -10,
        width: 0,
        duration: -2,
        tickRate: -0.5,
        next: 'bad_status'
      },
      bad_status: {
        type: 'status',
        name: 'poison',
        duration: 0,
        stacks: -2,
        next: 'bad_knockback'
      },
      bad_knockback: {
        type: 'knockback',
        force: -50,
        duration: -0.1,
        next: 'bad_timed'
      },
      bad_timed: {
        type: 'timed_action',
        duration: -1
      }
    }
  };

  const result = AbilityValidator.validate(badNumbersDef);
  assert.equal(result.valid, false);

  const numericErrors = result.errors.filter(e => e.code === 'OUT_OF_RANGE_NUMERIC');
  assert.ok(numericErrors.length >= 10, `Expected multiple numeric errors, got ${numericErrors.length}`);
  assert.ok(numericErrors.some(e => e.nodeId === 'bad_damage' && e.message.includes('amount')));
  assert.ok(numericErrors.some(e => e.nodeId === 'bad_heal' && e.message.includes('amount')));
  assert.ok(numericErrors.some(e => e.nodeId === 'bad_proj' && e.message.includes('speed')));
  assert.ok(numericErrors.some(e => e.nodeId === 'bad_area' && e.message.includes('radius')));
  assert.ok(numericErrors.some(e => e.nodeId === 'bad_timed' && e.message.includes('duration')));
  assert.ok(numericErrors.some(e => e.nodeId === 'bad_knockback' && e.message.includes('force')));
});

test('Detects directed cycles in sequence flow with diagnosed node paths', () => {
  const sequenceCycleDef = {
    id: 'seq_cycle',
    name: 'Sequence Cycle',
    entryNodeId: 'seq_root',
    nodes: {
      seq_root: {
        type: 'sequence',
        children: ['step_a']
      },
      step_a: {
        type: 'target',
        mode: 'cursor',
        next: 'step_b'
      },
      step_b: {
        type: 'damage',
        amount: 10,
        next: 'seq_root'
      }
    }
  };

  const result = AbilityValidator.validate(sequenceCycleDef);
  assert.equal(result.valid, false);

  const cycleError = result.errors.find(e => e.code === 'CYCLE_DETECTED');
  assert.ok(cycleError, 'Cycle error must be diagnosed');
  assert.equal(cycleError.code, 'CYCLE_DETECTED');
  assert.match(cycleError.message, /seq_root -> step_a -> step_b -> seq_root/);
  assert.deepEqual(cycleError.nodePath, ['seq_root', 'step_a', 'step_b', 'seq_root']);

  assert.throws(
    () => AbilityValidator.assertValid(sequenceCycleDef),
    err => {
      assert.ok(err instanceof AbilityValidationError);
      assert.match(err.message, /CYCLE_DETECTED/);
      assert.match(err.message, /seq_root -> step_a -> step_b -> seq_root/);
      return true;
    }
  );
});

test('Detects directed cycles in condition branches with diagnosed node paths', () => {
  const conditionCycleDef = {
    id: 'condition_cycle',
    name: 'Condition Cycle',
    entryNodeId: 'branch_decision',
    nodes: {
      branch_decision: {
        type: 'condition',
        check: 'is_enraged',
        onTrue: 'enrage_buff',
        onFalse: 'calm_action'
      },
      enrage_buff: {
        type: 'status',
        name: 'enraged',
        duration: 5,
        next: 'branch_decision'
      },
      calm_action: {
        type: 'presentation',
        duration: 0.2
      }
    }
  };

  const result = AbilityValidator.validate(conditionCycleDef);
  assert.equal(result.valid, false);

  const cycleError = result.errors.find(e => e.code === 'CYCLE_DETECTED');
  assert.ok(cycleError, 'Cycle error must be diagnosed');
  assert.match(cycleError.message, /branch_decision -> enrage_buff -> branch_decision/);
  assert.deepEqual(cycleError.nodePath, ['branch_decision', 'enrage_buff', 'branch_decision']);
});

test('Detects self-referencing single node cycles', () => {
  const selfCycleDef = {
    id: 'self_cycle',
    name: 'Self Cycle',
    entryNodeId: 'loop_forever',
    nodes: {
      loop_forever: {
        type: 'timed_action',
        duration: 1,
        next: 'loop_forever'
      }
    }
  };

  const result = AbilityValidator.validate(selfCycleDef);
  assert.equal(result.valid, false);

  const cycleError = result.errors.find(e => e.code === 'CYCLE_DETECTED');
  assert.ok(cycleError);
  assert.match(cycleError.message, /loop_forever -> loop_forever/);
  assert.deepEqual(cycleError.nodePath, ['loop_forever', 'loop_forever']);
});

test('Does not misidentify DAG diamond shapes as cycles', () => {
  // DAG Diamond:
  //      root
  //     /    \
  //   left   right
  //     \    /
  //      merge
  //        |
  //       end
  const diamondDef = {
    id: 'dag_diamond',
    name: 'DAG Diamond',
    entryNodeId: 'root_cond',
    nodes: {
      root_cond: {
        type: 'condition',
        check: 'test_flag',
        onTrue: 'left_branch',
        onFalse: 'right_branch'
      },
      left_branch: {
        type: 'timed_action',
        duration: 0.1,
        next: 'merge_damage'
      },
      right_branch: {
        type: 'presentation',
        duration: 0.1,
        next: 'merge_damage'
      },
      merge_damage: {
        type: 'damage',
        amount: 20
      }
    }
  };

  const result = AbilityValidator.validate(diamondDef);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.doesNotThrow(() => AbilityValidator.assertValid(diamondDef));
});

test('Warns about unreachable nodes while preserving validity if no errors', () => {
  const unreachableDef = {
    id: 'unreachable_sample',
    name: 'Unreachable Sample',
    entryNodeId: 'main_node',
    nodes: {
      main_node: {
        type: 'damage',
        amount: 15
      },
      orphan_node: {
        type: 'presentation',
        duration: 0.5
      }
    }
  };

  const result = AbilityValidator.validate(unreachableDef);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].nodeId, 'orphan_node');
  assert.match(result.warnings[0].message, /unreachable/);
});

test('AbilityValidator instance methods delegate to static methods', () => {
  const validator = new AbilityValidator();
  const simpleDef = {
    id: 'instance_test',
    name: 'Instance Test',
    entryNodeId: 'start',
    nodes: {
      start: { type: 'damage', amount: 5 }
    }
  };

  const result = validator.validate(simpleDef);
  assert.equal(result.valid, true);
  const asserted = validator.assertValid(simpleDef);
  assert.equal(asserted.valid, true);
});
