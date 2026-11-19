// One bundled project module so it can be fetched and executed as a Blob.
export function create({ entity, engine, properties }) {
  const { Transform, Shape, Color, KeyboardInput: Input, SceneManager, SaveManager, BoxCollider, Nereid, Larissa } = engine;
  const Sprite = engine.Sprite;
  const { Combatant, CombatSystem, AttackDefinition, Inventory } = Larissa;
  const scene = SceneManager.GetActiveScene();
  const transform = entity.GetComponent(Transform);
  const isPlayer = properties.role === 'player';
  const isBoss = properties.role === 'boss';
  const combatant = new Combatant({ id: entity.id, faction: isPlayer ? 'hero' : 'wild', maxHealth: properties.health ?? 1, hurtbox: { width: isBoss ? 1.15 : .72, height: isBoss ? 1.15 : .72 }, invulnerabilityDuration: .55 });
  const actor = { combatant, role: properties.role, requires: properties.requires ?? [], label: properties.label ?? entity.name, gold: 0, phase: 1, defeated: false };
  entity.gameplay = actor;
  const actors = () => scene.children.map(item => item.gameplay).filter(item => item?.combatant);
  const heroEntity = () => scene.children.find(item => item.gameplay?.role === 'player');
  const manager = new SaveManager({ prefix: 'neptune.emberfall.adventure' });
  const system = new CombatSystem();
  const inventory = new Inventory(12);
  const attackPlayer = new AttackDefinition({ name: 'ember-cut', damage: 27, range: 1.45, hitbox: { width: 1.35, height: 1.25 }, startup: .12, active: .13, recovery: .2, cooldown: .38 });
  const enemyAttack = new AttackDefinition({ name: 'lunge', damage: 9, range: 1.35, hitbox: { width: 1.25, height: 1 }, startup: .62, active: .12, recovery: .4, cooldown: 1.5 });
  const bossAttack = new AttackDefinition({ name: 'cleave', damage: 15, range: 2.05, hitbox: { width: 2, height: 1.65 }, startup: .82, active: .14, recovery: .52, cooldown: 1.85 });
  const world = { system, inventory, completed: false, bossCleared: false, altarLit: false, bossRewarded: false, sparked: false, paused: false, gold: 0, quest: 'Speak with Mira in Briar Hollow (E).', listeners: [], sound: null, sincePaint: 0, dodge: 0, facing: { x: 1, y: 0 } };
  const dimensions = properties.world ?? { width: 30, height: 9 };
  const requiredRelics = properties.requiredRelics ?? [];
  const spawn = { ...transform.position };
  world.relics = [];
  const isHostile = a => ['raider', 'sentinel', 'boss'].includes(a.role);
  const objectFor = a => scene.children.find(item => item.gameplay === a);
  const byRole = role => actors().filter(a => a.role === role);
  const down = key => Input.IsKeyDown(Input.KEY_CODE[key]);
  const pressed = key => Input.IsKeyPressed(Input.KEY_CODE[key]);
  const actions = isPlayer && engine.InputActions ? new engine.InputActions({ up: ['W', 'ArrowUp'], down: ['S', 'ArrowDown'], left: ['A', 'ArrowLeft'], right: ['D', 'ArrowRight'], attack: 'J', interact: 'E', save: 'O', load: 'L', retry: 'R', dodge: 'Space', pause: 'Escape' }, { context: 'emberfall-gameplay' }) : null;
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
  const initialScene = isPlayer && !document.querySelector('#title') ? scene.serialize() : null;
  const asset = name => `${globalThis.__neptuneProjectResources ? '/assets/' : 'assets/'}${name}.png`;
  const mover = isPlayer && Nereid.TopDownController ? new Nereid.TopDownController({ speed: 3.6, collider: body, obstacles: walls }) : null;
  if (mover) entity.AddComponent(mover);
  let hud = null, camera = null, music = null, musicGain = null, fallback = null, message = 'Mira is waiting beneath the lantern tree. Find the bridge to the old keep.';
  let attackWasDown = false;
  const actorSprite = Sprite ? entity.GetComponent(Sprite) : null;
  let spriteFrame = 0;
  const soundSettings = () => { try { return JSON.parse(localStorage.getItem('neptune.emberfall.adventure.settings') || '{}'); } catch { return {}; } };
  const tone = (frequency, duration, volume = .2, wave = 'sine') => {
    const ctx = world.sound; if (!ctx || ctx.state !== 'running') return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = wave; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(Math.max(.0001, volume * (soundSettings().sfx ?? .7)), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
  };
  const audio = () => {
    try {
      if (!world.sound) world.sound = new AudioContext();
      world.sound.resume();
      if (!music) { music = world.sound.createOscillator(); musicGain = world.sound.createGain(); music.type = 'triangle'; music.frequency.value = 82; musicGain.gain.value = .014 * (soundSettings().music ?? .28); music.connect(musicGain); musicGain.connect(world.sound.destination); music.start(); }
    } catch { /* Audio is optional when the browser blocks WebAudio. */ }
  };
  const setMessage = text => { message = text; };
  const areaAt = p => p.x < 13 ? 'hollow' : 'keep';
  const capture = () => ({ version: 2, worldId: scene.id, area: areaAt(position(entity)), player: { x: position(entity).x, y: position(entity).y, health: combatant.health, maxHealth: combatant.maxHealth, gold: world.gold }, enemies: actors().filter(a => a !== actor).map(a => { const p = position(objectFor(a)); return { id: a.combatant.id, health: a.combatant.health, x: p.x, y: p.y, phase: a.phase }; }), chests: byRole('chest').filter(a => a.opened).map(a => a.combatant.id), relics: [...world.relics], bossCleared: world.bossCleared, altarLit: world.altarLit, bossRewarded: world.bossRewarded, sparked: world.sparked, quest: world.quest, completed: world.completed });
  const restore = record => {
    if (!record || record.version !== 2 || record.worldId !== scene.id || !record.player || !Array.isArray(record.enemies) || !Array.isArray(record.chests) || !Array.isArray(record.relics) || typeof record.bossCleared !== 'boolean' || typeof record.altarLit !== 'boolean' || typeof record.bossRewarded !== 'boolean' || typeof record.sparked !== 'boolean' || typeof record.completed !== 'boolean' || typeof record.quest !== 'string') throw new Error('This save is incomplete or belongs to a different adventure.');
    const known = new Map(actors().filter(a => a !== actor).map(a => [a.combatant.id, a]));
    const uniqueKnown = (items, allowed) => new Set(items).size === items.length && items.every(id => allowed.includes(id));
    const savedIds = record.enemies.map(saved => saved?.id);
    const validPosition = p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= dimensions.width && p.y >= 0 && p.y <= dimensions.height;
    if (record.enemies.length !== known.size || !uniqueKnown(savedIds, [...known.keys()]) || record.enemies.some(saved => !validPosition(saved) || !Number.isFinite(saved.health) || saved.health < 0 || saved.health > known.get(saved.id).combatant.maxHealth || !Number.isInteger(saved.phase) || saved.phase < 1 || saved.phase > 3) || !validPosition(record.player) || record.player.maxHealth !== combatant.maxHealth || !Number.isFinite(record.player.health) || record.player.health < 0 || record.player.health > combatant.maxHealth || !uniqueKnown(record.chests, byRole('chest').map(a => a.combatant.id)) || !uniqueKnown(record.relics, requiredRelics)) throw new Error('This journey save does not match the adventure.');
    const hostile = record.enemies.filter(saved => isHostile(known.get(saved.id)));
    const boss = hostile.find(saved => known.get(saved.id).role === 'boss');
    const expectedGold = hostile.filter(saved => saved.health === 0 && known.get(saved.id).role !== 'boss').length * 5 + (record.bossRewarded ? 20 : 0) + record.chests.length * 15;
    if (!boss || record.player.gold !== expectedGold || record.bossRewarded !== (boss.health === 0) || record.bossCleared !== (boss.health === 0 && (requiredRelics.length > 0 || hostile.every(saved => saved.health === 0))) || (record.bossCleared && record.relics.length !== requiredRelics.length) || (record.altarLit && (!record.bossCleared || !record.sparked)) || (record.completed && !record.altarLit) || record.area !== areaAt(record.player)) throw new Error('This journey save has inconsistent progress.');
    for (const id of record.relics) { const relic = known.get(id); if (!relic || relic.role !== 'relic' || relic.requires.some(guard => !hostile.some(saved => saved.id === guard && saved.health === 0))) throw new Error('This journey save has inconsistent relic progress.'); }
    system._attacks.clear(); system._projectiles.length = 0;
    Object.assign(position(entity), { x: record.player.x, y: record.player.y }); combatant.setHealth(record.player.health);
    world.gold = record.player.gold; inventory.gold = world.gold; world.quest = record.quest; world.completed = record.completed; world.sparked = record.sparked; world.bossCleared = record.bossCleared; world.altarLit = record.altarLit; world.bossRewarded = record.bossRewarded; world.relics = [...record.relics];
    for (const saved of record.enemies) { const a = known.get(saved.id), e = objectFor(a); a.combatant.setHealth(saved.health); a.phase = saved.phase; Object.assign(position(e), { x: saved.x, y: saved.y }); a.defeated = !a.combatant.isAlive; const sprite = e.GetComponent(Sprite); if (sprite) sprite.enabled = !a.defeated; if (isHostile(a)) e.GetComponent(Shape).color = Color.FromHex(a.defeated ? 0x444947 : a.role === 'boss' ? 0xd58d4b : 0x9d6a60); }
    for (const chest of byRole('chest')) { chest.opened = record.chests.includes(chest.combatant.id); objectFor(chest).GetComponent(Shape).color = Color.FromHex(chest.opened ? 0x59513e : 0xc79b54); }
    for (const relic of byRole('relic')) objectFor(relic).GetComponent(Shape).color = Color.FromHex(world.relics.includes(relic.combatant.id) ? 0x59513e : 0xe6b95c);
  };
  const save = (quiet = false) => { try { manager.save('slot-1', capture()); if (!quiet) setMessage('Journey saved at the last lantern.'); tone(660, .14); } catch { setMessage('The journey could not be saved. Check browser storage and try again.'); } };
  const load = () => { try { const data = manager.load('slot-1'); if (!data) return false; restore(data); setMessage('Journey restored.'); return true; } catch (error) { setMessage(error.message); return false; } };
  const finishIfClear = () => {
    if (world.bossCleared || !byRole('boss').some(a => !a.combatant.isAlive) || (requiredRelics.length ? world.relics.length !== requiredRelics.length : actors().some(a => isHostile(a) && a.role !== 'boss' && a.combatant.isAlive))) return;
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
    const alive = actors().filter(a => isHostile(a) && a.combatant.isAlive).length;
    const phase = actors().find(a => a.role === 'boss')?.phase ?? 1;
    hud.querySelector('[data-status]').textContent = `VITALITY ${Math.ceil(combatant.health)} / ${combatant.maxHealth}   ·   EMBER MARKS ${world.gold}   ·   FOES ${alive}`;
    hud.dataset.area = areaAt(position(entity)); hud.dataset.x = String(position(entity).x.toFixed(2)); hud.dataset.y = String(position(entity).y.toFixed(2)); hud.dataset.health = String(Math.ceil(combatant.health)); hud.dataset.foes = String(alive);
    let direction = '';
    if (requiredRelics.length && world.sparked && !world.bossCleared && world.relics.length < requiredRelics.length) {
      const target = actors().find(a => a.combatant.id === requiredRelics.find(id => !world.relics.includes(id)));
      if (target) { const p = position(objectFor(target)), player = position(entity), dx = p.x - player.x, dy = p.y - player.y; direction = ' · ' + (Math.abs(dx) > 2 ? (dx > 0 ? 'east' : 'west') : '') + (Math.abs(dx) > 2 && Math.abs(dy) > 2 ? ', ' : '') + (Math.abs(dy) > 2 ? (dy > 0 ? 'south' : 'north') : '') + ' (' + Math.round(p.x) + ', ' + Math.round(p.y) + ')'; world.quest = 'Find ' + target.label + ' · seals ' + world.relics.length + '/' + requiredRelics.length; }
    } else if (requiredRelics.length && world.sparked && !world.bossCleared && world.relics.length === requiredRelics.length) world.quest = 'All seals recovered. Defeat the Keeper in the southeast vault.';
    hud.querySelector('[data-quest]').textContent = world.quest + direction;
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
      // The editor runs project behaviours without the browser menu shell.
      if (!document.querySelector('#title')) {
        fallback = document.createElement('section');
        fallback.style.cssText = 'position:fixed;inset:0;z-index:100;text-align:center;padding:15vh 20px;background:#101b20ee;color:#f1e8d4;font:16px system-ui';
        fallback.innerHTML = '<h1>EMBERFALL · THE FIRST EMBER</h1><p data-menu-message>Bring Mira’s spark to the heartstone.</p><button data-begin>Begin journey</button><button data-continue>Continue</button><button data-resume hidden>Resume</button><button data-save hidden>Save journey</button><button data-title hidden>Return to title</button><label>Music <input data-music type="range" min="0" max="1" step="0.05"></label><label>Effects <input data-sfx type="range" min="0" max="1" step="0.05"></label>';
        document.body.append(fallback); world.paused = true;
        const getSettings = () => { try { return JSON.parse(localStorage.getItem('neptune.emberfall.adventure.settings') || '{}'); } catch { return {}; } };
        for (const name of ['music', 'sfx']) { const input = fallback.querySelector('[data-' + name + ']'); input.value = getSettings()[name] ?? (name === 'music' ? .28 : .7); input.oninput = () => { const settings = { ...getSettings(), [name]: Number(input.value) }; localStorage.setItem('neptune.emberfall.adventure.settings', JSON.stringify(settings)); window.dispatchEvent(new CustomEvent('emberfall:volume', { detail: settings })); }; }
        fallback.querySelector('[data-continue]').disabled = !localStorage.getItem('neptune.emberfall.adventure.slot-1');
        fallback.querySelector('[data-begin]').onclick = () => { localStorage.removeItem('neptune.emberfall.adventure.slot-1'); world.paused = false; fallback.hidden = true; };
        fallback.querySelector('[data-continue]').onclick = () => { world.pendingContinue = true; world.paused = false; fallback.hidden = true; };
        fallback.querySelector('[data-resume]').onclick = () => { world.paused = false; fallback.hidden = true; };
        fallback.querySelector('[data-save]').onclick = () => { save(); fallback.querySelector('[data-menu-message]').textContent = message; };
        fallback.querySelector('[data-title]').onclick = () => { globalThis.game.loadScene(initialScene); };
        listen('emberfall:pause', () => { fallback.hidden = false; fallback.querySelector('[data-begin]').hidden = true; fallback.querySelector('[data-continue]').hidden = true; fallback.querySelector('[data-resume]').hidden = false; fallback.querySelector('[data-save]').hidden = false; fallback.querySelector('[data-title]').hidden = false; });
        listen('emberfall:invalid-save', event => { fallback.hidden = false; fallback.querySelector('[data-menu-message]').textContent = 'Continue failed: ' + event.detail; });
      }
      listen('emberfall:volume', event => { if (musicGain && world.sound) musicGain.gain.setTargetAtTime(.014 * event.detail.music, world.sound.currentTime, .12); });
      listen('emberfall:save', save);
      listen('emberfall:resume', () => { world.paused = false; if (fallback) fallback.hidden = true; });
      listen('keydown', event => { if (event.code === 'Escape' && !event.repeat && world.paused && (!fallback || !fallback.querySelector('[data-resume]').hidden)) { event.preventDefault(); world.ignoreEscape = true; togglePause(); } });
      listen('pointerdown', audio); listen('keydown', audio);
      system.on('death', ({ target }) => {
        const dead = actors().find(a => a.combatant === target);
        if (!dead || dead.role === 'player' || dead.defeated) return;
        dead.defeated = true;
        const fallen = scene.children.find(candidate => candidate.gameplay === dead);
        const fallenSprite = fallen?.GetComponent(Sprite); if (fallenSprite) fallenSprite.enabled = false;
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
      if (world.pendingContinue && entities.length === scene.children.filter(item => item.components?.some(component => component.constructor.name === 'ProjectBehaviour' && component.properties.module === 'scripts/adventure-game.js')).length) { world.pendingContinue = false; if (!load()) { world.paused = true; window.dispatchEvent(new CustomEvent('emberfall:invalid-save', { detail: message })); return; } }
      combatant.position.x = player.x; combatant.position.y = player.y;
      camera.zoom = Math.min(window.innerWidth / (14 * 64), window.innerHeight / (9 * 64));
      camera.position.x = Math.max(0, Math.min(Math.max(0, dimensions.width * 64 - camera.viewWidth / camera.zoom), player.x * 64 - camera.viewWidth / camera.zoom / 2));
      camera.position.y = Math.max(0, Math.min(Math.max(0, dimensions.height * 64 - camera.viewHeight / camera.zoom), player.y * 64 - camera.viewHeight / camera.zoom / 2));
      camera.bounds = { minX: 0, minY: 0, maxX: dimensions.width * 64, maxY: dimensions.height * 64 };
      if (world.paused) return;
      if (isPressed('O')) save();
      if (isPressed('L')) load();
      if (isPressed('ESC')) { if (world.ignoreEscape) world.ignoreEscape = false; else { togglePause(); return; } }
      if (!combatant.isAlive) { if (isPressed('R')) { if (typeof combatant.setHealth === 'function') combatant.setHealth(combatant.maxHealth); else combatant.health = combatant.maxHealth; player.x = spawn.x; player.y = spawn.y; setMessage('You return to the last lantern. The keep remains as you left it.'); save(true); } }
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
          const nearby = actors().filter(a => ['npc', 'chest', 'relic', 'altar'].includes(a.role)).map(a => ({ actor: a, distance: Math.hypot(player.x - position(objectFor(a)).x, player.y - position(objectFor(a)).y) })).filter(item => item.distance < 1.6).sort((a, b) => a.distance - b.distance)[0]?.actor;
          const altar = properties.altar ?? { x: 27.2, y: 4.5 };
          if (nearby?.role === 'npc') {
            if (world.completed) setMessage('Mira: “You brought the morning back.”');
            else if (world.altarLit) { world.completed = true; world.quest = 'Complete — the Hollow remembers.'; setMessage('Mira: “You brought the morning back.”'); save(true); }
            else if (!world.sparked) { world.sparked = true; world.quest = world.bossCleared ? 'Use the heartstone altar in the old keep.' : 'Cross the bridge and enter the old keep.'; setMessage(requiredRelics.length ? 'Mira: “Take my spark. Recover the three seals, then face the Keeper. Follow the directions in your journal.”' : 'Mira: “Take my spark. The Keeper has three heartstones; step clear of its wind-up, then strike.”'); tone(520, .18); save(true); }
            else if (world.bossCleared) setMessage('Mira: “The heartstone, dear wanderer. Let the ember find its way home.”');
            else setMessage('Mira: “Follow your journal, and step clear of the guardians’ wind-up.”');
          } else if (nearby?.role === 'chest') {
            if (!nearby.opened) { nearby.opened = true; world.gold += 15; inventory.gold = world.gold; objectFor(nearby).GetComponent(Shape).color = Color.FromHex(0x59513e); setMessage('The old coffer holds 15 ember marks.'); tone(720, .2); save(true); } else setMessage('The coffer is already empty.');
          } else if (nearby?.role === 'relic') {
            const guards = nearby.requires.filter(id => !actors().some(a => a.combatant.id === id && isHostile(a) && !a.combatant.isAlive));
            if (!world.sparked) setMessage('Mira’s spark is needed to claim the seals.');
            else if (world.relics.includes(nearby.combatant.id)) setMessage(nearby.label + ' is already yours.');
            else if (guards.length) setMessage(nearby.label + ' is guarded: defeat ' + guards.length + ' remaining guardian' + (guards.length === 1 ? '.' : 's.'));
            else { world.relics.push(nearby.combatant.id); objectFor(nearby).GetComponent(Shape).color = Color.FromHex(0x59513e); setMessage(nearby.label + ' recovered.'); tone(740, .3); save(true); }
          } else if (nearby?.role === 'altar' || (!requiredRelics.length && Math.hypot(player.x - altar.x, player.y - altar.y) < 2)) {
            if (!world.sparked) setMessage('The altar needs Mira’s spark. Speak to her in the Hollow.');
            else if (!world.bossCleared) setMessage('The heartstone altar is cold while the Keeper still stands.');
            else if (!world.altarLit) { world.altarLit = true; world.quest = 'Return to Mira at Briar Hollow.'; setMessage('The ember answers. Carry its light back to Mira.'); tone(880, .5, .2); save(true); }
            else setMessage('The heartstone glows steadily. Mira is waiting in the Hollow.');
          } else setMessage('Follow your journal. Stand beside a person, coffer, seal or altar and press E.');
        }
      }
      const hero = heroEntity();
      if (combatant.isAlive && hero) {
        for (const other of entities) {
          if (!isHostile(other) || !other.combatant.isAlive) continue;
          const enemyEntity = scene.children.find(candidate => candidate.gameplay === other); if (!enemyEntity) continue;
          const p = position(enemyEntity), vx = player.x - p.x, vy = player.y - p.y, distance = Math.hypot(vx, vy) || .001;
          other.combatant.position.x = p.x; other.combatant.position.y = p.y;
          const boss = other.role === 'boss', phase = boss ? (other.combatant.health <= 35 ? 3 : other.combatant.health <= 70 ? 2 : 1) : 1; other.phase = phase;
          const material = enemyEntity.GetComponent(Shape);
          const sealedBoss = boss && world.relics.length < requiredRelics.length;
          if (sealedBoss) { other.combatant.invulnerableRemaining = 1; if (distance < 4) setMessage('The Keeper is protected. Recover the three seals first.'); continue; }
          const enemySprite = Sprite ? enemyEntity.GetComponent(Sprite) : null;
          const attackState = system._attacks?.get(other.combatant);
          const spritePath = boss ? (attackState?.phase === 'startup' ? asset('keeper-windup') : phase === 3 ? asset('keeper-phase-three') : phase === 2 ? asset('keeper-phase-two') : asset('keeper')) : (attackState?.phase === 'startup' ? asset('sentinel-windup') : asset('sentinel'));
          if (enemySprite && enemySprite.path !== spritePath) enemySprite.path = spritePath;
          if (attackState?.phase === 'startup') material.color = Color.FromHex(0xf1c75f);
          else if (other.combatant.invulnerableRemaining > 0) material.color = Color.FromHex(0xffffff);
          else material.color = Color.FromHex(boss ? (phase === 3 ? 0xf06d48 : phase === 2 ? 0xd79548 : 0xa75f4d) : 0x977263);
          const range = boss ? (phase === 3 ? 2.25 : 1.95) : .95;
          if (!attackState && distance < 6.5 && distance > range + .25) {
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
      system.update(Math.min(dt, .05), entities.filter(a => a === actor || isHostile(a)).map(a => a.combatant));
      const movingNow = isDown('D') || isDown('A') || isDown('W') || isDown('S') || isDown('LEFTARROW') || isDown('RIGHTARROW') || isDown('UPARROW') || isDown('DOWNARROW');
      const attackingNow = Boolean(system._attacks?.has(combatant));
      if (actorSprite) {
        if (attackingNow) actorSprite.path = asset('wanderer-strike');
        else if (movingNow) { spriteFrame += dt; if (spriteFrame > .18) { actorSprite.path = actorSprite.path.endsWith('wanderer-step.png') ? asset('wanderer-rest') : asset('wanderer-step'); spriteFrame = 0; } }
        else { actorSprite.path = asset('wanderer-rest'); spriteFrame = 0; }
      }
      const bob = Math.sin(performance.now() / 125) * .025;
      entity.GetComponent(Shape).color = combatant.invulnerableRemaining > 0 ? Color.FromHex(0xffffff) : Color.FromHex(Math.round(0x7fd0a7 + Math.sin(performance.now() / 150) * 0x080000));
      entity.GetComponent(Shape).height = .7 + bob;
      world.sincePaint += dt; if (world.sincePaint > .08) { paint(); world.sincePaint = 0; }
    },
    destroy() { hud?.remove(); fallback?.remove(); if (scene.activeCamera === camera) scene.activeCamera = null; for (const [event, fn] of world.listeners) window.removeEventListener(event, fn); actions?.dispose(); if (mover) entity.RemoveComponent(mover); try { music?.stop(); music?.disconnect(); musicGain?.disconnect(); world.sound?.close(); } catch {} delete entity.gameplay; }
  };
}
