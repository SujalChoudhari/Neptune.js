/**
 * @file versionedSave.js
 * SAVE-01: Versioned save engine, sequential schema migrations,
 * reference validation, future version detection, and corrupt JSON recovery.
 */

/**
 * In-memory fallback storage adhering to Storage interface.
 */
export class MapStorage {
    /**
     * @param {Array<Array<string>>} [initialEntries]
     */
    constructor(initialEntries) {
        this._map = new Map(initialEntries || []);
    }

    /**
     * @param {string} key
     * @returns {string|null}
     */
    getItem(key) {
        const k = String(key);
        return this._map.has(k) ? this._map.get(k) : null;
    }

    /**
     * @param {string} key
     * @param {string} value
     */
    setItem(key, value) {
        this._map.set(String(key), String(value));
    }

    /**
     * @param {string} key
     */
    removeItem(key) {
        this._map.delete(String(key));
    }

    clear() {
        this._map.clear();
    }

    /**
     * @param {number} index
     * @returns {string|null}
     */
    key(index) {
        return Array.from(this._map.keys())[index] || null;
    }

    /**
     * @returns {string[]}
     */
    keys() {
        return Array.from(this._map.keys());
    }

    /**
     * @returns {number}
     */
    get length() {
        return this._map.size;
    }
}

/**
 * Error thrown when a save file schema version exceeds the supported version.
 */
export class FutureVersionError extends Error {
    /**
     * @param {number} saveVersion
     * @param {number} supportedVersion
     * @param {string} [customMessage]
     */
    constructor(saveVersion, supportedVersion, customMessage) {
        const msg = customMessage ||
            `Save schema version (${saveVersion}) is newer than supported version (${supportedVersion}). Please update the application to load this save.`;
        super(msg);
        this.name = "FutureVersionError";
        this.code = "ERR_FUTURE_SCHEMA_VERSION";
        this.saveVersion = saveVersion;
        this.supportedVersion = supportedVersion;
        this.isFutureVersion = true;
    }
}

/**
 * Error thrown when entity or component references are invalid.
 */
export class ReferenceValidationError extends Error {
    /**
     * @param {Object|string} resultOrMessage
     * @param {Object} [details]
     */
    constructor(resultOrMessage, details) {
        const message = typeof resultOrMessage === "string"
            ? resultOrMessage
            : ReferenceValidationError.formatMessage(resultOrMessage);
        super(message);
        this.name = "ReferenceValidationError";
        this.code = "ERR_REFERENCE_VALIDATION";

        if (resultOrMessage && typeof resultOrMessage === "object") {
            this.validationResult = resultOrMessage;
            this.errors = resultOrMessage.errors || [];
            this.duplicates = resultOrMessage.duplicates || { entities: [], components: [] };
            this.dangling = resultOrMessage.dangling || [];
        } else {
            const extra = details || {};
            this.errors = extra.errors || [message];
            this.duplicates = extra.duplicates || { entities: [], components: [] };
            this.dangling = extra.dangling || [];
        }
    }

    /**
     * Format a readable message from validation results.
     * @param {Object} result
     * @returns {string}
     */
    static formatMessage(result) {
        const parts = ["Reference validation failed:"];
        if (result && Array.isArray(result.errors) && result.errors.length > 0) {
            for (let i = 0; i < result.errors.length; i++) {
                parts.push(`  - ${result.errors[i]}`);
            }
        }
        return parts.join("\n");
    }
}

/**
 * Error thrown when a schema migration fails or fails step verification.
 */
export class MigrationError extends Error {
    /**
     * @param {string} message
     * @param {Object} [details]
     */
    constructor(message, details) {
        super(message);
        this.name = "MigrationError";
        this.code = "ERR_SCHEMA_MIGRATION";
        const info = details || {};
        this.fromVersion = info.fromVersion;
        this.toVersion = info.toVersion;
        this.step = info.step;
        this.cause = info.cause || null;
        this.aborted = true;
        this.originalStatePreserved = true;
    }
}

/**
 * Error thrown when JSON save data is corrupt and cannot be parsed or recovered.
 */
export class CorruptSaveError extends Error {
    /**
     * @param {string} message
     * @param {Object} [details]
     */
    constructor(message, details) {
        super(message);
        this.name = "CorruptSaveError";
        this.code = "ERR_CORRUPT_SAVE_JSON";
        const info = details || {};
        this.line = info.line || 1;
        this.column = info.column || 1;
        this.position = info.position || 0;
        this.snippet = info.snippet || "";
        this.rawText = info.rawText || "";
        this.diagnostic = info.diagnostic || null;
    }
}

/**
 * Registry and planner for sequential schema migrations.
 */
export class SchemaMigrationRegistry {
    constructor() {
        /** @type {Map<number, Object>} */
        this._migrations = new Map();
    }

    /**
     * Register a migration step.
     * Can be called as register(fromVersion, toVersion, migrateFn, options)
     * or register(fromVersion, migrateFn, options) where toVersion = fromVersion + 1.
     *
     * @param {number} fromVersion
     * @param {number|Function} toVersionOrFn
     * @param {Function} [maybeFn]
     * @param {Object} [options]
     * @returns {SchemaMigrationRegistry}
     */
    register(fromVersion, toVersionOrFn, maybeFn, options) {
        if (!Number.isInteger(fromVersion)) {
            throw new TypeError("fromVersion must be an integer.");
        }

        let toVersion;
        let migrateFn;
        let stepOptions = options || {};

        if (typeof toVersionOrFn === "function") {
            toVersion = fromVersion + 1;
            migrateFn = toVersionOrFn;
            if (typeof maybeFn === "object" && maybeFn !== null) {
                stepOptions = maybeFn;
            }
        } else if (Number.isInteger(toVersionOrFn) && typeof maybeFn === "function") {
            toVersion = toVersionOrFn;
            migrateFn = maybeFn;
        } else {
            throw new TypeError("Invalid migration arguments: expected (fromVersion, toVersion, migrateFn) or (fromVersion, migrateFn).");
        }

        if (toVersion <= fromVersion) {
            throw new RangeError(`Migration target version (${toVersion}) must be greater than source version (${fromVersion}).`);
        }

        this._migrations.set(fromVersion, {
            fromVersion,
            toVersion,
            migrate: migrateFn,
            verify: stepOptions.verify || null,
            description: stepOptions.description || `Migration from v${fromVersion} to v${toVersion}`
        });

        return this;
    }

    /**
     * Check if a migration is registered from fromVersion.
     * @param {number} fromVersion
     * @returns {boolean}
     */
    has(fromVersion) {
        return this._migrations.has(fromVersion);
    }

    /**
     * Get migration step starting from fromVersion.
     * @param {number} fromVersion
     * @returns {Object|null}
     */
    get(fromVersion) {
        return this._migrations.get(fromVersion) || null;
    }

    /**
     * Plan sequential migration steps from sourceVersion to targetVersion.
     * @param {number} fromVersion
     * @param {number} targetVersion
     * @returns {Array<Object>}
     */
    getPlan(fromVersion, targetVersion) {
        if (!Number.isInteger(fromVersion) || !Number.isInteger(targetVersion)) {
            throw new TypeError("Schema versions must be integers.");
        }
        if (fromVersion > targetVersion) {
            throw new RangeError(`Cannot migrate backward from v${fromVersion} to v${targetVersion}.`);
        }
        if (fromVersion === targetVersion) {
            return [];
        }

        const plan = [];
        let current = fromVersion;
        while (current < targetVersion) {
            const step = this._migrations.get(current);
            if (!step) {
                throw new Error(`No migration registered from schema version ${current} to reach supported version ${targetVersion}.`);
            }
            if (step.toVersion > targetVersion) {
                throw new Error(`Migration step from v${current} targets v${step.toVersion}, which exceeds target version ${targetVersion}.`);
            }
            plan.push(step);
            current = step.toVersion;
        }
        return plan;
    }

    /**
     * Clear all registered migrations.
     */
    clear() {
        this._migrations.clear();
    }
}

/**
 * Validates entity and component references for duplicate IDs and dangling pointers.
 */
export class ReferenceValidator {
    /**
     * @param {Object} [options]
     */
    constructor(options) {
        const opts = options || {};
        this.referenceFields = opts.referenceFields || [
            "parentId",
            "parent",
            "targetId",
            "targetEntityId",
            "entityId",
            "followTargetId",
            "ownerId"
        ];
        this.throwOnError = opts.throwOnError || false;
    }

    /**
     * Static shortcut to validate references on data.
     * @param {Object} data
     * @param {Object} [options]
     * @returns {Object}
     */
    static validate(data, options) {
        const validator = new ReferenceValidator(options);
        return validator.validate(data, options);
    }

    /**
     * Validate data for duplicate entity/component IDs and dangling references.
     * @param {Object} data
     * @param {Object} [options]
     * @returns {Object}
     */
    validate(data, options) {
        const opts = options || {};
        const shouldThrow = opts.throwOnError !== undefined ? opts.throwOnError : this.throwOnError;

        const allEntities = [];
        const allComponents = [];
        const entityMap = new Map();
        const componentMap = new Map();
        const duplicateEntityIds = new Set();
        const duplicateComponentIds = new Set();
        const dangling = [];
        const visited = new Set();

        function visitEntity(ent) {
            if (!ent || typeof ent !== "object" || visited.has(ent)) return;
            visited.add(ent);
            allEntities.push(ent);

            if (ent.id !== undefined && ent.id !== null) {
                const idStr = String(ent.id);
                if (entityMap.has(idStr)) {
                    duplicateEntityIds.add(idStr);
                } else {
                    entityMap.set(idStr, ent);
                }
            }

            // Inspect components
            if (Array.isArray(ent.components)) {
                for (let i = 0; i < ent.components.length; i++) {
                    const comp = ent.components[i];
                    if (comp && typeof comp === "object") {
                        allComponents.push({ component: comp, entity: ent });
                        if (comp.id !== undefined && comp.id !== null) {
                            const cidStr = String(comp.id);
                            if (componentMap.has(cidStr)) {
                                duplicateComponentIds.add(cidStr);
                            } else {
                                componentMap.set(cidStr, { component: comp, entity: ent });
                            }
                        }
                    }
                }
            } else if (ent.components && typeof ent.components === "object") {
                // Dictionary of components
                for (const key of Object.keys(ent.components)) {
                    const comp = ent.components[key];
                    if (comp && typeof comp === "object") {
                        allComponents.push({ component: comp, entity: ent });
                        if (comp.id !== undefined && comp.id !== null) {
                            const cidStr = String(comp.id);
                            if (componentMap.has(cidStr)) {
                                duplicateComponentIds.add(cidStr);
                            } else {
                                componentMap.set(cidStr, { component: comp, entity: ent });
                            }
                        }
                    }
                }
            }

            // Inspect child entities
            if (Array.isArray(ent.children)) {
                for (let i = 0; i < ent.children.length; i++) {
                    const child = ent.children[i];
                    if (child && typeof child === "object") {
                        visitEntity(child);
                    }
                }
            }
        }

        function scan(obj) {
            if (!obj || typeof obj !== "object" || visited.has(obj)) return;

            if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    const item = obj[i];
                    if (item && typeof item === "object") {
                        if (item.id !== undefined && (
                            item.components !== undefined ||
                            item.children !== undefined ||
                            item.parentId !== undefined ||
                            item.parent !== undefined ||
                            item.type === "Entity" ||
                            item.name !== undefined
                        )) {
                            visitEntity(item);
                        } else {
                            scan(item);
                        }
                    }
                }
                return;
            }

            if (Array.isArray(obj.entities)) {
                for (let i = 0; i < obj.entities.length; i++) {
                    visitEntity(obj.entities[i]);
                }
            }

            if (Array.isArray(obj.children)) {
                for (let i = 0; i < obj.children.length; i++) {
                    if (obj.children[i] && typeof obj.children[i] === "object") {
                        visitEntity(obj.children[i]);
                    }
                }
            }

            if (obj.state && typeof obj.state === "object") scan(obj.state);
            if (obj.scene && typeof obj.scene === "object") scan(obj.scene);
            if (obj.data && typeof obj.data === "object") scan(obj.data);

            if (obj.id !== undefined && (
                obj.components !== undefined ||
                obj.children !== undefined ||
                obj.parentId !== undefined ||
                obj.parent !== undefined
            )) {
                visitEntity(obj);
            }
        }

        scan(data);

        // Check dangling entity references
        for (let i = 0; i < allEntities.length; i++) {
            const ent = allEntities[i];
            const entId = ent.id !== undefined ? String(ent.id) : `[anonymous entity #${i}]`;

            // Parent reference check
            const parentRef = ent.parentId !== undefined && ent.parentId !== null && ent.parentId !== ""
                ? ent.parentId
                : (typeof ent.parent === "string" && ent.parent !== "" ? ent.parent : null);

            if (parentRef !== null && parentRef !== undefined) {
                const targetId = String(parentRef);
                if (ent.id !== undefined && String(ent.id) === targetId) {
                    dangling.push({
                        sourceId: entId,
                        sourceType: "entity",
                        field: "parentId",
                        targetId,
                        message: `Entity '${entId}' has cyclic self-referencing parentId '${targetId}'.`
                    });
                } else if (!entityMap.has(targetId)) {
                    dangling.push({
                        sourceId: entId,
                        sourceType: "entity",
                        field: "parentId",
                        targetId,
                        message: `Entity '${entId}' references non-existent parentId '${targetId}'.`
                    });
                }
            }

            // Check other reference fields on entity
            for (let f = 0; f < this.referenceFields.length; f++) {
                const field = this.referenceFields[f];
                if (field === "parentId" || field === "parent") continue;
                if (ent[field] !== undefined && ent[field] !== null && ent[field] !== "") {
                    const targetId = String(ent[field]);
                    if (!entityMap.has(targetId) && !componentMap.has(targetId)) {
                        dangling.push({
                            sourceId: entId,
                            sourceType: "entity",
                            field,
                            targetId,
                            message: `Entity '${entId}' has dangling reference in '${field}' pointing to non-existent '${targetId}'.`
                        });
                    }
                }
            }
        }

        // Check dangling component references
        for (let i = 0; i < allComponents.length; i++) {
            const { component, entity } = allComponents[i];
            const sourceId = component.id !== undefined ? String(component.id) : (entity?.id ? String(entity.id) : `[component #${i}]`);
            const compLabel = component.id ? `Component '${component.id}'` : `Component on entity '${entity?.id}'`;

            for (let f = 0; f < this.referenceFields.length; f++) {
                const field = this.referenceFields[f];
                if (component[field] !== undefined && component[field] !== null && component[field] !== "") {
                    const targetId = String(component[field]);
                    if (!entityMap.has(targetId) && !componentMap.has(targetId)) {
                        dangling.push({
                            sourceId,
                            sourceType: "component",
                            field,
                            targetId,
                            message: `${compLabel} has dangling reference in '${field}' pointing to non-existent '${targetId}'.`
                        });
                    }
                }
            }
        }

        const errors = [];
        for (const id of duplicateEntityIds) {
            errors.push(`Duplicate entity ID detected: '${id}'.`);
        }
        for (const id of duplicateComponentIds) {
            errors.push(`Duplicate component ID detected: '${id}'.`);
        }
        for (let i = 0; i < dangling.length; i++) {
            errors.push(dangling[i].message);
        }

        const result = {
            valid: errors.length === 0,
            errors,
            duplicates: {
                entities: Array.from(duplicateEntityIds),
                components: Array.from(duplicateComponentIds)
            },
            dangling,
            entityCount: allEntities.length,
            componentCount: allComponents.length
        };

        if (!result.valid && shouldThrow) {
            throw new ReferenceValidationError(result);
        }

        return result;
    }
}

/**
 * Versioned Save Engine providing sequential migrations, step verification,
 * atomic rollback on failure, future version detection, reference validation,
 * and corrupt JSON diagnostics/recovery.
 */
export class VersionedSaveEngine {
    /**
     * @param {Object} [options]
     */
    constructor(options) {
        const opts = options || {};
        this.currentVersion = Number.isInteger(opts.currentVersion) ? opts.currentVersion : 1;
        this.storage = opts.storage !== undefined
            ? opts.storage
            : (typeof globalThis.localStorage !== "undefined" ? globalThis.localStorage : new MapStorage());
        this.prefix = opts.prefix || "neptune.save";
        this.validateReferences = opts.validateReferences !== undefined ? Boolean(opts.validateReferences) : true;
        this.autoRecoverCorrupt = opts.autoRecoverCorrupt !== undefined ? Boolean(opts.autoRecoverCorrupt) : true;

        this.migrationRegistry = opts.migrations instanceof SchemaMigrationRegistry
            ? opts.migrations
            : new SchemaMigrationRegistry();

        if (opts.migrations && !(opts.migrations instanceof SchemaMigrationRegistry)) {
            if (Array.isArray(opts.migrations)) {
                for (let i = 0; i < opts.migrations.length; i++) {
                    const m = opts.migrations[i];
                    this.migrationRegistry.register(m.from, m.to, m.migrate, m);
                }
            } else if (typeof opts.migrations === "object") {
                for (const key of Object.keys(opts.migrations)) {
                    const fromV = Number.parseInt(key, 10);
                    if (Number.isInteger(fromV)) {
                        const val = opts.migrations[key];
                        if (typeof val === "function") {
                            this.migrationRegistry.register(fromV, val);
                        } else if (val && typeof val === "object" && typeof val.migrate === "function") {
                            this.migrationRegistry.register(fromV, val.to || (fromV + 1), val.migrate, val);
                        }
                    }
                }
            }
        }

        this.validator = opts.validator instanceof ReferenceValidator
            ? opts.validator
            : new ReferenceValidator(opts.validator);
    }

    /**
     * Build storage key for a save slot.
     * @param {string} slot
     * @returns {string}
     */
    key(slot) {
        if (typeof slot !== "string" || !slot.trim()) {
            throw new TypeError("Save slot must be a non-empty string.");
        }
        return `${this.prefix}.${encodeURIComponent(slot)}`;
    }

    /**
     * Register a schema migration.
     * @param {number} fromVersion
     * @param {number|Function} toVersionOrFn
     * @param {Function} [maybeFn]
     * @param {Object} [options]
     * @returns {VersionedSaveEngine}
     */
    registerMigration(fromVersion, toVersionOrFn, maybeFn, options) {
        this.migrationRegistry.register(fromVersion, toVersionOrFn, maybeFn, options);
        return this;
    }

    /**
     * Diagnose a corrupt JSON string and produce line, column, snippet, and reason.
     * @param {string} rawText
     * @param {Error} [syntaxError]
     * @returns {Object}
     */
    diagnoseCorruptJson(rawText, syntaxError) {
        if (typeof rawText !== "string") {
            return {
                position: 0,
                line: 1,
                column: 1,
                snippet: "",
                reason: "Input is not a string",
                message: "Corrupt JSON: input is not a string."
            };
        }

        const errMessage = syntaxError ? syntaxError.message : "";
        let position = null;

        const posMatch = errMessage.match(/position\s+(\d+)/i);
        if (posMatch) {
            position = Number.parseInt(posMatch[1], 10);
        } else {
            const lineColMatch = errMessage.match(/(\d+):(\d+)/);
            if (lineColMatch) {
                const targetLine = Number.parseInt(lineColMatch[1], 10);
                const targetCol = Number.parseInt(lineColMatch[2], 10);
                const lines = rawText.split("\n");
                let charCount = 0;
                for (let i = 0; i < targetLine - 1 && i < lines.length; i++) {
                    charCount += lines[i].length + 1;
                }
                position = charCount + targetCol - 1;
            }
        }

        if (position === null || position >= rawText.length) {
            if (/unexpected end/i.test(errMessage)) {
                position = Math.max(0, rawText.length);
            } else {
                position = 0;
            }
        }

        const lines = rawText.split("\n");
        let currentPos = 0;
        let line = 1;
        let column = 1;

        for (let i = 0; i < lines.length; i++) {
            const lineLen = lines[i].length + 1;
            if (currentPos + lineLen > position || i === lines.length - 1) {
                line = i + 1;
                column = Math.max(1, position - currentPos + 1);
                break;
            }
            currentPos += lineLen;
        }

        const lineContent = lines[line - 1] || "";
        const prefix = `Line ${line}: `;
        const pointerIndent = " ".repeat(prefix.length + Math.max(0, Math.min(column - 1, lineContent.length)));
        const snippet = `${prefix}${lineContent}\n${pointerIndent}^`;

        let reason = "Syntax error in JSON string.";
        if (/unexpected end/i.test(errMessage)) {
            reason = "Unexpected end of JSON input. The file was likely truncated during an interrupted save or crash.";
        } else if (/,(\s*[}\]])/.test(rawText)) {
            reason = "Illegal trailing comma before closing brace or bracket.";
        } else if (/'[^']*'/.test(rawText)) {
            reason = "Single quotes used instead of double quotes.";
        } else if (/expected property name/i.test(errMessage) || /expected double-quoted/i.test(errMessage)) {
            reason = "Unquoted or improperly quoted object property key.";
        }

        const message = `Corrupt JSON at line ${line}, column ${column}: ${reason}\n${snippet}`;

        return {
            position,
            line,
            column,
            snippet,
            reason,
            message,
            rawText,
            cause: syntaxError || null
        };
    }

    /**
     * Repair truncated JSON strings by closing open quotes and brackets.
     * @param {string} text
     * @returns {string|null}
     * @private
     */
    #repairTruncatedJson(text) {
        if (!text || typeof text !== "string") return null;
        const s = text.trim();
        if (!s) return null;

        let inString = false;
        let escaped = false;
        const stack = [];

        for (let i = 0; i < s.length; i++) {
            const char = s[i];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (char === "\\") {
                    escaped = true;
                } else if (char === '"') {
                    inString = false;
                }
            } else {
                if (char === '"') {
                    inString = true;
                } else if (char === "{" || char === "[") {
                    stack.push(char);
                } else if (char === "}") {
                    if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
                } else if (char === "]") {
                    if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
                }
            }
        }

        let repaired = s;
        if (inString) {
            repaired += '"';
        }

        repaired = repaired.replace(/,\s*$/, "");
        repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

        while (stack.length > 0) {
            const open = stack.pop();
            repaired = repaired.replace(/,\s*$/, "");
            if (open === "{") repaired += "}";
            else if (open === "[") repaired += "]";
        }

        return repaired;
    }

    /**
     * Attempt recovery of corrupt JSON through heuristics and fallback backups.
     * @param {string} rawText
     * @param {Object} [options]
     * @returns {Object}
     */
    recoverCorruptJson(rawText, options) {
        if (typeof rawText !== "string") {
            throw new TypeError("rawText must be a string.");
        }

        const opts = options || {};

        // 1. Valid JSON check
        try {
            const parsed = JSON.parse(rawText);
            return {
                recovered: false,
                data: parsed,
                strategy: "none",
                message: "JSON is already valid."
            };
        } catch (parseError) {
            const diagnostic = this.diagnoseCorruptJson(rawText, parseError);

            // 2. Check backup if provided
            if (opts.backupText && typeof opts.backupText === "string") {
                try {
                    const backupData = JSON.parse(opts.backupText);
                    return {
                        recovered: true,
                        data: backupData,
                        strategy: "backup_slot",
                        diagnostic,
                        message: "Recovered from backup slot."
                    };
                } catch (_) {}
            }

            // 3. Strategy: Trailing comma removal
            const trailingCleaned = rawText.replace(/,(\s*[}\]])/g, "$1");
            if (trailingCleaned !== rawText) {
                try {
                    const data = JSON.parse(trailingCleaned);
                    return {
                        recovered: true,
                        data,
                        strategy: "trailing_comma_cleanup",
                        diagnostic,
                        message: "Recovered by removing trailing commas."
                    };
                } catch (_) {}
            }

            // 4. Strategy: Single quotes conversion
            const quoteNormalized = rawText
                .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
                .replace(/,(\s*[}\]])/g, "$1");
            if (quoteNormalized !== rawText) {
                try {
                    const data = JSON.parse(quoteNormalized);
                    return {
                        recovered: true,
                        data,
                        strategy: "quote_normalization",
                        diagnostic,
                        message: "Recovered by converting single quotes to double quotes."
                    };
                } catch (_) {}
            }

            // 5. Strategy: Truncated JSON repair
            const repaired = this.#repairTruncatedJson(rawText);
            if (repaired !== null) {
                try {
                    const data = JSON.parse(repaired);
                    return {
                        recovered: true,
                        data,
                        strategy: "truncated_json_repair",
                        diagnostic,
                        message: "Recovered truncated JSON by safely closing open structures."
                    };
                } catch (_) {}
            }

            // Unrecoverable
            if (opts.throwOnError !== false) {
                throw new CorruptSaveError(diagnostic.message, diagnostic);
            }

            return {
                recovered: false,
                data: null,
                strategy: "failed",
                diagnostic,
                message: "Could not recover corrupt JSON."
            };
        }
    }

    /**
     * Migrate a save record through sequential registered schema migrations.
     * Enforces step verification and atomic abort on errors.
     *
     * @param {Object} record
     * @param {number} [targetVersion]
     * @returns {Object}
     */
    migrate(record, targetVersion) {
        if (!record || typeof record !== "object") {
            throw new TypeError("Save record must be an object.");
        }

        const destVersion = Number.isInteger(targetVersion) ? targetVersion : this.currentVersion;
        const sourceVersion = record.schemaVersion !== undefined
            ? record.schemaVersion
            : (record.version !== undefined ? record.version : null);

        if (sourceVersion === null || sourceVersion === undefined) {
            throw new Error("Save record is missing schemaVersion.");
        }
        if (!Number.isInteger(sourceVersion)) {
            throw new TypeError(`Invalid schemaVersion: expected integer, got ${sourceVersion}.`);
        }

        // Future version detection
        if (sourceVersion > destVersion) {
            throw new FutureVersionError(sourceVersion, destVersion);
        }

        // Already at target version
        if (sourceVersion === destVersion) {
            return structuredClone(record);
        }

        const plan = this.migrationRegistry.getPlan(sourceVersion, destVersion);

        // Atomic: clone input so original record is never mutated if migration fails
        let currentRecord = structuredClone(record);

        for (let i = 0; i < plan.length; i++) {
            const step = plan[i];
            const snapshotBeforeStep = structuredClone(currentRecord);

            let migrated;
            try {
                migrated = step.migrate(snapshotBeforeStep, {
                    fromVersion: step.fromVersion,
                    toVersion: step.toVersion
                });
            } catch (err) {
                throw new MigrationError(
                    `Migration failed at step v${step.fromVersion} -> v${step.toVersion}: ${err.message}`,
                    {
                        fromVersion: step.fromVersion,
                        toVersion: step.toVersion,
                        step: i + 1,
                        cause: err
                    }
                );
            }

            // Step verification
            if (!migrated || typeof migrated !== "object") {
                throw new MigrationError(
                    `Step verification failed at step v${step.fromVersion} -> v${step.toVersion}: migration returned non-object.`,
                    { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1 }
                );
            }

            const stepResultVersion = migrated.schemaVersion !== undefined
                ? migrated.schemaVersion
                : (migrated.version !== undefined ? migrated.version : null);

            if (stepResultVersion !== step.toVersion) {
                throw new MigrationError(
                    `Step verification failed at step v${step.fromVersion} -> v${step.toVersion}: expected schemaVersion ${step.toVersion}, got ${stepResultVersion}.`,
                    { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1 }
                );
            }

            if (typeof step.verify === "function") {
                let verified = false;
                try {
                    verified = step.verify(migrated);
                } catch (verifyErr) {
                    throw new MigrationError(
                        `Step verification threw an error at step v${step.fromVersion} -> v${step.toVersion}: ${verifyErr.message}`,
                        { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1, cause: verifyErr }
                    );
                }
                if (verified === false) {
                    throw new MigrationError(
                        `Step verification failed custom check at step v${step.fromVersion} -> v${step.toVersion}.`,
                        { fromVersion: step.fromVersion, toVersion: step.toVersion, step: i + 1 }
                    );
                }
            }

            currentRecord = migrated;
        }

        return currentRecord;
    }

    /**
     * Validate references on entities and components.
     * @param {Object} data
     * @param {Object} [options]
     * @returns {Object}
     */
    validate(data, options) {
        return this.validator.validate(data, options);
    }

    /**
     * Save data into a named storage slot with backup and reference validation.
     * @param {string} slot
     * @param {Object} data
     * @param {Object} [options]
     * @returns {Object}
     */
    save(slot, data, options) {
        const opts = options || {};
        if (typeof slot !== "string" || !slot.trim()) {
            throw new TypeError("Save slot must be a non-empty string.");
        }
        if (!data || typeof data !== "object") {
            throw new TypeError("Game state to save must be an object.");
        }

        const shouldValidate = opts.validateReferences !== undefined
            ? opts.validateReferences
            : this.validateReferences;

        if (shouldValidate) {
            this.validator.validate(data, { throwOnError: true });
        }

        const clonedData = structuredClone(data);
        const record = Array.isArray(clonedData)
            ? {
                schemaVersion: this.currentVersion,
                savedAt: Date.now(),
                entities: clonedData
            }
            : {
                schemaVersion: this.currentVersion,
                savedAt: Date.now(),
                ...clonedData
            };

        let text;
        try {
            text = JSON.stringify(record, null, opts.pretty ? 2 : 0);
        } catch (err) {
            throw new Error(`Failed to serialize save data: ${err.message}`);
        }

        const key = this.key(slot);
        if (this.storage) {
            const existing = this.storage.getItem(key);
            if (existing !== null) {
                this.storage.setItem(`${key}.bak`, existing);
            }
            this.storage.setItem(key, text);
        }

        return record;
    }

    /**
     * Load, migrate, and validate save data from a slot or raw JSON text.
     * @param {string|Object} slotOrRaw
     * @param {Object} [options]
     * @returns {Object|null}
     */
    load(slotOrRaw, options) {
        const opts = options || {};
        const shouldValidate = opts.validateReferences !== undefined
            ? opts.validateReferences
            : this.validateReferences;
        const autoRecover = opts.autoRecoverCorrupt !== undefined
            ? opts.autoRecoverCorrupt
            : this.autoRecoverCorrupt;

        let rawText = null;
        let slotKey = null;
        let parsedRecord = null;

        if (typeof slotOrRaw === "string") {
            const trimmed = slotOrRaw.trim();
            if (opts.raw === true || trimmed.startsWith("{") || trimmed.startsWith("[")) {
                rawText = slotOrRaw;
            } else {
                slotKey = this.key(slotOrRaw);
                const stored = this.storage ? this.storage.getItem(slotKey) : null;
                if (stored !== null) {
                    rawText = stored;
                } else if (/[\s{}[\]"':]/.test(trimmed)) {
                    // Not in storage and contains spaces or syntax chars: treat as raw text
                    rawText = slotOrRaw;
                } else {
                    if (opts.required) {
                        throw new Error(`Save slot '${slotOrRaw}' does not exist.`);
                    }
                    return null;
                }
            }
        } else if (slotOrRaw && typeof slotOrRaw === "object") {
            parsedRecord = slotOrRaw;
        } else {
            throw new TypeError("load() expects a slot name string, raw JSON string, or object.");
        }

        if (rawText !== null) {
            let backupText = null;
            if (slotKey && this.storage) {
                backupText = this.storage.getItem(`${slotKey}.bak`);
            }

            if (autoRecover) {
                const recovery = this.recoverCorruptJson(rawText, {
                    backupText,
                    throwOnError: true
                });
                parsedRecord = recovery.data;
            } else {
                try {
                    parsedRecord = JSON.parse(rawText);
                } catch (err) {
                    const diag = this.diagnoseCorruptJson(rawText, err);
                    throw new CorruptSaveError(diag.message, diag);
                }
            }
        }

        if (!parsedRecord || typeof parsedRecord !== "object") {
            throw new CorruptSaveError("Save data is empty or not a valid object.");
        }

        const targetVersion = Number.isInteger(opts.targetVersion)
            ? opts.targetVersion
            : this.currentVersion;

        // Run sequential migrations with step verification and atomic abort
        const migratedRecord = this.migrate(parsedRecord, targetVersion);

        // Validate references on migrated state
        if (shouldValidate) {
            this.validator.validate(migratedRecord, { throwOnError: true });
        }

        if (opts.returnRecord || opts.returnEnvelope) {
            return migratedRecord;
        }

        return migratedRecord;
    }

    /**
     * List all save slots currently present in storage.
     * @returns {string[]}
     */
    slots() {
        if (!this.storage) return [];
        const keys = typeof this.storage.keys === "function"
            ? this.storage.keys()
            : Array.from({ length: this.storage.length || 0 }, (_, i) => this.storage.key(i));
        const prefixDot = `${this.prefix}.`;
        return keys
            .filter(k => k && k.startsWith(prefixDot) && !k.endsWith(".bak"))
            .map(k => decodeURIComponent(k.slice(prefixDot.length)));
    }

    /**
     * Remove a save slot and its backup from storage.
     * @param {string} slot
     */
    remove(slot) {
        if (!this.storage) return;
        const key = this.key(slot);
        this.storage.removeItem(key);
        this.storage.removeItem(`${key}.bak`);
    }

    /**
     * Check if a save slot exists in storage.
     * @param {string} slot
     * @returns {boolean}
     */
    has(slot) {
        if (!this.storage) return false;
        return this.storage.getItem(this.key(slot)) !== null;
    }
}
