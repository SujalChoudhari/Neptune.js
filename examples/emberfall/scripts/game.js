// Project code, not engine internals. No editor/native dependencies.
export function create({ entity, engine, properties }) {
    const { Transform, Shape, Color, KeyboardInput: Input, SceneManager, SaveManager, BoxCollider, Nereid, Larissa } = engine;
    const { Combatant, CombatSystem, AttackDefinition, Inventory } = Larissa;
    const scene = SceneManager.GetActiveScene();
    const actors = () => scene.children.filter(item => item.gameplay);
    const player = () => scene.children.find(item => item.id === 'hero');
    const transform = entity.GetComponent(Transform);
    const enemy = properties.role === 'enemy';
    const combatant = new Combatant({ id: entity.id, faction: enemy ? 'wild' : 'hero', maxHealth: properties.health ?? 100, hurtbox: { width: 0.7, height: 0.7 }, invulnerabilityDuration: 0.35 });
    const state = { combatant, gold: 0, completed: false };
    entity.gameplay = state;
    const attack = new AttackDefinition({ name: 'slash', damage: enemy ? 8 : 25, range: 1.6, hitbox: { width: 1.6, height: 1.6 }, active: 0.15, recovery: 0.15, cooldown: enemy ? 1 : 0.2 });
    const system = enemy ? null : new CombatSystem();
    const inventory = enemy ? null : new Inventory(8);
    const save = new SaveManager({ prefix: 'neptune.emberfall' });
    const down = key => Input.IsKeyDown(Input.KEY_CODE[key]);
    const pressed = key => Input.IsKeyPressed(Input.KEY_CODE[key]);
    let facing = { x: 1, y: 0 }, hud, camera, message = 'Clear the ruins, then claim the ember at the golden altar.', elapsed = 0;
    const bounds = item => {
        const p = item.GetComponent(Transform).position;
        const box = item.GetComponent(BoxCollider);
        return { x: p.x, y: p.y, collider: new Nereid.Collider(box.size.x, box.size.y, -box.size.x / 2, -box.size.y / 2) };
    };
    const walls = scene.children.filter(item => item.GetComponent(BoxCollider)).map(bounds);
    const body = new Nereid.Collider(0.65, 0.65, -0.325, -0.325);
    const move = (dx, dy) => {
        for (const [axis, amount] of [['x', dx], ['y', dy]]) {
            const p = { ...transform.position, [axis]: transform.position[axis] + amount };
            if (!walls.some(wall => body.overlaps(wall.collider, p.x, p.y, wall.x, wall.y))) transform.position[axis] = p[axis];
        }
    };
    const paint = () => {
        if (!hud) return;
        const alive = actors().filter(item => item !== entity && item.gameplay.combatant.isAlive).length;
        hud.querySelector('[data-state]').textContent = `HP ${Math.ceil(combatant.health)}/${combatant.maxHealth}  ·  Foes ${alive}  ·  Gold ${state.gold}`;
        hud.querySelector('[data-message]').textContent = message;
        hud.querySelector('[data-result]').textContent = state.completed ? 'EMBER RECOVERED — victory!' : !combatant.isAlive ? 'You fell. Press R to retry.' : '';
    };
    const capture = () => ({ hero: { x: transform.position.x, y: transform.position.y, health: combatant.health }, gold: state.gold, completed: state.completed,
        enemies: actors().filter(item => item !== entity).map(item => ({ id: item.id, health: item.gameplay.combatant.health, ...item.GetComponent(Transform).position })) });
    const restore = data => {
        if (!data?.hero || !Number.isFinite(data.hero.x) || !Number.isFinite(data.hero.y) || !Array.isArray(data.enemies)) throw new Error('Invalid Emberfall save');
        Object.assign(transform.position, { x: data.hero.x, y: data.hero.y });
        combatant.health = data.hero.health; state.gold = data.gold; state.completed = data.completed;
        for (const saved of data.enemies) {
            const actor = actors().find(item => item.id === saved.id);
            if (!actor) continue;
            actor.gameplay.combatant.health = saved.health;
            Object.assign(actor.GetComponent(Transform).position, { x: saved.x, y: saved.y });
            actor.GetComponent(Shape).color = Color.FromHex(saved.health > 0 ? 0xb86766 : 0x414b51);
        }
    };
    return {
        start() {
            if (enemy) return;
            camera = new engine.Camera(window.innerWidth, window.innerHeight);
            scene.activeCamera = camera;
            hud = document.createElement('aside'); hud.id = 'emberfall-hud';
            hud.style.cssText = 'position:fixed;left:18px;top:16px;max-width:440px;padding:16px 20px;background:linear-gradient(145deg,rgba(16,29,40,0.95),rgba(9,16,22,0.98));color:#f3ebd8;border:1.5px solid #ab8955;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.7),0 0 18px rgba(171,137,85,0.25);font:14px/1.65 system-ui,sans-serif;pointer-events:none;z-index:20;backdrop-filter:blur(4px)';
            hud.innerHTML = '<b style="color:#ffd56b;letter-spacing:0.06em;font-size:15px;">EMBERFALL · The First Ember</b><div data-state style="font-weight:700;color:#78f4d5;margin:4px 0;"></div><div data-message style="color:#d9d3c5;font-style:italic;"></div><strong data-result style="display:block;margin:4px 0;color:#ffaa66;"></strong><small style="display:block;color:#96abb0;margin-top:6px;border-top:1px solid #32474f;padding-top:6px;">WASD / arrows move · J attack · E interact<br>O save · L load · R retry · editor Pause stops simulation</small>';
            document.body.append(hud); paint();
            combatant.onDeath = () => { message = 'The ruins claimed another wanderer.'; paint(); };
            system.on('death', ({ target }) => {
                if (target === combatant) return;
                state.gold += 5; inventory.gold = state.gold;
                message = 'A guardian falls. +5 gold'; paint();
            });
        },
        update(dt) {
            elapsed += dt;
            combatant.position.x = transform.position.x; combatant.position.y = transform.position.y;
            const shape = entity.GetComponent(Shape);
            if (enemy) {
                if (!combatant.isAlive) { shape.color = Color.FromHex(0x414b51); return; }
                const hero = player(); if (!hero?.gameplay?.combatant.isAlive) return;
                const p = hero.GetComponent(Transform).position;
                const dx = p.x - transform.position.x, dy = p.y - transform.position.y, distance = Math.hypot(dx, dy);
                if (distance < 6 && distance > 0.8) move(dx / distance * dt * (properties.speed ?? 1), dy / distance * dt * (properties.speed ?? 1));
                if (distance < 1.2) hero.gameplay.system?.startAttack(combatant, attack, { x: dx || 0.01, y: dy });
                shape.color = Color.FromHex(combatant.invulnerableRemaining > 0 ? 0xffdca0 : properties.color ?? 0xb86766);
                return;
            }
            state.system = system;
            camera.zoom = Math.min(window.innerWidth / (14 * 64), window.innerHeight / (9 * 64));
            if (pressed('R')) { combatant.health = combatant.maxHealth; transform.position.x = 2; transform.position.y = 4; message = 'Try again. Your saved slot is unchanged.'; }
            if (pressed('O')) { save.save('slot-1', capture()); message = 'Saved to slot 1.'; }
            if (pressed('L')) { try { const data = save.load('slot-1'); if (data) { restore(data); message = 'Loaded slot 1.'; } else message = 'No saved game yet.'; } catch (error) { message = error.message; } }
            if (combatant.isAlive && !state.completed) {
                let dx = Number(down('D') || down('RIGHTARROW')) - Number(down('A') || down('LEFTARROW'));
                let dy = Number(down('S') || down('DOWNARROW')) - Number(down('W') || down('UPARROW'));
                const length = Math.hypot(dx, dy);
                if (length) { dx /= length; dy /= length; facing = { x: dx, y: dy }; move(dx * dt * 3.5, dy * dt * 3.5); }
                combatant.position.x = transform.position.x; combatant.position.y = transform.position.y;
                if (down('J')) system.startAttack(combatant, attack, facing);
                if (pressed('E')) {
                    const remaining = actors().some(item => item !== entity && item.gameplay.combatant.isAlive);
                    if (Math.hypot(transform.position.x - 12, transform.position.y - 2) < 1.5) {
                        if (remaining) message = 'The altar is sealed while guardians remain.';
                        else { state.completed = true; state.gold += 25; message = 'You recovered the First Ember. +25 gold'; }
                    } else message = 'The golden altar waits in the northeast.';
                }
            }
            system.update(dt, actors().map(item => item.gameplay.combatant));
            shape.color = Color.FromHex(combatant.invulnerableRemaining > 0 ? 0xffffff : 0x7cdac2);
            if (elapsed > 0.08) { paint(); elapsed = 0; }
        },
        destroy() { hud?.remove(); if (scene.activeCamera === camera) scene.activeCamera = null; delete entity.gameplay; }
    };
}
