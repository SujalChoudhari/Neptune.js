# Implementation Plan - Real Inspector & Hierarchy

**Goal**: Integrate the Triton Editor UI (Toolbar, Hierarchy, Inspector) with the running Neptune Engine game instance using Real-Time Bridge communication.

## User Review Required
> [!IMPORTANT]
> This plan assumes the Neptune Engine (running in iframe) exposes a global `game` object or event system that we can hook into. Since we cannot modify the engine core easily, we will inject a "Bridge Script" via the iframe to expose this data.

## Proposed Changes

### 1. Communication Bridge (The "Nerve Center")
We need a `GameContext` (or Store) to manage the connection to the `<iframe>`.

#### [NEW] `triton/src/context/GameContext.tsx`
*   **State**: `isPlaying`, `isPaused`, `currentScene`, `selection` (list of IDs).
*   **Actions**: `play()`, `pause()`, `stop()`, `selectEntity(id)`, `updateComponent(id, component, data)`.
*   **Listeners**: Listens for `window.onmessage` from the iframe:
    *   `game:ready`: Game is loaded.
    *   `game:scene_changed`: Scene loaded (name, root entity).
    *   `game:hierarchy_update`: Full tree or delta update.
    *   `game:entity_selected`: Selection changed in game (e.g. clicking in viewport).
    *   `game:component_update`: Component data for Inspector.

### 2. Layout & Toolbar
#### [MODIFY] `triton/src/components/layout/EditorToolbar.tsx`
*   **Left Side**: Add "Current Scene: [Name]" label.
*   **Left Side**: Add "Mark as Main" button (writes to `project.triton`).
*   **Center**:
    *   Unified `Play/Stop` toggle button.
    *   `Play Current` button (loads current scene explicitly).
    *   `Pause` toggle button.
*   **Integration**: Connect these buttons to `GameContext`.

### 3. Hierarchy Panel
#### [MODIFY] `triton/src/components/panels/HierarchyPanel.tsx`
*   **Remove Mock**: Delete `useMockHierarchy` usage.
*   **Connect**: Use `useGameContext`.
*   **Rendering**: Render the real entity tree provided by `GameContext`.
*   **Interaction**: Click -> `selectEntity(id)`. Drag -> `moveEntity(id, targetId)`.

### 4. Inspector Panel
#### [MODIFY] `triton/src/components/panels/InspectorPanel.tsx`
*   **Remove Mock**: Delete `MOCK_ENTITY`.
*   **Connect**: Subscribe to `selectedEntityData` from `GameContext`.
*   **Rendering**: Only render components present in the selected entity data.
*   **Interaction**: Change Value -> `updateComponent(id, comp, field, value)`.

### 5. Game Viewport (The Bridge)
#### [MODIFY] `triton/src/components/panels/GameViewPanel.tsx`
*   **Inject Bridge Script**: Update the `iframeContent` to include a structured script that:
    *   Hooks into `window.game` (Neptune Engine instance).
    *   Monkey-patches `game.loadScene` to notify Editor.
    *   Monkey-patches `game.selection` to notify Editor.
    *   Listens for `message` events from parent (Editor) to trigger Game actions.

### 6. UI Polish (Settings Dialog)
#### [MODIFY] `triton/src/components/layout/EditorToolbar.tsx`
*   **Remove**: `<SettingsDialog />` component usage.
*   **Refactor**: Use `useModal()` hook.
*   **Implement**: `openSettings()` function that calls `showModal` with the settings content.
*   **Design**: Ensure it replicates the "Confirmation Modal" style (dark gradient, uppercase header, etc.) from `StoryBook`.

## Verification Plan

### Manual Verification
1.  **Toolbar Check**:
    *   Click Play -> Verify game starts (spinning cube/platformer).
    *   Click Pause -> Verify game freezes.
    *   Click Stop -> Verify game resets.
    *   **Settings Dialog**: Click Settings -> Verify it opens the new "Themed" modal (not the old Shadcn dialog) and toggles work.
2.  **Hierarchy Sync**:
    *   Load game -> Verify Hierarchy Panel lists "Player", "Platforms", etc.
    *   Add entity in Game (via console/script) -> Verify Hierarchy updates.
3.  **Inspector Sync**:
    *   Select "Player" in Hierarchy.
    *   Inspector should show `Transform`, `Sprite`, `Stats`.
    *   Change `Stats.health` in Inspector -> Verify in Game Console/UI it updates.
    *   Move Player in Game (if possible) -> Verify Inspector Transform updates.

