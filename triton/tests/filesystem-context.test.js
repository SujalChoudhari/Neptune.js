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
