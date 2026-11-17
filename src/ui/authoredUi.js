/**
 * Small, declarative HTML UI layer for scene data. This is intentionally a
 * safe subset: no HTML strings, CSS strings, scripts, or arbitrary URLs.
 */
export const AUTHORED_UI_VERSION = 1;

const finite = (value, label, min = -100000, max = 100000) => {
    if (!Number.isFinite(value) || value < min || value > max) throw new TypeError(`${label} must be a finite number from ${min} to ${max}`);
    return value;
};
const namedColors = new Set(["transparent", "white", "black", "red", "green", "blue", "yellow", "orange", "purple", "gray", "grey", "lime", "navy", "teal", "aqua", "fuchsia", "silver", "maroon", "olive"]);
const isSafeColor = value => typeof value === "string" && (namedColors.has(value.toLowerCase())
    || /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
    || /^rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value));
const hostCaptureStates = new WeakMap();

export function validateAuthoredUI(value) {
    if (value == null) return { version: AUTHORED_UI_VERSION, elements: [] };
    if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== AUTHORED_UI_VERSION || !Array.isArray(value.elements)) {
        throw new TypeError(`scene.ui must be an object with version ${AUTHORED_UI_VERSION} and an elements array`);
    }
    const ids = new Set();
    const elements = value.elements.map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new TypeError(`scene.ui.elements[${index}] must be an object`);
        if (typeof item.id !== "string" || !item.id.trim() || ids.has(item.id)) throw new TypeError(`scene.ui.elements[${index}].id must be non-empty and unique`);
        ids.add(item.id);
        if (!["panel", "text", "button"].includes(item.type)) throw new TypeError(`Unsupported authored UI type '${String(item.type)}'`);
        const anchor = item.anchor ?? { x: "left", y: "top" };
        if (!anchor || !["left", "center", "right"].includes(anchor.x) || !["top", "center", "bottom"].includes(anchor.y)) throw new TypeError(`scene.ui.elements[${index}].anchor is invalid`);
        const width = finite(item.width ?? 100, `scene.ui.elements[${index}].width`, 0, 100000);
        const height = finite(item.height ?? 32, `scene.ui.elements[${index}].height`, 0, 100000);
        const zIndex = finite(item.zIndex ?? index, `scene.ui.elements[${index}].zIndex`, -10000, 10000);
        const color = item.color ?? "#f5f5f5";
        const background = item.background ?? (item.type === "panel" ? "#25313b" : "transparent");
        if (!isSafeColor(color) || !isSafeColor(background)) throw new TypeError(`scene.ui.elements[${index}] color/background is unsupported`);
        const text = item.text ?? "";
        if (typeof text !== "string" || text.length > 4096) throw new TypeError(`scene.ui.elements[${index}].text must be a string of at most 4096 characters`);
        const fontSize = finite(item.fontSize ?? 16, `scene.ui.elements[${index}].fontSize`, 1, 256);
        if (item.visible !== undefined && typeof item.visible !== "boolean") throw new TypeError(`scene.ui.elements[${index}].visible must be a boolean`);
        if (item.action !== undefined && item.action !== null && (typeof item.action !== "string" || item.action.length > 128)) throw new TypeError(`scene.ui.elements[${index}].action must be a short string`);
        const visible = item.visible !== false;
        return {
            id: item.id, type: item.type,
            x: finite(item.x ?? 0, `scene.ui.elements[${index}].x`),
            y: finite(item.y ?? 0, `scene.ui.elements[${index}].y`),
            width, height, zIndex, anchor: { x: anchor.x, y: anchor.y },
            color, background, text, fontSize, visible,
            fontFamily: item.fontFamily === undefined ? "sans-serif" : typeof item.fontFamily === "string" && /^[\w ,'-]{1,128}$/.test(item.fontFamily) ? item.fontFamily : (() => { throw new TypeError(`scene.ui.elements[${index}].fontFamily is unsupported`); })(),
            align: ["left", "center", "right"].includes(item.align) ? item.align : "left",
            action: typeof item.action === "string" && item.action.length <= 128 ? item.action : null
        };
    });
    return { version: AUTHORED_UI_VERSION, elements };
}

function positionStyle(element) {
    const horizontal = element.anchor.x;
    const vertical = element.anchor.y;
    const style = { position: "absolute", width: `${element.width}px`, height: `${element.height}px`, zIndex: String(element.zIndex) };
    style[horizontal === "left" ? "left" : horizontal === "right" ? "right" : "left"] = horizontal === "center" ? `calc(50% + ${element.x}px)` : `${element.x}px`;
    style[vertical === "top" ? "top" : vertical === "bottom" ? "bottom" : "top"] = vertical === "center" ? `calc(50% + ${element.y}px)` : `${element.y}px`;
    if (horizontal === "center") style.transform = "translateX(-50%)";
    if (vertical === "center") style.transform = `${style.transform || ""} translateY(-50%)`.trim();
    return style;
}

/** Mount versioned authored UI. Preview mode never runs gameplay actions. */
export function mountAuthoredUI(host, source, { mode = "game", captureInput = false, onCaptureChange } = {}) {
    if (!host || typeof host.appendChild !== "function") throw new TypeError("Authored UI needs a DOM host element");
    if (mode !== "game" && mode !== "scene-preview") throw new TypeError("Authored UI mode must be 'game' or 'scene-preview'");
    const data = validateAuthoredUI(source);
    const root = host.ownerDocument.createElement("div");
    root.dataset.neptuneAuthoredUi = "true";
    root.dataset.mode = mode;
    Object.assign(root.style, { position: "absolute", inset: "0", overflow: "hidden", pointerEvents: captureInput ? "auto" : "none", zIndex: "20" });
    root.setAttribute("aria-label", "Authored game UI preview");
    const actionHandler = event => {
        if (mode !== "game") return;
        const action = event.target?.closest?.("[data-neptune-action]")?.dataset.neptuneAction;
        if (action) host.dispatchEvent(new host.ownerDocument.defaultView.CustomEvent("neptune:ui-action", { bubbles: true, detail: { action } }));
    };
    root.addEventListener("click", actionHandler);
    for (const element of data.elements.filter(item => item.visible).sort((a, b) => a.zIndex - b.zIndex)) {
        const node = host.ownerDocument.createElement(element.type === "button" ? "button" : "div");
        node.dataset.neptuneUiId = element.id;
        Object.assign(node.style, positionStyle(element), {
            boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: element.align === "center" ? "center" : element.align === "right" ? "flex-end" : "flex-start",
            padding: "4px 8px", color: element.color, backgroundColor: element.background, fontFamily: element.fontFamily,
            fontSize: `${element.fontSize}px`, textAlign: element.align, border: element.type === "button" ? "1px solid rgba(255,255,255,.28)" : "0",
            borderRadius: element.type === "button" ? "4px" : "0", pointerEvents: captureInput || mode === "game" && element.type === "button" ? "auto" : "none"
        });
        node.textContent = element.text;
        if (element.type === "button") {
            node.type = "button";
            node.dataset.neptuneAction = element.action || "";
            node.disabled = !element.action || mode !== "game";
            node.tabIndex = mode === "game" || captureInput ? 0 : -1;
        }
        root.appendChild(node);
    }
    host.appendChild(root);
    const states = hostCaptureStates.get(host) || [];
    const state = { captureInput, active: true };
    states.push(state);
    hostCaptureStates.set(host, states);
    const updateCapture = () => {
        const active = [...(hostCaptureStates.get(host) || [])].reverse().find(item => item.active);
        host.dataset.neptuneUiCapture = active ? active.captureInput ? "captured" : "passthrough" : "off";
    };
    updateCapture();
    onCaptureChange?.(captureInput);
    let disposed = false;
    return {
        element: root,
        mode,
        captureInput,
        setCapture(next) {
            if (disposed || typeof next !== "boolean") return false;
            state.captureInput = next;
            root.style.pointerEvents = next ? "auto" : "none";
            for (const node of root.querySelectorAll("button")) node.tabIndex = next ? 0 : -1;
            updateCapture();
            onCaptureChange?.(next);
            return true;
        },
        dispose() {
            if (disposed) return;
            disposed = true;
            root.removeEventListener("click", actionHandler);
            root.remove();
            state.active = false;
            const remaining = (hostCaptureStates.get(host) || []).filter(item => item.active);
            hostCaptureStates.set(host, remaining);
            updateCapture();
            onCaptureChange?.(false);
        }
    };
}
