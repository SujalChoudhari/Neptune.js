import "./setup_mocks.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { get } from "node:http";
import { chromium } from "playwright";
import { application, SceneManager, Shape, Transform } from "../src/neptune.js";

const exampleRoot = new URL("../examples/first-game/", import.meta.url);
const getResponse = url => new Promise((resolve, reject) => {
    get(url, response => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", chunk => body += chunk);
        response.on("end", () => resolve({ status: response.statusCode, body, contentType: response.headers["content-type"] }));
    }).on("error", reject);
});

test("first-game example loads its documented scene from a clean checkout", async () => {
    const html = await readFile(new URL("index.html", exampleRoot), "utf8");
    const tutorial = await readFile(new URL("../docs/tutorials/first-game.md", import.meta.url), "utf8");
    assert.match(html, /src="\.\/main\.js"/);
    assert.match(tutorial, /python3 -m http\.server 8000/);
    assert.match(tutorial, /examples\/first-game/);

    const { scene, player } = await import("../examples/first-game/main.js");
    assert.equal(scene.name, "First Game");
    assert.equal(SceneManager.GetSceneByName("First Game"), scene);
    assert.equal(application.clearColor.toString(), "rgba(23,33,43,1)");

    const floor = scene.children.find(entity => entity.name === "Floor");
    assert.ok(floor);
    assert.ok(floor.GetComponent(Transform));
    assert.ok(floor.GetComponent(Shape));
    assert.ok(player.GetComponent(Transform));
    assert.ok(player.GetComponent(Shape));
    assert.equal(player.parent, scene);

    SceneManager.removeAllScenes();
});

test("documented root server serves the runnable first-game module graph", async t => {
    const portProbe = createServer();
    portProbe.listen(0, "127.0.0.1");
    await once(portProbe, "listening");
    const { port } = portProbe.address();
    await new Promise((resolve, reject) => portProbe.close(error => error ? reject(error) : resolve()));

    const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        stdio: "ignore"
    });
    t.after(() => server.kill());

    let response;
    for (let attempt = 0; attempt < 40; attempt++) {
        if (server.exitCode !== null) throw new Error(`Static server exited with ${server.exitCode}`);
        try {
            response = await getResponse(`http://127.0.0.1:${port}/examples/first-game/`);
            break;
        } catch {
            await delay(50);
        }
    }
    assert.ok(response, "documented static server starts successfully");
    assert.equal(response.status, 200);
    assert.match(response.body, /<script type="module" src="\.\/main\.js"><\/script>/);

    const moduleResponse = await getResponse(`http://127.0.0.1:${port}/examples/first-game/main.js`);
    assert.equal(moduleResponse.status, 200);
    assert.match(moduleResponse.body, /from "\.\.\/\.\.\/src\/neptune\.js"/);
    const engineResponse = await getResponse(`http://127.0.0.1:${port}/src/neptune.js`);
    assert.equal(engineResponse.status, 200);
    assert.match(engineResponse.contentType, /javascript/);
    assert.match(engineResponse.body, /Scene/);
});

test("first-game tutorial runs and renders in Chromium from the documented server", async t => {
    const portProbe = createServer();
    portProbe.listen(0, "127.0.0.1");
    await once(portProbe, "listening");
    const { port } = portProbe.address();
    await new Promise((resolve, reject) => portProbe.close(error => error ? reject(error) : resolve()));
    const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        stdio: "ignore"
    });
    t.after(() => server.kill());

    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => {
        if (message.type() === "error") pageErrors.push(message.text());
    });

    await page.goto(`http://127.0.0.1:${port}/examples/first-game/`);
    await page.getByRole("heading", { name: "First Neptune game" }).waitFor();
    await page.getByRole("button", { name: "Play Game" }).click();
    const canvas = page.locator("#neptune-canvas");
    await canvas.waitFor({ state: "visible" });
    await page.waitForFunction(() => {
        const canvasElement = document.querySelector("#neptune-canvas");
        if (!canvasElement) return false;
        const context = canvasElement.getContext("2d");
        if (!context) return false;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 1] > pixels[index] * 1.3 && pixels[index + 1] > pixels[index + 2] * 1.3) return true;
        }
        return false;
    });
    assert.deepEqual(pageErrors, []);
    assert.equal(await page.locator("#neptune-play").count(), 0);
});
