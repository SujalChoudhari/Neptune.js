# Project Panel QoL & "Best in Class" Implementation Plan

## Goal
Transform the Project Panel into a fully functional, Unity-style asset manager with robust Quality of Life (QoL) features.

## Planned Features

### 1. Robust Selection System
- **Current State**: Only folder navigation is tracked.
- **New Feature**: Track `selectedAssetIds` (Array<string>) to support multi-selection.
- **Interactions**:
    - Click: Select single (deselect others).
    - Ctrl+Click: Add/Re
    move from selection.
    - Shift+Click: Range selection (grid logic).
    - Click Empty Space: Deselect all.

### 2. File Operations
- **Rename**:
    - **Trigger**: F2 key, Context Menu, or Slow Double Click.
    - **UI**: Inline input field replacing the label.
    - **Logic**: Update `FileSystemNode.name`.
- **Duplicate**:
    - **Trigger**: Ctrl+D, Context Menu.
    - **Logic**: create copy with "Name (1)" suffix. Deep copy for folders.
- **Delete**:
    - **Trigger**: Delete key, Context Menu.
    - **Logic**: Remove node and children. Show confirmation dialog? (Maybe skip for MVP).
- **Copy Path**:
    - **Trigger**: Context Menu -> "Copy Path".

### 3. Context Menu Refactoring
- **Global Context Menu**: (Done)
- **Background Context Menu**: "Create Folder", "Create Asset", "Import".
- **Item Context Menu**: Specific actions for selected assets ("Rename", "Delete", "Duplicate").
    - **Implementation**: Wrap individual Grid Items in `ThemedContextMenuTrigger`.

### 4. Keyboard Shortcuts (Unity Style)
- **F2**: Rename selected.
- **Delete**: Delete selected.
- **Ctrl+D**: Duplicate selected.
- **Ctrl+A**: Select all.
- **Esc**: Clear selection.
- **Enter**: Open selected folder / Open asset (logic placeholder).

### 5. "Best Project Panel" Polish
- **Drag & Drop**:
    - Improve visual feedback (ghost image).
    - Support internal moves (already partially working).
    - Support external drop (files from OS) - (Browser requires specific handling).
- **Favorites / Quick Access**:
    - "Favorites" section in Sidebar.
- **Search**:
    - Real-time filtering matches (Already present).
    - Add file type filter buttons (e.g., "Script", "Scene", "Mat").

## Implementation Steps

### Phase 1: Core Logic (MockFileSystem)
- [ ] Add `renameNode(id, newName)`
- [ ] Add `duplicateNode(id)`
- [ ] Ensure `deleteNode` works robustly.

### Phase 2: Selection & shortcuts
- [ ] Add `selection` state to `ProjectPanel`.
- [ ] Pass selection props to `ProjectGrid`.
- [ ] Implement `onKeyDown` listener in `ProjectPanel` for shortcuts (Del, Ctrl+D, F2).

### Phase 3: Item Context Menu & Inline Editing
- [ ] Add `editingId` state.
- [ ] Create `RenamingInput` component for Grid Items.
- [ ] Wrap Grid Items in `ThemedContextMenuTrigger`.
- [ ] Integrate Rename/Duplicate/Delete actions.

### Phase 4: Polish
- [ ] Type filters in Toolbar.
- [ ] Validation (prevent duplicate names).
