import { Component } from "../components/component.js";

/** Configurable experience/level progression with deterministic level events. */
export class Progression extends Component {
    constructor({ level = 1, experience = 0, baseExperience = 100, growthRate = 1.5, stats = {} } = {}) {
        super();
        if (!Number.isInteger(level) || level < 1) throw new RangeError("Level must be a positive integer");
        if (!Number.isFinite(experience) || experience < 0) throw new RangeError("Experience must be non-negative");
        if (!Number.isFinite(baseExperience) || baseExperience <= 0) throw new RangeError("baseExperience must be positive");
        if (!Number.isFinite(growthRate) || growthRate < 1) throw new RangeError("growthRate must be at least 1");
        this.level = level;
        this.experience = experience;
        this.baseExperience = baseExperience;
        this.growthRate = growthRate;
        this.stats = { ...stats };
        this.skills = new Set();
        this.listeners = new Set();
    }

    experienceToNextLevel(level = this.level) { return Math.floor(this.baseExperience * this.growthRate ** (level - 1)); }
    onProgression(listener) {
        if (typeof listener !== "function") throw new TypeError("Listener must be a function");
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    grantExperience(amount) {
        if (!Number.isFinite(amount) || amount < 0) throw new RangeError("Experience must be non-negative");
        this.experience += amount;
        const levels = [];
        while (this.experience >= this.experienceToNextLevel()) {
            this.experience -= this.experienceToNextLevel();
            this.level += 1;
            levels.push(this.level);
            for (const listener of this.listeners) listener({ type: "level-up", level: this.level, experience: this.experience });
        }
        return levels;
    }
    unlockSkill(skillId) {
        if (typeof skillId !== "string" || !skillId) throw new TypeError("skillId must be a non-empty string");
        if (this.skills.has(skillId)) return false;
        this.skills.add(skillId);
        for (const listener of this.listeners) listener({ type: "skill-unlocked", skillId, level: this.level });
        return true;
    }
    toJSON() { return { level: this.level, experience: this.experience, baseExperience: this.baseExperience, growthRate: this.growthRate, stats: { ...this.stats }, skills: [...this.skills] }; }
    static fromJSON(data) {
        const progression = new Progression(data);
        for (const skill of data.skills ?? []) progression.skills.add(skill);
        return progression;
    }
}

/** Table of item definitions and gameplay data for RPG systems. */
export class GameData {
    constructor({ items = {}, lootTables = {}, shops = {}, quests = {}, rewards = {} } = {}) {
        this.items = new Map(Object.entries(items));
        this.lootTables = new Map(Object.entries(lootTables));
        this.shops = new Map(Object.entries(shops));
        this.quests = new Map(Object.entries(quests));
        this.rewards = new Map(Object.entries(rewards));
    }
    getItem(id) { return this.items.get(id) ?? null; }
    rollLoot(tableId, random = Math.random) {
        const table = this.lootTables.get(tableId);
        if (!table) throw new RangeError(`Unknown loot table: ${tableId}`);
        return table.filter(entry => random() < (entry.chance ?? 1)).map(entry => ({ itemId: entry.itemId, quantity: entry.quantity ?? 1 }));
    }
    toJSON() { return Object.fromEntries(["items", "lootTables", "shops", "quests", "rewards"].map(key => [key, Object.fromEntries(this[key])])); }
    static fromJSON(data) { return new GameData(data); }
}

/** Apply declared data rewards and publish typed events for UI/save/gameplay consumers. */
export class RewardSystem {
    constructor(data) { this.data = data; this.listeners = new Set(); }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    grant(rewardId, { inventory, progression } = {}) {
        const reward = this.data.rewards.get(rewardId);
        if (!reward) throw new RangeError(`Unknown reward: ${rewardId}`);
        const events = [];
        const items = reward.items ?? [];
        const quantities = new Map();
        for (const entry of items) quantities.set(entry.itemId, (quantities.get(entry.itemId) ?? 0) + (entry.quantity ?? 1));
        for (const [itemId, quantity] of quantities) {
            const item = this.data.getItem(itemId);
            if (!item || !inventory?.canAddItem(item, quantity)) throw new Error(`Cannot grant ${itemId}: missing inventory item or capacity`);
        }
        if (reward.experience && progression) for (const level of progression.grantExperience(reward.experience)) events.push({ type: "level-up", level });
        if (reward.gold && inventory) inventory.gold += reward.gold;
        for (const item of items) {
            inventory.addItem(this.data.getItem(item.itemId), item.quantity ?? 1);
            events.push({ type: "item-reward", itemId: item.itemId, quantity: item.quantity ?? 1 });
        }
        events.push({ type: "reward-granted", rewardId });
        for (const event of events) for (const listener of this.listeners) listener(event);
        return events;
    }
}

/** Definition-driven shop operations with atomic inventory/currency checks. */
export class Shop {
    constructor(data, shopId) {
        this.data = data;
        this.definition = data.shops.get(shopId);
        if (!this.definition) throw new RangeError(`Unknown shop: ${shopId}`);
    }
    buy(inventory, itemId, quantity = 1) {
        const offer = this.definition.items?.find(entry => entry.itemId === itemId);
        const item = this.data.getItem(itemId);
        if (!offer || !item) return false;
        const cost = (offer.price ?? item.value ?? 0) * quantity;
        if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(cost) || cost < 0 || inventory.gold < cost || !inventory.canAddItem(item, quantity)) return false;
        if (!inventory.addItem(item, quantity)) return false;
        inventory.gold -= cost;
        return true;
    }
}

/** Stateful quest records with data-driven objectives and serializable state. */
export class QuestLog {
    constructor(data) { this.data = data; this.states = new Map(); this.listeners = new Set(); }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    start(questId) {
        if (!this.data.quests.has(questId) || this.states.has(questId)) return false;
        this.states.set(questId, { status: "active", progress: {} });
        this.#emit({ type: "quest-started", questId });
        return true;
    }
    advance(questId, objectiveId, amount = 1) {
        const state = this.states.get(questId), quest = this.data.quests.get(questId);
        const objective = quest?.objectives?.find(entry => entry.id === objectiveId);
        if (!state || state.status !== "active" || !objective || !Number.isFinite(amount) || amount <= 0) return false;
        state.progress[objectiveId] = Math.min(objective.required ?? 1, (state.progress[objectiveId] ?? 0) + amount);
        if (quest.objectives.every(entry => (state.progress[entry.id] ?? 0) >= (entry.required ?? 1))) state.status = "complete";
        this.#emit({ type: state.status === "complete" ? "quest-completed" : "quest-progress", questId, objectiveId, progress: state.progress[objectiveId] });
        return true;
    }
    #emit(event) { for (const listener of this.listeners) listener(event); }
    toJSON() { return Object.fromEntries([...this.states].map(([id, state]) => [id, { status: state.status, progress: { ...state.progress } }])); }
    loadJSON(states) {
        for (const [id, state] of Object.entries(states)) {
            if (!this.data.quests.has(id) || !["active", "complete"].includes(state.status) || !state.progress || typeof state.progress !== "object") throw new TypeError(`Invalid quest state: ${id}`);
        }
        this.states = new Map(Object.entries(states).map(([id, state]) => [id, { status: state.status, progress: { ...state.progress } }]));
    }
}
