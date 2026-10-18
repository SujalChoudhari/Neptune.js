# Changelog

All notable changes to Neptune.js are documented here. Versions and dates are assigned when a release is explicitly approved; entries under Unreleased are not a release announcement.

## [Unreleased]

### Release notes

- Tilemap occupancy mutations now use actor-to-cell indexing, and a 100 × 100 map with 10,000 occupants is covered by a regression test.
- The debug sample is loaded by a runtime smoke test that verifies scene/tilemap startup and detects console errors.
- Triton desktop packaging is reproducible in Linux CI using frozen Yarn dependencies and a Tauri Debian bundle build; frontend, Tauri, and Cargo app versions are synchronized.
- Runtime workload limits and scaling characteristics are documented in `docs/performance-budgets.md`.

### Versioning

- The engine npm package version remains `3.3.1` until an explicitly approved release.
- Triton is a separately versioned desktop app at `0.1.0`; its frontend, Tauri configuration, and Cargo manifest/lockfile must stay aligned.
- This Unreleased entry does not create a tag, publish a package, or assign a release date.

### Migration

- No migration is required for these M17 changes. Project payloads remain at schema version 1, scene payloads remain at schema version 1, and game-save records remain at schema version 1.
- The tilemap occupancy index is runtime-only and does not alter serialized project, scene, or save data. Existing version-1 data remains compatible.
