const BRIDGE_MARKER = '__neptuneUiBridge__';

function isPlainRecord(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function clonePayload(value, seen = new WeakSet()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new TypeError('UI payload numbers must be finite');
        return value;
    }
    if (typeof value !== 'object' || seen.has(value)) throw new TypeError('UI payload must contain only acyclic JSON data');
    if (!Array.isArray(value) && !isPlainRecord(value)) throw new TypeError('UI payload must contain only plain objects and arrays');
    seen.add(value);
    const result = Array.isArray(value)
        ? value.map(item => clonePayload(item, seen))
        : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clonePayload(item, seen)]));
    seen.delete(value);
    return result;
}

/**
 * Create a typed, serializable event bridge between the game runtime and an HTML UI.
 * Events use `{ type: 'neptune:ui', version: 1, direction, name, payload }`.
 * @param {object} options
 * @param {Window} [options.window] Window-like message target (defaults to globalThis.window).
 * @param {Window} [options.parent] Parent window accepted for incoming parent messages.
 * @param {string} [options.origin] Exact allowed parent origin; defaults to current origin.
 * @param {string} [options.targetOrigin] Exact destination origin; defaults to origin.
 * @param {string[]} [options.actions] Allowed UI-to-engine action names.
 * @returns {{subscribe: Function, emit: Function, onAction: Function, destroy: Function}}
 */
export function createUIBridge({ window: target = globalThis.window, parent = target?.parent, origin = target?.location?.origin, targetOrigin = origin, actions = [] } = {}) {
    if (!target || typeof target.addEventListener !== 'function' || typeof target.postMessage !== 'function') {
        throw new TypeError('UI bridge requires a window-like message target');
    }
    if (typeof origin !== 'string' || !origin || origin === 'null' || typeof targetOrigin !== 'string' || !targetOrigin || targetOrigin === '*') {
        throw new TypeError('UI bridge requires explicit non-opaque origin and targetOrigin values');
    }
    const allowedActions = new Set(actions);
    const subscriptions = new Map();
    let destroyed = false;
    const listener = event => {
        if (destroyed || event.source !== parent || event.origin !== origin) return;
        const message = event.data;
        if (!isPlainRecord(message) || message[BRIDGE_MARKER] !== true || message.version !== 1 || message.direction !== 'ui-to-engine' || typeof message.name !== 'string' || !allowedActions.has(message.name)) return;
        try {
            const payload = clonePayload(message.payload);
            for (const callback of subscriptions.get(message.name) || []) callback(payload);
            for (const callback of subscriptions.get('*') || []) callback(message.name, payload);
        } catch { /* Ignore malformed messages and errors from hostile payloads. */ }
    };
    target.addEventListener('message', listener);
    return {
        subscribe(name, callback) {
            if (destroyed) throw new Error('UI bridge has been destroyed');
            if (typeof name !== 'string' || !name || typeof callback !== 'function') throw new TypeError('subscribe requires an event name and callback');
            const set = subscriptions.get(name) || new Set();
            set.add(callback);
            subscriptions.set(name, set);
            return () => { set.delete(callback); if (set.size === 0) subscriptions.delete(name); };
        },
        onAction(name, callback) {
            if (!allowedActions.has(name)) throw new TypeError(`UI action is not allowed: ${name}`);
            return this.subscribe(name, callback);
        },
        emit(name, payload = null) {
            if (destroyed) throw new Error('UI bridge has been destroyed');
            if (typeof name !== 'string' || !name) throw new TypeError('UI event name must be a non-empty string');
            const data = clonePayload(payload);
            parent.postMessage({ [BRIDGE_MARKER]: true, version: 1, direction: 'engine-to-ui', name, payload: data }, targetOrigin);
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            target.removeEventListener('message', listener);
            subscriptions.clear();
        }
    };
}

/** Build the browser-side HTML UI client, exposing only explicitly allowed actions. */
export function createHTMLUIClient({ window: target = globalThis.window, actions = [], events = [] } = {}) {
    if (!target || typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function') throw new TypeError('HTML UI client requires a window with message event support');
    const origin = target.location?.origin;
    if (typeof origin !== 'string' || !origin || origin === 'null') throw new TypeError('HTML UI client requires a non-opaque origin');
    const parentWindow = target.parent;
    if (!parentWindow || typeof parentWindow.postMessage !== 'function') throw new TypeError('HTML UI client requires a window with a parent');
    const allowedActions = new Set(actions);
    const allowedEvents = new Set(events);
    const listeners = new Map();
    let destroyed = false;
    const listener = event => {
        const message = event.data;
        if (destroyed || event.source !== target.parent || event.origin !== origin || !isPlainRecord(message) || message[BRIDGE_MARKER] !== true || message.version !== 1 || message.direction !== 'engine-to-ui' || !allowedEvents.has(message.name)) return;
        try {
            const payload = clonePayload(message.payload);
            for (const callback of listeners.get(message.name) || []) callback(payload);
            for (const callback of listeners.get('*') || []) callback(message.name, payload);
        } catch { /* Ignore malformed messages and listener errors. */ }
    };
    target.addEventListener('message', listener);
    return {
        emit(name, payload = null) {
            if (destroyed) throw new Error('HTML UI client has been destroyed');
            if (!allowedActions.has(name)) throw new TypeError(`UI action is not allowed: ${name}`);
            target.parent.postMessage({ [BRIDGE_MARKER]: true, version: 1, direction: 'ui-to-engine', name, payload: clonePayload(payload) }, origin);
        },
        on(name, callback) {
            if (destroyed) throw new Error('HTML UI client has been destroyed');
            if (typeof name !== 'string' || !name || typeof callback !== 'function') throw new TypeError('on requires an event name and callback');
            const set = listeners.get(name) || new Set();
            set.add(callback);
            listeners.set(name, set);
            return () => { set.delete(callback); if (!set.size) listeners.delete(name); };
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            target.removeEventListener('message', listener);
            listeners.clear();
        }
    };
}

/**
 * Attach focus-based keyboard/controller navigation to a UI root. The injected
 * adapter can translate gamepad buttons to the same directional commands.
 * @param {Element} root
 * @param {Object} options Navigation callbacks and optional controller adapter.
 * @returns {Function} cleanup callback
 */
export function installUINavigation(root, { onNavigate = () => {}, onActivate = () => {}, gamepad } = {}) {
    if (!root || typeof root.addEventListener !== 'function' || typeof root.querySelectorAll !== 'function') throw new TypeError('Navigation requires a DOM root');
    const selector = '[data-neptune-nav], button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const items = () => [...root.querySelectorAll(selector)].filter(item => !item.hidden && item.getAttribute('aria-hidden') !== 'true');
    const handler = event => {
        const controls = items();
        const current = controls.indexOf(root.ownerDocument?.activeElement);
        const direction = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (direction !== undefined && controls.length) {
            event.preventDefault();
            const next = (current + direction + controls.length) % controls.length;
            controls[next].focus();
            onNavigate({ index: next, element: controls[next], direction });
        } else if ((event.key === 'Enter' || event.key === ' ') && current >= 0) {
            onActivate({ index: current, element: controls[current] });
        }
    };
    root.addEventListener('keydown', handler);
    const stop = typeof gamepad === 'function' ? gamepad(command => {
        const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', activate: 'Enter' }[command];
        if (key) handler({ key, preventDefault() {} });
    }) : null;
    return () => { root.removeEventListener('keydown', handler); if (typeof stop === 'function') stop(); };
}

/** Create a ready-to-use `window.neptuneUI` client for an embedded HTML interface. */
export function installHTMLUI({ window: target = globalThis.window, actions = [], events = [] } = {}) {
    if (!target || target[BRIDGE_MARKER]) throw new Error('Neptune UI bridge is already installed or has no window');
    const client = createHTMLUIClient({ window: target, actions, events });
    Object.defineProperty(target, 'neptuneUI', { configurable: true, value: client });
    Object.defineProperty(target, BRIDGE_MARKER, { configurable: true, value: client });
    return client;
}
