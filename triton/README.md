# Triton: Neptune 2D editor

Triton is the separate React/TypeScript + Tauri authoring application for Neptune.js. It shares project and scene data with the entity-component runtime in ../src; game projects do not depend on editor UI or Tauri.

See the [repository README](../README.md) for setup, architecture, current limits and the active 2D ARPG backlog, and [AGENTS.md](../AGENTS.md) for contribution guidance.

From the repository root:

```sh
yarn --cwd triton install --frozen-lockfile
npm run dev:editor
```

The browser preview uses native-command stubs in tests; real filesystem authoring needs the desktop editor and Tauri prerequisites. Start it with Neptune.cmd on Windows or `yarn --cwd triton tauri dev`.

Verify with `npm run build:editor`, `npm run lint:editor`, and `npm test`. Native compiler output is excluded from lint.
