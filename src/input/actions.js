import { KeyboardInput } from "./keyboardinput.js";

const keyCodes = KeyboardInput.KEY_CODE;
const aliases = { ARROWUP: "UPARROW", ARROWDOWN: "DOWNARROW", ARROWLEFT: "LEFTARROW", ARROWRIGHT: "RIGHTARROW", ESCAPE: "ESC" };

function normalizeKeys(keys) {
    const values = Array.isArray(keys) ? keys : [keys];
    if (!values.length) throw new TypeError("An input action requires at least one key binding");
    return [...new Set(values.map(key => {
        if (Number.isInteger(key) && key >= 0) return key;
        if (typeof key !== "string" || !key.trim()) throw new TypeError("Input bindings must be key names or non-negative key codes");
        const name = key.trim().toUpperCase();
        const code = keyCodes[aliases[name] ?? name] ?? (name.length === 1 ? name.charCodeAt(0) : undefined);
        if (!Number.isInteger(code)) throw new TypeError(`Unknown keyboard binding '${key}'`);
        return code;
    }))];
}

/** Keyboard action bindings with per-action pressed, held, and released queries. */
export class InputActions {
    #contexts = new Map();
    #context = "default";
    #enabled = true;

    constructor(bindings = {}, { context = "default" } = {}) {
        if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) throw new TypeError("InputActions bindings must be an object");
        this.#context = context;
        for (const [action, keys] of Object.entries(bindings)) this.bind(action, keys);
    }

    bind(action, keys, context = this.#context) {
        if (typeof action !== "string" || !action.trim()) throw new TypeError("Input action name must be non-empty");
        if (typeof context !== "string" || !context.trim()) throw new TypeError("Input context name must be non-empty");
        if (!this.#contexts.has(context)) this.#contexts.set(context, new Map());
        this.#contexts.get(context).set(action, normalizeKeys(keys));
        return this;
    }

    unbind(action, context = this.#context) { return this.#contexts.get(context)?.delete(action) ?? false; }
    setContext(context) {
        if (typeof context !== "string" || !context.trim()) throw new TypeError("Input context name must be non-empty");
        this.#context = context;
        return this;
    }
    get context() { return this.#context; }
    setEnabled(enabled) { this.#enabled = Boolean(enabled); return this; }
    get enabled() { return this.#enabled; }

    #keys(action) { return this.#enabled ? this.#contexts.get(this.#context)?.get(action) ?? [] : []; }
    pressed(action) { return this.#keys(action).some(key => KeyboardInput.IsKeyPressed(key)); }
    held(action) { return this.#keys(action).some(key => KeyboardInput.IsKeyDown(key)); }
    released(action) { return this.#keys(action).some(key => KeyboardInput.IsKeyReleased(key)); }
    state(action) { return { pressed: this.pressed(action), held: this.held(action), released: this.released(action) }; }

    /** Clear bindings and disable this instance when its owning gameplay context ends. */
    dispose() { this.#contexts.clear(); this.#enabled = false; }
}
