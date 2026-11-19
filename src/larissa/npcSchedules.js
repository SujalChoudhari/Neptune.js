import { Component } from "../components/component.js";

/**
 * Standard routine activity types supported by NPC schedules.
 */
export const ROUTINE_ACTIVITIES = Object.freeze({
    WORK: "work",
    REST: "rest",
    PATROL: "patrol",
    SLEEP: "sleep",
    WANDER: "wander",
    IDLE: "idle",
    ALERT: "alert",
    FLEE: "flee",
    COMBAT: "combat"
});

/**
 * Standard faction dispositions.
 */
export const FACTION_DISPOSITION = Object.freeze({
    FRIENDLY: "friendly",
    NEUTRAL: "neutral",
    HOSTILE: "hostile"
});

/**
 * Normalizes and parses a game hour into a 24-hour float [0, 24).
 * Supports numbers, strings like "14:30" or "06:00", or GameClock instances.
 * @param {number|string|Object} time - The time value to parse.
 * @returns {number} Normalized hour from 0 up to (exclusive) 24.
 */
export function parseHour(time) {
    if (typeof time === "number") {
        if (!Number.isFinite(time)) {
            throw new TypeError("Time number must be finite");
        }
        return ((time % 24) + 24) % 24;
    }
    if (typeof time === "string") {
        const str = time.trim();
        if (str.includes(":")) {
            const parts = str.split(":");
            const hours = parseFloat(parts[0]);
            const minutes = parseFloat(parts[1] || "0");
            const seconds = parseFloat(parts[2] || "0");
            if (Number.isFinite(hours) && Number.isFinite(minutes)) {
                const totalHours = hours + (minutes / 60) + (seconds / 3600);
                return ((totalHours % 24) + 24) % 24;
            }
        }
        const parsed = parseFloat(str);
        if (Number.isFinite(parsed)) {
            return ((parsed % 24) + 24) % 24;
        }
    }
    if (time && typeof time === "object") {
        if (Number.isFinite(time.hour)) {
            const extra = Number.isFinite(time.minute) ? time.minute / 60 : 0;
            return (((time.hour + extra) % 24) + 24) % 24;
        }
        if (time.calendar && Number.isFinite(time.calendar.minuteOfDay)) {
            return (time.calendar.minuteOfDay / 60) % 24;
        }
        if (Number.isFinite(time.minute) && Number.isFinite(time.minutesPerDay) && time.minutesPerDay > 0) {
            const minuteOfDay = time.minute % time.minutesPerDay;
            return ((minuteOfDay / (time.minutesPerDay / 24)) % 24 + 24) % 24;
        }
    }
    throw new TypeError(`Unable to parse time: ${time}`);
}

/**
 * Checks whether a given hour falls inside a slot with optional midnight wraparound.
 * @param {number} hour - Hour to test [0, 24).
 * @param {number} start - Slot start hour [0, 24).
 * @param {number} end - Slot end hour [0, 24).
 * @returns {boolean} True if the hour falls within the slot interval.
 */
export function isHourInSlot(hour, start, end) {
    const h = ((hour % 24) + 24) % 24;
    const s = ((start % 24) + 24) % 24;
    const e = ((end % 24) + 24) % 24;

    if (s === e) {
        return true;
    }
    if (s < e) {
        return h >= s && h < e;
    }
    return h >= s || h < e;
}

/**
 * Derives a string identifier for a destination point or object.
 * @param {Object|string|number} point - Destination point.
 * @returns {string|null} String key or null if invalid.
 */
export function getPointKey(point) {
    if (point === null || point === undefined) return null;
    if (typeof point === "string" || typeof point === "number") return String(point);
    if (typeof point === "object") {
        if (point.id !== undefined && point.id !== null) return String(point.id);
        if (point.name !== undefined && point.name !== null) return String(point.name);
        if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
            return `pt_${point.x}_${point.y}`;
        }
    }
    return String(point);
}

/**
 * An individual time slot inside an NPC's daily routine.
 */
export class ScheduleSlot {
    static _nextId = 1;

    /**
     * @param {Object} config - Configuration object.
     * @param {number|string} config.start - Start time (hour 0-24 or "HH:MM").
     * @param {number|string} config.end - End time (hour 0-24 or "HH:MM").
     * @param {string} [config.activity="idle"] - Scheduled activity.
     * @param {Object|string} [config.destination=null] - Primary destination point.
     * @param {Array} [config.fallbacks=[]] - Alternate destination points if primary is occupied.
     * @param {Object|string} [config.fallbackDestination=null] - Single fallback point shorthand.
     * @param {string} [config.fallbackActivity="idle"] - Activity if all destinations are occupied.
     * @param {string} [config.id] - Optional identifier for the slot.
     * @param {number} [config.priority=0] - Priority for overlapping slots (higher wins).
     * @param {boolean} [config.isAppointment=false] - Whether this slot represents an appointment.
     * @param {Function} [config.onEnter=null] - Lifecycle callback when slot becomes active.
     * @param {Function} [config.onExit=null] - Lifecycle callback when slot ends.
     * @param {Object} [config.data={}] - Additional custom metadata.
     */
    constructor(config = {}) {
        if (!config || typeof config !== "object") {
            throw new TypeError("ScheduleSlot configuration must be an object");
        }
        if (config.start === undefined || config.end === undefined) {
            throw new TypeError("ScheduleSlot requires start and end times");
        }

        this.id = config.id || `slot-${ScheduleSlot._nextId++}`;
        this.start = parseHour(config.start);
        this.end = parseHour(config.end);
        this.activity = config.activity || ROUTINE_ACTIVITIES.IDLE;
        this.destination = config.destination || null;

        const fallbacks = [];
        if (Array.isArray(config.fallbacks)) {
            fallbacks.push(...config.fallbacks);
        }
        if (config.fallbackDestination && !fallbacks.includes(config.fallbackDestination)) {
            fallbacks.push(config.fallbackDestination);
        }
        this.fallbacks = fallbacks;
        this.fallbackActivity = config.fallbackActivity || ROUTINE_ACTIVITIES.IDLE;
        this.priority = Number.isFinite(config.priority) ? config.priority : 0;
        this.isAppointment = Boolean(config.isAppointment);
        this.onEnter = typeof config.onEnter === "function" ? config.onEnter : null;
        this.onExit = typeof config.onExit === "function" ? config.onExit : null;
        this.data = config.data ? { ...config.data } : {};
    }

    /**
     * Whether this slot wraps around midnight (e.g. 22:00 to 06:00).
     * @returns {boolean}
     */
    get wrapsMidnight() {
        return this.start > this.end;
    }

    /**
     * Duration in hours of this slot.
     * @returns {number}
     */
    get duration() {
        if (this.start === this.end) return 24;
        if (this.start < this.end) return this.end - this.start;
        return (24 - this.start) + this.end;
    }

    /**
     * Checks if this slot is active at the given game hour.
     * @param {number|string} hour - Hour to test.
     * @returns {boolean}
     */
    isActive(hour) {
        const h = parseHour(hour);
        return isHourInSlot(h, this.start, this.end);
    }
}

/**
 * Manages an individual NPC's daily routine, danger state, and appointment history.
 */
export class NPCSchedule extends Component {
    static _nextId = 1;

    /**
     * @param {Object} [config={}] - Configuration options.
     * @param {string} [config.id] - Unique NPC identifier.
     * @param {Array} [config.slots=[]] - Initial schedule slots.
     * @param {string} [config.defaultActivity="idle"] - Fallback activity when no slot matches.
     * @param {number|string} [config.initialHour=0] - Initial game hour.
     * @param {string} [config.faction="neutral"] - NPC faction affiliation.
     * @param {ScheduleSystem} [config.system=null] - Reference to parent ScheduleSystem.
     * @param {Entity} [config.entity=null] - Neptune Entity this component attaches to.
     */
    constructor(config = {}) {
        super(config.entity || null);
        this.id = config.id || `npc-${NPCSchedule._nextId++}`;
        this.slots = [];
        this.defaultActivity = config.defaultActivity || ROUTINE_ACTIVITIES.IDLE;
        this.currentHour = config.initialHour !== undefined ? parseHour(config.initialHour) : 0;
        this.currentSlot = null;
        this.currentActivity = this.defaultActivity;
        this.currentDestination = null;
        this.destinationStatus = "none";
        this.claimedPoint = null;
        this.inDanger = false;
        this.dangerData = null;
        this.suspendedState = null;
        this.missedAppointments = [];
        this.faction = config.faction || "neutral";
        this.system = config.system || null;

        if (Array.isArray(config.slots)) {
            for (const slot of config.slots) {
                this.addSlot(slot);
            }
        }
    }

    /**
     * Whether schedule execution is currently suspended due to danger.
     * @returns {boolean}
     */
    get isSuspended() {
        return this.inDanger;
    }

    /**
     * Whether NPC is currently in danger.
     * @returns {boolean}
     */
    get isInDanger() {
        return this.inDanger;
    }

    /**
     * Adds a schedule slot to this NPC's routine.
     * @param {ScheduleSlot|Object} slot - Slot instance or config object.
     * @returns {ScheduleSlot} The added slot.
     */
    addSlot(slot) {
        const instance = slot instanceof ScheduleSlot ? slot : new ScheduleSlot(slot);
        this.slots.push(instance);
        this.slots.sort((a, b) => b.priority - a.priority);
        return instance;
    }

    /**
     * Removes a slot by its identifier.
     * @param {string} slotId - Identifier of slot to remove.
     * @returns {boolean} True if removed.
     */
    removeSlot(slotId) {
        const index = this.slots.findIndex(s => s.id === slotId);
        if (index >= 0) {
            this.slots.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Finds the matching slot for a given hour based on priority and time interval.
     * @param {number|string} hour - Game hour.
     * @returns {ScheduleSlot|null} Matching slot or null.
     */
    getSlotForHour(hour) {
        const h = parseHour(hour);
        for (const slot of this.slots) {
            if (slot.isActive(h)) {
                return slot;
            }
        }
        return null;
    }

    /**
     * Updates the NPC schedule to the given hour.
     * Handles slot transitions, danger suspension, and destination fallback.
     * @param {number|string|Object} time - Current game hour or clock.
     * @returns {string} Current activity.
     */
    update(time) {
        const previousHour = this.currentHour;
        const h = parseHour(time);
        this.currentHour = h;

        // If suspended by danger, remain in danger response and check for missed appointments
        if (this.inDanger) {
            this._checkMissedAppointments(previousHour, h);
            return this.currentActivity;
        }

        const nextSlot = this.getSlotForHour(h);
        const slotChanged = nextSlot !== this.currentSlot;

        if (slotChanged) {
            if (this.currentSlot && typeof this.currentSlot.onExit === "function") {
                this.currentSlot.onExit(this, this.currentSlot);
            }
            this._releaseClaimedPoint();

            const previousSlot = this.currentSlot;
            this.currentSlot = nextSlot;

            if (nextSlot) {
                this.currentActivity = nextSlot.activity;
                this._resolveAndClaimDestination(nextSlot);
                if (typeof nextSlot.onEnter === "function") {
                    nextSlot.onEnter(this, nextSlot);
                }
            } else {
                this.currentActivity = this.defaultActivity;
                this.currentDestination = null;
                this.destinationStatus = "none";
            }

            if (this.system && typeof this.system.emit === "function") {
                this.system.emit("transition", {
                    npcId: this.id,
                    previousSlot,
                    currentSlot: nextSlot,
                    hour: h
                });
            }
        } else if (this.currentSlot && (this.destinationStatus === "none" || this.destinationStatus === "all_occupied")) {
            // Re-attempt destination claiming if previously failed or all were occupied
            this._resolveAndClaimDestination(this.currentSlot);
        }

        return this.currentActivity;
    }

    /**
     * Suspends normal schedule execution in reaction to perceived danger.
     * @param {Object} [dangerData={}] - Details of the perceived threat.
     * @returns {NPCSchedule} This instance.
     */
    triggerDanger(dangerData = {}) {
        if (this.inDanger) {
            this.dangerData = { ...this.dangerData, ...dangerData };
            return this;
        }

        this.inDanger = true;
        this.dangerData = { ...dangerData };
        this.suspendedState = {
            slot: this.currentSlot,
            activity: this.currentActivity,
            destination: this.currentDestination,
            claimedPoint: this.claimedPoint,
            hour: this.currentHour
        };

        // Release claimed destination point so other actors can use it if needed
        if (dangerData.vacatePoint !== false) {
            this._releaseClaimedPoint();
        }

        this.currentActivity = dangerData.activity || ROUTINE_ACTIVITIES.FLEE;
        this.currentDestination = dangerData.destination || null;
        this.destinationStatus = "danger";

        if (this.system && typeof this.system.emit === "function") {
            this.system.emit("danger_interrupted", {
                npcId: this.id,
                dangerData,
                hour: this.currentHour
            });
        }
        return this;
    }

    /**
     * Resolves the danger condition and resumes scheduled activity.
     * Evaluates current hour and seamlessly picks up the appropriate schedule slot.
     * @param {Object} [options={}] - Resumption options.
     * @returns {string} Resumed activity.
     */
    resolveDanger(options = {}) {
        if (!this.inDanger) {
            return this.currentActivity;
        }

        this.inDanger = false;
        const dangerData = this.dangerData;
        this.dangerData = null;

        const effectiveHour = options.hour !== undefined ? parseHour(options.hour) : this.currentHour;
        this.currentHour = effectiveHour;

        const activeSlot = this.getSlotForHour(effectiveHour);
        this.currentSlot = activeSlot;

        if (activeSlot) {
            this.currentActivity = activeSlot.activity;
            this._resolveAndClaimDestination(activeSlot);
        } else {
            this.currentActivity = this.defaultActivity;
            this.currentDestination = null;
            this.destinationStatus = "none";
        }

        if (this.system && typeof this.system.emit === "function") {
            this.system.emit("danger_resolved", {
                npcId: this.id,
                resumedSlot: activeSlot,
                activity: this.currentActivity,
                hour: effectiveHour,
                dangerData
            });
        }
        return this.currentActivity;
    }

    /**
     * Resolves destination for a slot, falling back gracefully if points are occupied.
     * @private
     * @param {ScheduleSlot} slot - Active slot.
     */
    _resolveAndClaimDestination(slot) {
        if (!slot) return;

        const candidates = [];
        if (slot.destination) {
            candidates.push({ point: slot.destination, isPrimary: true });
        }
        if (Array.isArray(slot.fallbacks)) {
            for (const fb of slot.fallbacks) {
                if (fb) candidates.push({ point: fb, isPrimary: false });
            }
        }

        if (candidates.length === 0) {
            this.currentDestination = null;
            this.destinationStatus = "none";
            return;
        }

        for (const candidate of candidates) {
            const isOccupied = this._isPointOccupied(candidate.point);
            if (!isOccupied) {
                const claimed = this._claimPoint(candidate.point);
                if (claimed) {
                    this.currentDestination = candidate.point;
                    this.claimedPoint = candidate.point;
                    this.destinationStatus = candidate.isPrimary ? "primary" : "fallback";
                    this.currentActivity = slot.activity;
                    return;
                }
            }
        }

        // Graceful fallback when all candidate destination points are occupied
        this.currentDestination = null;
        this.claimedPoint = null;
        this.destinationStatus = "all_occupied";
        if (slot.fallbackActivity) {
            this.currentActivity = slot.fallbackActivity;
        }

        if (this.system && typeof this.system.emit === "function") {
            this.system.emit("occupied_fallback", {
                npcId: this.id,
                slot,
                status: "all_occupied",
                fallbackActivity: this.currentActivity
            });
        }
    }

    /**
     * Checks if a point is occupied, delegating to parent ScheduleSystem if present.
     * @private
     * @param {Object|string} point
     * @returns {boolean}
     */
    _isPointOccupied(point) {
        if (!point) return false;
        if (this.system && typeof this.system.isPointOccupied === "function") {
            return this.system.isPointOccupied(point, this.id);
        }
        if (typeof point === "object" && point.occupied === true) {
            return true;
        }
        return false;
    }

    /**
     * Claims a destination point, delegating to parent ScheduleSystem if present.
     * @private
     * @param {Object|string} point
     * @returns {boolean} True if successfully claimed.
     */
    _claimPoint(point) {
        if (!point) return false;
        if (this.system && typeof this.system.occupyPoint === "function") {
            return this.system.occupyPoint(point, this.id);
        }
        if (typeof point === "object") {
            point.occupied = true;
        }
        return true;
    }

    /**
     * Releases currently claimed destination point.
     * @private
     */
    _releaseClaimedPoint() {
        if (!this.claimedPoint) return;
        if (this.system && typeof this.system.vacatePoint === "function") {
            this.system.vacatePoint(this.claimedPoint, this.id);
        } else if (typeof this.claimedPoint === "object") {
            this.claimedPoint.occupied = false;
        }
        this.claimedPoint = null;
    }

    /**
     * Checks for any scheduled appointments that were missed between previous and current hour.
     * @private
     * @param {number} fromHour
     * @param {number} toHour
     */
    _checkMissedAppointments(fromHour, toHour) {
        for (const slot of this.slots) {
            if (slot.isAppointment) {
                // Check if appointment start time fell between fromHour and toHour
                if (isHourInSlot(slot.start, fromHour, toHour)) {
                    const alreadyRecorded = this.missedAppointments.some(m => m.slot.id === slot.id && m.hour === slot.start);
                    if (!alreadyRecorded) {
                        const record = {
                            slot,
                            hour: slot.start,
                            reason: this.inDanger ? "danger" : "interrupted",
                            timestamp: Date.now()
                        };
                        this.missedAppointments.push(record);
                        if (this.system && typeof this.system.emit === "function") {
                            this.system.emit("missed_appointment", {
                                npcId: this.id,
                                ...record
                            });
                        }
                    }
                }
            }
        }
    }
}

/**
 * Manages 24-hour schedules, activity points, occupancy reservations,
 * danger interruptions, and multi-NPC routines.
 */
export class ScheduleSystem {
    /**
     * @param {Object} [config={}] - System configuration.
     * @param {Object} [config.clock=null] - Optional GameClock instance.
     * @param {Array} [config.slots=null] - Initial slots for default single-NPC routine.
     * @param {string} [config.defaultActivity="idle"] - Default fallback activity.
     * @param {number|string} [config.initialHour=0] - Initial game hour.
     */
    constructor(config = {}) {
        this.clock = config.clock || null;
        this.defaultActivity = config.defaultActivity || ROUTINE_ACTIVITIES.IDLE;
        this.currentHour = config.initialHour !== undefined ? parseHour(config.initialHour) : 0;
        this.schedules = new Map();
        this._occupiedPoints = new Map();
        this._listeners = new Map();

        if (Array.isArray(config.slots) && config.slots.length > 0) {
            this.registerNPC("default", {
                slots: config.slots,
                defaultActivity: this.defaultActivity,
                initialHour: this.currentHour
            });
        }
    }

    /**
     * Subscribes a listener to a system event.
     * @param {string} event - Event name.
     * @param {Function} callback - Callback function.
     * @returns {ScheduleSystem} This instance.
     */
    on(event, callback) {
        if (typeof callback !== "function") return this;
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        return this;
    }

    /**
     * Unsubscribes a listener from a system event.
     * @param {string} event - Event name.
     * @param {Function} callback - Callback function.
     * @returns {ScheduleSystem} This instance.
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
        return this;
    }

    /**
     * Emits a system event to registered listeners.
     * @param {string} event - Event name.
     * @param {Object} data - Payload data.
     */
    emit(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            for (const cb of listeners) {
                try {
                    cb(data);
                } catch (err) {
                    console.error(`Error in ScheduleSystem event listener (${event}):`, err);
                }
            }
        }
    }

    /**
     * Registers an NPC routine with the schedule system.
     * @param {string} npcId - Unique identifier for the NPC.
     * @param {Object|Array|NPCSchedule} config - Schedule configuration or slots array.
     * @returns {NPCSchedule} Registered schedule.
     */
    registerNPC(npcId, config = {}) {
        if (!npcId || typeof npcId !== "string") {
            throw new TypeError("registerNPC requires a non-empty string npcId");
        }

        let schedule;
        if (config instanceof NPCSchedule) {
            schedule = config;
            schedule.id = npcId;
            schedule.system = this;
        } else if (Array.isArray(config)) {
            schedule = new NPCSchedule({
                id: npcId,
                slots: config,
                defaultActivity: this.defaultActivity,
                initialHour: this.currentHour,
                system: this
            });
        } else {
            const initialHour = config.initialHour !== undefined ? parseHour(config.initialHour) : this.currentHour;
            schedule = new NPCSchedule({
                id: npcId,
                defaultActivity: this.defaultActivity,
                system: this,
                ...config,
                initialHour
            });
        }

        this.schedules.set(npcId, schedule);
        schedule.update(schedule.currentHour);
        return schedule;
    }

    /**
     * Unregisters an NPC routine and frees its claimed points.
     * @param {string} npcId - NPC identifier.
     * @returns {boolean} True if removed.
     */
    unregisterNPC(npcId) {
        this.vacateAllForNPC(npcId);
        return this.schedules.delete(npcId);
    }

    /**
     * Gets the schedule instance for an NPC.
     * @param {string} [npcId="default"] - NPC identifier.
     * @returns {NPCSchedule|null}
     */
    getSchedule(npcId = "default") {
        return this.schedules.get(npcId) || null;
    }

    /**
     * Adds a schedule slot to the default or specified NPC routine.
     * @param {Object|ScheduleSlot} slot - Slot configuration.
     * @param {string} [npcId="default"] - Target NPC identifier.
     * @returns {ScheduleSlot}
     */
    addSlot(slot, npcId = "default") {
        let schedule = this.getSchedule(npcId);
        if (!schedule) {
            schedule = this.registerNPC(npcId);
        }
        return schedule.addSlot(slot);
    }

    /**
     * Updates time across all registered NPC schedules.
     * Accepts a game hour float, time string, or GameClock instance.
     * @param {number|string|Object} [timeOrClock] - New time value or clock.
     * @returns {number} Current hour after update.
     */
    update(timeOrClock) {
        let hour = this.currentHour;
        if (timeOrClock !== undefined && timeOrClock !== null) {
            hour = parseHour(timeOrClock);
        } else if (this.clock) {
            hour = parseHour(this.clock);
        }

        this.currentHour = hour;
        for (const schedule of this.schedules.values()) {
            schedule.update(hour);
        }
        return this.currentHour;
    }

    /**
     * Advances time by the given amount and updates all schedules.
     * @param {number} delta - Amount of time to advance.
     * @param {string} [unit="hours"] - "hours" or "minutes".
     * @returns {number} New current hour.
     */
    advance(delta, unit = "hours") {
        if (!Number.isFinite(delta)) {
            throw new TypeError("Advance delta must be a finite number");
        }
        const deltaHours = unit === "minutes" ? delta / 60 : delta;
        return this.update(this.currentHour + deltaHours);
    }

    /**
     * Gets the current activity of an NPC.
     * @param {string} [npcId="default"] - NPC identifier.
     * @returns {string}
     */
    getActivity(npcId = "default") {
        const schedule = this.getSchedule(npcId);
        return schedule ? schedule.currentActivity : this.defaultActivity;
    }

    /**
     * Gets the active schedule slot for an NPC.
     * @param {string} [npcId="default"] - NPC identifier.
     * @returns {ScheduleSlot|null}
     */
    getCurrentSlot(npcId = "default") {
        const schedule = this.getSchedule(npcId);
        return schedule ? schedule.currentSlot : null;
    }

    /**
     * Gets the current destination point for an NPC.
     * @param {string} [npcId="default"] - NPC identifier.
     * @returns {Object|string|null}
     */
    getCurrentDestination(npcId = "default") {
        const schedule = this.getSchedule(npcId);
        return schedule ? schedule.currentDestination : null;
    }

    /**
     * Checks whether an NPC schedule is currently suspended by danger.
     * @param {string} [npcId="default"] - NPC identifier.
     * @returns {boolean}
     */
    isSuspended(npcId = "default") {
        const schedule = this.getSchedule(npcId);
        return schedule ? schedule.isSuspended : false;
    }

    /**
     * Alias for isSuspended.
     * @param {string} [npcId="default"] - NPC identifier.
     * @returns {boolean}
     */
    isInDanger(npcId = "default") {
        return this.isSuspended(npcId);
    }

    /**
     * Suspends an NPC's schedule with a danger reaction.
     * @param {string|Object} npcIdOrDanger - NPC identifier or danger data for default NPC.
     * @param {Object} [maybeDanger={}] - Danger configuration if npcId was provided.
     * @returns {boolean} True if danger was triggered.
     */
    triggerDanger(npcIdOrDanger, maybeDanger = {}) {
        let npcId = "default";
        let dangerData = maybeDanger;

        if (typeof npcIdOrDanger === "string") {
            npcId = npcIdOrDanger;
        } else if (npcIdOrDanger && typeof npcIdOrDanger === "object") {
            dangerData = npcIdOrDanger;
        }

        const schedule = this.getSchedule(npcId);
        if (schedule) {
            schedule.triggerDanger(dangerData);
            return true;
        }
        return false;
    }

    /**
     * Resolves danger reaction for an NPC, resuming normal schedule routine.
     * @param {string} [npcId="default"] - NPC identifier.
     * @param {Object} [options={}] - Options passed to resolveDanger.
     * @returns {string} Resumed activity.
     */
    resolveDanger(npcId = "default", options = {}) {
        const schedule = this.getSchedule(npcId);
        if (schedule) {
            return schedule.resolveDanger(options);
        }
        return this.defaultActivity;
    }

    /**
     * Evaluates a perceived target against a FactionRegistry and interrupts schedule if hostile.
     * @param {string} npcId - Observing NPC identifier.
     * @param {Object} target - Perceived target entity.
     * @param {FactionRegistry} factionRegistry - Faction registry to query.
     * @param {Object} [dangerOverrides={}] - Optional danger settings.
     * @returns {boolean} True if hostile danger reaction was triggered.
     */
    perceiveDanger(npcId, target, factionRegistry, dangerOverrides = {}) {
        const schedule = this.getSchedule(npcId);
        if (!schedule || !target || !factionRegistry) return false;

        const observerFaction = schedule.faction;
        const targetFaction = FactionRegistry.resolveFaction(target);

        if (factionRegistry.isHostile(observerFaction, targetFaction)) {
            schedule.triggerDanger({
                threat: target,
                activity: ROUTINE_ACTIVITIES.COMBAT,
                ...dangerOverrides
            });
            return true;
        }
        return false;
    }

    /**
     * Gets missed appointments recorded for an NPC.
     * @param {string} [npcId="default"] - NPC identifier.
     * @returns {Array} List of missed appointment records.
     */
    getMissedAppointments(npcId = "default") {
        const schedule = this.getSchedule(npcId);
        return schedule ? [...schedule.missedAppointments] : [];
    }

    /**
     * Clears missed appointment history for an NPC.
     * @param {string} [npcId="default"] - NPC identifier.
     */
    clearMissedAppointments(npcId = "default") {
        const schedule = this.getSchedule(npcId);
        if (schedule) {
            schedule.missedAppointments.length = 0;
        }
    }

    /**
     * Checks if an activity point is currently occupied.
     * @param {Object|string} point - Activity point to check.
     * @param {string} [excludingNpcId] - Optional NPC identifier to ignore (e.g. self).
     * @returns {boolean} True if occupied.
     */
    isPointOccupied(point, excludingNpcId) {
        if (!point) return false;
        if (typeof point === "object" && point.occupied === true && !this._occupiedPoints.has(getPointKey(point))) {
            return true;
        }
        const key = getPointKey(point);
        if (!key) return false;
        const record = this._occupiedPoints.get(key);
        if (!record) return false;
        if (excludingNpcId && record.npcId === excludingNpcId) {
            return false;
        }
        return true;
    }

    /**
     * Claims an activity point for an NPC.
     * @param {Object|string} point - Activity point to claim.
     * @param {string} npcId - Claiming NPC identifier.
     * @returns {boolean} True if successfully claimed.
     */
    occupyPoint(point, npcId) {
        if (!point) return false;
        const key = getPointKey(point);
        if (!key) return false;

        const existing = this._occupiedPoints.get(key);
        if (existing && existing.npcId !== npcId) {
            return false;
        }

        this._occupiedPoints.set(key, { npcId, point });
        if (typeof point === "object") {
            point.occupied = true;
        }
        return true;
    }

    /**
     * Vacates a claimed activity point.
     * @param {Object|string} point - Point to vacate.
     * @param {string} [npcId] - Optional NPC identifier to ensure ownership.
     * @returns {boolean} True if vacated.
     */
    vacatePoint(point, npcId) {
        if (!point) return false;
        const key = getPointKey(point);
        if (!key) return false;

        const existing = this._occupiedPoints.get(key);
        if (!existing) return false;
        if (npcId && existing.npcId !== npcId) {
            return false;
        }

        this._occupiedPoints.delete(key);
        if (typeof existing.point === "object") {
            existing.point.occupied = false;
        }
        if (typeof point === "object") {
            point.occupied = false;
        }
        return true;
    }

    /**
     * Vacates all activity points claimed by an NPC.
     * @param {string} npcId - NPC identifier.
     */
    vacateAllForNPC(npcId) {
        for (const [key, record] of Array.from(this._occupiedPoints.entries())) {
            if (record.npcId === npcId) {
                this._occupiedPoints.delete(key);
                if (typeof record.point === "object") {
                    record.point.occupied = false;
                }
            }
        }
    }

    /**
     * Gets the identifier of the NPC occupying a point.
     * @param {Object|string} point - Activity point.
     * @returns {string|null} Occupant NPC identifier or null.
     */
    getOccupant(point) {
        const key = getPointKey(point);
        if (!key) return null;
        const record = this._occupiedPoints.get(key);
        return record ? record.npcId : null;
    }
}

/**
 * Faction registry managing bidirectional and asymmetric faction standings,
 * numerical reputations, and disposition queries (friendly, neutral, hostile).
 */
export class FactionRegistry {
    /**
     * @param {Object} [config={}] - Registry configuration.
     * @param {string} [config.defaultDisposition="neutral"] - Disposition when no relation exists.
     * @param {number} [config.defaultReputation=0] - Default numerical reputation.
     * @param {number} [config.hostileThreshold=-25] - Reputation at or below which disposition is hostile.
     * @param {number} [config.friendlyThreshold=25] - Reputation at or above which disposition is friendly.
     * @param {Array} [config.factions=[]] - Initial faction names to register.
     */
    constructor(config = {}) {
        this.defaultDisposition = config.defaultDisposition || FACTION_DISPOSITION.NEUTRAL;
        this.defaultReputation = Number.isFinite(config.defaultReputation) ? config.defaultReputation : 0;
        this.hostileThreshold = Number.isFinite(config.hostileThreshold) ? config.hostileThreshold : -25;
        this.friendlyThreshold = Number.isFinite(config.friendlyThreshold) ? config.friendlyThreshold : 25;
        this._reputations = new Map();
        this._dispositions = new Map();
        this._factions = new Set();

        if (Array.isArray(config.factions)) {
            for (const f of config.factions) {
                this.registerFaction(f);
            }
        }
    }

    /**
     * Resolves a faction name from a string, entity, or combatant.
     * @param {Object|string} target - Entity, combatant, or faction string.
     * @returns {string} Faction name.
     */
    static resolveFaction(target) {
        if (!target) return "neutral";
        if (typeof target === "string") return target.trim();
        if (typeof target.faction === "string" && target.faction.trim()) {
            return target.faction.trim();
        }
        if (typeof target.GetComponent === "function") {
            const combatant = target.GetComponent("Combatant");
            if (combatant && typeof combatant.faction === "string" && combatant.faction.trim()) {
                return combatant.faction.trim();
            }
        }
        return "neutral";
    }

    /**
     * Registers a faction name into the registry.
     * @param {string} name - Faction name.
     * @returns {FactionRegistry} This instance.
     */
    registerFaction(name) {
        const faction = FactionRegistry.resolveFaction(name);
        if (faction) {
            this._factions.add(faction);
        }
        return this;
    }

    /**
     * Checks if a faction is registered.
     * @param {string} name - Faction name.
     * @returns {boolean}
     */
    hasFaction(name) {
        const faction = FactionRegistry.resolveFaction(name);
        return this._factions.has(faction);
    }

    /**
     * Returns all registered faction names.
     * @returns {Array} List of faction names.
     */
    getFactions() {
        return Array.from(this._factions);
    }

    /**
     * Sets numerical reputation from source towards target.
     * Supports asymmetric (default) or bidirectional updates.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @param {number} value - Numerical reputation value.
     * @param {Object} [options={}] - Options object.
     * @param {boolean} [options.bidirectional=false] - Whether to set target->source as well.
     * @param {boolean} [options.keepOverride=false] - Whether to keep explicit disposition overrides.
     * @returns {FactionRegistry} This instance.
     */
    setReputation(source, target, value, options = {}) {
        if (!Number.isFinite(value)) {
            throw new TypeError("Reputation value must be a finite number");
        }
        const src = FactionRegistry.resolveFaction(source);
        const tgt = FactionRegistry.resolveFaction(target);
        this.registerFaction(src);
        this.registerFaction(tgt);

        const key = `${src}->${tgt}`;
        this._reputations.set(key, value);
        if (!options.keepOverride) {
            this._dispositions.delete(key);
        }

        if (options.bidirectional || options.symmetric) {
            const revKey = `${tgt}->${src}`;
            this._reputations.set(revKey, value);
            if (!options.keepOverride) {
                this._dispositions.delete(revKey);
            }
        }
        return this;
    }

    /**
     * Modifies numerical reputation between source and target by delta.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @param {number} delta - Amount to adjust reputation by.
     * @param {Object} [options={}] - Options object.
     * @param {boolean} [options.bidirectional=false] - Whether to adjust target->source as well.
     * @returns {number} New reputation score.
     */
    modifyReputation(source, target, delta, options = {}) {
        if (!Number.isFinite(delta)) {
            throw new TypeError("Reputation delta must be a finite number");
        }
        const current = this.getReputation(source, target);
        const next = current + delta;
        this.setReputation(source, target, next, options);
        return next;
    }

    /**
     * Gets the numerical reputation of source faction towards target.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @returns {number} Numerical reputation.
     */
    getReputation(source, target) {
        const src = FactionRegistry.resolveFaction(source);
        const tgt = FactionRegistry.resolveFaction(target);
        const key = `${src}->${tgt}`;

        if (this._reputations.has(key)) {
            return this._reputations.get(key);
        }
        if (src === tgt) {
            return 100;
        }
        return this.defaultReputation;
    }

    /**
     * Sets an explicit disposition override from source towards target.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @param {string} disposition - "friendly", "neutral", or "hostile".
     * @param {Object} [options={}] - Options object.
     * @param {boolean} [options.bidirectional=false] - Whether to set target->source as well.
     * @param {boolean} [options.setReputation=true] - Whether to synchronize numerical reputation baseline.
     * @returns {FactionRegistry} This instance.
     */
    setDisposition(source, target, disposition, options = {}) {
        const valid = Object.values(FACTION_DISPOSITION);
        if (!valid.includes(disposition)) {
            throw new TypeError(`Disposition must be one of: ${valid.join(", ")}`);
        }
        const src = FactionRegistry.resolveFaction(source);
        const tgt = FactionRegistry.resolveFaction(target);
        this.registerFaction(src);
        this.registerFaction(tgt);

        const key = `${src}->${tgt}`;
        this._dispositions.set(key, disposition);

        if (options.setReputation !== false) {
            let repVal = 0;
            if (disposition === FACTION_DISPOSITION.HOSTILE) repVal = this.hostileThreshold;
            else if (disposition === FACTION_DISPOSITION.FRIENDLY) repVal = this.friendlyThreshold;
            this._reputations.set(key, repVal);
        }

        if (options.bidirectional || options.symmetric) {
            const revKey = `${tgt}->${src}`;
            this._dispositions.set(revKey, disposition);
            if (options.setReputation !== false) {
                let repVal = 0;
                if (disposition === FACTION_DISPOSITION.HOSTILE) repVal = this.hostileThreshold;
                else if (disposition === FACTION_DISPOSITION.FRIENDLY) repVal = this.friendlyThreshold;
                this._reputations.set(revKey, repVal);
            }
        }
        return this;
    }

    /**
     * Gets the disposition of source towards target ("friendly", "neutral", or "hostile").
     * Respects explicit disposition overrides and derives from reputation thresholds.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @returns {string} Disposition string.
     */
    getDisposition(source, target) {
        const src = FactionRegistry.resolveFaction(source);
        const tgt = FactionRegistry.resolveFaction(target);
        const key = `${src}->${tgt}`;

        if (this._dispositions.has(key)) {
            return this._dispositions.get(key);
        }
        if (src === tgt) {
            return FACTION_DISPOSITION.FRIENDLY;
        }

        const rep = this.getReputation(src, tgt);
        if (rep <= this.hostileThreshold) {
            return FACTION_DISPOSITION.HOSTILE;
        }
        if (rep >= this.friendlyThreshold) {
            return FACTION_DISPOSITION.FRIENDLY;
        }
        return this.defaultDisposition;
    }

    /**
     * Checks if source faction considers target hostile.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @returns {boolean} True if hostile.
     */
    isHostile(source, target) {
        return this.getDisposition(source, target) === FACTION_DISPOSITION.HOSTILE;
    }

    /**
     * Checks if source faction considers target friendly.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @returns {boolean} True if friendly.
     */
    isFriendly(source, target) {
        return this.getDisposition(source, target) === FACTION_DISPOSITION.FRIENDLY;
    }

    /**
     * Checks if source faction considers target neutral.
     * @param {Object|string} source - Source faction or entity.
     * @param {Object|string} target - Target faction or entity.
     * @returns {boolean} True if neutral.
     */
    isNeutral(source, target) {
        return this.getDisposition(source, target) === FACTION_DISPOSITION.NEUTRAL;
    }

    /**
     * Clears all recorded standings and registrations.
     */
    clear() {
        this._reputations.clear();
        this._dispositions.clear();
        this._factions.clear();
    }

    /**
     * Serializes faction standings into a plain JSON-compatible object.
     * @returns {Object}
     */
    serialize() {
        return {
            defaultDisposition: this.defaultDisposition,
            defaultReputation: this.defaultReputation,
            hostileThreshold: this.hostileThreshold,
            friendlyThreshold: this.friendlyThreshold,
            factions: Array.from(this._factions),
            reputations: Object.fromEntries(this._reputations),
            dispositions: Object.fromEntries(this._dispositions)
        };
    }

    /**
     * Restores faction standings from serialized data.
     * @param {Object} data - Serialized state object.
     * @returns {FactionRegistry} This instance.
     */
    restore(data) {
        if (!data || typeof data !== "object") return this;
        if (data.defaultDisposition) this.defaultDisposition = data.defaultDisposition;
        if (Number.isFinite(data.defaultReputation)) this.defaultReputation = data.defaultReputation;
        if (Number.isFinite(data.hostileThreshold)) this.hostileThreshold = data.hostileThreshold;
        if (Number.isFinite(data.friendlyThreshold)) this.friendlyThreshold = data.friendlyThreshold;
        if (Array.isArray(data.factions)) {
            for (const f of data.factions) this.registerFaction(f);
        }
        if (data.reputations && typeof data.reputations === "object") {
            for (const [k, v] of Object.entries(data.reputations)) {
                this._reputations.set(k, v);
            }
        }
        if (data.dispositions && typeof data.dispositions === "object") {
            for (const [k, v] of Object.entries(data.dispositions)) {
                this._dispositions.set(k, v);
            }
        }
        return this;
    }

    /**
     * Creates and deserializes a new FactionRegistry instance.
     * @param {Object} data - Serialized data.
     * @returns {FactionRegistry}
     */
    static deserialize(data) {
        const reg = new FactionRegistry(data);
        reg.restore(data);
        return reg;
    }
}
