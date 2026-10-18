# Debug project runtime smoke

From the repository root, run `npm test`. The test suite includes a smoke test that boots this project's actual `main.js`, loads `scenes/demo.scn` and its referenced tilemap through `SceneLoader`, verifies the player and tile entities, and fails on any `console.error` during startup. The test uses a local filesystem-backed fetch adapter and the repository's browser mocks; it does not replace the sample scene or loader with fixtures.

To try the sample interactively in a browser, start a static server from the repository root (for example, `python3 -m http.server 8000`) and open `http://localhost:8000/debug_project/`. Press Play Game to start the canvas runtime; use the arrow keys to move the player.
