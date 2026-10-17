import { Component } from "../components/component.js";

/**
 * Item definition.
 * @typedef {Object} Item
 * @property {string} id - Unique item ID.
 * @property {string} name - Display name.
 * @property {string} type - Item type (consumable, weapon, armor, key).
 * @property {number} value - Sell value.
 * @property {Object} stats - Stat modifiers when equipped.
 * @property {number} stackable - Max stack size (1 for non-stackable).
 */

/**
 * Inventory component for item management.
 * @class Inventory
 * @extends Component
 */
export class Inventory extends Component {
    /**
     * @param {number} maxSlots - Maximum inventory slots.
     */
    constructor(maxSlots = 20) {
        super();
        this.maxSlots = maxSlots;
        this.slots = []; // { item: Item, quantity: number }
        this.gold = 0;
        this.equipment = {};

        this.onItemAdded = null;
        this.onItemRemoved = null;
    }

    /**
     * Add an item to inventory.
     * @param {Item} item 
     * @param {number} quantity 
     * @returns {boolean} True if added successfully.
     */
    addItem(item, quantity = 1) {
        // Try to stack with existing
        if (item.stackable > 1) {
            for (const slot of this.slots) {
                if (slot.item.id === item.id && slot.quantity < item.stackable) {
                    const addAmount = Math.min(quantity, item.stackable - slot.quantity);
                    slot.quantity += addAmount;
                    quantity -= addAmount;
                    if (this.onItemAdded) this.onItemAdded(item, addAmount);
                    if (quantity === 0) return true;
                }
            }
        }

        // Add to new slots
        while (quantity > 0 && this.slots.length < this.maxSlots) {
            const addAmount = item.stackable > 1 ? Math.min(quantity, item.stackable) : 1;
            this.slots.push({ item, quantity: addAmount });
            quantity -= addAmount;
            if (this.onItemAdded) this.onItemAdded(item, addAmount);
        }

        return quantity === 0;
    }

    /**
     * Remove an item from inventory.
     * @param {string} itemId 
     * @param {number} quantity 
     * @returns {boolean} True if removed successfully.
     */
    removeItem(itemId, quantity = 1) {
        for (let i = this.slots.length - 1; i >= 0 && quantity > 0; i--) {
            if (this.slots[i].item.id === itemId) {
                const removeAmount = Math.min(quantity, this.slots[i].quantity);
                this.slots[i].quantity -= removeAmount;
                quantity -= removeAmount;

                if (this.onItemRemoved) this.onItemRemoved(this.slots[i].item, removeAmount);

                if (this.slots[i].quantity === 0) {
                    this.slots.splice(i, 1);
                }
            }
        }
        return quantity === 0;
    }

    /**
     * Check if inventory contains an item.
     * @param {string} itemId 
     * @param {number} quantity 
     * @returns {boolean}
     */
    hasItem(itemId, quantity = 1) {
        let count = 0;
        for (const slot of this.slots) {
            if (slot.item.id === itemId) {
                count += slot.quantity;
            }
        }
        return count >= quantity;
    }

    /**
     * Get total count of an item.
     * @param {string} itemId 
     * @returns {number}
     */
    getItemCount(itemId) {
        let count = 0;
        for (const slot of this.slots) {
            if (slot.item.id === itemId) {
                count += slot.quantity;
            }
        }
        return count;
    }

    canAddItem(item, quantity = 1) {
        if (!item || !Number.isInteger(quantity) || quantity < 1) return false;
        let remaining = quantity;
        if (item.stackable > 1) for (const slot of this.slots) if (slot.item.id === item.id) remaining -= Math.max(0, item.stackable - slot.quantity);
        const needed = item.stackable > 1 ? Math.ceil(Math.max(0, remaining) / item.stackable) : remaining;
        return this.slots.length + needed <= this.maxSlots;
    }

    useItem(itemId, stats) {
        const slot = this.slots.find(entry => entry.item.id === itemId);
        if (!slot || slot.item.type !== "consumable") return false;
        const effects = slot.item.effects ?? {};
        if (effects.health && typeof stats?.heal === "function") stats.heal(effects.health);
        if (effects.stamina && Number.isFinite(stats?.stamina)) stats.stamina = Math.min(stats.maxStamina, stats.stamina + effects.stamina);
        for (const [name, amount] of Object.entries(effects.stats ?? {})) if (Number.isFinite(stats?.[name])) stats[name] += amount;
        this.removeItem(itemId, 1);
        return true;
    }

    equip(itemId) {
        const slot = this.slots.find(entry => entry.item.id === itemId);
        const item = slot?.item;
        const key = item?.slot ?? (item?.type === "weapon" ? "weapon" : item?.type === "armor" ? "armor" : null);
        if (!item || !key) return false;
        const prior = this.equipment[key] ?? null;
        this.equipment[key] = item;
        this.removeItem(itemId, 1);
        if (prior) this.addItem(prior, 1);
        return prior ?? item;
    }

    unequip(key) {
        const item = this.equipment[key];
        if (!item || !this.canAddItem(item, 1)) return false;
        this.addItem(item, 1);
        delete this.equipment[key];
        return item;
    }

    toJSON() {
        return { maxSlots: this.maxSlots, gold: this.gold, slots: this.slots.map(slot => ({ item: structuredClone(slot.item), quantity: slot.quantity })), equipment: structuredClone(this.equipment) };
    }

    loadJSON(data) {
        if (!data || !Number.isInteger(data.maxSlots) || data.maxSlots < 0 || !Array.isArray(data.slots) || !Number.isFinite(data.gold) || data.gold < 0) throw new TypeError("Invalid inventory data");
        if (data.slots.length > data.maxSlots || data.slots.some(slot => !slot.item || !Number.isInteger(slot.quantity) || slot.quantity < 1 || slot.quantity > (slot.item.stackable ?? 1))) throw new TypeError("Invalid inventory slots");
        this.maxSlots = data.maxSlots;
        this.gold = data.gold;
        this.slots = data.slots.map(slot => ({ item: structuredClone(slot.item), quantity: slot.quantity }));
        this.equipment = structuredClone(data.equipment ?? {});
    }

    /**
     * Check if inventory is full.
     */
    get isFull() {
        return this.slots.length >= this.maxSlots;
    }
}
