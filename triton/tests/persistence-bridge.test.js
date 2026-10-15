import fs from "fs";
import path from "path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { buildSync } from "esbuild";
import { describe, it, expect } from "../../tests/tester.js";

const root = path.resolve("triton");

function createMainHarness() {
    const source = fs.readFileSync(path.join(root, "src", "pages", "Main.tsx"), "utf8");
    const bundle = buildSync({
        bundle: true,
        format: "cjs",
        platform: "node",
        write: false,
        stdin: {
            contents: source,
            loader: "tsx",
            sourcefile: "Main.tsx"
        },
        external: [
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
            "@/context/GameContext"
        ]
    });

    const listeners = [];
    const writes = [];
    const hookSlots = [];
    const game = {
        openedScene: null
    };
    let hookIndex = 0;

    const react = {
        createElement() {
            return null;
        },
        useRef(initialValue) {
            const index = hookIndex++;
            if (!hookSlots[index]) hookSlots[index] = { current: initialValue };
            return hookSlots[index];
        },
        useState(initialValue) {
            const index = hookIndex++;
            if (!hookSlots[index]) hookSlots[index] = { value: initialValue };
            return [hookSlots[index].value, (value) => {
                hookSlots[index].value = typeof value === "function" ? value(hookSlots[index].value) : value;
            }];
        },
        useEffect(effect, dependencies) {
            const index = hookIndex++;
            const previous = hookSlots[index];
            const changed = !previous || !dependencies || dependencies.some((value, i) => value !== previous.dependencies?.[i]);
            if (!changed) return;
            previous?.cleanup?.();
            hookSlots[index] = { dependencies, cleanup: effect() };
        }
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

    const module = { exports: {} };
    const runtime = vm.runInNewContext(bundle.outputFiles[0].text, {
        console,
        React: react,
        Promise,
        setTimeout,
        clearTimeout,
        window: {
            document: { documentElement: { classList: { add() {} } } },
            addEventListener() {},
            removeEventListener() {}
        },
        module,
        exports: module.exports,
        require(specifier) {
            const modules = {
                react,
                "react/jsx-runtime": { jsx() { return null; }, jsxs() { return null; }, Fragment: Symbol("Fragment") },
                "@tauri-apps/api/event": { listen },
                "@tauri-apps/api/window": { getCurrentWindow: () => ({ setTitle: () => Promise.resolve() }) },
                "@tauri-apps/api/core": { invoke },
                "@/components/layout/DockLayout": { DockLayout: () => null },
                "@/components/layout/EditorToolbar": { EditorToolbar: () => null },
                "@/components/layout/StatusBar": { StatusBar: () => null },
                "@/pages/WelcomeScreen": { WelcomeScreen: () => null },
                "@/context/FileSystemContext": { useFileSystem: () => ({ loadProject: () => Promise.resolve(), readProject: () => Promise.resolve({}) }) },
                "@/context/GameContext": {
                    useGameContext: () => ({
                        saveScene: async () => {
                            if (!game.openedScene) throw new Error("Cannot save scene: no scene is open.");
                            await invoke("write_scene", {
                                path: "scenes/main.scene",
                                content: JSON.stringify(game.openedScene, null, 2)
                            });
                            return true;
                        }
                    })
                }
            };
            if (!(specifier in modules)) throw new Error(`Unexpected external import: ${specifier}`);
            return modules[specifier];
        }
    });

    const Main = module.exports.Main;
    const render = () => {
        hookIndex = 0;
        Main();
    };
    const dispatchMenuEvent = (payload) => {
        listeners.filter((listener) => listener.active).forEach((listener) => listener.handler({ payload }));
    };

    return { game, writes, listeners, render, dispatchMenuEvent };
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
        // A scene open changes GameContext's saveScene callback identity. The
        // rerender exercises Main's effect cleanup/re-subscription behavior.
        harness.render();
        harness.dispatchMenuEvent("save");

        expect(harness.listeners.filter((listener) => listener.active)).toHaveLength(1);
        expect(harness.writes).toHaveLength(1);
        expect(harness.writes[0].path).toBe("scenes/main.scene");
        expect(JSON.parse(harness.writes[0].content)).toEqual(harness.game.openedScene);
    });

    it("does not make a rejected scene read available to File > Save", () => {
        execFileSync(process.execPath, ["triton/tests/rejected-scene-save-harness.mjs"], {
            cwd: path.resolve("."),
            stdio: "pipe"
        });
        expect(true).toBe(true);
    });
});
