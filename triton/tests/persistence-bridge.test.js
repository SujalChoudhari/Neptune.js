import fs from "fs";
import path from "path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { buildSync } from "esbuild";
import { describe, it, expect } from "../../tests/tester.js";
import { SceneLoader } from "../../src/core/sceneLoader.js";
import { ComponentRegistry } from "../../src/core/componentRegistry.js";
import { Transform } from "../../src/components/transform.js";
import { Sprite } from "../../src/rendering/sprite.js";
import { pickRuntimeEntityAt, runtimeSelectionBridgeScript } from "../src/lib/runtimeSelectionBridge.mjs";
import { runtimeConsoleBridgeScript } from "../src/lib/runtimeConsoleBridge.mjs";
import { runtimeControlBridgeScript, runRuntimeControl } from "../src/lib/runtimeControlBridge.mjs";
import { getSceneNavigationPath } from "../src/lib/projectNavigation.mjs";
import { createEmptySceneAssetContent } from "../src/lib/projectAssetContent.mjs";

const root = path.resolve("triton");

ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("Sprite", Sprite);

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
    const notifications = [];
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

    const additionPath = path.resolve("triton/src/lib/hierarchyEntityAddition.ts");
    const additionBundle = buildSync({
        bundle: true,
        format: "cjs",
        platform: "node",
        write: false,
        stdin: { contents: fs.readFileSync(additionPath, "utf8"), loader: "ts", sourcefile: additionPath }
    }).outputFiles[0].text;
    const { appendHierarchyBranch, appendHierarchyEntity } = loadBundle(additionBundle, {});
    const movementPath = path.resolve("triton/src/lib/hierarchyEntityMovement.ts");
    const movementBundle = buildSync({
        bundle: true,
        format: "cjs",
        platform: "node",
        write: false,
        stdin: { contents: fs.readFileSync(movementPath, "utf8"), loader: "ts", sourcefile: movementPath }
    }).outputFiles[0].text;
    const { moveHierarchyEntities } = loadBundle(movementBundle, {});

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
                setEntityActiveInHierarchy(id, active) {
                    const entity = game.entities?.[id];
                    if (entity) game.entities = { ...game.entities, [id]: { ...entity, active } };
                },
                renameEntityInHierarchy(id, name) {
                    const entity = game.entities?.[id];
                    if (entity) game.entities = { ...game.entities, [id]: { ...entity, name } };
                },
                addEntityToHierarchy(entity) {
                    game.entities = appendHierarchyEntity(game.entities || {}, entity);
                },
                addEntityBranchToHierarchy(branch, parentId) {
                    game.entities = appendHierarchyBranch(game.entities || {}, branch, parentId);
                },
                moveEntities(ids, targetParentId, index) {
                    game.entities = moveHierarchyEntities(game.entities || {}, ids, targetParentId, index);
                    notifications.push({ type: "editor:move-entities", payload: { ids, targetParentId, index } });
                },
                notifyGame(type, payload) {
                    notifications.push({ type, payload });
                },
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
    const hierarchyToolbarComponent = () => null;
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
        "./hierarchy/HierarchyToolbar": { HierarchyToolbar: hierarchyToolbarComponent }
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
    const clickCreateEntity = (node, type) => {
        if (Array.isArray(node)) return node.some(child => clickCreateEntity(child, type));
        if (!node || typeof node !== "object") return false;
        if (node.type === hierarchyToolbarComponent) {
            node.props.onAddEntity(type);
            return true;
        }
        const children = node.props?.children;
        return Array.isArray(children)
            ? children.some(child => clickCreateEntity(child, type))
            : clickCreateEntity(children, type);
    };
    const clickRenameEntity = (node, id, name) => {
        if (Array.isArray(node)) return node.some(child => clickRenameEntity(child, id, name));
        if (!node || typeof node !== "object") return false;
        if (node.type === "HierarchyItem" && node.props?.entity?.id === id) {
            node.props.onRename(id, name);
            return true;
        }
        const children = node.props?.children;
        return Array.isArray(children)
            ? children.some(child => clickRenameEntity(child, id, name))
            : clickRenameEntity(children, id, name);
    };
    const clickMoveEntity = (node, ids, targetParentId, index) => {
        if (Array.isArray(node)) return node.some(child => clickMoveEntity(child, ids, targetParentId, index));
        if (!node || typeof node !== "object") return false;
        if (node.type === "HierarchyItem" && ids.includes(node.props?.entity?.id)) {
            node.props.onMove(ids, targetParentId, index);
            return true;
        }
        const children = node.props?.children;
        return Array.isArray(children)
            ? children.some(child => clickMoveEntity(child, ids, targetParentId, index))
            : clickMoveEntity(children, ids, targetParentId, index);
    };
    const clickToggleActive = (node, id) => {
        if (Array.isArray(node)) return node.some(child => clickToggleActive(child, id));
        if (!node || typeof node !== "object") return false;
        if (node.type === "HierarchyItem" && node.props?.entity?.id === id) {
            node.props.onToggleActive(id);
            return true;
        }
        const children = node.props?.children;
        return Array.isArray(children)
            ? children.some(child => clickToggleActive(child, id))
            : clickToggleActive(children, id);
    };

    return { game, runner: runner.EditorGameRunner, files, writes, listeners, notifications, render, renderHierarchy, clickDuplicate, clickCreateEntity, clickRenameEntity, clickMoveEntity, clickToggleActive, dispatchMenuEvent };
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
    it("opens only scene assets from the project navigator using canonical node IDs", () => {
        expect(getSceneNavigationPath({ id: "scenes/main.scene", name: "main.scene", type: "file" })).toBe("scenes/main.scene");
        expect(getSceneNavigationPath({ id: "legacy/intro.scn", name: "INTRO.SCN", type: "file" })).toBe("legacy/intro.scn");
        expect(getSceneNavigationPath({ id: "project.npt", name: "project.npt", type: "file" })).toBeNull();
        expect(getSceneNavigationPath({ id: "folder.scene", name: "folder.scene", type: "folder" })).toBeNull();
    });

    it("creates versioned empty scenes that the runtime SceneLoader accepts", () => {
        const payload = JSON.parse(createEmptySceneAssetContent("maps/New Scene.scene"));
        expect(payload).toEqual({
            type: "scene",
            version: "1.0.0",
            schemaVersion: 1,
            name: "New Scene",
            entities: []
        });

        const runtimeScene = SceneLoader.parse(payload);
        expect(runtimeScene.name).toBe("New Scene");
        expect(runtimeScene.children).toEqual([]);
    });

    it("clears stale project navigation when a selected project's native scan fails", async () => {
        const bundle = bundleSource(path.join(root, "src", "context", "FileSystemContext.tsx"), [
            "react",
            "react/jsx-runtime",
            "@tauri-apps/api/core",
            "@/lib/projectAssetContent.mjs"
        ]);
        const hookState = [];
        let hookIndex = 0;
        let failScan = false;
        const react = {
            createElement: (type, props) => ({ type, props }),
            createContext: () => ({ Provider: "FileSystemProvider" }),
            useContext: () => null,
            useCallback: callback => callback,
            useState(initialValue) {
                const index = hookIndex++;
                if (!(index in hookState)) hookState[index] = initialValue;
                return [hookState[index], value => {
                    hookState[index] = typeof value === "function" ? value(hookState[index]) : value;
                }];
            }
        };
        const jsxRuntime = {
            jsx: (type, props) => ({ type, props }),
            jsxs: (type, props) => ({ type, props })
        };
        const modules = {
            react,
            "react/jsx-runtime": jsxRuntime,
            "@tauri-apps/api/core": {
                invoke: async command => {
                    if (command !== "scan_project") throw new Error(`Unexpected command: ${command}`);
                    if (failScan) throw new Error("selected project is unavailable");
                    return {
                        root: { id: "root", parentId: null, name: "Project A", type: "folder", children: ["assets"] },
                        assets: { id: "assets", parentId: "root", name: "Assets", type: "folder", children: [] }
                    };
                }
            },
            "@/lib/projectAssetContent.mjs": { createEmptySceneAssetContent: () => "{}" }
        };
        const fileSystemModule = { exports: {} };
        vm.runInNewContext(bundle, {
            React: react,
            console,
            Promise,
            CustomEvent,
            module: fileSystemModule,
            exports: fileSystemModule.exports,
            require: specifier => {
                if (!(specifier in modules)) throw new Error(`Unexpected import: ${specifier}`);
                return modules[specifier];
            }
        });
        const fileSystem = fileSystemModule.exports;
        const renderProvider = () => {
            hookIndex = 0;
            return fileSystem.FileSystemProvider({ children: null }).props.value;
        };

        let context = renderProvider();
        await context.loadProject("/projects/a");
        context = renderProvider();
        context.navigateTo("assets");
        context = renderProvider();
        expect(context.rootPath).toBe("/projects/a");
        expect(context.currentPath).toEqual(["root", "assets"]);

        failScan = true;
        await context.loadProject("/projects/b");
        context = renderProvider();
        expect(context.nodes).toEqual({});
        expect(context.rootPath).toBeNull();
        expect(context.currentPath).toEqual(["root"]);
    });

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

    it("forwards runtime log, warning, and error entries while preserving native console output", () => {
        const gameView = fs.readFileSync(path.join(root, "src", "components", "panels", "GameViewPanel.tsx"), "utf8");

        expect(gameView.includes("window.addEventListener('error'")).toBe(true);
        expect(gameView.includes("window.addEventListener('unhandledrejection'")).toBe(true);
        expect(gameView.includes("type: 'editor:diagnostic'")).toBe(true);
        expect(gameView.includes("${runtimeConsoleBridgeScript}")).toBe(true);
        expect(gameView.includes("GAME_BOOT_ERROR")).toBe(true);

        const nativeCalls = [];
        const messages = [];
        const runtimeConsole = Object.fromEntries(["log", "info", "warn", "error"].map(method => [
            method,
            (...args) => nativeCalls.push({ method, args })
        ]));
        const context = {
            console: runtimeConsole,
            window: { parent: { postMessage: message => messages.push(message) } }
        };
        vm.runInNewContext(runtimeConsoleBridgeScript, context);
        runtimeConsole.log("boot", { scene: "main" });
        runtimeConsole.warn("asset missing");
        runtimeConsole.error("runtime failed");

        expect(nativeCalls.map(call => call.method)).toEqual(["log", "warn", "error"]);
        expect(messages.map(message => message.detail.type)).toEqual(["info", "warn", "error"]);
        expect(messages[0].detail.message).toBe('boot {"scene":"main"}');
        expect(messages[1].detail.message).toBe("asset missing");
        expect(messages[2].detail.message).toBe("runtime failed");
    });

    it("reports play, pause, resume, and stop state from the live runtime controls", () => {
        const gameView = fs.readFileSync(path.join(root, "src", "components", "panels", "GameViewPanel.tsx"), "utf8");
        expect(gameView.includes("${runtimeControlBridgeScript}")).toBe(true);
        expect(gameView.includes("type: 'game:state-update'")).toBe(true);

        const calls = [];
        const states = [];
        const game = {
            isRunning: false,
            isPaused: false,
            start() { calls.push("play"); this.isRunning = true; },
            pause() { calls.push("pause"); this.isPaused = true; },
            resume() { calls.push("resume"); this.isPaused = false; },
            stop() { calls.push("stop"); this.isRunning = false; this.isPaused = false; }
        };
        const send = (type, payload) => expect(runRuntimeControl(game, type, payload, state => states.push(state))).toBe(true);
        send("editor:play");
        send("editor:pause", { paused: true });
        send("editor:pause", { paused: false });
        send("editor:stop");

        expect(calls).toEqual(["play", "pause", "resume", "stop"]);
        expect(states).toEqual([
            { isPlaying: true, isPaused: false },
            { isPlaying: true, isPaused: true },
            { isPlaying: true, isPaused: false },
            { isPlaying: false, isPaused: false }
        ]);
        expect(runRuntimeControl(game, "editor:unknown", {}, () => {})).toBe(false);
    });

    it("opens existing projects without initializing them and keeps creation explicit", async () => {
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
        const modules = {
            react,
            "react/jsx-runtime": { jsx, jsxs: jsx },
            "@tauri-apps/plugin-dialog": { open: async () => "/selected/folder" },
            "@tauri-apps/api/core": { invoke: async (command, args) => { calls.push({ command, args }); } },
            "lucide-react": new Proxy({}, { get: (_target, name) => String(name) }),
            "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
            "@/utils/dateUtils": { timeAgo: () => "now" },
            "@/components/library": { ThemedScrollArea: "ScrollArea", ThemedInput: "Input", themedButtonBase: "button" }
        };
        const componentModule = { exports: {} };
        vm.runInNewContext(bundle, {
            module: componentModule,
            exports: componentModule.exports,
            React: react,
            localStorage: { setItem() {}, getItem: () => null },
            require: specifier => {
                if (!(specifier in modules)) throw new Error(`Unexpected import: ${specifier}`);
                return modules[specifier];
            }
        });
        const tree = componentModule.exports.WelcomeScreen({ onProjectLoaded: async value => { loaded.push(value); } });
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
        expect(importButton !== null).toBe(true);
        expect(newProjectButton !== null).toBe(true);
        await importButton.props.onClick();
        await newProjectButton.props.onClick();

        expect(calls.map(call => call.command)).toEqual(["open_existing_project", "initialize_project"]);
        expect(loaded).toEqual(["/selected/folder", "/selected/folder"]);
        const mainSource = fs.readFileSync(path.resolve("triton/src/pages/Main.tsx"), "utf8");
        expect(mainSource.includes("get_startup_config")).toBe(false);
    });

    it("synchronizes editor selection into the live game and runtime selection back to the editor", () => {
        const gameView = fs.readFileSync(path.join(root, "src", "components", "panels", "GameViewPanel.tsx"), "utf8");
        expect(gameView.includes("${runtimeSelectionBridgeScript}")).toBe(true);

        const handlers = new Map();
        const editorEvents = [];
        const parentMessages = [];
        const parent = { postMessage: message => parentMessages.push(message) };
        const scene = { id: "root", children: [{ id: "hero", children: [] }, { id: "npc", children: [] }] };
        const game = { scene };
        const runtimeWindow = {
            parent,
            game,
            addEventListener: (name, handler) => handlers.set(name, handler),
            dispatchEvent: event => editorEvents.push(event)
        };
        class RuntimeCustomEvent {
            constructor(type, options) {
                this.type = type;
                this.detail = options.detail;
            }
        }

        vm.runInNewContext(runtimeSelectionBridgeScript, { window: runtimeWindow, CustomEvent: RuntimeCustomEvent });
        handlers.get("message")({ source: parent, data: { type: "editor:select", payload: { ids: ["hero", "missing", "hero"] } } });
        expect(game.editorSelection).toEqual(["hero"]);
        expect(editorEvents[0].type).toBe("neptune:editor-selection-changed");
        expect(editorEvents[0].detail.entities[0].id).toBe("hero");

        handlers.get("neptune:selection-changed")({ detail: { ids: ["npc", "missing", "npc"] } });
        expect(parentMessages).toEqual([{ type: "game:selection-changed", payload: { ids: ["npc"] } }]);
    });

    it("selects the runtime Sprite under a Game View pointer and clears selection on empty space", () => {
        const transform = new Transform();
        transform.position.x = 1;
        transform.position.y = 1;
        const sprite = Object.create(Sprite.prototype);
        sprite._properties = { width: 2, height: 2 };
        const entity = {
            id: "hero",
            components: [transform, sprite],
            children: []
        };
        const scene = { children: [entity], activeCamera: { screenToWorld: (x, y) => ({ x, y }) } };
        expect(pickRuntimeEntityAt(scene, 64, 64)).toBe("hero");
        entity.active = false;
        expect(pickRuntimeEntityAt(scene, 64, 64)).toBe(null);
        entity.active = true;
        expect(pickRuntimeEntityAt(scene, 300, 300)).toBe(null);

        const listeners = new Map();
        const posted = [];
        const canvas = { width: 200, height: 100, getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 50 }) };
        const parent = { postMessage: message => posted.push(message) };
        const runtimeWindow = {
            parent, game: { scene },
            document: { getElementById: () => canvas },
            addEventListener: (name, handler) => listeners.set(name, handler),
            dispatchEvent: event => listeners.get("neptune:selection-changed")?.({ detail: event.detail })
        };
        vm.runInNewContext(runtimeSelectionBridgeScript, {
            window: runtimeWindow,
            CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
        });
        const pointerdown = listeners.get("pointerdown");
        pointerdown({ target: canvas, button: 0, clientX: 42, clientY: 52 });
        pointerdown({ target: canvas, button: 0, clientX: 160, clientY: 80 });
        expect(posted).toEqual([
            { type: "game:selection-changed", payload: { ids: ["hero"] } },
            { type: "game:selection-changed", payload: { ids: [] } }
        ]);
    });

    it("removes deleted entities from the live runtime and nested editor hierarchy", () => {
        const sourcePath = path.resolve("triton/src/lib/hierarchyEntityRemoval.ts");
        const bundle = buildSync({
            bundle: true,
            format: "cjs",
            platform: "node",
            write: false,
            stdin: { contents: fs.readFileSync(sourcePath, "utf8"), loader: "ts", sourcefile: sourcePath }
        }).outputFiles[0].text;
        const { removeEntityBranch } = loadBundle(bundle, {});
        const hierarchy = {
            root: { id: "root", parentId: null, children: ["parent"] },
            parent: { id: "parent", parentId: "root", children: ["child", "sibling"] },
            child: { id: "child", parentId: "parent", children: ["grandchild"] },
            grandchild: { id: "grandchild", parentId: "child", children: [] },
            sibling: { id: "sibling", parentId: "parent", children: [] }
        };
        const removal = removeEntityBranch(hierarchy, "child");
        expect(removal.removedIds).toEqual(["child", "grandchild"]);
        expect(removal.entities.parent.children).toEqual(["sibling"]);
        expect(removal.entities.child === undefined && removal.entities.grandchild === undefined).toBe(true);

        const gameView = fs.readFileSync(path.resolve("triton/src/components/panels/GameViewPanel.tsx"), "utf8");
        const sceneView = fs.readFileSync(path.resolve("triton/src/components/panels/SceneViewPanel.tsx"), "utf8");
        expect(gameView.includes("${runtimeSelectionBridgeScript}")).toBe(true);
        expect(sceneView.includes("type === 'editor:delete'")).toBe(true);

        const listeners = new Map();
        const scene = {
            id: "root",
            children: [{ id: "parent", children: [{ id: "child", parent: null, children: [] }] }]
        };
        const runtimeGame = { scene, editorSelection: ["child"] };
        const runtimeWindow = {
            parent: {},
            game: runtimeGame,
            addEventListener: (name, handler) => listeners.set(name, handler),
            dispatchEvent() {}
        };
        vm.runInNewContext(runtimeSelectionBridgeScript, {
            window: runtimeWindow,
            CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
        });
        listeners.get("message")({ source: runtimeWindow.parent, data: { type: "editor:delete", payload: { id: "parent" } } });
        expect(scene.children).toEqual([]);
        expect(runtimeGame.editorSelection).toEqual([]);
    });

    it("reparents runtime entities in both views and rejects moves that would create a cycle", () => {
        const sceneView = fs.readFileSync(path.resolve("triton/src/components/panels/SceneViewPanel.tsx"), "utf8");
        expect(sceneView.includes("${runtimeSelectionBridgeScript}")).toBe(true);
        const scene = SceneLoader.parse({
            type: "scene", version: "1.0.0", schemaVersion: 1,
            id: "scene-runtime-reparent", name: "Runtime Reparent",
            entities: [
                { id: "parent", name: "Parent", components: [], children: [
                    { id: "child", name: "Child", components: [], children: [] }
                ] },
                { id: "target", name: "Target", components: [], children: [] }
            ]
        });
        const listeners = new Map();
        const parent = {};
        const runtimeWindow = {
            parent,
            game: { scene },
            addEventListener: (name, handler) => listeners.set(name, handler),
            dispatchEvent() {}
        };
        vm.runInNewContext(runtimeSelectionBridgeScript, {
            window: runtimeWindow,
            CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
        });

        const sendMove = (ids, targetParentId, index) => listeners.get("message")({
            source: parent,
            data: { type: "editor:move-entities", payload: { ids, targetParentId, index } }
        });
        const child = scene.children[0].children[0];
        const target = scene.children[1];
        sendMove(["child"], "target", 0);
        expect(scene.children[0].children).toEqual([]);
        expect(target.children[0]).toBe(child);
        expect(child.parent).toBe(target);

        sendMove(["target"], "child", 0);
        expect(scene.children[1]).toBe(target);
        expect(target.children[0]).toBe(child);
    });

    it("synchronizes Hierarchy active toggles to the runtime and persists them", () => {
        const harness = createMainHarness();
        harness.render();
        const source = {
            type: "scene", version: "1.0.0", schemaVersion: 1,
            id: "scene-active-toggle", name: "Active Toggle",
            entities: [{ id: "toggle-me", name: "Toggle Me", type: "empty", active: true, components: [], children: [] }]
        };
        harness.runner.openScene(source, "scenes/active-toggle.scene");
        harness.game.entities = {
            root: { id: "root", parentId: null, name: "Active Toggle", type: "group", children: ["toggle-me"], active: true, locked: false, expanded: true },
            "toggle-me": { id: "toggle-me", parentId: "root", name: "Toggle Me", type: "empty", children: [], active: true, locked: false, expanded: false }
        };

        expect(harness.clickToggleActive(harness.renderHierarchy(), "toggle-me")).toBe(true);
        expect(harness.game.entities["toggle-me"].active).toBe(false);
        expect(harness.runner.currentScene.entities[0].active).toBe(false);
        const activeMessage = harness.notifications.filter(message => message.type === "editor:set-active").pop();
        expect(activeMessage.payload).toEqual({ id: "toggle-me", active: false });

        const runtimeScene = SceneLoader.parse(source);
        const runtimeListeners = new Map();
        const runtimeWindow = {
            parent: {},
            game: { scene: runtimeScene },
            addEventListener: (name, handler) => runtimeListeners.set(name, handler),
            dispatchEvent() {}
        };
        vm.runInNewContext(runtimeSelectionBridgeScript, {
            window: runtimeWindow,
            CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
        });
        runtimeListeners.get("message")({ source: runtimeWindow.parent, data: { type: "editor:set-active", payload: activeMessage.payload } });
        expect(runtimeScene.children[0].active).toBe(false);

        harness.dispatchMenuEvent("save");
        harness.runner.closeScene();
        harness.runner.openScene(JSON.parse(harness.files.get("scenes/active-toggle.scene")), "scenes/active-toggle.scene");
        expect(harness.runner.currentScene.entities[0].active).toBe(false);
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

    it("renames Hierarchy entities in editor state and preserves the name after save and reopen", () => {
        const harness = createMainHarness();
        harness.render();
        const scene = {
            type: "scene", version: "1.0.0", schemaVersion: 1,
            id: "scene-hierarchy-rename", name: "Main Scene",
            entities: [{ id: "entity-rename", name: "Before", type: "empty", components: [], children: [] }]
        };
        harness.runner.openScene(scene, "scenes/main.scene");
        harness.game.entities = {
            root: { id: "root", parentId: null, name: "Main Scene", type: "group", children: ["entity-rename"], active: true, locked: false, expanded: true },
            "entity-rename": { id: "entity-rename", parentId: "root", name: "Before", type: "empty", children: [], active: true, locked: false, expanded: false }
        };

        expect(harness.clickRenameEntity(harness.renderHierarchy(), "entity-rename", "After")).toBe(true);
        expect(harness.game.entities["entity-rename"].name).toBe("After");
        expect(harness.runner.currentScene.entities[0].name).toBe("After");
        const renameMessage = harness.notifications.filter(message => message.type === "editor:rename").pop();
        expect(renameMessage.payload).toEqual({ id: "entity-rename", name: "After" });

        harness.dispatchMenuEvent("save");
        harness.runner.closeScene();
        harness.runner.openScene(JSON.parse(harness.files.get("scenes/main.scene")), "scenes/main.scene");
        expect(harness.runner.currentScene.entities[0].name).toBe("After");
    });

    it("reparents a Hierarchy entity immediately and persists the new parent after reopen", () => {
        const harness = createMainHarness();
        harness.render();
        const scene = {
            type: "scene", version: "1.0.0", schemaVersion: 1,
            id: "scene-hierarchy-move", name: "Main Scene",
            entities: [
                { id: "parent", name: "Parent", type: "group", parentId: null, components: [], children: [
                    { id: "child", name: "Child", type: "empty", parentId: "parent", components: [], children: [] }
                ] },
                { id: "target", name: "Target", type: "group", parentId: null, components: [], children: [] }
            ]
        };
        harness.runner.openScene(scene, "scenes/main.scene");
        harness.game.entities = {
            root: { id: "root", parentId: null, name: "Main Scene", type: "group", children: ["parent", "target"], active: true, locked: false, expanded: true },
            parent: { id: "parent", parentId: "root", name: "Parent", type: "group", children: ["child"], active: true, locked: false, expanded: true },
            child: { id: "child", parentId: "parent", name: "Child", type: "empty", children: [], active: true, locked: false, expanded: false },
            target: { id: "target", parentId: "root", name: "Target", type: "group", children: [], active: true, locked: false, expanded: true }
        };

        expect(harness.clickMoveEntity(harness.renderHierarchy(), ["child"], "target", 0)).toBe(true);
        expect(harness.game.entities.parent.children).toEqual([]);
        expect(harness.game.entities.target.children).toEqual(["child"]);
        expect(harness.game.entities.child.parentId).toBe("target");
        expect(harness.runner.currentScene.entities[0].children).toEqual([]);
        expect(harness.runner.currentScene.entities[1].children[0].id).toBe("child");
        expect(harness.notifications.filter(message => message.type === "editor:move-entities")).toHaveLength(1);

        harness.dispatchMenuEvent("save");
        harness.runner.closeScene();
        harness.runner.openScene(JSON.parse(harness.files.get("scenes/main.scene")), "scenes/main.scene");
        expect(harness.runner.currentScene.entities[0].children).toEqual([]);
        expect(harness.runner.currentScene.entities[1].children[0].id).toBe("child");
    });

    it("persists a generic Inspector component edit through save, reopen, and runtime load", async () => {
        const harness = createMainHarness();
        const source = {
            type: "scene", version: "1.0.0", schemaVersion: 1,
            id: "scene-inspector-edit", name: "Inspector Edit",
            entities: [{
                id: "hero", name: "Hero", type: "empty",
                transform: { pos: { x: 0, y: 0 }, rot: 0, scale: { x: 1, y: 1 } },
                components: [{ type: "Sprite", props: { path: "hero.png", width: 16, height: 16 } }],
                children: []
            }]
        };
        harness.runner.openScene(source, "scenes/inspector-edit.scene");
        const entitySource = {
            id: "hero", name: "Hero", active: true,
            transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
            components: { Sprite: { path: "hero.png", width: 16, height: 16 } },
            sprite: { path: "hero.png", width: 16, height: 16, blendMode: "normal", color: "#fff" }
        };
        const helperPath = path.resolve("triton/src/lib/inspectorEntityData.ts");
        const helperBundle = buildSync({
            bundle: true, format: "cjs", platform: "node", write: false,
            stdin: { contents: fs.readFileSync(helperPath, "utf8"), loader: "ts", sourcefile: helperPath }
        }).outputFiles[0].text;
        const { applyInspectorFieldUpdate } = loadBundle(helperBundle, {});
        const inspectorPath = path.resolve("triton/src/components/panels/InspectorPanel.tsx");
        const inspectorBundle = buildSync({
            bundle: true,
            external: ["react", "react/jsx-runtime", "@/lib/utils", "lucide-react", "@/components/library", "@/context/GameContext", "./inspector/InspectorRegistry", "@/context/FileSystemContext", "@/lib/editorGameRunner"],
            format: "cjs",
            platform: "node",
            write: false,
            stdin: { contents: fs.readFileSync(inspectorPath, "utf8"), loader: "tsx", sourcefile: inspectorPath, resolveDir: path.dirname(inspectorPath) }
        }).outputFiles[0].text;
        let selectedEntityData = entitySource;
        let savedPath = null;
        const renderedComponents = [];
        const react = {
            createElement: (type, props, ...children) => ({
                type,
                props: { ...(props || {}), children: children.length > 1 ? children : children[0] }
            }),
            useState: initial => [initial, () => {}],
            useMemo: callback => callback(),
            useEffect() {},
            useCallback: callback => callback
        };
        const jsx = (type, props) => ({ type, props: props || {} });
        const modules = {
            react,
            "react/jsx-runtime": { jsx, jsxs: jsx },
            "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
            "lucide-react": new Proxy({}, { get: (_target, name) => String(name) }),
            "@/components/library": { ThemedInput: "ThemedInput" },
            "@/context/GameContext": { useGameContext: () => ({
                selectedEntityData, selectedIds: ["hero"], currentScenePath: "scenes/inspector-edit.scene",
                updateComponent: (id, component, field, value) => {
                    if (id === "hero") selectedEntityData = applyInspectorFieldUpdate(selectedEntityData, component, field, value);
                },
                notifyGame() {}
            }) },
            "./inspector/InspectorRegistry": { renderInspectorComponent: props => {
                renderedComponents.push(props);
                return { type: "InspectorComponent", props };
            } },
            "@/context/FileSystemContext": { useFileSystem: () => ({
                writeScene: async (filePath, scene) => {
                    savedPath = filePath;
                    harness.files.set(filePath, JSON.stringify(scene));
                    return true;
                }
            }) },
            "@/lib/editorGameRunner": { EditorGameRunner: harness.runner }
        };
        const componentModule = { exports: {} };
        vm.runInNewContext(inspectorBundle, {
            module: componentModule,
            exports: componentModule.exports,
            React: react,
            require: specifier => {
                if (!(specifier in modules)) throw new Error(`Unexpected InspectorPanel import: ${specifier}`);
                return modules[specifier];
            },
            window: { addEventListener() {}, removeEventListener() {} }
        });
        const tree = componentModule.exports.InspectorPanel({});
        const spriteEditor = renderedComponents.find(component => component.compId === "Sprite");
        expect(spriteEditor !== undefined).toBe(true);
        spriteEditor.updateHelpers.updateGeneric("Sprite", "width", 32);
        expect(selectedEntityData.components.Sprite.width).toBe(32);
        expect(harness.runner.currentScene.entities[0].components[0].props.width).toBe(32);

        const findSaveButton = node => {
            if (!node || typeof node !== "object") return null;
            if (node.type === "button" && node.props?.["aria-label"] === "Save scene") return node;
            const children = node.props?.children;
            for (const child of Array.isArray(children) ? children : [children]) {
                const found = findSaveButton(child);
                if (found) return found;
            }
            return null;
        };
        const saveButton = findSaveButton(tree);
        expect(saveButton !== null).toBe(true);
        saveButton.props.onClick();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(savedPath).toBe("scenes/inspector-edit.scene");

        harness.runner.closeScene();
        const reopened = harness.runner.openScene(JSON.parse(harness.files.get(savedPath)), savedPath);
        const originalImage = global.Image;
        global.Image = class { set src(_value) {} };
        try {
            const runtimeScene = await SceneLoader.parse(reopened);
            expect(runtimeScene.children[0].GetComponent(Sprite).width).toBe(32);
        } finally {
            global.Image = originalImage;
        }
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

    it("creates a HierarchyToolbar entity in the hierarchy and persists it through save and reopen", () => {
        const harness = createMainHarness();
        const source = {
            type: "scene", version: "1.0.0", schemaVersion: 1,
            id: "scene-main", name: "Main Scene", entities: []
        };
        harness.game.staleScene = JSON.parse(JSON.stringify(source));
        harness.game.entities = {
            root: { id: "root", parentId: null, name: "Main Scene", type: "group", children: [], active: true, locked: false, expanded: true }
        };
        harness.runner.openScene(source, "scenes/main.scene");
        harness.render();

        expect(harness.clickCreateEntity(harness.renderHierarchy(), "empty")).toBe(true);
        const createdId = harness.runner.currentScene.entities[0].id;
        expect(harness.game.entities.root.children).toEqual([createdId]);
        expect(harness.game.entities[createdId].name).toBe("New empty");
        const runtimeSceneLoad = harness.notifications.filter(message => message.type === "editor:load-scene").pop();
        expect(runtimeSceneLoad.payload.data.entities[0].id).toBe(createdId);

        harness.dispatchMenuEvent("save");
        harness.runner.closeScene();
        harness.runner.openScene(JSON.parse(harness.files.get("scenes/main.scene")), "scenes/main.scene");
        expect(harness.runner.currentScene.entities[0].id).toBe(createdId);
        expect(harness.runner.currentScene.entities[0].name).toBe("New empty");
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
        expect(harness.game.entities.root.children).toEqual(["source", duplicate.id]);
        expect(harness.game.entities[duplicate.id].children).toEqual([duplicate.children[0].id]);
        expect(harness.game.entities[duplicate.children[0].id].parentId).toBe(duplicate.id);
        expect(harness.game.entities[duplicate.children[0].id].name).toBe("Nested Source");
        const runtimeSceneLoad = harness.notifications.filter(message => message.type === "editor:load-scene").pop();
        expect(runtimeSceneLoad.payload.data.entities[1].id).toBe(duplicate.id);
        expect(runtimeSceneLoad.payload.data.entities[1].children[0].id).toBe(duplicate.children[0].id);

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

    it("persists deletion of a nested entity after File > Save, close, and reopen", () => {
        const harness = createMainHarness();
        const source = {
            type: "scene",
            version: "1.0.0",
            schemaVersion: 1,
            id: "scene-main",
            name: "Main Scene",
            entities: [{
                id: "parent",
                name: "Parent",
                type: "group",
                parentId: null,
                components: [],
                children: [{
                    id: "nested-delete-target",
                    name: "Delete Me",
                    type: "empty",
                    parentId: "parent",
                    components: [],
                    children: []
                }]
            }]
        };
        harness.runner.openScene(source, "scenes/main.scene");
        harness.render();

        expect(harness.runner.deleteEntity("nested-delete-target")).toBe(true);
        expect(harness.runner.isDirty).toBe(true);
        harness.dispatchMenuEvent("save");
        harness.runner.closeScene();
        harness.runner.openScene(JSON.parse(harness.files.get("scenes/main.scene")), "scenes/main.scene");

        const reopened = harness.runner.currentScene;
        expect(reopened.entities[0].id).toBe("parent");
        expect(reopened.entities[0].children).toEqual([]);
        expect(harness.runner.isDirty).toBe(false);
    });

    it("does not make a rejected scene read available to File > Save", () => {
        execFileSync(process.execPath, ["triton/tests/rejected-scene-save-harness.mjs"], {
            cwd: path.resolve("."),
            stdio: "pipe"
        });
        expect(true).toBe(true);
    });
});
