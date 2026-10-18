# Triton editor API: project files and scene data

Triton is Neptune's Tauri editor. Its React `FileSystemProvider` exposes project browsing and persistence through `useFileSystem()`. Native commands in `triton/src-tauri/src/lib.rs` scope filesystem operations to the selected project root; renderer code should pass project-relative paths, never arbitrary host paths.

## Select and scan a project

The editor initializes a selected project root with the native `initialize_project` command, then loads its file tree with `loadProject`. `initialize_project` creates a versioned `project.npt` marker when one is absent, validates an existing marker before selecting the root, and returns whether initialization succeeded.

```tsx
import { FileSystemProvider, useFileSystem } from "./context/FileSystemContext";
import { invoke } from "@tauri-apps/api/core";

function ProjectBrowser() {
  const { nodes, rootPath, isLoading, loadProject, refresh, getChildren } = useFileSystem();

  async function openProject(absolutePath: string) {
    await invoke("initialize_project", { path: absolutePath });
    await loadProject(absolutePath);
  }

  // Render getChildren("root") and the current loading/project state.
  return null;
}

function App() {
  return <FileSystemProvider><ProjectBrowser /></FileSystemProvider>;
}
```

`loadProject(path, preserveNavigation?)` scans the already-selected root using the relative root path `.`. `refresh()` repeats that scan and preserves the current folder. `navigateTo(folderId)` and `navigateUp()` change the browser location; `getChildren(id)` returns folders first, then alphabetically sorted files. File node IDs are project-relative paths, with `root` representing the root node.

## Filesystem context methods

`useFileSystem()` must be called below `FileSystemProvider`. Its context includes:

- `createFolder(parentId, name)` and `createAsset(parentId, name, type)` create entries and refresh the tree; return the created relative path or `null` on failure. Asset types include folder, image, script, scene, material, audio, prefab, model, and file. New scripts/scenes get simple starter content.
- `moveNodes(nodeIds, targetFolderId)` moves nodes to a project-relative folder; `moveNode` is its single-node convenience wrapper. `renameNode(nodeId, newName)`, `duplicateNode(nodeId)`, and `deleteNode(nodeId)` refresh after the operation. These wrappers log native failures rather than throwing to the caller.
- `readFile(path)` returns text or `null` on failure; `writeFile(path, content)` returns `true` or `false`.
- `readProject()` / `writeProject(project)` read or write the versioned `project.npt` payload. `readScene(path)` / `writeScene(path, scene)` operate on a scene file at a project-relative path. Project/scene read and write errors are thrown with contextual messages.

For operations that need reliable error handling, wrap calls in `try/catch` and check boolean/null results rather than assuming a logged error rejects the promise.

## Native command boundary and data validation

The Tauri command API includes `initialize_project`, `scan_project`, `create_directory`, `create_asset`, `move_fs_node`, `rename_fs_node`, `duplicate_fs_node`, `delete_fs_node`, `read_file`, `write_file`, `read_project`, `write_project`, `read_scene`, `write_scene`, and `sync_neptune_lib`. Command arguments use camelCase in the renderer (for example `invoke("move_fs_node", { source, target })`).

Filesystem commands resolve paths beneath the selected project root and reject absolute paths, traversal, and symlink escapes. `rename_fs_node` accepts a single sibling name. File duplication creates a unique sibling copy; directory duplication is not supported. `write_project` and `write_scene` parse and normalize versioned JSON and validate resource references before overwriting files. Invalid JSON, unsupported schema versions, and missing/invalid resource references are errors, not silently repaired content. Project and scene payloads use schema version 1; consult Neptune's [runtime save/load guide](../../docs/tutorials/save-load.md) for game-owned save slots, which are a separate format.

The editor persistence bridge has native tests for selected-root containment, project/scene round trips, and rejection before overwriting existing data. See `triton/tests/persistence-bridge.test.js` and the Rust unit tests in `triton/src-tauri/src/lib.rs` when extending this boundary.
