/**
 * @file worldFacts.js
 * CORE-03: Authoritative key-value fact store, typed prioritized event bus,
 * and ordered condition/effect rule engine.
 */

/**
 * Normalizes provenance metadata.
 * @param {string|object|null} provenance
 * @returns {{ source: string, timestamp: number }}
 */
function normalizeProvenance(provenance) {
    if (typeof provenance === 'string' && provenance.trim()) {
        return { source: provenance.trim(), timestamp: Date.now() };
    }
    if (provenance && typeof provenance === 'object') {
        const source = (typeof provenance.source === 'string' && provenance.source.trim())
            ? provenance.source.trim()
            : 'system';
        const timestamp = (typeof provenance.timestamp === 'number' && Number.isFinite(provenance.timestamp))
            ? provenance.timestamp
            : Date.now();
        return { source, timestamp };
    }
    return { source: 'system', timestamp: Date.now() };
}

/**
 * Safely traverses an object along path segments.
 * @param {object} obj
 * @param {string[]} parts
 * @returns {any}
 */
function getNested(obj, parts) {
    let curr = obj;
    for (let i = 0; i < parts.length; i++) {
        if (curr === null || typeof curr !== 'object') {
            return undefined;
        }
        const prop = parts[i];
        if (!(prop in curr)) {
            return undefined;
        }
        curr = curr[prop];
    }
    return curr;
}

/**
 * Sets a nested property on an object, creating intermediate objects as needed.
 * @param {object} obj
 * @param {string[]} parts
 * @param {any} value
 */
function setNested(obj, parts, value) {
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const prop = parts[i];
        if (!(prop in curr) || typeof curr[prop] !== 'object' || curr[prop] === null) {
            curr[prop] = {};
        }
        curr = curr[prop];
    }
    curr[parts[parts.length - 1]] = value;
}

/**
 * Matches a key against a pattern with wildcard support.
 * @param {string|null} pattern
 * @param {string} key
 * @returns {boolean}
 */
function matchesPattern(pattern, key) {
    if (!pattern || pattern === '*') return true;
    if (pattern === key) return true;
    if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return key.startsWith(prefix);
    }
    if (pattern.includes('*')) {
        const regexStr = '^' + pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$';
        return new RegExp(regexStr).test(key);
    }
    return false;
}

/**
 * Authoritative key-value fact store with dot-notated/string keys,
 * provenance tracking ({ source, timestamp }), snapshot/restore for save games,
 * and onChange listeners with unbind.
 */
export class WorldFacts {
    #facts = new Map();
    #listeners = new Set();

    /**
     * @param {Record<string, any>} [initialFacts]
     */
    constructor(initialFacts = null) {
        if (initialFacts && typeof initialFacts === 'object') {
            for (const [key, value] of Object.entries(initialFacts)) {
                this.set(key, value, { source: 'initial', timestamp: Date.now() });
            }
        }
    }

    /**
     * Number of stored authoritative facts.
     * @returns {number}
     */
    get size() {
        return this.#facts.size;
    }

    /**
     * Sets a fact with provenance tracking.
     * @param {string} key
     * @param {any} value
     * @param {string|object} [provenance]
     * @returns {this}
     */
    set(key, value, provenance = null) {
        if (typeof key !== 'string' || !key.trim()) {
            throw new TypeError('Fact key must be a non-empty string');
        }

        const prov = normalizeProvenance(provenance);
        const oldRecord = this.#facts.get(key);
        const oldValue = oldRecord ? oldRecord.value : undefined;

        const storedValue = (value !== null && typeof value === 'object')
            ? structuredClone(value)
            : value;

        this.#facts.set(key, {
            value: storedValue,
            source: prov.source,
            timestamp: prov.timestamp
        });

        this._notifyChange(key, storedValue, oldValue, prov);
        return this;
    }

    /**
     * Gets a fact value. Supports exact key, dot-notated sub-path traversal,
     * and namespace aggregation.
     * @param {string} key
     * @param {any} [defaultValue=undefined]
     * @returns {any}
     */
    get(key, defaultValue = undefined) {
        if (typeof key !== 'string') return defaultValue;

        // 1. Direct match
        if (this.#facts.has(key)) {
            const val = this.#facts.get(key).value;
            return (val !== null && typeof val === 'object') ? structuredClone(val) : val;
        }

        // 2. Dot-notated subpath lookup into a stored object fact
        if (key.includes('.')) {
            const parts = key.split('.');
            for (let i = parts.length - 1; i >= 1; i--) {
                const prefix = parts.slice(0, i).join('.');
                if (this.#facts.has(prefix)) {
                    const rootVal = this.#facts.get(prefix).value;
                    const subVal = getNested(rootVal, parts.slice(i));
                    if (subVal !== undefined) {
                        return (subVal !== null && typeof subVal === 'object')
                            ? structuredClone(subVal)
                            : subVal;
                    }
                }
            }
        }

        // 3. Namespace aggregation: if keys like `${key}.*` exist, assemble a composite object
        const prefix = key + '.';
        let matched = false;
        const composite = {};
        for (const [k, rec] of this.#facts.entries()) {
            if (k.startsWith(prefix)) {
                matched = true;
                const subParts = k.slice(prefix.length).split('.');
                const val = (rec.value !== null && typeof rec.value === 'object')
                    ? structuredClone(rec.value)
                    : rec.value;
                setNested(composite, subParts, val);
            }
        }
        if (matched) {
            return composite;
        }

        return defaultValue;
    }

    /**
     * Checks whether a fact exists (exact key, nested property, or namespace).
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        if (typeof key !== 'string') return false;
        if (this.#facts.has(key)) return true;
        return this.get(key) !== undefined;
    }

    /**
     * Returns full fact record including value and provenance metadata.
     * @param {string} key
     * @returns {{ value: any, source: string, timestamp: number }|null}
     */
    getFact(key) {
        if (typeof key !== 'string') return null;

        if (this.#facts.has(key)) {
            const rec = this.#facts.get(key);
            return {
                value: (rec.value !== null && typeof rec.value === 'object') ? structuredClone(rec.value) : rec.value,
                source: rec.source,
                timestamp: rec.timestamp
            };
        }

        if (key.includes('.')) {
            const parts = key.split('.');
            for (let i = parts.length - 1; i >= 1; i--) {
                const prefix = parts.slice(0, i).join('.');
                if (this.#facts.has(prefix)) {
                    const rootRec = this.#facts.get(prefix);
                    const subVal = getNested(rootRec.value, parts.slice(i));
                    if (subVal !== undefined) {
                        return {
                            value: (subVal !== null && typeof subVal === 'object') ? structuredClone(subVal) : subVal,
                            source: rootRec.source,
                            timestamp: rootRec.timestamp
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Returns provenance metadata for a fact.
     * @param {string} key
     * @returns {{ source: string, timestamp: number }|null}
     */
    getProvenance(key) {
        const fact = this.getFact(key);
        return fact ? { source: fact.source, timestamp: fact.timestamp } : null;
    }

    /**
     * Deletes a fact and notifies listeners.
     * @param {string} key
     * @param {string|object} [provenance]
     * @returns {boolean}
     */
    delete(key, provenance = null) {
        if (typeof key !== 'string' || !this.#facts.has(key)) return false;
        const oldRec = this.#facts.get(key);
        const prov = normalizeProvenance(provenance);
        this.#facts.delete(key);
        this._notifyChange(key, undefined, oldRec.value, prov);
        return true;
    }

    /**
     * Clears all facts.
     */
    clear() {
        this.#facts.clear();
    }

    /**
     * Returns an array of stored fact keys.
     * @returns {string[]}
     */
    keys() {
        return Array.from(this.#facts.keys());
    }

    /**
     * Returns an array of `[key, value]` entries.
     * @returns {Array<Array>}
     */
    entries() {
        return Array.from(this.#facts.entries()).map(([k, rec]) => [
            k,
            (rec.value !== null && typeof rec.value === 'object') ? structuredClone(rec.value) : rec.value
        ]);
    }

    /**
     * Returns a plain object representation of all stored facts.
     * @returns {Record<string, any>}
     */
    toObject() {
        const obj = {};
        for (const [k, rec] of this.#facts.entries()) {
            obj[k] = (rec.value !== null && typeof rec.value === 'object') ? structuredClone(rec.value) : rec.value;
        }
        return obj;
    }

    /**
     * Returns all authoritative records with provenance.
     * @returns {Record<string, { value: any, source: string, timestamp: number }>}
     */
    allFacts() {
        const result = {};
        for (const [k, rec] of this.#facts.entries()) {
            result[k] = {
                value: (rec.value !== null && typeof rec.value === 'object') ? structuredClone(rec.value) : rec.value,
                source: rec.source,
                timestamp: rec.timestamp
            };
        }
        return result;
    }

    /**
     * Registers a change listener with pattern filtering and clean unbind.
     * - `onChange(callback)`: global listener (key, newValue, oldValue, provenance)
     * - `onChange(pattern, callback)`: filtered listener (newValue, oldValue, provenance, key)
     * @param {string|Function} patternOrCallback
     * @param {Function} [maybeCallback]
     * @returns {Function} Unbind function
     */
    onChange(patternOrCallback, maybeCallback) {
        let pattern = null;
        let callback = null;

        if (typeof patternOrCallback === 'function') {
            callback = patternOrCallback;
        } else if (typeof patternOrCallback === 'string' && typeof maybeCallback === 'function') {
            pattern = patternOrCallback;
            callback = maybeCallback;
        } else {
            throw new TypeError('Invalid arguments for onChange: expected (callback) or (pattern, callback)');
        }

        const listenerRecord = {
            pattern,
            callback,
            isRemoved: false
        };

        this.#listeners.add(listenerRecord);

        const unbind = () => {
            if (listenerRecord.isRemoved) return;
            listenerRecord.isRemoved = true;
            this.#listeners.delete(listenerRecord);
        };

        listenerRecord.unbind = unbind;
        return unbind;
    }

    /**
     * Explicit unbind for a listener or unbind function.
     * @param {Function} unbindOrCallback
     */
    offChange(unbindOrCallback) {
        if (typeof unbindOrCallback !== 'function') return false;
        for (const record of this.#listeners) {
            if (record.unbind === unbindOrCallback || record.callback === unbindOrCallback) {
                record.unbind();
                return true;
            }
        }
        return false;
    }

    /**
     * Internal change notification.
     * @private
     */
    _notifyChange(key, newValue, oldValue, provenance) {
        if (this.#listeners.size === 0) return;
        const snapshot = Array.from(this.#listeners);
        for (const listener of snapshot) {
            if (listener.isRemoved) continue;
            if (!listener.pattern) {
                // Global listener: (key, newValue, oldValue, provenance)
                listener.callback(key, newValue, oldValue, provenance);
            } else if (matchesPattern(listener.pattern, key)) {
                // Pattern listener: (newValue, oldValue, provenance, key)
                listener.callback(newValue, oldValue, provenance, key);
            }
        }
    }

    /**
     * Creates a deep-cloned, serializable snapshot for save games.
     * @returns {{ version: number, timestamp: number, facts: Record<string, { value: any, source: string, timestamp: number }> }}
     */
    snapshot() {
        const factsObj = {};
        for (const [key, record] of this.#facts.entries()) {
            factsObj[key] = {
                value: (record.value !== null && typeof record.value === 'object')
                    ? structuredClone(record.value)
                    : record.value,
                source: record.source,
                timestamp: record.timestamp
            };
        }
        return {
            version: 1,
            timestamp: Date.now(),
            facts: factsObj
        };
    }

    /**
     * Restores state from a snapshot.
     * @param {object} snapshot
     * @param {object} [options]
     * @returns {this}
     */
    restore(snapshot, { clearExisting = true, notify = false } = {}) {
        if (!snapshot || typeof snapshot !== 'object') {
            throw new TypeError('Snapshot must be an object');
        }

        if (clearExisting) {
            this.#facts.clear();
        }

        const rawFacts = (snapshot.facts && typeof snapshot.facts === 'object' && !Array.isArray(snapshot.facts))
            ? snapshot.facts
            : snapshot;

        for (const [key, entry] of Object.entries(rawFacts)) {
            if (snapshot.facts && (key === 'version' || key === 'timestamp')) {
                continue;
            }

            let value;
            let provenance;

            if (entry && typeof entry === 'object' && 'value' in entry && 'source' in entry) {
                value = (entry.value !== null && typeof entry.value === 'object')
                    ? structuredClone(entry.value)
                    : entry.value;
                provenance = {
                    source: entry.source,
                    timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now()
                };
            } else {
                value = (entry !== null && typeof entry === 'object')
                    ? structuredClone(entry)
                    : entry;
                provenance = { source: 'restore', timestamp: Date.now() };
            }

            this.#facts.set(key, {
                value,
                source: provenance.source,
                timestamp: provenance.timestamp
            });

            if (notify) {
                this._notifyChange(key, value, undefined, provenance);
            }
        }

        return this;
    }
}

/**
 * Prioritized event dispatcher handling self-removing listeners,
 * bounded recursive events, duplicate guards, once-only subscriptions,
 * and clean unbind.
 */
export class TypedEventBus {
    #listeners = new Map(); // eventType -> Array<ListenerRecord>
    #depth = 0;
    #eventDepths = new Map();
    #orderSeq = 0;

    /**
     * @param {object} [options]
     */
    constructor({ maxRecursionDepth = 32, guardDuplicates = true } = {}) {
        this.maxRecursionDepth = maxRecursionDepth;
        this.guardDuplicates = guardDuplicates;
    }

    /**
     * Subscribes a prioritized listener to an event type.
     * @param {string|symbol} eventType
     * @param {Function} listener
     * @param {number|object} [options]
     * @returns {Function} Idempotent unbind function
     */
    on(eventType, listener, options = {}) {
        if (typeof eventType !== 'string' && typeof eventType !== 'symbol') {
            throw new TypeError('Event type must be a string or symbol');
        }
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }

        const opts = typeof options === 'number' ? { priority: options } : (options || {});
        const priority = Number.isFinite(opts.priority) ? Number(opts.priority) : 0;
        const once = Boolean(opts.once);
        const id = opts.id || null;
        const shouldGuardDuplicates = opts.guardDuplicates !== undefined
            ? Boolean(opts.guardDuplicates)
            : this.guardDuplicates;

        if (!this.#listeners.has(eventType)) {
            this.#listeners.set(eventType, []);
        }

        const list = this.#listeners.get(eventType);

        if (shouldGuardDuplicates) {
            const existing = list.find(r => !r.isRemoved && (r.fn === listener || (id !== null && r.id === id)));
            if (existing) {
                return existing.unbind;
            }
        }

        let record;
        const unbind = () => {
            if (record.isRemoved) return;
            record.isRemoved = true;
            const currentList = this.#listeners.get(eventType);
            if (currentList) {
                const idx = currentList.indexOf(record);
                if (idx !== -1) {
                    currentList.splice(idx, 1);
                }
                if (currentList.length === 0) {
                    this.#listeners.delete(eventType);
                }
            }
        };

        record = {
            fn: listener,
            priority,
            once,
            id,
            isRemoved: false,
            order: ++this.#orderSeq,
            unbind
        };

        list.push(record);
        list.sort((a, b) => b.priority - a.priority || a.order - b.order);

        return unbind;
    }

    /**
     * Subscribes a listener that runs at most once.
     * @param {string|symbol} eventType
     * @param {Function} listener
     * @param {number|object} [options]
     * @returns {Function}
     */
    once(eventType, listener, options = {}) {
        const opts = typeof options === 'number' ? { priority: options } : { ...(options || {}) };
        opts.once = true;
        return this.on(eventType, listener, opts);
    }

    /**
     * Unsubscribes a listener by function reference or registration ID.
     * @param {string|symbol} eventType
     * @param {Function|string} listenerOrId
     * @returns {boolean}
     */
    off(eventType, listenerOrId) {
        const list = this.#listeners.get(eventType);
        if (!list || list.length === 0) return false;

        let removed = false;
        for (let i = list.length - 1; i >= 0; i--) {
            const r = list[i];
            if (r.fn === listenerOrId || (typeof listenerOrId === 'string' && r.id === listenerOrId)) {
                r.unbind();
                removed = true;
            }
        }
        return removed;
    }

    /**
     * Emits an event with prioritized dispatch, recursion bounding,
     * self-removal safety, and stopPropagation support.
     * @param {string|symbol} eventType
     * @param {any} [data={}]
     * @returns {{ stopped: boolean, count: number, defaultPrevented: boolean }}
     */
    emit(eventType, data = {}) {
        const currentEvent = this.#eventDepths.get(eventType) || 0;

        if (currentEvent >= this.maxRecursionDepth) {
            throw new RangeError(
                `Event recursion depth exceeded maximum limit of ${this.maxRecursionDepth} for event "${String(eventType)}"`
            );
        }

        this.#depth++;
        this.#eventDepths.set(eventType, currentEvent + 1);

        try {
            const list = this.#listeners.get(eventType);
            if (!list || list.length === 0) {
                return { stopped: false, count: 0, defaultPrevented: false };
            }

            // Snapshot listeners array for safe traversal with self-removing listeners
            const snapshot = list.slice();

            let stopped = false;
            let prevented = false;

            const originalStopPropagation = (data && typeof data === 'object' && typeof data.stopPropagation === 'function')
                ? data.stopPropagation.bind(data)
                : null;
            const originalPreventDefault = (data && typeof data === 'object' && typeof data.preventDefault === 'function')
                ? data.preventDefault.bind(data)
                : null;

            const stopPropagation = () => {
                stopped = true;
                if (originalStopPropagation) {
                    originalStopPropagation();
                }
            };

            const preventDefault = () => {
                prevented = true;
                if (originalPreventDefault) {
                    originalPreventDefault();
                }
            };

            const eventContext = {
                type: eventType,
                data,
                stopPropagation,
                preventDefault,
                get isPropagationStopped() {
                    return stopped || Boolean(data?.isPropagationStopped?.());
                },
                get defaultPrevented() {
                    return prevented || Boolean(data?.defaultPrevented);
                }
            };

            if (data && typeof data === 'object') {
                if (typeof data.stopPropagation !== 'function') {
                    try {
                        Object.defineProperty(data, 'stopPropagation', {
                            value: stopPropagation,
                            writable: true,
                            configurable: true
                        });
                    } catch (_) {}
                }
                if (typeof data.isPropagationStopped !== 'function') {
                    try {
                        Object.defineProperty(data, 'isPropagationStopped', {
                            value: () => stopped,
                            writable: true,
                            configurable: true
                        });
                    } catch (_) {}
                }
            }

            let invokedCount = 0;

            for (let i = 0; i < snapshot.length; i++) {
                const record = snapshot[i];

                if (record.isRemoved) {
                    continue;
                }

                if (stopped || data?.isPropagationStopped?.()) {
                    break;
                }

                if (record.once) {
                    record.unbind();
                }

                invokedCount++;

                const result = record.fn(data, eventContext);

                if (result && typeof result === 'object' && result.stopPropagation) {
                    stopPropagation();
                }
            }

            return {
                stopped: stopped || Boolean(data?.isPropagationStopped?.()),
                count: invokedCount,
                defaultPrevented: prevented
            };
        } finally {
            this.#depth--;
            const count = (this.#eventDepths.get(eventType) || 1) - 1;
            if (count <= 0) {
                this.#eventDepths.delete(eventType);
            } else {
                this.#eventDepths.set(eventType, count);
            }
        }
    }

    /**
     * Returns the count of active listeners for an event type (or all events).
     * @param {string|symbol} [eventType]
     * @returns {number}
     */
    listenerCount(eventType) {
        if (eventType !== undefined) {
            const list = this.#listeners.get(eventType);
            return list ? list.filter(r => !r.isRemoved).length : 0;
        }
        let total = 0;
        for (const list of this.#listeners.values()) {
            total += list.filter(r => !r.isRemoved).length;
        }
        return total;
    }

    /**
     * Checks if there are any active listeners for an event type.
     * @param {string|symbol} eventType
     * @returns {boolean}
     */
    hasListeners(eventType) {
        return this.listenerCount(eventType) > 0;
    }

    /**
     * Clears listeners for a given event type or all listeners if omitted.
     * @param {string|symbol} [eventType]
     */
    clear(eventType) {
        if (eventType !== undefined) {
            const list = this.#listeners.get(eventType);
            if (list) {
                for (const r of list) {
                    r.isRemoved = true;
                }
                this.#listeners.delete(eventType);
            }
        } else {
            for (const list of this.#listeners.values()) {
                for (const r of list) {
                    r.isRemoved = true;
                }
            }
            this.#listeners.clear();
        }
    }
}

/**
 * Ordered condition/effect rule evaluator connecting WorldFacts and TypedEventBus
 * with priority order, condition checks, action execution, stopPropagation support,
 * and decision trace logging.
 */
export class RuleEngine {
    #rules = new Map();
    #eventSubscriptions = new Map();
    #traces = [];
    #traceSeq = 0;
    #ruleSeq = 0;

    /**
     * @param {WorldFacts|object} [optionsOrFacts]
     * @param {TypedEventBus} [maybeBus]
     * @param {object} [maybeOptions]
     */
    constructor(optionsOrFacts = {}, maybeBus = null, maybeOptions = {}) {
        let facts;
        let bus;
        let options;

        if (optionsOrFacts instanceof WorldFacts) {
            facts = optionsOrFacts;
            bus = maybeBus instanceof TypedEventBus ? maybeBus : new TypedEventBus();
            options = maybeOptions || {};
        } else if (optionsOrFacts && typeof optionsOrFacts === 'object') {
            facts = optionsOrFacts.facts instanceof WorldFacts ? optionsOrFacts.facts : new WorldFacts();
            bus = optionsOrFacts.bus instanceof TypedEventBus ? optionsOrFacts.bus : new TypedEventBus();
            options = optionsOrFacts;
        } else {
            facts = new WorldFacts();
            bus = new TypedEventBus();
            options = {};
        }

        this.facts = facts;
        this.bus = bus;
        this.maxTraces = typeof options.maxTraces === 'number' ? options.maxTraces : 1000;
        this.enableTracing = options.enableTracing !== false;
    }

    /**
     * Total number of registered rules.
     * @returns {number}
     */
    get ruleCount() {
        return this.#rules.size;
    }

    /**
     * Adds an ordered condition/effect rule.
     * @param {object} ruleDef
     * @param {string} [ruleDef.id] Unique rule identifier
     * @param {string} [ruleDef.name] Human readable name
     * @param {number} [ruleDef.priority=0] Higher executes first
     * @param {string|string[]} [ruleDef.event] Event(s) to bind on TypedEventBus
     * @param {Function|boolean} [ruleDef.condition] Condition check
     * @param {Function} [ruleDef.action] Action effect
     * @param {boolean} [ruleDef.stopPropagation=false] If true, halts further rules/listeners on execution
     * @param {boolean} [ruleDef.enabled=true]
     * @returns {Function} Unbind function
     */
    addRule(ruleDef) {
        if (!ruleDef || typeof ruleDef !== 'object') {
            throw new TypeError('Rule definition must be an object');
        }

        const id = (typeof ruleDef.id === 'string' && ruleDef.id.trim())
            ? ruleDef.id.trim()
            : `rule_${++this.#ruleSeq}`;

        if (this.#rules.has(id)) {
            this.removeRule(id);
        }

        const priority = Number.isFinite(ruleDef.priority) ? Number(ruleDef.priority) : 0;
        const condition = typeof ruleDef.condition === 'function'
            ? ruleDef.condition
            : (typeof ruleDef.when === 'function'
                ? ruleDef.when
                : (ruleDef.condition !== undefined ? () => Boolean(ruleDef.condition) : () => true));

        const action = typeof ruleDef.action === 'function'
            ? ruleDef.action
            : (typeof ruleDef.effect === 'function'
                ? ruleDef.effect
                : (typeof ruleDef.then === 'function' ? ruleDef.then : null));

        const ruleRecord = {
            id,
            name: ruleDef.name || ruleDef.description || id,
            priority,
            event: ruleDef.event || ruleDef.on || null,
            condition,
            action,
            stopPropagation: Boolean(ruleDef.stopPropagation),
            enabled: ruleDef.enabled !== false,
            order: ++this.#ruleSeq
        };

        this.#rules.set(id, ruleRecord);

        // Bind event listeners if event(s) specified
        const unbindSubscriptions = [];
        if (ruleRecord.event) {
            const events = Array.isArray(ruleRecord.event) ? ruleRecord.event : [ruleRecord.event];
            for (const evt of events) {
                if (typeof evt === 'string' && evt.trim()) {
                    const unbindBus = this.bus.on(evt, (data, eventContext) => {
                        if (!ruleRecord.enabled) return;

                        let stopped = false;
                        const stop = () => {
                            stopped = true;
                            eventContext.stopPropagation();
                        };

                        const executionContext = {
                            facts: this.facts,
                            bus: this.bus,
                            event: data,
                            data,
                            eventType: evt,
                            rule: ruleRecord,
                            stopPropagation: stop,
                            trace: (details) => this._logTrace({
                                ruleId: id,
                                priority,
                                eventType: evt,
                                conditionMatched: true,
                                actionExecuted: true,
                                stoppedPropagation: stopped,
                                details
                            })
                        };

                        let matched = false;
                        let executed = false;
                        let error = null;

                        try {
                            matched = Boolean(condition(executionContext));
                        } catch (err) {
                            error = err;
                            this._logTrace({
                                ruleId: id,
                                priority,
                                eventType: evt,
                                conditionMatched: false,
                                actionExecuted: false,
                                stoppedPropagation: false,
                                error
                            });
                            throw err;
                        }

                        if (matched) {
                            if (action) {
                                try {
                                    const result = action(executionContext);
                                    executed = true;
                                    if (result && typeof result === 'object' && result.stopPropagation) {
                                        stop();
                                    }
                                } catch (err) {
                                    error = err;
                                    this._logTrace({
                                        ruleId: id,
                                        priority,
                                        eventType: evt,
                                        conditionMatched: true,
                                        actionExecuted: false,
                                        stoppedPropagation: stopped || ruleRecord.stopPropagation,
                                        error
                                    });
                                    throw err;
                                }
                            } else {
                                executed = true;
                            }

                            if (ruleRecord.stopPropagation) {
                                stop();
                            }
                        }

                        this._logTrace({
                            ruleId: id,
                            priority,
                            eventType: evt,
                            conditionMatched: matched,
                            actionExecuted: executed,
                            stoppedPropagation: stopped || (matched && ruleRecord.stopPropagation),
                            error: null
                        });
                    }, { priority, id: `rule:${id}:${evt}` });

                    unbindSubscriptions.push(unbindBus);
                }
            }
        }

        this.#eventSubscriptions.set(id, unbindSubscriptions);

        const unbind = () => {
            this.removeRule(id);
        };

        ruleRecord.unbind = unbind;
        return unbind;
    }

    /**
     * Removes a rule and cleans up all its event bus subscriptions.
     * @param {string} ruleId
     * @returns {boolean}
     */
    removeRule(ruleId) {
        const rule = this.#rules.get(ruleId);
        if (!rule) return false;

        const subs = this.#eventSubscriptions.get(ruleId);
        if (subs) {
            for (const unbind of subs) {
                try { unbind(); } catch (_) {}
            }
            this.#eventSubscriptions.delete(ruleId);
        }

        this.#rules.delete(ruleId);
        return true;
    }

    /**
     * Returns a rule definition by ID.
     * @param {string} ruleId
     * @returns {object|null}
     */
    getRule(ruleId) {
        return this.#rules.get(ruleId) || null;
    }

    /**
     * Checks if a rule is registered.
     * @param {string} ruleId
     * @returns {boolean}
     */
    hasRule(ruleId) {
        return this.#rules.has(ruleId);
    }

    /**
     * Enables a rule.
     * @param {string} ruleId
     */
    enableRule(ruleId) {
        const rule = this.#rules.get(ruleId);
        if (rule) rule.enabled = true;
    }

    /**
     * Disables a rule.
     * @param {string} ruleId
     */
    disableRule(ruleId) {
        const rule = this.#rules.get(ruleId);
        if (rule) rule.enabled = false;
    }

    /**
     * Evaluates matching rules in priority order against facts and event data.
     * @param {string|null} [eventType=null]
     * @param {any} [eventData={}]
     * @param {object} [options]
     * @returns {{ matchedCount: number, executedCount: number, stoppedPropagation: boolean }}
     */
    evaluate(eventType = null, eventData = {}, options = {}) {
        const matching = [];
        for (const rule of this.#rules.values()) {
            if (!rule.enabled) continue;
            if (eventType !== null && rule.event !== null) {
                const events = Array.isArray(rule.event) ? rule.event : [rule.event];
                if (!events.includes(eventType)) continue;
            }
            matching.push(rule);
        }

        matching.sort((a, b) => b.priority - a.priority || a.order - b.order);

        let stopped = false;
        let matchedCount = 0;
        let executedCount = 0;

        const stop = () => {
            stopped = true;
        };

        for (const rule of matching) {
            if (stopped) break;

            const executionContext = {
                facts: this.facts,
                bus: this.bus,
                event: eventData,
                data: eventData,
                eventType,
                rule,
                stopPropagation: stop,
                trace: (details) => this._logTrace({
                    ruleId: rule.id,
                    priority: rule.priority,
                    eventType,
                    conditionMatched: true,
                    actionExecuted: true,
                    stoppedPropagation: stopped,
                    details
                })
            };

            let matched = false;
            let executed = false;
            let error = null;

            try {
                matched = Boolean(rule.condition(executionContext));
            } catch (err) {
                error = err;
                this._logTrace({
                    ruleId: rule.id,
                    priority: rule.priority,
                    eventType,
                    conditionMatched: false,
                    actionExecuted: false,
                    stoppedPropagation: false,
                    error
                });
                if (options.rethrow !== false) throw err;
                continue;
            }

            if (matched) {
                matchedCount++;
                if (rule.action) {
                    try {
                        const result = rule.action(executionContext);
                        executed = true;
                        executedCount++;
                        if (result && typeof result === 'object' && result.stopPropagation) {
                            stop();
                        }
                    } catch (err) {
                        error = err;
                        this._logTrace({
                            ruleId: rule.id,
                            priority: rule.priority,
                            eventType,
                            conditionMatched: true,
                            actionExecuted: false,
                            stoppedPropagation: stopped || rule.stopPropagation,
                            error
                        });
                        if (options.rethrow !== false) throw err;
                        continue;
                    }
                } else {
                    executed = true;
                    executedCount++;
                }

                if (rule.stopPropagation) {
                    stop();
                }
            }

            this._logTrace({
                ruleId: rule.id,
                priority: rule.priority,
                eventType,
                conditionMatched: matched,
                actionExecuted: executed,
                stoppedPropagation: stopped || (matched && rule.stopPropagation),
                error: null
            });
        }

        return {
            matchedCount,
            executedCount,
            stoppedPropagation: stopped
        };
    }

    /**
     * Internal decision trace logger.
     * @private
     */
    _logTrace(entry) {
        if (!this.enableTracing) return null;
        const trace = {
            id: ++this.#traceSeq,
            timestamp: Date.now(),
            ruleId: entry.ruleId,
            priority: entry.priority,
            eventType: entry.eventType || null,
            conditionMatched: Boolean(entry.conditionMatched),
            actionExecuted: Boolean(entry.actionExecuted),
            stoppedPropagation: Boolean(entry.stoppedPropagation),
            error: entry.error || null,
            details: entry.details || null
        };

        this.#traces.push(trace);
        if (this.#traces.length > this.maxTraces) {
            this.#traces.shift();
        }
        return trace;
    }

    /**
     * Retrieves recorded decision traces with optional filtering.
     * @param {object} [filter]
     * @returns {Array<object>}
     */
    getDecisionTraces(filter = {}) {
        let list = this.#traces.slice();
        if (filter.ruleId) {
            list = list.filter(t => t.ruleId === filter.ruleId);
        }
        if (filter.eventType) {
            list = list.filter(t => t.eventType === filter.eventType);
        }
        if (filter.matched !== undefined) {
            list = list.filter(t => t.conditionMatched === filter.matched);
        }
        if (filter.executed !== undefined) {
            list = list.filter(t => t.actionExecuted === filter.executed);
        }
        if (typeof filter.limit === 'number' && filter.limit > 0) {
            list = list.slice(-filter.limit);
        }
        return list;
    }

    /**
     * Returns the most recent decision trace.
     * @returns {object|null}
     */
    getLastDecisionTrace() {
        return this.#traces.length > 0 ? { ...this.#traces[this.#traces.length - 1] } : null;
    }

    /**
     * Clears all recorded decision traces.
     */
    clearDecisionTraces() {
        this.#traces = [];
    }

    /**
     * Unbinds and clears all registered rules.
     */
    clearRules() {
        for (const ruleId of Array.from(this.#rules.keys())) {
            this.removeRule(ruleId);
        }
    }

    /**
     * Cleans up all rules and decision traces.
     */
    dispose() {
        this.clearRules();
        this.clearDecisionTraces();
    }
}
