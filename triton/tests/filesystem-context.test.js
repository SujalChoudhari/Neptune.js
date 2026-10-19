import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { buildSync } from "esbuild";
import { SceneLoader } from "../../src/core/sceneLoader.js";

function createFileSystemHarness() {
    const sourcefile = path.resolve("triton/src/context/FileSystemContext.tsx");
    const bundle = buildSync({
        bundle: true,
        external: ["react", "react/jsx-runtime", "@tauri-apps/api/core"],
        format: "cjs",
        platform: "node",
        write: false,
        stdin: {
            contents: fs.readFileSync(sourcefile, "utf8"),
            loader: "tsx",
            sourcefile,
            resolveDir: path.dirname(sourcefile)
        }
    }).outputFiles[0].text;

    const state = [];
    let hookIndex = 0;
    let shouldFailScan = false;
    const createdAssets = [];
    const context = { Provider: "Provider" };
    const react = {
        createElement: (type, props) => ({ type, props: props || {} }),
        createContext: () => context,
        useContext: () => null,
        useState(initialValue) {
            const index = hookIndex++;
            if (!(index in state)) state[index] = initialValue;
            return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
        },
        useCallback(callback) {
            hookIndex++;
            return callback;
        }
    };
    const jsx = (type, props) => ({ type, props: props || {} });
    const modules = {
        react,
        "react/jsx-runtime": { jsx, jsxs: jsx },
        "@tauri-apps/api/core": {
            invoke: async (command, args) => {
                if (command === "create_asset") {
                    createdAssets.push(args);
                    return args.path;
                }
                assert.equal(command, "scan_project");
                if (shouldFailScan) throw new Error("selected project is unavailable");
                return { root: { id: "root", parentId: null, name: "One", type: "folder", children: ["src"] } };
            }
        }
    };
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        React: react,
        module,
        exports: module.exports,
        require: specifier => {
            if (!(specifier in modules)) throw new Error(`Unexpected import: ${specifier}`);
            return modules[specifier];
        }
    });

    const render = () => {
        hookIndex = 0;
        return module.exports.FileSystemProvider({ children: null }).props.value;
    };
    return { render, createdAssets, failNextScan: () => { shouldFailScan = true; } };
}

test("failed project filesystem scan clears the previous project's tree and navigation", async () => {
    const harness = createFileSystemHarness();
    await harness.render().loadProject("/project-one");
    assert.equal(harness.render().rootPath, "/project-one");
    assert.ok(harness.render().nodes.root);

    harness.failNextScan();
    await assert.rejects(harness.render().loadProject("/project-two"), /selected project is unavailable/);

    const context = harness.render();
    assert.deepEqual(JSON.parse(JSON.stringify(context.nodes)), {});
    assert.equal(context.rootPath, null);
    assert.deepEqual(JSON.parse(JSON.stringify(context.currentPath)), ["root"]);
});

test("new scene assets use the versioned editor schema and load in the runtime", async () => {
    const harness = createFileSystemHarness();
    await harness.render().loadProject("/project-one");
    const context = harness.render();

    await context.createAsset("root", "New Scene.scene", "scene");

    assert.equal(harness.createdAssets.length, 1);
    const scene = JSON.parse(harness.createdAssets[0].content);
    assert.equal(scene.type, "scene");
    assert.equal(scene.version, "1.0.0");
    assert.equal(scene.schemaVersion, 1);
    assert.equal(scene.name, "New Scene");
    assert.deepEqual(scene.entities, []);
    assert.deepEqual(scene.layers, []);
    assert.equal(SceneLoader.parse(scene).name, "New Scene");
});

test("opening a project never initializes an arbitrary folder as a new project", async () => {
    const sourcefile = path.resolve("triton/src/pages/WelcomeScreen.tsx");
    const bundle = buildSync({
        bundle: true,
        external: ["react", "react/jsx-runtime", "@tauri-apps/plugin-dialog", "@tauri-apps/api/core", "lucide-react", "@/lib/utils", "@/utils/dateUtils", "@/components/library"],
        format: "cjs",
        platform: "node",
        write: false,
        stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "tsx", sourcefile, resolveDir: path.dirname(sourcefile) }
    }).outputFiles[0].text;
    const state = [];
    let hookIndex = 0;
    const calls = [];
    const loaded = [];
    const react = {
        createElement: (type, props, ...children) => ({
            type,
            props: { ...(props || {}), children: children.length > 1 ? children : children[0] }
        }),
        useState(initial) {
            const index = hookIndex++;
            if (!(index in state)) state[index] = initial;
            return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
        },
        useEffect() {}
    };
    const jsx = (type, props) => ({ type, props: props || {} });
    const icons = new Proxy({}, { get: (_target, name) => String(name) });
    const modules = {
        react,
        "react/jsx-runtime": { jsx, jsxs: jsx },
        "@tauri-apps/plugin-dialog": { open: async () => "/selected/folder" },
        "@tauri-apps/api/core": { invoke: async (command, args) => { calls.push({ command, args }); } },
        "lucide-react": icons,
        "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
        "@/utils/dateUtils": { timeAgo: () => "now" },
        "@/components/library": { ThemedScrollArea: "ScrollArea", ThemedInput: "Input", themedButtonBase: "button" }
    };
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        module,
        exports: module.exports,
        React: react,
        localStorage: { setItem() {}, getItem: () => null },
        require: specifier => {
            if (!(specifier in modules)) throw new Error(`Unexpected import: ${specifier}`);
            return modules[specifier];
        }
    });
    const tree = module.exports.WelcomeScreen({ onProjectLoaded: async projectPath => { loaded.push(projectPath); } });
    const findButton = (node, label) => {
        if (!node || typeof node !== "object") return null;
        if (node.type?.name === "SidebarButton" && node.props?.label === label) return node;
        const children = node.props?.children;
        for (const child of Array.isArray(children) ? children : [children]) {
            const found = findButton(child, label);
            if (found) return found;
        }
        return null;
    };

    const importButton = findButton(tree, "Import");
    const newProjectButton = findButton(tree, "New Project");
    assert.ok(importButton);
    assert.ok(newProjectButton);
    await importButton.props.onClick();
    await newProjectButton.props.onClick();

    assert.deepEqual(calls.map(call => call.command), ["open_existing_project", "initialize_project"]);
    assert.deepEqual(loaded, ["/selected/folder", "/selected/folder"]);
});
