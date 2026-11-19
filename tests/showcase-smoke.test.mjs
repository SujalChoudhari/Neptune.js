import '../tests/setup_mocks.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  worldMetadata, navGrid, cellSim, materialReg, audioBuses,
  progression, statusEffects, itemRegistry, inventory, equipment, lootTable,
  facts, eventBus, ruleEngine, storyGraph, factions, schedule, scheduleSystem,
  perception, utilityAI, player, npc, saveEngine, updateShowcase
} from '../examples/showcase/showcase.js';

test('Showcase: world metadata & terrain registrations are valid', () => {
  const stone = worldMetadata.getTile('stone');
  assert.equal(stone.traversalCost, Infinity);

  const bridge = worldMetadata.getTile('bridge');
  assert.equal(bridge.elevation, 1);
});

test('Showcase: navigation grid computes valid A* path avoiding obstacles', () => {
  const path = navGrid.findPath(2, 2, 6, 2);
  assert.ok(path, 'path should exist');
  assert.ok(path.length > 0, 'path length > 0');
  assert.equal(path[path.length - 1].x, 6);
  assert.equal(path[path.length - 1].y, 2);
});

test('Showcase: cell simulation steps and handles reactions', () => {
  cellSim.setCell(10, 10, 'wood');
  cellSim.setCell(10, 11, 'fire');
  cellSim.step();
  const cWood = cellSim.getCell(10, 10);
  assert.ok(cWood !== null);
});

test('Showcase: audio buses calculate composed volume and mute cascading', () => {
  audioBuses.setVolume('master', 0.8);
  audioBuses.setVolume('sfx', 0.5);
  assert.equal(audioBuses.getEffectiveVolume('sfx'), 0.4);

  audioBuses.setMuted('master', true);
  assert.equal(audioBuses.getEffectiveVolume('sfx'), 0);
  audioBuses.setMuted('master', false);
  assert.equal(audioBuses.getEffectiveVolume('sfx'), 0.4);
});

test('Showcase: progression, inventory, and equipment system', () => {
  const initialLevel = progression.level;
  progression.grantExperience(150);
  assert.ok(progression.level > initialLevel, 'player should level up');

  const mainHand = equipment.getSlot('mainHand');
  assert.equal(mainHand?.id, 'flame_wand');

  const drops = lootTable.roll();
  assert.ok(Array.isArray(drops) && drops.length > 0);
});

test('Showcase: story graph and reactive facts engine', () => {
  const startNode = storyGraph.start('guard_greeting');
  assert.equal(startNode.speaker, 'Town Guard Roderick');

  facts.set('test_fact', 'active');
  assert.equal(facts.get('test_fact'), 'active');
});

test('Showcase: utility AI evaluations and decision trace', () => {
  const result = utilityAI.evaluate({
    spotted: true,
    isHostile: true,
    npcHp: 100,
    npcMaxHp: 100,
    distToPlayer: 50
  });

  assert.ok(result);
  assert.ok(result.chosenAction);
  assert.equal(result.chosenAction.id, 'attack');
});

test('Showcase: versioned save engine persistence & corruption check', () => {
  const snapshot = {
    test: true,
    data: [1, 2, 3]
  };
  const record = saveEngine.save('test_slot', snapshot);
  assert.equal(record.schemaVersion, 1);

  const loaded = saveEngine.load('test_slot');
  assert.equal(loaded.test, true);

  assert.throws(() => {
    saveEngine.recoverCorruptJson('{ : not valid json }', { throwOnError: true });
  });
});

test('Showcase: headless simulation tick runs cleanly', () => {
  assert.doesNotThrow(() => {
    updateShowcase(0.016);
  });
});
