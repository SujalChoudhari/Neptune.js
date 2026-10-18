# Combat and enemy AI

Larissa exposes `AttackDefinition`, `Combatant`, `CombatSystem`, `EnemyAI`, and `BossAI` from `src/larissa/index.js`. The combat runtime is deterministic when the same combatants and update time are supplied; positions are world-space values in the same units as your render/collision setup.

## Define combatants and attacks

```js
import { AttackDefinition, Combatant, CombatSystem } from "../../src/larissa/index.js";

const combat = new CombatSystem();
const hero = new Combatant({ id: "hero", faction: "players", x: 40, y: 32, maxHealth: 100 });
const slime = new Combatant({ id: "slime-a", faction: "monsters", x: 55, y: 32, maxHealth: 25 });
const slash = new AttackDefinition({
  name: "slash",
  mode: "melee",
  startup: 0.05,
  active: 0.2,
  recovery: 0.15,
  cooldown: 0.3,
  range: 24,
  damage: 8,
  hitbox: { width: 20, height: 12, offsetY: 2 },
  damageType: "physical",
  staggerDuration: 0.1
});

combat.startAttack(hero, slash, { x: 1, y: 0 });
combat.update(0.1, [hero, slime]);
```

Attack definitions are validated and immutable. Modes are `melee`, `projectile` (the `ranged` alias normalizes to this), or `area`. Active duration and range must be positive. Projectile attacks also require a positive `projectileSpeed`. Hitbox dimensions must be positive; offsets can be signed. Targeting defaults to `hostile` and can be `friendly` or `any`. Cooldowns are tracked per attacker and attack name. An attacker cannot start another attack while already attacking, on cooldown, dead, or staggered.

`CombatSystem.update(deltaTime, combatants)` advances combat phases, combatant timers, and projectiles. Call it once per game update with the current combatant set. Melee attacks test the directional hitbox while targets are in range. Projectiles move at their configured speed and stop at `range`; they hit at most once per target, and stop on the first target unless `piercing` is true. A zero-length aim vector is invalid.

## Health, resistance, and effects

`Combatant.receiveDamage({ amount, type, stagger, knockback })` returns `{ applied, damage, killed }`. Resistance is a fraction from 0 to 1 keyed by damage type. Damage is clamped at zero health; invulnerability prevents subsequent damage until its timer elapses. `onDeath` is called once when health reaches zero. `update(deltaTime)` expires invulnerability, stagger, status effects, and attack cooldowns.

```js
slime.resistances.physical = 0.25;
slime.applyEffect({
  name: "slow",
  duration: 2,
  modifiers: { speed: 0.7 }
});
const speed = slime.getModifiedStat("speed", 10); // 7 while the effect is active
```

`getModifiedStat` multiplies the base value by each active effect's modifier for that stat. Reapplying an effect of the same name refreshes its remaining duration to the greater duration and replaces its modifiers. Attack definitions can also include a `statusEffect`, `knockback: { x, y }`, `piercing`, and `staggerDuration`. Knockback is delivered when the combatant has a `body` that implements `applyKnockback(x, y)`.

Subscribe to `attackStart`, `attackActive`, `attackRecovery`, `attackComplete`, `projectile`, `hit`, `damage`, `death`, `status`, `stagger`, and `knockback` with `combat.on(event, listener)`. The method returns an unsubscribe function. Event listeners receive an object with `event` plus the event-specific payload.

## Tile-aware enemy behavior

`EnemyAI` requires a `Tilemap` and an actor already occupying a tile. Its optional configuration includes spawn and patrol tile coordinates, perception and attack ranges (Manhattan tile distance), movement interval, attack cooldown, and flee-health fraction.

```js
import { EnemyAI } from "../../src/larissa/index.js";

const guard = { name: "guard" };
map.occupy(2, 2, guard);
const ai = new EnemyAI({
  tilemap: map,
  actor: guard,
  spawn: { x: 2, y: 2 },
  patrolPoints: [{ x: 2, y: 2 }, { x: 5, y: 2 }],
  perceptionRadius: 6,
  attackRange: 1,
  moveInterval: 0.2,
  onAttack: target => startGuardAttack(target)
});
ai.onStateChange = ({ previous, state, target }) => updateEnemyAnimation(state, target);
ai.update(deltaTime, { target: heroActor, healthFraction: 1 });
```

States are `idle`, `patrol`, `chase`, `attack`, `flee`, and `return`. An unseen target is ignored unless it is the target shared through an optional group object. Chasing uses tilemap pathfinding; movement is throttled by `moveInterval`. When `fleeHealthFraction` is set, the AI flees at or below that health fraction. Without an `onAttack` callback, provide `attackDefinition`, `combatSystem`, and `combatant` together to invoke the data-driven combat runtime. `onStateChange` receives `{ previous, state, target }`.

`BossAI` supports health-threshold phases. `addPhase(threshold, patterns)` accepts callbacks; `addAttackPhase(threshold, attacks, combatSystem, combatant)` accepts `AttackDefinition` instances and runs them through `CombatSystem`. Thresholds are fractions from 0 to 1. Use `setTarget(entity)` and call `update(deltaTime, stats)` as the boss stats change. `onPhaseChange` receives the new phase index; `onAttack` receives the selected pattern index. `stun(duration)` pauses its attack state temporarily.

For the complete playable example, see the [action-RPG tutorial](action-rpg.md). For grid terrain and occupancy semantics, see [tilemaps and tilesets](tilemaps.md).
