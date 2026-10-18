# Build a 2D action RPG with Neptune

This tutorial turns Neptune's checked-in `debug_project/` into a small, playable action RPG. The project already includes its runtime scenes and systems; the steps below show where each gameplay feature lives and how to verify changes without replacing the real sample with mock data.

## Run the project

From the repository root:

```sh
npm ci --ignore-scripts --no-audit --no-fund
python3 -m http.server 8000
```

Open `http://localhost:8000/debug_project/` and press **Play Game**. Use arrow keys to move; press **E** near the Town Guide to start the quest and receive a Training Blade. The purple stairs lead to the dungeon. There, **J** attacks, **K** fires a ranged attack, **U** equips the blade, **P** pauses, **S** saves, and **L** loads. Press **E** by the stairs to return to town.

Run `npm test` from another terminal at the repository root to execute the real-scene gameplay smoke test. It loads the project's actual scene and tilemap files, drives input through the runtime, and checks dialogue, quest progress, enemy navigation and combat, rewards, persistence, the boss encounter, and scene transitions.

## 1. Start with the authored scenes

`debug_project/main.js` registers custom components and loads `debug_project/scenes/demo.scn`. The browser entry point is `debug_project/index.html`. The Town and Dungeon scene definitions are `debug_project/scenes/demo.scn` and `debug_project/scenes/demo2.scn`; they share the player sprite at `debug_project/assets/player.png` and tileset at `debug_project/assets/tileset.png`, with tilemap data in `debug_project/scenes/level1.map` and `debug_project/scenes/level2.map`.

Open the scenes as JSON and follow their component entries into the scripts. The Town scene contains the guide and the entrance portal. The Dungeon scene contains authored slime entities, a Warden, and the exit portal. Entity names and component properties in scene data connect content to runtime behavior.

## 2. Read the player controller

`debug_project/scripts/playerController.js` reads left/right arrow or A/D input, tracks a facing direction, applies gravity, and resolves movement against `BoxCollider` components in the active scene. The player is an `Entity` with `Transform`, collider, renderable, and `PlayerController` components. Keep game-specific input and movement in this behaviour instead of adding it to the engine's main loop.

To change the feel, edit the controller's `speed`, `jumpForce`, or `gravity` values, then run the sample smoke test and try the project in the browser.

## 3. Add an NPC quest

`debug_project/scripts/townGuide.js` is an example of composing RPG systems in a gameplay behaviour:

- `DialogueBox` presents the guide's lines when the player presses **E** nearby.
- `GameData` defines the Slime Trouble quest and its objective.
- `QuestLog` tracks objective progress.
- `Inventory` grants the Training Blade and is attached to the player for the dungeon to reuse.
- `renderRpgHud` reports inventory and quest state in the HTML HUD.

Change the dialogue or quest definition there. Keep the scene's `TownGuide` component registered in `debug_project/main.js` so the scene loader can construct it.

## 4. Author enemies and combat

`debug_project/scripts/dungeonEncounter.js` builds `Combatant` and `AttackDefinition` values, creates a `CombatSystem`, and gives each authored `Slime ` entity an `EnemyAI` connected to the dungeon `Tilemap`. Enemy deaths vacate their grid cells, grant configured XP and loot, and advance the Town Guide's quest. Once the slimes are defeated, `BossAI` activates the Dungeon Warden's phased attacks.

Add or move enemies in the Dungeon scene data; the encounter finds the authored slime entities at runtime. Keep spawn cells walkable and distinct. The sample runtime test checks that the edited scene still boots and that authored enemies participate in navigation and combat.

## 5. Save and transition safely

The encounter saves the active dungeon name, player position, inventory, progression, and quests through `SaveManager`; **S** writes slot `slot-1` and **L** restores it. `ScenePortal` loads the destination scene if needed and transfers the same player entity through `SceneManager.TransitionToScene`, then places the player at the configured destination coordinates. This keeps runtime state such as inventory and quest progress intact when moving between Town and Dungeon.

## 6. Change and verify the sample

Make one change at a time—for example, adjust the guide's dialogue, change a slime's spawn cell, or tune a combat attack definition. Run `npm test` after each change. To see the result interactively, refresh the browser page served from the repository root. If loading fails, check the browser console, verify referenced scene/tilemap paths, and confirm custom component names are registered in `debug_project/main.js`.

For the first scene/entity example before this gameplay walkthrough, follow [Your first Neptune game](first-game.md). For the sample's full controls and an editing walkthrough, see [`debug_project/README.md`](../../debug_project/README.md).
