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
  return { browser, url: `http://127.0.0.1:${server.address().port}/examples/emberfall/adventure.html?practice=1` };
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
  await page.getByText(/Continue failed: Save slot 'slot-1' is corrupt JSON/).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('neptune.emberfall.adventure.slot-1')), '{broken');
  await page.getByRole('button', { name: 'Begin journey' }).click();
  await page.locator('#emberfall-hud').waitFor();
  assert.equal(await page.locator('#emberfall-hud').getAttribute('data-area'), 'hollow');
  assert.deepEqual(errors, []);
});


test('ordinary controls complete the journey and restore the world and reward exactly once', { timeout: 120_000 }, async t => {
  const { browser, url } = await fixture(t);
  const page = await browser.newPage({ viewport: { width: 1100, height: 740 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(url); const started = Date.now();
  await page.getByRole('button', { name: 'Begin journey' }).click();
  const hud = page.locator('#emberfall-hud'); await hud.waitFor();
  const move = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };
  const snapshot = async () => { await page.keyboard.press('o'); await page.waitForTimeout(100); return page.evaluate(() => JSON.parse(localStorage.getItem('neptune.emberfall.adventure.slot-1')).state); };
  const approach = async (axis, goal) => {
    for (let i = 0; i < 100; i++) { const p = Number(await hud.getAttribute('data-' + axis)); const d = goal - p; if (Math.abs(d) < .45) return; await move(axis === 'x' ? (d > 0 ? 'd' : 'a') : (d > 0 ? 's' : 'w'), Math.min(450, Math.max(60, Math.abs(d) * 200))); }
    assert.fail('could not reach ' + axis + '=' + goal);
  };
  const fight = async id => {
    await page.keyboard.down('j');
    for (let i = 0; i < 65; i++) {
      const state = await snapshot(); const enemy = state.enemies.find(e => e.id === id);
      assert.ok(state.player.health > 0, 'survived encounter with ' + id);
      if (enemy.health === 0) { await page.keyboard.up('j'); return; }
      const dx = enemy.x - state.player.x;
      await move(dx > 0 ? 'd' : 'a', Math.abs(dx) > 1.15 ? 130 : 20);
      if (Math.abs(dx) <= 1.15) await page.waitForTimeout(350);
    }
    assert.fail('could not defeat ' + id);
  };
  await approach('x', 5); await page.keyboard.press('e'); await page.getByText(/Mira: “Take my spark/).waitFor();
  await fight('briar-scout'); await approach('x', 15); await fight('keep-raider');
  await approach('x', 21); await fight('keeper');
  let state = await snapshot(); assert.equal(state.bossCleared, true); assert.equal(state.bossRewarded, true); assert.equal(state.player.gold, 30);
  await approach('x', 23); await approach('y', 2.5); await page.keyboard.press('e'); await page.getByText(/coffer holds 15/).waitFor();
  await page.keyboard.press('e'); await page.getByText(/coffer is already empty/).waitFor();
  await approach('y', 4.5); await approach('x', 27); await page.keyboard.press('e'); await page.getByText(/ember answers/).waitFor();
  state = await snapshot(); assert.equal(state.player.gold, 45); assert.equal(state.chests.includes('old-coffer'), true); assert.equal(state.altarLit, true);
  await page.reload(); await page.getByRole('button', { name: 'Continue' }).click(); await hud.waitFor(); await page.getByText('Journey restored.').waitFor();
  const restored = await snapshot(); assert.equal(restored.player.gold, 45); assert.equal(restored.player.health, state.player.health); assert.equal(restored.chests.includes('old-coffer'), true); assert.equal(restored.altarLit, true); assert.deepEqual(restored.enemies.map(e => e.health), state.enemies.map(e => e.health));
  await approach('x', 5); await page.keyboard.press('e'); await page.getByText(/THE FIRST EMBER IS LIT/).waitFor();
  state = await snapshot(); assert.equal(state.completed, true); assert.equal(state.player.gold, 45);
  console.log('Ordinary-input route including reload: ' + ((Date.now() - started) / 1000).toFixed(1) + ' seconds');
  assert.deepEqual(errors, []);
});

test('death and retry return to the lantern while keeping encounter progress', { timeout: 90_000 }, async t => {
  const { browser, url } = await fixture(t); const page = await browser.newPage({ viewport: { width: 1100, height: 740 } });
  await page.goto(url); await page.getByRole('button', { name: 'Begin journey' }).click(); const hud = page.locator('#emberfall-hud'); await hud.waitFor();
  await page.keyboard.down('d'); await page.waitForTimeout(1600); await page.keyboard.up('d');
  await page.getByText(/YOU FELL/, { exact: false }).waitFor({ timeout: 60000 });
  await page.keyboard.press('r'); await page.waitForFunction(() => document.querySelector('#emberfall-hud')?.getAttribute('data-health') === '125');
  assert.equal(Number(await hud.getAttribute('data-health')), 125);
  assert.ok(Number(await hud.getAttribute('data-x')) < 4);
});
