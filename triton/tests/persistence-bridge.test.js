import fs from "fs";
import path from "path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { buildSync } from "esbuild";
import { chromium } from "playwright";
import { Application } from "../../src/core/application.js";
import { SceneLoader } from "../../src/core/sceneLoader.js";
import { ComponentRegistry } from "../../src/core/componentRegistry.js";
import { Transform } from "../../src/components/transform.js";
import { Sprite } from "../../src/rendering/sprite.js";
import { BoxCollider } from "../../src/components/boxCollider.js";
import { SceneTransition } from "../../src/components/sceneTransition.js";
import { SpawnPoint } from "../../src/components/spawnPoint.js";
import { Dialogue } from "../../src/components/dialogue.js";
import { QuestDefinition } from "../../src/components/questDefinition.js";
import { EnemyConfig } from "../../src/components/enemyConfig.js";
import { Hitbox, Hurtbox, TriggerCollider } from "../../src/nereid/collider.js";
import { createEmptyTilemap, paintTileCell, paintTileCells, setCellMetadata, setTileMetadata, getTilesetPaletteIds, getTilesetTileOffset, getTilesetGridSize, getTilemapAttachError } from "../src/lib/tilemapAuthoring.mjs";
import { isSafeSceneAssetPath } from "../src/lib/sceneTransitionAuthoring.mjs";
import { describe, it, expect } from "../../tests/tester.js";

ComponentRegistry.register("SceneTransition", SceneTransition);
ComponentRegistry.register("SpawnPoint", SpawnPoint);
ComponentRegistry.register("Dialogue", Dialogue);
ComponentRegistry.register("QuestDefinition", QuestDefinition);
ComponentRegistry.register("EnemyConfig", EnemyConfig);
ComponentRegistry.register("TriggerCollider", TriggerCollider);
ComponentRegistry.register("Hitbox", Hitbox);
ComponentRegistry.register("Hurtbox", Hurtbox);
ComponentRegistry.register("Transform", Transform);
ComponentRegistry.register("Sprite", Sprite);
ComponentRegistry.register("BoxCollider", BoxCollider);

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
    const notifications = [];
    const addedEntities = [];
    const invokedCommands = [];
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
        invokedCommands.push(command);
        if (command === "write_scene") {
            writes.push(args);
        }
        return Promise.resolve(undefined);
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
                addEntityToHierarchy(entity, components) { addedEntities.push({ entity, components }); },
                notifyGame(type, payload) { notifications.push({ type, payload }); },
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
        return Main();
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

    const clickAddEntity = (node, type) => {
        if (Array.isArray(node)) return node.some(child => clickAddEntity(child, type));
        if (!node || typeof node !== "object") return false;
        if (node.type === "HierarchyToolbar" && typeof node.props?.onAddEntity === "function") {
            node.props.onAddEntity(type);
            return true;
        }
        const children = node.props?.children;
        return Array.isArray(children) ? children.some(child => clickAddEntity(child, type)) : clickAddEntity(children, type);
    };

    return { game, runner: runner.EditorGameRunner, files, writes, notifications, addedEntities, listeners, invokedCommands, render, renderHierarchy, clickDuplicate, clickAddEntity, dispatchMenuEvent, writeScene };
}

function loadBundle(bundle, context) {
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        console,
        Promise,
        CustomEvent,
        window: { dispatchEvent() {} },
        React: context.React,
        module,
        exports: module.exports,
        require: context.require || (() => { throw new Error("Unexpected import"); })
    });
    return module.exports;
}

function createGameContextHarness(scene) {
    const sourcefile = path.join(root, "src", "context", "GameContext.tsx");
    const bundle = buildSync({
        bundle: true,
        format: "cjs",
        platform: "node",
        write: false,
        stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "tsx", sourcefile, resolveDir: path.dirname(sourcefile) },
        external: ["react", "react/jsx-runtime", "./FileSystemContext"]
    }).outputFiles[0].text;
    const state = [];
    let cursor = 0;
    const context = { Provider: "GameContext.Provider" };
    const react = {
        createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children: children.length > 1 ? children : children[0] } }),
        createContext: () => context,
        useContext: () => context.value,
        useState(initial) {
            const index = cursor++;
            if (!(index in state)) state[index] = initial;
            return [state[index], value => {
                state[index] = typeof value === "function" ? value(state[index]) : value;
            }];
        },
        useCallback: callback => callback,
        useMemo: callback => callback(),
        useEffect() {}
    };
    const jsx = (type, props) => ({ type, props: props || {} });
    const modules = {
        react,
        "react/jsx-runtime": { jsx, jsxs: jsx },
        "./FileSystemContext": {
            useFileSystem: () => ({
                readScene: async () => scene,
                readProject: async () => ({}),
                writeProject: async () => true,
                writeScene: async () => true,
                rootPath: "/project"
            })
        }
    };
    const module = { exports: {} };
    vm.runInNewContext(bundle, {
        console,
        React: react,
        document: { querySelectorAll: () => [] },
        window: { dispatchEvent() {} },
        CustomEvent: class CustomEvent {},
        module,
        exports: module.exports,
        require: id => {
            if (!(id in modules)) throw new Error(`Unexpected GameContext dependency: ${id}`);
            return modules[id];
        }
    });
    const render = () => {
        cursor = 0;
        return module.exports.GameProvider({ children: null }).props.value;
    };
    return { render };
}

describe("Triton persistence bridge", () => {
    it("keeps Atlas modal examples out of the fake entity authoring path", () => {
        let modalConfig;
        const react = {
            createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children } }),
            useState: value => [value, () => {}]
        };
        const jsxRuntime = {
            jsx: (type, props) => ({ type, props: props || {} }),
            jsxs: (type, props) => ({ type, props: props || {} }),
            Fragment: Symbol("Fragment")
        };
        const library = new Proxy({
            useModal: () => ({ showModal: config => { modalConfig = config; } })
        }, { get: (target, key) => target[key] ?? String(key) });
        const icons = new Proxy({}, { get: (_target, key) => String(key) });
        const bundle = bundleSource(path.join(root, "src", "components", "panels", "StoryBook.tsx"), [
            "react", "react/jsx-runtime", "lucide-react", "@/components/library"
        ]);
        const component = loadBundle(bundle, {
            React: react,
            require: id => id === "react" ? react : id === "react/jsx-runtime" ? jsxRuntime : id === "lucide-react" ? icons : library
        }).StoryBook;
        const tree = component({});
        const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === "object"
            ? [node, ...visit(node.props?.children)]
            : [];
        const text = node => Array.isArray(node) ? node.map(text).join(" ")
            : node && typeof node === "object" ? text(node.props?.children)
                : String(node ?? "");
        const controls = visit(tree).filter(node => node.type === "ThemedMenuButton");
        const inputExample = controls.find(node => text(node.props.children).includes("Show Input Modal"));
        const confirmExample = controls.find(node => text(node.props.children).includes("Show Confirmation"));

        expect(Boolean(inputExample && confirmExample)).toBe(true);
        inputExample.props.onClick();
        expect(modalConfig.title).toBe("Input Modal");
        const inputText = text(modalConfig.content);
        expect(inputText.includes("Example Input")).toBe(true);
        expect(inputText.includes("Entity")).toBe(false);
        expect(modalConfig.confirmText).toBe("Done");
        confirmExample.props.onClick();
        expect(modalConfig.content.includes("deleting an entity")).toBe(false);
        expect(modalConfig.confirmText).toBe("Confirm");
    });

    it("opens scenes using the project-relative IDs returned by the filesystem scan", () => {
        let openedPath = null;
        const nodes = {
            root: { id: "root", parentId: null, name: "Project", type: "folder", children: ["scenes"] },
            scenes: { id: "scenes", parentId: "root", name: "scenes", type: "folder", children: ["scenes/main.scene"] },
            "scenes/main.scene": { id: "scenes/main.scene", parentId: "scenes", name: "main.scene", type: "scene", children: [], path: "/outside/fake.scene" }
        };
        const filesystem = {
            nodes,
            currentPath: ["root"],
            currentFolderId: "root",
            getChildren: id => (nodes[id]?.children || []).map(childId => nodes[childId]),
            navigateTo() {}, moveNode() {}, moveNodes() {}, createFolder() {}, createAsset() {},
            deleteNode() {}, renameNode() {}, duplicateNode() {}
        };
        const react = {
            createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children } }),
            useState: value => [value, () => {}],
            useEffect() {}
        };
        const library = new Proxy({}, { get: (_target, key) => String(key) });
        const icons = new Proxy({}, { get: (_target, key) => String(key) });
        const bundle = bundleSource(path.join(root, "src", "components", "panels", "ProjectPanel.tsx"), [
            "react", "react/jsx-runtime", "dockview", "lucide-react", "@/components/library",
            "@/context/FileSystemContext", "@/context/GameContext", "../project/ProjectSidebar", "../project/ProjectGrid"
        ]);
        const component = loadBundle(bundle, {
            React: react,
            require: id => id === "react" ? react
                : id === "react/jsx-runtime" ? { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: Symbol("Fragment") }
                    : id === "lucide-react" ? icons
                        : id === "@/context/FileSystemContext" ? { useFileSystem: () => filesystem }
                            : id === "@/context/GameContext" ? { useGameContext: () => ({ loadScene: scenePath => { openedPath = scenePath; } }) }
                                : library
        }).ProjectPanel;
        const tree = component({});
        const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === "object"
            ? [node, ...visit(node.props?.children)]
            : [];
        const grid = visit(tree).find(node => node.type === "ProjectGrid");

        expect(Boolean(grid)).toBe(true);
        grid.props.onNavigate("scenes/main.scene");
        expect(openedPath).toBe("scenes/main.scene");
    });

    it("assigns stable collision-free IDs to legacy entities before runtime hydration", () => {
        const { runner } = createMainHarness();
        const payload = runner.validateScene({
            type: "scene", version: "1.0.0", schemaVersion: 1, name: "Legacy IDs",
            layers: [{
                name: "Legacy Layer", type: "main", entities: [
                    { name: "Legacy Parent", children: [{ name: "Legacy Child" }] },
                    { id: "entity-0", name: "Existing ID", children: [] },
                    { name: "Second Legacy Entity", children: [] }
                ]
            }]
        });
        const parentId = payload.layers[0].entities[0].id;
        const childId = payload.layers[0].entities[0].children[0].id;
        expect([parentId, childId, payload.layers[0].entities[1].id, payload.layers[0].entities[2].id]).toEqual([
            "entity-1", "entity-2", "entity-0", "entity-3"
        ]);
        expect(runner.validateScene(payload).layers[0].entities[0].id).toBe(parentId);

        runner.openScene(payload, "scenes/legacy.scene");
        expect(runner.updateEntity(parentId, "transform", { position: { x: 8, y: 13 } })).toBe(true);
        const runtimeScene = SceneLoader.parse(runner.currentScene);
        const runtimeParent = runtimeScene.children[0].children[0];
        expect(runtimeParent.id).toBe(parentId);
        expect(runtimeParent.children[0].id).toBe(childId);
        const position = runtimeParent.GetComponent(Transform).position;
        expect({ x: position.x, y: position.y }).toEqual({ x: 8, y: 13 });
    });

    it("rejects duplicate scene entity IDs before accepting the scene", () => {
        const { runner } = createMainHarness();
        let rejected = false;
        try {
            runner.openScene({
                type: "scene", version: "1.0.0", schemaVersion: 1, name: "Duplicate IDs",
                entities: [{ id: "duplicate", name: "First", children: [] }, { id: "duplicate", name: "Second", children: [] }]
            }, "scenes/duplicate-ids.scene");
        } catch (error) {
            rejected = String(error).includes("Duplicate scene entity ID 'duplicate'");
        }
        expect(rejected).toBe(true);
        expect(runner.currentScene).toBe(null);
    });

    it("starts with project selection instead of auto-loading the debug sample", () => {
        const harness = createMainHarness();
        const welcome = harness.render();

        expect(welcome.type.name).toBe("WelcomeScreen");
        expect(harness.invokedCommands).toEqual([]);
    });

    it("hydrates root scene entities independently when the scene also has layers", () => {
        const game = fs.readFileSync(path.join(root, "src", "context", "GameContext.tsx"), "utf8");
        const layersIndex = game.indexOf("if (data.layers && Array.isArray(data.layers))");
        const rootEntitiesIndex = game.indexOf("if (data.entities && Array.isArray(data.entities))");
        expect(layersIndex >= 0).toBe(true);
        expect(rootEntitiesIndex > layersIndex).toBe(true);
        expect(game.slice(layersIndex, rootEntitiesIndex).includes("else if (data.entities")).toBe(false);
        expect(game.includes("parseEntityList(data.entities, 'root')")).toBe(true);
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
        expect(rust.includes("async fn read_audio_asset")).toBe(true);
        expect(rust.includes("read_audio_asset,\n")).toBe(true);
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

    it("offers spawn-point creation and keeps the authored type through persistence and runtime loading", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const loader = fs.readFileSync(path.resolve("src", "core", "sceneLoader.js"), "utf8");
        const runtime = fs.readFileSync(path.resolve("src", "neptune.js"), "utf8");

        expect(toolbar.includes("Create Spawn Point")).toBe(true);
        expect(toolbar.includes("onAddEntity('spawn-point')")).toBe(true);
        expect(hierarchy.includes("type === 'spawn-point' ? 'Spawn Point' : type === 'trigger-area' ? 'Trigger Area'")).toBe(true);
        expect(hierarchy.includes("type: 'SpawnPoint', props: { spawnId: id, facing: 'right' }")).toBe(true);
        expect(runtime.includes('ComponentRegistry.register("SpawnPoint", SpawnPoint)')).toBe(true);
        expect(hierarchy.includes("EditorGameRunner.createEntity(persistenceParentId, { id, name, type, components: entityComponents })")).toBe(true);
        expect(loader.includes('if (typeof entityData.type === "string") entity.type = entityData.type;')).toBe(true);
    });

    it("offers general entity creation with a serializable default Transform", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const engineTypes = fs.readFileSync(path.join(root, "src", "types", "engine.ts"), "utf8");

        expect(toolbar.includes("onClick={() => onAddEntity('entity')}>Create Entity")).toBe(true);
        expect(engineTypes.includes("'entity'")).toBe(true);
        expect(hierarchy.includes("type === 'entity' ? 'New Entity'")).toBe(true);
        expect(hierarchy.includes("type: 'Transform', props: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } }")).toBe(true);
        expect(hierarchy.includes("EditorGameRunner.createEntity(persistenceParentId, { id, name, type, components: entityComponents })")).toBe(true);
    });

    it("authors dialogue entities with editable runtime Dialogue properties", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const runtime = fs.readFileSync(path.resolve("src", "neptune.js"), "utf8");

        expect(toolbar.includes("onClick={() => onAddEntity('dialogue')}>Create Dialogue")).toBe(true);
        expect(hierarchy.includes("type === 'dialogue' ? 'Dialogue'")).toBe(true);
        expect(hierarchy.includes("type: 'Dialogue', props: { speaker: 'Speaker', text: 'Enter dialogue...', next: '' }")).toBe(true);
        expect(runtime.includes('ComponentRegistry.register("Dialogue", Dialogue)')).toBe(true);
    });

    it("authors quest entities with editable runtime objective properties", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const runtime = fs.readFileSync(path.resolve("src", "neptune.js"), "utf8");

        expect(toolbar.includes("onClick={() => onAddEntity('quest')}>Create Quest")).toBe(true);
        expect(hierarchy.includes("type === 'quest' ? 'Quest'")).toBe(true);
        expect(hierarchy.includes("type: 'QuestDefinition', props: { name: 'New Quest', description: 'Describe the quest...', objectiveId: 'objective-1', objective: 'Describe the objective...', required: 1 }")).toBe(true);
        expect(runtime.includes('ComponentRegistry.register("QuestDefinition", QuestDefinition)')).toBe(true);
    });

    it("authors enemy entities with editable runtime configuration properties", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const runtime = fs.readFileSync(path.resolve("src", "neptune.js"), "utf8");

        expect(toolbar.includes("onClick={() => onAddEntity('enemy')}>Create Enemy")).toBe(true);
        expect(hierarchy.includes("type === 'enemy' ? 'Enemy'")).toBe(true);
        expect(hierarchy.includes("type: 'EnemyConfig', props: { maxHealth: 100, moveSpeed: 2, contactDamage: 10, behavior: 'patrol' }")).toBe(true);
        expect(runtime.includes('ComponentRegistry.register("EnemyConfig", EnemyConfig)')).toBe(true);
    });

    it("authors scene transitions with destination data and a runtime trigger", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const inspector = fs.readFileSync(path.join(root, "src", "components", "panels", "inspector", "components", "GenericComponentSection.tsx"), "utf8");
        const runtime = fs.readFileSync(path.resolve("src", "neptune.js"), "utf8");
        const component = fs.readFileSync(path.resolve("src", "components", "sceneTransition.js"), "utf8");

        expect(toolbar.includes("Create Scene Transition")).toBe(true);
        expect(hierarchy.includes("type: 'SceneTransition', props: { targetScene: '', spawnPoint: '', trigger: 'enter' }")).toBe(true);
        expect(hierarchy.includes("{ type: 'TriggerCollider', props: { width: 1, height: 1, offsetX: 0, offsetY: 0 } }")).toBe(true);
        expect(component.includes('targetScene: ""')).toBe(true);
        expect(inspector.includes("const isSceneReference = lowerLabel === 'targetscene'")).toBe(true);
        expect(inspector.includes("isSafeSceneAssetPath(path)")).toBe(true);
        expect(inspector.includes("Drag a .scene file here...")).toBe(true);
        expect(runtime.includes('ComponentRegistry.register("SceneTransition", SceneTransition)')).toBe(true);
    });

    it("accepts only safe relative scene assets for transition drag-and-drop", () => {
        expect(isSafeSceneAssetPath("scenes/dungeon.scene")).toBe(true);
        expect(isSafeSceneAssetPath("dungeon.scene")).toBe(true);
        for (const path of ["", "scenes/", "../outside.scene", "scenes/../outside.scene", "/tmp/outside.scene", "scenes\\outside.scene", "scenes/data.json"]) {
            expect(isSafeSceneAssetPath(path)).toBe(false);
        }
    });

    it("keeps unsafe typed scene-transition paths out of persisted Inspector updates", () => {
        const updates = [];
        const hookSlots = [];
        let hookIndex = 0;
        const react = {
            createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children } }),
            useState(initialValue) {
                const index = hookIndex++;
                if (!(index in hookSlots)) hookSlots[index] = initialValue;
                return [hookSlots[index], value => { hookSlots[index] = typeof value === "function" ? value(hookSlots[index]) : value; }];
            },
            useEffect(effect, dependencies) {
                const index = hookIndex++;
                const previous = hookSlots[index];
                if (!previous || dependencies.some((value, i) => value !== previous.dependencies?.[i])) {
                    hookSlots[index] = { dependencies };
                    effect();
                }
            }
        };
        const jsxRuntime = {
            jsx: (type, props) => ({ type, props: props || {} }),
            jsxs: (type, props) => ({ type, props: props || {} }),
            Fragment: Symbol("Fragment")
        };
        const library = new Proxy({}, { get: (_target, key) => String(key) });
        const icons = new Proxy({}, { get: (_target, key) => String(key) });
        const bundle = bundleSource(path.join(root, "src", "components", "panels", "inspector", "components", "GenericComponentSection.tsx"), [
            "react", "react/jsx-runtime", "lucide-react", "../shared/ComponentSection", "../shared/PropertyRow",
            "@/components/library", "@/utils/colorUtils", "@/lib/sceneTransitionAuthoring.mjs"
        ]);
        const component = loadBundle(bundle, {
            React: react,
            require: id => id === "react" ? react
                : id === "react/jsx-runtime" ? jsxRuntime
                    : id === "lucide-react" ? icons
                        : id === "@/lib/sceneTransitionAuthoring.mjs" ? { isSafeSceneAssetPath }
                            : library
        }).GenericComponentSection;
        const tree = component({
            type: "SceneTransition",
            data: { targetScene: "scenes/start.scene" },
            entity: {},
            isActive: true,
            onToggleActive() {},
            onUpdate: (key, value) => updates.push([key, value])
        });
        const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === "object"
            ? [node, ...visit(node.props?.children)]
            : [];
        const property = visit(tree).find(node => typeof node.type === "function" && node.type.name === "PropertyField");
        const renderField = () => {
            hookIndex = 0;
            return visit(property.type(property.props)).find(node => node.type === "ThemedInput");
        };
        const input = renderField();

        input.props.onChange({ target: { value: "../outside.scene" } });
        const invalidDraft = renderField();
        expect(updates.length).toBe(0);
        expect(invalidDraft.props["aria-invalid"]).toBe(true);
        invalidDraft.props.onDrop({
            preventDefault() {},
            dataTransfer: { getData: () => "/outside.scene" }
        });
        expect(updates.length).toBe(0);
        invalidDraft.props.onChange({ target: { value: "scenes/next.scene" } });
        expect(updates[0]).toEqual(["targetScene", "scenes/next.scene"]);
    });

    it("edits short dialogue and quest narrative fields through multiline Inspector controls and restores them at runtime", async () => {
        const harness = createMainHarness();
        harness.runner.openScene({ type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-narrative-inspector", name: "Narrative Inspector", entities: [] }, "scenes/narrative.scene");
        harness.game.entities = { root: { id: "root", children: [] } };
        for (const type of ["dialogue", "quest"]) expect(harness.clickAddEntity(harness.renderHierarchy(), type)).toBe(true);

        const genericSectionPath = path.join(root, "src", "components", "panels", "inspector", "components", "GenericComponentSection.tsx");
        const genericSectionBundle = bundleSource(genericSectionPath, [
            "react", "react/jsx-runtime", "lucide-react", "../shared/ComponentSection", "../shared/PropertyRow",
            "@/components/library", "@/utils/colorUtils", "@/lib/sceneTransitionAuthoring.mjs"
        ]);
        const hookSlots = [];
        let hookIndex = 0;
        const react = {
            createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children } }),
            useState(initialValue) {
                const index = hookIndex++;
                if (!(index in hookSlots)) hookSlots[index] = initialValue;
                return [hookSlots[index], value => { hookSlots[index] = typeof value === "function" ? value(hookSlots[index]) : value; }];
            },
            useEffect() {}
        };
        const jsxRuntime = {
            jsx: (type, props) => ({ type, props: props || {} }),
            jsxs: (type, props) => ({ type, props: props || {} }),
            Fragment: Symbol("Fragment")
        };
        const library = new Proxy({}, { get: (_target, key) => String(key) });
        const icons = new Proxy({}, { get: (_target, key) => String(key) });
        const genericSection = loadBundle(genericSectionBundle, {
            React: react,
            require: id => id === "react" ? react
                : id === "react/jsx-runtime" ? jsxRuntime
                    : id === "lucide-react" ? icons
                        : id === "@/lib/sceneTransitionAuthoring.mjs" ? { isSafeSceneAssetPath }
                            : library
        }).GenericComponentSection;
        const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === "object"
            ? [node, ...visit(node.props?.children)]
            : [];
        const entities = Object.fromEntries(harness.runner.currentScene.entities.map(entity => [entity.type, entity]));
        const editNarrativeField = (entity, componentType, field, value) => {
            const componentData = entity.components.find(component => component.type === componentType).props;
            const tree = genericSection({ type: componentType, data: componentData, entity: {}, isActive: true, onToggleActive() {},
                onUpdate: (key, nextValue) => expect(harness.runner.updateEntity(entity.id, componentType, { [key]: nextValue })).toBe(true) });
            if (componentType === "QuestDefinition") {
                const objectiveId = visit(tree).find(node => node.type?.name === "PropertyField" && node.props.label === "objectiveId");
                hookIndex = 0;
                expect(visit(objectiveId.type(objectiveId.props)).some(node => node.type === "ThemedInput")).toBe(true);
            }
            const property = visit(tree).find(node => node.type?.name === "PropertyField" && node.props.label === field);
            expect(property).toBeDefined();
            hookIndex = 0;
            const control = visit(property.type(property.props)).find(node => node.type === "ThemedTextArea");
            expect(control).toBeDefined();
            control.props.onChange({ target: { value } });
        };

        editNarrativeField(entities.dialogue, "Dialogue", "text", "The gate is locked.");
        editNarrativeField(entities.quest, "QuestDefinition", "description", "Find the brass key.");
        editNarrativeField(entities.quest, "QuestDefinition", "objective", "Search the old tower.");
        const authoredQuest = entities.quest.components.find(component => component.type === "QuestDefinition").props;
        expect(authoredQuest).toEqual({ name: "New Quest", description: "Find the brass key.", objectiveId: "objective-1", objective: "Search the old tower.", required: 1 });

        await harness.writeScene("scenes/narrative.scene", harness.runner.currentScene);
        const saved = harness.files.get("scenes/narrative.scene");
        expect(saved).toBeDefined();
        const reopened = harness.runner.openScene(JSON.parse(saved), "scenes/narrative.scene");
        const runtimeScene = SceneLoader.parse(reopened);
        const runtimeDialogue = runtimeScene.children.find(entity => entity.type === "dialogue");
        const runtimeQuest = runtimeScene.children.find(entity => entity.type === "quest");
        expect(runtimeDialogue.GetComponent(Dialogue).properties.text).toBe("The gate is locked.");
        expect(runtimeQuest.GetComponent(QuestDefinition).properties).toEqual(authoredQuest);
    });

    it("offers trigger-area creation as a typed scene entity that survives runtime loading", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const engineTypes = fs.readFileSync(path.join(root, "src", "types", "engine.ts"), "utf8");
        const runtime = fs.readFileSync(path.resolve("src", "neptune.js"), "utf8");
        const loader = fs.readFileSync(path.resolve("src", "core", "sceneLoader.js"), "utf8");

        expect(toolbar.includes("Create Trigger Area")).toBe(true);
        expect(toolbar.includes("onAddEntity('trigger-area')")).toBe(true);
        expect(hierarchy.includes("type === 'trigger-area' ? 'Trigger Area'")).toBe(true);
        expect(engineTypes.includes("'trigger-area'")).toBe(true);
        expect(runtime.includes('ComponentRegistry.register("TriggerCollider", TriggerCollider)')).toBe(true);
        expect(hierarchy.includes("type: 'TriggerCollider', props: { width: 1, height: 1, offsetX: 0, offsetY: 0 }")).toBe(true);
        expect(loader.includes('if (typeof entityData.type === "string") entity.type = entityData.type;')).toBe(true);
    });

    it("offers hitbox and hurtbox creation with runtime combat collider components", () => {
        const toolbar = fs.readFileSync(path.join(root, "src", "components", "panels", "hierarchy", "HierarchyToolbar.tsx"), "utf8");
        const hierarchy = fs.readFileSync(path.join(root, "src", "components", "panels", "HierarchyPanel.tsx"), "utf8");
        const engineTypes = fs.readFileSync(path.join(root, "src", "types", "engine.ts"), "utf8");
        const runtime = fs.readFileSync(path.resolve("src", "neptune.js"), "utf8");

        for (const [type, component] of [["hitbox", "Hitbox"], ["hurtbox", "Hurtbox"]]) {
            expect(toolbar.includes(`onAddEntity('${type}')`)).toBe(true);
            expect(engineTypes.includes(`'${type}'`)).toBe(true);
            expect(hierarchy.includes(`type === '${type}'`)).toBe(true);
            expect(runtime.includes(`ComponentRegistry.register("${component}", ${component})`)).toBe(true);
            expect(hierarchy.includes(`type: '${component}', props: { width: 1, height: 1, offsetX: 0, offsetY: 0 }`)).toBe(true);
        }
    });

    it("uses live EntityData in the production Inspector without mock entity casts", () => {
        const inspector = fs.readFileSync(path.join(root, "src", "components", "panels", "InspectorPanel.tsx"), "utf8");
        const registry = fs.readFileSync(path.join(root, "src", "components", "panels", "inspector", "InspectorRegistry.tsx"), "utf8");
        const updateHelper = fs.readFileSync(path.join(root, "src", "lib", "inspectorComponentUpdate.ts"), "utf8");

        expect(inspector.includes('import type { EntityData } from "@/types/engine"')).toBe(true);
        expect(inspector.includes("const entity: EntityData = selectedEntityData")).toBe(true);
        expect(inspector.includes("MockEntity")).toBe(false);
        expect(inspector.includes("as any as")).toBe(false);
        expect(inspector.includes("applyInspectorComponentUpdate({")).toBe(true);
        expect(updateHelper.includes("component.toLowerCase() === 'tilemap' && currentScenePath")).toBe(true);
        expect(updateHelper.includes("notifyGame('editor:load-scene'")).toBe(true);
        expect(registry.includes('import type { EntityData } from "@/types/engine"')).toBe(true);
        expect(registry.includes("entity: EntityData")).toBe(true);
        expect(registry.includes("entity.components[compId]")).toBe(true);
        expect(registry.includes("MockEntity")).toBe(false);
    });

    it("reloads runtime views after the Inspector changes a tilemap layer", () => {
        const bundle = bundleSource(path.join(root, "src", "lib", "inspectorComponentUpdate.ts"), []);
        const { applyInspectorComponentUpdate } = loadBundle(bundle, {});
        const editorGameRunner = {
            currentScene: { layers: [{ id: "map-layer", src: "maps/old.map" }] },
            updateEntity(id, component, data) {
                if (id !== "map-layer" || component.toLowerCase() !== "tilemap") return false;
                this.currentScene.layers[0].src = data.src;
                return true;
            }
        };
        const updates = [];
        const notifications = [];

        expect(applyInspectorComponentUpdate({
            id: "map-layer",
            component: "Tilemap",
            key: "src",
            value: "maps/edited.map",
            updateComponent: (...args) => updates.push(args),
            editorGameRunner,
            currentScenePath: "scenes/main.scene",
            notifyGame: (type, payload) => notifications.push({ type, payload })
        })).toBe(true);

        expect(updates[0][0]).toBe("map-layer");
        expect(editorGameRunner.currentScene.layers[0].src).toBe("maps/edited.map");
        expect(notifications).toHaveLength(1);
        expect(notifications[0].type).toBe("editor:load-scene");
        expect(notifications[0].payload.path).toBe("scenes/main.scene");
        expect(notifications[0].payload.data.layers[0].src).toBe("maps/edited.map");
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

    it("keeps production hierarchy and Inspector cache synchronized for a new gameplay entity", async () => {
        const harness = createGameContextHarness({
            type: "scene",
            version: "1.0.0",
            schemaVersion: 1,
            id: "scene-context-authoring",
            name: "Context Authoring",
            entities: []
        });
        let context = harness.render();
        await context.loadScene("scenes/context.scene");

        context = harness.render();
        const entity = {
            id: "context-hitbox",
            parentId: "root",
            name: "Context Hitbox",
            type: "hitbox",
            children: [],
            active: true,
            locked: false,
            expanded: false
        };
        const components = [{ type: "Hitbox", props: { width: 3, height: 5, offsetX: 1, offsetY: -2 } }];
        context.addEntityToHierarchy(entity, components);

        context = harness.render();
        expect(context.entities.root.children.join(",")).toBe("context-hitbox");
        expect(context.entities["context-hitbox"].name).toBe("Context Hitbox");
        context.selectEntity("context-hitbox", false);

        context = harness.render();
        expect(context.selectedEntityData.id).toBe("context-hitbox");
        expect(context.selectedEntityData.components.Hitbox).toEqual(components[0].props);
        expect(context.selectedEntityData.transform.position).toEqual({ x: 0, y: 0 });
    });

    it("authors dialogue, quest, enemy, and transition entities through the hierarchy and loads saved components in the runtime", async () => {
        const harness = createMainHarness();
        harness.runner.openScene({ type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-gameplay-authoring", name: "Gameplay Authoring", entities: [] }, "scenes/gameplay.scene");
        harness.game.entities = { root: { id: "root", children: [] } };

        for (const type of ["dialogue", "quest", "enemy", "scene-transition", "spawn-point", "trigger-area", "hitbox", "hurtbox"]) {
            expect(harness.clickAddEntity(harness.renderHierarchy(), type)).toBe(true);
        }

        expect(harness.addedEntities).toHaveLength(8);
        expect(harness.addedEntities.every(({ entity, components }) => entity.id && entity.parentId === "root" && Array.isArray(components))).toBe(true);
        const runtimeNotifications = harness.notifications.filter(({ type }) => type === "editor:create-entity");
        expect(runtimeNotifications).toHaveLength(8);
        expect(runtimeNotifications.every(({ payload }) => payload.parentId === "root" && payload.transform && Array.isArray(payload.components))).toBe(true);

        const authored = harness.runner.currentScene.entities;
        const byType = Object.fromEntries(authored.map(entity => [entity.type, entity]));
        expect(byType.dialogue).toBeDefined();
        expect(byType.quest).toBeDefined();
        expect(byType.enemy).toBeDefined();
        expect(byType["scene-transition"]).toBeDefined();
        expect(harness.runner.updateEntity(byType.dialogue.id, "Dialogue", { speaker: "Guide", text: "Find the key", next: "key-found" })).toBe(true);
        expect(harness.runner.updateEntity(byType.quest.id, "QuestDefinition", { name: "Key Hunt", description: "Recover the key", objectiveId: "find-key", objective: "Find the key", required: 1 })).toBe(true);
        expect(harness.runner.updateEntity(byType.enemy.id, "EnemyConfig", { maxHealth: 75, moveSpeed: 3, contactDamage: 12, behavior: "guard" })).toBe(true);
        expect(harness.runner.updateEntity(byType["scene-transition"].id, "SceneTransition", { targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" })).toBe(true);
        expect(harness.runner.updateEntity(byType.hitbox.id, "Hitbox", { width: 12, height: 6, offsetX: 1, offsetY: -2 })).toBe(true);
        expect(harness.runner.updateEntity(byType.hurtbox.id, "Hurtbox", { width: 11, height: 7, offsetX: -3, offsetY: 4 })).toBe(true);
        expect(harness.runner.updateEntity(byType["trigger-area"].id, "TriggerCollider", { width: 13, height: 6, offsetX: 2, offsetY: -5 })).toBe(true);
        expect(harness.runner.createEntity("root", {
            id: "box-collider",
            name: "Resized Box Collider",
            type: "box-collider",
            components: [{ type: "BoxCollider", props: { size: { x: 4, y: 3 }, offset: { x: 2, y: -3 } } }]
        })).toBe(true);
        expect(harness.runner.updateEntity("box-collider", "BoxCollider", { size: { x: 14, y: 8 } })).toBe(true);

        await harness.writeScene("scenes/gameplay.scene", harness.runner.currentScene);
        const saved = harness.files.get("scenes/gameplay.scene");
        expect(saved).toBeDefined();
        harness.runner.closeScene();
        const reopened = harness.runner.openScene(JSON.parse(saved), "scenes/gameplay.scene");
        const runtimeScene = SceneLoader.parse(reopened);
        const runtimeByType = Object.fromEntries(runtimeScene.children.map(entity => [entity.type, entity]));

        expect(runtimeByType.dialogue.GetComponent(Dialogue).properties).toEqual({ speaker: "Guide", text: "Find the key", next: "key-found" });
        expect(runtimeByType.quest.GetComponent(QuestDefinition).properties).toEqual({ name: "Key Hunt", description: "Recover the key", objectiveId: "find-key", objective: "Find the key", required: 1 });
        expect(runtimeByType.enemy.GetComponent(EnemyConfig).properties).toEqual({ maxHealth: 75, moveSpeed: 3, contactDamage: 12, behavior: "guard" });
        expect(runtimeByType["scene-transition"].GetComponent(SceneTransition).properties).toEqual({ targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" });
        expect(runtimeByType["scene-transition"].GetComponent(TriggerCollider)).toBeDefined();
        expect(runtimeByType["spawn-point"].GetComponent(SpawnPoint).properties).toEqual({ spawnId: runtimeByType["spawn-point"].id, facing: "right" });
        const runtimeTrigger = runtimeByType["trigger-area"].GetComponent(TriggerCollider);
        expect({ width: runtimeTrigger.width, height: runtimeTrigger.height, offsetX: runtimeTrigger.offsetX, offsetY: runtimeTrigger.offsetY }).toEqual({ width: 13, height: 6, offsetX: 2, offsetY: -5 });
        const runtimeHitbox = runtimeByType.hitbox.GetComponent(Hitbox);
        expect({ width: runtimeHitbox.width, height: runtimeHitbox.height, offsetX: runtimeHitbox.offsetX, offsetY: runtimeHitbox.offsetY }).toEqual({ width: 12, height: 6, offsetX: 1, offsetY: -2 });
        const runtimeHurtbox = runtimeByType.hurtbox.GetComponent(Hurtbox);
        expect({ width: runtimeHurtbox.width, height: runtimeHurtbox.height, offsetX: runtimeHurtbox.offsetX, offsetY: runtimeHurtbox.offsetY }).toEqual({ width: 11, height: 7, offsetX: -3, offsetY: 4 });
        const runtimeBoxCollider = runtimeByType["box-collider"].GetComponent(BoxCollider);
        expect({ x: runtimeBoxCollider.size.x, y: runtimeBoxCollider.size.y }).toEqual({ x: 14, y: 8 });
        expect({ x: runtimeBoxCollider.offset.x, y: runtimeBoxCollider.offset.y }).toEqual({ x: 2, y: -3 });
    });

    it("loads editor-created scene transition output in the runtime after save and reopen", async () => {
        const harness = createMainHarness();
        harness.runner.openScene({ type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-transition-integration", name: "Transition Integration", entities: [] }, "scenes/main.scene");
        expect(harness.runner.createEntity("root", {
            id: "door-to-dungeon",
            name: "Dungeon Door",
            type: "scene-transition",
            components: [
                { type: "SceneTransition", props: { targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" } },
                { type: "TriggerCollider", props: { width: 1, height: 2, offsetX: 0, offsetY: 0 } }
            ]
        })).toBe(true);

        const savedPayload = JSON.parse(JSON.stringify(harness.runner.currentScene));
        const runtimeScene = SceneLoader.parse(savedPayload);
        const runtimeEntity = runtimeScene.children[0];
        expect(runtimeEntity.GetComponent(SceneTransition).properties).toEqual({ targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" });
        expect(runtimeEntity.GetComponent(TriggerCollider).height).toBe(2);
    });

    it("saves and reloads a positioned editor-authored spawn point in the runtime", async () => {
        const harness = createMainHarness();
        harness.runner.openScene({ type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-spawn-point", name: "Spawn Point Scene", entities: [] }, "scenes/spawn-point.scene");
        harness.game.entities = { root: { id: "root", children: [] } };
        expect(harness.clickAddEntity(harness.renderHierarchy(), "spawn-point")).toBe(true);
        const authored = harness.runner.currentScene.entities[0];
        expect(authored.name).toBe("Spawn Point");
        expect(authored.type).toBe("spawn-point");
        expect(authored.components[0].type).toBe("SpawnPoint");
        expect(harness.runner.updateEntity(authored.id, "SpawnPoint", { spawnId: "dungeon-entrance", facing: "left" })).toBe(true);
        expect(harness.runner.updateEntity(authored.id, "transform", {
            position: { x: 14, y: 28 }, rotation: 0, scale: { x: 1, y: 1 }
        })).toBe(true);

        await harness.writeScene("scenes/spawn-point.scene", harness.runner.currentScene);
        const saved = harness.files.get("scenes/spawn-point.scene");
        expect(saved).toBeDefined();
        harness.runner.closeScene();
        const reopened = harness.runner.openScene(JSON.parse(saved), "scenes/spawn-point.scene");
        const runtimeScene = SceneLoader.parse(reopened);
        const runtimeEntity = runtimeScene.children.find(entity => entity.name === "Spawn Point");

        expect(runtimeEntity).toBeDefined();
        const position = runtimeEntity.GetComponent(Transform).position;
        expect({ x: position.x, y: position.y }).toEqual({ x: 14, y: 28 });
        expect(runtimeEntity.GetComponent(SpawnPoint).properties).toEqual({ spawnId: "dungeon-entrance", facing: "left" });
    });

    it("loads the saved editor-authored scene through the runtime SceneLoader", async () => {
        const harness = createMainHarness();
        const authored = {
            type: "scene",
            version: "1.0.0",
            schemaVersion: 1,
            id: "scene-runtime-smoke",
            name: "Runtime Smoke",
            entities: []
        };
        harness.runner.openScene(authored, "scenes/runtime-smoke.scene");
        expect(harness.runner.createEntity("root", {
            id: "authored-spawn",
            name: "Player Spawn",
            type: "spawn-point",
            components: [
                { type: "SceneTransition", props: { targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" } },
                { type: "TriggerCollider", props: { width: 1, height: 2, offsetX: 0, offsetY: 0 } }
            ]
        })).toBe(true);

        await harness.writeScene("scenes/runtime-smoke.scene", harness.runner.currentScene);
        const stored = harness.files.get("scenes/runtime-smoke.scene");
        expect(stored).toBeDefined();
        harness.runner.closeScene();
        const reopened = harness.runner.openScene(JSON.parse(stored), "scenes/runtime-smoke.scene");
        const runtimeScene = SceneLoader.parse(reopened);
        const runtimeEntity = runtimeScene.children.find(entity => entity.name === "Player Spawn");
        expect(runtimeEntity).toBeDefined();
        expect(runtimeEntity.GetComponent(SceneTransition).properties).toEqual({ targetScene: "scenes/dungeon.scene", spawnPoint: "entrance", trigger: "interact" });
        expect(runtimeEntity.GetComponent(TriggerCollider).height).toBe(2);
    });

    it("derives a bounded tileset grid from the loaded atlas dimensions", () => {
        expect(getTilesetGridSize(64, 32, 16)).toEqual({ columns: 4, rows: 2, tileCount: 8 });
        expect(() => getTilesetGridSize(8, 32, 16)).toThrow("at least one complete tile");
    });

    it("paints a tile and persists TilemapPanel collision and navigation metadata from its UI controls", async () => {
        const source = path.join(root, "src", "components", "panels", "TilemapPanel.tsx");
        const bundle = bundleSource(source, [
            "react", "react/jsx-runtime", "@tauri-apps/api/core", "@/context/FileSystemContext",
            "@/context/GameContext", "@/lib/tilemapAuthoring.mjs"
        ]);
        const hookSlots = [];
        let hookIndex = 0;
        const react = {
            createElement: (type, props, ...children) => ({
                type,
                props: { ...(props || {}), ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) }
            }),
            useMemo(callback) {
                hookIndex++;
                return callback();
            },
            useState(initialValue) {
                const index = hookIndex++;
                if (!(index in hookSlots)) hookSlots[index] = initialValue;
                return [hookSlots[index], value => {
                    hookSlots[index] = typeof value === "function" ? value(hookSlots[index]) : value;
                }];
            },
            useEffect(effect, dependencies) {
                const index = hookIndex++;
                const previous = hookSlots[index];
                if (previous && dependencies?.every((value, i) => value === previous.dependencies?.[i])) return;
                previous?.cleanup?.();
                hookSlots[index] = { dependencies, cleanup: effect() };
            }
        };
        const jsxRuntime = {
            jsx: (type, props) => ({ type, props: props || {} }),
            jsxs: (type, props) => ({ type, props: props || {} }),
            Fragment: Symbol("Fragment")
        };
        const mapPath = "maps/level.map";
        const initialMap = {
            width: 2,
            height: 2,
            columns: 2,
            tileCount: 64,
            tileSize: 16,
            tileset: "assets/tiles.png",
            data: [0, 0, 0, 0]
        };
        const storedFiles = new Map([[mapPath, JSON.stringify(initialMap)]]);
        const loadCalls = [];
        const fileSystem = {
            nodes: {
                [mapPath]: { id: mapPath, name: "level.map", type: "file" },
                "assets/tiles.png": { id: "assets/tiles.png", name: "tiles.png", type: "image" }
            },
            rootPath: "/project",
            readFile: filePath => Promise.resolve(storedFiles.get(filePath) ?? null),
            writeFile: (filePath, content) => {
                storedFiles.set(filePath, content);
                return Promise.resolve(true);
            },
            refresh: () => Promise.resolve()
        };
        const gameContext = {
            currentScenePath: "scenes/main.scene",
            loadScene: scenePath => { loadCalls.push(scenePath); return Promise.resolve(); },
            addTilemapLayer: () => true
        };
        const modules = {
            react,
            "react/jsx-runtime": jsxRuntime,
            "@tauri-apps/api/core": { invoke: () => Promise.resolve("data:image/png;base64,AA==") },
            "@/context/FileSystemContext": { useFileSystem: () => fileSystem },
            "@/context/GameContext": { useGameContext: () => gameContext },
            "@/lib/tilemapAuthoring.mjs": {
                createEmptyTilemap, paintTileCells, setCellMetadata, setTileMetadata,
                getTilesetPaletteIds, getTilesetTileOffset, getTilesetGridSize, getTilemapAttachError
            }
        };
        const component = loadBundle(bundle, {
            React: react,
            require: specifier => {
                if (!(specifier in modules)) throw new Error(`Unexpected TilemapPanel import: ${specifier}`);
                return modules[specifier];
            }
        }).TilemapPanel;
        const render = () => {
            hookIndex = 0;
            return component({});
        };
        const find = (node, predicate) => {
            if (Array.isArray(node)) {
                for (const child of node) {
                    const result = find(child, predicate);
                    if (result) return result;
                }
                return null;
            }
            if (!node || typeof node !== "object") return null;
            if (predicate(node)) return node;
            return find(node.props?.children, predicate);
        };
        const byLabel = (tree, label) => find(tree, node => node.props?.["aria-label"] === label);
        const findAll = (node, predicate, matches = []) => {
            if (Array.isArray(node)) {
                for (const child of node) findAll(child, predicate, matches);
            } else if (node && typeof node === "object") {
                if (predicate(node)) matches.push(node);
                findAll(node.props?.children, predicate, matches);
            }
            return matches;
        };
        const connectGridCells = (grid, labelPrefix = "Paint cell") => {
            const rows = findAll(grid, node => node.props?.role === "row");
            const rowElements = rows.map(() => ({ children: [] }));
            const gridElement = { children: rowElements };
            rows.forEach((row, rowIndex) => {
                const rowElement = rowElements[rowIndex];
                rowElement.parentElement = gridElement;
                rowElement.children = findAll(row, node => node.type === "button" && node.props?.["aria-label"]?.startsWith(labelPrefix));
                rowElement.children.forEach(cell => {
                    cell.parentElement = rowElement;
                    cell.focus = () => cell.props.onFocus();
                });
            });
            return findAll(grid, node => node.type === "button" && node.props?.["aria-label"]?.startsWith(labelPrefix));
        };

        render();
        await Promise.resolve();
        render();
        await Promise.resolve();
        let tree = render();
        await Promise.resolve();
        tree = render();
        const atlasImage = find(tree, node => node.type === "img" && node.props?.alt === "Tileset atlas");
        expect(atlasImage).toBeDefined();
        const paintCellWhileLoading = byLabel(tree, "Paint cell 1, 0; tile 0");
        expect(paintCellWhileLoading.props.disabled).toBe(true);
        paintCellWhileLoading.props.onClick();
        tree = render();
        expect(byLabel(tree, "Paint cell 1, 0; tile 0")).toBeDefined();
        const atlasImageAfterPaintAttempt = find(tree, node => node.type === "img" && node.props?.alt === "Tileset atlas");
        expect(atlasImageAfterPaintAttempt).toBeDefined();
        atlasImageAfterPaintAttempt.props.onLoad({ currentTarget: { naturalWidth: 64, naturalHeight: 32 } });
        tree = render();
        expect(byLabel(tree, "Tileset palette tile count").props.value).toBe(8);
        byLabel(tree, "Tileset palette tile count").props.onChange({ target: { value: "64" } });
        tree = render();
        expect(byLabel(tree, "Tileset palette tile count").props.value).toBe(8);
        expect(byLabel(tree, "Tile ID to paint").props.max).toBe(7);
        byLabel(tree, "Tile ID to paint").props.onChange({ target: { value: "64" } });
        tree = render();
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(7);
        byLabel(tree, "Tileset palette tile count").props.onChange({ target: { value: "4" } });
        tree = render();
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(3);
        byLabel(tree, "Tileset palette tile count").props.onChange({ target: { value: "64" } });
        tree = render();
        expect(byLabel(tree, "Tileset palette tile count").props.value).toBe(8);
        expect(byLabel(tree, "Atlas columns").props.max).toBe(4);
        byLabel(tree, "Atlas columns").props.onChange({ target: { value: "5" } });
        tree = render();
        expect(byLabel(tree, "Atlas columns").props.value).toBe(4);
        byLabel(tree, "Atlas columns").props.onChange({ target: { value: "2" } });
        tree = render();
        expect(byLabel(tree, "Tileset palette tile count").props.value).toBe(4);
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(3);
        byLabel(tree, "Atlas columns").props.onChange({ target: { value: "4" } });
        tree = render();
        byLabel(tree, "Tileset palette tile count").props.onChange({ target: { value: "64" } });
        tree = render();
        expect(byLabel(tree, "Tileset palette tile count").props.value).toBe(8);
        byLabel(tree, "Tile ID to paint").props.onChange({ target: { value: "3" } });
        tree = render();

        let paletteGrid = byLabel(tree, "Tileset keyboard palette");
        expect(paletteGrid.props.role).toBe("grid");
        expect(paletteGrid.props["aria-rowcount"]).toBe(2);
        expect(paletteGrid.props["aria-colcount"]).toBe(4);
        let paletteCells = connectGridCells(paletteGrid, "Select tileset tile");
        expect(paletteCells).toHaveLength(8);
        expect(paletteCells[3].props["aria-selected"]).toBe(true);
        expect(paletteCells.map(cell => cell.props.tabIndex)).toEqual([-1, -1, -1, 0, -1, -1, -1, -1]);

        let paletteArrowPrevented = false;
        paletteCells[3].props.onKeyDown({
            key: "ArrowLeft",
            currentTarget: paletteCells[3],
            preventDefault() { paletteArrowPrevented = true; }
        });
        expect(paletteArrowPrevented).toBe(true);
        tree = render();
        paletteGrid = byLabel(tree, "Tileset keyboard palette");
        paletteCells = connectGridCells(paletteGrid, "Select tileset tile");
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(2);
        expect(byLabel(tree, "Tile 2 walkability")).toBeDefined();
        expect(paletteCells.map(cell => cell.props.tabIndex)).toEqual([-1, -1, 0, -1, -1, -1, -1, -1]);

        paletteCells[2].props.onKeyDown({
            key: "ArrowRight",
            currentTarget: paletteCells[2],
            preventDefault() {}
        });
        tree = render();
        paletteGrid = byLabel(tree, "Tileset keyboard palette");
        paletteCells = connectGridCells(paletteGrid, "Select tileset tile");
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(3);

        let paletteBoundaryPrevented = false;
        paletteCells[3].props.onKeyDown({
            key: "ArrowRight",
            currentTarget: paletteCells[3],
            preventDefault() { paletteBoundaryPrevented = true; }
        });
        expect(paletteBoundaryPrevented).toBe(false, "right navigation must not wrap to the next palette row");
        paletteCells[3].props.onKeyDown({ key: "ArrowDown", currentTarget: paletteCells[3], preventDefault() {} });
        tree = render();
        paletteGrid = byLabel(tree, "Tileset keyboard palette");
        paletteCells = connectGridCells(paletteGrid, "Select tileset tile");
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(7);
        let partialRowBoundaryPrevented = false;
        paletteCells[7].props.onKeyDown({
            key: "ArrowDown",
            currentTarget: paletteCells[7],
            preventDefault() { partialRowBoundaryPrevented = true; }
        });
        expect(partialRowBoundaryPrevented).toBe(false);
        paletteCells[7].props.onKeyDown({ key: "ArrowUp", currentTarget: paletteCells[7], preventDefault() {} });
        tree = render();
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(3);
        expect(byLabel(tree, "Paint cell 1, 0; tile 0")).toBeDefined();

        const paintGrid = byLabel(tree, "Tilemap paint grid");
        expect(paintGrid.props.role).toBe("grid");
        expect(paintGrid.props["aria-rowcount"]).toBe(2);
        expect(paintGrid.props["aria-colcount"]).toBe(2);
        const cells = connectGridCells(paintGrid);
        expect(findAll(paintGrid, node => node.props?.role === "row")).toHaveLength(2);
        expect(cells.map(cell => cell.props.tabIndex)).toEqual([0, -1, -1, -1]);
        expect(cells.map(cell => cell.props.role)).toEqual(["gridcell", "gridcell", "gridcell", "gridcell"]);

        cells[0].props.onFocus();
        tree = render();
        expect(byLabel(tree, "Cell 0, 0 collision")).toBeDefined();

        let arrowPrevented = false;
        cells[0].props.onKeyDown({
            key: "ArrowRight",
            currentTarget: cells[0],
            preventDefault() { arrowPrevented = true; }
        });
        expect(arrowPrevented).toBe(true);
        tree = render();
        let activeCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        expect(activeCells.map(cell => cell.props.tabIndex)).toEqual([-1, 0, -1, -1]);
        expect(byLabel(tree, "Cell 1, 0 collision")).toBeDefined();
        expect(byLabel(tree, "Paint cell 1, 0; tile 0")).toBeDefined();

        let boundaryPrevented = false;
        activeCells[1].props.onKeyDown({
            key: "ArrowRight",
            currentTarget: activeCells[1],
            preventDefault() { boundaryPrevented = true; }
        });
        expect(boundaryPrevented).toBe(false);

        let downPrevented = false;
        activeCells[1].props.onKeyDown({
            key: "ArrowDown",
            currentTarget: activeCells[1],
            preventDefault() { downPrevented = true; }
        });
        expect(downPrevented).toBe(true);
        tree = render();
        activeCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        expect(activeCells.map(cell => cell.props.tabIndex)).toEqual([-1, -1, -1, 0]);
        expect(byLabel(tree, "Cell 1, 1 collision")).toBeDefined();
        expect(byLabel(tree, "Paint cell 1, 0; tile 0")).toBeDefined();

        let upPrevented = false;
        activeCells[3].props.onKeyDown({
            key: "ArrowUp",
            currentTarget: activeCells[3],
            preventDefault() { upPrevented = true; }
        });
        expect(upPrevented).toBe(true);
        tree = render();
        activeCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        expect(activeCells.map(cell => cell.props.tabIndex)).toEqual([-1, 0, -1, -1]);

        let enterPrevented = false;
        activeCells[1].props.onKeyDown({
            key: "Enter",
            currentTarget: activeCells[1],
            preventDefault() { enterPrevented = true; }
        });
        expect(enterPrevented).toBe(true);
        tree = render();
        expect(byLabel(tree, "Paint cell 1, 0; tile 3")).toBeDefined();

        activeCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        let spacePrevented = false;
        activeCells[1].props.onKeyDown({
            key: " ",
            currentTarget: activeCells[1],
            preventDefault() { spacePrevented = true; }
        });
        expect(spacePrevented).toBe(true);
        tree = render();
        expect(byLabel(tree, "Paint cell 1, 0; tile 3")).toBeDefined();
        byLabel(tree, "Tile 3 collision").props.onChange({ target: { value: "true" } });
        tree = render();
        byLabel(tree, "Tile 3 walkability").props.onChange({ target: { value: "false" } });
        tree = render();
        byLabel(tree, "Tile 3 terrain").props.onChange({ target: { value: "stone" } });
        tree = render();
        let metadataCell = find(tree, node => node.props?.role === "gridcell"
            && node.props?.["aria-label"]?.startsWith("Paint cell 1, 0; tile 3"));
        expect(metadataCell.props["aria-label"]).toContain("solid collision (tile default)");
        expect(metadataCell.props["aria-label"]).toContain("blocked (tile default)");
        expect(metadataCell.props["aria-label"]).toContain("terrain stone (tile default)");
        let indicators = findAll(metadataCell, node => node.props?.["data-metadata-indicator"] !== undefined);
        expect(indicators.map(node => node.props["data-metadata-indicator"])).toEqual(["collision", "walkability", "terrain"]);
        expect(indicators.map(node => node.props["data-metadata-value"])).toEqual(["true", "false", "stone"]);

        byLabel(tree, "Cell 1, 0 collision").props.onChange({ target: { value: "false" } });
        tree = render();
        byLabel(tree, "Cell 1, 0 walkability").props.onChange({ target: { value: "true" } });
        tree = render();
        byLabel(tree, "Cell 1, 0 terrain").props.onChange({ target: { value: "moss" } });
        tree = render();
        metadataCell = find(tree, node => node.props?.role === "gridcell"
            && node.props?.["aria-label"]?.startsWith("Paint cell 1, 0; tile 3"));
        expect(metadataCell.props["aria-label"]).toContain("non-solid collision (cell override)");
        expect(metadataCell.props["aria-label"]).toContain("walkable (cell override)");
        expect(metadataCell.props["aria-label"]).toContain("terrain moss (cell override)");
        expect(metadataCell.props.title).toContain("non-solid collision (cell override)");
        expect(metadataCell.props.title).toContain("walkable (cell override)");
        expect(metadataCell.props.title).toContain("terrain moss (cell override)");
        indicators = findAll(metadataCell, node => node.props?.["data-metadata-indicator"] !== undefined);
        expect(indicators.map(node => node.props["data-metadata-value"])).toEqual(["false", "true", "moss"]);

        byLabel(tree, "Tile ID to paint").props.onChange({ target: { value: "1" } });
        tree = render();
        byLabel(tree, "Tile 1 collision").props.onChange({ target: { value: "false" } });
        tree = render();
        byLabel(tree, "Tile 1 walkability").props.onChange({ target: { value: "true" } });
        tree = render();
        activeCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        activeCells[0].props.onClick();
        tree = render();
        byLabel(tree, "Tile ID to paint").props.onChange({ target: { value: "3" } });
        tree = render();

        byLabel(tree, "Tilemap brush mode").props.onChange({ target: { value: "collision" } });
        tree = render();
        expect(byLabel(tree, "Collision brush").props.value).toBe("true");
        let brushCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        brushCells[0].props.onMouseDown({ preventDefault() {} });
        tree = render();
        brushCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        brushCells[2].props.onMouseEnter();
        tree = render();
        const gridSurface = find(tree, node => node.props?.onMouseUp && node.props?.onMouseLeave);
        gridSurface.props.onMouseUp();
        tree = render();
        for (const index of [0, 2]) {
            const tileId = index === 0 ? 1 : 0;
            const cell = find(tree, node => node.props?.role === "gridcell"
                && node.props?.["aria-label"]?.startsWith(`Paint cell ${index % 2}, ${Math.floor(index / 2)}; tile ${tileId}`));
            expect(cell.props["aria-label"]).toContain("solid collision (cell override)");
            expect(find(cell, node => node.props?.["data-metadata-indicator"] === "collision").props["data-metadata-value"]).toBe("true");
        }

        byLabel(tree, "Collision brush").props.onChange({ target: { value: "inherit" } });
        tree = render();
        brushCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        let inheritBrushPrevented = false;
        brushCells[0].props.onKeyDown({
            key: "Enter", currentTarget: brushCells[0],
            preventDefault() { inheritBrushPrevented = true; }
        });
        expect(inheritBrushPrevented).toBe(true);
        tree = render();
        const inheritedCell = find(tree, node => node.props?.role === "gridcell"
            && node.props?.["aria-label"]?.startsWith("Paint cell 0, 0; tile 1"));
        expect(inheritedCell.props["aria-label"]).toContain("non-solid collision (tile default)");

        byLabel(tree, "Tilemap brush mode").props.onChange({ target: { value: "walkability" } });
        tree = render();
        byLabel(tree, "Navigation brush").props.onChange({ target: { value: "false" } });
        tree = render();
        brushCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        let navigationBrushPrevented = false;
        brushCells[3].props.onKeyDown({
            key: " ", currentTarget: brushCells[3],
            preventDefault() { navigationBrushPrevented = true; }
        });
        expect(navigationBrushPrevented).toBe(true);
        tree = render();
        const blockedCell = find(tree, node => node.props?.role === "gridcell"
            && node.props?.["aria-label"]?.startsWith("Paint cell 1, 1; tile 0"));
        expect(blockedCell.props["aria-label"]).toContain("blocked (cell override)");

        byLabel(tree, "Tilemap brush mode").props.onChange({ target: { value: "terrain" } });
        tree = render();
        byLabel(tree, "Terrain brush").props.onChange({ target: { value: "mud" } });
        tree = render();
        brushCells = connectGridCells(byLabel(tree, "Tilemap paint grid"));
        let terrainBrushPrevented = false;
        brushCells[2].props.onKeyDown({
            key: "Enter", currentTarget: brushCells[2],
            preventDefault() { terrainBrushPrevented = true; }
        });
        expect(terrainBrushPrevented).toBe(true);
        tree = render();
        const mudCell = find(tree, node => node.props?.role === "gridcell"
            && node.props?.["aria-label"]?.startsWith("Paint cell 0, 1; tile 0"));
        expect(mudCell.props["aria-label"]).toContain("terrain mud (cell override)");

        const saveButton = find(tree, node => node.type === "button" && node.props?.children === "Save Map");
        expect(saveButton).toBeDefined();
        saveButton.props.onClick();
        await new Promise(resolve => setTimeout(resolve, 0));

        const savedMap = JSON.parse(storedFiles.get(mapPath));
        expect(savedMap.data).toEqual([1, 3, 0, 0]);
        expect(savedMap.columns).toBe(4);
        expect(savedMap.tileCount).toBe(8);
        expect(savedMap.metadata["1"]).toEqual({ collision: false, walkable: true });
        expect(savedMap.metadata["3"]).toEqual({ collision: true, walkable: false, terrain: "stone" });
        expect(savedMap.cellMetadata["1"]).toEqual({ collision: false, walkable: true, terrain: "moss" });
        expect(Object.hasOwn(savedMap.cellMetadata, "0")).toBe(false);
        expect(savedMap.cellMetadata["2"]).toEqual({ collision: true, terrain: "mud" });
        expect(savedMap.cellMetadata["3"]).toEqual({ walkable: false });
        expect(savedMap.data).toEqual([1, 3, 0, 0]);
        expect(loadCalls).toEqual(["scenes/main.scene"]);

        const runtimeHarness = createMainHarness();
        runtimeHarness.runner.openScene({
            type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-tilemap-panel-runtime",
            name: "Tilemap Panel Runtime", entities: [], layers: []
        }, "scenes/main.scene");
        const runtimeLayer = runtimeHarness.runner.createTilemapLayer(mapPath);
        expect(runtimeLayer.src).toBe(mapPath);
        await runtimeHarness.writeScene("scenes/main.scene", runtimeHarness.runner.currentScene);
        const savedScene = JSON.parse(runtimeHarness.files.get("scenes/main.scene"));
        const originalFetch = global.fetch;
        const originalImage = global.Image;
        const originalDocument = global.document;
        const originalWindow = global.window;
        const elements = new Map();
        const makeElement = () => ({
            style: {},
            setAttribute(name, value) {
                this[name] = value;
                if (name === "id") this.id = value;
            },
            appendChild(child) {
                if (child.id) elements.set(child.id, child);
                return child;
            },
            focus() {},
            remove() {},
            getContext() { return {}; }
        });
        global.document = {
            getElementById: id => elements.get(id) || null,
            createElement: makeElement,
            body: makeElement(),
            head: makeElement()
        };
        global.window = { innerWidth: 800, innerHeight: 600, outerWidth: 800, outerHeight: 600 };
        global.Image = class { set src(_value) {} };
        global.fetch = async source => {
            expect(source).toBe(mapPath);
            return { ok: true, json: async () => JSON.parse(JSON.stringify(savedMap)) };
        };
        try {
            const application = new Application();
            await application.loadScene(savedScene);
            const runtimeScene = application.scene;
            const runtimeTile = runtimeScene.children.find(entity => entity.name === "Tile_1");
            expect(runtimeTile.tileId).toBe(3);
            expect(runtimeTile.tileMetadata).toEqual({ collision: false, walkable: true, terrain: "moss" });
            expect(runtimeTile.GetComponent(BoxCollider)).toBeUndefined();
            expect(runtimeTile.GetComponent(Sprite).path).toBe("assets/tiles.png");

            const navigationMap = runtimeScene.getNavigationTilemap(mapPath);
            expect(navigationMap.data).toEqual([0, 2, -1, -1]);
            expect(navigationMap.getTileMetadata(2)).toEqual({ collision: true, walkable: false, terrain: "stone" });
            expect(navigationMap.getTileMetadata(0)).toEqual({ collision: false, walkable: true });
            expect(navigationMap.getResolvedMetadata(1, 0)).toEqual({ collision: false, walkable: true, terrain: "moss" });
            expect(navigationMap.getResolvedMetadata(0, 0)).toEqual({ collision: false, walkable: true });
            expect(navigationMap.getResolvedMetadata(0, 1)).toEqual({ collision: true, terrain: "mud" });
            expect(navigationMap.getResolvedMetadata(1, 1)).toEqual({ walkable: false });
            expect(navigationMap.isWalkable(1, 0)).toBe(true);
            expect(navigationMap.findPath(0, 0, 1, 0)).toEqual([{ x: 1, y: 0 }]);
            navigationMap.setCellMetadata(1, 0, { walkable: false });
            expect(navigationMap.isWalkable(1, 0)).toBe(false);
            expect(navigationMap.findPath(0, 0, 1, 0)).toBe(null);
        } finally {
            global.fetch = originalFetch;
            if (originalImage === undefined) delete global.Image;
            else global.Image = originalImage;
            if (originalDocument === undefined) delete global.document;
            else global.document = originalDocument;
            if (originalWindow === undefined) delete global.window;
            else global.window = originalWindow;
        }

        tree = render();
        byLabel(tree, "Tile size in pixels").props.onChange({ target: { value: "32" } });
        tree = render();
        expect(byLabel(tree, "Tileset palette tile count").props.value).toBe(2);
        expect(byLabel(tree, "Tile ID to paint").props.value).toBe(1);
        const resizedSaveButton = find(tree, node => node.type === "button" && node.props?.children === "Save Map");
        expect(resizedSaveButton).toBeDefined();
        resizedSaveButton.props.onClick();
        await new Promise(resolve => setTimeout(resolve, 0));
        const resizedMap = JSON.parse(storedFiles.get(mapPath));
        expect(resizedMap.tileSize).toBe(32);
        expect(resizedMap.columns).toBe(2);
        expect(resizedMap.tileCount).toBe(2);

        const failedAtlas = find(tree, node => node.type === "img" && node.props?.alt === "Tileset atlas");
        expect(failedAtlas).toBeDefined();
        failedAtlas.props.onError();
        tree = render();
        expect(byLabel(tree, "Tileset palette unavailable")).toBeDefined();
        expect(find(tree, node => node.props?.["aria-label"] === "Tileset keyboard palette")).toBe(null);
        expect(byLabel(tree, "Tile ID to paint").props.disabled).toBe(true);
    });

    it("saves and loads a TilemapPanel map attached to an editor-authored scene", async () => {
        const harness = createMainHarness();
        harness.runner.openScene({ type: "scene", version: "1.0.0", schemaVersion: 1, id: "scene-tilemap", name: "Tilemap Scene", entities: [], layers: [] }, "scenes/tilemap.scene");
        const layer = harness.runner.createTilemapLayer("maps/level.map");
        expect(layer).not.toBe(null);
        expect(layer.name).toBe("level");
        expect(layer.src).toBe("maps/level.map");
        expect(harness.runner.createTilemapLayer("../outside.map")).toBe(null);
        expect(harness.runner.createTilemapLayer("maps/invalid.json")).toBe(null);
        expect(harness.runner.updateEntity(layer.id, "Tilemap", { src: "maps/edited.map" })).toBe(true);
        expect(harness.runner.updateEntity(layer.id, "Tilemap", { src: "../outside.map" })).toBe(false);
        expect(harness.runner.updateEntity(layer.id, "name", { value: "Edited Level" })).toBe(true);
        const editedLayer = { ...layer, name: "Edited Level", src: "maps/edited.map" };

        await harness.writeScene("scenes/tilemap.scene", harness.runner.currentScene);
        harness.runner.closeScene();
        const reopened = harness.runner.openScene(JSON.parse(harness.files.get("scenes/tilemap.scene")), "scenes/tilemap.scene");
        expect(reopened.layers).toEqual([editedLayer]);

        const authoredMap = paintTileCell(createEmptyTilemap({
            name: "edited.map",
            width: 1,
            height: 1,
            tileset: "tiles.png"
        }), 0, 0, 1);
        const originalFetch = global.fetch;
        const originalImage = global.Image;
        global.Image = class { set src(_value) {} };
        global.fetch = async source => {
            expect(source).toBe("maps/edited.map");
            return {
                ok: true,
                json: async () => JSON.parse(JSON.stringify(authoredMap))
            };
        };
        try {
            const runtimeScene = await SceneLoader.parse(reopened);
            expect(runtimeScene.children).toHaveLength(1);
            expect(runtimeScene.children[0].name).toBe("Tile_0");

            const runtimeBundle = buildSync({
                bundle: true,
                format: "iife",
                globalName: "EditorRuntimeSmoke",
                platform: "browser",
                write: false,
                stdin: {
                    contents: `
                        import { SceneLoader } from "./src/core/sceneLoader.js";
                        import { ComponentRegistry } from "./src/core/componentRegistry.js";
                        import { Transform } from "./src/components/transform.js";
                        import { Sprite } from "./src/rendering/sprite.js";
                        import { BoxCollider } from "./src/components/boxCollider.js";
                        ComponentRegistry.register("Transform", Transform);
                        ComponentRegistry.register("Sprite", Sprite);
                        ComponentRegistry.register("BoxCollider", BoxCollider);
                        export { Sprite };
                        export const loadEditorScene = payload => SceneLoader.parse(payload);
                    `,
                    resolveDir: process.cwd(),
                    sourcefile: "editor-runtime-smoke.js"
                }
            }).outputFiles[0].text;
            const browser = await chromium.launch({ headless: true });
            try {
                const page = await browser.newPage();
                await page.setContent("<!doctype html><html><body></body></html>");
                await page.evaluate(mapPayload => {
                    window.fetch = async () => ({
                        ok: true,
                        json: async () => mapPayload
                    });
                }, JSON.parse(JSON.stringify(authoredMap)));
                await page.addScriptTag({ content: runtimeBundle });
                const browserRuntime = await page.evaluate(async payload => {
                    const scene = await EditorRuntimeSmoke.loadEditorScene(payload);
                    const tile = scene.children[0];
                    return {
                        count: scene.children.length,
                        name: tile.name,
                        spritePath: tile.GetComponent(EditorRuntimeSmoke.Sprite).path
                    };
                }, reopened);
                expect(browserRuntime.count).toBe(1);
                expect(browserRuntime.name).toBe("Tile_0");
                expect(browserRuntime.spritePath).toBe("tiles.png");
            } finally {
                await browser.close();
            }
        } finally {
            global.fetch = originalFetch;
            global.Image = originalImage;
        }
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
