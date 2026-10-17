import { describe, it, expect, beforeEach } from "./tester.js";
import "./setup_mocks.js";
import { Stats, Inventory, EnemyAI, BossAI, AttackDefinition, Combatant, CombatSystem, Progression, GameData, RewardSystem, Shop, QuestLog } from "../src/larissa/index.js";
import { Tilemap, Tileset } from "../src/thalassa/index.js";

// ============================================
// Stats Tests
// ============================================
describe('Stats', () => {
    let stats;

    beforeEach(() => {
        stats = new Stats({ maxHealth: 100, attack: 10, defense: 5 });
    });

    it('creates stats with config', () => {
        expect(stats.maxHealth).toBe(100);
        expect(stats.health).toBe(100);
        expect(stats.attack).toBe(10);
        expect(stats.defense).toBe(5);
    });

    it('takeDamage reduces health', () => {
        const damage = stats.takeDamage(20);
        expect(stats.health).toBe(85); // 20 - 5 defense = 15
        expect(damage).toBe(15);
    });

    it('takeDamage has minimum of 1', () => {
        stats.defense = 100;
        const damage = stats.takeDamage(5);
        expect(damage).toBe(1);
    });

    it('heal increases health', () => {
        stats.health = 50;
        stats.heal(30);
        expect(stats.health).toBe(80);
    });

    it('heal caps at maxHealth', () => {
        stats.health = 90;
        stats.heal(50);
        expect(stats.health).toBe(100);
    });

    it('isAlive returns correct state', () => {
        expect(stats.isAlive).toBe(true);
        stats.health = 0;
        expect(stats.isAlive).toBe(false);
    });

    it('useStamina returns false if not enough', () => {
        stats.stamina = 10;
        expect(stats.useStamina(20)).toBe(false);
        expect(stats.stamina).toBe(10);
    });

    it('useStamina returns true and deducts if enough', () => {
        stats.stamina = 50;
        expect(stats.useStamina(20)).toBe(true);
        expect(stats.stamina).toBe(30);
    });

    it('applyEffect adds status effect', () => {
        stats.applyEffect('burning', 5, { attack: 1.5 });
        expect(stats.effects.length).toBe(1);
    });

    it('getModifiedStat applies effect multipliers', () => {
        stats.applyEffect('boost', 5, { attack: 2 });
        expect(stats.getModifiedStat('attack')).toBe(20);
    });
});

// ============================================
// Inventory Tests
// ============================================
describe('Inventory', () => {
    let inventory;
    const swordItem = { id: 'sword', name: 'Sword', type: 'weapon', stackable: 1 };
    const potionItem = { id: 'potion', name: 'Potion', type: 'consumable', stackable: 99 };

    beforeEach(() => {
        inventory = new Inventory(10);
    });

    it('creates empty inventory', () => {
        expect(inventory.slots.length).toBe(0);
        expect(inventory.maxSlots).toBe(10);
    });

    it('addItem adds non-stackable items', () => {
        inventory.addItem(swordItem);
        expect(inventory.slots.length).toBe(1);
    });

    it('addItem stacks stackable items', () => {
        inventory.addItem(potionItem, 5);
        inventory.addItem(potionItem, 3);
        expect(inventory.slots.length).toBe(1);
        expect(inventory.slots[0].quantity).toBe(8);
    });

    it('hasItem checks correctly', () => {
        inventory.addItem(potionItem, 5);
        expect(inventory.hasItem('potion', 3)).toBe(true);
        expect(inventory.hasItem('potion', 10)).toBe(false);
    });

    it('removeItem decreases quantity', () => {
        inventory.addItem(potionItem, 10);
        inventory.removeItem('potion', 3);
        expect(inventory.getItemCount('potion')).toBe(7);
    });

    it('removeItem removes empty slots', () => {
        inventory.addItem(potionItem, 5);
        inventory.removeItem('potion', 5);
        expect(inventory.slots.length).toBe(0);
    });

    it('isFull returns correct state', () => {
        expect(inventory.isFull).toBe(false);
        for (let i = 0; i < 10; i++) {
            inventory.addItem({ ...swordItem, id: `sword${i}` });
        }
        expect(inventory.isFull).toBe(true);
    });
});

describe("Progression and RPG data", () => {
    const setup = () => {
        const data = new GameData({
            items: { potion: { id: "potion", type: "consumable", stackable: 5, effects: { health: 20 } }, sword: { id: "sword", type: "weapon", stackable: 1, slot: "hand", value: 10 } },
            lootTables: { drop: [{ itemId: "potion", quantity: 2, chance: 1 }] },
            shops: { market: { items: [{ itemId: "potion", price: 3 }] } },
            quests: { hunt: { objectives: [{ id: "wolf", required: 2 }] } },
            rewards: { bounty: { experience: 100, gold: 5, items: [{ itemId: "potion", quantity: 1 }] } }
        });
        return { data, inventory: new Inventory(4) };
    };
    it("levels by configurable thresholds, unlocks skills, and round-trips progression state", () => {
        const progression = new Progression({ baseExperience: 10, growthRate: 2 });
        const events = [];
        progression.onProgression(event => events.push(event.type));
        expect(progression.grantExperience(35)).toEqual([2, 3]);
        expect(progression.level).toBe(3);
        expect(progression.experience).toBe(5);
        progression.unlockSkill("dash");
        expect(Progression.fromJSON(JSON.parse(JSON.stringify(progression))).toJSON()).toEqual(progression.toJSON());
        expect(events).toEqual(["level-up", "level-up", "skill-unlocked"]);
    });
    it("uses consumables, equips items, and preserves inventory/equipment in save data", () => {
        const { data, inventory } = setup();
        const stats = new Stats(); stats.health = 50;
        inventory.addItem(data.getItem("potion"));
        expect(inventory.useItem("potion", stats)).toBe(true);
        expect(stats.health).toBe(70);
        inventory.addItem(data.getItem("sword"));
        inventory.equip("sword");
        const copy = new Inventory(); copy.loadJSON(JSON.parse(JSON.stringify(inventory)));
        expect(copy.equipment.hand.id).toBe("sword");
        expect(copy.gold).toBe(0);
    });
    it("supports deterministic loot, atomic shop purchases, quest state and reward events", () => {
        const { data, inventory } = setup();
        expect(data.rollLoot("drop", () => 0)).toEqual([{ itemId: "potion", quantity: 2 }]);
        expect(GameData.fromJSON(JSON.parse(JSON.stringify(data))).getItem("sword")).toEqual(data.getItem("sword"));
        inventory.gold = 3;
        expect(new Shop(data, "market").buy(inventory, "potion")).toBe(true);
        const full = new Inventory(0); full.gold = 100;
        expect(new Shop(data, "market").buy(full, "potion")).toBe(false);
        expect(full.gold).toBe(100);
        const quests = new QuestLog(data), events = [];
        quests.subscribe(event => events.push(event.type));
        quests.start("hunt"); quests.advance("hunt", "wolf");
        const saved = JSON.parse(JSON.stringify(quests));
        const restored = new QuestLog(data); restored.loadJSON(saved);
        restored.advance("hunt", "wolf");
        expect(restored.states.get("hunt").status).toBe("complete");
        const rewards = new RewardSystem(data), rewardEvents = [];
        rewards.subscribe(event => rewardEvents.push(event.type));
        rewards.grant("bounty", { inventory, progression: new Progression() });
        expect(inventory.gold).toBe(5);
        expect(rewardEvents).toContain("reward-granted");
        expect(events).toEqual(["quest-started", "quest-progress"]);
    });
});

// ============================================
// BossAI Tests
// ============================================
describe('BossAI', () => {
    let boss;

    beforeEach(() => {
        boss = new BossAI();
    });

    it('starts in idle state', () => {
        expect(boss.state).toBe('idle');
    });

    it('addPhase registers phases', () => {
        boss.addPhase(0.75, [() => { }]);
        boss.addPhase(0.5, [() => { }]);
        expect(boss.phases.length).toBe(2);
    });

    it('stun changes state', () => {
        boss.stun(2);
        expect(boss.state).toBe('stunned');
        expect(boss.stateTimer).toBe(2);
    });

    it('setTarget stores target', () => {
        const target = { name: 'Player' };
        boss.setTarget(target);
        expect(boss.target).toBe(target);
    });

    it('validates health thresholds and registers data-driven attack phases', () => {
        const combatant = new Combatant({ id: "boss" });
        const system = new CombatSystem();
        const attack = new AttackDefinition({ name: "slam" });
        boss.addAttackPhase(0.5, [attack], system, combatant);
        expect(boss.phases[0].patterns[0]).toBe(attack);
        expect(() => boss.addPhase(1.2, [() => {}])).toThrow(/threshold/);
        expect(() => boss.addPhase(0.5, [attack])).toThrow(/functions/);
    });

    it('selects a different configured attack after a health phase transition', () => {
        const system = new CombatSystem();
        const bossFighter = new Combatant({ id: "boss", faction: "monsters", x: 0, y: 0 });
        const player = new Combatant({ id: "player", faction: "heroes", x: 5, y: 0 });
        const attacks = [];
        system.on("attackStart", event => attacks.push(event.definition.name));
        boss.addAttackPhase(1, [new AttackDefinition({ name: "claw" })], system, bossFighter);
        boss.addAttackPhase(0.5, [new AttackDefinition({ name: "quake" })], system, bossFighter);
        const stats = new Stats({ maxHealth: 100 });
        boss.setTarget(player);
        boss.update(0, stats);
        boss.update(0, stats);
        system.update(0.2, [bossFighter, player]);
        stats.health = 40;
        boss.update(0, stats);
        expect(boss.state).toBe("transitioning");
        boss.update(1, stats);
        boss.update(0, stats);
        expect(attacks).toEqual(["claw", "quake"]);
    });
});

// ============================================
// Enemy AI Tests
// ============================================
describe('EnemyAI', () => {
    const createMap = (width = 7, height = 4) => new Tilemap(new Tileset("test.png", 16, 16), width, height);
    const positionOf = (map, actor) => {
        for (const [index, occupant] of map.occupants) {
            if (occupant === actor) return { x: index % map.width, y: Math.floor(index / map.width) };
        }
        return null;
    };

    it('patrols configured waypoints and remains idle without a target or patrol route', () => {
        const map = createMap();
        const guard = {};
        expect(map.occupy(1, 1, guard)).toBe(true);
        const ai = new EnemyAI({ tilemap: map, actor: guard, spawn: { x: 1, y: 1 }, patrolPoints: [{ x: 3, y: 1 }], moveInterval: 0 });
        ai.update(0);
        expect(ai.state).toBe("patrol");
        expect(positionOf(map, guard)).toEqual({ x: 2, y: 1 });
        ai.update(0);
        expect(positionOf(map, guard)).toEqual({ x: 3, y: 1 });

        const idle = new EnemyAI({ tilemap: map, actor: guard, spawn: { x: 3, y: 1 } });
        idle.update(0);
        expect(idle.state).toBe("idle");
    });

    it('chases through a path around blocked terrain and stops adjacent to its occupied target', () => {
        const map = createMap(7, 4);
        const enemy = {}, player = {};
        map.setTile(2, 1, 0);
        map.setTileMetadata(0, { walkable: false });
        expect(map.occupy(1, 1, enemy)).toBe(true);
        expect(map.occupy(5, 1, player)).toBe(true);
        const ai = new EnemyAI({ tilemap: map, actor: enemy, spawn: { x: 1, y: 1 }, perceptionRadius: 8, moveInterval: 0 });
        for (let i = 0; i < 16; i++) ai.update(0, { target: player });
        const position = positionOf(map, enemy);
        expect(ai.state).toBe("attack");
        expect(Math.abs(position.x - 5) + Math.abs(position.y - 1)).toBe(1);
        expect(position).not.toEqual({ x: 2, y: 1 });
    });

    it('recalculates a chase route when a previously open tile becomes blocked', () => {
        const map = createMap(7, 3);
        const enemy = {}, player = {};
        map.occupy(0, 1, enemy);
        map.occupy(6, 1, player);
        const ai = new EnemyAI({ tilemap: map, actor: enemy, spawn: { x: 0, y: 1 }, perceptionRadius: 10, moveInterval: 0 });
        ai.update(0, { target: player });
        expect(positionOf(map, enemy)).toEqual({ x: 1, y: 1 });
        map.setTile(2, 1, 0);
        map.setTileMetadata(0, { walkable: false });
        ai.update(0, { target: player });
        expect(positionOf(map, enemy)).not.toEqual({ x: 2, y: 1 });
        expect(positionOf(map, enemy)).not.toEqual({ x: 1, y: 1 });
    });

    it('shares detected targets across a configured enemy group', () => {
        const map = createMap(9, 4);
        const group = {};
        const scout = {}, ally = {}, player = {};
        map.occupy(0, 0, scout);
        map.occupy(0, 3, ally);
        map.occupy(4, 0, player);
        const scoutAI = new EnemyAI({ tilemap: map, actor: scout, spawn: { x: 0, y: 0 }, perceptionRadius: 6, moveInterval: 0, group });
        const allyAI = new EnemyAI({ tilemap: map, actor: ally, spawn: { x: 0, y: 3 }, perceptionRadius: 1, moveInterval: 0, group });
        scoutAI.update(0, { target: player });
        allyAI.update(0);
        expect(group.target).toBe(player);
        expect(allyAI.target).toBe(player);
        expect(allyAI.state).toBe("chase");
        expect(positionOf(map, ally)).not.toEqual({ x: 0, y: 3 });
    });

    it('returns to spawn after losing its target and then idles', () => {
        const map = createMap(7, 3);
        const enemy = {}, player = {};
        map.occupy(1, 1, enemy);
        map.occupy(4, 1, player);
        const ai = new EnemyAI({ tilemap: map, actor: enemy, spawn: { x: 0, y: 1 }, perceptionRadius: 6, moveInterval: 0 });
        ai.update(0, { target: player });
        expect(ai.state).toBe("chase");
        ai.update(0);
        expect(ai.state).toBe("return");
        ai.update(0);
        expect(positionOf(map, enemy)).toEqual({ x: 0, y: 1 });
        ai.update(0);
        expect(ai.state).toBe("idle");
    });

    it('starts a configured ranged combat attack when the target is in perception and range', () => {
        const map = createMap(7, 2);
        const shooter = new Combatant({ id: "archer", faction: "monsters", x: 0, y: 0 });
        const target = new Combatant({ id: "hero", faction: "heroes", x: 4, y: 0 });
        map.occupy(0, 0, shooter);
        map.occupy(4, 0, target);
        const system = new CombatSystem();
        const attack = new AttackDefinition({ name: "arrow", mode: "ranged", range: 8, projectileSpeed: 10 });
        const ai = new EnemyAI({ tilemap: map, actor: shooter, spawn: { x: 0, y: 0 }, perceptionRadius: 6, attackRange: 4,
            combatSystem: system, combatant: shooter, attackDefinition: attack });
        const events = [];
        system.on("attackStart", event => events.push(event.definition.name));
        ai.update(0, { target });
        expect(ai.state).toBe("attack");
        expect(events).toEqual(["arrow"]);
    });

    it('flees at the configured low-health threshold without moving into an occupied or blocked cell', () => {
        const map = createMap(7, 3);
        const enemy = {}, player = {};
        map.setTile(2, 1, 0);
        map.setTileMetadata(0, { walkable: false });
        map.occupy(3, 1, enemy);
        map.occupy(4, 1, player);
        const ai = new EnemyAI({ tilemap: map, actor: enemy, spawn: { x: 3, y: 1 }, fleeHealthFraction: 0.3, moveInterval: 0 });
        ai.update(0, { target: player, healthFraction: 0.2 });
        expect(ai.state).toBe("flee");
        expect(positionOf(map, enemy)).toEqual({ x: 3, y: 0 });
        expect(map.getOccupant(4, 1)).toBe(player);
    });
});

// ============================================
// Data-driven Combat Tests
// ============================================
describe('CombatSystem', () => {
    it('validates immutable attack data and rejects malformed attack windows', () => {
        const config = { name: "slash", mode: "melee", startup: 0.1, active: 0.2, recovery: 0.3, cooldown: 0.5, range: 20, damage: 12,
            hitbox: { width: 18, height: 12, offsetX: 2 }, knockback: { x: 3, y: -1 }, targeting: "hostile" };
        const attack = new AttackDefinition(config);
        config.hitbox.width = 100;
        expect(attack.hitbox.width).toBe(18);
        expect(Object.isFrozen(attack)).toBe(true);
        expect(() => new AttackDefinition({ name: "bad", mode: "projectile" })).toThrow(/projectileSpeed/);
        expect(() => new AttackDefinition({ name: "bad", active: 0 })).toThrow(/active duration/);
    });

    it('runs a timed melee attack once per valid hostile target and honors cooldown and feedback events', () => {
        const attacker = new Combatant({ id: "hero", faction: "heroes", x: 0, y: 0 });
        const target = new Combatant({ id: "enemy", faction: "monsters", x: 8, y: 0, maxHealth: 100, resistances: { physical: 0.25 },
            body: { applyKnockback(x, y) { this.last = { x, y }; } } });
        const friend = new Combatant({ id: "friend", faction: "heroes", x: 8, y: 0 });
        const attack = new AttackDefinition({ name: "slash", startup: 0.1, active: 0.1, recovery: 0.1, cooldown: 0.2, range: 8, damage: 20,
            hitbox: { width: 12, height: 8 }, knockback: { x: 7, y: -2 }, staggerDuration: 0.3,
            statusEffect: { name: "burning", duration: 1, modifiers: { attack: 0.5 } } });
        const system = new CombatSystem();
        const events = [];
        for (const event of ["attackStart", "attackActive", "hit", "damage", "status", "stagger", "knockback", "attackRecovery", "attackComplete"]) {
            system.on(event, payload => events.push(payload.event));
        }
        expect(system.startAttack(attacker, attack)).toBe(true);
        expect(system.startAttack(attacker, attack)).toBe(false);
        system.update(0.1, [attacker, target, friend]);
        expect(target.health).toBe(100);
        system.update(0.1, [attacker, target, friend]);
        expect(target.health).toBe(85);
        expect(friend.health).toBe(100);
        expect(target.body.last).toEqual({ x: 7, y: -2 });
        expect(target.isStaggered).toBe(true);
        expect(target.effects.length).toBe(1);
        expect(target.getModifiedStat("attack", 10)).toBe(5);
        system.update(0.1, [attacker, target, friend]);
        expect(system.startAttack(attacker, attack)).toBe(false);
        system.update(0.2, [attacker, target, friend]);
        expect(system.startAttack(attacker, attack)).toBe(true);
        expect(events).toContain("damage");
        expect(events).toContain("knockback");
        expect(events).toContain("attackComplete");
    });

    it('applies resistance, invulnerability frames, status expiry, and one-time death deterministically', () => {
        const body = { applyKnockback(x, y) { this.velocity = { x, y }; } };
        const target = new Combatant({ id: "target", maxHealth: 20, resistances: { fire: 0.5 }, invulnerabilityDuration: 0.2, body });
        let deaths = 0;
        target.onDeath = () => deaths++;
        target.applyEffect({ name: "weak", duration: 0.5, modifiers: { defense: 0.5 } });
        expect(target.getModifiedStat("defense", 10)).toBe(5);
        const first = target.receiveDamage({ amount: 10, type: "fire", stagger: 0.4 });
        expect(first.damage).toBe(5);
        expect(target.receiveDamage({ amount: 10, type: "fire" }).applied).toBe(false);
        target.update(0.2);
        const lethal = target.receiveDamage({ amount: 40, type: "fire" });
        expect(lethal.killed).toBe(true);
        expect(target.isAlive).toBe(false);
        expect(deaths).toBe(1);
        target.receiveDamage({ amount: 100, type: "fire" });
        expect(deaths).toBe(1);
        target.update(0.5);
        expect(target.effects.length).toBe(0);
    });

    it('launches a swept ranged projectile and emits the same hit and death event stream', () => {
        const shooter = new Combatant({ id: "shooter", faction: "player", x: 0, y: 0 });
        const target = new Combatant({ id: "target", faction: "enemy", x: 50, y: 0, maxHealth: 5, hurtbox: { width: 4, height: 4 } });
        const attack = new AttackDefinition({ name: "bolt", mode: "ranged", startup: 0, active: 0.1, recovery: 0, cooldown: 0,
            range: 100, damage: 8, projectileSpeed: 100, hitbox: { width: 4, height: 4 }, knockback: { x: 4, y: 0 } });
        const system = new CombatSystem();
        const events = [];
        for (const event of ["projectile", "hit", "damage", "death"]) system.on(event, payload => events.push(payload.event));
        expect(system.startAttack(shooter, attack, { x: 1, y: 0 })).toBe(true);
        system.update(0, [shooter, target]);
        expect(target.health).toBe(5);
        system.update(0.6, [shooter, target]);
        expect(target.health).toBe(0);
        expect(events).toEqual(["projectile", "hit", "damage", "death"]);
    });

    it('uses the common hit pipeline for area attacks against multiple valid targets', () => {
        const caster = new Combatant({ id: "caster", faction: "party", x: 0, y: 0 });
        const first = new Combatant({ id: "first", faction: "enemies", x: 2, y: 0 });
        const second = new Combatant({ id: "second", faction: "enemies", x: -2, y: 0 });
        const ally = new Combatant({ id: "ally", faction: "party", x: 0, y: 0 });
        const distant = new Combatant({ id: "distant", faction: "enemies", x: 20, y: 0, hurtbox: { width: 40, height: 20 } });
        const attack = new AttackDefinition({ name: "nova", mode: "area", range: 12, damage: 9, hitbox: { width: 16, height: 16 } });
        const system = new CombatSystem();
        const hits = [];
        system.on("hit", event => hits.push(event.target.id));
        system.startAttack(caster, attack);
        system.update(0, [second, ally, caster, distant, first]);
        expect(first.health).toBe(91);
        expect(second.health).toBe(91);
        expect(ally.health).toBe(100);
        expect(distant.health).toBe(100);
        expect(hits).toEqual(["first", "second"]);
    });
});
