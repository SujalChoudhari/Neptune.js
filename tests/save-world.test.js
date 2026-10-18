import { test } from "node:test";
import assert from "node:assert/strict";
import { SaveManager } from "../src/core/saveManager.js";
import { GameClock } from "../src/core/gameClock.js";
class Memory { data = new Map(); getItem(k) { return this.data.get(k) ?? null; } setItem(k,v) { this.data.set(k,String(v)); } removeItem(k) { this.data.delete(k); } keys() { return [...this.data.keys()]; } }
test("save manager supports slots, migration, corruption and autosave recovery", async () => {
 const storage = new Memory(), saves = new SaveManager({ storage });
 const state = { player: { hp: 8 }, inventory: ["key"], quests: { open: true }, npcs: { guide: "home" }, map: { door: "open" }, flags: { rescued: true }, settings: { music: false } };
 saves.save("manual", state); saves.save("backup", { player: { hp: 3 } });
 assert.deepEqual(saves.load("manual"), state); assert.deepEqual(saves.slots().sort(), ["backup", "manual"]);
 storage.setItem(saves.key("old"), JSON.stringify({ schemaVersion: 0, state: { health: 4 } }));
 assert.deepEqual(saves.load("old", { 0: r => ({ schemaVersion: 1, state: { player: { hp: r.state.health } } }) }), { player: { hp: 4 } });
 storage.setItem(saves.key("broken"), "{"); assert.throws(() => saves.load("broken"), /corrupt JSON/);
 saves.enableAutosave(() => state); await saves.autosaveNow(); assert.deepEqual(saves.recover(), state); saves.disableAutosave();
});
test("game clock advances calendars and fires scheduled world events", () => {
 const clock = new GameClock({ minutesPerDay: 60, daysPerYear: 2, minute: 55 }); let fired = 0;
 clock.schedule(60, date => { fired++; assert.equal(date.day, 2); }); clock.advance(5);
 assert.equal(fired, 1); assert.deepEqual(clock.calendar, { year: 1, day: 2, minuteOfDay: 0 });
 assert.deepEqual(GameClock.restore(clock.serialize()).calendar, clock.calendar);
});
