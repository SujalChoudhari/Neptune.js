/**
 * Larissa RPG System - Ability Node Graph Validation
 * ABILITY-01: Validates fixed targeting/filter/sequence/condition/effect nodes,
 * parameter constraints, node references, and directed cycle detection.
 */

/** Fixed node vocabulary supported by the Larissa ability composition runtime. */
export const ABILITY_NODE_VOCABULARY = Object.freeze([
  'target',
  'filter',
  'sequence',
  'condition',
  'projectile',
  'area_effect',
  'damage',
  'heal',
  'status',
  'knockback',
  'timed_action',
  'presentation'
]);

export const ABILITY_NODE_TYPES = ABILITY_NODE_VOCABULARY;
const NODE_TYPE_SET = new Set(ABILITY_NODE_VOCABULARY);

export const VALID_TARGET_TYPES = Object.freeze([
  'self',
  'caster',
  'target',
  'cursor',
  'point',
  'direction',
  'directional',
  'area',
  'cone',
  'radius',
  'nearest_enemy',
  'nearest_ally',
  'hostile',
  'friendly',
  'any',
  'allies',
  'enemies',
  'entity',
  'enemy',
  'ally',
  'neutral',
  'player',
  'npc'
]);
const TARGET_TYPE_SET = new Set(VALID_TARGET_TYPES);

export const VALID_DIRECTION_MODES = Object.freeze([
  'cursor',
  'target',
  'forward',
  'caster_facing',
  'target_facing',
  'away_from_caster',
  'towards_caster',
  'away_from_source',
  'towards_source',
  'movement',
  'cardinal',
  'random'
]);
const DIRECTION_MODE_SET = new Set(VALID_DIRECTION_MODES);

/** Custom error thrown when ability definition validation fails in assertValid(). */
export class AbilityValidationError extends Error {
  constructor(message, diagnostics = {}) {
    super(message);
    this.name = 'AbilityValidationError';
    this.errors = diagnostics.errors ?? [];
    this.warnings = diagnostics.warnings ?? [];
  }
}

function isPositiveNumber(val) {
  return typeof val === 'number' && Number.isFinite(val) && val > 0;
}

function isNonNegativeNumber(val) {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0;
}

function isPositiveInteger(val) {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

function isValidDirection(val) {
  if (typeof val === 'string') {
    return DIRECTION_MODE_SET.has(val.toLowerCase());
  }
  if (val && typeof val === 'object') {
    return Number.isFinite(val.x) && Number.isFinite(val.y) && (val.x !== 0 || val.y !== 0);
  }
  return false;
}

function isValidTargetType(val) {
  if (typeof val !== 'string') return false;
  return TARGET_TYPE_SET.has(val.toLowerCase());
}

/**
 * Returns all outgoing reference edges from a node for flow & cycle tracking.
 * @param {Object} node
 * @returns {Array<{ targetId: string, field: string }>}
 */
function getOutgoingEdges(node) {
  const edges = [];
  if (!node || typeof node !== 'object') return edges;

  if (typeof node.next === 'string' && node.next) {
    edges.push({ targetId: node.next, field: 'next' });
  }

  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      if (typeof node.children[i] === 'string' && node.children[i]) {
        edges.push({ targetId: node.children[i], field: `children[${i}]` });
      }
    }
  }

  const singleRefFields = [
    'onTrue',
    'onFalse',
    'onExpire',
    'onComplete',
    'onTick',
    'onMiss',
    'targetNode',
    'success',
    'failure'
  ];

  for (const field of singleRefFields) {
    if (typeof node[field] === 'string' && node[field]) {
      edges.push({ targetId: node[field], field });
    }
  }

  if (typeof node.onHit === 'string' && node.onHit) {
    edges.push({ targetId: node.onHit, field: 'onHit' });
  } else if (Array.isArray(node.onHit)) {
    for (let i = 0; i < node.onHit.length; i++) {
      if (typeof node.onHit[i] === 'string' && node.onHit[i]) {
        edges.push({ targetId: node.onHit[i], field: `onHit[${i}]` });
      }
    }
  }

  return edges;
}

export class AbilityValidator {
  /**
   * Validates an ability graph definition against structural, parameter, and graph rules.
   * @param {Object} abilityDef
   * @returns {{ valid: boolean, errors: Array<{ code: string, message: string, path: string, nodeId: string|null }>, warnings: Array<{ message: string, path: string, nodeId: string|null }> }}
   */
  static validate(abilityDef) {
    const errors = [];
    const warnings = [];

    if (!abilityDef || typeof abilityDef !== 'object' || Array.isArray(abilityDef)) {
      errors.push({
        code: 'INVALID_ROOT',
        message: 'Ability definition must be a non-null object',
        path: '',
        nodeId: null
      });
      return { valid: false, errors, warnings };
    }

    // 1. Root fields validation
    if (typeof abilityDef.id !== 'string' || !abilityDef.id.trim()) {
      errors.push({
        code: 'MISSING_ROOT_FIELD',
        message: "Ability 'id' must be a non-empty string",
        path: 'id',
        nodeId: null
      });
    }

    if (typeof abilityDef.name !== 'string' || !abilityDef.name.trim()) {
      errors.push({
        code: 'MISSING_ROOT_FIELD',
        message: "Ability 'name' must be a non-empty string",
        path: 'name',
        nodeId: null
      });
    }

    if (!abilityDef.nodes || typeof abilityDef.nodes !== 'object') {
      errors.push({
        code: 'MISSING_ROOT_FIELD',
        message: "Ability 'nodes' must be a non-null object or array",
        path: 'nodes',
        nodeId: null
      });
    }

    if (typeof abilityDef.entryNodeId !== 'string' || !abilityDef.entryNodeId.trim()) {
      errors.push({
        code: 'MISSING_ROOT_FIELD',
        message: "Ability 'entryNodeId' must be a non-empty string",
        path: 'entryNodeId',
        nodeId: null
      });
    }

    if (errors.length > 0 && !abilityDef.nodes) {
      return { valid: false, errors, warnings };
    }

    // 2. Index nodes into a Map
    const nodeMap = new Map();
    if (Array.isArray(abilityDef.nodes)) {
      if (abilityDef.nodes.length === 0) {
        errors.push({
          code: 'EMPTY_NODES',
          message: "Ability 'nodes' array cannot be empty",
          path: 'nodes',
          nodeId: null
        });
      }
      for (let i = 0; i < abilityDef.nodes.length; i++) {
        const item = abilityDef.nodes[i];
        if (!item || typeof item !== 'object') {
          errors.push({
            code: 'INVALID_NODE',
            message: `Node at index ${i} must be an object`,
            path: `nodes[${i}]`,
            nodeId: null
          });
          continue;
        }
        if (typeof item.id !== 'string' || !item.id.trim()) {
          errors.push({
            code: 'MISSING_NODE_ID',
            message: `Node at index ${i} is missing a string 'id'`,
            path: `nodes[${i}].id`,
            nodeId: null
          });
          continue;
        }
        if (nodeMap.has(item.id)) {
          errors.push({
            code: 'DUPLICATE_NODE_ID',
            message: `Duplicate node ID '${item.id}'`,
            path: `nodes[${i}].id`,
            nodeId: item.id
          });
          continue;
        }
        nodeMap.set(item.id, { node: item, path: `nodes[${i}]` });
      }
    } else if (abilityDef.nodes && typeof abilityDef.nodes === 'object') {
      const entries = Object.entries(abilityDef.nodes);
      if (entries.length === 0) {
        errors.push({
          code: 'EMPTY_NODES',
          message: "Ability 'nodes' object cannot be empty",
          path: 'nodes',
          nodeId: null
        });
      }
      for (const [key, item] of entries) {
        if (!item || typeof item !== 'object') {
          errors.push({
            code: 'INVALID_NODE',
            message: `Node '${key}' must be an object`,
            path: `nodes.${key}`,
            nodeId: key
          });
          continue;
        }
        if (item.id !== undefined && item.id !== key) {
          errors.push({
            code: 'MISMATCHED_NODE_ID',
            message: `Node key '${key}' does not match node.id '${item.id}'`,
            path: `nodes.${key}.id`,
            nodeId: key
          });
        }
        nodeMap.set(key, { node: item, path: `nodes.${key}` });
      }
    }

    // Check entryNodeId existence
    if (abilityDef.entryNodeId && typeof abilityDef.entryNodeId === 'string') {
      if (!nodeMap.has(abilityDef.entryNodeId)) {
        errors.push({
          code: 'MISSING_ENTRY_NODE',
          message: `Entry node '${abilityDef.entryNodeId}' not found in 'nodes'`,
          path: 'entryNodeId',
          nodeId: abilityDef.entryNodeId
        });
      }
    }

    // 3. Node type and parameter validation
    for (const [nodeId, { node, path }] of nodeMap.entries()) {
      if (typeof node.type !== 'string' || !node.type.trim()) {
        errors.push({
          code: 'MISSING_NODE_TYPE',
          message: `Node '${nodeId}' is missing a valid 'type'`,
          path: `${path}.type`,
          nodeId
        });
        continue;
      }

      if (!NODE_TYPE_SET.has(node.type)) {
        errors.push({
          code: 'UNKNOWN_NODE_TYPE',
          message: `Unknown node type '${node.type}' in node '${nodeId}'`,
          path: `${path}.type`,
          nodeId
        });
        continue;
      }

      // Per-node-type parameter validation
      switch (node.type) {
        case 'target': {
          if (node.targetType !== undefined && !isValidTargetType(node.targetType)) {
            errors.push({
              code: 'INVALID_TARGET_TYPE',
              message: `Invalid targetType '${node.targetType}' in target node '${nodeId}'`,
              path: `${path}.targetType`,
              nodeId
            });
          }
          if (node.mode !== undefined && !isValidTargetType(node.mode)) {
            errors.push({
              code: 'INVALID_TARGET_TYPE',
              message: `Invalid targeting mode '${node.mode}' in target node '${nodeId}'`,
              path: `${path}.mode`,
              nodeId
            });
          }
          if (node.targeting !== undefined && !['hostile', 'friendly', 'any', 'allies', 'enemies'].includes(node.targeting)) {
            errors.push({
              code: 'INVALID_TARGET_TYPE',
              message: `Invalid targeting '${node.targeting}' in target node '${nodeId}'`,
              path: `${path}.targeting`,
              nodeId
            });
          }
          if (node.range !== undefined && !isPositiveNumber(node.range)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'range' in node '${nodeId}' must be a positive number, got ${node.range}`,
              path: `${path}.range`,
              nodeId
            });
          }
          if (node.radius !== undefined && !isPositiveNumber(node.radius)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'radius' in node '${nodeId}' must be a positive number, got ${node.radius}`,
              path: `${path}.radius`,
              nodeId
            });
          }
          if (node.angle !== undefined && !isPositiveNumber(node.angle)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'angle' in node '${nodeId}' must be a positive number, got ${node.angle}`,
              path: `${path}.angle`,
              nodeId
            });
          }
          if (node.maxTargets !== undefined && !isPositiveInteger(node.maxTargets)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'maxTargets' in node '${nodeId}' must be a positive integer, got ${node.maxTargets}`,
              path: `${path}.maxTargets`,
              nodeId
            });
          }
          if (node.duration !== undefined && !isPositiveNumber(node.duration)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'duration' in node '${nodeId}' must be a positive number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          break;
        }

        case 'filter': {
          if (node.targetType !== undefined && !isValidTargetType(node.targetType)) {
            errors.push({
              code: 'INVALID_TARGET_TYPE',
              message: `Invalid targetType '${node.targetType}' in filter node '${nodeId}'`,
              path: `${path}.targetType`,
              nodeId
            });
          }
          if (node.maxTargets !== undefined && !isPositiveInteger(node.maxTargets)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'maxTargets' in node '${nodeId}' must be a positive integer, got ${node.maxTargets}`,
              path: `${path}.maxTargets`,
              nodeId
            });
          }
          break;
        }

        case 'sequence': {
          if (!Array.isArray(node.children) || node.children.length === 0) {
            errors.push({
              code: 'INVALID_PARAMETER',
              message: `Sequence node '${nodeId}' must have a non-empty array of children`,
              path: `${path}.children`,
              nodeId
            });
          }
          break;
        }

        case 'condition': {
          if (!node.onTrue && !node.onFalse && !node.next) {
            errors.push({
              code: 'INVALID_PARAMETER',
              message: `Condition node '${nodeId}' must define at least 'onTrue', 'onFalse', or 'next'`,
              path: path,
              nodeId
            });
          }
          break;
        }

        case 'projectile': {
          const speed = node.speed ?? node.projectileSpeed;
          if (speed === undefined || !isPositiveNumber(speed)) {
            const field = node.projectileSpeed !== undefined ? 'projectileSpeed' : 'speed';
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${speed}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const range = node.range ?? node.maxDistance;
          if (range !== undefined && !isPositiveNumber(range)) {
            const field = node.maxDistance !== undefined ? 'maxDistance' : 'range';
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${range}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const radius = node.radius ?? node.size;
          if (radius !== undefined && !isPositiveNumber(radius)) {
            const field = node.size !== undefined ? 'size' : 'radius';
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${radius}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const duration = node.duration ?? node.lifetime;
          if (duration !== undefined && !isPositiveNumber(duration)) {
            const field = node.lifetime !== undefined ? 'lifetime' : 'duration';
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in projectile node '${nodeId}' must be a positive number, got ${duration}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const dir = node.direction ?? node.directionMode;
          if (dir !== undefined && !isValidDirection(dir)) {
            const field = node.directionMode !== undefined ? 'directionMode' : 'direction';
            errors.push({
              code: 'INVALID_DIRECTION_MODE',
              message: `Invalid direction mode in projectile node '${nodeId}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }

        case 'area_effect': {
          if (node.radius !== undefined && !isPositiveNumber(node.radius)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'radius' in area_effect node '${nodeId}' must be a positive number, got ${node.radius}`,
              path: `${path}.radius`,
              nodeId
            });
          }
          if (node.width !== undefined && !isPositiveNumber(node.width)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'width' in area_effect node '${nodeId}' must be a positive number, got ${node.width}`,
              path: `${path}.width`,
              nodeId
            });
          }
          if (node.height !== undefined && !isPositiveNumber(node.height)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'height' in area_effect node '${nodeId}' must be a positive number, got ${node.height}`,
              path: `${path}.height`,
              nodeId
            });
          }
          if (node.range !== undefined && !isPositiveNumber(node.range)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'range' in area_effect node '${nodeId}' must be a positive number, got ${node.range}`,
              path: `${path}.range`,
              nodeId
            });
          }
          if (node.duration !== undefined && !isNonNegativeNumber(node.duration)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'duration' in area_effect node '${nodeId}' must be a non-negative number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          const tickRate = node.tickRate ?? node.interval;
          if (tickRate !== undefined && !isPositiveNumber(tickRate)) {
            const field = node.interval !== undefined ? 'interval' : 'tickRate';
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in area_effect node '${nodeId}' must be a positive number, got ${tickRate}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const dir = node.direction ?? node.directionMode;
          if (dir !== undefined && !isValidDirection(dir)) {
            const field = node.directionMode !== undefined ? 'directionMode' : 'direction';
            errors.push({
              code: 'INVALID_DIRECTION_MODE',
              message: `Invalid direction mode in area_effect node '${nodeId}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }

        case 'damage': {
          const dmg = node.amount ?? node.damage ?? node.value;
          if (dmg === undefined || !isPositiveNumber(dmg)) {
            const field = node.damage !== undefined ? 'damage' : (node.value !== undefined ? 'value' : 'amount');
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in damage node '${nodeId}' must be a positive number, got ${dmg}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          if (node.multiplier !== undefined && !isPositiveNumber(node.multiplier)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'multiplier' in damage node '${nodeId}' must be a positive number, got ${node.multiplier}`,
              path: `${path}.multiplier`,
              nodeId
            });
          }
          if (node.criticalMultiplier !== undefined && !isPositiveNumber(node.criticalMultiplier)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'criticalMultiplier' in damage node '${nodeId}' must be a positive number, got ${node.criticalMultiplier}`,
              path: `${path}.criticalMultiplier`,
              nodeId
            });
          }
          if (node.criticalChance !== undefined && (!Number.isFinite(node.criticalChance) || node.criticalChance < 0 || node.criticalChance > 1)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'criticalChance' in damage node '${nodeId}' must be a number between 0 and 1, got ${node.criticalChance}`,
              path: `${path}.criticalChance`,
              nodeId
            });
          }
          break;
        }

        case 'heal': {
          const heal = node.amount ?? node.heal ?? node.value;
          if (heal === undefined || !isPositiveNumber(heal)) {
            const field = node.heal !== undefined ? 'heal' : (node.value !== undefined ? 'value' : 'amount');
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in heal node '${nodeId}' must be a positive number, got ${heal}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }

        case 'status': {
          const statusId = node.statusId ?? node.status ?? node.name ?? node.effect;
          if (typeof statusId !== 'string' || !statusId.trim()) {
            errors.push({
              code: 'INVALID_PARAMETER',
              message: `Status node '${nodeId}' requires a non-empty status identifier string`,
              path: `${path}.status`,
              nodeId
            });
          }
          if (node.duration === undefined || !isPositiveNumber(node.duration)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'duration' in status node '${nodeId}' must be a positive number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          if (node.stacks !== undefined && !isPositiveInteger(node.stacks)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'stacks' in status node '${nodeId}' must be a positive integer, got ${node.stacks}`,
              path: `${path}.stacks`,
              nodeId
            });
          }
          if (node.maxStacks !== undefined && !isPositiveInteger(node.maxStacks)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'maxStacks' in status node '${nodeId}' must be a positive integer, got ${node.maxStacks}`,
              path: `${path}.maxStacks`,
              nodeId
            });
          }
          const tickRate = node.tickRate ?? node.interval;
          if (tickRate !== undefined && !isPositiveNumber(tickRate)) {
            const field = node.interval !== undefined ? 'interval' : 'tickRate';
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in status node '${nodeId}' must be a positive number, got ${tickRate}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }

        case 'knockback': {
          const force = node.force ?? node.distance ?? node.speed;
          if (force === undefined || !isPositiveNumber(force)) {
            const field = node.distance !== undefined ? 'distance' : (node.speed !== undefined ? 'speed' : 'force');
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in knockback node '${nodeId}' must be a positive number, got ${force}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          const dir = node.direction ?? node.directionMode;
          if (dir !== undefined && !isValidDirection(dir)) {
            const field = node.directionMode !== undefined ? 'directionMode' : 'direction';
            errors.push({
              code: 'INVALID_DIRECTION_MODE',
              message: `Invalid direction mode in knockback node '${nodeId}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          if (node.duration !== undefined && !isPositiveNumber(node.duration)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'duration' in knockback node '${nodeId}' must be a positive number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          break;
        }

        case 'timed_action': {
          const dur = node.duration ?? node.delay;
          if (dur === undefined || !isPositiveNumber(dur)) {
            const field = node.delay !== undefined ? 'delay' : 'duration';
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property '${field}' in timed_action node '${nodeId}' must be a positive number, got ${dur}`,
              path: `${path}.${field}`,
              nodeId
            });
          }
          break;
        }

        case 'presentation': {
          if (node.duration !== undefined && !isNonNegativeNumber(node.duration)) {
            errors.push({
              code: 'OUT_OF_RANGE_NUMERIC',
              message: `Property 'duration' in presentation node '${nodeId}' must be a non-negative number, got ${node.duration}`,
              path: `${path}.duration`,
              nodeId
            });
          }
          break;
        }
      }

      // 4. Validate referenced node IDs exist in nodes
      if (node.next !== undefined) {
        if (typeof node.next !== 'string' || !node.next.trim()) {
          errors.push({
            code: 'INVALID_NODE_REFERENCE',
            message: `Reference 'next' in node '${nodeId}' must be a non-empty string`,
            path: `${path}.next`,
            nodeId
          });
        } else if (!nodeMap.has(node.next)) {
          errors.push({
            code: 'MISSING_NODE_REFERENCE',
            message: `Node '${nodeId}' references non-existent node '${node.next}' in 'next'`,
            path: `${path}.next`,
            nodeId
          });
        }
      }

      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          const childId = node.children[i];
          if (typeof childId !== 'string' || !childId.trim()) {
            errors.push({
              code: 'INVALID_NODE_REFERENCE',
              message: `Child reference at index ${i} in node '${nodeId}' must be a non-empty string`,
              path: `${path}.children[${i}]`,
              nodeId
            });
          } else if (!nodeMap.has(childId)) {
            errors.push({
              code: 'MISSING_NODE_REFERENCE',
              message: `Sequence node '${nodeId}' references non-existent node '${childId}' in 'children'`,
              path: `${path}.children[${i}]`,
              nodeId
            });
          }
        }
      }

      const singleRefProps = [
        'onTrue',
        'onFalse',
        'onComplete',
        'onExpire',
        'onTick',
        'onMiss',
        'targetNode',
        'success',
        'failure'
      ];

      for (const field of singleRefProps) {
        if (node[field] !== undefined) {
          if (typeof node[field] !== 'string' || !node[field].trim()) {
            errors.push({
              code: 'INVALID_NODE_REFERENCE',
              message: `Reference '${field}' in node '${nodeId}' must be a non-empty string`,
              path: `${path}.${field}`,
              nodeId
            });
          } else if (!nodeMap.has(node[field])) {
            errors.push({
              code: 'MISSING_NODE_REFERENCE',
              message: `Node '${nodeId}' references non-existent node '${node[field]}' in '${field}'`,
              path: `${path}.${field}`,
              nodeId
            });
          }
        }
      }

      if (node.onHit !== undefined) {
        if (typeof node.onHit === 'string') {
          if (!node.onHit.trim()) {
            errors.push({
              code: 'INVALID_NODE_REFERENCE',
              message: `Reference 'onHit' in node '${nodeId}' must be a non-empty string`,
              path: `${path}.onHit`,
              nodeId
            });
          } else if (!nodeMap.has(node.onHit)) {
            errors.push({
              code: 'MISSING_NODE_REFERENCE',
              message: `Node '${nodeId}' references non-existent node '${node.onHit}' in 'onHit'`,
              path: `${path}.onHit`,
              nodeId
            });
          }
        } else if (Array.isArray(node.onHit)) {
          for (let i = 0; i < node.onHit.length; i++) {
            const hitRef = node.onHit[i];
            if (typeof hitRef !== 'string' || !hitRef.trim()) {
              errors.push({
                code: 'INVALID_NODE_REFERENCE',
                message: `Reference 'onHit[${i}]' in node '${nodeId}' must be a non-empty string`,
                path: `${path}.onHit[${i}]`,
                nodeId
              });
            } else if (!nodeMap.has(hitRef)) {
              errors.push({
                code: 'MISSING_NODE_REFERENCE',
                message: `Node '${nodeId}' references non-existent node '${hitRef}' in 'onHit'`,
                path: `${path}.onHit[${i}]`,
                nodeId
              });
            }
          }
        }
      }
    }

    // 5. Reachability warnings from entryNodeId
    if (abilityDef.entryNodeId && nodeMap.has(abilityDef.entryNodeId)) {
      const reachable = new Set();
      const markReachable = (id) => {
        if (reachable.has(id) || !nodeMap.has(id)) return;
        reachable.add(id);
        const edges = getOutgoingEdges(nodeMap.get(id)?.node);
        for (const edge of edges) {
          markReachable(edge.targetId);
        }
      };
      markReachable(abilityDef.entryNodeId);

      for (const [id, { path }] of nodeMap.entries()) {
        if (!reachable.has(id)) {
          warnings.push({
            message: `Node '${id}' is unreachable from entryNodeId '${abilityDef.entryNodeId}'`,
            path,
            nodeId: id
          });
        }
      }
    }

    // 6. Directed cycle detection using 3-color DFS
    const visited = new Set();
    const visiting = new Map();
    const currentPath = [];
    const detectedCycles = new Set();

    function dfs(currentId) {
      visiting.set(currentId, currentPath.length);
      currentPath.push(currentId);

      const nodeInfo = nodeMap.get(currentId);
      const outgoing = getOutgoingEdges(nodeInfo?.node);

      for (const edge of outgoing) {
        const nextId = edge.targetId;
        if (!nodeMap.has(nextId)) continue;

        if (visiting.has(nextId)) {
          // Cycle found!
          const cycleStartIdx = visiting.get(nextId);
          const cycleNodes = currentPath.slice(cycleStartIdx).concat(nextId);
          const cycleKey = cycleNodes.join(' -> ');

          if (!detectedCycles.has(cycleKey)) {
            detectedCycles.add(cycleKey);
            errors.push({
              code: 'CYCLE_DETECTED',
              message: `Cycle detected in graph flow: ${cycleKey}`,
              path: `${nodeInfo.path}.${edge.field}`,
              nodeId: currentId,
              cycle: cycleNodes,
              nodePath: cycleNodes
            });
          }
        } else if (!visited.has(nextId)) {
          dfs(nextId);
        }
      }

      visiting.delete(currentId);
      currentPath.pop();
      visited.add(currentId);
    }

    // Prioritize checking from entryNodeId
    if (abilityDef.entryNodeId && nodeMap.has(abilityDef.entryNodeId)) {
      dfs(abilityDef.entryNodeId);
    }

    // Check all remaining unvisited nodes for disconnected cycles
    for (const id of nodeMap.keys()) {
      if (!visited.has(id)) {
        dfs(id);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Asserts that an ability definition is valid, throwing AbilityValidationError on failure.
   * @param {Object} abilityDef
   * @returns {{ valid: true, errors: Array, warnings: Array }}
   */
  static assertValid(abilityDef) {
    const result = AbilityValidator.validate(abilityDef);
    if (!result.valid) {
      const summary = result.errors
        .map(e => `[${e.code}] ${e.path ? `${e.path}: ` : ''}${e.message}`)
        .join('\n  ');
      throw new AbilityValidationError(
        `Ability '${abilityDef?.id || 'unknown'}' validation failed with ${result.errors.length} error(s):\n  ${summary}`,
        result
      );
    }
    return result;
  }

  validate(abilityDef) {
    return AbilityValidator.validate(abilityDef);
  }

  assertValid(abilityDef) {
    return AbilityValidator.assertValid(abilityDef);
  }
}

export default AbilityValidator;
