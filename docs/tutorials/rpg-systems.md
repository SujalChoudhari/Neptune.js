# RPG progression, inventory, quests, and rewards

Larissa provides `Stats`, `Inventory`, `Progression`, `GameData`, `RewardSystem`, `Shop`, and `QuestLog`. These systems keep their state in ordinary JavaScript objects so a game can connect them to its own UI, save slots, and combat loop.

## Character stats

`Stats` starts health and stamina at their configured maxima; attack, defense, and speed default to 10, 5, and 100. Damage subtracts modified defense but always deals at least one point. Healing and stamina regeneration clamp at their maxima.

```js
import { Stats } from "../../src/larissa/index.js";

const stats = new Stats({ maxHealth: 80, maxStamina: 40, attack: 12, defense: 4 });
stats.onDamage = amount => showDamageNumber(amount);
stats.onDeath = () => enterDefeatState();
stats.takeDamage(10);
stats.heal(5);
if (stats.useStamina(8)) performDodge();
stats.regenStamina(2);
stats.applyEffect("focus", 3, { attack: 1.25 });
const attack = stats.getModifiedStat("attack");
stats.updateEffects(deltaTime);
```

Effects contain a name, duration in seconds, and per-stat multipliers. Call `updateEffects(deltaTime)` from the game update to expire them. `onDamage`, `onHeal`, and `onDeath` are optional callbacks.

## Inventory and item definitions

An item definition can include `id`, `name`, `type`, `value`, `stackable`, `stats`, `slot`, and consumable `effects`. `Inventory(maxSlots)` stores `{ item, quantity }` slots, gold, and equipment. `addItem` and `removeItem` return whether the requested quantity was fully handled; `canAddItem` checks capacity before a reward or purchase.

```js
import { Inventory } from "../../src/larissa/index.js";

const inventory = new Inventory(12);
inventory.addItem({ id: "potion", name: "Potion", type: "consumable", stackable: 5, effects: { health: 20 } }, 2);
inventory.useItem("potion", stats);
inventory.addItem({ id: "blade", name: "Blade", type: "weapon", value: 30, stackable: 1 });
inventory.equip("blade");
inventory.unequip("weapon");
const saveData = inventory.toJSON();
```

`useItem` consumes one consumable and applies configured health, stamina, and numeric stat effects to the supplied stats object where supported. `equip` moves an eligible weapon/armor item out of the bag and returns the equipped item (or the displaced item); `unequip` returns false if there is no equipment or the bag has no capacity. `hasItem`, `getItemCount`, `isFull`, and item-added/removed callbacks support UI updates. `loadJSON(data)` validates and restores a prior `toJSON()` payload.

## Experience and level events

```js
import { Progression } from "../../src/larissa/index.js";

const progression = new Progression({ baseExperience: 100, growthRate: 1.5, stats: { strength: 2 } });
const unsubscribe = progression.onProgression(event => {
  if (event.type === "level-up") showLevelUp(event.level);
  if (event.type === "skill-unlocked") showSkill(event.skillId);
});
const levelsGained = progression.grantExperience(120);
progression.unlockSkill("heavy-strike");
const progressionSave = progression.toJSON();
const restoredProgression = Progression.fromJSON(progressionSave);
unsubscribe();
```

`experienceToNextLevel(level = progression.level)` returns `floor(baseExperience * growthRate ** (level - 1))`. `grantExperience` can advance multiple levels and returns the new level numbers; listeners receive a `level-up` event for each. `unlockSkill` returns false for a duplicate skill and emits `skill-unlocked` once. Progression data can be serialized and reconstructed with `toJSON()` and `Progression.fromJSON(data)`.

## Shared game data, shops, and rewards

`GameData` accepts keyed definitions for `items`, `lootTables`, `shops`, `quests`, and `rewards`. Use `getItem(id)` to retrieve item definitions and `rollLoot(tableId, random)` to inject a seeded random function for deterministic tests.

```js
import { GameData, RewardSystem, Shop } from "../../src/larissa/index.js";

const data = new GameData({
  items: {
    potion: { id: "potion", name: "Potion", type: "consumable", value: 10, stackable: 5, effects: { health: 20 } }
  },
  shops: { market: { items: [{ itemId: "potion", price: 12 }] } },
  rewards: { questReward: { gold: 5, experience: 20, items: [{ itemId: "potion", quantity: 1 }] } }
});
const shop = new Shop(data, "market");
const bought = shop.buy(inventory, "potion", 1); // false if unavailable, unaffordable, or no capacity
const rewards = new RewardSystem(data);
const unsubscribeRewards = rewards.subscribe(event => updateHUD(event));
const granted = rewards.grant("questReward", { inventory, progression });
const dataSave = data.toJSON();
```

Shop definitions list offered `itemId` values and optional prices (otherwise the item's `value` is used). Buying checks offer, cost, and inventory capacity before charging gold. Rewards can grant experience, gold, and items; all item/capacity checks happen before applying the reward. Unknown shop, reward, or loot-table IDs throw an error. `GameData.toJSON()` and `GameData.fromJSON(data)` serialize the definitions, not player progress.

## Quest state

Quest definitions contain an `objectives` array of `{ id, required }` entries. Starting a quest creates an active record. Advance objectives by ID; completing all objectives changes its status to complete.

```js
import { QuestLog } from "../../src/larissa/index.js";

const quests = new QuestLog(data);
quests.subscribe(event => updateQuestJournal(event));
quests.start("find-the-key");
quests.advance("find-the-key", "collect-key", 1);
const questSave = quests.toJSON();
const restoredQuests = new QuestLog(data);
restoredQuests.loadJSON(questSave);
```

`start` returns false for an unknown or already-started quest. `advance` returns false for an inactive quest, unknown objective, or non-positive amount; progress is capped at the objective requirement. `subscribe` returns an unsubscribe function. Persist `QuestLog.toJSON()` alongside the game data and restore it with `loadJSON(states)`.

See [combat and enemy AI](combat-ai.md) for combatant health and attacks, and [saving and loading](save-load.md) for persisting player-owned state.
