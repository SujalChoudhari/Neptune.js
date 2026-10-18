import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guideUrl = new URL("../docs/tutorials/editor-api.md", import.meta.url);

test("editor API guide matches the filesystem context and native command boundary", async () => {
    const guide = await readFile(guideUrl, "utf8");
    const context = await readFile(new URL("../triton/src/context/FileSystemContext.tsx", import.meta.url), "utf8");
    const native = await readFile(new URL("../triton/src-tauri/src/lib.rs", import.meta.url), "utf8");
    const bridgeTests = await readFile(new URL("../triton/tests/persistence-bridge.test.js", import.meta.url), "utf8");

    for (const method of [
        "loadProject", "refresh", "navigateTo", "navigateUp", "getChildren", "moveNodes",
        "moveNode", "createFolder", "createAsset", "deleteNode", "renameNode", "duplicateNode",
        "readFile", "writeFile", "readProject", "writeProject", "readScene", "writeScene"
    ]) {
        assert.ok(context.includes(method), `FileSystemContext should expose ${method}`);
        assert.ok(guide.includes(method), `guide should document ${method}`);
    }
    for (const command of [
        "initialize_project", "scan_project", "create_directory", "create_asset", "move_fs_node",
        "rename_fs_node", "duplicate_fs_node", "delete_fs_node", "read_file", "write_file",
        "read_project", "write_project", "read_scene", "write_scene", "sync_neptune_lib"
    ]) {
        assert.ok(native.includes(command), `native editor should implement ${command}`);
        assert.ok(guide.includes(command), `guide should document ${command}`);
    }
    assert.match(native, /Path must be a relative path inside the selected project/);
    assert.match(native, /RESOURCE_REFERENCE_INVALID/);
    assert.match(bridgeTests, /project_and_scene_commands_round_trip_through_selected_root/);
    assert.match(guide, /directory duplication is not supported/);
});
