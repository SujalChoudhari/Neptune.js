import fs from "fs";
import path from "path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { buildSync } from "esbuild";
import { describe, it, expect } from "../../tests/tester.js";

const root = path.resolve("triton");

function bundleSource(sourcefile, external) {
    return buildSync({
        bundle: true,
        format: "cjs",
        platform: "node",
        write: false,
        stdin: {
            contents: fs.readFileSync(sourcefile, "utf8"),
            loader: sourcefile.endsWith(".tsx") ? "tsx" : "ts",
            sourcefile
        },
        external
    }).outputFiles[0].text;
}

function createMainHarness() {
    const bundle = bundleSource(path.join(root, "src", "pages", "Main.tsx"), [
        "react",
        "react/jsx-runtime",
        "@tauri-apps/api/event",
        "@tauri-apps/api/window",
        "@tauri-apps/api/core",
        "@/components/layout/DockLayout",
        "@/components/layout/EditorToolbar",
        "@/components/layout/StatusBar",
        "@/pages/WelcomeScreen",
        "@/context/FileSystemContext",
        "@/context/GameContext",
        "@/lib/editorGameRunner"
    ]);
    const runnerBundle = bundleSource(path.join(root, "src", "lib", "editorGameRunner.ts"), []);
    const hierarchyBundle = bundleSource(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), [
        "react",
        "react/jsx-runtime",
        "@/components/library",
        "@/context/GameContext",
        "@/lib/editorGameRunner",
        "./hierarchy/HierarchyItem",
        "./hierarchy/HierarchyToolbar"
    ]);

    const listeners = [];
    const writes = [];
    const files = new Map();
    const runner = loadBundle(runnerBundle, {});
    runner.EditorGameRunner.currentScene = null;
    runner.EditorGameRunner.currentScenePath = null;
    runner.EditorGameRunner.isDirty = false;
    const game = { openedScene: null, staleScene: null };
    const mainHookSlots = [];
    const hierarchyHookSlots = [];
    let mainHookIndex = 0;
    let hierarchyHookIndex = 0;

    const react = {
        createElement(type, props, ...children) {
            return { type, props: { ...(props || {}), children: children.length > 1 ? children : children[0] } };
        },
        useRef(initialValue) {
            const index = mainHookIndex++;
            if (!mainHookSlots[index]) mainHookSlots[index] = { current: initialValue };
            return mainHookSlots[index];
        },
        useState(initialValue) {
            const index = mainHookIndex++;
            if (!mainHookSlots[index]) mainHookSlots[index] = { value: initialValue };
            return [mainHookSlots[index].value, (value) => {
                mainHookSlots[index].value = typeof value === "function" ? value(mainHookSlots[index].value) : value;
            }];
        },
        useEffect(effect, dependencies) {
            const index = mainHookIndex++;
            const previous = mainHookSlots[index];
            const changed = !previous || !dependencies || dependencies.some((value, i) => value !== previous.dependencies?.[i]);
            if (!changed) return;
            previous?.cleanup?.();
            mainHookSlots[index] = { dependencies, cleanup: effect() };
        },
        useMemo(callback) {
            return callback();
        },
        useCallback(callback) {
            return callback;
        }
    };

    const jsxRuntime = {
        jsx(type, props) {
            return { type, props: props || {} };
        },
        jsxs(type, props) {
            return { type, props: props || {} };
        },
        Fragment: Symbol("Fragment")
    };

    const listen = (_eventName, handler) => {
        const listener = { active: true, handler };
        listeners.push(listener);
        return {
            then(callback) {
                // Main uses the returned promise only for cleanup. Calling the
                // continuation synchronously keeps this small harness deterministic.
                callback(() => {
                    listener.active = false;
                });
                return Promise.resolve();
            }
        };
    };

    const invoke = (command, args) => {
        if (command === "write_scene") {
            writes.push(args);
        }
        return Promise.resolve(command === "get_startup_config" ? null : undefined);
    };

    const writeScene = async (scenePath, scene) => {
        const args = { path: scenePath, content: JSON.stringify(scene, null, 2) };
        writes.push(args);
        files.set(scenePath, args.content);
        return true;
    };

    const sandbox = {
        console,
        Promise,
        setTimeout,
        clearTimeout,
        CustomEvent,
        window: {
            document: { documentElement: { classList: { add() {} } } },
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {}
        }
    };

    const module = { exports: {} };
    const modules = {
        react,
        "react/jsx-runtime": jsxRuntime,
        "@tauri-apps/api/event": { listen },
        "@tauri-apps/api/window": { getCurrentWindow: () => ({ setTitle: () => Promise.resolve() }) },
        "@tauri-apps/api/core": { invoke },
        "@/components/layout/DockLayout": { DockLayout: () => null },
        "@/components/layout/EditorToolbar": { EditorToolbar: () => null },
        "@/components/layout/StatusBar": { StatusBar: () => null },
        "@/pages/WelcomeScreen": { WelcomeScreen: () => null },
        "@/context/FileSystemContext": { useFileSystem: () => ({ loadProject: () => Promise.resolve(), readProject: () => Promise.resolve({}), writeScene }) },
        "@/context/GameContext": {
            useGameContext: () => ({
                entities: game.entities || {},
                selectedIds: [],
                selectEntity() {},
                moveEntities() {},
                notifyGame() {},
                saveScene: async () => writeScene("scenes/main.scene", game.staleScene || game.openedScene)
            })
        },
        "@/lib/editorGameRunner": runner
    };
    const require = (specifier) => {
        if (!(specifier in modules)) throw new Error(`Unexpected external import: ${specifier}`);
        return modules[specifier];
    };
    sandbox.React = react;
    sandbox.module = module;
    sandbox.exports = module.exports;
    sandbox.require = require;
    vm.runInNewContext(bundle, sandbox);

    const hierarchyModule = { exports: {} };
    const hierarchyModules = {
        ...modules,
        "@/components/library": {
            ThemedScrollArea: "ThemedScrollArea",
            ThemedContextMenu: "ThemedContextMenu",
            ThemedContextMenuTrigger: "ThemedContextMenuTrigger",
            ThemedContextMenuContent: "ThemedContextMenuContent",
            ThemedContextMenuItem: "ThemedContextMenuItem",
            ThemedContextMenuSeparator: "ThemedContextMenuSeparator",
            ThemedContextMenuLabel: "ThemedContextMenuLabel"
        },
        "./hierarchy/HierarchyItem": { HierarchyItem: "HierarchyItem" },
        "./hierarchy/HierarchyToolbar": { HierarchyToolbar: "HierarchyToolbar" }
    };
    const hierarchyRequire = (specifier) => {
        if (!(specifier in hierarchyModules)) throw new Error(`Unexpected hierarchy external import: ${specifier}`);
        return hierarchyModules[specifier];
    };
    const hierarchySandbox = { ...sandbox, module: hierarchyModule, exports: hierarchyModule.exports, require: hierarchyRequire };
    vm.runInNewContext(hierarchyBundle, hierarchySandbox);

    const Main = module.exports.Main;
    const HierarchyPanel = hierarchyModule.exports.HierarchyPanel;
    const render = () => {
        mainHookIndex = 0;
        Main();
    };
    const renderHierarchy = () => {
        hierarchyHookIndex = 0;
        return HierarchyPanel({});
    };
    const dispatchMenuEvent = (payload) => {
        listeners.filter((listener) => listener.active).forEach((listener) => listener.handler({ payload }));
    };
    const clickDuplicate = (node) => {
        if (Array.isArray(node)) return node.some(clickDuplicate);
        if (!node || typeof node !== "object") return false;
        if (node.type === "ThemedContextMenuItem" && node.props?.children === "Duplicate") {
            node.props.onClick();
            return true;
        }
        const children = node.props?.children;
        return Array.isArray(children) ? children.some(clickDuplicate) : clickDuplicate(children);
    };

    return { game, runner: runner.EditorGameRunner, files, writes, listeners, render, renderHierarchy, clickDuplicate, dispatchMenuEvent };
}

function loadBundle(bundle, context) {
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        console,
        Promise,
        CustomEvent,
        window: { dispatchEvent() {} },
        module,
        exports: module.exports,
        require: context.require || (() => { throw new Error("Unexpected import"); })
    });
    return module.exports;
}

describe("Triton persistence bridge", () => {
    it("uses selected-project commands for versioned project and scene payloads", () => {
        const rust = fs.readFileSync(path.join(root, "src-tauri", "src", "lib.rs"), "utf8");
        const fileSystem = fs.readFileSync(path.join(root, "src", "context", "FileSystemContext.tsx"), "utf8");
        const game = fs.readFileSync(path.join(root, "src", "context", "GameContext.tsx"), "utf8");

        for (const command of ["read_project", "write_project", "read_scene", "write_scene"]) {
            expect(rust.includes(command)).toBe(true);
            expect(fileSystem.includes(`\"${command}\"`)).toBe(true);
        }
        expect(rust.includes("PROJECT_SCHEMA_VERSION")).toBe(true);
        expect(rust.includes("SCENE_SCHEMA_VERSION")).toBe(true);
        expect(rust.includes("RESOURCE_REFERENCE_INVALID")).toBe(true);
        expect(game.includes("setCurrentScenePayload")).toBe(true);
    });

    it("requires native filesystem round-trip coverage for IDs and schema fields", () => {
        const rust = fs.readFileSync(path.join(root, "src-tauri", "src", "lib.rs"), "utf8");

        expect(rust.includes("project_and_scene_commands_round_trip_through_selected_root")).toBe(true);
        expect(rust.includes("write_project_impl(&project.to_string(), &state)")).toBe(true);
        expect(rust.includes("write_scene_impl(\"scenes/main.scene\", &scene.to_string(), &state)")).toBe(true);
        expect(rust.includes("read_project_impl(&state)")).toBe(true);
        expect(rust.includes("read_scene_impl(\"scenes/main.scene\", &state)")).toBe(true);
    });

    it("requires native rejection-before-write coverage with actionable errors", () => {
        const rust = fs.readFileSync(path.join(root, "src-tauri", "src", "lib.rs"), "utf8");

        expect(rust.includes("invalid_payloads_are_rejected_before_existing_files_are_overwritten")).toBe(true);
        expect(rust.includes("Invalid project payload: invalid JSON")).toBe(true);
        expect(rust.includes("parse_json_payload(content, \"scene\")")).toBe(true);
        expect(rust.includes("RESOURCE_REFERENCE_INVALID")).toBe(true);
        expect(rust.includes("Path must be a relative path inside the selected project")).toBe(true);
        expect(rust.includes("Migrate the {kind} before loading it")).toBe(true);
    });

    it("types inspector selections as runtime EntityData without a mock cast", () => {
        const types = fs.readFileSync(path.join(root, "src", "components", "panels", "inspector", "shared", "types.ts"), "utf8");
        const inspector = fs.readFileSync(path.join(root, "src", "components", "panels", "InspectorPanel.tsx"), "utf8");

        expect(types.includes('export type MockEntity = EntityData')).toBe(true);
        expect(inspector.includes('import type { EntityData } from "@/types/engine"')).toBe(true);
        expect(inspector.includes("const entity: EntityData = selectedEntityData")).toBe(true);
        expect(inspector.includes("as any as MockEntity")).toBe(false);
    });

    it("applies inspector renames to both game views and persists them across reopen", async () => {
        const sceneView = fs.readFileSync(path.join(root, "src", "components", "panels", "SceneViewPanel.tsx"), "utf8");
        const gameView = fs.readFileSync(path.join(root, "src", "components", "panels", "GameViewPanel.tsx"), "utf8");
        for (const view of [sceneView, gameView]) {
            expect(view.includes("type === 'editor:rename'")).toBe(true);
            expect(view.includes("entity.name = payload.name")).toBe(true);
        }

        const harness = createMainHarness();
        const scene = {
            type: "scene", version: "1.0.0", schemaVersion: 1,
            entities: [{ id: "entity-1", name: "Before", type: "empty", components: [], children: [] }]
        };
        harness.runner.openScene(scene, "scenes/main.scene");
        expect(harness.runner.updateEntity("entity-1", "name", { value: "After" })).toBe(true);
        expect(harness.runner.isDirty).toBe(true);
        await harness.runner.saveScene(async (filePath, content) => {
            harness.files.set(filePath, content);
            return true;
        });
        harness.runner.closeScene();
        harness.runner.openScene(JSON.parse(harness.files.get("scenes/main.scene")), "scenes/main.scene");

        expect(harness.runner.currentScene.entities[0].name).toBe("After");
    });

    it("saves the opened versioned scene through File > Save", () => {
        const harness = createMainHarness();
        harness.render();

        harness.game.openedScene = {
            type: "scene",
            version: "1.0.0",
            schemaVersion: 1,
            id: "scene-main",
            name: "Main Scene",
            entities: []
        };
        harness.runner.openScene(harness.game.openedScene, "scenes/main.scene");
        harness.render();
        harness.dispatchMenuEvent("save");

        expect(harness.listeners.filter((listener) => listener.active)).toHaveLength(1);
        expect(harness.writes).toHaveLength(1);
        expect(harness.writes[0].path).toBe("scenes/main.scene");
        expect(JSON.parse(harness.writes[0].content)).toEqual(harness.game.openedScene);
    });

    it("keeps a HierarchyPanel duplicate after File > Save, close, and reopen", () => {
        const harness = createMainHarness();
        const source = {
            type: "scene",
            version: "1.0.0",
            schemaVersion: 1,
            id: "scene-main",
            name: "Main Scene",
            entities: [{
                id: "source",
                name: "Source",
                type: "group",
                parentId: null,
                components: [{ id: "source-component", type: "Sprite", props: { path: "hero.png" } }],
                children: [{
                    id: "nested-source",
                    name: "Nested Source",
                    type: "empty",
                    parentId: "source",
                    components: [{ id: "nested-component", type: "Script", props: { path: "hero.js" } }],
                    children: []
                }]
            }]
        };
        harness.game.staleScene = JSON.parse(JSON.stringify(source));
        harness.runner.openScene(source, "scenes/main.scene");
        harness.game.entities = {
            root: { id: "root", parentId: null, name: "Main Scene", type: "group", children: ["source"], active: true, locked: false, expanded: true },
            source: { id: "source", parentId: "root", name: "Source", type: "group", children: ["nested-source"], active: true, locked: false, expanded: true },
            "nested-source": { id: "nested-source", parentId: "source", name: "Nested Source", type: "empty", children: [], active: true, locked: false, expanded: false }
        };

        harness.render();
        expect(harness.clickDuplicate(harness.renderHierarchy())).toBe(true);
        const duplicate = harness.runner.currentScene.entities[1];
        expect(duplicate.id).toContain("entity-");

        harness.dispatchMenuEvent("save");
        harness.runner.closeScene();
        harness.runner.openScene(JSON.parse(harness.files.get("scenes/main.scene")), "scenes/main.scene");

        const reopened = harness.runner.currentScene;
        const original = reopened.entities.find(entity => entity.id === "source");
        const copy = reopened.entities.find(entity => entity.id === duplicate.id);
        expect(copy.name).toBe("Source");
        expect(copy.children[0].name).toBe("Nested Source");
        expect(copy.id !== original.id).toBe(true);
        expect(copy.components[0].id !== original.components[0].id).toBe(true);
        expect(copy.children[0].id !== original.children[0].id).toBe(true);
        expect(copy.children[0].components[0].id !== original.children[0].components[0].id).toBe(true);
    });

    it("does not make a rejected scene read available to File > Save", () => {
        execFileSync(process.execPath, ["triton/tests/rejected-scene-save-harness.mjs"], {
            cwd: path.resolve("."),
            stdio: "pipe"
        });
        expect(true).toBe(true);
    });
});
