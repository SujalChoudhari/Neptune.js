import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Keep legacy engine tests and the Node test suites in their established order.
const batches = [
  [
    "tests/index.js"
  ],
  [
    "--test",
    "triton/tests/project-switch-isolation.test.js",
    "triton/tests/project-scene-navigation.test.js",
    "triton/tests/editor-runtime-crud.test.js",
    "triton/tests/scene-layer-identity.test.js",
    "triton/tests/scene-load-race.test.js",
    "triton/tests/runtime-selection-scene-load.test.js",
    "triton/tests/hierarchy-move-state.test.js",
    "triton/tests/hierarchy-shortcuts.test.js",
    "triton/tests/hierarchy-search-selection.test.js",
    "triton/tests/scene-save-race.test.js",
    "triton/tests/runtime-canvas-selection.test.js",
    "triton/tests/hierarchy-drop-index.test.js",
    "triton/tests/runtime-playback.test.js",
    "triton/tests/game-runtime-bundle.test.js",
    "tests/inactive-runtime.test.js",
    "triton/tests/inspector-enabled.test.js",
    "triton/tests/inspector-missing-component.test.js",
    "triton/tests/console-source.test.js",
    "triton/tests/runtime-selection-enabled.test.js"
  ],
  [
    "triton/tests/rejected-scene-save-harness.mjs"
  ],
  [
    "--test",
    "triton/tests/application-scene-load.test.js",
    "triton/tests/scene-picking.test.js",
    "triton/tests/tilemap-authoring.test.js",
    "triton/tests/persistence-bridge.test.js",
    "triton/tests/filesystem-context.test.js",
    "triton/tests/project-resource-bridge.test.js",
    "triton/tests/game-view-resource.test.js",
    "tests/sample-runtime-smoke.test.js",
    "tests/first-game-tutorial.test.js",
    "tests/action-rpg-tutorial.test.js",
    "tests/docs-preservation.test.js",
    "tests/save-load-docs.test.js",
    "tests/tilemap-docs.test.js",
    "tests/combat-ai-docs.test.js",
    "tests/rpg-docs.test.js",
    "tests/html-ui-docs.test.js",
    "tests/ui-layout-docs.test.js",
    "tests/runtime-docs.test.js",
    "tests/editor-api-docs.test.js",
    "tests/tauri-packaging.test.js",
    "tests/release-notes.test.js",
    "tests/scene-transition.test.js",
    "triton/tests/inspector-browser-smoke.test.js",
    "triton/tests/welcome-screen-browser-smoke.test.js",
    "tests/dev-server.test.js",
    "tests/emberfall-browser.test.js",
    "tests/project-behaviour.test.js",
    "triton/tests/frontend-watch.test.js",
    "triton/tests/scene-tools.test.js",
    "triton/tests/edit-history.test.js",
    "triton/tests/scene-grid.test.js",
    "triton/tests/scene-world-transform.test.js",
    "triton/tests/authoring-component-catalog.test.js",
    "triton/tests/scene-context-menu.test.js",
    "tests/editor-extension-api.test.mjs",
    "tests/runtime-foundations.test.mjs",
    "tests/core-facts-rules.test.mjs",
    "tests/ability-validation.test.mjs",
    "tests/ability-executor.test.mjs",
    "tests/material-simulation.test.mjs",
    "tests/cell-simulation.test.mjs",
    "tests/story-graph.test.mjs",
    "tests/ai-perception-memory.test.mjs",
    "tests/ai-utility-actions.test.mjs",
    "tests/ai-schedules-factions.test.mjs",
    "tests/rpg-inventory-loot.test.mjs",
    "tests/rpg-progression-status.test.mjs",
    "tests/physics-collision-masks.test.mjs",
    "tests/physics-swept-knockback.test.mjs",
    "tests/versioned-save.test.mjs",
    "tests/navigation-grid.test.mjs",
    "tests/tester-async.test.js",
    "tests/emberfall-adventure-browser.test.js",
    "tests/emberfall-expedition-browser.test.js",
    "tests/authored-ui-browser.test.mjs",
    "triton/tests/editor-extensions-browser.test.js",
    "triton/tests/editor-layout.test.js",
    "triton/tests/viewport-tools-browser.test.js"
  ]
];
const root = fileURLToPath(new URL("../", import.meta.url));
for (const args of batches) {
  // Bound compiler/browser concurrency on development laptops.
  if (args[0] === "--test") args.splice(1, 0, "--test-concurrency=2");
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
