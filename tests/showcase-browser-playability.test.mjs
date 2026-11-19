import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function createDocsServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(docsDir, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          fs.createReadStream(indexPath).pipe(res);
          return;
        }
      }

      if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

test('Showcase Browser: Interactive systems demo plays smoothly in headless Chromium', async () => {
  const port = 49152 + Math.floor(Math.random() * 1000);
  const server = await createDocsServer(port);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    // 1. Load demo viewer
    await page.goto(`http://localhost:${port}/demo.html`, { waitUntil: 'networkidle' });
    const iframeHandle = await page.$('iframe#demo-viewport');
    assert.ok(iframeHandle, 'demo viewer must have iframe#demo-viewport');

    const frame = await iframeHandle.contentFrame();
    assert.ok(frame, 'iframe contentFrame must be accessible');

    await frame.waitForSelector('canvas#showcase-canvas', { timeout: 5000 });

    // 2. Verify Canvas loop is ticking
    await page.waitForTimeout(1000);
    const fps = await frame.$eval('#fps-display', el => parseInt(el.textContent, 10));
    assert.ok(!isNaN(fps) && fps > 20, `FPS should be running smoothly (>20), got ${fps}`);

    // 3. Verify Player HUD
    const hp = await frame.$eval('#hp-text', el => el.textContent);
    assert.equal(hp, '100/100', 'Player starts with 100/100 HP');

    // 4. Test Player Movement Keys
    await frame.focus('canvas#showcase-canvas');
    await page.keyboard.press('KeyD');
    await page.keyboard.press('KeyS');
    await page.waitForTimeout(100);

    // 5. Test Ability Keys and Buttons
    await page.keyboard.press('Digit1'); // Fireball
    await page.waitForTimeout(100);
    await frame.click('#btn-ability-2'); // Frost Nova
    await page.waitForTimeout(100);
    await frame.click('#btn-ability-3'); // Heal Surge
    await page.waitForTimeout(100);

    // 6. Test Cellular Tool Painting
    await frame.click('button.tool-btn[data-tool="water"]');
    await frame.click('canvas#showcase-canvas', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(100);

    // 7. Test Tab switching across all 6 panels
    const tabs = ['tab-sched-fac', 'tab-nav-phys', 'tab-rpg', 'tab-story', 'tab-audio-save', 'tab-sim-ai'];
    for (const tab of tabs) {
      await frame.click(`.tab-btn[data-tab="${tab}"]`);
      const isActive = await frame.$eval(`#${tab}`, el => el.classList.contains('active'));
      assert.ok(isActive, `Tab panel #${tab} must be active`);
    }

    // 8. Test Save Engine and Corrupt Recovery
    await frame.click('.tab-btn[data-tab="tab-audio-save"]');
    await frame.click('#btn-save-game');
    await page.waitForTimeout(100);
    const saveStatus = await frame.$eval('#save-status-msg', el => el.textContent);
    assert.match(saveStatus, /saved/i, 'Save status must indicate success');

    // 9. Test Story Dialogue Modal
    await frame.click('.tab-btn[data-tab="tab-story"]');
    await frame.click('#btn-talk-guard');
    await page.waitForTimeout(100);
    const modalVisible = await frame.$eval('#story-modal', el => !el.hasAttribute('hidden'));
    assert.ok(modalVisible, 'Dialogue modal must be open');

    await frame.click('#btn-close-dialogue');
    await page.waitForTimeout(100);
    const modalClosed = await frame.$eval('#story-modal', el => el.hasAttribute('hidden'));
    assert.ok(modalClosed, 'Dialogue modal must close');

    // 10. Direct Fullscreen Page
    await page.goto(`http://localhost:${port}/showcase/index.html`, { waitUntil: 'networkidle' });
    const directCanvas = await page.$('canvas#showcase-canvas');
    assert.ok(directCanvas, 'Direct showcase page must render canvas');

    // 11. Tutorial Embedded Iframe
    await page.goto(`http://localhost:${port}/tutorial-08-Showcase%20Demo.html`, { waitUntil: 'networkidle' });
    const tutorialIframe = await page.$('iframe[title="Neptune.js Systems Showcase"]');
    assert.ok(tutorialIframe, 'Tutorial page must embed showcase iframe');
    const tutorialFrame = await tutorialIframe.contentFrame();
    assert.ok(await tutorialFrame.$('canvas#showcase-canvas'), 'Tutorial iframe must contain canvas');

    assert.equal(errors.length, 0, `Browser errors encountered: ${errors.join(', ')}`);
  } finally {
    await browser.close();
    await new Promise(res => server.close(res));
  }
});
