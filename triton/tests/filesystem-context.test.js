import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { buildSync } from "esbuild";

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
            sourcefile
        }
    }).outputFiles[0].text;

    const state = [];
    let hookIndex = 0;
    let shouldFailScan = false;
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
            invoke: async command => {
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
    return { render, failNextScan: () => { shouldFailScan = true; } };
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
