/**
 * Larissa RPG System - Item, Inventory, Equipment, and Loot Systems
 * RPG-01: Validated item registry, slot-based inventory with capacity and stacking,
 * designated equipment slots with stat modifier binding and slot protection,
 * weighted loot table generator with min/max quantities, and persistence snapshots.
 */

import { Component } from "../components/component.js";

/**
 * Designated equipment slots supported by the equipment system.
 * @type {Array.<string>}
 */
export const EQUIPMENT_SLOTS = Object.freeze(["mainHand", "offHand", "armor", "accessory"]);

/**
 * Validate that an equipment slot name is one of the designated slots.
 * @param {string} slot
 * @returns {boolean}
 */
export function isValidEquipmentSlot(slot) {
    return typeof slot === "string" && EQUIPMENT_SLOTS.includes(slot);
}

/**
 * Deep-freeze a plain object or array to ensure immutability.
 * @param {Object} value
 * @returns {Object}
 */
function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        for (const child of Object.values(value)) {
            deepFreeze(child);
        }
        Object.freeze(value);
    }
    return value;
}

/**
 * Registry for item definitions.
 */
export class ItemRegistry {
    /**
     * @param {Array.<Object>|Object} [items] - Initial item definitions.
     */
    constructor(items = []) {
        /** @type {Map.<string, Object>} */
        this._items = new Map();

        if (Array.isArray(items)) {
            for (const item of items) {
                this.register(item);
            }
        } else if (items && typeof items === "object") {
            for (const item of Object.values(items)) {
                this.register(item);
            }
        }
    }

    /**
     * Register an item definition.
     * @param {Object} itemDef - Item definition object.
     * @returns {Object} Registered immutable item definition.
     */
    register(itemDef) {
        if (!itemDef || typeof itemDef !== "object" || Array.isArray(itemDef)) {
            throw new TypeError("Item definition must be an object");
        }
        if (typeof itemDef.id !== "string" || !itemDef.id.trim()) {
            throw new TypeError("Item id must be a non-empty string");
        }

        const id = itemDef.id.trim();
        const type = typeof itemDef.type === "string" ? itemDef.type : "misc";
        const name = typeof itemDef.name === "string" ? itemDef.name : id;
        const description = typeof itemDef.description === "string" ? itemDef.description : "";

        // Resolve maxStack / stackable
        let maxStack = 1;
        if (Number.isInteger(itemDef.maxStack) && itemDef.maxStack >= 1) {
            maxStack = itemDef.maxStack;
        } else if (Number.isInteger(itemDef.stackable) && itemDef.stackable >= 1) {
            maxStack = itemDef.stackable;
        } else if (type === "consumable") {
            maxStack = 99;
        }

        const value = Number.isFinite(itemDef.value) ? Math.max(0, itemDef.value) : 0;

        // Resolve designated equipment slot
        let slot = itemDef.slot ?? null;
        let allowedSlots = [];
        if (Array.isArray(itemDef.allowedSlots)) {
            allowedSlots = itemDef.allowedSlots.filter(s => isValidEquipmentSlot(s));
        }
        if (!slot) {
            if (type === "weapon") slot = "mainHand";
            else if (type === "armor") slot = "armor";
            else if (type === "accessory") slot = "accessory";
        }
        if (typeof slot === "string" && !allowedSlots.includes(slot)) {
            allowedSlots.push(slot);
        }

        // Normalize stat modifiers
        const stats = {};
        const sourceStats = itemDef.stats ?? itemDef.statModifiers ?? {};
        if (sourceStats && typeof sourceStats === "object") {
            for (const [statKey, statVal] of Object.entries(sourceStats)) {
                if (Number.isFinite(statVal)) {
                    stats[statKey] = statVal;
                }
            }
        }

        // Normalize effects
        const effects = {};
        const sourceEffects = itemDef.effects ?? {};
        if (sourceEffects && typeof sourceEffects === "object") {
            if (Number.isFinite(sourceEffects.health)) effects.health = sourceEffects.health;
            if (Number.isFinite(sourceEffects.stamina)) effects.stamina = sourceEffects.stamina;
            if (sourceEffects.stats && typeof sourceEffects.stats === "object") {
                effects.stats = { ...sourceEffects.stats };
            }
            if (sourceEffects.statModifiers && typeof sourceEffects.statModifiers === "object") {
                effects.stats = { ...sourceEffects.statModifiers };
            }
            if (sourceEffects.statusEffect && typeof sourceEffects.statusEffect === "object") {
                effects.statusEffect = structuredClone(sourceEffects.statusEffect);
            }
        }

        const registered = {
            ...itemDef,
            id,
            name,
            type,
            slot,
            allowedSlots: Object.freeze(allowedSlots),
            maxStack,
            stackable: maxStack,
            value,
            stats: Object.freeze(stats),
            statModifiers: Object.freeze(stats),
            effects: deepFreeze(effects),
            description
        };

        deepFreeze(registered);
        this._items.set(id, registered);
        return registered;
    }

    /**
     * Alias for register.
     * @param {Object} itemDef
     * @returns {Object}
     */
    registerItem(itemDef) {
        return this.register(itemDef);
    }

    /**
     * Retrieve an item definition by id.
     * @param {string} id
     * @returns {Object|null}
     */
    get(id) {
        if (typeof id !== "string") return null;
        return this._items.get(id) ?? null;
    }

    /**
     * Alias for get.
     * @param {string} id
     * @returns {Object|null}
     */
    getItem(id) {
        return this.get(id);
    }

    /**
     * Check if an item id exists.
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        if (typeof id !== "string") return false;
        return this._items.has(id);
    }

    /**
     * Alias for has.
     * @param {string} id
     * @returns {boolean}
     */
    hasItem(id) {
        return this.has(id);
    }

    /**
     * Unregister an item by id.
     * @param {string} id
     * @returns {boolean}
     */
    unregister(id) {
        if (typeof id !== "string") return false;
        return this._items.delete(id);
    }

    /**
     * Get all registered items.
     * @returns {Array.<Object>}
     */
    getAll() {
        return Array.from(this._items.values());
    }

    /**
     * Clear all registered items.
     */
    clear() {
        this._items.clear();
    }
}

/**
 * Equipment system managing designated slots (mainHand, offHand, armor, accessory),
 * stat modifier binding to Combatant/Stats, and incompatible slot rejection.
 */
export class EquipmentSystem extends Component {
    /**
     * @param {Object} [config]
     */
    constructor(config = {}) {
        super();
        const target = config.target ?? null;
        this.target = target;
        this.inventory = config.inventory ?? null;

        // Designated slots: mainHand, offHand, armor, accessory
        this.slots = {
            mainHand: null,
            offHand: null,
            armor: null,
            accessory: null
        };

        // Aliases for legacy compatibility
        Object.defineProperties(this.slots, {
            hand: {
                get: () => this.slots.mainHand,
                set: (val) => { this.slots.mainHand = val; },
                enumerable: false,
                configurable: true
            },
            weapon: {
                get: () => this.slots.mainHand,
                set: (val) => { this.slots.mainHand = val; },
                enumerable: false,
                configurable: true
            }
        });

        this.onEquip = null;
        this.onUnequip = null;
    }

    /**
     * Bind a Combatant, Stats, or composite target to receive equipment stat modifiers.
     * @param {Object} target
     * @returns {EquipmentSystem}
     */
    bindTarget(target) {
        if (this.target && this.target !== target) {
            this.unbindTarget();
        }
        this.target = target;
        // Apply existing equipped items' stats to newly bound target
        if (this.target) {
            for (const item of Object.values(this.slots)) {
                if (item) {
                    this._applyStats(item, this.target);
                }
            }
        }
        return this;
    }

    /**
     * Unbind current target, reverting any applied stat modifiers.
     * @returns {boolean}
     */
    unbindTarget() {
        if (!this.target) return false;
        for (const item of Object.values(this.slots)) {
            if (item) {
                this._revertStats(item, this.target);
            }
        }
        this.target = null;
        return true;
    }

    /**
     * Normalize slot name, mapping aliases like 'hand' or 'weapon' to 'mainHand'.
     * @param {string} slot
     * @returns {string|null}
     */
    normalizeSlot(slot) {
        if (typeof slot !== "string") return null;
        const normalized = slot.trim();
        if (normalized === "hand" || normalized === "weapon") return "mainHand";
        if (EQUIPMENT_SLOTS.includes(normalized)) return normalized;
        return null;
    }

    /**
     * Check if an item can be equipped into a designated slot.
     * Rejects incompatible items, consumables, or unknown slots.
     * @param {string} slot
     * @param {Object} item
     * @returns {boolean}
     */
    canEquip(slot, item) {
        const designatedSlot = this.normalizeSlot(slot);
        if (!designatedSlot) return false;
        if (!item || typeof item !== "object") return false;

        // Consumables cannot be equipped
        if (item.type === "consumable") return false;

        // Gather allowed slots for this item
        const allowed = new Set();
        if (Array.isArray(item.allowedSlots)) {
            for (const s of item.allowedSlots) {
                const norm = this.normalizeSlot(s);
                if (norm) allowed.add(norm);
            }
        }
        if (typeof item.slot === "string") {
            const norm = this.normalizeSlot(item.slot);
            if (norm) allowed.add(norm);
        }

        // Inferred fallback from item.type
        if (allowed.size === 0) {
            if (item.type === "weapon") allowed.add("mainHand");
            else if (item.type === "armor") allowed.add("armor");
            else if (item.type === "accessory") allowed.add("accessory");
        }

        return allowed.has(designatedSlot);
    }

    /**
     * Equip an item into a designated slot.
     * Modifies bound Combatant/Stats and reverts previous item stats if replacing.
     * Rejects incompatible slots.
     * @param {string|Object} slotOrItem
     * @param {Object} [maybeItem]
     * @param {Object} [options]
     * @returns {Object|boolean} Returns previous item or equipped item on success, false on rejection.
     */
    equip(slotOrItem, maybeItem, options = {}) {
        let slot;
        let item;
        let opt = options;

        if (typeof slotOrItem === "string") {
            slot = slotOrItem;
            item = maybeItem;
        } else if (slotOrItem && typeof slotOrItem === "object") {
            item = slotOrItem;
            slot = item.slot ?? null;
            if (maybeItem && typeof maybeItem === "object") {
                opt = maybeItem;
            }
        }

        const designatedSlot = this.normalizeSlot(slot);
        if (!designatedSlot || !this.canEquip(designatedSlot, item)) {
            if (opt.throwOnError) {
                throw new Error(`Incompatible equipment slot '${slot}' for item '${item?.id ?? "unknown"}'`);
            }
            return false;
        }

        const target = opt.target ?? this.target;
        const previousItem = this.slots[designatedSlot];

        // If slot currently has an item, unequip it first
        if (previousItem) {
            if (target) {
                this._revertStats(previousItem, target);
            }
            this.slots[designatedSlot] = null;
            if (this.onUnequip) {
                this.onUnequip(designatedSlot, previousItem);
            }
        }

        // Equip new item
        this.slots[designatedSlot] = item;
        if (target) {
            this._applyStats(item, target);
        }
        if (this.onEquip) {
            this.onEquip(designatedSlot, item);
        }

        return previousItem ?? item;
    }

    /**
     * Unequip item from a designated slot, reverting stats on bound Combatant/Stats.
     * @param {string} slot
     * @param {Object} [options]
     * @returns {Object|null} Unequipped item or null if slot was empty.
     */
    unequip(slot, options = {}) {
        const designatedSlot = this.normalizeSlot(slot);
        if (!designatedSlot) return null;

        const item = this.slots[designatedSlot];
        if (!item) return null;

        const target = options.target ?? this.target;
        if (target) {
            this._revertStats(item, target);
        }

        this.slots[designatedSlot] = null;
        if (this.onUnequip) {
            this.onUnequip(designatedSlot, item);
        }

        return item;
    }

    /**
     * Get item in a designated slot.
     * @param {string} slot
     * @returns {Object|null}
     */
    getSlot(slot) {
        const designatedSlot = this.normalizeSlot(slot);
        if (!designatedSlot) return null;
        return this.slots[designatedSlot] ?? null;
    }

    /**
     * Alias for getSlot.
     * @param {string} slot
     * @returns {Object|null}
     */
    getEquippedItem(slot) {
        return this.getSlot(slot);
    }

    /**
     * Compute total stat modifier for a specific stat across all equipped items.
     * @param {string} statName
     * @returns {number}
     */
    getStatModifier(statName) {
        if (typeof statName !== "string" || !statName) return 0;
        let total = 0;
        for (const slotName of EQUIPMENT_SLOTS) {
            const item = this.slots[slotName];
            if (item) {
                const statMods = item.stats ?? item.statModifiers ?? {};
                if (Number.isFinite(statMods[statName])) {
                    total += statMods[statName];
                }
            }
        }
        return total;
    }

    /**
     * Compute aggregate stat modifiers across all equipped items.
     * @returns {Object}
     */
    getAllStatModifiers() {
        const totals = {};
        for (const slotName of EQUIPMENT_SLOTS) {
            const item = this.slots[slotName];
            if (item) {
                const statMods = item.stats ?? item.statModifiers ?? {};
                for (const [name, val] of Object.entries(statMods)) {
                    if (Number.isFinite(val)) {
                        totals[name] = (totals[name] ?? 0) + val;
                    }
                }
            }
        }
        return totals;
    }

    /**
     * Apply an item's stat modifiers to a target (Combatant, Stats, or both).
     * @private
     * @param {Object} item
     * @param {Object} target
     */
    _applyStats(item, target) {
        if (!item || !target) return;
        const stats = item.stats ?? item.statModifiers ?? {};

        // Target can be a composite { combatant, stats } or direct instance
        const targets = [];
        if (target.combatant) targets.push(target.combatant);
        if (target.stats) targets.push(target.stats);
        if (!targets.includes(target)) targets.push(target);

        for (const [statName, amount] of Object.entries(stats)) {
            if (!Number.isFinite(amount)) continue;

            for (const t of targets) {
                if (statName === "maxHealth") {
                    if (Number.isFinite(t.maxHealth)) {
                        t.maxHealth += amount;
                    }
                } else if (t.resistances && Object.hasOwn(t.resistances, statName)) {
                    t.resistances[statName] = Math.max(0, Math.min(1, (t.resistances[statName] ?? 0) + amount));
                } else if (typeof t[statName] === "number") {
                    t[statName] += amount;
                }
            }
        }
    }

    /**
     * Revert an item's stat modifiers from a target (Combatant, Stats, or both).
     * @private
     * @param {Object} item
     * @param {Object} target
     */
    _revertStats(item, target) {
        if (!item || !target) return;
        const stats = item.stats ?? item.statModifiers ?? {};

        const targets = [];
        if (target.combatant) targets.push(target.combatant);
        if (target.stats) targets.push(target.stats);
        if (!targets.includes(target)) targets.push(target);

        for (const [statName, amount] of Object.entries(stats)) {
            if (!Number.isFinite(amount)) continue;

            for (const t of targets) {
                if (statName === "maxHealth") {
                    if (Number.isFinite(t.maxHealth)) {
                        t.maxHealth = Math.max(1, t.maxHealth - amount);
                        if (t.health > t.maxHealth) {
                            if (typeof t.setHealth === "function") {
                                t.setHealth(t.maxHealth);
                            } else {
                                t.health = t.maxHealth;
                            }
                        }
                    }
                } else if (t.resistances && Object.hasOwn(t.resistances, statName)) {
                    t.resistances[statName] = Math.max(0, Math.min(1, (t.resistances[statName] ?? 0) - amount));
                } else if (typeof t[statName] === "number") {
                    t[statName] -= amount;
                }
            }
        }
    }

    /**
     * Create persistence snapshot of equipped items.
     * @returns {Object}
     */
    createSnapshot() {
        const slotsData = {};
        for (const slotName of EQUIPMENT_SLOTS) {
            slotsData[slotName] = this.slots[slotName] ? structuredClone(this.slots[slotName]) : null;
        }
        return {
            slots: slotsData
        };
    }

    /**
     * Restore equipped items from snapshot, maintaining stat modifier binding.
     * @param {Object} snapshot
     * @param {Object} [options]
     * @returns {boolean}
     */
    restoreSnapshot(snapshot, options = {}) {
        if (!snapshot || typeof snapshot !== "object") {
            throw new TypeError("Invalid equipment snapshot data");
        }
        const slotsData = snapshot.slots ?? snapshot;
        const registry = options.registry ?? null;
        const target = options.target ?? this.target;

        // Unequip all current slots first to revert old stats
        for (const slotName of EQUIPMENT_SLOTS) {
            if (this.slots[slotName]) {
                this.unequip(slotName, { target });
            }
        }

        // Restore each slot
        for (const slotName of EQUIPMENT_SLOTS) {
            let item = slotsData[slotName] ?? null;
            if (typeof item === "string" && registry) {
                item = registry.get(item);
            }
            if (item) {
                this.equip(slotName, item, { target });
            }
        }

        return true;
    }

    /**
     * Export to plain JSON representation.
     * @returns {Object}
     */
    toJSON() {
        return this.createSnapshot().slots;
    }

    /**
     * Load from JSON representation.
     * @param {Object} data
     */
    loadJSON(data) {
        this.restoreSnapshot(data);
    }
}

/**
 * Slot-based inventory with stacking (maxStack), capacity limits (maxSlots),
 * item add/remove/consume methods, and integrated equipment handling.
 */
export class Inventory extends Component {
    /**
     * @param {number|Object} [maxSlotsOrConfig] - Max slots number or configuration object.
     * @param {Object} [config] - Optional configuration when first param is number.
     */
    constructor(maxSlotsOrConfig = 20, config = {}) {
        super();

        let maxSlots = 20;
        let maxStack = 99;
        let gold = 0;
        let registry = null;

        if (typeof maxSlotsOrConfig === "number") {
            maxSlots = maxSlotsOrConfig;
            if (config && typeof config === "object") {
                if (Number.isInteger(config.maxStack) && config.maxStack >= 1) maxStack = config.maxStack;
                if (Number.isFinite(config.gold)) gold = Math.max(0, config.gold);
                if (Number.isFinite(config.currency)) gold = Math.max(0, config.currency);
                if (config.registry) registry = config.registry;
            }
        } else if (maxSlotsOrConfig && typeof maxSlotsOrConfig === "object") {
            if (Number.isInteger(maxSlotsOrConfig.maxSlots)) maxSlots = maxSlotsOrConfig.maxSlots;
            if (Number.isInteger(maxSlotsOrConfig.maxStack) && maxSlotsOrConfig.maxStack >= 1) maxStack = maxSlotsOrConfig.maxStack;
            if (Number.isFinite(maxSlotsOrConfig.gold)) gold = Math.max(0, maxSlotsOrConfig.gold);
            if (Number.isFinite(maxSlotsOrConfig.currency)) gold = Math.max(0, maxSlotsOrConfig.currency);
            if (maxSlotsOrConfig.registry) registry = maxSlotsOrConfig.registry;
        }

        this.maxSlots = maxSlots;
        this.maxStack = maxStack;
        this.slots = []; // Array of { item: Object, quantity: number }
        this.gold = gold;
        this.registry = registry;

        this.equipmentSystem = new EquipmentSystem({ inventory: this });

        this.onItemAdded = null;
        this.onItemRemoved = null;
    }

    /**
     * Currency alias for gold.
     * @type {number}
     */
    get currency() {
        return this.gold;
    }

    set currency(value) {
        if (!Number.isFinite(value) || value < 0) {
            throw new TypeError("Currency must be a non-negative finite number");
        }
        this.gold = value;
    }

    /**
     * Equipment mapping getter mirroring the equipment system slots.
     * Non-null slots are enumerable so Object.entries(equipment) reflects only equipped items,
     * while direct slot property access (e.g. equipment.mainHand or equipment.weapon) returns the item or null.
     * @type {Object}
     */
    get equipment() {
        const slots = this.equipmentSystem.slots;
        return new Proxy(slots, {
            get(target, prop) {
                if (prop === "weapon" || prop === "hand") {
                    return target.mainHand ?? null;
                }
                if (typeof prop === "string" && prop in target) {
                    return target[prop] ?? null;
                }
                return target[prop];
            },
            has(target, prop) {
                if (prop === "weapon" || prop === "hand") {
                    return target.mainHand !== null;
                }
                return prop in target && target[prop] !== null;
            },
            ownKeys(target) {
                const keys = [];
                for (const k of Object.keys(target)) {
                    if (target[k] !== null) {
                        const item = target[k];
                        if (k === "mainHand" && item?.slot === "weapon") {
                            keys.push("weapon");
                        } else {
                            keys.push(k);
                        }
                    }
                }
                return keys;
            },
            getOwnPropertyDescriptor(target, prop) {
                if ((prop === "weapon" || prop === "hand") && target.mainHand) {
                    return {
                        value: target.mainHand,
                        writable: true,
                        enumerable: true,
                        configurable: true
                    };
                }
                if (target[prop] !== null && target[prop] !== undefined) {
                    return {
                        value: target[prop],
                        writable: true,
                        enumerable: true,
                        configurable: true
                    };
                }
                return undefined;
            }
        });
    }

    set equipment(value) {
        if (value && typeof value === "object") {
            this.equipmentSystem.restoreSnapshot(value);
        }
    }

    /**
     * Check if inventory is full.
     * @type {boolean}
     */
    get isFull() {
        return this.slots.length >= this.maxSlots;
    }

    /**
     * Resolve an item object from item or item id.
     * @private
     * @param {Object|string} itemOrId
     * @returns {Object|null}
     */
    _resolveItem(itemOrId) {
        if (!itemOrId) return null;
        if (typeof itemOrId === "object" && itemOrId.id) return itemOrId;
        if (typeof itemOrId === "string" && this.registry) return this.registry.get(itemOrId);
        return null;
    }

    /**
     * Resolve the maxStack limit for an item.
     * @param {Object} item
     * @returns {number}
     */
    getItemMaxStack(item) {
        if (!item) return 1;
        if (Number.isInteger(item.maxStack) && item.maxStack >= 1) return item.maxStack;
        if (Number.isInteger(item.stackable) && item.stackable >= 1) return item.stackable;
        if (item.type === "consumable") return this.maxStack;
        return 1;
    }

    /**
     * Check whether an item quantity can be added without exceeding capacity limits.
     * @param {Object|string} itemOrId
     * @param {number} [quantity]
     * @returns {boolean}
     */
    canAddItem(itemOrId, quantity = 1) {
        const item = this._resolveItem(itemOrId);
        if (!item || !Number.isInteger(quantity) || quantity < 1) return false;

        const maxStack = this.getItemMaxStack(item);
        let remaining = quantity;

        if (maxStack > 1) {
            for (const slot of this.slots) {
                if (slot.item.id === item.id && slot.quantity < maxStack) {
                    remaining -= Math.max(0, maxStack - slot.quantity);
                }
            }
        }

        const needed = maxStack > 1 ? Math.ceil(Math.max(0, remaining) / maxStack) : remaining;
        return this.slots.length + needed <= this.maxSlots;
    }

    /**
     * Add an item to the inventory.
     * Stacks with existing matching slots up to maxStack, then allocates new slots.
     * Enforces maxSlots capacity limits to prevent overflow.
     * @param {Object|string} itemOrId
     * @param {number} [quantity]
     * @param {Object} [options]
     * @returns {boolean} True if added successfully, false if rejected due to capacity.
     */
    addItem(itemOrId, quantity = 1, options = {}) {
        const item = this._resolveItem(itemOrId);
        if (!item || !Number.isInteger(quantity) || quantity < 1) return false;

        const allowPartial = options.allowPartial ?? false;

        // Atomic check: prevent overflow if total quantity cannot fit
        if (!allowPartial && !this.canAddItem(item, quantity)) {
            return false;
        }

        const maxStack = this.getItemMaxStack(item);
        let remaining = quantity;

        // 1. Stack into existing slots
        if (maxStack > 1) {
            for (const slot of this.slots) {
                if (slot.item.id === item.id && slot.quantity < maxStack) {
                    const addAmount = Math.min(remaining, maxStack - slot.quantity);
                    slot.quantity += addAmount;
                    remaining -= addAmount;
                    if (this.onItemAdded) this.onItemAdded(item, addAmount);
                    if (remaining === 0) return true;
                }
            }
        }

        // 2. Add to new slots up to maxSlots
        while (remaining > 0 && this.slots.length < this.maxSlots) {
            const addAmount = maxStack > 1 ? Math.min(remaining, maxStack) : 1;
            this.slots.push({ item, quantity: addAmount });
            remaining -= addAmount;
            if (this.onItemAdded) this.onItemAdded(item, addAmount);
        }

        return remaining === 0;
    }

    /**
     * Remove an item quantity from the inventory.
     * @param {string} itemId
     * @param {number} [quantity]
     * @returns {boolean} True if removed successfully, false if insufficient items.
     */
    removeItem(itemId, quantity = 1) {
        if (typeof itemId !== "string" || !Number.isInteger(quantity) || quantity < 1) return false;
        if (this.getItemCount(itemId) < quantity) return false;

        let remaining = quantity;
        for (let i = this.slots.length - 1; i >= 0 && remaining > 0; i--) {
            if (this.slots[i].item.id === itemId) {
                const removeAmount = Math.min(remaining, this.slots[i].quantity);
                this.slots[i].quantity -= removeAmount;
                remaining -= removeAmount;

                if (this.onItemRemoved) this.onItemRemoved(this.slots[i].item, removeAmount);

                if (this.slots[i].quantity === 0) {
                    this.slots.splice(i, 1);
                }
            }
        }
        return remaining === 0;
    }

    /**
     * Check if inventory contains at least quantity of an item.
     * @param {string} itemId
     * @param {number} [quantity]
     * @returns {boolean}
     */
    hasItem(itemId, quantity = 1) {
        if (typeof itemId !== "string" || !Number.isInteger(quantity) || quantity < 1) return false;
        return this.getItemCount(itemId) >= quantity;
    }

    /**
     * Get total quantity of an item across all slots.
     * @param {string} itemId
     * @returns {number}
     */
    getItemCount(itemId) {
        if (typeof itemId !== "string") return 0;
        let count = 0;
        for (const slot of this.slots) {
            if (slot.item.id === itemId) {
                count += slot.quantity;
            }
        }
        return count;
    }

    /**
     * Consume a consumable item, applying its effects to the target and decrementing count.
     * Supports targets that are Combatant, Stats, or custom entities.
     * @param {string} itemId
     * @param {Object} target - Target Combatant or Stats.
     * @returns {boolean} True if consumed successfully, false otherwise.
     */
    consume(itemId, target) {
        if (typeof itemId !== "string") return false;
        const slot = this.slots.find(entry => entry.item.id === itemId);
        if (!slot || slot.item.type !== "consumable") return false;

        const item = slot.item;
        const effects = item.effects ?? {};

        // 1. Health restoration
        if (Number.isFinite(effects.health)) {
            if (typeof target?.heal === "function") {
                target.heal(effects.health);
            } else if (Number.isFinite(target?.health)) {
                const max = target.maxHealth ?? Infinity;
                target.health = Math.min(max, target.health + effects.health);
            }
        }

        // 2. Stamina restoration
        if (Number.isFinite(effects.stamina) && Number.isFinite(target?.stamina)) {
            const maxStamina = target.maxStamina ?? Infinity;
            target.stamina = Math.min(maxStamina, target.stamina + effects.stamina);
        }

        // 3. Stat modifications
        const statMods = effects.stats ?? effects.statModifiers ?? {};
        for (const [statName, amount] of Object.entries(statMods)) {
            if (Number.isFinite(amount)) {
                if (Number.isFinite(target?.[statName])) {
                    target[statName] += amount;
                } else if (target?.stats && Number.isFinite(target.stats[statName])) {
                    target.stats[statName] += amount;
                }
            }
        }

        // 4. Status effects
        if (effects.statusEffect && typeof target?.applyEffect === "function") {
            target.applyEffect(effects.statusEffect);
        }

        // 5. Custom onUse hook
        if (typeof item.onUse === "function") {
            item.onUse(target, item);
        }

        // Decrement item count
        this.removeItem(itemId, 1);
        return true;
    }

    /**
     * Alias for consume.
     * @param {string} itemId
     * @param {Object} target
     * @returns {boolean}
     */
    useItem(itemId, target) {
        return this.consume(itemId, target);
    }

    /**
     * Alias for consume.
     * @param {string} itemId
     * @param {Object} target
     * @returns {boolean}
     */
    consumeItem(itemId, target) {
        return this.consume(itemId, target);
    }

    /**
     * Equip an item from inventory into designated equipment slot.
     * @param {string} slotOrItemId
     * @param {string} [maybeItemId]
     * @returns {Object|boolean}
     */
    equip(slotOrItemId, maybeItemId) {
        let slotName = null;
        let itemId = null;

        if (maybeItemId !== undefined) {
            slotName = slotOrItemId;
            itemId = maybeItemId;
        } else {
            itemId = slotOrItemId;
        }

        const slotIndex = this.slots.findIndex(entry => entry.item.id === itemId);
        if (slotIndex === -1) return false;
        const item = this.slots[slotIndex].item;

        if (!slotName) {
            slotName = item.slot ?? (item.type === "weapon" ? "mainHand" : item.type === "armor" ? "armor" : item.type === "accessory" ? "accessory" : null);
        }
        const designatedSlot = this.equipmentSystem.normalizeSlot(slotName);
        if (!designatedSlot || !this.equipmentSystem.canEquip(designatedSlot, item)) {
            return false;
        }

        const prior = this.equipmentSystem.slots[designatedSlot];

        // Remove 1 quantity of the item from inventory
        this.removeItem(itemId, 1);

        // Equip into equipment system
        this.equipmentSystem.equip(designatedSlot, item);

        // Put prior item back into inventory if present
        if (prior) {
            this.addItem(prior, 1);
        }

        return prior ?? item;
    }

    /**
     * Unequip an item from equipment slot back into inventory.
     * Rejects if inventory has no capacity to store the unequipped item.
     * @param {string} slot
     * @returns {Object|boolean} Unequipped item or false if failed.
     */
    unequip(slot) {
        const designatedSlot = this.equipmentSystem.normalizeSlot(slot);
        if (!designatedSlot) return false;

        const item = this.equipmentSystem.slots[designatedSlot];
        if (!item) return false;

        // Check if inventory has room
        if (!this.canAddItem(item, 1)) {
            return false;
        }

        this.equipmentSystem.unequip(designatedSlot);
        this.addItem(item, 1);
        return item;
    }

    /**
     * Add currency (gold).
     * @param {number} amount
     * @returns {number} Total currency.
     */
    addCurrency(amount) {
        if (!Number.isFinite(amount) || amount < 0) {
            throw new RangeError("Currency amount must be a non-negative finite number");
        }
        this.gold += amount;
        return this.gold;
    }

    /**
     * Deduct currency (gold) if sufficient.
     * @param {number} amount
     * @returns {boolean} True if deducted, false if insufficient.
     */
    removeCurrency(amount) {
        if (!Number.isFinite(amount) || amount < 0) {
            throw new RangeError("Currency amount must be a non-negative finite number");
        }
        if (this.gold < amount) return false;
        this.gold -= amount;
        return true;
    }

    /**
     * Check if inventory has at least currency amount.
     * @param {number} amount
     * @returns {boolean}
     */
    hasCurrency(amount) {
        if (!Number.isFinite(amount) || amount < 0) return false;
        return this.gold >= amount;
    }

    /**
     * Create persistence snapshot of inventory, equipment, and currency.
     * @returns {Object}
     */
    createSnapshot() {
        return {
            version: 1,
            maxSlots: this.maxSlots,
            maxStack: this.maxStack,
            currency: this.gold,
            gold: this.gold,
            slots: this.slots.map(s => ({
                itemId: s.item.id,
                quantity: s.quantity,
                item: structuredClone(s.item)
            })),
            equipment: this.equipmentSystem.createSnapshot()
        };
    }

    /**
     * Restore inventory, equipment, and currency from persistence snapshot.
     * @param {Object} snapshot
     * @param {Object} [options]
     * @returns {boolean}
     */
    restoreSnapshot(snapshot, options = {}) {
        if (!snapshot || typeof snapshot !== "object") {
            throw new TypeError("Invalid inventory snapshot data");
        }
        if (Number.isInteger(snapshot.maxSlots) && snapshot.maxSlots >= 0) {
            this.maxSlots = snapshot.maxSlots;
        }
        if (Number.isInteger(snapshot.maxStack) && snapshot.maxStack >= 1) {
            this.maxStack = snapshot.maxStack;
        }

        this.gold = Number.isFinite(snapshot.currency) ? Math.max(0, snapshot.currency)
            : Number.isFinite(snapshot.gold) ? Math.max(0, snapshot.gold) : 0;

        const registry = options.registry ?? this.registry;
        const target = options.target ?? null;

        this.slots = [];
        if (Array.isArray(snapshot.slots)) {
            for (const slotData of snapshot.slots) {
                let item = slotData.item;
                if (!item && registry && slotData.itemId) {
                    item = registry.get(slotData.itemId);
                }
                if (item && Number.isInteger(slotData.quantity) && slotData.quantity > 0) {
                    this.slots.push({
                        item: structuredClone(item),
                        quantity: slotData.quantity
                    });
                }
            }
        }

        if (snapshot.equipment) {
            this.equipmentSystem.restoreSnapshot(snapshot.equipment, { registry, target });
        }

        return true;
    }

    /**
     * Export to plain JSON representation.
     * @returns {Object}
     */
    toJSON() {
        return {
            maxSlots: this.maxSlots,
            gold: this.gold,
            currency: this.gold,
            slots: this.slots.map(slot => ({
                item: structuredClone(slot.item),
                quantity: slot.quantity
            })),
            equipment: structuredClone(this.equipmentSystem.toJSON())
        };
    }

    /**
     * Load state from plain JSON representation.
     * @param {Object} data
     */
    loadJSON(data) {
        if (!data || !Number.isInteger(data.maxSlots) || data.maxSlots < 0 || !Array.isArray(data.slots) || !Number.isFinite(data.gold) || data.gold < 0) {
            throw new TypeError("Invalid inventory data");
        }
        if (data.slots.length > data.maxSlots || data.slots.some(slot => !slot.item || !Number.isInteger(slot.quantity) || slot.quantity < 1 || slot.quantity > (slot.item.maxStack ?? slot.item.stackable ?? 1))) {
            throw new TypeError("Invalid inventory slots");
        }
        this.maxSlots = data.maxSlots;
        this.gold = data.gold;
        this.slots = data.slots.map(slot => ({ item: structuredClone(slot.item), quantity: slot.quantity }));

        // Clear equipment
        for (const slot of EQUIPMENT_SLOTS) {
            this.equipmentSystem.slots[slot] = null;
        }

        if (data.equipment) {
            const eqData = data.equipment.slots ?? data.equipment;
            for (const [k, v] of Object.entries(eqData)) {
                const designatedSlot = this.equipmentSystem.normalizeSlot(k);
                if (designatedSlot && v) {
                    this.equipmentSystem.slots[designatedSlot] = structuredClone(v);
                }
            }
        }
    }
}

/**
 * Loot table managing weighted drop rolls with min/max quantities.
 */
export class LootTable {
    /**
     * @param {Array.<Object>} [entries] - Initial loot entries.
     * @param {Object} [config] - Optional configuration { id, name }.
     */
    constructor(entries = [], config = {}) {
        this.id = config.id ?? null;
        this.name = config.name ?? null;
        this.entries = [];

        if (Array.isArray(entries)) {
            for (const entry of entries) {
                this.addEntry(entry);
            }
        }
    }

    /**
     * Add a drop entry to the loot table.
     * @param {Object} entry - { itemId, weight, minQuantity, maxQuantity, chance, item }
     * @returns {LootTable}
     */
    addEntry(entry) {
        if (!entry || typeof entry !== "object") {
            throw new TypeError("LootTable entry must be an object");
        }
        const itemId = entry.itemId ?? entry.id;
        if (typeof itemId !== "string" || !itemId.trim()) {
            throw new TypeError("LootTable entry itemId must be a non-empty string");
        }

        const weight = Number.isFinite(entry.weight) ? Math.max(0, entry.weight) : 1;
        const chance = Number.isFinite(entry.chance) ? Math.min(1, Math.max(0, entry.chance)) : 1;

        let minQuantity = 1;
        if (Number.isInteger(entry.minQuantity) && entry.minQuantity >= 1) minQuantity = entry.minQuantity;
        else if (Number.isInteger(entry.min) && entry.min >= 1) minQuantity = entry.min;
        else if (Number.isInteger(entry.quantity) && entry.quantity >= 1) minQuantity = entry.quantity;

        let maxQuantity = minQuantity;
        if (Number.isInteger(entry.maxQuantity) && entry.maxQuantity >= minQuantity) maxQuantity = entry.maxQuantity;
        else if (Number.isInteger(entry.max) && entry.max >= minQuantity) maxQuantity = entry.max;

        this.entries.push({
            itemId: itemId.trim(),
            weight,
            chance,
            minQuantity,
            maxQuantity,
            item: entry.item ?? null
        });

        return this;
    }

    /**
     * Convenience method to add an item drop.
     * @param {string} itemId
     * @param {number} [weight]
     * @param {number} [minQuantity]
     * @param {number} [maxQuantity]
     * @param {number} [chance]
     * @returns {LootTable}
     */
    addItem(itemId, weight = 1, minQuantity = 1, maxQuantity = 1, chance = 1) {
        return this.addEntry({ itemId, weight, minQuantity, maxQuantity, chance });
    }

    /**
     * Remove a drop entry by item id.
     * @param {string} itemId
     * @returns {boolean}
     */
    removeEntry(itemId) {
        if (typeof itemId !== "string") return false;
        const initialLen = this.entries.length;
        this.entries = this.entries.filter(e => e.itemId !== itemId);
        return this.entries.length < initialLen;
    }

    /**
     * Roll drops from this loot table.
     * Supports weighted roll mode (default) and independent chance mode.
     * Produces random quantities between minQuantity and maxQuantity inclusive.
     * @param {Object|Function} [optionsOrRandom] - Options object or custom random function.
     * @returns {Array.<Object>} Array of generated drops { itemId, quantity, [item] }
     */
    roll(optionsOrRandom = {}) {
        let random = Math.random;
        let rolls = 1;
        let mode = "weighted";

        if (typeof optionsOrRandom === "function") {
            random = optionsOrRandom;
        } else if (optionsOrRandom && typeof optionsOrRandom === "object") {
            if (typeof optionsOrRandom.random === "function") random = optionsOrRandom.random;
            if (Number.isInteger(optionsOrRandom.rolls) && optionsOrRandom.rolls >= 1) rolls = optionsOrRandom.rolls;
            if (typeof optionsOrRandom.mode === "string") mode = optionsOrRandom.mode;
        }

        if (this.entries.length === 0) return [];

        if (mode === "independent") {
            const results = [];
            for (const entry of this.entries) {
                const rollVal = random();
                if (rollVal <= entry.chance) {
                    const quantity = this._rollQuantity(entry, random);
                    if (quantity > 0) {
                        results.push({
                            itemId: entry.itemId,
                            quantity,
                            item: entry.item
                        });
                    }
                }
            }
            return results;
        }

        // Weighted drop generation mode
        const totalWeight = this.entries.reduce((sum, e) => sum + e.weight, 0);
        if (totalWeight <= 0) return [];

        const results = [];
        for (let r = 0; r < rolls; r++) {
            let rollPick = random() * totalWeight;
            let selected = this.entries[this.entries.length - 1];

            for (const entry of this.entries) {
                if (rollPick < entry.weight) {
                    selected = entry;
                    break;
                }
                rollPick -= entry.weight;
            }

            // Independent chance gate on chosen entry
            if (selected.chance < 1 && random() > selected.chance) {
                continue;
            }

            const quantity = this._rollQuantity(selected, random);
            if (quantity > 0) {
                const existing = results.find(d => d.itemId === selected.itemId);
                if (existing) {
                    existing.quantity += quantity;
                } else {
                    results.push({
                        itemId: selected.itemId,
                        quantity,
                        item: selected.item
                    });
                }
            }
        }

        return results;
    }

    /**
     * Compute quantity between minQuantity and maxQuantity inclusive.
     * @private
     * @param {Object} entry
     * @param {Function} random
     * @returns {number}
     */
    _rollQuantity(entry, random) {
        if (entry.minQuantity === entry.maxQuantity) {
            return entry.minQuantity;
        }
        const delta = entry.maxQuantity - entry.minQuantity;
        const randVal = Math.min(0.999999, Math.max(0, random()));
        return entry.minQuantity + Math.floor(randVal * (delta + 1));
    }

    /**
     * Export to plain JSON representation.
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            entries: this.entries.map(e => ({ ...e }))
        };
    }

    /**
     * Reconstruct a LootTable from JSON data.
     * @param {Object} data
     * @returns {LootTable}
     */
    static fromJSON(data) {
        if (!data || !Array.isArray(data.entries)) {
            throw new TypeError("Invalid LootTable data");
        }
        return new LootTable(data.entries, { id: data.id, name: data.name });
    }
}

/**
 * Helper to create a unified snapshot for inventory, equipment, and currency.
 * @param {Object} context
 * @returns {Object}
 */
export function createRPGSnapshot({ inventory = null, equipment = null, currency = 0 } = {}) {
    return {
        version: 1,
        timestamp: Date.now(),
        currency: Number.isFinite(currency) ? currency : (inventory?.gold ?? 0),
        inventory: inventory ? inventory.createSnapshot() : null,
        equipment: equipment ? equipment.createSnapshot() : (inventory?.equipmentSystem ? inventory.equipmentSystem.createSnapshot() : null)
    };
}

/**
 * Helper to restore a unified snapshot for inventory, equipment, and currency.
 * @param {Object} snapshot
 * @param {Object} context
 * @returns {boolean}
 */
export function restoreRPGSnapshot(snapshot, { inventory = null, equipment = null, target = null, registry = null } = {}) {
    if (!snapshot || typeof snapshot !== "object") {
        throw new TypeError("Invalid RPG snapshot");
    }

    if (inventory && snapshot.inventory) {
        inventory.restoreSnapshot(snapshot.inventory, { registry, target });
    } else if (inventory && Number.isFinite(snapshot.currency)) {
        inventory.gold = snapshot.currency;
    }

    if (equipment && snapshot.equipment) {
        equipment.restoreSnapshot(snapshot.equipment, { registry, target });
    }

    return true;
}
