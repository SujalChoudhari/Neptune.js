// Emberfall: The First Ember — Adventure Gameplay Module
export function create({ entity, engine, properties }) {
  const { Transform, Shape, Color, KeyboardInput: Input, SceneManager, SaveManager, BoxCollider, Nereid, Larissa } = engine;
  const Sprite = engine.Sprite;
  const { Combatant, CombatSystem, AttackDefinition, Inventory } = Larissa;
  const scene = SceneManager.GetActiveScene();
  const transform = entity.GetComponent(Transform);
  const isPlayer = properties.role === 'player';
  const isBoss = properties.role === 'boss';

  const combatant = new Combatant({
    id: entity.id,
    faction: isPlayer ? 'hero' : 'wild',
    maxHealth: properties.health ?? 1,
    hurtbox: { width: isBoss ? 1.15 : 0.72, height: isBoss ? 1.15 : 0.72 },
    invulnerabilityDuration: 0.55
  });

  const actor = {
    combatant,
    role: properties.role,
    requires: properties.requires ?? [],
    label: properties.label ?? entity.name,
    gold: 0,
    phase: 1,
    defeated: false
  };
  entity.gameplay = actor;

  const actors = () => scene.children.map(item => item.gameplay).filter(item => item?.combatant);
  const heroEntity = () => scene.children.find(item => item.gameplay?.role === 'player');
  const manager = new SaveManager({ prefix: 'neptune.emberfall.adventure' });
  const system = new CombatSystem();
  const inventory = new Inventory(12);

  const attackPlayer = new AttackDefinition({
    name: 'ember-cut',
    damage: 27,
    range: 1.45,
    hitbox: { width: 1.35, height: 1.25 },
    startup: 0.12,
    active: 0.13,
    recovery: 0.2,
    cooldown: 0.38
  });

  const enemyAttack = new AttackDefinition({
    name: 'lunge',
    damage: 9,
    range: 1.35,
    hitbox: { width: 1.25, height: 1 },
    startup: 0.62,
    active: 0.12,
    recovery: 0.4,
    cooldown: 1.5
  });

  const bossAttack = new AttackDefinition({
    name: 'cleave',
    damage: 15,
    range: 2.05,
    hitbox: { width: 2, height: 1.65 },
    startup: 0.82,
    active: 0.14,
    recovery: 0.52,
    cooldown: 1.85
  });

  const world = {
    system,
    inventory,
    completed: false,
    bossCleared: false,
    altarLit: false,
    bossRewarded: false,
    sparked: false,
    paused: false,
    gold: 0,
    quest: 'Speak with Mira in Briar Hollow (E).',
    listeners: [],
    sound: null,
    sincePaint: 0,
    dodge: 0,
    facing: { x: 1, y: 0 },
    screenShake: 0,
    tutorialStep: 0,
    movedDistance: 0
  };

  const dimensions = properties.world ?? { width: 30, height: 9 };
  const requiredRelics = properties.requiredRelics ?? [];
  const spawn = { ...transform.position };
  world.relics = [];

  const isHostile = a => ['raider', 'sentinel', 'boss'].includes(a.role);
  const objectFor = a => scene.children.find(item => item.gameplay === a);
  const byRole = role => actors().filter(a => a.role === role);
  const down = key => Input.IsKeyDown(Input.KEY_CODE[key]);
  const pressed = key => Input.IsKeyPressed(Input.KEY_CODE[key]);

  const actions = isPlayer && engine.InputActions ? new engine.InputActions({
    up: ['W', 'ArrowUp'],
    down: ['S', 'ArrowDown'],
    left: ['A', 'ArrowLeft'],
    right: ['D', 'ArrowRight'],
    attack: 'J',
    interact: 'E',
    save: 'O',
    load: 'L',
    retry: 'R',
    dodge: 'Space',
    pause: 'Escape'
  }, { context: 'emberfall-gameplay' }) : null;

  const actionFor = {
    W: 'up', UPARROW: 'up', S: 'down', DOWNARROW: 'down',
    A: 'left', LEFTARROW: 'left', D: 'right', RIGHTARROW: 'right',
    J: 'attack', E: 'interact', O: 'save', L: 'load', R: 'retry',
    SPACE: 'dodge', ESC: 'pause'
  };

  const isDown = key => actions ? actions.held(actionFor[key] ?? key) : down(key);
  const isPressed = key => actions ? actions.pressed(actionFor[key] ?? key) : pressed(key);
  const position = item => item.GetComponent(Transform).position;
  const rectangle = (item, width = 0.65, height = 0.65) => new Nereid.Collider(width, height, -width / 2, -height / 2);
  const body = rectangle(entity);

  const walls = scene.children.filter(item => item.GetComponent(BoxCollider)).map(item => {
    const t = position(item), b = item.GetComponent(BoxCollider);
    return { x: t.x, y: t.y, collider: new Nereid.Collider(b.size.x, b.size.y, -b.size.x / 2, -b.size.y / 2) };
  });

  const initialScene = isPlayer && !document.querySelector('#title') ? scene.serialize() : null;
  const asset = name => `${globalThis.__neptuneProjectResources ? '/assets/' : 'assets/'}${name}.png`;

  const mover = isPlayer && Nereid.TopDownController
    ? new Nereid.TopDownController({ speed: 3.6, collider: body, obstacles: walls })
    : null;
  if (mover) entity.AddComponent(mover);

  let hud = null, camera = null, musicGain = null, fallback = null;
  let message = 'Mira is waiting beneath the lantern tree. Find the bridge to the old keep.';
  let attackWasDown = false;
  const actorSprite = Sprite ? entity.GetComponent(Sprite) : null;
  let spriteFrame = 0;

  // Visual Sprites for Non-Player Interactables (chests, altar, relics, mira)
  const syncInteractableSprites = () => {
    for (const actorItem of actors()) {
      const obj = objectFor(actorItem);
      if (!obj || !Sprite) continue;
      let spr = obj.GetComponent(Sprite);
      if (!spr) {
        let p = null;
        if (actorItem.role === 'npc') p = asset('mira');
        else if (actorItem.role === 'chest') p = asset(actorItem.opened ? 'chest-open' : 'chest-closed');
        else if (actorItem.role === 'relic') p = asset('relic');
        else if (actorItem.role === 'altar') p = asset(world.altarLit ? 'altar-lit' : 'altar');
        if (p) {
          spr = new Sprite(p, 1, 1);
          obj.AddComponent(spr);
        }
      } else {
        if (actorItem.role === 'chest') spr.path = asset(actorItem.opened ? 'chest-open' : 'chest-closed');
        else if (actorItem.role === 'altar') spr.path = asset(world.altarLit ? 'altar-lit' : 'altar');
      }
    }
  };

  const soundSettings = () => {
    try {
      return JSON.parse(localStorage.getItem('neptune.emberfall.adventure.settings') || '{}');
    } catch {
      return {};
    }
  };

  const tone = (frequency, duration, volume = 0.2, wave = 'sine') => {
    const ctx = world.sound;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      const vol = Math.max(0.0001, volume * (soundSettings().sfx ?? 0.7));
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Synthesized Ambient Music Tracks (Hollow, Keep, Boss)
  let musicTimer = null;
  const startSynthesizedMusic = () => {
    const ctx = world.sound;
    if (!ctx || musicTimer) return;
    let step = 0;
    const hollowNotes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
    const keepNotes = [110, 130.81, 146.83, 164.81, 174.61, 220];
    const bossNotes = [98, 116.54, 130.81, 146.83, 196, 233.08];

    const tickMusic = () => {
      if (!world.sound || world.sound.state !== 'running' || world.paused) {
        musicTimer = setTimeout(tickMusic, 600);
        return;
      }
      const playerPos = position(entity);
      const isHollow = playerPos.x < 13;
      const isBossArea = playerPos.x > 48 && !world.bossCleared;
      const scale = isBossArea ? bossNotes : isHollow ? hollowNotes : keepNotes;
      const note = scale[step % scale.length];
      const duration = isBossArea ? 0.22 : 0.6;
      const interval = isBossArea ? 280 : isHollow ? 750 : 650;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isBossArea ? 'sawtooth' : isHollow ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(note, ctx.currentTime);
        const masterMusic = soundSettings().music ?? 0.28;
        const noteVol = (isBossArea ? 0.04 : 0.035) * masterMusic;
        gain.gain.setValueAtTime(Math.max(0.0001, noteVol), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}

      step++;
      musicTimer = setTimeout(tickMusic, interval);
    };
    musicTimer = setTimeout(tickMusic, 500);
  };

  const audio = () => {
    try {
      if (!world.sound) world.sound = new AudioContext();
      if (world.sound.state === 'suspended') world.sound.resume();
      startSynthesizedMusic();
    } catch {}
  };

  const setMessage = text => { message = text; };
  const areaAt = p => p.x < 13 ? 'hollow' : 'keep';

  const capture = () => ({
    version: 2,
    worldId: scene.id,
    area: areaAt(position(entity)),
    player: {
      x: position(entity).x,
      y: position(entity).y,
      health: combatant.health,
      maxHealth: combatant.maxHealth,
      gold: world.gold
    },
    enemies: actors().filter(a => a !== actor).map(a => {
      const p = position(objectFor(a));
      return { id: a.combatant.id, health: a.combatant.health, x: p.x, y: p.y, phase: a.phase };
    }),
    chests: byRole('chest').filter(a => a.opened).map(a => a.combatant.id),
    relics: [...world.relics],
    bossCleared: world.bossCleared,
    altarLit: world.altarLit,
    bossRewarded: world.bossRewarded,
    sparked: world.sparked,
    quest: world.quest,
    completed: world.completed
  });

  const restore = record => {
    if (!record || record.version !== 2 || record.worldId !== scene.id || !record.player || !Array.isArray(record.enemies) || !Array.isArray(record.chests) || !Array.isArray(record.relics) || typeof record.bossCleared !== 'boolean' || typeof record.altarLit !== 'boolean' || typeof record.bossRewarded !== 'boolean' || typeof record.sparked !== 'boolean' || typeof record.completed !== 'boolean' || typeof record.quest !== 'string') {
      throw new Error('This save is incomplete or belongs to a different adventure.');
    }
    const known = new Map(actors().filter(a => a !== actor).map(a => [a.combatant.id, a]));
    const uniqueKnown = (items, allowed) => new Set(items).size === items.length && items.every(id => allowed.includes(id));
    const savedIds = record.enemies.map(saved => saved?.id);
    const validPosition = p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= dimensions.width && p.y >= 0 && p.y <= dimensions.height;
    if (record.enemies.length !== known.size || !uniqueKnown(savedIds, [...known.keys()]) || record.enemies.some(saved => !validPosition(saved) || !Number.isFinite(saved.health) || saved.health < 0 || saved.health > known.get(saved.id).combatant.maxHealth || !Number.isInteger(saved.phase) || saved.phase < 1 || saved.phase > 3) || !validPosition(record.player) || record.player.maxHealth !== combatant.maxHealth || !Number.isFinite(record.player.health) || record.player.health < 0 || record.player.health > combatant.maxHealth || !uniqueKnown(record.chests, byRole('chest').map(a => a.combatant.id)) || !uniqueKnown(record.relics, requiredRelics)) {
      throw new Error('This journey save does not match the adventure.');
    }
    const hostile = record.enemies.filter(saved => isHostile(known.get(saved.id)));
    const boss = hostile.find(saved => known.get(saved.id).role === 'boss');
    const expectedGold = hostile.filter(saved => saved.health === 0 && known.get(saved.id).role !== 'boss').length * 5 + (record.bossRewarded ? 20 : 0) + record.chests.length * 15;
    if (!boss || record.player.gold !== expectedGold || record.bossRewarded !== (boss.health === 0) || record.bossCleared !== (boss.health === 0 && (requiredRelics.length > 0 || hostile.every(saved => saved.health === 0))) || (record.bossCleared && record.relics.length !== requiredRelics.length) || (record.altarLit && (!record.bossCleared || !record.sparked)) || (record.completed && !record.altarLit) || record.area !== areaAt(record.player)) {
      throw new Error('This journey save has inconsistent progress.');
    }
    for (const id of record.relics) {
      const relic = known.get(id);
      if (!relic || relic.role !== 'relic' || relic.requires.some(guard => !hostile.some(saved => saved.id === guard && saved.health === 0))) {
        throw new Error('This journey save has inconsistent relic progress.');
      }
    }
    system._attacks.clear();
    system._projectiles.length = 0;
    Object.assign(position(entity), { x: record.player.x, y: record.player.y });
    combatant.setHealth(record.player.health);
    world.gold = record.player.gold;
    inventory.gold = world.gold;
    world.quest = record.quest;
    world.completed = record.completed;
    world.sparked = record.sparked;
    world.bossCleared = record.bossCleared;
    world.altarLit = record.altarLit;
    world.bossRewarded = record.bossRewarded;
    world.relics = [...record.relics];
    for (const saved of record.enemies) {
      const a = known.get(saved.id), e = objectFor(a);
      a.combatant.setHealth(saved.health);
      a.phase = saved.phase;
      Object.assign(position(e), { x: saved.x, y: saved.y });
      a.defeated = !a.combatant.isAlive;
      const sprite = e.GetComponent(Sprite);
      if (sprite) sprite.enabled = !a.defeated;
      if (isHostile(a)) {
        e.GetComponent(Shape).color = Color.FromHex(a.defeated ? 0x444947 : a.role === 'boss' ? 0xd58d4b : 0x9d6a60);
      }
    }
    for (const chest of byRole('chest')) {
      chest.opened = record.chests.includes(chest.combatant.id);
      objectFor(chest).GetComponent(Shape).color = Color.FromHex(chest.opened ? 0x59513e : 0xc79b54);
    }
    for (const relic of byRole('relic')) {
      objectFor(relic).GetComponent(Shape).color = Color.FromHex(world.relics.includes(relic.combatant.id) ? 0x59513e : 0xe6b95c);
    }
    syncInteractableSprites();
  };

  const save = (quiet = false) => {
    try {
      manager.save('slot-1', capture());
      if (!quiet) setMessage('Journey saved at the last lantern.');
      tone(660, 0.14);
    } catch {
      setMessage('The journey could not be saved. Check browser storage and try again.');
    }
  };

  const load = () => {
    try {
      const data = manager.load('slot-1');
      if (!data) return false;
      restore(data);
      setMessage('Journey restored.');
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  };

  const finishIfClear = () => {
    if (world.bossCleared || !byRole('boss').some(a => !a.combatant.isAlive) || (requiredRelics.length ? world.relics.length !== requiredRelics.length : actors().some(a => isHostile(a) && a.role !== 'boss' && a.combatant.isAlive))) return;
    world.bossCleared = true;
    world.quest = 'Use the heartstone altar in the old keep.';
    setMessage('The Keep is quiet. Carry the spark to the heartstone altar.');
    tone(784, 0.5, 0.22);
    save(true);
  };

  const move = (dx, dy) => {
    for (const [axis, amount] of [['x', dx], ['y', dy]]) {
      const p = { ...position(entity), [axis]: position(entity)[axis] + amount };
      if (!walls.some(w => body.overlaps(w.collider, p.x, p.y, w.x, w.y))) position(entity)[axis] = p[axis];
    }
  };

  // Floating Combat Damage Numbers
  const spawnDamageNumber = (text, color = '#ffd56b') => {
    if (!document.body) return;
    const elem = document.createElement('div');
    elem.textContent = text;
    elem.style.cssText = `position:fixed;left:50%;top:45%;transform:translate(-50%,-50%);color:${color};font:800 24px system-ui,sans-serif;pointer-events:none;z-index:100;text-shadow:0 2px 8px rgba(0,0,0,0.8);transition:all 0.6s cubic-bezier(0.1, 0.9, 0.2, 1);opacity:1;`;
    document.body.appendChild(elem);
    requestAnimationFrame(() => {
      elem.style.transform = 'translate(-50%, -100px) scale(1.15)';
      elem.style.opacity = '0';
    });
    setTimeout(() => elem.remove(), 650);
  };

  // Interactive On-Screen Tutorial Banner
  let tutorialBanner = null;
  const updateTutorialBanner = () => {
    if (!isPlayer || world.completed) {
      tutorialBanner?.remove();
      return;
    }
    if (!tutorialBanner) {
      tutorialBanner = document.createElement('div');
      tutorialBanner.id = 'ember-tutorial-banner';
      document.body.appendChild(tutorialBanner);
    }
    const steps = [
      '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move through Briar Hollow',
      '<kbd>E</kbd> Speak with Mira under the Lantern Tree',
      '<kbd>J</kbd> Strike guardians with your blade',
      '<kbd>Space</kbd> Dodge when enemies wind up in gold light',
      'Follow your journal to the Old Keep & unseal the Vaults',
      '<kbd>O</kbd> Save at any lantern &middot; <kbd>Esc</kbd> Pause'
    ];
    if (world.tutorialStep < steps.length) {
      tutorialBanner.innerHTML = steps[world.tutorialStep];
    } else {
      tutorialBanner.remove();
    }
  };

  const paint = () => {
    if (!hud) return;
    const alive = actors().filter(a => isHostile(a) && a.combatant.isAlive).length;
    const bossActor = actors().find(a => a.role === 'boss');
    const phase = bossActor?.phase ?? 1;
    const curHp = Math.ceil(combatant.health);
    const maxHp = combatant.maxHealth;
    const hpPercent = Math.max(0, Math.min(100, (curHp / maxHp) * 100));

    // Full contract text compatibility for existing automated tests
    hud.querySelector('[data-status]').textContent = `VITALITY ${curHp} / ${maxHp}   ·   EMBER MARKS ${world.gold}   ·   FOES ${alive}`;
    hud.dataset.area = areaAt(position(entity));
    hud.dataset.x = String(position(entity).x.toFixed(2));
    hud.dataset.y = String(position(entity).y.toFixed(2));
    hud.dataset.health = String(curHp);
    hud.dataset.foes = String(alive);

    // Update Visual Health Fill
    const fillBar = hud.querySelector('.vitality-bar-fill');
    if (fillBar) fillBar.style.width = `${hpPercent}%`;

    let direction = '';
    if (requiredRelics.length && world.sparked && !world.bossCleared && world.relics.length < requiredRelics.length) {
      const target = actors().find(a => a.combatant.id === requiredRelics.find(id => !world.relics.includes(id)));
      if (target) {
        const p = position(objectFor(target)), player = position(entity), dx = p.x - player.x, dy = p.y - player.y;
        direction = ' · ' + (Math.abs(dx) > 2 ? (dx > 0 ? 'east' : 'west') : '') + (Math.abs(dx) > 2 && Math.abs(dy) > 2 ? ', ' : '') + (Math.abs(dy) > 2 ? (dy > 0 ? 'south' : 'north') : '') + ' (' + Math.round(p.x) + ', ' + Math.round(p.y) + ')';
        world.quest = 'Find ' + target.label + ' · seals ' + world.relics.length + '/' + requiredRelics.length;
      }
    } else if (requiredRelics.length && world.sparked && !world.bossCleared && world.relics.length === requiredRelics.length) {
      world.quest = 'All seals recovered. Defeat the Keeper in the southeast vault.';
    }

    hud.querySelector('[data-quest]').textContent = world.quest + direction;
    hud.querySelector('[data-cue]').textContent = message;
    hud.querySelector('[data-boss]').textContent = alive && phase > 1 ? `KEEP WARDEN · PHASE ${phase}` : '';
    hud.querySelector('[data-end]').textContent = world.completed
      ? 'THE FIRST EMBER IS LIT — THE HOLLOW WILL SEE ANOTHER DAWN.'
      : !combatant.isAlive
      ? 'YOU FELL. Press R to return to the last lantern.'
      : '';

    // Update Area Badge
    const badge = hud.querySelector('.hud-area-badge');
    if (badge) badge.textContent = areaAt(position(entity)) === 'hollow' ? 'Briar Hollow' : 'The Old Keep';

    updateTutorialBanner();
  };

  const togglePause = () => {
    world.paused = !world.paused;
    window.dispatchEvent(new Event(world.paused ? 'emberfall:pause' : 'emberfall:resume'));
  };

  const listen = (event, fn) => {
    window.addEventListener(event, fn);
    world.listeners.push([event, fn]);
  };

  if (!isPlayer) return { start() {}, update() {}, destroy() { delete entity.gameplay; } };

  return {
    start() {
      camera = new engine.Camera(window.innerWidth, window.innerHeight);
      scene.activeCamera = camera;

      const main = document.createElement('aside');
      main.id = 'emberfall-hud';
      main.innerHTML = `
        <div class="hud-header">
          <span class="hud-title">EMBERFALL &middot; THE FIRST EMBER</span>
          <span class="hud-area-badge">Briar Hollow</span>
        </div>
        <div class="hud-vitality-row">
          <div class="vitality-bar-track">
            <div class="vitality-bar-fill"></div>
          </div>
          <span class="hud-marks-badge">&curren; ${world.gold}</span>
        </div>
        <div data-status></div>
        <div data-quest></div>
        <div data-cue></div>
        <strong data-boss></strong>
        <strong data-end></strong>
        <small style="display:block;margin-top:6px;border-top:1px solid #364843;padding-top:6px;color:#a0b2aa;">
          WASD move &middot; J strike &middot; Space dodge &middot; E interact &middot; Esc pause &middot; O save &middot; L load
        </small>
      `;
      document.body.append(main);
      hud = main;

      // Editor fallback menu if browser shell is absent
      if (!document.querySelector('#title')) {
        fallback = document.createElement('section');
        fallback.style.cssText = 'position:fixed;inset:0;z-index:100;text-align:center;padding:15vh 20px;background:#101b20ee;color:#f1e8d4;font:16px system-ui';
        fallback.innerHTML = '<h1>EMBERFALL · THE FIRST EMBER</h1><p data-menu-message>Bring Mira’s spark to the heartstone.</p><button data-begin>Begin journey</button><button data-continue>Continue</button><button data-resume hidden>Resume</button><button data-save hidden>Save journey</button><button data-title hidden>Return to title</button><label>Music <input data-music type="range" min="0" max="1" step="0.05"></label><label>Effects <input data-sfx type="range" min="0" max="1" step="0.05"></label>';
        document.body.append(fallback);
        world.paused = true;
        const getSettings = () => { try { return JSON.parse(localStorage.getItem('neptune.emberfall.adventure.settings') || '{}'); } catch { return {}; } };
        for (const name of ['music', 'sfx']) {
          const input = fallback.querySelector('[data-' + name + ']');
          input.value = getSettings()[name] ?? (name === 'music' ? 0.28 : 0.7);
          input.oninput = () => {
            const settings = { ...getSettings(), [name]: Number(input.value) };
            localStorage.setItem('neptune.emberfall.adventure.settings', JSON.stringify(settings));
            window.dispatchEvent(new CustomEvent('emberfall:volume', { detail: settings }));
          };
        }
        fallback.querySelector('[data-continue]').disabled = !localStorage.getItem('neptune.emberfall.adventure.slot-1');
        fallback.querySelector('[data-begin]').onclick = () => { localStorage.removeItem('neptune.emberfall.adventure.slot-1'); world.paused = false; fallback.hidden = true; };
        fallback.querySelector('[data-continue]').onclick = () => { world.pendingContinue = true; world.paused = false; fallback.hidden = true; };
        fallback.querySelector('[data-resume]').onclick = () => { world.paused = false; fallback.hidden = true; };
        fallback.querySelector('[data-save]').onclick = () => { save(); fallback.querySelector('[data-menu-message]').textContent = message; };
        fallback.querySelector('[data-title]').onclick = () => { globalThis.game.loadScene(initialScene); };
        listen('emberfall:pause', () => { fallback.hidden = false; fallback.querySelector('[data-begin]').hidden = true; fallback.querySelector('[data-continue]').hidden = true; fallback.querySelector('[data-resume]').hidden = false; fallback.querySelector('[data-save]').hidden = false; fallback.querySelector('[data-title]').hidden = false; });
        listen('emberfall:invalid-save', event => { fallback.hidden = false; fallback.querySelector('[data-menu-message]').textContent = 'Continue failed: ' + event.detail; });
      }

      listen('emberfall:volume', event => {
        if (musicGain && world.sound) musicGain.gain.setTargetAtTime(0.014 * event.detail.music, world.sound.currentTime, 0.12);
      });
      listen('emberfall:save', save);
      listen('emberfall:resume', () => {
        world.paused = false;
        if (fallback) fallback.hidden = true;
      });
      listen('keydown', event => {
        if (event.code === 'Escape' && !event.repeat && world.paused && (!fallback || !fallback.querySelector('[data-resume]').hidden)) {
          event.preventDefault();
          world.ignoreEscape = true;
          togglePause();
        }
      });
      listen('pointerdown', audio);
      listen('keydown', audio);

      system.on('death', ({ target }) => {
        const dead = actors().find(a => a.combatant === target);
        if (!dead || dead.role === 'player' || dead.defeated) return;
        dead.defeated = true;
        const fallen = scene.children.find(candidate => candidate.gameplay === dead);
        const fallenSprite = fallen?.GetComponent(Sprite);
        if (fallenSprite) fallenSprite.enabled = false;
        if (dead.role === 'boss') {
          setMessage('The Keeper’s heartstone cracks.');
          spawnDamageNumber('KEEPER DEFEATED!', '#ffcc00');
          if (!world.bossRewarded) {
            world.gold += 20;
            dead.rewarded = true;
            world.bossRewarded = true;
            inventory.gold = world.gold;
          }
        } else {
          world.gold += 5;
          inventory.gold = world.gold;
          setMessage(`${dead.combatant.id} falls. +5 ember marks.`);
          spawnDamageNumber('+5 Marks', '#70ffd0');
          tone(210, 0.28, 0.16, 'square');
        }
        finishIfClear();
        save(true);
      });

      combatant.onDeath = () => {
        setMessage('Darkness takes you back to the last lantern. Press R to rise.');
        world.screenShake = 0.5;
        tone(95, 0.8, 0.25, 'sawtooth');
      };

      if (sessionStorage.getItem('neptune.emberfall.adventure.continue') === '1') {
        sessionStorage.removeItem('neptune.emberfall.adventure.continue');
        world.pendingContinue = true;
      }

      syncInteractableSprites();
      paint();
    },

    update(dt) {
      if (!Number.isFinite(dt)) return;
      const entities = actors();
      const player = position(entity);

      if (world.pendingContinue && entities.length === scene.children.filter(item => item.components?.some(component => component.constructor.name === 'ProjectBehaviour' && component.properties.module === 'scripts/adventure-game.js')).length) {
        world.pendingContinue = false;
        if (!load()) {
          world.paused = true;
          window.dispatchEvent(new CustomEvent('emberfall:invalid-save', { detail: message }));
          return;
        }
      }

      combatant.position.x = player.x;
      combatant.position.y = player.y;

      // Screen Shake handling
      let shakeOffsetX = 0, shakeOffsetY = 0;
      if (world.screenShake > 0) {
        world.screenShake = Math.max(0, world.screenShake - dt);
        shakeOffsetX = (Math.random() - 0.5) * 8 * (world.screenShake / 0.5);
        shakeOffsetY = (Math.random() - 0.5) * 8 * (world.screenShake / 0.5);
      }

      camera.zoom = Math.min(window.innerWidth / (14 * 64), window.innerHeight / (9 * 64));
      camera.position.x = Math.max(0, Math.min(Math.max(0, dimensions.width * 64 - camera.viewWidth / camera.zoom), player.x * 64 - camera.viewWidth / camera.zoom / 2 + shakeOffsetX));
      camera.position.y = Math.max(0, Math.min(Math.max(0, dimensions.height * 64 - camera.viewHeight / camera.zoom), player.y * 64 - camera.viewHeight / camera.zoom / 2 + shakeOffsetY));
      camera.bounds = { minX: 0, minY: 0, maxX: dimensions.width * 64, maxY: dimensions.height * 64 };

      if (world.paused) return;
      if (isPressed('O')) save();
      if (isPressed('L')) load();
      if (isPressed('ESC')) {
        if (world.ignoreEscape) world.ignoreEscape = false;
        else { togglePause(); return; }
      }

      if (!combatant.isAlive) {
        if (isPressed('R')) {
          if (typeof combatant.setHealth === 'function') combatant.setHealth(combatant.maxHealth);
          else combatant.health = combatant.maxHealth;
          player.x = spawn.x;
          player.y = spawn.y;
          setMessage('You return to the last lantern. The keep remains as you left it.');
          save(true);
          paint();
        }
      }

      if (combatant.isAlive) {
        let dx = Number(isDown('D') || isDown('RIGHTARROW')) - Number(isDown('A') || isDown('LEFTARROW'));
        let dy = Number(isDown('S') || isDown('DOWNARROW')) - Number(isDown('W') || isDown('UPARROW'));
        const len = Math.hypot(dx, dy);
        if (len) {
          dx /= len;
          dy /= len;
          world.facing = { x: dx, y: dy };
          world.movedDistance += len * dt * 3.6;
          if (world.tutorialStep === 0 && world.movedDistance > 1.2) {
            world.tutorialStep = 1;
          }
          if (mover) mover.move({ x: dx, y: dy }, dt, walls);
          else move(dx * dt * 3.6, dy * dt * 3.6);
        }

        const dodgePressed = isPressed('SPACE');
        if (dodgePressed && len && world.dodge <= 0) {
          world.dodge = 0.28;
          combatant.invulnerableRemaining = Math.max(combatant.invulnerableRemaining, 0.34);
          if (world.tutorialStep === 3) world.tutorialStep = 4;
          if (mover) mover.move({ x: dx, y: dy }, 0.22, walls);
          else move(dx * 0.82, dy * 0.82);
          tone(360, 0.1, 0.09, 'triangle');
        }
        world.dodge = Math.max(0, world.dodge - dt);

        const attackDown = isDown('J');
        if (attackDown && (!attackWasDown || world.dodge <= 0)) {
          if (system.startAttack(combatant, attackPlayer, world.facing)) {
            tone(470, 0.11, 0.1, 'triangle');
            if (world.tutorialStep === 2) world.tutorialStep = 3;
          }
        }
        attackWasDown = attackDown;

        if (isPressed('E')) {
          const nearby = actors().filter(a => ['npc', 'chest', 'relic', 'altar'].includes(a.role)).map(a => ({
            actor: a,
            distance: Math.hypot(player.x - position(objectFor(a)).x, player.y - position(objectFor(a)).y)
          })).filter(item => item.distance < 1.6).sort((a, b) => a.distance - b.distance)[0]?.actor;

          const altar = properties.altar ?? { x: 27.2, y: 4.5 };
          if (nearby?.role === 'npc') {
            if (world.tutorialStep === 1) world.tutorialStep = 2;
            if (world.completed) {
              setMessage('Mira: “You brought the morning back.”');
            } else if (world.altarLit) {
              world.completed = true;
              world.quest = 'Complete — the Hollow remembers.';
              setMessage('Mira: “You brought the morning back.”');
              spawnDamageNumber('JOURNEY COMPLETE!', '#ffd56b');
              save(true);
            } else if (!world.sparked) {
              world.sparked = true;
              world.quest = world.bossCleared ? 'Use the heartstone altar in the old keep.' : 'Cross the bridge and enter the old keep.';
              setMessage(requiredRelics.length ? 'Mira: “Take my spark. Recover the three seals, then face the Keeper. Follow the directions in your journal.”' : 'Mira: “Take my spark. The Keeper has three heartstones; step clear of its wind-up, then strike.”');
              tone(520, 0.18);
              save(true);
            } else if (world.bossCleared) {
              setMessage('Mira: “The heartstone, dear wanderer. Let the ember find its way home.”');
            } else {
              setMessage('Mira: “Follow your journal, and step clear of the guardians’ wind-up.”');
            }
          } else if (nearby?.role === 'chest') {
            if (!nearby.opened) {
              nearby.opened = true;
              world.gold += 15;
              inventory.gold = world.gold;
              objectFor(nearby).GetComponent(Shape).color = Color.FromHex(0x59513e);
              syncInteractableSprites();
              setMessage('The old coffer holds 15 ember marks.');
              spawnDamageNumber('+15 Marks', '#ffd56b');
              tone(720, 0.2);
              save(true);
            } else {
              setMessage('The coffer is already empty.');
            }
          } else if (nearby?.role === 'relic') {
            const guards = nearby.requires.filter(id => !actors().some(a => a.combatant.id === id && isHostile(a) && !a.combatant.isAlive));
            if (!world.sparked) {
              setMessage('Mira’s spark is needed to claim the seals.');
            } else if (world.relics.includes(nearby.combatant.id)) {
              setMessage(nearby.label + ' is already yours.');
            } else if (guards.length) {
              setMessage(nearby.label + ' is guarded: defeat ' + guards.length + ' remaining guardian' + (guards.length === 1 ? '.' : 's.'));
            } else {
              world.relics.push(nearby.combatant.id);
              objectFor(nearby).GetComponent(Shape).color = Color.FromHex(0x59513e);
              syncInteractableSprites();
              setMessage(nearby.label + ' recovered.');
              spawnDamageNumber('SEAL CLAIMED!', '#70ffd0');
              tone(740, 0.3);
              save(true);
            }
          } else if (nearby?.role === 'altar' || (!requiredRelics.length && Math.hypot(player.x - altar.x, player.y - altar.y) < 2)) {
            if (!world.sparked) {
              setMessage('The altar needs Mira’s spark. Speak to her in the Hollow.');
            } else if (!world.bossCleared) {
              setMessage('The heartstone altar is cold while the Keeper still stands.');
            } else if (!world.altarLit) {
              world.altarLit = true;
              world.quest = 'Return to Mira at Briar Hollow.';
              syncInteractableSprites();
              setMessage('The ember answers. Carry its light back to Mira.');
              spawnDamageNumber('EMBER AWAKENED!', '#ffd56b');
              tone(880, 0.5, 0.2);
              save(true);
            } else {
              setMessage('The heartstone glows steadily. Mira is waiting in the Hollow.');
            }
          } else {
            setMessage('Follow your journal. Stand beside a person, coffer, seal or altar and press E.');
          }
        }
      }

      const hero = heroEntity();
      if (combatant.isAlive && hero) {
        for (const other of entities) {
          if (!isHostile(other) || !other.combatant.isAlive) continue;
          const enemyEntity = scene.children.find(candidate => candidate.gameplay === other);
          if (!enemyEntity) continue;
          const p = position(enemyEntity), vx = player.x - p.x, vy = player.y - p.y, distance = Math.hypot(vx, vy) || 0.001;
          other.combatant.position.x = p.x;
          other.combatant.position.y = p.y;
          const boss = other.role === 'boss', phase = boss ? (other.combatant.health <= 35 ? 3 : other.combatant.health <= 70 ? 2 : 1) : 1;
          other.phase = phase;
          const material = enemyEntity.GetComponent(Shape);
          const sealedBoss = boss && world.relics.length < requiredRelics.length;

          if (sealedBoss) {
            other.combatant.invulnerableRemaining = 1;
            if (distance < 4) setMessage('The Keeper is protected. Recover the three seals first.');
            continue;
          }

          const enemySprite = Sprite ? enemyEntity.GetComponent(Sprite) : null;
          const attackState = system._attacks?.get(other.combatant);
          const spritePath = boss
            ? (attackState?.phase === 'startup' ? asset('keeper-windup') : phase === 3 ? asset('keeper-phase-three') : phase === 2 ? asset('keeper-phase-two') : asset('keeper'))
            : (attackState?.phase === 'startup' ? asset('sentinel-windup') : asset('sentinel'));

          if (enemySprite && enemySprite.path !== spritePath) enemySprite.path = spritePath;
          if (attackState?.phase === 'startup') material.color = Color.FromHex(0xf1c75f);
          else if (other.combatant.invulnerableRemaining > 0) material.color = Color.FromHex(0xffffff);
          else material.color = Color.FromHex(boss ? (phase === 3 ? 0xf06d48 : phase === 2 ? 0xd79548 : 0xa75f4d) : 0x977263);

          const range = boss ? (phase === 3 ? 2.25 : 1.95) : 0.95;
          if (!attackState && distance < 6.5 && distance > range + 0.25) {
            const speed = boss ? 0.62 + phase * 0.16 : Number(other.role === 'raider' ? 0.95 : 0.72);
            const p2 = { x: p.x + vx / distance * dt * speed, y: p.y + vy / distance * dt * speed };
            const enemyBody = rectangle(enemyEntity, boss ? 1 : 0.65, boss ? 1 : 0.65);
            if (!walls.some(w => enemyBody.overlaps(w.collider, p2.x, p2.y, w.x, w.y))) Object.assign(p, p2);
          }

          if (distance <= (boss ? 3.2 : 2.5) && !attackState && !other.combatant.cooldowns.has(boss ? 'cleave' : 'lunge')) {
            if (system.startAttack(other.combatant, boss ? bossAttack : enemyAttack, { x: vx, y: vy }) && boss) {
              setMessage('Keeper draws back in gold light — dodge clear of the sweep.');
              world.screenShake = 0.25;
            }
          }
        }
      }

      system.update(Math.min(dt, 0.05), entities.filter(a => a === actor || isHostile(a)).map(a => a.combatant));

      const movingNow = isDown('D') || isDown('A') || isDown('W') || isDown('S') || isDown('LEFTARROW') || isDown('RIGHTARROW') || isDown('UPARROW') || isDown('DOWNARROW');
      const attackingNow = Boolean(system._attacks?.has(combatant));
      const dodgingNow = world.dodge > 0;

      if (actorSprite) {
        if (dodgingNow) {
          actorSprite.path = asset('wanderer-dodge');
        } else if (attackingNow) {
          actorSprite.path = asset('wanderer-strike');
        } else if (movingNow) {
          spriteFrame += dt;
          if (spriteFrame > 0.18) {
            actorSprite.path = actorSprite.path.endsWith('wanderer-step.png') ? asset('wanderer-rest') : asset('wanderer-step');
            spriteFrame = 0;
          }
        } else {
          actorSprite.path = asset('wanderer-rest');
          spriteFrame = 0;
        }
      }

      const bob = Math.sin(performance.now() / 125) * 0.025;
      entity.GetComponent(Shape).color = combatant.invulnerableRemaining > 0
        ? Color.FromHex(0xffffff)
        : Color.FromHex(Math.round(0x7fd0a7 + Math.sin(performance.now() / 150) * 0x080000));
      entity.GetComponent(Shape).height = 0.7 + bob;

      world.sincePaint += dt;
      if (world.sincePaint > 0.08) {
        paint();
        world.sincePaint = 0;
      }
    },

    destroy() {
      hud?.remove();
      fallback?.remove();
      tutorialBanner?.remove();
      if (musicTimer) clearTimeout(musicTimer);
      if (scene.activeCamera === camera) scene.activeCamera = null;
      for (const [event, fn] of world.listeners) window.removeEventListener(event, fn);
      actions?.dispose();
      if (mover) entity.RemoveComponent(mover);
      try {
        musicGain?.disconnect();
        world.sound?.close();
      } catch {}
      delete entity.gameplay;
    }
  };
}
