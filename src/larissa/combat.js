import { Component } from "../components/component.js";

const finiteNonNegative = (value, name) => {
    if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a finite non-negative number`);
};

const deepFreeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        for (const child of Object.values(value)) deepFreeze(child);
        Object.freeze(value);
    }
    return value;
};

/** Immutable, validated attack data shared by melee, projectile, and area attacks. */
export class AttackDefinition {
    constructor(config = {}) {
        if (!config || typeof config !== "object" || Array.isArray(config)) throw new TypeError("AttackDefinition requires an object");
        if (typeof config.name !== "string" || !config.name.trim()) throw new TypeError("Attack name must be a non-empty string");
        const requestedMode = config.mode ?? "melee";
        if (!["melee", "ranged", "projectile", "area"].includes(requestedMode)) throw new TypeError("Attack mode must be melee, ranged, projectile, or area");
        const mode = requestedMode === "ranged" ? "projectile" : requestedMode;
        const timings = {
            startup: config.startup ?? 0,
            active: config.active ?? 0.1,
            recovery: config.recovery ?? 0,
            cooldown: config.cooldown ?? 0
        };
        for (const [name, value] of Object.entries(timings)) finiteNonNegative(value, `Attack ${name}`);
        if (timings.active <= 0) throw new TypeError("Attack active duration must be greater than zero");
        const range = config.range ?? 32;
        const damage = config.damage ?? 1;
        finiteNonNegative(range, "Attack range");
        finiteNonNegative(damage, "Attack damage");
        if (range <= 0) throw new TypeError("Attack range must be greater than zero");
        const targeting = config.targeting ?? "hostile";
        if (!["hostile", "friendly", "any"].includes(targeting)) throw new TypeError("Attack targeting must be hostile, friendly, or any");
        const hitbox = config.hitbox ?? {};
        const shape = { width: hitbox.width ?? range, height: hitbox.height ?? range, offsetX: hitbox.offsetX ?? 0, offsetY: hitbox.offsetY ?? 0 };
        if (![shape.width, shape.height, shape.offsetX, shape.offsetY].every(Number.isFinite) || shape.width <= 0 || shape.height <= 0) {
            throw new TypeError("Attack hitbox dimensions must be positive finite numbers and offsets must be finite");
        }
        const knockback = config.knockback ?? { x: 0, y: 0 };
        if (!knockback || !Number.isFinite(knockback.x) || !Number.isFinite(knockback.y)) throw new TypeError("Attack knockback requires finite x and y values");
        const projectileSpeed = config.projectileSpeed ?? 0;
        finiteNonNegative(projectileSpeed, "Projectile speed");
        if (mode === "projectile" && projectileSpeed <= 0) throw new TypeError("Projectile attacks require a positive projectileSpeed");
        const statusEffect = config.statusEffect ?? null;
        if (statusEffect !== null && (!statusEffect || typeof statusEffect.name !== "string" || !statusEffect.name || !Number.isFinite(statusEffect.duration) || statusEffect.duration <= 0)) {
            throw new TypeError("Attack statusEffect requires a name and positive finite duration");
        }
        const damageType = config.damageType ?? "physical";
        if (typeof damageType !== "string" || !damageType) throw new TypeError("Attack damageType must be a non-empty string");
        const piercing = config.piercing ?? false;
        if (typeof piercing !== "boolean") throw new TypeError("Attack piercing must be a boolean");
        Object.assign(this, { name: config.name, mode, ...timings, range, damage, targeting, hitbox: shape,
            knockback: { x: knockback.x, y: knockback.y }, projectileSpeed, piercing,
            statusEffect: statusEffect ? structuredClone(statusEffect) : null, damageType, staggerDuration: config.staggerDuration ?? 0 });
        finiteNonNegative(this.staggerDuration, "Attack staggerDuration");
        Object.freeze(this.hitbox);
        Object.freeze(this.knockback);
        if (this.statusEffect) deepFreeze(this.statusEffect);
        Object.freeze(this);
    }
}

/** Combat health, resistance, invulnerability, stagger, and timed status effects. */
export class Combatant extends Component {
    constructor(config = {}) {
        super();
        if (!config || typeof config !== "object" || Array.isArray(config)) throw new TypeError("Combatant requires an object");
        this.id = config.id ?? `combatant-${Combatant._nextId++}`;
        if (typeof this.id !== "string" || !this.id) throw new TypeError("Combatant id must be a non-empty string");
        this.faction = config.faction ?? "neutral";
        if (typeof this.faction !== "string" || !this.faction) throw new TypeError("Combatant faction must be a non-empty string");
        this.maxHealth = config.maxHealth ?? 100;
        if (!Number.isFinite(this.maxHealth) || this.maxHealth <= 0) throw new TypeError("maxHealth must be a positive finite number");
        this.health = config.health ?? this.maxHealth;
        if (!Number.isFinite(this.health) || this.health < 0 || this.health > this.maxHealth) throw new TypeError("health must be a finite value between zero and maxHealth");
        this.position = { x: config.x ?? 0, y: config.y ?? 0 };
        if (!Number.isFinite(this.position.x) || !Number.isFinite(this.position.y)) throw new TypeError("Combatant position must be finite");
        this.hurtbox = { width: config.hurtbox?.width ?? 16, height: config.hurtbox?.height ?? 16 };
        if (![this.hurtbox.width, this.hurtbox.height].every(Number.isFinite) || this.hurtbox.width <= 0 || this.hurtbox.height <= 0) throw new TypeError("Hurtbox dimensions must be positive finite numbers");
        const resistances = config.resistances ?? {};
        if (!resistances || typeof resistances !== "object" || Array.isArray(resistances)) throw new TypeError("resistances must be an object");
        this.resistances = { ...resistances };
        for (const [type, resistance] of Object.entries(this.resistances)) {
            if (typeof type !== "string" || !Number.isFinite(resistance) || resistance < 0 || resistance > 1) throw new TypeError("Resistances must be finite fractions from zero to one");
        }
        this.invulnerabilityDuration = config.invulnerabilityDuration ?? 0.5;
        finiteNonNegative(this.invulnerabilityDuration, "invulnerabilityDuration");
        this.invulnerableRemaining = 0;
        this.staggerRemaining = 0;
        this.effects = [];
        this.body = config.body ?? null;
        this.cooldowns = new Map();
        this.onDeath = null;
        this._deathNotified = !this.isAlive;
    }

    static _nextId = 1;

    get isAlive() { return this.health > 0; }
    get isStaggered() { return this.staggerRemaining > 0; }

    canTarget(targeting, other) {
        if (!(other instanceof Combatant) || other === this || !other.isAlive) return false;
        return targeting === "any" || (targeting === "hostile" ? other.faction !== this.faction : other.faction === this.faction);
    }

    getModifiedStat(stat, baseValue = 1) {
        if (typeof stat !== "string" || !stat || !Number.isFinite(baseValue)) throw new TypeError("getModifiedStat requires a stat name and finite base value");
        return this.effects.reduce((value, effect) => Object.hasOwn(effect.modifiers, stat) ? value * effect.modifiers[stat] : value, baseValue);
    }

    receiveDamage({ amount, type = "physical", stagger = 0, knockback = null } = {}) {
        finiteNonNegative(amount, "Damage amount");
        finiteNonNegative(stagger, "Stagger duration");
        if (typeof type !== "string" || !type) throw new TypeError("Damage type must be a non-empty string");
        if (!this.isAlive || this.invulnerableRemaining > 0) return { applied: false, damage: 0, killed: false };
        const resistance = this.resistances[type] ?? 0;
        const damage = Math.max(0, amount * (1 - resistance));
        const before = this.health;
        this.health = Math.max(0, this.health - damage);
        const actual = before - this.health;
        this.invulnerableRemaining = this.invulnerabilityDuration;
        this.staggerRemaining = Math.max(this.staggerRemaining, stagger);
        if (knockback && typeof knockback.applyKnockback === "function") knockback.applyKnockback(knockback.x, knockback.y);
        const killed = this.health === 0;
        if (killed && !this._deathNotified) {
            this._deathNotified = true;
            if (this.onDeath) this.onDeath(this);
        }
        return { applied: true, damage: actual, killed };
    }

    applyEffect(effect) {
        if (!effect || typeof effect.name !== "string" || !effect.name || !Number.isFinite(effect.duration) || effect.duration <= 0) {
            throw new TypeError("Status effect requires a name and positive finite duration");
        }
        const modifiers = effect.modifiers ?? {};
        if (!modifiers || typeof modifiers !== "object" || Array.isArray(modifiers)) throw new TypeError("Status effect modifiers must be an object");
        for (const [stat, multiplier] of Object.entries(modifiers)) {
            if (!stat || !Number.isFinite(multiplier) || multiplier < 0) throw new TypeError("Status effect modifiers must have named stats and finite non-negative multipliers");
        }
        const entry = { name: effect.name, duration: effect.duration, modifiers: structuredClone(modifiers) };
        const existing = this.effects.find(item => item.name === entry.name);
        if (existing) {
            existing.duration = Math.max(existing.duration, entry.duration);
            existing.modifiers = entry.modifiers;
        } else this.effects.push(entry);
        return entry;
    }

    update(deltaTime) {
        finiteNonNegative(deltaTime, "Combatant deltaTime");
        this.invulnerableRemaining = Math.max(0, this.invulnerableRemaining - deltaTime);
        this.staggerRemaining = Math.max(0, this.staggerRemaining - deltaTime);
        for (const effect of this.effects) effect.duration -= deltaTime;
        this.effects = this.effects.filter(effect => effect.duration > 0);
        for (const [name, remaining] of this.cooldowns) {
            const next = Math.max(0, remaining - deltaTime);
            if (next === 0) this.cooldowns.delete(name);
            else this.cooldowns.set(name, next);
        }
    }
}

/** A data-driven attack runner. Call startAttack, then update with deterministic world positions. */
export class CombatSystem {
    constructor() {
        this._attacks = new Map();
        this._projectiles = [];
        this._listeners = new Map();
        this._serial = 1;
        this._step = 0;
    }

    on(event, listener) {
        if (typeof event !== "string" || !event || typeof listener !== "function") throw new TypeError("CombatSystem.on requires an event and listener");
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event).add(listener);
        return () => this._listeners.get(event)?.delete(listener);
    }

    _emit(event, payload) {
        for (const listener of [...(this._listeners.get(event) ?? [])]) listener({ event, ...payload });
    }

    /** Publish an environment interaction (hazard, landing, trigger, etc.) for feedback consumers. */
    reportEnvironmentContact(combatant, contact) {
        if (!(combatant instanceof Combatant)) throw new TypeError("reportEnvironmentContact requires a Combatant");
        if (!contact || typeof contact !== "object" || Array.isArray(contact) || typeof contact.type !== "string" || !contact.type) {
            throw new TypeError("Environment contact requires an object with a non-empty type");
        }
        this._emit("environment", { combatant, contact: { ...contact } });
        return true;
    }

    startAttack(attacker, definition, aim = { x: 1, y: 0 }) {
        if (!(attacker instanceof Combatant) || !(definition instanceof AttackDefinition)) throw new TypeError("startAttack requires a Combatant and AttackDefinition");
        if (!attacker.isAlive) return false;
        if (attacker.isStaggered || attacker.cooldowns.has(definition.name) || this._attacks.has(attacker)) return false;
        if (!aim || !Number.isFinite(aim.x) || !Number.isFinite(aim.y) || Math.hypot(aim.x, aim.y) === 0) throw new TypeError("Attack aim must be a non-zero finite vector");
        const length = Math.hypot(aim.x, aim.y);
        const state = { id: this._serial++, attacker, definition, phase: "startup", elapsed: 0, targetsHit: new Set(), aim: { x: aim.x / length, y: aim.y / length }, spawned: false };
        this._attacks.set(attacker, state);
        this._emit("attackStart", { attacker, definition, attackId: state.id });
        return true;
    }

    _hitTargets(state, targets) {
        const { attacker, definition } = state;
        const centerX = attacker.position.x + definition.hitbox.offsetX + state.aim.x * (definition.mode === "melee" ? definition.range / 2 : 0);
        const centerY = attacker.position.y + definition.hitbox.offsetY + state.aim.y * (definition.mode === "melee" ? definition.range / 2 : 0);
        const attackBounds = { left: centerX - definition.hitbox.width / 2, right: centerX + definition.hitbox.width / 2,
            top: centerY - definition.hitbox.height / 2, bottom: centerY + definition.hitbox.height / 2 };
        for (const target of targets) {
            if (!attacker.canTarget(definition.targeting, target) || state.targetsHit.has(target)) continue;
            if (Math.hypot(target.position.x - attacker.position.x, target.position.y - attacker.position.y) > definition.range) continue;
            if (target !== attacker && this._overlap(attackBounds, target.position, target.hurtbox)) this._applyHit(state, target);
        }
    }

    _overlap(bounds, position, box) {
        const other = { left: position.x - box.width / 2, right: position.x + box.width / 2,
            top: position.y - box.height / 2, bottom: position.y + box.height / 2 };
        return bounds.left < other.right && bounds.right > other.left && bounds.top < other.bottom && bounds.bottom > other.top;
    }

    _applyHit(state, target) {
        state.targetsHit.add(target);
        const { attacker, definition } = state;
        const result = target.receiveDamage({ amount: definition.damage * attacker.getModifiedStat("attack", 1), type: definition.damageType, stagger: definition.staggerDuration });
        if (result.applied && definition.statusEffect) {
            target.applyEffect(definition.statusEffect);
            this._emit("status", { attacker, target, definition, effect: definition.statusEffect });
        }
        if (result.applied && definition.staggerDuration > 0) this._emit("stagger", { attacker, target, definition, duration: definition.staggerDuration });
        if (result.applied && target.body && typeof target.body.applyKnockback === "function") {
            target.body.applyKnockback(definition.knockback.x, definition.knockback.y);
            this._emit("knockback", { attacker, target, definition, velocity: { ...definition.knockback } });
        }
        this._emit("hit", { attacker, target, definition, result });
        if (result.applied) {
            this._emit("damage", { attacker, target, definition, result });
            this._emit("hurt", { attacker, target, definition, result });
        }
        if (result.killed) this._emit("death", { attacker, target, definition });
    }

    _segmentOverlap(startX, startY, endX, endY, target, width, height) {
        const left = target.position.x - target.hurtbox.width / 2 - width / 2;
        const right = target.position.x + target.hurtbox.width / 2 + width / 2;
        const top = target.position.y - target.hurtbox.height / 2 - height / 2;
        const bottom = target.position.y + target.hurtbox.height / 2 + height / 2;
        let minimum = 0, maximum = 1;
        for (const [origin, delta, low, high] of [[startX, endX - startX, left, right], [startY, endY - startY, top, bottom]]) {
            if (delta === 0) {
                if (origin <= low || origin >= high) return false;
                continue;
            }
            let near = (low - origin) / delta;
            let far = (high - origin) / delta;
            if (near > far) [near, far] = [far, near];
            minimum = Math.max(minimum, near);
            maximum = Math.min(maximum, far);
            if (minimum > maximum) return false;
        }
        return true;
    }

    _spawnProjectile(state) {
        if (state.spawned) return;
        state.spawned = true;
        const d = state.definition;
        this._projectiles.push({ attacker: state.attacker, definition: d, x: state.attacker.position.x, y: state.attacker.position.y,
            vx: state.aim.x * d.projectileSpeed, vy: state.aim.y * d.projectileSpeed, travelled: 0, targetsHit: new Set(), id: state.id, bornStep: this._step });
        this._emit("projectile", { attacker: state.attacker, definition: d, attackId: state.id });
    }

    update(deltaTime, combatants = []) {
        finiteNonNegative(deltaTime, "CombatSystem deltaTime");
        if (!Array.isArray(combatants) || combatants.some(item => !(item instanceof Combatant))) throw new TypeError("CombatSystem.update expects an array of Combatants");
        const ids = new Set();
        for (const combatant of combatants) {
            if (ids.has(combatant.id)) throw new TypeError(`Duplicate combatant id: ${combatant.id}`);
            ids.add(combatant.id);
        }
        const world = [...combatants].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        this._step++;
        for (const combatant of world) combatant.update(deltaTime);
        for (const state of [...this._attacks.values()]) {
            let remaining = deltaTime;
            while (this._attacks.has(state.attacker)) {
                const duration = state.definition[state.phase];
                if (duration === 0) {
                    if (state.phase === "startup") { state.phase = "active"; this._emit("attackActive", { attacker: state.attacker, definition: state.definition }); }
                    else if (state.phase === "active") { state.phase = "recovery"; this._emit("attackRecovery", { attacker: state.attacker, definition: state.definition }); }
                    else { state.attacker.cooldowns.set(state.definition.name, state.definition.cooldown); this._attacks.delete(state.attacker); this._emit("attackComplete", { attacker: state.attacker, definition: state.definition }); }
                    if (state.phase === "active" && state.definition.mode === "projectile") this._spawnProjectile(state);
                    continue;
                }
                const slice = Math.min(remaining, Math.max(0, duration - state.elapsed));
                state.elapsed += slice;
                remaining -= slice;
                if (state.phase === "active") {
                    if (state.definition.mode === "projectile") this._spawnProjectile(state);
                    else this._hitTargets(state, world);
                }
                if (state.elapsed >= duration) {
                    state.elapsed = 0;
                    if (state.phase === "startup") { state.phase = "active"; this._emit("attackActive", { attacker: state.attacker, definition: state.definition }); }
                    else if (state.phase === "active") { state.phase = "recovery"; this._emit("attackRecovery", { attacker: state.attacker, definition: state.definition }); }
                    else { state.attacker.cooldowns.set(state.definition.name, state.definition.cooldown); this._attacks.delete(state.attacker); this._emit("attackComplete", { attacker: state.attacker, definition: state.definition }); }
                    if (state.phase === "active" && state.definition.mode === "projectile") this._spawnProjectile(state);
                }
                if (remaining <= 0 && this._attacks.has(state.attacker)) break;
            }
        }
        const nextProjectiles = [];
        for (const projectile of this._projectiles) {
            if (projectile.bornStep === this._step) { nextProjectiles.push(projectile); continue; }
            const step = Math.min(deltaTime, (projectile.definition.range - projectile.travelled) / projectile.definition.projectileSpeed);
            const startX = projectile.x, startY = projectile.y;
            projectile.x += projectile.vx * step;
            projectile.y += projectile.vy * step;
            projectile.travelled += projectile.definition.projectileSpeed * step;
            let consumed = false;
            for (const target of world) {
                if (projectile.attacker.canTarget(projectile.definition.targeting, target) && !projectile.targetsHit.has(target) &&
                    this._segmentOverlap(startX, startY, projectile.x, projectile.y, target, projectile.definition.hitbox.width, projectile.definition.hitbox.height)) {
                    projectile.targetsHit.add(target);
                    this._applyHit(projectile, target);
                    if (!projectile.definition.piercing) { consumed = true; break; }
                }
            }
            if (!consumed && projectile.travelled < projectile.definition.range) nextProjectiles.push(projectile);
        }
        this._projectiles = nextProjectiles;
    }
}
