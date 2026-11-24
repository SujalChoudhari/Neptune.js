import { KeyboardInput } from "./keyboardinput.js";
import { MouseInput } from "./mouseinput.js";

const keyCodes = KeyboardInput.KEY_CODE;
const aliases = {
    ARROWUP: "UPARROW",
    ARROWDOWN: "DOWNARROW",
    ARROWLEFT: "LEFTARROW",
    ARROWRIGHT: "RIGHTARROW",
    ESCAPE: "ESC"
};

const MOUSE_BUTTONS = {
    MOUSE_LEFT: MouseInput.BUTTON.LEFT,
    MOUSE_MIDDLE: MouseInput.BUTTON.MIDDLE,
    MOUSE_RIGHT: MouseInput.BUTTON.RIGHT
};

const GAMEPAD_BUTTONS = {
    GAMEPAD_A: 0,
    GAMEPAD_B: 1,
    GAMEPAD_X: 2,
    GAMEPAD_Y: 3,
    GAMEPAD_LB: 4,
    GAMEPAD_RB: 5,
    GAMEPAD_LT: 6,
    GAMEPAD_RT: 7,
    GAMEPAD_SELECT: 8,
    GAMEPAD_START: 9,
    GAMEPAD_LSTICK: 10,
    GAMEPAD_RSTICK: 11,
    GAMEPAD_UP: 12,
    GAMEPAD_DOWN: 13,
    GAMEPAD_LEFT: 14,
    GAMEPAD_RIGHT: 15
};

function normalizeSingleBinding(binding) {
    if (typeof binding === "object" && binding !== null && !Array.isArray(binding)) {
        const type = binding.type || "keyboard";
        if (type === "mouse") {
            const btnVal = binding.code ?? binding.button ?? binding.raw;
            const button = Number.isInteger(btnVal) ? btnVal : MOUSE_BUTTONS[String(btnVal).toUpperCase()];
            if (button === undefined) throw new TypeError(`Unknown mouse button '${btnVal}'`);
            return { type: "mouse", code: button, raw: binding.raw ?? btnVal };
        }
        if (type === "gamepad") {
            const btnVal = binding.code ?? binding.button ?? binding.raw;
            const index = Number.isInteger(btnVal) ? btnVal : GAMEPAD_BUTTONS[String(btnVal).toUpperCase()];
            if (index === undefined) throw new TypeError(`Unknown gamepad button '${btnVal}'`);
            return { type: "gamepad", code: index, raw: binding.raw ?? btnVal };
        }
        // Keyboard binding object
        const code = Number.isInteger(binding.code) ? binding.code : (binding.raw ? normalizeSingleBinding(binding.raw).code : undefined);
        if (Number.isInteger(code)) {
            return { type: "keyboard", code, raw: binding.raw ?? code };
        }
        return normalizeSingleBinding(binding.code ?? binding.key ?? binding.raw);
    }

    if (Number.isInteger(binding) && binding >= 0) {
        return { type: "keyboard", code: binding, raw: binding };
    }

    if (typeof binding !== "string" || !binding.trim()) {
        throw new TypeError("Input bindings must be key names, button names, or non-negative key codes");
    }

    const upper = binding.trim().toUpperCase();
    if (upper in MOUSE_BUTTONS) {
        return { type: "mouse", code: MOUSE_BUTTONS[upper], raw: upper };
    }
    if (upper in GAMEPAD_BUTTONS) {
        return { type: "gamepad", code: GAMEPAD_BUTTONS[upper], raw: upper };
    }

    const code = keyCodes[aliases[upper] ?? upper] ?? (upper.length === 1 ? upper.charCodeAt(0) : undefined);
    if (!Number.isInteger(code)) throw new TypeError(`Unknown keyboard binding '${binding}'`);
    return { type: "keyboard", code, raw: upper };
}

function normalizeBindings(keys) {
    const values = Array.isArray(keys) ? keys : [keys];
    if (!values.length) throw new TypeError("An input action requires at least one key binding");
    const normalized = values.map(normalizeSingleBinding);
    // Deduplicate by type and code
    const unique = [];
    const seen = new Set();
    for (const b of normalized) {
        const key = `${b.type}:${b.code}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(b);
        }
    }
    return unique;
}

/**
 * Robust Action-based input management supporting Keyboard, Mouse, and Gamepad devices,
 * context stacks (e.g. gameplay vs menu), key remapping, and typing capture prevention.
 */
export class InputActions {
    #contexts = new Map();
    #contextStack = [];
    #context = "default";
    #enabled = true;
    #defaultBindings = {};
    #ignoreTypingCapture = false;

    /**
     * Determine if user focus is currently inside a text field (input, textarea, or contentEditable).
     * @returns {boolean}
     */
    static isTypingFocused() {
        if (typeof document === "undefined" || !document.activeElement) return false;
        const el = document.activeElement;
        const tag = el.tagName?.toUpperCase();
        return tag === "INPUT" || tag === "TEXTAREA" || Boolean(el.isContentEditable);
    }

    constructor(bindings = {}, { context = "default", ignoreTypingCapture = false } = {}) {
        if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
            throw new TypeError("InputActions bindings must be an object");
        }
        this.#context = context;
        this.#contextStack = [context];
        this.#ignoreTypingCapture = Boolean(ignoreTypingCapture);
        this.#defaultBindings = JSON.parse(JSON.stringify(bindings));

        for (const [action, keys] of Object.entries(bindings)) {
            this.bind(action, keys, context);
        }
    }

    bind(action, keys, context = this.#context) {
        if (typeof action !== "string" || !action.trim()) throw new TypeError("Input action name must be non-empty");
        if (typeof context !== "string" || !context.trim()) throw new TypeError("Input context name must be non-empty");
        if (!this.#contexts.has(context)) this.#contexts.set(context, new Map());
        this.#contexts.get(context).set(action, normalizeBindings(keys));
        return this;
    }

    unbind(action, context = this.#context) {
        return this.#contexts.get(context)?.delete(action) ?? false;
    }

    /**
     * Remap an action to new bindings with configurable conflict policy.
     * @param {string} action
     * @param {any} keys
     * @param {object} [options]
     * @param {string} [options.context]
     * @param {"replace"|"reject"|"allow"} [options.conflictPolicy="replace"]
     */
    remap(action, keys, { context = this.#context, conflictPolicy = "replace" } = {}) {
        if (!["replace", "reject", "allow"].includes(conflictPolicy)) {
            throw new TypeError("conflictPolicy must be 'replace', 'reject', or 'allow'");
        }
        const newBindings = normalizeBindings(keys);
        const ctxMap = this.#contexts.get(context);

        if (ctxMap && conflictPolicy !== "allow") {
            const newKeys = new Set(newBindings.map(b => `${b.type}:${b.code}`));
            for (const [otherAction, existingBindings] of ctxMap.entries()) {
                if (otherAction === action) continue;
                const conflict = existingBindings.find(b => newKeys.has(`${b.type}:${b.code}`));
                if (conflict) {
                    if (conflictPolicy === "reject") {
                        throw new Error(`Conflict: binding '${conflict.raw || conflict.code}' is already bound to action '${otherAction}' in context '${context}'`);
                    }
                    if (conflictPolicy === "replace") {
                        // Remove conflicting key from other action
                        const filtered = existingBindings.filter(b => !newKeys.has(`${b.type}:${b.code}`));
                        if (filtered.length > 0) {
                            ctxMap.set(otherAction, filtered);
                        } else {
                            ctxMap.delete(otherAction);
                        }
                    }
                }
            }
        }

        return this.bind(action, newBindings, context);
    }

    setContext(context) {
        if (typeof context !== "string" || !context.trim()) throw new TypeError("Input context name must be non-empty");
        this.#context = context;
        this.#contextStack = [context];
        return this;
    }

    pushContext(context) {
        if (typeof context !== "string" || !context.trim()) throw new TypeError("Input context name must be non-empty");
        this.#contextStack.push(context);
        this.#context = context;
        return this;
    }

    popContext() {
        if (this.#contextStack.length > 1) {
            this.#contextStack.pop();
            this.#context = this.#contextStack[this.#contextStack.length - 1];
        }
        return this.#context;
    }

    get context() { return this.#context; }
    setEnabled(enabled) { this.#enabled = Boolean(enabled); return this; }
    get enabled() { return this.#enabled; }

    #bindings(action) {
        if (!this.#enabled) return [];
        // Block gameplay/menu actions when typing in text fields unless ignored or in editor context
        if (!this.#ignoreTypingCapture && this.#context !== "editor" && InputActions.isTypingFocused()) {
            return [];
        }

        const activeMap = this.#contexts.get(this.#context);
        const actionBindings = activeMap?.get(action) ?? [];
        // Also check global context if separate
        if (this.#context !== "global" && this.#contexts.has("global")) {
            const globalBindings = this.#contexts.get("global").get(action);
            if (globalBindings) return [...actionBindings, ...globalBindings];
        }
        return actionBindings;
    }

    #checkBindingPressed(binding) {
        if (binding.type === "keyboard") return KeyboardInput.IsKeyPressed(binding.code);
        if (binding.type === "mouse") return MouseInput.IsClicked(binding.code);
        if (binding.type === "gamepad" && typeof navigator !== "undefined" && navigator.getGamepads) {
            const gamepads = navigator.getGamepads();
            for (const gp of gamepads) {
                if (gp?.buttons?.[binding.code]?.pressed) return true;
            }
        }
        return false;
    }

    #checkBindingHeld(binding) {
        if (binding.type === "keyboard") return KeyboardInput.IsKeyDown(binding.code);
        if (binding.type === "mouse") return MouseInput.IsButtonDown(binding.code);
        if (binding.type === "gamepad" && typeof navigator !== "undefined" && navigator.getGamepads) {
            const gamepads = navigator.getGamepads();
            for (const gp of gamepads) {
                if (gp?.buttons?.[binding.code]?.pressed) return true;
            }
        }
        return false;
    }

    #checkBindingReleased(binding) {
        if (binding.type === "keyboard") return KeyboardInput.IsKeyReleased(binding.code);
        if (binding.type === "mouse") return MouseInput.IsButtonUp(binding.code);
        return false;
    }

    pressed(action) {
        return this.#bindings(action).some(b => this.#checkBindingPressed(b));
    }

    held(action) {
        return this.#bindings(action).some(b => this.#checkBindingHeld(b));
    }

    released(action) {
        return this.#bindings(action).some(b => this.#checkBindingReleased(b));
    }

    state(action) {
        return { pressed: this.pressed(action), held: this.held(action), released: this.released(action) };
    }

    axis(negativeAction, positiveAction) {
        let val = 0;
        if (this.held(negativeAction)) val -= 1;
        if (this.held(positiveAction)) val += 1;
        return val;
    }

    vector(leftAction, rightAction, upAction, downAction) {
        const x = this.axis(leftAction, rightAction);
        const y = this.axis(upAction, downAction);
        const len = Math.hypot(x, y);
        if (len > 1) {
            return { x: x / len, y: y / len };
        }
        return { x, y };
    }

    serializeBindings() {
        const output = { version: 1, contexts: {} };
        for (const [ctx, actionsMap] of this.#contexts.entries()) {
            output.contexts[ctx] = {};
            for (const [action, bindings] of actionsMap.entries()) {
                output.contexts[ctx][action] = bindings.map(b => ({ type: b.type, code: b.code, raw: b.raw }));
            }
        }
        return output;
    }

    restoreBindings(data, { merge = false } = {}) {
        if (!data || typeof data !== "object" || data.version !== 1 || !data.contexts) {
            throw new TypeError("Invalid serialized input bindings schema");
        }
        if (!merge) {
            this.#contexts.clear();
        }
        for (const [ctx, actionsMap] of Object.entries(data.contexts)) {
            for (const [action, bindings] of Object.entries(actionsMap)) {
                this.bind(action, bindings, ctx);
            }
        }
        return this;
    }

    resetToDefaults() {
        this.#contexts.clear();
        for (const [action, keys] of Object.entries(this.#defaultBindings)) {
            this.bind(action, keys, this.#context);
        }
        return this;
    }

    dispose() {
        this.#contexts.clear();
        this.#contextStack = [];
        this.#enabled = false;
    }
}
