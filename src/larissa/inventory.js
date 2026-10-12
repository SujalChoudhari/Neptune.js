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

    /**
     * Check if inventory is full.
     */
    get isFull() {
        return this.slots.length >= this.maxSlots;
    }
}
