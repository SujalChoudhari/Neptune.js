import { Component } from "../components/component.js";
import { Tilemap } from "../thalassa/tilemap.js";
import { AttackDefinition, CombatSystem, Combatant } from "./combat.js";

const finiteNonNegative = (value, name) => {
    if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a finite non-negative number`);
};

/** Tile-aware, configuration-driven enemy state machine. */
export class EnemyAI extends Component {
    constructor(config = {}) {
        super();
        if (!config || typeof config !== "object" || Array.isArray(config)) throw new TypeError("EnemyAI requires a configuration object");
        if (!(config.tilemap instanceof Tilemap)) throw new TypeError("EnemyAI requires a Tilemap");
        if (config.actor === undefined || config.actor === null) throw new TypeError("EnemyAI requires an occupant actor");
        this.tilemap = config.tilemap;
        this.actor = config.actor;
        this.spawn = { x: config.spawn?.x, y: config.spawn?.y };
        if (this.tilemap.gridIndex(this.spawn.x, this.spawn.y) === null) throw new TypeError("EnemyAI spawn must be inside the tilemap");
        this.patrolPoints = config.patrolPoints ?? [];
        if (!Array.isArray(this.patrolPoints) || this.patrolPoints.some(point => !point || this.tilemap.gridIndex(point.x, point.y) === null)) {
            throw new TypeError("EnemyAI patrolPoints must be valid tile coordinates");
        }
        this.perceptionRadius = config.perceptionRadius ?? 6;
        this.attackRange = config.attackRange ?? 1;
        this.moveInterval = config.moveInterval ?? 0.2;
        this.attackCooldown = config.attackCooldown ?? 1;
        this.fleeHealthFraction = config.fleeHealthFraction ?? null;
        finiteNonNegative(this.perceptionRadius, "perceptionRadius");
        finiteNonNegative(this.attackRange, "attackRange");
        finiteNonNegative(this.moveInterval, "moveInterval");
        finiteNonNegative(this.attackCooldown, "attackCooldown");
        if (this.fleeHealthFraction !== null && (!Number.isFinite(this.fleeHealthFraction) || this.fleeHealthFraction < 0 || this.fleeHealthFraction > 1)) {
            throw new TypeError("fleeHealthFraction must be null or between zero and one");
        }
        this.attackDefinition = config.attackDefinition ?? null;
        if (this.attackDefinition !== null && !(this.attackDefinition instanceof AttackDefinition)) throw new TypeError("attackDefinition must be an AttackDefinition");
        this.combatSystem = config.combatSystem ?? null;
        if (this.combatSystem !== null && !(this.combatSystem instanceof CombatSystem)) throw new TypeError("combatSystem must be a CombatSystem");
        this.combatant = config.combatant ?? null;
        if (this.combatant !== null && !(this.combatant instanceof Combatant)) throw new TypeError("combatant must be a Combatant");
        this.group = config.group ?? null;
        if (this.group !== null && (typeof this.group !== "object" || Array.isArray(this.group))) throw new TypeError("group must be a shared object");
        this.onAttack = typeof config.onAttack === "function" ? config.onAttack : null;
        this.state = "idle";
        this.target = null;
        this.patrolIndex = 0;
        this._moveTimer = 0;
        this._attackTimer = 0;
        this.onStateChange = null;
    }

    _position(actor) {
        for (const [index, occupant] of this.tilemap.occupants) {
            if (occupant === actor) return { x: index % this.tilemap.width, y: Math.floor(index / this.tilemap.width) };
        }
        return null;
    }

    _setState(state) {
        if (this.state === state) return;
        const previous = this.state;
        this.state = state;
        if (this.onStateChange) this.onStateChange({ previous, state, target: this.target });
    }

    _stepToward(goal) {
        const position = this._position(this.actor);
        if (!position || !goal) return false;
        const next = this.tilemap.moveOccupantToward(this.actor, goal.x, goal.y);
        if (!next || (next.x === position.x && next.y === position.y)) return false;
        this._moveTimer = this.moveInterval;
        return true;
    }

    _approachGoal(targetPosition) {
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        let best = null;
        const current = this._position(this.actor);
        for (const [dx, dy] of directions) {
            const x = targetPosition.x + dx, y = targetPosition.y + dy;
            if (!this.tilemap.isWalkable(x, y, this.actor)) continue;
            const path = current && this.tilemap.findPath(current.x, current.y, x, y, this.actor);
            if (path && (!best || path.length < best.pathLength)) best = { x, y, pathLength: path.length };
        }
        return best;
    }

    _flee(targetPosition) {
        const current = this._position(this.actor);
        if (!current || this._moveTimer > 0) return false;
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        const options = [];
        for (const [dx, dy] of directions) {
            const x = current.x + dx, y = current.y + dy;
            if (this.tilemap.isWalkable(x, y, this.actor)) options.push({ x, y, distance: Math.abs(x - targetPosition.x) + Math.abs(y - targetPosition.y) });
        }
        options.sort((a, b) => b.distance - a.distance);
        if (options.length === 0) return false;
        const moved = this.tilemap.moveOccupant(this.actor, options[0].x, options[0].y);
        if (moved) this._moveTimer = this.moveInterval;
        return moved;
    }

    _attack(target) {
        if (this._attackTimer > 0) return false;
        let started = false;
        if (this.onAttack) started = this.onAttack(target, this) !== false;
        else if (this.combatSystem && this.combatant && this.attackDefinition) {
            started = this.combatSystem.startAttack(this.combatant, this.attackDefinition, { x: target.x - this.combatant.position.x, y: target.y - this.combatant.position.y });
        }
        if (started) this._attackTimer = this.attackCooldown;
        return started;
    }

    /** Update behavior. Target is an occupant on the same tilemap; healthFraction optionally drives flee state. */
    update(deltaTime, { target = null, healthFraction = 1 } = {}) {
        finiteNonNegative(deltaTime, "EnemyAI deltaTime");
        if (!Number.isFinite(healthFraction) || healthFraction < 0 || healthFraction > 1) throw new TypeError("healthFraction must be between zero and one");
        this._moveTimer = Math.max(0, this._moveTimer - deltaTime);
        this._attackTimer = Math.max(0, this._attackTimer - deltaTime);
        const position = this._position(this.actor);
        if (!position) { this._setState("idle"); return false; }
        const sharedTarget = target ? null : (this.group?.target ?? null);
        target = target ?? sharedTarget;
        const targetPosition = target ? this._position(target) : null;
        const distance = targetPosition ? Math.abs(targetPosition.x - position.x) + Math.abs(targetPosition.y - position.y) : Infinity;
        const perceived = targetPosition && (sharedTarget === target || distance <= this.perceptionRadius);
        this.target = perceived ? target : null;
        if (perceived && !sharedTarget && this.group) this.group.target = target;

        if (perceived && this.fleeHealthFraction !== null && healthFraction <= this.fleeHealthFraction) {
            this._setState("flee");
            if (this._moveTimer === 0) this._flee(targetPosition);
            return true;
        }
        if (perceived) {
            if (distance <= this.attackRange) {
                this._setState("attack");
                this._attack(targetPosition);
            } else {
                this._setState("chase");
                if (this._moveTimer === 0) this._stepToward(this._approachGoal(targetPosition));
            }
            return true;
        }

        this.target = null;
        if (this.patrolPoints.length > 0) {
            const patrol = this.patrolPoints[this.patrolIndex % this.patrolPoints.length];
            const atPoint = position.x === patrol.x && position.y === patrol.y;
            if (atPoint) this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
            const nextPoint = this.patrolPoints[this.patrolIndex % this.patrolPoints.length];
            this._setState("patrol");
            if (this._moveTimer === 0 && (position.x !== nextPoint.x || position.y !== nextPoint.y)) this._stepToward(nextPoint);
            return true;
        }
        if (position.x !== this.spawn.x || position.y !== this.spawn.y) {
            this._setState("return");
            if (this._moveTimer === 0) this._stepToward(this.spawn);
        } else this._setState("idle");
        return true;
    }
}
