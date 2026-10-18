/** Versioned multi-slot persistence for game-defined world state. */
export class SaveManager {
  static SCHEMA_VERSION = 1;
  constructor({ storage = globalThis.localStorage, prefix = "neptune.save", autosaveInterval = 0, onError = () => {} } = {}) {
    this.storage = storage ?? new MapStorage(); this.prefix = prefix; this.autosaveInterval = autosaveInterval; this.onError = onError; this.timer = null;
    if (!Number.isFinite(autosaveInterval) || autosaveInterval < 0) throw new RangeError("autosaveInterval must be non-negative.");
  }
  key(slot) { if (typeof slot !== "string" || !slot.trim()) throw new TypeError("Save slot must be a non-empty string."); return `${this.prefix}.${encodeURIComponent(slot)}`; }
  save(slot, state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) throw new TypeError("Game state must be an object.");
    let text;
    try { text = JSON.stringify({ schemaVersion: SaveManager.SCHEMA_VERSION, savedAt: Date.now(), state }); }
    catch (error) { throw new Error(`Game state cannot be saved: ${error.message}`); }
    this.storage.setItem(this.key(slot), text); return JSON.parse(text);
  }
  load(slot, migrations = {}) {
    const text = this.storage.getItem(this.key(slot)); if (text === null) return null;
    let record;
    try { record = JSON.parse(text); } catch (error) { throw new Error(`Save slot '${slot}' is corrupt JSON: ${error.message}`); }
    if (!record || !Number.isInteger(record.schemaVersion) || !record.state || typeof record.state !== "object") throw new Error(`Save slot '${slot}' is corrupt: expected a versioned game state.`);
    while (record.schemaVersion !== SaveManager.SCHEMA_VERSION) {
      const migrate = migrations[record.schemaVersion];
      if (typeof migrate !== "function") throw new Error(`Save slot '${slot}' uses unsupported schema ${record.schemaVersion}; supply a migration to ${SaveManager.SCHEMA_VERSION}.`);
      record = migrate(structuredClone(record));
      if (!record || !Number.isInteger(record.schemaVersion)) throw new Error(`Migration for '${slot}' returned an invalid record.`);
    }
    return structuredClone(record.state);
  }
  slots() { const keys = typeof this.storage.keys === "function" ? this.storage.keys() : Array.from({length: this.storage.length ?? 0}, (_, i) => this.storage.key(i)); return keys.filter(k => k?.startsWith(`${this.prefix}.`)).map(k => decodeURIComponent(k.slice(this.prefix.length + 1))); }
  remove(slot) { this.storage.removeItem(this.key(slot)); }
  enableAutosave(capture, slot = "autosave") {
    if (typeof capture !== "function") throw new TypeError("Autosave capture must be a function.");
    this.disableAutosave(); this.capture = capture; this.autosaveSlot = slot;
    if (this.autosaveInterval) this.timer = setInterval(() => {
      if (this.autosavePending) return;
      this.autosavePending = this.autosaveNow().finally(() => { this.autosavePending = null; });
    }, this.autosaveInterval);
    return this;
  }
  disableAutosave() { if (this.timer !== null) clearInterval(this.timer); this.timer = null; }
  async autosaveNow() { if (!this.capture) throw new Error("Autosave is not configured."); try { this.recoverable = this.save(this.autosaveSlot, await this.capture()); return this.recoverable; } catch (error) { this.onError(error); throw error; } }
  recover() { return this.load(this.autosaveSlot ?? "autosave"); }
}
class MapStorage extends Map {
  getItem(k) { return this.has(k) ? this.get(k) : null; }
  setItem(k, v) { this.set(k, String(v)); }
  removeItem(k) { this.delete(k); }
  keys() { return Array.from(super.keys()); }
}
