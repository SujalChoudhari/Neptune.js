/** Deterministic in-game calendar and scheduled event queue. */
export class GameClock {
  constructor({ minutesPerDay = 1440, daysPerYear = 360, minute = 0 } = {}) {
    if (![minutesPerDay, daysPerYear].every(n => Number.isInteger(n) && n > 0) || !Number.isFinite(minute) || minute < 0) throw new RangeError("Calendar dimensions must be positive integers and minute non-negative.");
    this.minutesPerDay = minutesPerDay; this.daysPerYear = daysPerYear; this.minute = minute; this.events = [];
  }
  get calendar() { const day = Math.floor(this.minute / this.minutesPerDay); return { year: Math.floor(day / this.daysPerYear) + 1, day: day % this.daysPerYear + 1, minuteOfDay: this.minute % this.minutesPerDay }; }
  schedule(atMinute, callback) { if (!Number.isFinite(atMinute) || atMinute < this.minute || typeof callback !== "function") throw new TypeError("Event requires a future time and callback."); this.events.push({ atMinute, callback }); this.events.sort((a,b) => a.atMinute-b.atMinute); }
  advance(minutes = 1) { if (!Number.isFinite(minutes) || minutes < 0) throw new RangeError("Advance must be non-negative."); const end = this.minute + minutes; while (this.events[0]?.atMinute <= end) { const event = this.events.shift(); this.minute = event.atMinute; event.callback(this.calendar); } this.minute = end; return this.calendar; }
  serialize() { return { minute: this.minute, minutesPerDay: this.minutesPerDay, daysPerYear: this.daysPerYear }; }
  static restore(data) { return new GameClock(data); }
}
