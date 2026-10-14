import fs from "fs";
import path from "path";
import { describe, it, expect } from "../../tests/tester.js";

const root = path.resolve("triton");

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

    it("keeps File > Save bound to the current scene callback after opening a scene", () => {
        const main = fs.readFileSync(path.join(root, "src", "pages", "Main.tsx"), "utf8");
        const game = fs.readFileSync(path.join(root, "src", "context", "GameContext.tsx"), "utf8");

        expect(main.includes("case 'save':\n                    void saveScene()")).toBe(true);
        expect(main.includes("    }, [saveScene])")).toBe(true);
        expect(game.includes("return writeScene(currentScenePath, scene);")).toBe(true);
        expect(game.includes("if (!currentScenePath)")).toBe(true);
    });
});
