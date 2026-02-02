# Triton Editor Task List

- [/] **Audit Implementation Status** <!-- id: 0 -->
    - [x] Read SRS and TSD <!-- id: 1 -->
    - [x] Scan codebase for implemented features <!-- id: 2 -->
    - [x] Generate Audit Report (`audit_report.md`) <!-- id: 3 -->

- [ ] **Phase 1: Real Inspector Integration** <!-- id: 4 -->
    - [ ] Create `SelectionContext` in Editor <!-- id: 5 -->
    - [ ] Implement `postMessage` bridge for Entity Selection (Game -> Editor) <!-- id: 6 -->
    - [ ] Implement `postMessage` bridge for Component Updates (Editor -> Game) <!-- id: 7 -->
    - [ ] Replace `MOCK_ENTITY` in Inspector with real data <!-- id: 8 -->

- [ ] **Phase 2: Scene Editing Tools** <!-- id: 9 -->
    - [ ] Add Gizmo Renderer to Neptune Engine (Debug Mode) <!-- id: 10 -->
    - [ ] Implement Drag-and-Drop from Project Panel to Game View <!-- id: 11 -->
    - [ ] Implement Transform Gizmo (Move/Rotate/Scale) interaction <!-- id: 12 -->

- [ ] **Phase 3: Specialized Editors** <!-- id: 13 -->
    - [ ] Rename `AtlasPanel` to `UIGallery` <!-- id: 14 -->
    - [ ] Create `RigPanel` scaffolding <!-- id: 15 -->
    - [ ] Implement Rigging Logic (Bone/Part assignment) <!-- id: 16 -->
    - [ ] Create `TilemapPanel` <!-- id: 17 -->

- [ ] **Phase 4: Polish & Export** <!-- id: 18 -->
    - [ ] Fix Directory Duplication in Backend <!-- id: 19 -->
    - [ ] Implement Project Export (Web/Electron) <!-- id: 20 -->
