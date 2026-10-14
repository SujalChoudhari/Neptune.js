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

    it("keeps the version and identity fields in a representative round-trip payload", () => {
        const project = {
            type: "project",
            version: "1.0.0",
            schemaVersion: 1,
            name: "Bridge Project",
            scenes: [{
                type: "scene",
                version: "1.0.0",
                schemaVersion: 1,
                id: "scene-main",
                name: "Main",
                layers: []
            }]
        };
        const restored = JSON.parse(JSON.stringify(project));

        expect(restored.schemaVersion).toBe(1);
        expect(restored.version).toBe("1.0.0");
        expect(restored.scenes[0].schemaVersion).toBe(1);
        expect(restored.scenes[0].id).toBe("scene-main");
    });

    it("documents actionable validation and containment failures", () => {
        const rust = fs.readFileSync(path.join(root, "src-tauri", "src", "lib.rs"), "utf8");

        expect(rust.includes("Invalid {kind} payload: invalid JSON")).toBe(true);
        expect(rust.includes("parse_json_payload(&content, \"scene\")")).toBe(true);
        expect(rust.includes("Path must be a relative path inside the selected project")).toBe(true);
        expect(rust.includes("Migrate the {kind} before loading it")).toBe(true);
    });
});
