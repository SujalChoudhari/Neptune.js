import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { createPreviewServer } from '../scripts/serve.js';

async function fixture(t) {
  const server = await createPreviewServer(fileURLToPath(new URL('../', import.meta.url)));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const browser = await chromium.launch({ headless: true });
  t.after(() => new Promise(resolve => server.close(resolve)));
  t.after(() => browser.close());
  return { browser, url: `http://127.0.0.1:${server.address().port}/examples/emberfall/adventure.html` };
}

test('Emberfall adventure menu, settings, pause and validated world Continue round-trip', { timeout: 45_000 }, async t => {
  const { browser, url } = await fixture(t);
  const page = await browser.newPage({ viewport: { width: 1100, height: 740 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const newGame = page.getByRole('button', { name: 'Begin journey' });
  const continueGame = page.getByRole('button', { name: 'Continue' });
  await newGame.waitFor();
  assert.equal(await continueGame.isDisabled(), true, 'Continue is unavailable without a save');
  await page.getByRole('button', { name: 'Sound settings' }).click();
  const music = page.locator('#music-volume'); await music.focus(); await music.press('Home');
  for (let i = 0; i < 9; i++) await music.press('ArrowRight');
  await newGame.click();
  await page.locator('#emberfall-hud').waitFor();
  const hud = page.locator('#emberfall-hud');
  assert.equal(await hud.getAttribute('data-area'), 'hollow');
  const startHealth = Number(await hud.getAttribute('data-health'));
  await page.keyboard.down('d'); await page.waitForTimeout(500); await page.keyboard.up('d');
  await page.keyboard.press('e');
  await page.getByText(/Mira: “Take my spark/).waitFor();
  await page.keyboard.press('o');
  await page.getByText('Journey saved at the last lantern.').waitFor();
  const location = await page.locator('#emberfall-hud').getAttribute('data-area');
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Paused' }).waitFor();
  await page.getByRole('button', { name: 'Return to the Hollow' }).click();
  await page.waitForTimeout(100);
  await page.reload();
  await continueGame.waitFor();
  assert.equal(await continueGame.isDisabled(), false, 'Continue becomes available after saving');
  assert.equal(await page.locator('#music-volume').inputValue(), '0.45', 'settings survive a full page restart');
  await continueGame.click();
  await page.locator('#emberfall-hud').waitFor();
  await page.getByText('Journey restored.').waitFor();
  assert.equal(await page.locator('#emberfall-hud').getAttribute('data-area'), location, 'the saved area is restored');
  assert.equal(Number(await page.locator('#emberfall-hud').getAttribute('data-health')), startHealth, 'health is restored');
  assert.deepEqual(errors, []);
});

test('Continue reports a corrupted save and starts a fresh world only on explicit New Game', { timeout: 35_000 }, async t => {
  const { browser, url } = await fixture(t);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('neptune.emberfall.adventure.slot-1', '{broken'));
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#emberfall-hud').waitFor();
  await page.getByText('Save slot \'slot-1\' is corrupt JSON', { exact: false }).waitFor();
  await page.evaluate(() => window.dispatchEvent(new Event('emberfall:pause')));
  await page.reload();
  await page.getByRole('button', { name: 'Begin journey' }).click();
  await page.locator('#emberfall-hud').waitFor();
  assert.equal(await page.locator('#emberfall-hud').getAttribute('data-area'), 'hollow');
  assert.deepEqual(errors, []);
});
