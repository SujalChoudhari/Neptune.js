import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const helperPath = new URL("../src/ui/authoredUi.js", import.meta.url);
const sceneUi = { version: 1, elements: [
    { id: "middle", type: "panel", anchor: { x: "center", y: "center" }, x: 0, y: 0, width: 200, height: 80, background: "#25313b", zIndex: 2 },
    { id: "title", type: "text", anchor: { x: "center", y: "top" }, x: 0, y: 12, width: 120, height: 24, text: "Shared preview", zIndex: 3 },
    { id: "hidden", type: "panel", visible: false, width: 10, height: 10 },
    { id: "action", type: "button", action: "start", text: "Start", x: 8, y: 8, width: 90, height: 30, zIndex: 4 }
] };

test("runtime authored UI and Scene View preview share anchor, stacking, visibility and capture behavior", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
        await page.setContent("<!doctype html><html><body style='margin:0'><canvas></canvas></body></html>");
        let source = await fs.readFile(helperPath, "utf8");
        source = source.replace(/^export const /gm, "const ").replace(/^export function /gm, "function ");
        await page.addScriptTag({ content: `${source}\nwindow.authoredUI = { mountAuthoredUI, validateAuthoredUI };` });
        const sceneLayout = await page.evaluate(data => {
            window.uiMount = window.authoredUI.mountAuthoredUI(document.body, data, { mode: "scene-preview" });
            const panel = document.querySelector('[data-neptune-ui-id="middle"]');
            const title = document.querySelector('[data-neptune-ui-id="title"]');
            const button = document.querySelector('[data-neptune-ui-id="action"]');
            return {
                panel: panel.getBoundingClientRect().toJSON(), title: title.getBoundingClientRect().toJSON(),
                hidden: document.querySelector('[data-neptune-ui-id="hidden"]') === null,
                zIndex: getComputedStyle(title).zIndex,
                buttonDisabled: button.disabled,
                rootPointerEvents: getComputedStyle(document.querySelector('[data-neptune-authored-ui]')).pointerEvents
            };
        }, sceneUi);
        assert.equal(sceneLayout.panel.x, 350);
        assert.equal(sceneLayout.panel.y, 260);
        assert.equal(sceneLayout.title.x, 390);
        assert.equal(sceneLayout.title.y, 12);
        assert.equal(sceneLayout.hidden, true);
        assert.equal(sceneLayout.zIndex, "3");
        assert.equal(sceneLayout.buttonDisabled, true);
        assert.equal(sceneLayout.rootPointerEvents, "none");

        await page.setViewportSize({ width: 1200, height: 800 });
        const resized = await page.locator('[data-neptune-ui-id="middle"]').boundingBox();
        assert.equal(resized.x, 500);
        assert.equal(resized.y, 360);

        const gameLayout = await page.evaluate(data => {
            window.gameUi = window.authoredUI.mountAuthoredUI(document.body, data, { mode: "game" });
            const panel = document.querySelector('[data-neptune-ui-id="middle"]');
            return { x: panel.getBoundingClientRect().x, y: panel.getBoundingClientRect().y,
                rootPointerEvents: getComputedStyle(document.querySelectorAll('[data-neptune-authored-ui]')[1]).pointerEvents,
                buttonPointerEvents: getComputedStyle(document.querySelectorAll('button')[1]).pointerEvents };
        }, sceneUi);
        assert.equal(gameLayout.x, resized.x);
        assert.equal(gameLayout.y, resized.y);
        assert.equal(gameLayout.rootPointerEvents, "none");
        assert.equal(gameLayout.buttonPointerEvents, "auto");
        await page.evaluate(() => {
            window.uiActions = [];
            document.body.addEventListener('neptune:ui-action', event => window.uiActions.push(event.detail.action));
        });
        await page.locator('[data-neptune-authored-ui][data-mode="game"] button').click();
        assert.deepEqual(await page.evaluate(() => window.uiActions), ['start']);

        await page.evaluate(() => { window.uiMount.setCapture(true); });
        assert.equal(await page.locator('[data-neptune-authored-ui]').first().evaluate(node => getComputedStyle(node).pointerEvents), "auto");
        await page.evaluate(() => { window.gameUi.dispose(); window.uiMount.dispose(); });
        assert.equal(await page.locator('[data-neptune-authored-ui]').count(), 0);
        const captureAfterOutOfOrderDisposal = await page.evaluate(data => {
            const first = window.authoredUI.mountAuthoredUI(document.body, data, { captureInput: true });
            const second = window.authoredUI.mountAuthoredUI(document.body, data);
            first.dispose();
            const third = window.authoredUI.mountAuthoredUI(document.body, data, { captureInput: true });
            second.dispose();
            const active = document.body.dataset.neptuneUiCapture;
            third.dispose();
            return { active, final: document.body.dataset.neptuneUiCapture };
        }, sceneUi);
        assert.deepEqual(captureAfterOutOfOrderDisposal, { active: 'captured', final: 'off' });
    } finally {
        await browser.close();
    }
});
