import fs from "fs";
import path from "path";
import { describe, it, expect } from "./tester.js";

const tritonRoot = path.resolve("triton");

describe("Triton Editor", () => {
    it("contains required front-end entry points", () => {
        const appTsx = path.join(tritonRoot, "src", "App.tsx");
        const mainTsx = path.join(tritonRoot, "src", "main.tsx");

        expect(fs.existsSync(appTsx)).toBe(true);
        expect(fs.existsSync(mainTsx)).toBe(true);
    });

    it("registers core tauri commands for file-system operations", () => {
        const rustLib = fs.readFileSync(path.join(tritonRoot, "src-tauri", "src", "lib.rs"), "utf8");
        const requiredCommands = [
            "initialize_project",
            "scan_project",
            "create_directory",
            "create_asset",
            "delete_fs_node",
            "rename_fs_node",
            "duplicate_fs_node",
            "read_file",
            "write_file"
        ];

        for (const command of requiredCommands) {
            expect(rustLib.includes(command)).toBe(true);
        }
    });
});
