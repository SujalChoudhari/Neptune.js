/**
 * Larissa RPG System - Ability Graph Executor
 * ABILITY-02: Budgeted execution, cancellation, targeting, timing,
 * and presentation dispatch for validated ability definition graphs.
 */

import { AbilityValidator } from "./abilityValidator.js";

/**
 * Error thrown when an ability execution exceeds its per-tick operation budget.
 */
export class AbilityBudgetExceededError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message = "Execution operation budget exceeded") {
    super(message);
    this.name = "AbilityBudgetExceededError";
  }
}

/**
 * General error thrown during ability execution failures.
 */
export class AbilityExecutionError extends Error {
  /**
   * @param {string} [message]
   * @param {Object} [context]
   */
  constructor(message = "Ability execution failed", context = {}) {
    super(message);
    this.name = "AbilityExecutionError";
    this.context = context;
  }
}

/**
 * Helper to check whether an actor is alive.
 * @param {Object} actor
 * @returns {boolean}
 */
function isActorAlive(actor) {
  if (!actor) return false;
  if (typeof actor.isAlive === "boolean") return actor.isAlive;
  if (typeof actor.isAlive === "function") return actor.isAlive();
  if (actor.isDestroyed) return false;
  if (typeof actor.health === "number") return actor.health > 0;
  if (typeof actor._health === "number") return actor._health > 0;
  return true;
}

/**
 * Helper to get 2D position from an actor or position object.
 * @param {Object} actor
 * @returns {{ x: number, y: number }}
 */
function getActorPosition(actor) {
  if (!actor) return { x: 0, y: 0 };
  if (actor.position && Number.isFinite(actor.position.x) && Number.isFinite(actor.position.y)) {
    return { x: actor.position.x, y: actor.position.y };
  }
  if (Number.isFinite(actor.x) && Number.isFinite(actor.y)) {
    return { x: actor.x, y: actor.y };
  }
  return { x: 0, y: 0 };
}

/**
 * Helper to normalize an angle between -PI and PI.
 * @param {number} angle
 * @returns {number}
 */
function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Lookup a node in ability definition nodes by id.
 * Supports both Map/Object map and Array schemas.
 * @param {Object} abilityDef
 * @param {string} nodeId
 * @returns {Object|null}
 */
function getNode(abilityDef, nodeId) {
  if (!abilityDef || !abilityDef.nodes || !nodeId) return null;
  if (Array.isArray(abilityDef.nodes)) {
    return abilityDef.nodes.find(function (item) {
      return item && item.id === nodeId;
    }) || null;
  }
  if (typeof abilityDef.nodes === "object") {
    return abilityDef.nodes[nodeId] || null;
  }
  return null;
}

/**
 * AbilityExecutor runs validated ability graphs against Combatant / Stats instances.
 */
export class AbilityExecutor {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxOperationsPerTick=1000] - Operation budget per tick to prevent infinite processing
   * @param {Object} [options.eventBus=null] - Optional event bus for emitting presentation and lifecycle cues
   * @param {Array} [options.actors=[]] - Default actor collection for target resolution
   */
  constructor(options = {}) {
    this.maxOperationsPerTick = Number.isFinite(options.maxOperationsPerTick) && options.maxOperationsPerTick > 0
      ? options.maxOperationsPerTick
      : 1000;
    this.eventBus = options.eventBus || null;
    this.actors = Array.isArray(options.actors) ? options.actors : [];

    /** Active execution instances: Map<number, Object> */
    this._instances = new Map();

    /** Cooldowns map: Map<string, Map<string, number>> (casterId -> abilityId -> remainingSeconds) */
    this._cooldowns = new Map();

    /** Event listeners: Map<string, Set<Function>> */
    this._listeners = new Map();

    this._serial = 1;
    this._operationsInCurrentTick = 0;
  }

  /**
   * Subscribe to executor events.
   * @param {string} event
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  on(event, listener) {
    if (typeof event !== "string" || !event || typeof listener !== "function") {
      throw new TypeError("AbilityExecutor.on requires an event string and a listener function");
    }
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(listener);
    const self = this;
    return function () {
      const set = self._listeners.get(event);
      if (set) set.delete(listener);
    };
  }

  /**
   * Remove an event listener.
   * @param {string} event
   * @param {Function} listener
   * @returns {boolean}
   */
  off(event, listener) {
    const set = this._listeners.get(event);
    if (!set) return false;
    return set.delete(listener);
  }

  /**
   * Emit an event to local listeners and optional external event bus.
   * @param {string} event
   * @param {Object} payload
   */
  _emit(event, payload = {}) {
    const listeners = this._listeners.get(event);
    if (listeners && listeners.size > 0) {
      for (const listener of Array.from(listeners)) {
        try {
          listener(payload);
        } catch (err) {
          console.error(`Error in AbilityExecutor listener for '${event}':`, err);
        }
      }
    }
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      try {
        this.eventBus.emit(event, payload);
      } catch (err) {
        console.error(`Error emitting to eventBus for '${event}':`, err);
      }
    }
  }

  /**
   * Consume an operation from the execution budget.
   * @param {Object} instance
   */
  _consumeOperation(instance) {
    this._operationsInCurrentTick++;
    if (this._operationsInCurrentTick > this.maxOperationsPerTick) {
      if (instance) {
        instance.status = "failed";
        instance.cancelReason = "budget_exceeded";
        this._instances.delete(instance.id);
      }
      throw new AbilityBudgetExceededError(
        `Execution operation budget of ${this.maxOperationsPerTick} exceeded in tick`
      );
    }
  }

  /**
   * Check if an ability is currently on cooldown for a given caster.
   * @param {string} casterId
   * @param {string} abilityId
   * @returns {boolean}
   */
  isOnCooldown(casterId, abilityId) {
    return this.getCooldown(casterId, abilityId) > 0;
  }

  /**
   * Get the remaining cooldown time for an ability and caster in seconds.
   * @param {string} casterId
   * @param {string} abilityId
   * @returns {number} Remaining cooldown in seconds, or 0
   */
  getCooldown(casterId, abilityId) {
    if (!casterId || !abilityId) return 0;
    const casterMap = this._cooldowns.get(casterId);
    if (!casterMap) return 0;
    return casterMap.get(abilityId) || 0;
  }

  /**
   * Set a cooldown duration for a caster and ability.
   * @param {string} casterId
   * @param {string} abilityId
   * @param {number} duration - Cooldown in seconds
   */
  setCooldown(casterId, abilityId, duration) {
    if (!casterId || !abilityId) return;
    if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
      this.resetCooldown(casterId, abilityId);
      return;
    }
    if (!this._cooldowns.has(casterId)) {
      this._cooldowns.set(casterId, new Map());
    }
    this._cooldowns.get(casterId).set(abilityId, duration);
  }

  /**
   * Reset cooldown for a specific caster and ability.
   * @param {string} casterId
   * @param {string} abilityId
   */
  resetCooldown(casterId, abilityId) {
    const casterMap = this._cooldowns.get(casterId);
    if (casterMap) {
      casterMap.delete(abilityId);
      if (casterMap.size === 0) {
        this._cooldowns.delete(casterId);
      }
    }
  }

  /**
   * Reset all tracked cooldowns across all casters.
   */
  resetAllCooldowns() {
    this._cooldowns.clear();
  }

  /**
   * Get all active execution instances, optionally filtered by caster ID.
   * @param {string} [casterId]
   * @returns {Array}
   */
  getActiveInstances(casterId) {
    const list = Array.from(this._instances.values());
    if (casterId) {
      return list.filter(function (inst) {
        return inst.casterId === casterId;
      });
    }
    return list;
  }

  /**
   * Cancel all running executions across all casters.
   * @param {string} [reason="cancelled"]
   * @returns {number} Number of instances cancelled
   */
  cancelAll(reason = "cancelled") {
    let count = 0;
    for (const instance of Array.from(this._instances.values())) {
      this._cancelInstance(instance, reason);
      count++;
    }
    return count;
  }

  /**
   * Cancel all running executions for a specific caster.
   * @param {string} casterId
   * @param {string} [reason="cancelled"]
   * @returns {number} Number of instances cancelled
   */
  cancelByCaster(casterId, reason = "cancelled") {
    if (!casterId) return 0;
    let count = 0;
    for (const instance of Array.from(this._instances.values())) {
      if (instance.casterId === casterId) {
        this._cancelInstance(instance, reason);
        count++;
      }
    }
    return count;
  }

  /**
   * Internal helper to cancel an instance cleanly.
   * @param {Object} instance
   * @param {string} reason
   */
  _cancelInstance(instance, reason) {
    instance.status = "cancelled";
    instance.cancelReason = reason;
    instance.activeTimedActions = [];
    instance.activeProjectiles = [];
    instance.pendingSequences = [];
    this._instances.delete(instance.id);
    this._emit("ability:cancelled", { instance, reason, casterId: instance.casterId, abilityId: instance.abilityDef.id });
  }

  /**
   * Execute an ability graph definition against an execution context.
   * Validates the graph, enforces cooldowns and caster survival, and steps execution.
   * @param {Object} abilityDef - Validated or validatable ability definition graph
   * @param {Object} [context={}] - Execution context (caster, target, targets, cursor, world, actors)
   * @returns {Object} Execution result { success, instance, status, reason }
   */
  execute(abilityDef, context = {}) {
    // 1. Validate ability definition graph
    AbilityValidator.assertValid(abilityDef);

    const caster = context.caster || null;
    const casterId = caster && caster.id
      ? caster.id
      : (typeof caster === "string" ? caster : (context.casterId || "caster"));

    // 2. Caster death check
    if (caster && !isActorAlive(caster)) {
      return {
        success: false,
        reason: "caster_dead",
        status: "failed",
        instance: null
      };
    }

    // 3. Cooldown check
    const cooldownDuration = Number.isFinite(abilityDef.cooldown) && abilityDef.cooldown > 0
      ? abilityDef.cooldown
      : (Number.isFinite(context.cooldown) && context.cooldown > 0 ? context.cooldown : 0);

    if (cooldownDuration > 0 && this.isOnCooldown(casterId, abilityDef.id)) {
      return {
        success: false,
        reason: "cooldown",
        status: "blocked",
        remainingCooldown: this.getCooldown(casterId, abilityDef.id),
        instance: null
      };
    }

    // Apply cooldown
    if (cooldownDuration > 0) {
      this.setCooldown(casterId, abilityDef.id, cooldownDuration);
      if (caster && caster.cooldowns instanceof Map) {
        caster.cooldowns.set(abilityDef.id, cooldownDuration);
      }
    }

    // Reset operation budget counter for this tick
    this._operationsInCurrentTick = 0;

    // 4. Create execution instance
    const initialTargets = context.targets
      ? context.targets.filter(Boolean)
      : (context.target ? [context.target] : []);

    const instance = {
      id: this._serial++,
      abilityDef,
      caster,
      casterId,
      context: { ...context },
      status: "running",
      cancelReason: null,
      currentTargets: initialTargets,
      cursor: context.cursor ? { x: context.cursor.x, y: context.cursor.y } : null,
      impactPoint: null,
      targetPoint: null,
      activeTimedActions: [],
      activeProjectiles: [],
      pendingSequences: []
    };

    this._instances.set(instance.id, instance);
    this._emit("ability:start", { instance, caster, abilityId: abilityDef.id });

    // 5. Begin graph execution at entry node
    this._executeNode(instance, abilityDef.entryNodeId);

    // Check completion status
    if (this._isInstanceFinished(instance)) {
      instance.status = "completed";
      this._instances.delete(instance.id);
      this._emit("ability:completed", { instance, caster, abilityId: abilityDef.id });
    }

    return {
      success: true,
      instance,
      status: instance.status
    };
  }

  /**
   * Alias for execute().
   * @param {Object} abilityDef
   * @param {Object} [context]
   * @returns {Object}
   */
  cast(abilityDef, context) {
    return this.execute(abilityDef, context);
  }

  /**
   * Helper to determine whether an execution instance has completed all active work.
   * @param {Object} instance
   * @returns {boolean}
   */
  _isInstanceFinished(instance) {
    if (instance.status !== "running") return true;
    return instance.activeTimedActions.length === 0 &&
      instance.activeProjectiles.length === 0 &&
      instance.pendingSequences.length === 0;
  }

  /**
   * Execute a single node in the ability graph.
   * @param {Object} instance
   * @param {string} nodeId
   */
  _executeNode(instance, nodeId) {
    if (!nodeId || instance.status !== "running") return;

    // Verify caster is still alive before executing next node
    if (instance.caster && !isActorAlive(instance.caster)) {
      this._cancelInstance(instance, "caster_death");
      return;
    }

    this._consumeOperation(instance);

    const node = getNode(instance.abilityDef, nodeId);
    if (!node) {
      // Missing node reference handled safely
      return;
    }

    switch (node.type) {
      case "target":
        this._executeTargetNode(instance, node, nodeId);
        break;
      case "filter":
        this._executeFilterNode(instance, node, nodeId);
        break;
      case "sequence":
        this._executeSequenceNode(instance, node, nodeId);
        break;
      case "condition":
        this._executeConditionNode(instance, node, nodeId);
        break;
      case "projectile":
        this._executeProjectileNode(instance, node, nodeId);
        break;
      case "area_effect":
        this._executeAreaEffectNode(instance, node, nodeId);
        break;
      case "damage":
        this._executeDamageNode(instance, node, nodeId);
        break;
      case "heal":
        this._executeHealNode(instance, node, nodeId);
        break;
      case "status":
        this._executeStatusNode(instance, node, nodeId);
        break;
      case "knockback":
        this._executeKnockbackNode(instance, node, nodeId);
        break;
      case "timed_action":
        this._executeTimedActionNode(instance, node, nodeId);
        break;
      case "presentation":
        this._executePresentationNode(instance, node, nodeId);
        break;
      default:
        // Unknown node type - continue to next if available
        if (node.next) this._executeNode(instance, node.next);
        break;
    }
  }

  /**
   * Collect candidate actors for targeting from context and executor defaults.
   * @param {Object} instance
   * @returns {Array}
   */
  _getCandidateActors(instance) {
    const set = new Set();
    const ctx = instance.context;

    if (Array.isArray(ctx.actors)) {
      for (const a of ctx.actors) if (a) set.add(a);
    }
    if (ctx.world) {
      if (typeof ctx.world.getActors === "function") {
        const actors = ctx.world.getActors();
        if (Array.isArray(actors)) for (const a of actors) if (a) set.add(a);
      } else if (Array.isArray(ctx.world.actors)) {
        for (const a of ctx.world.actors) if (a) set.add(a);
      }
    }
    if (Array.isArray(ctx.targets)) {
      for (const t of ctx.targets) if (t) set.add(t);
    }
    if (ctx.target) set.add(ctx.target);
    if (Array.isArray(this.actors)) {
      for (const a of this.actors) if (a) set.add(a);
    }
    return Array.from(set);
  }

  /**
   * Execute 'target' node: resolves target actors (caster, enemies, allies, cursor, cone, radius).
   */
  _executeTargetNode(instance, node, nodeId) {
    const mode = (node.mode || node.targetType || "cursor").toLowerCase();
    const caster = instance.caster;
    const casterPos = getActorPosition(caster);
    const candidateActors = this._getCandidateActors(instance);

    let resolvedTargets = [];

    switch (mode) {
      case "self":
      case "caster": {
        if (caster) resolvedTargets = [caster];
        break;
      }

      case "cursor":
      case "point": {
        const cursor = instance.context.cursor || instance.cursor || instance.context.targetPosition || { x: 0, y: 0 };
        let targetX = cursor.x;
        let targetY = cursor.y;
        if (Number.isFinite(node.range) && node.range > 0) {
          const dx = targetX - casterPos.x;
          const dy = targetY - casterPos.y;
          const dist = Math.hypot(dx, dy);
          if (dist > node.range && dist > 0) {
            targetX = casterPos.x + (dx / dist) * node.range;
            targetY = casterPos.y + (dy / dist) * node.range;
          }
        }
        instance.cursor = { x: targetX, y: targetY };
        instance.targetPoint = { x: targetX, y: targetY };
        resolvedTargets = [];
        break;
      }

      case "cone": {
        const range = Number.isFinite(node.range) ? node.range : 64;
        const angleDeg = Number.isFinite(node.angle) ? node.angle : 90;
        const halfAngleRad = (angleDeg * Math.PI) / 360; // (deg / 2) * (PI / 180)

        // Aim direction
        let aimDirX = 1;
        let aimDirY = 0;
        if (instance.context.aim && Number.isFinite(instance.context.aim.x) && Number.isFinite(instance.context.aim.y)) {
          aimDirX = instance.context.aim.x;
          aimDirY = instance.context.aim.y;
        } else if (instance.context.cursor || instance.cursor) {
          const c = instance.context.cursor || instance.cursor;
          const dx = c.x - casterPos.x;
          const dy = c.y - casterPos.y;
          const len = Math.hypot(dx, dy);
          if (len > 0) {
            aimDirX = dx / len;
            aimDirY = dy / len;
          }
        }
        const aimAngle = Math.atan2(aimDirY, aimDirX);

        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const pos = getActorPosition(actor);
          const dx = pos.x - casterPos.x;
          const dy = pos.y - casterPos.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= range) {
            if (dist === 0) {
              resolvedTargets.push(actor);
            } else {
              const actorAngle = Math.atan2(dy, dx);
              const diff = Math.abs(normalizeAngle(actorAngle - aimAngle));
              if (diff <= halfAngleRad) {
                resolvedTargets.push(actor);
              }
            }
          }
        }
        break;
      }

      case "radius":
      case "area": {
        const radius = Number.isFinite(node.radius) ? node.radius : (Number.isFinite(node.range) ? node.range : 48);
        const center = instance.targetPoint || instance.cursor || casterPos;

        for (const actor of candidateActors) {
          if (!isActorAlive(actor)) continue;
          if (actor === caster && node.affectCaster !== true) continue;
          const pos = getActorPosition(actor);
          const dist = Math.hypot(pos.x - center.x, pos.y - center.y);
          if (dist <= radius) {
            resolvedTargets.push(actor);
          }
        }
        break;
      }

      case "nearest_enemy":
      case "enemy":
      case "hostile": {
        const casterFaction = caster ? (caster.faction || "player") : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        let closest = null;
        let minDist = Infinity;

        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const actorFaction = actor.faction || "neutral";
          if (actorFaction !== casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range && dist < minDist) {
              minDist = dist;
              closest = actor;
            }
          }
        }
        if (closest) resolvedTargets = [closest];
        break;
      }

      case "nearest_ally":
      case "ally":
      case "friendly": {
        const casterFaction = caster ? (caster.faction || "player") : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        let closest = null;
        let minDist = Infinity;

        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const actorFaction = actor.faction || "player";
          if (actorFaction === casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range && dist < minDist) {
              minDist = dist;
              closest = actor;
            }
          }
        }
        if (closest) resolvedTargets = [closest];
        break;
      }

      case "allies": {
        const casterFaction = caster ? (caster.faction || "player") : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        for (const actor of candidateActors) {
          if (!isActorAlive(actor)) continue;
          const actorFaction = actor.faction || "player";
          if (actorFaction === casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range) resolvedTargets.push(actor);
          }
        }
        break;
      }

      case "enemies": {
        const casterFaction = caster ? (caster.faction || "player") : "player";
        const range = Number.isFinite(node.range) ? node.range : Infinity;
        for (const actor of candidateActors) {
          if (!isActorAlive(actor) || actor === caster) continue;
          const actorFaction = actor.faction || "neutral";
          if (actorFaction !== casterFaction) {
            const pos = getActorPosition(actor);
            const dist = Math.hypot(pos.x - casterPos.x, pos.y - casterPos.y);
            if (dist <= range) resolvedTargets.push(actor);
          }
        }
        break;
      }

      default: {
        // Fallback: candidate targets
        resolvedTargets = candidateActors.filter(function (a) {
          return a !== caster && isActorAlive(a);
        });
        break;
      }
    }

    if (Number.isInteger(node.maxTargets) && node.maxTargets > 0) {
      resolvedTargets = resolvedTargets.slice(0, node.maxTargets);
    }

    if (resolvedTargets.length > 0 || mode === "self" || mode === "caster") {
      instance.currentTargets = resolvedTargets;
    }

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'filter' node: filters current targets by faction, type, and maxTargets.
   */
  _executeFilterNode(instance, node, nodeId) {
    const caster = instance.caster;
    const casterFaction = caster ? (caster.faction || "player") : "player";
    const filterType = (node.targetType || "enemy").toLowerCase();

    let filtered = [];

    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;
      const targetFaction = target.faction || "neutral";

      if (filterType === "enemy" || filterType === "hostile" || filterType === "enemies") {
        if (target !== caster && targetFaction !== casterFaction) {
          filtered.push(target);
        }
      } else if (filterType === "ally" || filterType === "friendly" || filterType === "allies") {
        if (targetFaction === casterFaction) {
          filtered.push(target);
        }
      } else if (filterType === "self") {
        if (target === caster) {
          filtered.push(target);
        }
      } else {
        filtered.push(target);
      }
    }

    if (Number.isInteger(node.maxTargets) && node.maxTargets > 0) {
      filtered = filtered.slice(0, node.maxTargets);
    }

    instance.currentTargets = filtered;

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'sequence' node: steps through child nodes sequentially, pausing on delays.
   */
  _executeSequenceNode(instance, node, nodeId) {
    if (!Array.isArray(node.children) || node.children.length === 0) {
      if (node.next) this._executeNode(instance, node.next);
      return;
    }

    const sequenceState = {
      sequenceNodeId: nodeId,
      children: node.children.slice(),
      nextChildIndex: 0,
      next: node.next || null
    };

    instance.pendingSequences.push(sequenceState);
    this._advanceSequence(instance, sequenceState);
  }

  /**
   * Advance a pending sequence until completion or until paused by an active delay.
   */
  _advanceSequence(instance, sequenceState) {
    while (sequenceState.nextChildIndex < sequenceState.children.length) {
      if (instance.status !== "running") return;

      const childId = sequenceState.children[sequenceState.nextChildIndex];
      sequenceState.nextChildIndex++;

      this._executeNode(instance, childId);

      // If executing the child created an active delay, pause sequence advancement
      if (instance.activeTimedActions.length > 0) {
        return;
      }
    }

    // All children executed
    const idx = instance.pendingSequences.indexOf(sequenceState);
    if (idx !== -1) {
      instance.pendingSequences.splice(idx, 1);
    }

    if (sequenceState.next) {
      this._executeNode(instance, sequenceState.next);
    }
  }

  /**
   * Execute 'condition' node: branches to onTrue or onFalse based on check result.
   */
  _executeConditionNode(instance, node, nodeId) {
    const target = instance.currentTargets[0] || instance.caster || null;
    const check = (node.check || "").toLowerCase();

    let result = false;

    if (check === "health_below_max") {
      if (target) {
        const health = target.health ?? target._health ?? 100;
        const maxHealth = target.maxHealth ?? target._maxHealth ?? 100;
        result = health < maxHealth;
      }
    } else if (check === "is_alive") {
      result = isActorAlive(target);
    } else if (check === "health_at_max" || check === "health_full") {
      if (target) {
        const health = target.health ?? target._health ?? 100;
        const maxHealth = target.maxHealth ?? target._maxHealth ?? 100;
        result = health >= maxHealth;
      }
    } else if (check === "has_status") {
      if (target && Array.isArray(target.effects)) {
        const statusName = node.statusName || node.name || "";
        result = target.effects.some(function (e) {
          return e && e.name === statusName;
        });
      }
    } else if (instance.context.conditions && typeof instance.context.conditions[node.check] === "function") {
      result = Boolean(instance.context.conditions[node.check](instance, target, node));
    } else if (typeof node.evaluate === "function") {
      result = Boolean(node.evaluate(instance, target, node));
    }

    const nextNodeId = result
      ? (node.onTrue || node.next || null)
      : (node.onFalse || node.next || null);

    if (nextNodeId) {
      this._executeNode(instance, nextNodeId);
    }
  }

  /**
   * Execute 'timed_action' node: registers a delay and pauses execution flow.
   */
  _executeTimedActionNode(instance, node, nodeId) {
    const duration = Number.isFinite(node.duration)
      ? node.duration
      : (Number.isFinite(node.delay) ? node.delay : 0);

    if (duration <= 0) {
      if (node.next) this._executeNode(instance, node.next);
      return;
    }

    instance.activeTimedActions.push({
      nodeId,
      remaining: duration,
      next: node.next || null
    });

    this._emit("ability:delay_start", {
      instance,
      nodeId,
      duration,
      abilityId: instance.abilityDef.id
    });
  }

  /**
   * Execute 'projectile' node: launches a simulated projectile traveling toward cursor/target.
   */
  _executeProjectileNode(instance, node, nodeId) {
    const caster = instance.caster;
    const origin = getActorPosition(caster);
    const speed = Number.isFinite(node.speed) ? node.speed : (Number.isFinite(node.projectileSpeed) ? node.projectileSpeed : 300);
    const maxRange = Number.isFinite(node.range) ? node.range : (Number.isFinite(node.maxDistance) ? node.maxDistance : 400);
    const radius = Number.isFinite(node.radius) ? node.radius : (Number.isFinite(node.size) ? node.size : 8);

    // Direction resolution
    const cursor = instance.cursor || instance.context.cursor || { x: origin.x + 100, y: origin.y };
    const dx = cursor.x - origin.x;
    const dy = cursor.y - origin.y;
    const distToCursor = Math.hypot(dx, dy);

    let dirX = 1;
    let dirY = 0;
    if (distToCursor > 0) {
      dirX = dx / distToCursor;
      dirY = dy / distToCursor;
    }

    // Target flight distance: to cursor (capped by maxRange) or full maxRange
    const targetFlightDistance = distToCursor > 0 ? Math.min(distToCursor, maxRange) : maxRange;

    const projectile = {
      id: this._serial++,
      nodeId,
      onHit: node.onHit || null,
      next: node.next || null,
      speed,
      maxDistance: targetFlightDistance,
      radius,
      x: origin.x,
      y: origin.y,
      dirX,
      dirY,
      travelled: 0,
      hitTargets: new Set()
    };

    instance.activeProjectiles.push(projectile);

    this._emit("projectile", {
      instance,
      projectile,
      caster,
      abilityId: instance.abilityDef.id
    });
    this._emit("ability:projectile_spawn", {
      instance,
      projectile,
      caster,
      abilityId: instance.abilityDef.id
    });

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'area_effect' node: finds targets within radius and triggers onHit on them.
   */
  _executeAreaEffectNode(instance, node, nodeId) {
    const radius = Number.isFinite(node.radius) ? node.radius : 48;
    const center = instance.impactPoint || instance.targetPoint || instance.cursor || getActorPosition(instance.caster);
    const candidateActors = this._getCandidateActors(instance);

    const affectedTargets = [];
    for (const actor of candidateActors) {
      if (!isActorAlive(actor)) continue;
      if (actor === instance.caster && node.affectCaster !== true) continue;
      const pos = getActorPosition(actor);
      const dist = Math.hypot(pos.x - center.x, pos.y - center.y);
      if (dist <= radius) {
        affectedTargets.push(actor);
      }
    }

    instance.currentTargets = affectedTargets;

    this._emit("ability:area_effect", {
      instance,
      center,
      radius,
      targets: affectedTargets,
      abilityId: instance.abilityDef.id
    });

    if (node.onHit) {
      this._executeNode(instance, node.onHit);
    }
    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'damage' node: applies damage to target Combatant / Stats.
   */
  _executeDamageNode(instance, node, nodeId) {
    const rawAmount = Number.isFinite(node.amount)
      ? node.amount
      : (Number.isFinite(node.damage) ? node.damage : (Number.isFinite(node.value) ? node.value : 0));
    const damageType = node.damageType || "physical";
    const multiplier = Number.isFinite(node.multiplier) ? node.multiplier : 1;

    let finalAmount = rawAmount * multiplier;
    if (Number.isFinite(node.criticalChance) && node.criticalChance > 0) {
      if (Math.random() < node.criticalChance) {
        finalAmount *= Number.isFinite(node.criticalMultiplier) ? node.criticalMultiplier : 2;
      }
    }

    // Missing target safety: handles empty or destroyed targets gracefully
    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;

      let damageDealt = 0;
      let killed = false;

      if (typeof target.receiveDamage === "function") {
        const result = target.receiveDamage({ amount: finalAmount, type: damageType });
        damageDealt = result?.damage ?? finalAmount;
        killed = Boolean(result?.killed || !target.isAlive);
      } else if (typeof target.takeDamage === "function") {
        damageDealt = target.takeDamage(finalAmount);
        killed = Boolean(!target.isAlive || target.health <= 0);
      } else if (target && typeof target.health === "number") {
        const prev = target.health;
        target.health = Math.max(0, target.health - finalAmount);
        damageDealt = prev - target.health;
        killed = target.health === 0;
      }

      this._emit("damage", {
        caster: instance.caster,
        target,
        amount: damageDealt,
        damageType,
        killed,
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:damage", {
        caster: instance.caster,
        target,
        amount: damageDealt,
        damageType,
        killed,
        abilityId: instance.abilityDef.id
      });
    }

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'heal' node: applies healing to target Combatant / Stats.
   */
  _executeHealNode(instance, node, nodeId) {
    const rawAmount = Number.isFinite(node.amount)
      ? node.amount
      : (Number.isFinite(node.heal) ? node.heal : (Number.isFinite(node.value) ? node.value : 0));
    const multiplier = Number.isFinite(node.multiplier) ? node.multiplier : 1;
    const healAmount = rawAmount * multiplier;

    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;

      let healed = 0;
      if (typeof target.heal === "function") {
        healed = target.heal(healAmount);
      } else if (target && typeof target.health === "number") {
        const max = target.maxHealth ?? target._maxHealth ?? target.health;
        const prev = target.health;
        target.health = Math.min(max, target.health + healAmount);
        healed = target.health - prev;
      }

      this._emit("heal", {
        caster: instance.caster,
        target,
        amount: healed,
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:heal", {
        caster: instance.caster,
        target,
        amount: healed,
        abilityId: instance.abilityDef.id
      });
    }

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'status' node: applies status effect to targets.
   */
  _executeStatusNode(instance, node, nodeId) {
    const statusName = node.name || node.effect || node.status || "effect";
    const duration = Number.isFinite(node.duration) ? node.duration : 1;
    const modifiers = (node.modifiers && typeof node.modifiers === "object") ? node.modifiers : {};
    const effect = {
      name: statusName,
      duration,
      stacks: Number.isInteger(node.stacks) ? node.stacks : 1,
      modifiers
    };

    for (const target of instance.currentTargets) {
      if (!isActorAlive(target)) continue;

      if (typeof target.applyEffect === "function") {
        target.applyEffect(effect);
      } else if (Array.isArray(target.effects)) {
        const existing = target.effects.find(function (e) {
          return e && e.name === statusName;
        });
        if (existing) {
          existing.duration = Math.max(existing.duration, duration);
          if (effect.modifiers) existing.modifiers = { ...existing.modifiers, ...effect.modifiers };
        } else {
          target.effects.push({ ...effect });
        }
      }

      this._emit("status", {
        caster: instance.caster,
        target,
        effect,
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:status", {
        caster: instance.caster,
        target,
        effect,
        abilityId: instance.abilityDef.id
      });
    }

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'knockback' node: applies knockback to targets.
   */
  _executeKnockbackNode(instance, node, nodeId) {
    const force = Number.isFinite(node.force)
      ? node.force
      : (Number.isFinite(node.distance) ? node.distance : (Number.isFinite(node.speed) ? node.speed : 100));
    const duration = Number.isFinite(node.duration) ? node.duration : 0.2;
    const caster = instance.caster;
    const casterPos = getActorPosition(caster);
    const dirMode = node.direction || "away_from_caster";

    for (const target of instance.currentTargets) {
      if (!isActorAlive(target) || target === caster) continue;

      const targetPos = getActorPosition(target);
      let dirX = 1;
      let dirY = 0;

      if (typeof dirMode === "object" && dirMode && Number.isFinite(dirMode.x) && Number.isFinite(dirMode.y)) {
        const len = Math.hypot(dirMode.x, dirMode.y);
        if (len > 0) {
          dirX = dirMode.x / len;
          dirY = dirMode.y / len;
        }
      } else if (dirMode === "towards_caster") {
        const dx = casterPos.x - targetPos.x;
        const dy = casterPos.y - targetPos.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          dirX = dx / len;
          dirY = dy / len;
        }
      } else {
        // "away_from_caster"
        const dx = targetPos.x - casterPos.x;
        const dy = targetPos.y - casterPos.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          dirX = dx / len;
          dirY = dy / len;
        }
      }

      const kx = dirX * force;
      const ky = dirY * force;

      if (target.body && typeof target.body.applyKnockback === "function") {
        target.body.applyKnockback(kx, ky);
      } else if (typeof target.applyKnockback === "function") {
        target.applyKnockback(kx, ky);
      } else if (target.position && Number.isFinite(target.position.x) && Number.isFinite(target.position.y)) {
        target.position.x += kx * duration;
        target.position.y += ky * duration;
      }
      target.lastKnockback = { x: kx, y: ky, force, direction: { x: dirX, y: dirY } };

      this._emit("knockback", {
        caster,
        target,
        force,
        direction: { x: dirX, y: dirY },
        abilityId: instance.abilityDef.id
      });
      this._emit("ability:knockback", {
        caster,
        target,
        force,
        direction: { x: dirX, y: dirY },
        abilityId: instance.abilityDef.id
      });
    }

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Execute 'presentation' node: emits presentation cues via event bus.
   */
  _executePresentationNode(instance, node, nodeId) {
    const cue = node.cue || node.name || nodeId;
    const duration = Number.isFinite(node.duration) ? node.duration : 0;
    const payload = {
      type: "presentation",
      nodeId,
      cue,
      duration,
      abilityId: instance.abilityDef.id,
      caster: instance.caster,
      targets: instance.currentTargets.slice(),
      position: instance.impactPoint || instance.targetPoint || getActorPosition(instance.caster)
    };

    this._emit("presentation", payload);
    this._emit("presentation:cue", payload);

    if (node.next) {
      this._executeNode(instance, node.next);
    }
  }

  /**
   * Advance simulation time for all active executions and cooldowns.
   * Enforces caster death cancellation and operation budgets.
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime = 0) {
    if (typeof deltaTime !== "number" || !Number.isFinite(deltaTime) || deltaTime < 0) {
      throw new TypeError("deltaTime must be a non-negative finite number");
    }

    this._operationsInCurrentTick = 0;

    // 1. Advance cooldowns
    for (const [casterId, casterMap] of Array.from(this._cooldowns.entries())) {
      for (const [abilityId, remaining] of Array.from(casterMap.entries())) {
        const next = Math.max(0, remaining - deltaTime);
        if (next === 0) {
          casterMap.delete(abilityId);
        } else {
          casterMap.set(abilityId, next);
        }
      }
      if (casterMap.size === 0) {
        this._cooldowns.delete(casterId);
      }
    }

    // 2. Advance active execution instances
    for (const instance of Array.from(this._instances.values())) {
      if (instance.status !== "running") continue;

      // Caster death cancellation: cleanly halts execution if caster is destroyed mid-cast
      if (instance.caster && !isActorAlive(instance.caster)) {
        this._cancelInstance(instance, "caster_death");
        continue;
      }

      // Update timed actions
      if (instance.activeTimedActions.length > 0) {
        const finishedActions = [];
        for (let i = instance.activeTimedActions.length - 1; i >= 0; i--) {
          const action = instance.activeTimedActions[i];
          action.remaining -= deltaTime;
          if (action.remaining <= 0) {
            instance.activeTimedActions.splice(i, 1);
            finishedActions.push(action);
          }
        }

        for (const action of finishedActions) {
          if (instance.status !== "running") break;
          if (action.next) {
            this._executeNode(instance, action.next);
          }
        }

        // Resume any pending sequences if active timed actions finished
        if (instance.status === "running" && instance.activeTimedActions.length === 0 && instance.pendingSequences.length > 0) {
          const seq = instance.pendingSequences[instance.pendingSequences.length - 1];
          this._advanceSequence(instance, seq);
        }
      }

      // Update active projectiles
      if (instance.status === "running" && instance.activeProjectiles.length > 0) {
        const candidateActors = this._getCandidateActors(instance);
        const hitProjectiles = [];

        for (let i = instance.activeProjectiles.length - 1; i >= 0; i--) {
          const proj = instance.activeProjectiles[i];
          const stepDist = proj.speed * deltaTime;
          const remainingDist = proj.maxDistance - proj.travelled;
          const actualDist = Math.min(stepDist, remainingDist);

          proj.x += proj.dirX * actualDist;
          proj.y += proj.dirY * actualDist;
          proj.travelled += actualDist;

          // Check actor contact
          let hitActor = null;
          for (const actor of candidateActors) {
            if (!isActorAlive(actor) || actor === instance.caster) continue;
            const pos = getActorPosition(actor);
            const dist = Math.hypot(actor.position ? actor.position.x - proj.x : pos.x - proj.x,
                                   actor.position ? actor.position.y - proj.y : pos.y - proj.y);
            const hitThreshold = proj.radius + (actor.hurtbox && actor.hurtbox.width ? actor.hurtbox.width / 2 : 12);
            if (dist <= hitThreshold) {
              hitActor = actor;
              break;
            }
          }

          if (hitActor || proj.travelled >= proj.maxDistance) {
            instance.activeProjectiles.splice(i, 1);
            hitProjectiles.push({ proj, hitActor });
          }
        }

        for (const { proj, hitActor } of hitProjectiles) {
          if (instance.status !== "running") break;

          instance.impactPoint = { x: proj.x, y: proj.y };
          if (hitActor) {
            instance.currentTargets = [hitActor];
          }

          this._emit("projectile_hit", {
            instance,
            projectile: proj,
            hitActor,
            position: instance.impactPoint,
            abilityId: instance.abilityDef.id
          });
          this._emit("ability:projectile_hit", {
            instance,
            projectile: proj,
            hitActor,
            position: instance.impactPoint,
            abilityId: instance.abilityDef.id
          });

          if (proj.onHit) {
            this._executeNode(instance, proj.onHit);
          }
          if (proj.next) {
            this._executeNode(instance, proj.next);
          }
        }
      }

      // Check if instance finished all work
      if (this._isInstanceFinished(instance)) {
        instance.status = "completed";
        this._instances.delete(instance.id);
        this._emit("ability:completed", {
          instance,
          caster: instance.caster,
          abilityId: instance.abilityDef.id
        });
      }
    }
  }
}
