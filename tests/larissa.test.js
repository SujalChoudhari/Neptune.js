import { describe, it, expect, beforeEach } from "./tester.js";
import { Stats, Inventory, BossAI } from "../src/larissa/index.js";

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
});
