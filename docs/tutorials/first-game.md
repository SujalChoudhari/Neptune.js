# Your first Neptune game

This runnable example creates a scene with a floor and a player shape. It uses only files shipped in the Neptune.js checkout.

## Run it

1. Install the repository dependencies from its root: `npm ci --ignore-scripts --no-audit --no-fund`.
2. Start a static server from the repository root: `python3 -m http.server 8000`.
3. Open `http://localhost:8000/examples/first-game/` in a browser.
4. Select **Play Game**. Neptune starts the main loop and renders the scene.

Opening `index.html` directly as a `file:` URL is not supported because browsers block ES module imports from local files. The server must be started at the repository root so `../../src/neptune.js` resolves.

## How it works

`index.html` supplies a short welcome panel and loads `main.js` as a browser module. Importing `src/neptune.js` creates the shared application and the built-in Play button. `main.js` then:

- creates and registers a `Scene`;
- creates `Entity` objects for the floor and player;
- adds `Transform` and `Shape` components; and
- sets the application's clear color.

The engine owns the browser animation loop. The example deliberately leaves movement and input for the next tutorial, so its first goal is simply to get a real scene on screen.

## Modify it

Change the player's position in `examples/first-game/main.js`, for example from `new Vector2(8, 6)` to `new Vector2(5, 5)`, refresh the page, and press **Play Game** again. The coordinate values are in meters; Neptune converts them to canvas pixels when drawing.

If the page is blank, check that the server was started in the repository root and inspect the browser console for module-load errors. `npm test` runs this example in headless Chromium, clicks **Play Game**, confirms the canvas renders the scene, and fails on browser console or page errors. CI installs Chromium before running the suite.
