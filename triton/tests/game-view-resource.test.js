import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { buildSync } from "esbuild";

function createGameView() {
    const sourcefile = path.resolve("triton/src/components/panels/GameViewPanel.tsx");
    const external = ["react", "react/jsx-runtime", "@tauri-apps/api/core", "@/lib/projectResourceBridge.mjs?url", "../../../../src/neptune.js?url"];
    const bundle = buildSync({
        bundle: true,
        external,
        format: "cjs",
        platform: "node",
        write: false,
        stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "tsx", sourcefile }
    }).outputFiles[0].text;
    const jsx = (type, props, ...children) => ({ type, props: { ...(props || {}), ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) } });
    const effects = [];
    const refs = [];
    const listeners = new Map();
    const react = {
        createElement: jsx,
        useRef: current => {
            const ref = { current };
            refs.push(ref);
            return ref;
        },
        useEffect: effect => effects.push(effect)
    };
    const invocations = [];
    const modules = {
        react,
        "react/jsx-runtime": { jsx, jsxs: jsx },
        "@tauri-apps/api/core": { invoke: async (command, args) => {
            invocations.push({ command, args });
            return "asset contents";
        } },
        "@/lib/projectResourceBridge.mjs?url": "/projectResourceBridge.js",
        "../../../../src/neptune.js?url": "/neptune.js"
    };
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        React: react,
        window: {
            addEventListener: (type, listener) => listeners.set(type, listener),
            removeEventListener: (type, listener) => listeners.delete(type)
        },
        module,
        exports: module.exports,
        require: id => {
            if (!(id in modules)) throw new Error(`Unexpected GameView dependency: ${id}`);
            return modules[id];
        }
    });
    const tree = module.exports.GameViewPanel();
    for (const effect of effects) effect();
    return {
        tree,
        invocations,
        dispatch: event => listeners.get("message")?.(event),
        setMessageListener: listener => listeners.set("message", listener),
        refs
    };
}

function findNode(node, predicate) {
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
        const found = findNode(child, predicate);
        if (found) return found;
    }
    return null;
}

test("Game View installs the selected-project resource bridge before booting Neptune", () => {
    const harness = createGameView();
    const iframe = findNode(harness.tree, node => node.type === "iframe" && node.props?.title === "Game View");
    assert.ok(iframe);
    assert.ok(iframe.props.ref);
    assert.match(iframe.props.srcDoc, /installProjectResourceBridge\(\);[\s\S]*await import\("\/neptune\.js"\)/);
    assert.match(iframe.props.srcDoc, /\/projectResourceBridge\.js/);
});

test("Game View serves iframe resources through the selected-project native reader", async () => {
    const harness = createGameView();
    const iframe = findNode(harness.tree, node => node.type === "iframe" && node.props?.title === "Game View");
    const replies = [];
    const childWindow = { postMessage: message => replies.push(message) };
    iframe.props.ref.current = { contentWindow: childWindow };
    harness.dispatch({
        source: childWindow,
        data: {
            type: "editor:project-resource-request",
            payload: { id: "resource-1", path: "maps/level.json", kind: "text" }
        }
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(JSON.parse(JSON.stringify(harness.invocations)), [{ command: "read_file", args: { path: "maps/level.json" } }]);
    assert.deepEqual(JSON.parse(JSON.stringify(replies)), [{
        type: "editor:project-resource-response",
        payload: { id: "resource-1", content: "asset contents", error: null }
    }]);
});
