# Triton Editor Audit Report

**Date**: 2026-02-02
**Target**: Triton Editor (Neptune.js Tooling)
**Reference**: `static/triton_editor_srs.md` & `static/triton_editor_tsd.md`

## Executive Summary
The Triton Editor has a solid **Application Shell** and **File System** implementation, but lacks the core **Game Editing** capabilities. The UI is polished and "Vercel-level" aesthetic, but the "Editors" (Scene, Inspector, Rig) are largely mocked or non-functional placeholders.

**Completion Status**: ~35%
- ✅ **Shell & Files**: 90%
- ⚠️ **Core Editing**: 10% (UI only, no logic)
- ❌ **Specialized Editors**: 0% (Rig, Tilemap, Dialogue)

---

## Detailed Requirement Analysis

### 1. Project & Asset Management (Priority: Critical)
**Status**: 🟢 **Implemented**
*   **Backend (`lib.rs`)**: Full CRUD support (`create_directory`, `create_asset`, `delete`, `rename`, `move`).
*   **Frontend (`ProjectPanel`)**: Fully functional. Connects to `FileSystemContext`. Supports drag-and-drop, context menus, and navigation.
*   **Asset Discovery**: `scan_project` is implemented and recursive.
*   **Issues**: Directory duplication is explicitly not supported in backend yet.

### 2. Scene Editor
**Status**: 🔴 **Critical Missing**
*   **SRS Usage**: Canvas viewport with pan/zoom, entity manipulation, layer management.
*   **Actual**: `GameViewPanel.tsx` is an `<iframe>` that simply loads the running game.
*   **Deficiency**: There are no gizmos, no selection syncing, no ability to move entities, and no "Edit Mode". It is a "Game Player", not a "Scene Editor".

### 3. Inspector & Entity System
**Status**: 🟡 **Mocked / Partial**
*   **SRS Usage**: Edit component properties of selected entities.
*   **Actual**: `InspectorPanel.tsx` is hardcoded to use `MOCK_ENTITY`.
*   **Deficiency**:
    *   The UI components (inputs, sliders, sections) are built and beautiful.
    *   **No connection** to the backend or the active game state.
    *   Changing values in Inspector does nothing to the game object.

### 4. Rigging & Animation
**Status**: 🔴 **Missing**
*   **SRS Usage**: Dedicated Rig Editor for assigning body parts and animating.
*   **Actual**: `AtlasPanel.tsx` exists but is a **Component Library** (a showcase of buttons/inputs), NOT a Rig Editor.
*   **Deficiency**: Feature is completely unimplemented.

### 5. Tilemap Editor
**Status**: 🔴 **Missing**
*   **SRS Usage**: Paint tiles, collision marking.
*   **Actual**: No traces found in codebase.

### 6. Console
**Status**: 🟢 **Implemented**
*   **Actual**: `GameViewPanel` successfully bridges `console.log` from the iframe to the parent window via `postMessage`. `ConsolePanel.tsx` (observed in file list) likely renders these.

---

## Technical Debt & Mismatches

1.  **AtlasPanel Misnomer**: The file `AtlasPanel.tsx` is currently a "UI Kit" demo, not the "Texture Atlas" or "Rig" editor implied by the name/SRS.
2.  **Iframe Isolation**: The decision to run the game in an `<iframe>` (`GameViewPanel`) makes the "Scene Editor" requirement much harder. To implement gizmos, we will need an overlay system or a trusted communication bridge (postMessage) to inject edits back into the game loop.
3.  **Missing State Sync**: There is no Redux/Zustand store that holds the *Project Data* (Entities/Scenes) in the Editor memory. The Editor is currently just a file browser around a black-box game runner.

## Recommendations

1.  **Phase 1: Real Inspector**: Connect `InspectorPanel` to the Game.
    *   *Action*: Implement `editor:select` event from Game -> Editor.
    *   *Action*: Send `editor:update-component` event from Editor -> Game.
2.  **Phase 2: Scene Gizmos**:
    *   *Action*: Create a "Debug/Edit" mode in `Neptune.js` that renders gizmos when receiving a flag from Triton.
3.  **Phase 3: Rig Editor**:
    *   *Action*: Rename `AtlasPanel` to `UIGallery`. Start a real `RigPanel`.
