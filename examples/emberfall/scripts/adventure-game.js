// One bundled project module so it can be fetched and executed as a Blob.
export function create({ entity, engine, properties }) {
  const { Transform, Shape, Color, KeyboardInput: Input, SceneManager, SaveManager, BoxCollider, Nereid, Larissa } = engine;
  const Sprite = engine.Sprite;
  const { Combatant, CombatSystem, AttackDefinition, Inventory } = Larissa;
  const scene = SceneManager.GetActiveScene();
  const transform = entity.GetComponent(Transform);
  const isPlayer = properties.role === 'player';
  const isBoss = properties.role === 'boss';
  const combatant = new Combatant({ id: entity.id, faction: isPlayer ? 'hero' : 'wild', maxHealth: properties.health, hurtbox: { width: isBoss ? 1.15 : .72, height: isBoss ? 1.15 : .72 }, invulnerabilityDuration: .55 });
  const actor = { combatant, role: properties.role, gold: 0, phase: 1, defeated: false };
  entity.gameplay = actor;
  const actors = () => scene.children.map(item => item.gameplay).filter(item => item?.combatant);
  const heroEntity = () => scene.children.find(item => item.gameplay?.role === 'player');
  const manager = new SaveManager({ prefix: 'neptune.emberfall.adventure' });
  const system = new CombatSystem();
  const inventory = new Inventory(12);
  const attackPlayer = new AttackDefinition({ name: 'ember-cut', damage: 27, range: 1.45, hitbox: { width: 1.35, height: 1.25 }, startup: .12, active: .13, recovery: .2, cooldown: .38 });
  const enemyAttack = new AttackDefinition({ name: 'lunge', damage: 9, range: 1.35, hitbox: { width: 1.25, height: 1 }, startup: .62, active: .12, recovery: .4, cooldown: 1.5 });
  const bossAttack = new AttackDefinition({ name: 'cleave', damage: 15, range: 2.05, hitbox: { width: 2, height: 1.65 }, startup: .82, active: .14, recovery: .52, cooldown: 1.85 });
  const world = { system, inventory, completed: false, bossCleared: false, altarLit: false, bossRewarded: false, paused: false, gold: 0, quest: 'Speak with Mira in Briar Hollow (E).', listeners: [], sound: null, sincePaint: 0, dodge: 0, facing: { x: 1, y: 0 } };
  const down = key => Input.IsKeyDown(Input.KEY_CODE[key]);
  const pressed = key => Input.IsKeyPressed(Input.KEY_CODE[key]);
  const actions = engine.InputActions ? new engine.InputActions({ up: ['W', 'ArrowUp'], down: ['S', 'ArrowDown'], left: ['A', 'ArrowLeft'], right: ['D', 'ArrowRight'], attack: 'J', interact: 'E', save: 'O', load: 'L', retry: 'R', dodge: 'Space', pause: 'Escape' }, { context: 'emberfall-gameplay' }) : null;
  const actionFor = { W: 'up', UPARROW: 'up', S: 'down', DOWNARROW: 'down', A: 'left', LEFTARROW: 'left', D: 'right', RIGHTARROW: 'right', J: 'attack', E: 'interact', O: 'save', L: 'load', R: 'retry', SPACE: 'dodge', ESC: 'pause' };
  const isDown = key => actions ? actions.held(actionFor[key] ?? key) : down(key);
  const isPressed = key => actions ? actions.pressed(actionFor[key] ?? key) : pressed(key);
  const position = item => item.GetComponent(Transform).position;
  const rectangle = (item, width = .65, height = .65) => new Nereid.Collider(width, height, -width / 2, -height / 2);
  const body = rectangle(entity);
  const walls = scene.children.filter(item => item.GetComponent(BoxCollider)).map(item => {
    const t = position(item), b = item.GetComponent(BoxCollider);
    return { x: t.x, y: t.y, collider: new Nereid.Collider(b.size.x, b.size.y, -b.size.x / 2, -b.size.y / 2) };
  });
  const mover = Nereid.TopDownController ? new Nereid.TopDownController({ speed: 3.6, collider: body, obstacles: walls }) : null;
  if (mover) entity.AddComponent(mover);
  let hud = null, camera = null, music = null, musicGain = null, message = 'Mira is waiting beneath the lantern tree. Find the bridge to the old keep.';
  let attackWasDown = false;
  const actorSprite = Sprite ? entity.GetComponent(Sprite) : null;
  let spriteFrame = 0;
  const tone = (frequency, duration, volume = .2, wave = 'sine') => {
    const ctx = world.sound; if (!ctx || ctx.state !== 'running') return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = wave; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(Math.max(.0001, volume * (JSON.parse(localStorage.getItem('neptune.emberfall.adventure.settings') || '{}').sfx ?? .7)), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
  };
  const audio = () => {
    try {
      if (!world.sound) world.sound = new AudioContext();
      world.sound.resume();
      if (!music) { music = world.sound.createOscillator(); musicGain = world.sound.createGain(); music.type = 'triangle'; music.frequency.value = 82; musicGain.gain.value = .014 * (JSON.parse(localStorage.getItem('neptune.emberfall.adventure.settings') || '{}').music ?? .28); music.connect(musicGain); musicGain.connect(world.sound.destination); music.start(); }
    } catch { /* Audio is optional when the browser blocks WebAudio. */ }
  };
  const setMessage = text => { message = text; };
  const capture = () => ({ version: 1, area: position(entity).x < 13 ? 'hollow' : 'keep', player: { x: position(entity).x, y: position(entity).y, health: combatant.health, maxHealth: combatant.maxHealth, gold: world.gold }, enemies: actors().filter(a => a !== entity.gameplay).map(a => ({ id: a.combatant.id, health: a.combatant.health, x: position(scene.children.find(e => e.gameplay === a)).x, y: position(scene.children.find(e => e.gameplay === a)).y, phase: a.phase })), chestOpened: Boolean(actors().find(a => a.role === 'chest')?.opened), bossCleared: world.bossCleared, altarLit: world.altarLit, bossRewarded: world.bossRewarded, quest: world.quest, completed: world.completed, rewardClaimed: world.bossRewarded, settings: (() => { try { return JSON.parse(localStorage.getItem('neptune.emberfall.adventure.settings') || '{}'); } catch { return {}; } })() });
  const restore = record => {
    if (!record || record.version !== 1 || !record.player || !Number.isFinite(record.player.x) || !Number.isFinite(record.player.y) || !Number.isFinite(record.player.health) || !Number.isFinite(record.player.maxHealth) || !Number.isFinite(record.player.gold) || !Array.isArray(record.enemies) || typeof record.chestOpened !== 'boolean' || typeof record.bossCleared !== 'boolean' || typeof record.altarLit !== 'boolean' || typeof record.bossRewarded !== 'boolean' || typeof record.quest !== 'string' || typeof record.completed !== 'boolean' || typeof record.rewardClaimed !== 'boolean' || record.rewardClaimed !== record.bossRewarded || (record.altarLit && !record.bossCleared) || (record.completed && !record.altarLit)) throw new Error('This journey save is incomplete or has been changed.');
    const known = new Map(actors().filter(a => a !== entity.gameplay).map(a => [a.combatant.id, a]));
    const savedIds = new Set(record.enemies.map(saved => saved?.id));
    if (record.enemies.length !== known.size || savedIds.size !== known.size || [...known.keys()].some(id => !savedIds.has(id)) || record.enemies.some(saved => !known.has(saved.id) || !Number.isFinite(saved.health) || saved.health < 0 || saved.health > known.get(saved.id).combatant.maxHealth || !Number.isFinite(saved.x) || saved.x < 0 || saved.x > 30 || !Number.isFinite(saved.y) || saved.y < 0 || saved.y > 9 || !Number.isInteger(saved.phase) || saved.phase < 1 || saved.phase > 3) || record.player.maxHealth <= 0 || record.player.health < 0 || record.player.health > record.player.maxHealth || record.player.gold < 0 || record.player.x < 0 || record.player.x > 30 || record.player.y < 0 || record.player.y > 9) throw new Error('This journey save does not match the adventure.');
    const p = position(entity); p.x = record.player.x; p.y = record.player.y;
    combatant.maxHealth = record.player.maxHealth; combatant.setHealth?.(Math.max(0, Math.min(combatant.maxHealth, record.player.health)));
    if (typeof combatant.setHealth !== 'function') combatant.health = Math.max(0, Math.min(combatant.maxHealth, record.player.health));
    world.gold = record.player.gold; inventory.gold = world.gold; world.quest = record.quest; world.completed = record.completed;
    world.bossCleared = record.bossCleared; world.altarLit = record.altarLit; world.bossRewarded = record.bossRewarded;
    for (const saved of record.enemies) { const a = known.get(saved.id); a.combatant.setHealth?.(Math.max(0, Math.min(a.combatant.maxHealth, saved.health))); if (typeof a.combatant.setHealth !== 'function') a.combatant.health = Math.max(0, Math.min(a.combatant.maxHealth, saved.health)); a.phase = saved.phase; const e = scene.children.find(candidate => candidate.gameplay === a); Object.assign(position(e), { x: saved.x, y: saved.y }); a.defeated = !a.combatant.isAlive; e.GetComponent(Shape).color = Color.FromHex(a.defeated ? 0x444947 : a.role === 'boss' ? 0xd58d4b : 0x9d6a60); }
    const chest = actors().find(a => a.role === 'chest'); if (chest) { chest.opened = record.chestOpened; const e = scene.children.find(candidate => candidate.gameplay === chest); e.GetComponent(Shape).color = Color.FromHex(chest.opened ? 0x59513e : 0xc79b54); }
  };
  const save = (quiet = false) => { try { manager.save('slot-1', capture()); if (!quiet) setMessage('Journey saved at the last lantern.'); tone(660, .14); } catch { setMessage('The journey could not be saved. Check browser storage and try again.'); } };
  const load = () => { try { const data = manager.load('slot-1'); if (!data) return false; restore(data); setMessage('Journey restored.'); return true; } catch (error) { setMessage(error.message); return false; } };
  const finishIfClear = () => {
    if (world.bossCleared || !actors().some(a => a.role === 'boss' && !a.combatant.isAlive) || actors().some(a => !['player', 'npc', 'boss', 'chest'].includes(a.role) && a.combatant.isAlive)) return;
    world.bossCleared = true; world.quest = 'Use the heartstone altar in the old keep.';
    setMessage('The Keep is quiet. Carry the spark to the heartstone altar.'); tone(784, .5, .22); save(true);
  };
  const move = (dx, dy) => {
    for (const [axis, amount] of [['x', dx], ['y', dy]]) {
      const p = { ...position(entity), [axis]: position(entity)[axis] + amount };
      if (!walls.some(w => body.overlaps(w.collider, p.x, p.y, w.x, w.y))) position(entity)[axis] = p[axis];
    }
  };
  const paint = () => {
    if (!hud) return;
    const alive = actors().filter(a => !['player', 'npc'].includes(a.role) && a.combatant.isAlive).length;
    const phase = actors().find(a => a.role === 'boss')?.phase ?? 1;
    hud.querySelector('[data-status]').textContent = `VITALITY ${Math.ceil(combatant.health)} / ${combatant.maxHealth}   ·   EMBER MARKS ${world.gold}   ·   FOES ${alive}`;
    hud.dataset.area = position(entity).x < 12 ? 'hollow' : 'keep'; hud.dataset.x = String(position(entity).x.toFixed(2)); hud.dataset.y = String(position(entity).y.toFixed(2)); hud.dataset.health = String(Math.ceil(combatant.health)); hud.dataset.foes = String(alive);
    hud.querySelector('[data-quest]').textContent = world.quest;
    hud.querySelector('[data-cue]').textContent = message;
    hud.querySelector('[data-boss]').textContent = alive && phase > 1 ? `KEEP WARDEN · PHASE ${phase}` : '';
    hud.querySelector('[data-end]').textContent = world.completed ? 'THE FIRST EMBER IS LIT — THE HOLLOW WILL SEE ANOTHER DAWN.' : !combatant.isAlive ? 'YOU FELL. Press R to return to the last lantern.' : '';
  };
  const togglePause = () => { world.paused = !world.paused; window.dispatchEvent(new Event(world.paused ? 'emberfall:pause' : 'emberfall:resume')); };
  const listen = (event, fn) => { window.addEventListener(event, fn); world.listeners.push([event, fn]); };
  if (!isPlayer) return { start() {}, update() {}, destroy() { delete entity.gameplay; } };
  return {
    start() {
      camera = new engine.Camera(window.innerWidth, window.innerHeight); scene.activeCamera = camera;
      const main = document.createElement('aside'); main.id = 'emberfall-hud'; main.innerHTML = '<b>EMBERFALL · THE FIRST EMBER</b><div data-status></div><div data-quest></div><div data-cue></div><strong data-boss></strong><strong data-end></strong><small>WASD move · J strike · Space dodge · E interact · Esc pause · O save · L load</small>'; main.style.cssText = 'position:fixed;left:16px;top:14px;max-width:470px;padding:12px 16px;background:#111c20eF;color:#e8dfc9;border:1px solid #9d8054;border-radius:8px;font:13px/1.55 system-ui;pointer-events:none;z-index:20;box-shadow:4px 5px 13px #081010'; document.body.append(main); hud = main;
      listen('emberfall:volume', event => { if (musicGain && world.sound) musicGain.gain.setTargetAtTime(.014 * event.detail.music, world.sound.currentTime, .12); });
      listen('emberfall:save', save);
      listen('emberfall:resume', () => { world.paused = false; });
      listen('keydown', event => { if (event.code === 'Escape' && !event.repeat) { event.preventDefault(); togglePause(); } });
      listen('pointerdown', audio); listen('keydown', audio);
      system.on('death', ({ target }) => {
        const dead = actors().find(a => a.combatant === target);
        if (!dead || dead.role === 'player' || dead.defeated) return;
        dead.defeated = true;
        if (dead.role === 'boss') { setMessage('The Keeper’s heartstone cracks.'); if (!world.bossRewarded) { world.gold += 20; dead.rewarded = true; world.bossRewarded = true; inventory.gold = world.gold; } }
        else { world.gold += 5; inventory.gold = world.gold; setMessage(`${dead.combatant.id} falls. +5 ember marks.`); tone(210, .28, .16, 'square'); }
        finishIfClear(); save(true);
      });
      combatant.onDeath = () => { setMessage('Darkness takes you back to the last lantern. Press R to rise.'); tone(95, .8, .25, 'sawtooth'); };
      if (sessionStorage.getItem('neptune.emberfall.adventure.continue') === '1') {
        sessionStorage.removeItem('neptune.emberfall.adventure.continue');
        world.pendingContinue = true;
      }
      paint();
    },
    update(dt) {
      if (!Number.isFinite(dt)) return;
      const entities = actors();
      const player = position(entity);
      if (world.pendingContinue && entities.length >= 6) { world.pendingContinue = false; if (!load()) setMessage('No valid journey was found. Begin a new one from the title.'); }
      combatant.position.x = player.x; combatant.position.y = player.y;
      camera.zoom = Math.min(window.innerWidth / (14 * 64), window.innerHeight / (9 * 64));
      camera.position.x = Math.max(0, Math.min(16 * 64, player.x * 64 - camera.viewWidth / camera.zoom / 2));
      camera.position.y = Math.max(0, Math.min(0, player.y * 64 - camera.viewHeight / camera.zoom / 2));
      camera.bounds = { minX: 0, minY: 0, maxX: 30 * 64, maxY: 9 * 64 };
      if (world.paused) return;
      if (isPressed('O')) save();
      if (isPressed('L')) load();
      if (isPressed('ESC')) togglePause();
      if (!combatant.isAlive) { if (isPressed('R')) { if (typeof combatant.setHealth === 'function') combatant.setHealth(combatant.maxHealth); else combatant.health = combatant.maxHealth; player.x = 3; player.y = 4.5; setMessage('You return to the last lantern. The keep remains as you left it.'); save(true); } }
      if (combatant.isAlive) {
        let dx = Number(isDown('D') || isDown('RIGHTARROW')) - Number(isDown('A') || isDown('LEFTARROW'));
        let dy = Number(isDown('S') || isDown('DOWNARROW')) - Number(isDown('W') || isDown('UPARROW'));
        const len = Math.hypot(dx, dy); if (len) { dx /= len; dy /= len; world.facing = { x: dx, y: dy }; if (mover) mover.move({ x: dx, y: dy }, dt, walls); else move(dx * dt * 3.6, dy * dt * 3.6); }
        const dodgePressed = isPressed('SPACE');
        if (dodgePressed && len && world.dodge <= 0) { world.dodge = .28; combatant.invulnerableRemaining = Math.max(combatant.invulnerableRemaining, .34); if (mover) mover.move({ x: dx, y: dy }, .22, walls); else move(dx * .82, dy * .82); tone(360, .1, .09, 'triangle'); }
        world.dodge = Math.max(0, world.dodge - dt);
        const attackDown = isDown('J');
        if (attackDown && (!attackWasDown || world.dodge <= 0)) { if (system.startAttack(combatant, attackPlayer, world.facing)) tone(470, .11, .1, 'triangle'); }
        attackWasDown = attackDown;
        if (isPressed('E')) {
          if (player.x < 9 && Math.hypot(player.x - 5, player.y - 4.5) < 1.5) {
            if (world.completed) setMessage('Mira: “You brought the morning back.”');
            else if (world.altarLit) { world.completed = true; world.quest = 'Complete — the Hollow remembers.'; setMessage('Mira: “You brought the morning back.”'); save(true); }
            else if (world.bossCleared) setMessage('Mira: “The heartstone, dear wanderer. Let the ember find its way home.”');
            else { world.quest = 'Mira’s lantern is lit — cross the bridge and enter the old keep.'; setMessage('Mira: “Take my spark. The Keeper has three heartstones; step clear of its wind-up, then strike.”'); tone(520, .18); save(true); }
          }
          else if (Math.hypot(player.x - 23, player.y - 2.5) < 1.3) { const chest = actors().find(a => a.role === 'chest'); if (chest && !chest.opened) { chest.opened = true; world.gold += 15; inventory.gold = world.gold; const e = scene.children.find(candidate => candidate.gameplay === chest); e.GetComponent(Shape).color = Color.FromHex(0x59513e); setMessage('The old coffer holds 15 ember marks.'); tone(720, .2); save(true); } else setMessage('The coffer is already empty.'); }
          else if (player.x > 22 && Math.hypot(player.x - 27.2, player.y - 4.5) < 2) {
            if (!world.bossCleared) setMessage('The heartstone altar is cold while the Keeper still stands.');
            else if (!world.altarLit) { world.altarLit = true; world.quest = 'Return to Mira at Briar Hollow.'; setMessage('The ember answers. Carry its light back across the bridge.'); tone(880, .5, .2); save(true); }
            else setMessage('The heartstone glows steadily. Mira is waiting in the Hollow.');
          } else if (player.x < 11) setMessage('Mira and the lantern are beneath the golden tree to the west.');
          else setMessage('Keep to the Warden’s wind-up, then step in and strike.');
        }
      }
      const hero = heroEntity();
      if (combatant.isAlive && hero) {
        for (const other of entities) {
          if (other === actor || ['npc', 'chest'].includes(other.role) || !other.combatant.isAlive) continue;
          const enemyEntity = scene.children.find(candidate => candidate.gameplay === other); if (!enemyEntity) continue;
          const p = position(enemyEntity), vx = player.x - p.x, vy = player.y - p.y, distance = Math.hypot(vx, vy) || .001;
          const boss = other.role === 'boss', phase = boss ? (other.combatant.health <= 35 ? 3 : other.combatant.health <= 70 ? 2 : 1) : 1; other.phase = phase;
          const material = enemyEntity.GetComponent(Shape);
          const enemySprite = Sprite ? enemyEntity.GetComponent(Sprite) : null;
          const attackState = system._attacks?.get(other.combatant);
          const spritePath = boss ? (attackState?.phase === 'startup' ? 'assets/keeper-windup.svg' : phase === 3 ? 'assets/keeper-phase-three.svg' : phase === 2 ? 'assets/keeper-phase-two.svg' : 'assets/keeper.svg') : (attackState?.phase === 'startup' ? 'assets/sentinel-windup.svg' : 'assets/sentinel.svg');
          if (enemySprite && enemySprite.path !== spritePath) enemySprite.path = spritePath;
          if (attackState?.phase === 'startup') material.color = Color.FromHex(0xf1c75f);
          else if (other.combatant.invulnerableRemaining > 0) material.color = Color.FromHex(0xffffff);
          else material.color = Color.FromHex(boss ? (phase === 3 ? 0xf06d48 : phase === 2 ? 0xd79548 : 0xa75f4d) : 0x977263);
          const range = boss ? (phase === 3 ? 2.25 : 1.95) : .95;
          if (distance < 6.5 && distance > range + .25) {
            const speed = boss ? .62 + phase * .16 : Number(other.role === 'raider' ? .95 : .72);
            const p2 = { x: p.x + vx / distance * dt * speed, y: p.y + vy / distance * dt * speed };
            const enemyBody = rectangle(enemyEntity, boss ? 1 : .65, boss ? 1 : .65);
            if (!walls.some(w => enemyBody.overlaps(w.collider, p2.x, p2.y, w.x, w.y))) Object.assign(p, p2);
          }
          if (distance <= (boss ? 3.2 : 2.5) && !attackState && !other.combatant.cooldowns.has(boss ? 'cleave' : 'lunge')) {
            if (system.startAttack(other.combatant, boss ? bossAttack : enemyAttack, { x: vx, y: vy }) && boss) setMessage('Keeper draws back in gold light — dodge clear of the sweep.');
          }
        }
      }
      system.update(Math.min(dt, .05), entities.map(a => a.combatant));
      const movingNow = isDown('D') || isDown('A') || isDown('W') || isDown('S') || isDown('LEFTARROW') || isDown('RIGHTARROW') || isDown('UPARROW') || isDown('DOWNARROW');
      const attackingNow = Boolean(system._attacks?.has(combatant));
      if (actorSprite) {
        if (attackingNow) actorSprite.path = 'assets/wanderer-strike.svg';
        else if (movingNow) { spriteFrame += dt; if (spriteFrame > .18) { actorSprite.path = actorSprite.path.endsWith('wanderer-step.svg') ? 'assets/wanderer-rest.svg' : 'assets/wanderer-step.svg'; spriteFrame = 0; } }
        else { actorSprite.path = 'assets/wanderer-rest.svg'; spriteFrame = 0; }
      }
      const bob = Math.sin(performance.now() / 125) * .025;
      entity.GetComponent(Shape).color = combatant.invulnerableRemaining > 0 ? Color.FromHex(0xffffff) : Color.FromHex(Math.round(0x7fd0a7 + Math.sin(performance.now() / 150) * 0x080000));
      entity.GetComponent(Shape).height = .7 + bob;
      world.sincePaint += dt; if (world.sincePaint > .08) { paint(); world.sincePaint = 0; }
    },
    destroy() { hud?.remove(); if (scene.activeCamera === camera) scene.activeCamera = null; for (const [event, fn] of world.listeners) window.removeEventListener(event, fn); actions?.dispose(); if (mover) entity.RemoveComponent(mover); try { world.sound?.close(); } catch {} delete entity.gameplay; }
  };
}
