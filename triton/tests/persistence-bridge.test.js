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
                addEntityToHierarchy(entity) {
                    game.entities = appendHierarchyEntity(game.entities || {}, entity);
                },
                addEntityBranchToHierarchy(branch, parentId) {
                    game.entities = appendHierarchyBranch(game.entities || {}, branch, parentId);
                },
                moveEntities() {},
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

    return { game, runner: runner.EditorGameRunner, files, writes, listeners, notifications, render, renderHierarchy, clickDuplicate, clickCreateEntity, dispatchMenuEvent };
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
