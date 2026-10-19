import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { buildSync } from "esbuild";

function createSceneView() {
    const sourcefile = path.resolve("triton/src/components/panels/SceneViewPanel.tsx");
    const external = ["react", "react/jsx-runtime", "@tauri-apps/api/core", "../../../../src/neptune.js?url", "@/lib/projectResourceBridge.mjs?url", "../../../../src/thalassa/camera.js?url", "@/components/library", "lucide-react", "@/context/GameContext", "@/lib/editorGameRunner", "@/lib/runtimeSelectionBridge.mjs"];
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
    const listeners = new Map();
    const invocations = [];
    const react = {
        createElement: jsx,
        useRef: current => ({ current }),
        useState: initial => [initial, () => {}],
        useCallback: callback => callback,
        useEffect: callback => effects.push(callback)
    };
    const modules = {
        react,
        "react/jsx-runtime": { jsx, jsxs: jsx },
        "@tauri-apps/api/core": { invoke: async (command, args) => { invocations.push({ command, args }); return "resource-data"; } },
        "../../../../src/neptune.js?url": "/neptune.js",
        "@/lib/projectResourceBridge.mjs?url": "/projectResourceBridge.js",
        "../../../../src/thalassa/camera.js?url": "/camera.js",
        "@/components/library": { ThemedIconButton: "button" },
        "lucide-react": { Maximize: "maximize", ZoomIn: "zoom-in", ZoomOut: "zoom-out" },
        "@/context/GameContext": { useGameContext: () => ({ notifyGame() {} }) },
        "@/lib/editorGameRunner": { EditorGameRunner: { openScene() {}, report() {} } },
        "@/lib/runtimeSelectionBridge.mjs": { runtimeSelectionBridgeScript: "" }
    };
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        React: react,
        window: {
            addEventListener: (type, listener) => listeners.set(type, listener),
            removeEventListener: type => listeners.delete(type)
        },
        module,
        exports: module.exports,
        require: id => {
            if (!(id in modules)) throw new Error(`Unexpected SceneView dependency: ${id}`);
            return modules[id];
        }
    });
    const tree = module.exports.SceneViewPanel();
    for (const effect of effects) effect();
    return { tree, invocations, dispatch: event => listeners.get("message")?.(event) };
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

test("Scene View boots the engine after installing project resources and relays only its own requests", async () => {
    const harness = createSceneView();
    const iframe = findNode(harness.tree, node => node.type === "iframe" && node.props?.title === "Scene View");
    assert.ok(iframe);
    const bridgeIndex = iframe.props.srcDoc.indexOf("installProjectResourceBridge();");
    const engineIndex = iframe.props.srcDoc.indexOf('await import("/neptune.js")');
    assert.ok(bridgeIndex >= 0 && bridgeIndex < engineIndex);
    assert.equal(iframe.props.srcDoc.includes("debug_project/main.js?url"), false);
    const startIndex = iframe.props.srcDoc.indexOf("// Start Game");
    const cameraIndex = iframe.props.srcDoc.indexOf("// Editor Camera", startIndex);
    const startup = iframe.props.srcDoc.slice(startIndex, cameraIndex);
    const lifecycle = [];
    vm.runInNewContext(startup, { game: { pause: () => lifecycle.push("pause"), start: () => lifecycle.push("start") } });
    assert.deepEqual(lifecycle, ["pause", "start"]);
    assert.equal(startup.includes("setTimeout"), false);

    const childWindow = { postMessage() {} };
    iframe.props.ref.current = { contentWindow: childWindow };
    harness.dispatch({ source: {}, data: { type: "editor:project-resource-request", payload: { id: "foreign", path: "assets/a.png", kind: "image" } } });
    assert.equal(harness.invocations.length, 0);

    const replies = [];
    childWindow.postMessage = message => replies.push(message);
    harness.dispatch({ source: childWindow, data: { type: "editor:project-resource-request", payload: { id: "scene-resource", path: "assets/a.png", kind: "image" } } });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(JSON.parse(JSON.stringify(harness.invocations)), [{ command: "read_image_asset", args: { path: "assets/a.png" } }]);
    assert.deepEqual(JSON.parse(JSON.stringify(replies)), [{ type: "editor:project-resource-response", payload: { id: "scene-resource", content: "resource-data", error: null } }]);
});
