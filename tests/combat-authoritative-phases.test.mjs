import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Combatant, AttackDefinition, CombatSystem } from '../src/larissa/combat.js';

test('COMBAT-01: Combatant authoritative health prevents healing dead actors and handles lethal hits', () => {
    let deathCount = 0;
    const actor = new Combatant({ maxHealth: 50, health: 10 });
    actor.onDeath = () => { deathCount++; };

    assert.equal(actor.isAlive, true);

    // Simultaneous lethal damage
    const hit1 = actor.receiveDamage({ amount: 15 });
    assert.equal(hit1.applied, true);
    assert.equal(hit1.killed, true);
    assert.equal(actor.health, 0);
    assert.equal(actor.isAlive, false);
    assert.equal(deathCount, 1);

    // Second lethal hit on already-dead actor should not trigger death again or underflow health
    const hit2 = actor.receiveDamage({ amount: 20 });
    assert.equal(hit2.applied, false);
    assert.equal(hit2.killed, false);
    assert.equal(actor.health, 0);
    assert.equal(deathCount, 1);

    // Healing dead actor must be rejected
    const healed = actor.heal(25);
    assert.equal(healed, 0);
    assert.equal(actor.health, 0);
    assert.equal(actor.isAlive, false);
});

test('COMBAT-01: Damage resistances reduce incoming damage accurately', () => {
    const tank = new Combatant({
        maxHealth: 100,
        health: 100,
        invulnerabilityDuration: 0,
        resistances: { fire: 0.5, physical: 0.2 }
    });

    // 50 fire damage against 50% resistance -> 25 damage
    const resFire = tank.receiveDamage({ amount: 50, type: 'fire' });
    assert.equal(resFire.damage, 25);
    assert.equal(tank.health, 75);

    // 20 physical damage against 20% resistance -> 16 damage
    const resPhys = tank.receiveDamage({ amount: 20, type: 'physical' });
    assert.equal(resPhys.damage, 16);
    assert.equal(tank.health, 59);
});

test('COMBAT-02: CombatSystem dodge grants i-frames and avoids incoming damage', () => {
    const system = new CombatSystem();
    const hero = new Combatant({ maxHealth: 100, health: 100, invulnerabilityDuration: 0 });
    const dummy = new Combatant({ maxHealth: 50, health: 50, faction: 'enemy', x: 10, y: 0 });

    const dodged = system.dodge(hero, { x: 1, y: 0 }, { duration: 0.4, iFrames: 0.3 });
    assert.equal(dodged, true);
    assert.ok(hero.invulnerableRemaining > 0);

    // While in dodge i-frames, damage must not be applied
    const hitDuringDodge = hero.receiveDamage({ amount: 40 });
    assert.equal(hitDuringDodge.applied, false);
    assert.equal(hero.health, 100);

    // After i-frames expire
    hero.update(0.35);
    assert.equal(hero.invulnerableRemaining, 0);
    const hitAfterDodge = hero.receiveDamage({ amount: 40 });
    assert.equal(hitAfterDodge.applied, true);
    assert.equal(hero.health, 60);
});

test('COMBAT-02: Attack state machine enforces hit-once rule and tracks combos', () => {
    const system = new CombatSystem();
    const attacker = new Combatant({ id: 'hero', faction: 'player', x: 0, y: 0 });
    const victim = new Combatant({ id: 'target', faction: 'enemy', x: 10, y: 0, health: 100, invulnerabilityDuration: 0 });

    const slash = new AttackDefinition({
        name: 'Slash',
        mode: 'melee',
        damage: 10,
        range: 30,
        startup: 0.05,
        active: 0.2,
        recovery: 0.1,
        hitbox: { width: 40, height: 40, offsetX: 0, offsetY: 0 }
    });

    // Start 1st attack
    const started = system.startAttack(attacker, slash, { x: 1, y: 0 });
    assert.equal(started, true);
    assert.equal(attacker.comboCount, 1);

    // Tick into active phase (elapsed 0.06s > startup 0.05s) -> hits target
    system.update(0.06, [attacker, victim]);
    assert.equal(victim.health, 90);

    // Lingering active phase update (another 0.05s) should NOT hit the same target again (hit-once rule)
    system.update(0.05, [attacker, victim]);
    assert.equal(victim.health, 90, 'hitbox must hit target at most once per swing');

    // Complete attack (recovery and finish)
    system.update(0.3, [attacker, victim]);

    // Chain 2nd attack within combo window -> combo increments to 2
    const chained = system.startAttack(attacker, slash, { x: 1, y: 0 });
    assert.equal(chained, true);
    assert.equal(attacker.comboCount, 2);
});
