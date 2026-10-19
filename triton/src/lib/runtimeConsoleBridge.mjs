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
