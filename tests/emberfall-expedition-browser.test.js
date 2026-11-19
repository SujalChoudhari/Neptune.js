import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { createPreviewServer } from '../scripts/serve.js';

test('expedition: ordinary input recovers the three guarded seals, defeats the Keeper and brings the ember home', { timeout: 360_000 }, async t => {
  const scene = JSON.parse(await readFile(new URL('../examples/emberfall/scenes/expedition.scene', import.meta.url), 'utf8'));
  const obstacles = scene.entities.flatMap(e => { const c = e.components.find(c => c.type === 'BoxCollider'); return c ? [{ ...e.transform.position, ...c.props }] : []; });
  const server = await createPreviewServer(fileURLToPath(new URL('../', import.meta.url))); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const browser = await chromium.launch({ headless: true }); t.after(() => new Promise(resolve => server.close(resolve))); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1100, height: 740 } }); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/examples/emberfall/adventure.html`); const start = Date.now();
  await page.getByRole('button', { name: 'Begin journey' }).click(); const hud = page.locator('#emberfall-hud'); await hud.waitFor();
  const move = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };
  const snapshot = async () => { await page.keyboard.press('o'); await page.waitForTimeout(100); return page.evaluate(() => JSON.parse(localStorage.getItem('neptune.emberfall.adventure.slot-1')).state); };
  const pos = async () => ({ x: Number(await hud.getAttribute('data-x')), y: Number(await hud.getAttribute('data-y')), health: Number(await hud.getAttribute('data-health')) });
  // Plan around the authored walls; the browser still moves and fights only via keys.
  const free = (x, y) => x > .7 && y > .7 && x < 59.3 && y < 35.3 && !obstacles.some(w => Math.abs(x - w.x) < w.width / 2 + .70 && Math.abs(y - w.y) < w.height / 2 + .70);
  const nearest = p => { let best, distance = Infinity; for (let x = Math.max(1, Math.round(p.x * 2) - 3); x <= Math.min(118, Math.round(p.x * 2) + 3); x++) for (let y = Math.max(1, Math.round(p.y * 2) - 3); y <= Math.min(70, Math.round(p.y * 2) + 3); y++) { const d = Math.hypot(x / 2 - p.x, y / 2 - p.y); if (d < distance && free(x / 2, y / 2)) { best = [x, y]; distance = d; } } return best; };
  const path = (from, to) => {
    const first = nearest(from), target = nearest(to); assert.ok(first && target, 'reachable endpoints');
    const key = (x, y) => y * 121 + x, queue = [first], previous = new Map([[key(...first), null]]); let found;
    for (let i = 0; i < queue.length; i++) { const [x, y] = queue[i], k = key(x, y); if (x === target[0] && y === target[1]) { found = k; break; } for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx=x+dx, ny=y+dy, nk=key(nx,ny); if (!previous.has(nk) && free(nx/2,ny/2)) { previous.set(nk,k); queue.push([nx,ny]); } } }
    assert.ok(found !== undefined, `no route ${JSON.stringify(from)} to ${JSON.stringify(to)}`); const result=[]; for(let k=found;k!==null;k=previous.get(k)) result.push([k%121, Math.floor(k/121)]); return result.reverse();
  };
  let retries=0;
  const revive = async () => { const p=await pos(); if (p.health > 0) return false; await page.keyboard.up('j'); await page.keyboard.press('r'); await page.waitForTimeout(250); retries++; return true; };
  const navigate = async (goal, tolerance=.8) => {
    for(let iteration=0;iteration<900;iteration++) { if(await revive()) continue; await page.keyboard.down('j'); const p=await pos(); if (iteration && iteration % 100 === 0) console.log('Navigating', p, 'toward', goal); if(Math.hypot(goal.x-p.x,goal.y-p.y)<tolerance) return; const route=path(p,goal); const first = route[0]; let next = Math.hypot(first[0]/2-p.x, first[1]/2-p.y) > .3 ? first : route[Math.min(1,route.length-1)]; const dx=next[0]/2-p.x, dy=next[1]/2-p.y; const key=Math.abs(dx)>Math.abs(dy)?(dx>0?'d':'a'):(dy>0?'s':'w'); await move(key,100); }
    assert.fail('navigation exhausted near '+JSON.stringify(await pos())+' toward '+JSON.stringify(goal));
  };
  const fight = async id => {
    console.log('Approaching '+id);
    for(let i=0;i<120;i++) { await revive(); const state=await snapshot(); const enemy=state.enemies.find(e=>e.id===id); assert.ok(enemy,id); if(enemy.health===0){await page.keyboard.up('j'); return;} const p=await pos(); const dx=enemy.x-p.x,dy=enemy.y-p.y;
      if(Math.hypot(dx,dy)>1.3){await page.keyboard.up('j');await navigate({x:enemy.x,y:enemy.y},1.1);} else {const key=Math.abs(dx)>Math.abs(dy)?(dx>0?'d':'a'):(dy>0?'s':'w');await move(key,20);await page.keyboard.down('j');await page.waitForTimeout(400);} }
    assert.fail('could not defeat '+id);
  };
  await navigate({x:5,y:4.5}); await page.keyboard.press('e'); await page.getByText(/Mira: “Take my spark/).waitFor();
  await fight('briar-scout'); console.log('Cleared the hollow scout');
  await fight('gate-guard'); console.log('Cleared the gate');
  for(const [seal, guards] of [['west-seal',['vault-warden','vault-raider']],['archive-seal',['archive-warden','archive-raider']],['crypt-seal',['crypt-warden','crypt-raider']]]) {
    for(const guard of guards) await fight(guard);
    const e=scene.entities.find(e=>e.id===seal); await navigate(e.transform.position,1.1); await page.keyboard.press('e'); await page.waitForTimeout(200);
    const state=await snapshot(); assert.ok(state.relics.includes(seal), 'collected '+seal); console.log('Recovered '+seal+' after '+((Date.now()-start)/1000).toFixed(1)+'s');
  }
  await fight('ritual-warden'); await fight('ritual-raider');
  await fight('keeper'); let state=await snapshot(); assert.equal(state.bossCleared,true); const gold=state.player.gold;
  await navigate({x:55,y:29},1.1); await page.keyboard.press('e'); await page.waitForTimeout(200); state=await snapshot(); assert.equal(state.altarLit,true);
  await page.reload(); await page.getByRole('button',{name:'Continue'}).click(); await hud.waitFor(); await page.getByText('Journey restored.').waitFor(); state=await snapshot(); assert.equal(state.player.gold,gold); assert.equal(state.relics.length,3); assert.equal(state.altarLit,true);
  await navigate({x:5,y:4.5},1.1); await page.keyboard.press('e'); await page.getByText(/THE FIRST EMBER IS LIT/).waitFor(); state=await snapshot(); assert.equal(state.completed,true); assert.equal(state.player.gold,gold);
  console.log('Expedition ordinary-input route with reload: '+((Date.now()-start)/1000).toFixed(1)+'s; retries '+retries); assert.deepEqual(errors,[]);
});
