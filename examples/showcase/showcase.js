import {
  WorldFacts, TypedEventBus, RuleEngine,
  VersionedSaveEngine,
  NavigationGrid, WorldMetadataRegistry,
  AbilityValidator,
  PerceptionSystem, BoundedMemory, NPCKnowledge, UtilityAI, UtilityAction, UtilityConsideration,
  ScheduleSystem, FactionRegistry, NPCSchedule, ScheduleSlot,
  ItemRegistry, Inventory, EquipmentSystem, LootTable,
  LevelProgression, StatusEffectManager,
  CollisionLayers, SweptAABB, KnockbackMotor, SpatialHashGrid,
  AudioBusSystem,
  StoryGraph,
  MaterialRegistry, MaterialState, CellGridSimulation
} from '../../src/neptune.js';

// ==========================================
// 1. CONFIGURATION & CANVAS SETUP
// ==========================================
const COLS = 38;
const ROWS = 22;
const TILE_SIZE = 20;
const CANVAS_W = COLS * TILE_SIZE; // 760
const CANVAS_H = ROWS * TILE_SIZE; // 440

const canvas = typeof document !== 'undefined' ? document.getElementById('showcase-canvas') : null;
const ctx = canvas ? canvas.getContext('2d') : null;

// Synthetic Web Audio synthesizer for immediate acoustic feedback
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) audioCtx = new AudioCtor();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ==========================================
// 2. WORLD METADATA & STATIC MAP (WORLD-01)
// ==========================================
const worldMetadata = new WorldMetadataRegistry();
worldMetadata.registerTile('stone', { layer: 'ground', elevation: 0, traversalCost: Infinity, friction: 0.9, isWall: true });
worldMetadata.registerTile('grass', { layer: 'ground', elevation: 0, traversalCost: 1.0, friction: 0.8 });
worldMetadata.registerTile('water', { layer: 'ground', elevation: 0, traversalCost: 2.5, friction: 0.5 });
worldMetadata.registerTile('chasm', { layer: 'ground', elevation: 0, traversalCost: Infinity, isHazard: true });
worldMetadata.registerTile('bridge', { layer: 'elevated', elevation: 1, traversalCost: 1.0, friction: 0.85 });

// Map matrix: 0 = grass, 1 = stone wall, 2 = water, 3 = chasm, 4 = bridge
const mapData = new Uint8Array(COLS * ROWS);
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const idx = y * COLS + x;
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
      mapData[idx] = 1; // Outer stone walls
    } else if (x >= 8 && x <= 12 && y >= 12 && y <= 17) {
      mapData[idx] = 2; // Water pond
    } else if (x === 24 && (y < 9 || y > 13)) {
      mapData[idx] = 3; // Chasm pit
    } else if (x === 24 && y >= 9 && y <= 13) {
      mapData[idx] = 4; // Elevated bridge spanning chasm
    } else if ((x === 18 && y >= 4 && y <= 8) || (x === 18 && y >= 14 && y <= 18)) {
      mapData[idx] = 1; // Interior stone battlements
    } else {
      mapData[idx] = 0; // Grass
    }
  }
}

// ==========================================
// 3. NAVIGATION GRID (NAV-01)
// ==========================================
const navGrid = new NavigationGrid({ width: COLS, height: ROWS, defaultCost: 1.0 });
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const tile = mapData[y * COLS + x];
    if (tile === 1 || tile === 3) {
      navGrid.setWalkable(x, y, false);
    } else if (tile === 2) {
      navGrid.setCost(x, y, 2.5);
    }
  }
}

let activePath = [];

// ==========================================
// 4. CELLULAR SIMULATION & MATERIALS (SIM-01/02)
// ==========================================
const materialReg = new MaterialRegistry();
materialReg.register('sand', { flammability: 0.0, conductivity: 0.1, viscosity: 0.5, traversalCost: 1.5, isSolid: true, burnDuration: 0 });
materialReg.register('steam', { flammability: 0.0, conductivity: 0.2, viscosity: 0.1, traversalCost: 1.0, isSolid: false, burnDuration: 0 });

const cellSim = new CellGridSimulation(COLS, ROWS, { registry: materialReg });
let simRunning = true;

// Pre-place a crate of wood cells
for (let cy = 6; cy <= 8; cy++) {
  for (let cx = 14; cx <= 16; cx++) {
    cellSim.setCell(cx, cy, 'wood');
  }
}

// ==========================================
// 5. AUDIO BUS SYSTEM (AUDIO-01)
// ==========================================
const audioBuses = new AudioBusSystem();

function playSynthesizedTone(freq, duration = 0.15, type = 'sine', bus = 'sfx') {
  try {
    const actx = getAudioCtx();
    if (!actx) return;
    const effectiveGain = audioBuses.getEffectiveVolume(bus);
    if (effectiveGain <= 0.001) return;

    const osc = actx.createOscillator();
    const gainNode = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, actx.currentTime);

    gainNode.gain.setValueAtTime(effectiveGain * 0.2, actx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + duration);
  } catch (_) {}
}

// ==========================================
// 6. RPG PROGRESSION & STATUS (RPG-01/02)
// ==========================================
const progression = new LevelProgression({
  level: 1,
  experience: 0,
  baseExperience: 100,
  growthRate: 1.5,
  maxLevel: 20
});

const statusEffects = new StatusEffectManager();

const itemRegistry = new ItemRegistry();
itemRegistry.register({ id: 'flame_wand', name: 'Flame Wand', slot: 'mainHand', type: 'equipment', rarity: 'rare', stats: { atk: 12, manaCostReduction: 2 } });
itemRegistry.register({ id: 'iron_shield', name: 'Iron Shield', slot: 'offHand', type: 'equipment', rarity: 'uncommon', stats: { def: 8, maxHp: 20 } });
itemRegistry.register({ id: 'mage_robe', name: 'Mage Robe', slot: 'armor', type: 'equipment', rarity: 'rare', stats: { def: 6, maxMp: 30 } });
itemRegistry.register({ id: 'swift_ring', name: 'Swift Ring', slot: 'accessory', type: 'equipment', rarity: 'epic', stats: { spd: 35 } });
itemRegistry.register({ id: 'health_pot', name: 'Health Potion', slot: 'consumable', type: 'consumable', rarity: 'common', healAmount: 40 });

const inventory = new Inventory(16, { registry: itemRegistry });
const equipment = inventory.equipmentSystem;

// Initial gear and inventory
equipment.equip('mainHand', itemRegistry.get('flame_wand'));
equipment.equip('armor', itemRegistry.get('mage_robe'));
equipment.equip('accessory', itemRegistry.get('swift_ring'));
inventory.addItem('health_pot', 1);
inventory.addItem('iron_shield', 1);

const lootTable = new LootTable();
lootTable.addEntry({ itemId: 'health_pot', weight: 50 });
lootTable.addEntry({ itemId: 'iron_shield', weight: 25 });
lootTable.addEntry({ itemId: 'swift_ring', weight: 10 });
lootTable.addEntry({ itemId: 'flame_wand', weight: 15 });

// ==========================================
// 7. WORLD FACTS, RULES & STORY (CORE-03, STORY-01)
// ==========================================
const facts = new WorldFacts();
const eventBus = new TypedEventBus();
const ruleEngine = new RuleEngine({ facts, bus: eventBus });

facts.set('player_level', 1);
facts.set('has_bridge_pass', false);
facts.set('guard_attitude', 'friendly');
facts.set('fires_extinguished', 0);
facts.set('enemies_bested', 0);

ruleEngine.addRule({
  id: 'unlock_chasm_passage',
  event: 'level_up',
  condition: ({ facts: f }) => f.get('player_level') >= 2,
  action: ({ facts: f }) => {
    f.set('has_bridge_pass', true);
    triggerNotification('Citadel Pass Granted! Bridge is fully unlocked.');
  }
});

const storyGraph = new StoryGraph({
  id: 'citadel_story',
  initialNodeId: 'guard_greeting',
  facts
});

storyGraph.addNode({
  id: 'guard_greeting',
  speaker: 'Town Guard Roderick',
  text: 'Halt, traveler. The Citadel is on high alert. Flammable brush and wild sparks threaten our supplies.',
  choices: [
    { text: 'Can I cross the chasm bridge?', next: 'bridge_query' },
    { text: 'I am here to assist with fire control.', next: 'volunteer' },
    { text: 'Step aside or face my magic.', next: 'threaten' }
  ]
});

storyGraph.addNode({
  id: 'bridge_query',
  speaker: 'Town Guard Roderick',
  text: 'Cross freely if you possess the Citadel Pass. Otherwise, prove your merit by reaching Level 2+.',
  choices: [
    { text: 'Understood.', next: 'guard_greeting' }
  ]
});

storyGraph.addNode({
  id: 'volunteer',
  speaker: 'Town Guard Roderick',
  text: 'Good. Extinguish burning cells with Frost Nova, or burn through wood barricades to clear paths.',
  choices: [
    { text: 'On it!', next: null }
  ]
});

storyGraph.addNode({
  id: 'threaten',
  speaker: 'Town Guard Roderick',
  text: 'Is that a threat? You will find my blade swift and true!',
  choices: [
    { text: 'En garde!', next: null }
  ]
});

// ==========================================
// 8. SCHEDULES & FACTIONS (AI-03)
// ==========================================
const factions = new FactionRegistry();
factions.registerFaction('town_guard');
factions.registerFaction('player_guild');
factions.setReputation('town_guard', 'player_guild', 50);

const schedule = new NPCSchedule();
schedule.addSlot(new ScheduleSlot({ start: 6, end: 12, activity: 'PATROL', destination: { x: 360, y: 160 } }));
schedule.addSlot(new ScheduleSlot({ start: 12, end: 18, activity: 'GUARD', destination: { x: 480, y: 220 } }));
schedule.addSlot(new ScheduleSlot({ start: 18, end: 22, activity: 'TAVERN', destination: { x: 260, y: 320 } }));
schedule.addSlot(new ScheduleSlot({ start: 22, end: 6, activity: 'REST', destination: { x: 520, y: 100 } }));

const scheduleSystem = new ScheduleSystem({ schedule });
let worldHour = 10.0;
let autoAdvanceTime = false;

// ==========================================
// 9. PERCEPTION & UTILITY AI (AI-01, AI-02)
// ==========================================
const perception = new PerceptionSystem({ fovAngle: Math.PI / 2, fovRadius: 160, hearingRadius: 140 });
const npcMemory = new BoundedMemory({ capacity: 10, decayRate: 0.1 });
const npcKnowledge = new NPCKnowledge({ memory: npcMemory });

const utilityAI = new UtilityAI({ useDefaultActions: false, defaultThreshold: 0.05 });

utilityAI.registerAction(new UtilityAction({
  id: 'attack',
  priority: 10,
  considerations: [
    new UtilityConsideration({ id: 'player_visible', evaluate: ctx => ctx.spotted ? 1.0 : 0.0 }),
    new UtilityConsideration({ id: 'is_hostile', evaluate: ctx => ctx.isHostile ? 1.0 : 0.0 }),
    new UtilityConsideration({ id: 'health_ratio', evaluate: ctx => ctx.npcHp / ctx.npcMaxHp })
  ]
}));

utilityAI.registerAction(new UtilityAction({
  id: 'flee',
  priority: 20,
  considerations: [
    new UtilityConsideration({ id: 'low_health', evaluate: ctx => (ctx.npcHp / ctx.npcMaxHp < 0.3) ? 1.0 : 0.0 }),
    new UtilityConsideration({ id: 'under_attack', evaluate: ctx => ctx.spotted && ctx.isHostile ? 0.9 : 0.1 })
  ]
}));

utilityAI.registerAction(new UtilityAction({
  id: 'heal',
  priority: 5,
  considerations: [
    new UtilityConsideration({ id: 'wounded', evaluate: ctx => 1.0 - (ctx.npcHp / ctx.npcMaxHp) }),
    new UtilityConsideration({ id: 'safe_distance', evaluate: ctx => ctx.spotted ? 0.2 : 0.8 })
  ]
}));

utilityAI.registerAction(new UtilityAction({
  id: 'patrol',
  priority: 1,
  considerations: [
    new UtilityConsideration({ id: 'not_hostile', evaluate: ctx => (!ctx.isHostile || !ctx.spotted) ? 0.85 : 0.05 })
  ]
}));

// ==========================================
// 10. ABILITY VALIDATION (ABILITY-01)
// ==========================================
const abilitySpecs = {
  fireball: { id: 'fireball', manaCost: 20, cooldown: 1.0, budgetCost: 15 },
  frost_nova: { id: 'frost_nova', manaCost: 25, cooldown: 3.0, budgetCost: 25 },
  heal_surge: { id: 'heal_surge', manaCost: 30, cooldown: 5.0, budgetCost: 20 }
};

const abilityCooldowns = { fireball: 0, frost_nova: 0, heal_surge: 0 };

// ==========================================
// 11. ENTITIES & SPATIAL HASH (PHYS-02/03/04)
// ==========================================
const spatialHash = new SpatialHashGrid({ cellSize: 40 });

const player = {
  x: 140,
  y: 220,
  w: 16,
  h: 16,
  vx: 0,
  vy: 0,
  hp: 100,
  maxHp: 100,
  mp: 100,
  maxMp: 100,
  elevation: 0,
  layer: CollisionLayers?.PLAYER || 1,
  motor: new KnockbackMotor({ friction: 8.0 })
};

const npc = {
  x: 480,
  y: 220,
  w: 16,
  h: 16,
  vx: 0,
  vy: 0,
  hp: 120,
  maxHp: 120,
  facingAngle: Math.PI,
  elevation: 0,
  layer: CollisionLayers?.ENEMY || 2,
  motor: new KnockbackMotor({ friction: 8.0 })
};

const projectiles = [];
let noisePulse = null;

// ==========================================
// 12. VERSIONED SAVE ENGINE (SAVE-01)
// ==========================================
const saveEngine = new VersionedSaveEngine({
  currentVersion: 1,
  validateReferences: false,
  autoRecoverCorrupt: false
});

// ==========================================
// 13. INTERACTIVE INPUTS & CONTROLS
// ==========================================
let activeTool = 'move';
const keysDown = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    keysDown.add(e.key.toLowerCase());
    if (e.key === '1') triggerAbility('fireball');
    if (e.key === '2') triggerAbility('frost_nova');
    if (e.key === '3') triggerAbility('heal_surge');
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.key.toLowerCase());
  });
}

if (canvas) {
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cellX = Math.floor(mx / TILE_SIZE);
    const cellY = Math.floor(my / TILE_SIZE);

    if (activeTool === 'move') {
      const startTileX = Math.floor(player.x / TILE_SIZE);
      const startTileY = Math.floor(player.y / TILE_SIZE);
      const allowDiag = document.getElementById('chk-allow-diagonal')?.checked ?? true;
      const path = navGrid.findPath(startTileX, startTileY, cellX, cellY, { allowDiagonal: allowDiag });
      if (path && path.length > 0) {
        activePath = path.map(p => ({ x: (p.x + 0.5) * TILE_SIZE, y: (p.y + 0.5) * TILE_SIZE }));
        const el = document.getElementById('path-nodes-count');
        if (el) el.textContent = path.length;
      }
    } else if (activeTool === 'wood' || activeTool === 'fire' || activeTool === 'water' || activeTool === 'sand') {
      cellSim.setCell(cellX, cellY, activeTool);
      playSynthesizedTone(300, 0.08, 'square', 'ui');
    } else if (activeTool === 'erase') {
      cellSim.setCell(cellX, cellY, 'empty');
    }
  });
}

function triggerAbility(id) {
  if (abilityCooldowns[id] > 0) return;
  const ab = abilitySpecs[id];
  if (!ab || player.mp < ab.manaCost) return;

  player.mp -= ab.manaCost;
  abilityCooldowns[id] = ab.cooldown;

  if (id === 'fireball') {
    const dx = npc.x - player.x;
    const dy = npc.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 260;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: 6,
      type: 'fire'
    });
    playSynthesizedTone(440, 0.18, 'sawtooth', 'sfx');
    triggerNoisePulse(player.x, player.y);
  } else if (id === 'frost_nova') {
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const cx = px + dx;
        const cy = py + dy;
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
          const c = cellSim.getCell(cx, cy);
          if (c && c.materialId === 'fire') {
            cellSim.setCell(cx, cy, 'empty');
            facts.set('fires_extinguished', (facts.get('fires_extinguished') || 0) + 1);
          }
        }
      }
    }
    const distToNpc = Math.hypot(npc.x - player.x, npc.y - player.y);
    if (distToNpc < 100) {
      statusEffects.applyEffect({
        name: 'chilled',
        duration: 4.0,
        stackMode: 'replace',
        category: 'debuff'
      });
    }
    playSynthesizedTone(600, 0.25, 'triangle', 'sfx');
    triggerNoisePulse(player.x, player.y);
  } else if (id === 'heal_surge') {
    statusEffects.applyEffect({
      name: 'regeneration',
      duration: 5.0,
      stackMode: 'replace',
      tickInterval: 1.0,
      category: 'buff',
      onTick: () => {
        player.hp = Math.min(player.maxHp, player.hp + 8);
      }
    });
    playSynthesizedTone(523.25, 0.3, 'sine', 'sfx');
  }
}

function triggerNoisePulse(x, y) {
  noisePulse = { x, y, radius: 10, maxRadius: 140, alpha: 1.0 };
  const d = Math.hypot(npc.x - x, npc.y - y);
  if (d <= 140) {
    npc.facingAngle = Math.atan2(y - npc.y, x - npc.x);
    npcMemory.record({ type: 'heard_noise', x, y, timestamp: performance.now() });
  }
}

function toggleFaction(forceHostile = false) {
  const current = facts.get('guard_attitude');
  const next = forceHostile ? 'hostile' : (current === 'friendly' ? 'hostile' : 'friendly');
  facts.set('guard_attitude', next);
  const rep = next === 'friendly' ? 50 : -50;
  factions.setReputation('town_guard', 'player_guild', rep);
  const el = document.getElementById('faction-attitude');
  if (el) {
    el.textContent = next.toUpperCase();
    el.style.color = next === 'friendly' ? 'var(--accent-emerald)' : 'var(--accent-rose)';
  }
}

function triggerNotification(text) {
  const el = document.getElementById('save-status-msg');
  if (el) {
    el.textContent = text;
    el.style.color = 'var(--accent-cyan)';
    setTimeout(() => { el.textContent = 'Ready'; }, 4000);
  }
}

// ==========================================
// 14. UI BINDINGS & LISTENERS
// ==========================================
if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTool = btn.dataset.tool;
    });
  });

  document.getElementById('btn-ability-1')?.addEventListener('click', () => triggerAbility('fireball'));
  document.getElementById('btn-ability-2')?.addEventListener('click', () => triggerAbility('frost_nova'));
  document.getElementById('btn-ability-3')?.addEventListener('click', () => triggerAbility('heal_surge'));

  document.getElementById('btn-sim-toggle')?.addEventListener('click', (e) => {
    simRunning = !simRunning;
    e.target.textContent = simRunning ? 'Pause Sim' : 'Resume Sim';
  });
  document.getElementById('btn-sim-step')?.addEventListener('click', () => cellSim.step());
  document.getElementById('btn-sim-clear')?.addEventListener('click', () => cellSim.clear());

  document.getElementById('btn-make-noise')?.addEventListener('click', () => triggerNoisePulse(player.x, player.y));
  document.getElementById('btn-toggle-faction')?.addEventListener('click', () => toggleFaction());
  document.getElementById('btn-recompute-nav')?.addEventListener('click', () => { activePath = []; });

  document.getElementById('btn-test-knockback')?.addEventListener('click', () => {
    player.motor.applyImpulse(-180, -90);
    playSynthesizedTone(180, 0.15, 'sawtooth', 'sfx');
  });

  document.getElementById('btn-gain-xp')?.addEventListener('click', () => {
    const levelsGained = progression.grantExperience(50);
    facts.set('player_level', progression.level);
    if (levelsGained.length > 0) {
      eventBus.emit('level_up', { level: progression.level });
      player.hp = player.maxHp;
      playSynthesizedTone(880, 0.4, 'sine', 'sfx');
    }
    updateRPGUI();
  });

  document.getElementById('btn-roll-loot')?.addEventListener('click', () => {
    const drops = lootTable.roll();
    if (drops && drops.length > 0) {
      const drop = drops[0];
      const it = itemRegistry.get(drop.itemId);
      if (it) {
        inventory.addItem(it.id, drop.quantity || 1);
        facts.set('enemies_bested', (facts.get('enemies_bested') || 0) + 1);
        playSynthesizedTone(587.33, 0.15, 'triangle', 'ui');
        updateInventoryUI();
      }
    }
  });

  // Audio sliders
  ['master', 'music', 'sfx', 'ui'].forEach(bus => {
    const slider = document.getElementById(`vol-${bus}`);
    const valLabel = document.getElementById(`val-${bus}`);
    const muteBtn = document.getElementById(`mute-${bus}`);

    if (slider) {
      slider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        audioBuses.setVolume(bus, vol);
        if (valLabel) valLabel.textContent = `${Math.round(vol * 100)}%`;
      });
    }
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = audioBuses.isMuted(bus);
        audioBuses.setMuted(bus, !isMuted);
        muteBtn.style.color = !isMuted ? 'var(--accent-rose)' : 'inherit';
      });
    }
  });

  document.getElementById('btn-test-sound')?.addEventListener('click', () => {
    playSynthesizedTone(440, 0.2, 'sine', 'sfx');
  });

  // Story dialogue modal
  const storyModal = document.getElementById('story-modal');
  document.getElementById('btn-talk-guard')?.addEventListener('click', () => openDialogue('guard_greeting'));
  document.getElementById('btn-close-dialogue')?.addEventListener('click', () => { if (storyModal) storyModal.hidden = true; });

  // Versioned save / load
  document.getElementById('btn-save-game')?.addEventListener('click', () => {
    const snapshot = {
      player: { x: player.x, y: player.y, hp: player.hp, mp: player.mp },
      facts: facts.toObject(),
      inventory: inventory.slots.map(s => ({ id: s.item.id, quantity: s.quantity })),
      equipped: {
        mainHand: equipment.getSlot('mainHand')?.id || null,
        armor: equipment.getSlot('armor')?.id || null,
        accessory: equipment.getSlot('accessory')?.id || null
      },
      level: progression.level,
      xp: progression.experience,
      worldHour
    };
    const serialized = saveEngine.save('slot_1', snapshot);
    const msgEl = document.getElementById('save-status-msg');
    const prevEl = document.getElementById('save-preview');
    if (msgEl) msgEl.textContent = 'Snapshot saved successfully!';
    if (prevEl) prevEl.textContent = JSON.stringify(serialized, null, 2).slice(0, 300) + '...';
    playSynthesizedTone(523.25, 0.15, 'sine', 'ui');
  });

  document.getElementById('btn-load-game')?.addEventListener('click', () => {
    try {
      const loaded = saveEngine.load('slot_1');
      if (loaded.player) {
        player.x = loaded.player.x;
        player.y = loaded.player.y;
        player.hp = loaded.player.hp;
        player.mp = loaded.player.mp;
      }
      worldHour = loaded.worldHour || 10.0;
      if (loaded.facts) {
        for (const [k, v] of Object.entries(loaded.facts)) {
          facts.set(k, v);
        }
      }
      if (loaded.level) {
        progression.level = loaded.level;
        progression.experience = loaded.xp || 0;
      }
      const msgEl = document.getElementById('save-status-msg');
      if (msgEl) {
        msgEl.textContent = 'Save loaded cleanly!';
        msgEl.style.color = 'var(--accent-emerald)';
      }
      playSynthesizedTone(659.25, 0.2, 'sine', 'ui');
      updateRPGUI();
    } catch (err) {
      const msgEl = document.getElementById('save-status-msg');
      if (msgEl) {
        msgEl.textContent = `Load Failed: ${err.message}`;
        msgEl.style.color = 'var(--accent-rose)';
      }
    }
  });

  document.getElementById('btn-test-corrupt')?.addEventListener('click', () => {
    try {
      saveEngine.recoverCorruptJson('{"invalid_json": true, incomplete', { throwOnError: true });
    } catch (err) {
      const msgEl = document.getElementById('save-status-msg');
      if (msgEl) {
        msgEl.textContent = `Correctly caught: ${err.name} (${err.message})`;
        msgEl.style.color = 'var(--accent-rose)';
      }
      playSynthesizedTone(150, 0.3, 'sawtooth', 'sfx');
    }
  });
}

function openDialogue(nodeId) {
  const storyModal = document.getElementById('story-modal');
  if (!storyModal) return;
  const node = storyGraph.getNode(nodeId);
  if (!node) {
    storyModal.hidden = true;
    return;
  }
  storyModal.hidden = false;
  const speakerEl = document.getElementById('dialogue-speaker');
  const textEl = document.getElementById('dialogue-text');
  if (speakerEl) speakerEl.textContent = node.speaker || 'NPC';
  if (textEl) textEl.textContent = typeof node.text === 'function' ? node.text() : node.text;

  const choiceContainer = document.getElementById('dialogue-choices');
  if (choiceContainer && typeof choiceContainer.appendChild === 'function') {
    choiceContainer.innerHTML = '';
    if (node.choices) {
      node.choices.forEach(ch => {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.textContent = ch.text;
        b.onclick = () => {
          if (ch.next) openDialogue(ch.next);
          else storyModal.hidden = true;
        };
        choiceContainer.appendChild(b);
      });
    }
  }
}

// ==========================================
// 15. MAIN GAME LOOP & UPDATES
// ==========================================
let lastTime = typeof performance !== 'undefined' ? performance.now() : 0;
let fpsCounter = 0;
let fpsTimer = 0;

export function updateShowcase(dt) {
  // 1. Ability Cooldowns & Mana Regen
  for (const k in abilityCooldowns) {
    if (abilityCooldowns[k] > 0) abilityCooldowns[k] = Math.max(0, abilityCooldowns[k] - dt);
  }
  player.mp = Math.min(player.maxMp, player.mp + 5 * dt);

  // 2. Status Effects Tick
  statusEffects.update(dt);

  // 3. Cellular Sim step
  if (simRunning) {
    cellSim.step();
    const cellCountEl = document.getElementById('active-cells-count');
    if (cellCountEl) {
      let count = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = cellSim.getCell(x, y);
          if (c && c.materialId !== 'air' && c.materialId !== 'empty') count++;
        }
      }
      cellCountEl.textContent = count;
    }
  }

  // 4. Time & Schedule
  if (autoAdvanceTime) {
    worldHour = (worldHour + dt) % 24;
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) timeSlider.value = worldHour;
  }
  const hourInt = Math.floor(worldHour);
  const minInt = Math.floor((worldHour % 1) * 60);
  const ampm = hourInt >= 12 ? 'PM' : 'AM';
  const displayHour = (hourInt % 12) || 12;
  const clockEl = document.getElementById('world-clock');
  if (clockEl) clockEl.textContent = `${displayHour}:${minInt < 10 ? '0' : ''}${minInt} ${ampm}`;

  const currentSlot = schedule.getSlotForHour(worldHour);
  const routineEl = document.getElementById('npc-routine-name');
  if (currentSlot && routineEl) {
    routineEl.textContent = currentSlot.activity;
  }

  // 5. Player Movement & Swept Physics
  let moveX = 0;
  let moveY = 0;
  if (keysDown.has('w') || keysDown.has('arrowup')) moveY -= 1;
  if (keysDown.has('s') || keysDown.has('arrowdown')) moveY += 1;
  if (keysDown.has('a') || keysDown.has('arrowleft')) moveX -= 1;
  if (keysDown.has('d') || keysDown.has('arrowright')) moveX += 1;

  if (activePath.length > 0 && moveX === 0 && moveY === 0) {
    const nextWaypoint = activePath[0];
    const dx = nextWaypoint.x - player.x;
    const dy = nextWaypoint.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) {
      activePath.shift();
      const pathEl = document.getElementById('path-nodes-count');
      if (pathEl) pathEl.textContent = activePath.length;
    } else {
      moveX = dx / d;
      moveY = dy / d;
    }
  }

  const speed = 160 + (equipment.getSlot('accessory')?.stats?.spd || 0);
  const len = Math.hypot(moveX, moveY);
  if (len > 0) {
    player.vx = (moveX / len) * speed;
    player.vy = (moveY / len) * speed;
  } else {
    player.vx = 0;
    player.vy = 0;
  }

  const staticObstacles = [];
  const startTileX = Math.max(0, Math.floor((player.x - 40) / TILE_SIZE));
  const endTileX = Math.min(COLS - 1, Math.floor((player.x + 40) / TILE_SIZE));
  const startTileY = Math.max(0, Math.floor((player.y - 40) / TILE_SIZE));
  const endTileY = Math.min(ROWS - 1, Math.floor((player.y + 40) / TILE_SIZE));

  for (let ty = startTileY; ty <= endTileY; ty++) {
    for (let tx = startTileX; tx <= endTileX; tx++) {
      const tile = mapData[ty * COLS + tx];
      if (tile === 1 || (tile === 3 && player.elevation === 0)) {
        staticObstacles.push({
          left: tx * TILE_SIZE,
          right: (tx + 1) * TILE_SIZE,
          top: ty * TILE_SIZE,
          bottom: (ty + 1) * TILE_SIZE
        });
      }
    }
  }

  const playerBounds = {
    left: player.x - player.w / 2,
    right: player.x + player.w / 2,
    top: player.y - player.h / 2,
    bottom: player.y + player.h / 2
  };

  // Swept movement
  if (player.vx !== 0 || player.vy !== 0) {
    const sweep = SweptAABB.sweepAgainstObstacles(playerBounds, player.vx * dt, player.vy * dt, staticObstacles);
    if (sweep.hit) {
      player.x += (player.vx * dt) * sweep.toi;
      player.y += (player.vy * dt) * sweep.toi;
    } else {
      player.x += player.vx * dt;
      player.y += player.vy * dt;
    }
  }

  // Knockback motor step
  if (player.motor.isActive) {
    const kb = player.motor.step(dt, playerBounds, staticObstacles);
    player.x += kb.dx;
    player.y += kb.dy;
  }

  // 6. Update Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const tileX = Math.floor(p.x / TILE_SIZE);
    const tileY = Math.floor(p.y / TILE_SIZE);
    if (tileX <= 0 || tileX >= COLS - 1 || tileY <= 0 || tileY >= ROWS - 1 || mapData[tileY * COLS + tileX] === 1) {
      projectiles.splice(i, 1);
      continue;
    }

    const cell = cellSim.getCell(tileX, tileY);
    if (cell && (cell.materialId === 'wood' || cell.materialId === 'dry_wood')) {
      cellSim.setCell(tileX, tileY, 'fire');
      projectiles.splice(i, 1);
      continue;
    }

    const distToNpc = Math.hypot(p.x - npc.x, p.y - npc.y);
    if (distToNpc < npc.w) {
      npc.hp = Math.max(0, npc.hp - 25);
      npc.motor.applyImpulse(p.vx * 0.4, p.vy * 0.4);
      statusEffects.applyEffect({ name: 'burning', duration: 3.0, category: 'debuff' });
      toggleFaction(true);
      projectiles.splice(i, 1);
      playSynthesizedTone(220, 0.2, 'sawtooth', 'sfx');
    }
  }

  // 7. Update NPC AI & Perception
  const dx = player.x - npc.x;
  const dy = player.y - npc.y;
  const distToPlayer = Math.hypot(dx, dy);

  const fovRange = parseFloat(document.getElementById('fov-range')?.value || 160);
  const fovAngleDeg = parseFloat(document.getElementById('fov-angle')?.value || 90);
  const fovAngleRad = (fovAngleDeg * Math.PI) / 180;
  perception.fovRadius = fovRange;
  perception.fovAngle = fovAngleRad;

  const playerAngle = Math.atan2(dy, dx);
  let angleDiff = Math.abs(playerAngle - npc.facingAngle);
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

  const canSeePlayer = distToPlayer <= fovRange && angleDiff <= fovAngleRad / 2;
  const isHostile = facts.get('guard_attitude') === 'hostile';

  const awareStatusEl = document.getElementById('ai-awareness-status');
  if (canSeePlayer) {
    npcMemory.record({ type: 'spotted_player', x: player.x, y: player.y, timestamp: performance.now() });
    if (awareStatusEl) {
      awareStatusEl.textContent = isHostile ? 'ENGAGING (HOSTILE)' : 'OBSERVING';
      awareStatusEl.style.color = isHostile ? 'var(--accent-rose)' : 'var(--accent-cyan)';
    }
  } else {
    if (awareStatusEl) {
      awareStatusEl.textContent = 'UNAWARE';
      awareStatusEl.style.color = 'var(--accent-emerald)';
    }
  }

  const aiContext = {
    spotted: canSeePlayer,
    isHostile,
    npcHp: npc.hp,
    npcMaxHp: npc.maxHp,
    distToPlayer
  };

  const decision = utilityAI.evaluate(aiContext);
  if (decision) {
    const scores = {};
    if (decision.candidateScores) {
      for (const c of decision.candidateScores) {
        scores[c.id] = c.score;
      }
    }
    const scorePatrolEl = document.getElementById('ai-score-patrol');
    const scoreAttackEl = document.getElementById('ai-score-attack');
    const scoreFleeEl = document.getElementById('ai-score-flee');
    const scoreHealEl = document.getElementById('ai-score-heal');
    if (scorePatrolEl) scorePatrolEl.textContent = scores.patrol?.toFixed(2) || '0.00';
    if (scoreAttackEl) scoreAttackEl.textContent = scores.attack?.toFixed(2) || '0.00';
    if (scoreFleeEl) scoreFleeEl.textContent = scores.flee?.toFixed(2) || '0.00';
    if (scoreHealEl) scoreHealEl.textContent = scores.heal?.toFixed(2) || '0.00';

    const chosenId = decision.chosenAction ? decision.chosenAction.id : 'patrol';
    const traceEl = document.getElementById('ai-decision-trace');
    if (traceEl) {
      traceEl.textContent = `Selected: [${chosenId.toUpperCase()}]\nScores: ${JSON.stringify(scores, null, 1)}`;
    }

    if (chosenId === 'attack' && distToPlayer > 30) {
      npc.vx = (dx / distToPlayer) * 80;
      npc.vy = (dy / distToPlayer) * 80;
      npc.facingAngle = Math.atan2(dy, dx);
    } else if (chosenId === 'flee') {
      npc.vx = (-dx / distToPlayer) * 100;
      npc.vy = (-dy / distToPlayer) * 100;
      npc.facingAngle = Math.atan2(-dy, -dx);
    } else {
      npc.vx = 0;
      npc.vy = 0;
    }
  }

  npc.x += npc.vx * dt;
  npc.y += npc.vy * dt;
  if (npc.motor.isActive) {
    const kb = npc.motor.step(dt, { left: npc.x - 8, right: npc.x + 8, top: npc.y - 8, bottom: npc.y + 8 }, []);
    npc.x += kb.dx;
    npc.y += kb.dy;
  }

  // 8. Update Noise Pulse
  if (noisePulse) {
    noisePulse.radius += 180 * dt;
    noisePulse.alpha = Math.max(0, 1.0 - (noisePulse.radius / noisePulse.maxRadius));
    if (noisePulse.alpha <= 0) noisePulse = null;
  }

  // 9. Update HUD
  const hpBar = document.getElementById('hp-bar');
  const hpText = document.getElementById('hp-text');
  const manaBar = document.getElementById('mana-bar');
  const manaText = document.getElementById('mana-text');
  if (hpBar) hpBar.style.width = `${Math.round((player.hp / player.maxHp) * 100)}%`;
  if (hpText) hpText.textContent = `${Math.round(player.hp)}/${player.maxHp}`;
  if (manaBar) manaBar.style.width = `${Math.round((player.mp / player.maxMp) * 100)}%`;
  if (manaText) manaText.textContent = `${Math.round(player.mp)}/${player.maxMp}`;

  updateFactsTable();
}

export function renderShowcase() {
  if (!ctx || typeof ctx.beginPath !== 'function') return;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // 1. Draw Tilemap Base
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = mapData[y * COLS + x];
      if (tile === 1) {
        ctx.fillStyle = '#2d3748';
      } else if (tile === 2) {
        ctx.fillStyle = '#1e3a5f';
      } else if (tile === 3) {
        ctx.fillStyle = '#0a0d14';
      } else if (tile === 4) {
        ctx.fillStyle = '#4a5568';
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1a2332' : '#17202e';
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // 2. Draw Cellular Simulation Overlay
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = cellSim.getCell(x, y);
      if (!cell || cell.materialId === 'air' || cell.materialId === 'empty') continue;

      if (cell.materialId === 'wood' || cell.materialId === 'dry_wood') {
        ctx.fillStyle = '#854d0e';
      } else if (cell.materialId === 'fire') {
        ctx.fillStyle = Math.random() > 0.4 ? '#ef4444' : '#f97316';
      } else if (cell.materialId === 'water') {
        ctx.fillStyle = '#38bdf8';
      } else if (cell.materialId === 'sand') {
        ctx.fillStyle = '#fbbf24';
      } else if (cell.materialId === 'steam') {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // 3. Draw Spatial Hash Grid Lines (if toggled)
  if (document.getElementById('chk-spatial-grid')?.checked) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  }

  // 4. Draw Navigation A* Path
  if (activePath.length > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    activePath.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#38bdf8';
    activePath.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 5. Draw NPC FOV Vision Cone
  const fovRange = perception.fovRadius;
  const fovAngle = perception.fovAngle;
  ctx.save();
  ctx.fillStyle = facts.get('guard_attitude') === 'hostile' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.12)';
  ctx.strokeStyle = facts.get('guard_attitude') === 'hostile' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.35)';
  ctx.beginPath();
  ctx.moveTo(npc.x, npc.y);
  ctx.arc(npc.x, npc.y, fovRange, npc.facingAngle - fovAngle / 2, npc.facingAngle + fovAngle / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 6. Draw Noise Pulse
  if (noisePulse) {
    ctx.save();
    ctx.strokeStyle = `rgba(52, 211, 153, ${noisePulse.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(noisePulse.x, noisePulse.y, noisePulse.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 7. Draw NPC Entity
  ctx.save();
  ctx.fillStyle = facts.get('guard_attitude') === 'hostile' ? '#ef4444' : '#10b981';
  ctx.beginPath();
  ctx.arc(npc.x, npc.y, npc.w / 2, 0, Math.PI * 2);
  ctx.fill();
  // Facing indicator
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(npc.x, npc.y);
  ctx.lineTo(npc.x + Math.cos(npc.facingAngle) * 14, npc.y + Math.sin(npc.facingAngle) * 14);
  ctx.stroke();
  ctx.restore();

  // 8. Draw Player Entity
  ctx.save();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 9. Draw Projectiles
  projectiles.forEach(p => {
    ctx.save();
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  fpsCounter++;
  fpsTimer += dt;
  if (fpsTimer >= 1.0) {
    const fpsEl = document.getElementById('fps-display');
    if (fpsEl) fpsEl.textContent = fpsCounter;
    fpsCounter = 0;
    fpsTimer = 0;
  }

  updateShowcase(dt);
  renderShowcase();

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(gameLoop);
  }
}

function updateRPGUI() {
  const lvlEl = document.getElementById('rpg-level');
  const xpEl = document.getElementById('rpg-xp');
  if (lvlEl) lvlEl.textContent = progression.level;
  if (xpEl) xpEl.textContent = `${progression.experience} / ${progression.experienceToNextLevel()}`;
  const baseAtk = 15 + progression.level * 2;
  const baseDef = 5 + progression.level;
  const gearAtk = equipment.getSlot('mainHand')?.stats?.atk || 0;
  const gearDef = (equipment.getSlot('armor')?.stats?.def || 0) + (equipment.getSlot('offHand')?.stats?.def || 0);

  const atkEl = document.getElementById('stat-atk');
  const defEl = document.getElementById('stat-def');
  if (atkEl) atkEl.textContent = baseAtk + gearAtk;
  if (defEl) defEl.textContent = baseDef + gearDef;
}

function updateInventoryUI() {
  const container = document.getElementById('inventory-grid-container');
  if (!container || typeof container.appendChild !== 'function') return;
  container.innerHTML = '';

  inventory.slots.forEach((slotData, idx) => {
    const it = slotData.item;
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.textContent = `${it.name}${slotData.quantity > 1 ? ` (${slotData.quantity})` : ''}`;
    slot.onclick = () => {
      if (it.type === 'consumable' || it.slot === 'consumable') {
        player.hp = Math.min(player.maxHp, player.hp + (it.healAmount || 30));
        inventory.removeItem(it.id, 1);
        playSynthesizedTone(440, 0.15, 'sine', 'ui');
      } else {
        equipment.equip(it.slot || 'mainHand', it);
        inventory.removeItem(it.id, 1);
        playSynthesizedTone(520, 0.15, 'triangle', 'ui');
        updateEquipmentDisplay();
        updateRPGUI();
      }
      updateInventoryUI();
    };
    container.appendChild(slot);
  });
}

function updateEquipmentDisplay() {
  const mainHand = equipment.getSlot('mainHand');
  const armor = equipment.getSlot('armor');
  const acc = equipment.getSlot('accessory');

  const mhEl = document.getElementById('gear-mainhand-name');
  const arEl = document.getElementById('gear-armor-name');
  const acEl = document.getElementById('gear-acc-name');
  if (mhEl) mhEl.textContent = mainHand ? mainHand.name : '(Empty)';
  if (arEl) arEl.textContent = armor ? armor.name : '(Empty)';
  if (acEl) acEl.textContent = acc ? acc.name : '(Empty)';
}

function updateFactsTable() {
  const el = document.getElementById('world-facts-table');
  if (!el) return;
  const entries = facts.entries();
  el.innerHTML = Array.from(entries).map(([k, v]) => `<div><span style="color:var(--text-muted)">${k}:</span> <span style="color:var(--accent-cyan)">${v}</span></div>`).join('');
}

// Initial UI setup
if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
  updateRPGUI();
  updateInventoryUI();
  updateEquipmentDisplay();
  updateFactsTable();
}

if (typeof window !== 'undefined' && typeof process === 'undefined' && typeof requestAnimationFrame !== 'undefined') {
  requestAnimationFrame(gameLoop);
}

// Export for test suite verification
export {
  worldMetadata, navGrid, cellSim, materialReg, audioBuses,
  progression, statusEffects, itemRegistry, inventory, equipment, lootTable,
  facts, eventBus, ruleEngine, storyGraph, factions, schedule, scheduleSystem,
  perception, utilityAI, player, npc, saveEngine
};
