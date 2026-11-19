import './setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ItemRegistry,
  Inventory,
  EquipmentSystem,
  LootTable,
  EQUIPMENT_SLOTS,
  isValidEquipmentSlot,
  createRPGSnapshot,
  restoreRPGSnapshot
} from '../src/larissa/itemSystem.js';

import {
  Combatant,
  Stats,
  Inventory as LarissaInventory,
  ItemRegistry as LarissaItemRegistry,
  EquipmentSystem as LarissaEquipmentSystem,
  LootTable as LarissaLootTable
} from '../src/larissa/index.js';

import * as Neptune from '../src/neptune.js';

// ============================================================================
// 1. RE-EXPORTS AND MODULE EXPORTS
// ============================================================================

test('RPG-01 Re-exports: classes and utilities are exported from itemSystem, larissa/index, and neptune', () => {
  // src/larissa/itemSystem.js
  assert.equal(typeof ItemRegistry, 'function', 'ItemRegistry is constructor in itemSystem');
  assert.equal(typeof Inventory, 'function', 'Inventory is constructor in itemSystem');
  assert.equal(typeof EquipmentSystem, 'function', 'EquipmentSystem is constructor in itemSystem');
  assert.equal(typeof LootTable, 'function', 'LootTable is constructor in itemSystem');
  assert.equal(Array.isArray(EQUIPMENT_SLOTS), true, 'EQUIPMENT_SLOTS is array');
  assert.equal(typeof isValidEquipmentSlot, 'function', 'isValidEquipmentSlot is function');
  assert.equal(typeof createRPGSnapshot, 'function', 'createRPGSnapshot is function');
  assert.equal(typeof restoreRPGSnapshot, 'function', 'restoreRPGSnapshot is function');

  // src/larissa/index.js
  assert.equal(LarissaItemRegistry, ItemRegistry, 'larissa/index re-exports ItemRegistry');
  assert.equal(LarissaInventory, Inventory, 'larissa/index re-exports Inventory');
  assert.equal(LarissaEquipmentSystem, EquipmentSystem, 'larissa/index re-exports EquipmentSystem');
  assert.equal(LarissaLootTable, LootTable, 'larissa/index re-exports LootTable');

  // src/neptune.js
  assert.equal(Neptune.ItemRegistry, ItemRegistry, 'Neptune re-exports ItemRegistry');
  assert.equal(Neptune.Inventory, Inventory, 'Neptune re-exports Inventory');
  assert.equal(Neptune.EquipmentSystem, EquipmentSystem, 'Neptune re-exports EquipmentSystem');
  assert.equal(Neptune.LootTable, LootTable, 'Neptune re-exports LootTable');
  assert.equal(Neptune.Larissa.ItemRegistry, ItemRegistry, 'Neptune.Larissa has ItemRegistry');
  assert.equal(Neptune.Larissa.EquipmentSystem, EquipmentSystem, 'Neptune.Larissa has EquipmentSystem');
  assert.equal(Neptune.Larissa.LootTable, LootTable, 'Neptune.Larissa has LootTable');
});

// ============================================================================
// 2. ITEM REGISTRY
// ============================================================================

test('RPG-01 ItemRegistry: registers weapons, armor, accessories, consumables with modifiers and effects', () => {
  const registry = new ItemRegistry();

  const sword = registry.register({
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'weapon',
    stats: { attack: 12 },
    value: 50
  });

  const armor = registry.register({
    id: 'chainmail',
    name: 'Chainmail Armor',
    type: 'armor',
    stats: { defense: 15, maxHealth: 25 },
    value: 120
  });

  const ring = registry.register({
    id: 'ring_of_swiftness',
    name: 'Ring of Swiftness',
    type: 'accessory',
    stats: { speed: 20 },
    value: 80
  });

  const potion = registry.register({
    id: 'minor_health_pot',
    name: 'Minor Health Potion',
    type: 'consumable',
    maxStack: 20,
    effects: { health: 35 },
    value: 15
  });

  // Verify sword
  assert.equal(sword.id, 'iron_sword');
  assert.equal(sword.type, 'weapon');
  assert.equal(sword.slot, 'mainHand');
  assert.equal(sword.stats.attack, 12);
  assert.equal(sword.maxStack, 1);

  // Verify armor
  assert.equal(armor.id, 'chainmail');
  assert.equal(armor.type, 'armor');
  assert.equal(armor.slot, 'armor');
  assert.equal(armor.stats.defense, 15);
  assert.equal(armor.stats.maxHealth, 25);

  // Verify accessory
  assert.equal(ring.id, 'ring_of_swiftness');
  assert.equal(ring.type, 'accessory');
  assert.equal(ring.slot, 'accessory');
  assert.equal(ring.stats.speed, 20);

  // Verify consumable
  assert.equal(potion.id, 'minor_health_pot');
  assert.equal(potion.type, 'consumable');
  assert.equal(potion.slot, null);
  assert.equal(potion.maxStack, 20);
  assert.equal(potion.effects.health, 35);

  // Lookup methods
  assert.equal(registry.get('iron_sword'), sword);
  assert.equal(registry.getItem('chainmail'), armor);
  assert.equal(registry.has('ring_of_swiftness'), true);
  assert.equal(registry.has('unknown_item'), false);
  assert.equal(registry.getAll().length, 4);

  // Validation
  assert.throws(() => registry.register(null), /Item definition must be an object/);
  assert.throws(() => registry.register({}), /Item id must be a non-empty string/);
});

// ============================================================================
// 3. ITEM STACKING AND CAPACITY LIMITS (PREVENTING OVERFLOW)
// ============================================================================

test('RPG-01 Inventory Stacking: stacks stackable items up to maxStack across multiple slots', () => {
  const inventory = new Inventory(4);
  const potion = { id: 'health_potion', name: 'Health Potion', type: 'consumable', maxStack: 5 };

  // Add 3 potions: should use 1 slot
  const addedFirst = inventory.addItem(potion, 3);
  assert.equal(addedFirst, true);
  assert.equal(inventory.slots.length, 1);
  assert.equal(inventory.slots[0].quantity, 3);
  assert.equal(inventory.getItemCount('health_potion'), 3);

  // Add 4 more: slot 1 reaches maxStack 5, slot 2 gets remaining 2
  const addedSecond = inventory.addItem(potion, 4);
  assert.equal(addedSecond, true);
  assert.equal(inventory.slots.length, 2);
  assert.equal(inventory.slots[0].quantity, 5);
  assert.equal(inventory.slots[1].quantity, 2);
  assert.equal(inventory.getItemCount('health_potion'), 7);

  // Add 3 more: slot 2 reaches 5 (no new slots)
  const addedThird = inventory.addItem(potion, 3);
  assert.equal(addedThird, true);
  assert.equal(inventory.slots.length, 2);
  assert.equal(inventory.slots[1].quantity, 5);
  assert.equal(inventory.getItemCount('health_potion'), 10);

  // Removal decrements across slots
  const removed = inventory.removeItem('health_potion', 6);
  assert.equal(removed, true);
  // Slot 2 had 5 (removed completely), Slot 1 had 5 (decremented by 1 to 4)
  assert.equal(inventory.slots.length, 1);
  assert.equal(inventory.slots[0].quantity, 4);
  assert.equal(inventory.getItemCount('health_potion'), 4);

  // Remove remainder
  assert.equal(inventory.removeItem('health_potion', 4), true);
  assert.equal(inventory.slots.length, 0);
  assert.equal(inventory.getItemCount('health_potion'), 0);
});

test('RPG-01 Inventory Capacity Limits: strictly prevents inventory overflow beyond maxSlots', () => {
  const inventory = new Inventory(3);
  const sword = { id: 'sword', name: 'Sword', type: 'weapon', maxStack: 1 };
  const shield = { id: 'shield', name: 'Shield', type: 'armor', maxStack: 1 };
  const bow = { id: 'bow', name: 'Bow', type: 'weapon', maxStack: 1 };
  const dagger = { id: 'dagger', name: 'Dagger', type: 'weapon', maxStack: 1 };

  // Add 3 items to 3-slot inventory
  assert.equal(inventory.addItem(sword), true);
  assert.equal(inventory.addItem(shield), true);
  assert.equal(inventory.addItem(bow), true);
  assert.equal(inventory.slots.length, 3);
  assert.equal(inventory.isFull, true);

  // Attempting to add 4th item fails and prevents overflow
  assert.equal(inventory.canAddItem(dagger), false);
  const addedDagger = inventory.addItem(dagger);
  assert.equal(addedDagger, false, 'addItem should reject when full');
  assert.equal(inventory.slots.length, 3, 'slots length must not exceed maxSlots');
  assert.equal(inventory.hasItem('dagger'), false);

  // Adding stackable item when full and item is not in inventory fails
  const potion = { id: 'potion', type: 'consumable', maxStack: 99 };
  assert.equal(inventory.addItem(potion, 5), false);
  assert.equal(inventory.slots.length, 3);

  // Stacking large quantity that would require more slots than free capacity
  const inventory2 = new Inventory(2);
  const arrow = { id: 'arrow', type: 'misc', maxStack: 10 };
  // Trying to add 25 arrows (needs 3 slots: 10 + 10 + 5) into 2-slot inventory must fail atomically
  assert.equal(inventory2.canAddItem(arrow, 25), false);
  assert.equal(inventory2.addItem(arrow, 25), false);
  assert.equal(inventory2.slots.length, 0, 'atomic add must leave inventory untouched if it cannot fit');

  // Adding 20 arrows (fits in exactly 2 slots)
  assert.equal(inventory2.canAddItem(arrow, 20), true);
  assert.equal(inventory2.addItem(arrow, 20), true);
  assert.equal(inventory2.slots.length, 2);
  assert.equal(inventory2.isFull, true);

  // Now adding 1 more arrow fails
  assert.equal(inventory2.addItem(arrow, 1), false);
  assert.equal(inventory2.slots.length, 2);
  assert.equal(inventory2.getItemCount('arrow'), 20);
});

// ============================================================================
// 4. CONSUMABLE USAGE ON COMBATANT / STATS
// ============================================================================

test('RPG-01 Consumable Usage: modifies target Stats (health, stamina, stats) and decrements count', () => {
  const inventory = new Inventory(5);
  const stats = new Stats({ maxHealth: 100, maxStamina: 100, attack: 10, defense: 5 });
  stats.health = 40;
  stats.stamina = 30;

  const potion = {
    id: 'health_pot',
    name: 'Health Potion',
    type: 'consumable',
    maxStack: 10,
    effects: { health: 30, stamina: 25 }
  };

  const buffElixir = {
    id: 'strength_elixir',
    name: 'Strength Elixir',
    type: 'consumable',
    maxStack: 10,
    effects: { stats: { attack: 8, defense: 4 } }
  };

  inventory.addItem(potion, 2);
  inventory.addItem(buffElixir, 1);
  assert.equal(inventory.getItemCount('health_pot'), 2);
  assert.equal(inventory.getItemCount('strength_elixir'), 1);

  // Consume health potion on stats
  const consumedPot = inventory.consume('health_pot', stats);
  assert.equal(consumedPot, true);
  assert.equal(stats.health, 70, 'health increased by 30');
  assert.equal(stats.stamina, 55, 'stamina increased by 25');
  assert.equal(inventory.getItemCount('health_pot'), 1, 'count decremented by 1');

  // Consume strength elixir on stats
  const consumedElixir = inventory.consume('strength_elixir', stats);
  assert.equal(consumedElixir, true);
  assert.equal(stats.attack, 18, 'attack increased by 8');
  assert.equal(stats.defense, 9, 'defense increased by 4');
  assert.equal(inventory.getItemCount('strength_elixir'), 0, 'elixir slot removed when empty');
  assert.equal(inventory.slots.length, 1, 'only potion slot remains');

  // Consuming non-consumable item fails
  const rock = { id: 'rock', type: 'misc', maxStack: 1 };
  inventory.addItem(rock);
  assert.equal(inventory.consume('rock', stats), false);
  assert.equal(inventory.getItemCount('rock'), 1, 'rock count must not decrease');

  // Consuming non-existent item fails
  assert.equal(inventory.consume('ghost_potion', stats), false);
});

test('RPG-01 Consumable Usage: modifies target Combatant (healing, status effect) and decrements count', () => {
  const inventory = new Inventory(5);
  const combatant = new Combatant({ maxHealth: 100, health: 50 });

  const healingSalve = {
    id: 'healing_salve',
    type: 'consumable',
    maxStack: 5,
    effects: {
      health: 30,
      statusEffect: {
        name: 'regeneration',
        duration: 8,
        modifiers: { defense: 1.25 }
      }
    }
  };

  inventory.addItem(healingSalve, 2);

  // Use salve on Combatant
  const consumed = inventory.consume('healing_salve', combatant);
  assert.equal(consumed, true);
  assert.equal(combatant.health, 80, 'Combatant healed from 50 to 80');
  assert.equal(combatant.effects.length, 1, 'Combatant received status effect');
  assert.equal(combatant.effects[0].name, 'regeneration');
  assert.equal(combatant.effects[0].duration, 8);
  assert.equal(inventory.getItemCount('healing_salve'), 1, 'salve quantity decremented to 1');
});

// ============================================================================
// 5. EQUIPPING AND UNEQUIPPING MODIFIES COMBATANT / STATS
// ============================================================================

test('RPG-01 EquipmentSystem: designated slots (mainHand, offHand, armor, accessory) modify Stats and unequip reverts', () => {
  const equipment = new EquipmentSystem();
  const stats = new Stats({ attack: 15, defense: 8, speed: 100, maxHealth: 100 });
  equipment.bindTarget(stats);

  const sword = { id: 'iron_sword', type: 'weapon', slot: 'mainHand', stats: { attack: 20 } };
  const shield = { id: 'wooden_shield', type: 'armor', slot: 'offHand', stats: { defense: 10 } };
  const plateArmor = { id: 'iron_plate', type: 'armor', slot: 'armor', stats: { defense: 25, maxHealth: 50 } };
  const amulet = { id: 'swift_amulet', type: 'accessory', slot: 'accessory', stats: { speed: 30, attack: 5 } };

  // 1. Equip weapon into mainHand
  const eqSword = equipment.equip('mainHand', sword);
  assert.ok(eqSword);
  assert.equal(equipment.getSlot('mainHand'), sword);
  assert.equal(stats.attack, 35, 'attack modified: 15 + 20 = 35');

  // 2. Equip shield into offHand
  const eqShield = equipment.equip('offHand', shield);
  assert.ok(eqShield);
  assert.equal(equipment.getSlot('offHand'), shield);
  assert.equal(stats.defense, 18, 'defense modified: 8 + 10 = 18');

  // 3. Equip armor into armor
  const eqArmor = equipment.equip('armor', plateArmor);
  assert.ok(eqArmor);
  assert.equal(equipment.getSlot('armor'), plateArmor);
  assert.equal(stats.defense, 43, 'defense modified: 18 + 25 = 43');
  assert.equal(stats.maxHealth, 150, 'maxHealth modified: 100 + 50 = 150');

  // 4. Equip accessory into accessory
  const eqAmulet = equipment.equip('accessory', amulet);
  assert.ok(eqAmulet);
  assert.equal(equipment.getSlot('accessory'), amulet);
  assert.equal(stats.speed, 130, 'speed modified: 100 + 30 = 130');
  assert.equal(stats.attack, 40, 'attack modified: 35 + 5 = 40');

  // Query aggregated modifiers
  assert.equal(equipment.getStatModifier('attack'), 25);
  assert.equal(equipment.getStatModifier('defense'), 35);
  assert.equal(equipment.getStatModifier('speed'), 30);
  assert.equal(equipment.getStatModifier('maxHealth'), 50);

  // 5. Unequip accessory
  const unequippedAmulet = equipment.unequip('accessory');
  assert.equal(unequippedAmulet, amulet);
  assert.equal(equipment.getSlot('accessory'), null);
  assert.equal(stats.speed, 100, 'speed reverted to 100');
  assert.equal(stats.attack, 35, 'attack reverted to 35');

  // 6. Unequip armor
  const unequippedArmor = equipment.unequip('armor');
  assert.equal(unequippedArmor, plateArmor);
  assert.equal(stats.defense, 18, 'defense reverted to 18');
  assert.equal(stats.maxHealth, 100, 'maxHealth reverted to 100');

  // 7. Unequip shield and sword
  equipment.unequip('offHand');
  equipment.unequip('mainHand');
  assert.equal(stats.attack, 15, 'attack fully reverted to base 15');
  assert.equal(stats.defense, 8, 'defense fully reverted to base 8');
});

test('RPG-01 EquipmentSystem: modifying Combatant stats directly and through binding', () => {
  const equipment = new EquipmentSystem();
  const combatant = new Combatant({ maxHealth: 100, health: 100 });
  equipment.bindTarget(combatant);

  const shield = { id: 'tower_shield', type: 'armor', slot: 'offHand', stats: { maxHealth: 60 } };

  equipment.equip('offHand', shield);
  assert.equal(combatant.maxHealth, 160, 'Combatant maxHealth modified to 160');

  equipment.unequip('offHand');
  assert.equal(combatant.maxHealth, 100, 'Combatant maxHealth reverted to 100');
});

test('RPG-01 Inventory Equipment Integration: equipping transfers from inventory and unequipping returns items', () => {
  const inventory = new Inventory(4);
  const stats = new Stats({ attack: 10, defense: 5 });
  inventory.equipmentSystem.bindTarget(stats);

  const sword = { id: 'katana', name: 'Katana', type: 'weapon', slot: 'mainHand', stats: { attack: 25 } };
  const dagger = { id: 'dagger', name: 'Dagger', type: 'weapon', slot: 'mainHand', stats: { attack: 12 } };

  inventory.addItem(sword);
  inventory.addItem(dagger);
  assert.equal(inventory.slots.length, 2);

  // Equip Katana from inventory
  const equipped = inventory.equip('mainHand', 'katana');
  assert.ok(equipped);
  assert.equal(inventory.equipment.mainHand.id, 'katana');
  assert.equal(stats.attack, 35);
  // Katana was removed from inventory slots
  assert.equal(inventory.hasItem('katana'), false);
  assert.equal(inventory.slots.length, 1);

  // Equip Dagger in same slot (swapping)
  inventory.equip('mainHand', 'dagger');
  assert.equal(inventory.equipment.mainHand.id, 'dagger');
  assert.equal(stats.attack, 22, 'attack modified for dagger: 10 + 12 = 22');
  // Prior weapon (Katana) was returned to inventory
  assert.equal(inventory.hasItem('katana'), true);

  // Unequip dagger back to inventory
  const unequipped = inventory.unequip('mainHand');
  assert.equal(unequipped.id, 'dagger');
  assert.equal(inventory.equipment.mainHand, null);
  assert.equal(stats.attack, 10, 'attack reverted to base 10');
  assert.equal(inventory.hasItem('dagger'), true);
  assert.equal(inventory.hasItem('katana'), true);

  // Capacity limit check on unequip: fill inventory completely
  const dummy1 = { id: 'd1', maxStack: 1 };
  const dummy2 = { id: 'd2', maxStack: 1 };
  const dummy3 = { id: 'd3', maxStack: 1 };
  inventory.equip('mainHand', 'katana'); // Katana equipped, dagger remains in inventory (1 slot)
  inventory.addItem(dummy1);
  inventory.addItem(dummy2);
  inventory.addItem(dummy3);
  assert.equal(inventory.isFull, true, 'inventory is full with 4 items');

  // Trying to unequip when inventory has no capacity must fail
  const failedUnequip = inventory.unequip('mainHand');
  assert.equal(failedUnequip, false, 'unequip must reject when inventory is full');
  assert.equal(inventory.equipment.mainHand.id, 'katana', 'item remains equipped');
  assert.equal(stats.attack, 35, 'stats remain modified');
});

// ============================================================================
// 6. INCOMPATIBLE EQUIPMENT SLOT REJECTION
// ============================================================================

test('RPG-01 Incompatible Equipment Slot Rejection: rejects mismatched slots, consumables, and invalid slot names', () => {
  const equipment = new EquipmentSystem();
  const stats = new Stats({ attack: 10, defense: 5 });
  equipment.bindTarget(stats);

  const weapon = { id: 'spear', type: 'weapon', slot: 'mainHand', stats: { attack: 15 } };
  const armor = { id: 'tunic', type: 'armor', slot: 'armor', stats: { defense: 8 } };
  const ring = { id: 'ruby_ring', type: 'accessory', slot: 'accessory', stats: { attack: 3 } };
  const potion = { id: 'healing_pot', type: 'consumable', effects: { health: 50 } };

  // 1. Weapon into armor slot -> Rejected
  assert.equal(equipment.canEquip('armor', weapon), false);
  assert.equal(equipment.equip('armor', weapon), false);
  assert.equal(equipment.getSlot('armor'), null);
  assert.equal(stats.defense, 5, 'stats unaffected by rejected equip');

  // 2. Weapon into accessory slot -> Rejected
  assert.equal(equipment.canEquip('accessory', weapon), false);
  assert.equal(equipment.equip('accessory', weapon), false);

  // 3. Armor into mainHand slot -> Rejected
  assert.equal(equipment.canEquip('mainHand', armor), false);
  assert.equal(equipment.equip('mainHand', armor), false);
  assert.equal(equipment.getSlot('mainHand'), null);

  // 4. Accessory into mainHand or offHand -> Rejected
  assert.equal(equipment.canEquip('mainHand', ring), false);
  assert.equal(equipment.canEquip('offHand', ring), false);
  assert.equal(equipment.equip('mainHand', ring), false);

  // 5. Consumable into ANY equipment slot -> Rejected
  for (const slotName of EQUIPMENT_SLOTS) {
    assert.equal(equipment.canEquip(slotName, potion), false, `consumable cannot equip to ${slotName}`);
    assert.equal(equipment.equip(slotName, potion), false, `consumable rejected for ${slotName}`);
  }

  // 6. Invalid non-existent slot name -> Rejected
  assert.equal(equipment.canEquip('helmet', armor), false);
  assert.equal(equipment.equip('helmet', armor), false);
  assert.equal(equipment.canEquip('backpack', weapon), false);
  assert.equal(equipment.equip('backpack', weapon), false);

  // Verify all slots and stats remained pristine
  for (const slotName of EQUIPMENT_SLOTS) {
    assert.equal(equipment.getSlot(slotName), null);
  }
  assert.equal(stats.attack, 10);
  assert.equal(stats.defense, 5);
});

// ============================================================================
// 7. LOOT TABLE WEIGHTED DROP GENERATION WITH MIN/MAX QUANTITIES
// ============================================================================

test('RPG-01 LootTable: deterministic weighted drop rolls and min/max quantity bounds', () => {
  const lootTable = new LootTable([
    { itemId: 'gold_coins', weight: 60, minQuantity: 10, maxQuantity: 50 },
    { itemId: 'health_potion', weight: 30, minQuantity: 2, maxQuantity: 4 },
    { itemId: 'rare_gem', weight: 10, minQuantity: 1, maxQuantity: 1 }
  ]);

  // Total weight: 60 + 30 + 10 = 100
  // gold_coins range: [0, 60)
  // health_potion range: [60, 90)
  // rare_gem range: [90, 100)

  // Test 1: Deterministic gold drop with minimum quantity
  {
    let call = 0;
    // 1st call for pick: 0.1 * 100 = 10 -> gold_coins
    // 2nd call for quantity: 0.0 -> minQuantity 10
    const rng = () => (call++ === 0 ? 0.1 : 0.0);
    const drops = lootTable.roll(rng);
    assert.equal(drops.length, 1);
    assert.equal(drops[0].itemId, 'gold_coins');
    assert.equal(drops[0].quantity, 10, 'minimum quantity rolled');
  }

  // Test 2: Deterministic gold drop with maximum quantity
  {
    let call = 0;
    // 1st call: 0.1 -> gold_coins
    // 2nd call: 0.999 -> maxQuantity 50
    const rng = () => (call++ === 0 ? 0.1 : 0.999);
    const drops = lootTable.roll(rng);
    assert.equal(drops.length, 1);
    assert.equal(drops[0].itemId, 'gold_coins');
    assert.equal(drops[0].quantity, 50, 'maximum quantity rolled');
  }

  // Test 3: Deterministic potion drop with midpoint quantity
  {
    let call = 0;
    // 1st call: 0.75 * 100 = 75 -> health_potion (60 <= 75 < 90)
    // 2nd call: 0.5 -> delta is 2, floor(0.5 * 3) = 1, qty = 2 + 1 = 3
    const rng = () => (call++ === 0 ? 0.75 : 0.5);
    const drops = lootTable.roll(rng);
    assert.equal(drops.length, 1);
    assert.equal(drops[0].itemId, 'health_potion');
    assert.equal(drops[0].quantity, 3);
  }

  // Test 4: Rare gem (minQuantity === maxQuantity)
  {
    let call = 0;
    // 1st call: 0.95 * 100 = 95 -> rare_gem
    const rng = () => (call++ === 0 ? 0.95 : 0.0);
    const drops = lootTable.roll(rng);
    assert.equal(drops.length, 1);
    assert.equal(drops[0].itemId, 'rare_gem');
    assert.equal(drops[0].quantity, 1);
  }

  // Test 5: Multi-roll generation
  {
    const multi = lootTable.roll({ rolls: 5 });
    assert.ok(multi.length >= 1, 'generates multiple drops');
    for (const drop of multi) {
      if (drop.itemId === 'gold_coins') {
        assert.ok(drop.quantity >= 10, 'gold quantity within bounds');
      } else if (drop.itemId === 'health_potion') {
        assert.ok(drop.quantity >= 2, 'potion quantity within bounds');
      } else if (drop.itemId === 'rare_gem') {
        assert.ok(drop.quantity >= 1, 'gem quantity within bounds');
      }
    }
  }

  // Test 6: Distribution over 1000 rolls conforms to weighted expectations
  {
    const counts = { gold_coins: 0, health_potion: 0, rare_gem: 0 };
    for (let i = 0; i < 1000; i++) {
      const result = lootTable.roll();
      assert.equal(result.length, 1);
      const drop = result[0];
      counts[drop.itemId]++;
      if (drop.itemId === 'gold_coins') {
        assert.ok(drop.quantity >= 10 && drop.quantity <= 50, 'gold min/max respected');
      } else if (drop.itemId === 'health_potion') {
        assert.ok(drop.quantity >= 2 && drop.quantity <= 4, 'potion min/max respected');
      } else if (drop.itemId === 'rare_gem') {
        assert.equal(drop.quantity, 1, 'gem exact quantity respected');
      }
    }
    // Expected: gold ~600, potion ~300, gem ~100
    assert.ok(counts.gold_coins > 450 && counts.gold_coins < 750, `gold frequency reasonable: ${counts.gold_coins}`);
    assert.ok(counts.health_potion > 180 && counts.health_potion < 420, `potion frequency reasonable: ${counts.health_potion}`);
    assert.ok(counts.rare_gem > 40 && counts.rare_gem < 180, `gem frequency reasonable: ${counts.rare_gem}`);
  }

  // Test 7: Independent roll mode
  {
    const indTable = new LootTable([
      { itemId: 'always', chance: 1, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'never', chance: 0, minQuantity: 1, maxQuantity: 1 }
    ]);
    const drops = indTable.roll({ mode: 'independent' });
    assert.equal(drops.length, 1);
    assert.equal(drops[0].itemId, 'always');
  }

  // Serialization
  const json = lootTable.toJSON();
  assert.equal(json.entries.length, 3);
  const restored = LootTable.fromJSON(json);
  assert.equal(restored.entries.length, 3);
});

// ============================================================================
// 8. SAVE GAME SNAPSHOT AND RESTORE FOR INVENTORY, EQUIPMENT, AND CURRENCY
// ============================================================================

test('RPG-01 Save Game: snapshot and restore for inventory, equipment, and currency', () => {
  const registry = new ItemRegistry([
    { id: 'broadsword', name: 'Broadsword', type: 'weapon', slot: 'mainHand', stats: { attack: 22 } },
    { id: 'iron_shield', name: 'Iron Shield', type: 'armor', slot: 'offHand', stats: { defense: 14 } },
    { id: 'dragon_plate', name: 'Dragon Plate', type: 'armor', slot: 'armor', stats: { defense: 30, maxHealth: 75 } },
    { id: 'health_potion', name: 'Health Potion', type: 'consumable', maxStack: 10, effects: { health: 50 } },
    { id: 'dungeon_key', name: 'Dungeon Key', type: 'misc', maxStack: 1 }
  ]);

  const inventory = new Inventory({ maxSlots: 10, maxStack: 10, registry });
  const stats = new Stats({ attack: 10, defense: 5, maxHealth: 100 });
  inventory.equipmentSystem.bindTarget(stats);

  // Set currency
  inventory.currency = 275;
  assert.equal(inventory.currency, 275);
  assert.equal(inventory.gold, 275);

  // Populate inventory slots
  inventory.addItem('health_potion', 8);
  inventory.addItem('dungeon_key', 1);

  // Equip weapon, shield, and armor
  inventory.equipmentSystem.equip('mainHand', registry.get('broadsword'));
  inventory.equipmentSystem.equip('offHand', registry.get('iron_shield'));
  inventory.equipmentSystem.equip('armor', registry.get('dragon_plate'));

  // Verify initial modified stats
  assert.equal(stats.attack, 32, 'attack: 10 + 22 = 32');
  assert.equal(stats.defense, 49, 'defense: 5 + 14 + 30 = 49');
  assert.equal(stats.maxHealth, 175, 'maxHealth: 100 + 75 = 175');

  // 1. Create snapshot
  const snapshot = inventory.createSnapshot();
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.currency, 275);
  assert.equal(snapshot.slots.length, 2);
  assert.equal(snapshot.equipment.slots.mainHand.id, 'broadsword');
  assert.equal(snapshot.equipment.slots.offHand.id, 'iron_shield');
  assert.equal(snapshot.equipment.slots.armor.id, 'dragon_plate');
  assert.equal(snapshot.equipment.slots.accessory, null);

  // Unified RPG snapshot helper check
  const unifiedSnapshot = createRPGSnapshot({ inventory, currency: inventory.currency });
  assert.equal(unifiedSnapshot.currency, 275);
  assert.ok(unifiedSnapshot.inventory);
  assert.ok(unifiedSnapshot.equipment);

  // 2. Clear / mutate the live inventory and stats
  inventory.currency = 0;
  inventory.slots = [];
  inventory.equipmentSystem.unequip('mainHand');
  inventory.equipmentSystem.unequip('offHand');
  inventory.equipmentSystem.unequip('armor');
  assert.equal(stats.attack, 10, 'attack reverted');
  assert.equal(stats.defense, 5, 'defense reverted');
  assert.equal(stats.maxHealth, 100, 'maxHealth reverted');

  // 3. Restore snapshot into fresh inventory and stats
  const freshInventory = new Inventory({ maxSlots: 10, registry });
  const freshStats = new Stats({ attack: 10, defense: 5, maxHealth: 100 });
  freshInventory.equipmentSystem.bindTarget(freshStats);

  freshInventory.restoreSnapshot(snapshot, { target: freshStats, registry });

  // 4. Verify restored state
  assert.equal(freshInventory.currency, 275, 'restored currency');
  assert.equal(freshInventory.gold, 275, 'restored gold alias');
  assert.equal(freshInventory.slots.length, 2, 'restored slots length');
  assert.equal(freshInventory.getItemCount('health_potion'), 8, 'restored potion count');
  assert.equal(freshInventory.getItemCount('dungeon_key'), 1, 'restored key count');

  // Verify restored equipment
  assert.equal(freshInventory.equipment.mainHand.id, 'broadsword');
  assert.equal(freshInventory.equipment.offHand.id, 'iron_shield');
  assert.equal(freshInventory.equipment.armor.id, 'dragon_plate');
  assert.equal(freshInventory.equipment.accessory, null);

  // Verify restored stat modifier binding
  assert.equal(freshStats.attack, 32, 'restored modified attack: 32');
  assert.equal(freshStats.defense, 49, 'restored modified defense: 49');
  assert.equal(freshStats.maxHealth, 175, 'restored modified maxHealth: 175');

  // Unequip on restored inventory reverts stats properly
  freshInventory.equipmentSystem.unequip('mainHand');
  assert.equal(freshStats.attack, 10, 'unequipping after restore reverts stats properly');
});
