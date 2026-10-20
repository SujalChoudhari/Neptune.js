import { isRuntimeViewMessageSource } from "./runtimeSelectionBridge.mjs";

export function readRuntimeConsoleMessage(event, frames) {
    if (!event || !isRuntimeViewMessageSource(event.source, frames)) return null;

    const data = event.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;

    if (data.type === "editor:log") {
        const detail = data.detail;
        if (!detail || typeof detail !== "object" || Array.isArray(detail)) return null;
        if (!["info", "warn", "error"].includes(detail.type) || typeof detail.message !== "string") return null;
        return { kind: "log", type: detail.type, message: detail.message };
    }

    if (data.type === "editor:diagnostic") {
        const diagnostic = data.payload;
        if (!diagnostic || typeof diagnostic !== "object" || Array.isArray(diagnostic)) return null;
        return { kind: "diagnostic", diagnostic };
    }

    return null;
}

export const runtimeConsoleBridgeScript = `
(() => {
    const format = value => {
        if (value instanceof Error) return value.stack || value.message;
        if (typeof value === "string") return value;
        try {
            const serialized = JSON.stringify(value);
            return serialized === undefined ? String(value) : serialized;
        } catch {
            return String(value);
        }
    };
    const methods = [["log", "info"], ["info", "info"], ["warn", "warn"], ["error", "error"]];
    methods.forEach(([method, type]) => {
        const original = typeof console[method] === "function" ? console[method].bind(console) : () => {};
        console[method] = (...args) => {
            original(...args);
            window.parent.postMessage({
                type: "editor:log",
                detail: { type, message: args.map(format).join(" ") }
            }, "*");
        };
    });
})();
`;
