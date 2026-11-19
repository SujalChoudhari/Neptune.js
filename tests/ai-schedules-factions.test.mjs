import './setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    ScheduleSystem,
    FactionRegistry,
    NPCSchedule,
    ScheduleSlot,
    ROUTINE_ACTIVITIES,
    FACTION_DISPOSITION,
    parseHour,
    isHourInSlot,
    getPointKey
} from '../src/larissa/npcSchedules.js';

import {
    ScheduleSystem as LarissaScheduleSystem,
    FactionRegistry as LarissaFactionRegistry,
    NPCSchedule as LarissaNPCSchedule,
    ScheduleSlot as LarissaScheduleSlot,
    ROUTINE_ACTIVITIES as LarissaActivities,
    FACTION_DISPOSITION as LarissaDispositions
} from '../src/larissa/index.js';

import {
    Larissa,
    ScheduleSystem as NeptuneScheduleSystem,
    FactionRegistry as NeptuneFactionRegistry,
    NPCSchedule as NeptuneNPCSchedule,
    ScheduleSlot as NeptuneScheduleSlot,
    ROUTINE_ACTIVITIES as NeptuneActivities,
    FACTION_DISPOSITION as NeptuneDispositions,
    ComponentRegistry,
    GameClock
} from '../src/neptune.js';

test('Exports: ScheduleSystem and FactionRegistry are exported across all entrypoints', () => {
    assert.equal(typeof ScheduleSystem, 'function');
    assert.equal(typeof FactionRegistry, 'function');
    assert.equal(typeof NPCSchedule, 'function');
    assert.equal(typeof ScheduleSlot, 'function');

    // Larissa re-exports
    assert.equal(LarissaScheduleSystem, ScheduleSystem);
    assert.equal(LarissaFactionRegistry, FactionRegistry);
    assert.equal(LarissaNPCSchedule, NPCSchedule);
    assert.equal(LarissaScheduleSlot, ScheduleSlot);
    assert.equal(LarissaActivities, ROUTINE_ACTIVITIES);
    assert.equal(LarissaDispositions, FACTION_DISPOSITION);

    // Neptune top-level re-exports
    assert.equal(NeptuneScheduleSystem, ScheduleSystem);
    assert.equal(NeptuneFactionRegistry, FactionRegistry);
    assert.equal(NeptuneNPCSchedule, NPCSchedule);
    assert.equal(NeptuneScheduleSlot, ScheduleSlot);
    assert.equal(NeptuneActivities, ROUTINE_ACTIVITIES);
    assert.equal(NeptuneDispositions, FACTION_DISPOSITION);

    // Neptune.Larissa namespace
    assert.equal(Larissa.ScheduleSystem, ScheduleSystem);
    assert.equal(Larissa.FactionRegistry, FactionRegistry);
    assert.equal(Larissa.NPCSchedule, NPCSchedule);
    assert.equal(Larissa.ScheduleSlot, ScheduleSlot);

    // ComponentRegistry
    assert.ok(ComponentRegistry.has('NPCSchedule'));
});

test('ScheduleSystem: transitions based on game hour across 24h routine', () => {
    const system = new ScheduleSystem();

    const transitions = [];
    system.on('transition', (data) => {
        transitions.push(data);
    });

    const guardRoutine = [
        { start: 6, end: 9, activity: ROUTINE_ACTIVITIES.REST, destination: 'barracks_canteen' },
        { start: 9, end: 17, activity: ROUTINE_ACTIVITIES.WORK, destination: 'armory_workshop' },
        { start: 17, end: 22, activity: ROUTINE_ACTIVITIES.PATROL, destination: 'town_wall' },
        { start: 22, end: 6, activity: ROUTINE_ACTIVITIES.SLEEP, destination: 'barracks_bed' }
    ];

    system.registerNPC('guard_alden', { slots: guardRoutine });

    // 07:00 -> REST
    system.update(7);
    assert.equal(system.getActivity('guard_alden'), ROUTINE_ACTIVITIES.REST);
    assert.equal(system.getCurrentDestination('guard_alden'), 'barracks_canteen');

    // 12:30 -> WORK
    system.update('12:30');
    assert.equal(system.getActivity('guard_alden'), ROUTINE_ACTIVITIES.WORK);
    assert.equal(system.getCurrentDestination('guard_alden'), 'armory_workshop');

    // 19:45 -> PATROL
    system.update('19:45');
    assert.equal(system.getActivity('guard_alden'), ROUTINE_ACTIVITIES.PATROL);
    assert.equal(system.getCurrentDestination('guard_alden'), 'town_wall');

    // 23:15 -> SLEEP
    system.update('23:15');
    assert.equal(system.getActivity('guard_alden'), ROUTINE_ACTIVITIES.SLEEP);
    assert.equal(system.getCurrentDestination('guard_alden'), 'barracks_bed');

    // Verify transitions were captured
    assert.ok(transitions.length >= 3);
    assert.equal(transitions[transitions.length - 1].currentSlot.activity, ROUTINE_ACTIVITIES.SLEEP);
});

test('ScheduleSystem: midnight wraparound schedule slots (e.g. 22:00 to 06:00)', () => {
    const sleepSlot = new ScheduleSlot({
        start: 22,
        end: 6,
        activity: ROUTINE_ACTIVITIES.SLEEP,
        destination: { id: 'inn_bed_4', x: 120, y: 80 }
    });

    assert.equal(sleepSlot.wrapsMidnight, true);
    assert.equal(sleepSlot.duration, 8);

    // Before slot start
    assert.equal(sleepSlot.isActive(21.9), false);
    assert.equal(sleepSlot.isActive('21:59'), false);

    // Active hours before midnight
    assert.equal(sleepSlot.isActive(22.0), true);
    assert.equal(sleepSlot.isActive('22:00'), true);
    assert.equal(sleepSlot.isActive(23.5), true);
    assert.equal(sleepSlot.isActive('23:59'), true);

    // Active hours at and after midnight
    assert.equal(sleepSlot.isActive(0.0), true);
    assert.equal(sleepSlot.isActive('00:00'), true);
    assert.equal(sleepSlot.isActive(2.5), true);
    assert.equal(sleepSlot.isActive(5.99), true);
    assert.equal(sleepSlot.isActive('05:59'), true);

    // Inactive at and after end time
    assert.equal(sleepSlot.isActive(6.0), false);
    assert.equal(sleepSlot.isActive('06:00'), false);
    assert.equal(sleepSlot.isActive(12.0), false);

    // Complete routine with midnight wraparound in a ScheduleSystem
    const schedule = new ScheduleSystem({
        slots: [
            { start: '06:00', end: '14:00', activity: ROUTINE_ACTIVITIES.WORK },
            { start: '14:00', end: '22:00', activity: ROUTINE_ACTIVITIES.PATROL },
            { start: '22:00', end: '06:00', activity: ROUTINE_ACTIVITIES.SLEEP }
        ]
    });

    schedule.update(23);
    assert.equal(schedule.getActivity(), ROUTINE_ACTIVITIES.SLEEP);

    schedule.update(1);
    assert.equal(schedule.getActivity(), ROUTINE_ACTIVITIES.SLEEP);

    schedule.update(5.5);
    assert.equal(schedule.getActivity(), ROUTINE_ACTIVITIES.SLEEP);

    schedule.update(6);
    assert.equal(schedule.getActivity(), ROUTINE_ACTIVITIES.WORK);

    schedule.update(15);
    assert.equal(schedule.getActivity(), ROUTINE_ACTIVITIES.PATROL);
});

test('ScheduleSystem: danger reaction interruption and resumption', () => {
    const system = new ScheduleSystem();

    const slots = [
        { start: 8, end: 16, activity: ROUTINE_ACTIVITIES.WORK, destination: 'blacksmith_forge' },
        { start: 16, end: 20, activity: ROUTINE_ACTIVITIES.REST, destination: 'tavern' },
        { start: 20, end: 8, activity: ROUTINE_ACTIVITIES.SLEEP, destination: 'cottage_bed' }
    ];

    const smith = system.registerNPC('smith_borin', { slots, initialHour: 10 });
    assert.equal(system.getActivity('smith_borin'), ROUTINE_ACTIVITIES.WORK);
    assert.equal(system.isInDanger('smith_borin'), false);

    // 1. Threat appears at 11:00 -> Danger reaction interrupts schedule
    system.update(11);
    const interrupted = system.triggerDanger('smith_borin', {
        activity: ROUTINE_ACTIVITIES.FLEE,
        threat: { id: 'dragon_1', type: 'dragon' },
        destination: 'bunker'
    });
    assert.equal(interrupted, true);
    assert.equal(system.isInDanger('smith_borin'), true);
    assert.equal(system.isSuspended('smith_borin'), true);
    assert.equal(system.getActivity('smith_borin'), ROUTINE_ACTIVITIES.FLEE);
    assert.equal(system.getCurrentDestination('smith_borin'), 'bunker');

    // 2. While suspended, time advances to 13:00 (still within work slot)
    system.update(13);
    // Schedule remains suspended in danger reaction
    assert.equal(system.getActivity('smith_borin'), ROUTINE_ACTIVITIES.FLEE);
    assert.equal(system.isInDanger('smith_borin'), true);

    // 3. Danger is resolved at 14:00 (still within work slot)
    system.update(14);
    const resumedActivity = system.resolveDanger('smith_borin');
    assert.equal(system.isInDanger('smith_borin'), false);
    assert.equal(resumedActivity, ROUTINE_ACTIVITIES.WORK);
    assert.equal(system.getActivity('smith_borin'), ROUTINE_ACTIVITIES.WORK);
    assert.equal(system.getCurrentDestination('smith_borin'), 'blacksmith_forge');

    // 4. Test danger interruption that spans across slot boundary:
    // Interrupt at 15:00 (during WORK), resolve at 17:00 (during REST)
    system.update(15);
    system.triggerDanger('smith_borin', { activity: ROUTINE_ACTIVITIES.COMBAT });
    assert.equal(system.getActivity('smith_borin'), ROUTINE_ACTIVITIES.COMBAT);

    system.update(17);
    assert.equal(system.getActivity('smith_borin'), ROUTINE_ACTIVITIES.COMBAT);

    // When danger resolves at 17:00, it resumes the scheduled activity for 17:00 (REST at tavern)
    system.resolveDanger('smith_borin');
    assert.equal(system.getActivity('smith_borin'), ROUTINE_ACTIVITIES.REST);
    assert.equal(system.getCurrentDestination('smith_borin'), 'tavern');
});

test('ScheduleSystem: missed appointments during danger interruption', () => {
    const system = new ScheduleSystem();

    const slots = [
        { start: 8, end: 12, activity: ROUTINE_ACTIVITIES.WORK },
        { start: 12, end: 13, activity: 'meeting', isAppointment: true, destination: 'town_hall' },
        { start: 13, end: 17, activity: ROUTINE_ACTIVITIES.WORK },
        { start: 17, end: 24, activity: ROUTINE_ACTIVITIES.REST }
    ];

    system.registerNPC('clerk', { slots, initialHour: 10 });

    // Danger triggers before appointment at 11:00
    system.triggerDanger('clerk', { activity: ROUTINE_ACTIVITIES.FLEE });

    // Time advances past the 12:00 meeting to 14:00
    system.update(14);

    const missed = system.getMissedAppointments('clerk');
    assert.equal(missed.length, 1);
    assert.equal(missed[0].slot.activity, 'meeting');
    assert.equal(missed[0].reason, 'danger');

    // Resuming at 14:00 returns to afternoon WORK
    system.resolveDanger('clerk');
    assert.equal(system.getActivity('clerk'), ROUTINE_ACTIVITIES.WORK);
});

test('ScheduleSystem: occupied destination point fallback', () => {
    const system = new ScheduleSystem();

    const primaryForge = { id: 'forge_station_1', x: 50, y: 50 };
    const fallbackForge = { id: 'forge_station_2', x: 60, y: 50 };
    const fallbackBench = { id: 'work_bench', x: 70, y: 50 };

    const sharedWorkSlot = {
        start: 8,
        end: 17,
        activity: ROUTINE_ACTIVITIES.WORK,
        destination: primaryForge,
        fallbacks: [fallbackForge, fallbackBench],
        fallbackActivity: ROUTINE_ACTIVITIES.WANDER
    };

    // NPC 1 registers and claims primary point
    const npc1 = system.registerNPC('apprentice_1', { slots: [sharedWorkSlot], initialHour: 9 });
    assert.equal(system.getCurrentDestination('apprentice_1'), primaryForge);
    assert.equal(system.isPointOccupied(primaryForge), true);
    assert.equal(system.getOccupant(primaryForge), 'apprentice_1');

    // NPC 2 registers with the same routine: primary is occupied, so it claims fallback 1
    const npc2 = system.registerNPC('apprentice_2', { slots: [sharedWorkSlot], initialHour: 9 });
    assert.equal(system.getCurrentDestination('apprentice_2'), fallbackForge);
    assert.equal(system.isPointOccupied(fallbackForge), true);
    assert.equal(system.getOccupant(fallbackForge), 'apprentice_2');

    // NPC 3 registers: primary and fallback 1 are occupied, so it claims fallback 2 (bench)
    const npc3 = system.registerNPC('apprentice_3', { slots: [sharedWorkSlot], initialHour: 9 });
    assert.equal(system.getCurrentDestination('apprentice_3'), fallbackBench);
    assert.equal(system.isPointOccupied(fallbackBench), true);
    assert.equal(system.getOccupant(fallbackBench), 'apprentice_3');

    // NPC 4 registers: ALL points are occupied! Gracefully falls back to fallbackActivity ("wander")
    const npc4 = system.registerNPC('apprentice_4', { slots: [sharedWorkSlot], initialHour: 9 });
    assert.equal(system.getCurrentDestination('apprentice_4'), null);
    assert.equal(system.getActivity('apprentice_4'), ROUTINE_ACTIVITIES.WANDER);
    assert.equal(npc4.destinationStatus, 'all_occupied');

    // When NPC 1 vacates the primary forge (e.g. shifts activity or unregisters)
    system.vacatePoint(primaryForge, 'apprentice_1');
    assert.equal(system.isPointOccupied(primaryForge), false);

    // NPC 4 re-updates and now claims the freed primary forge!
    npc4.destinationStatus = 'none'; // reset status to allow re-eval
    system.update(10);
    assert.equal(system.getCurrentDestination('apprentice_4'), primaryForge);
    assert.equal(system.getActivity('apprentice_4'), ROUTINE_ACTIVITIES.WORK);
});

test('FactionRegistry: bidirectional and asymmetric standings', () => {
    const registry = new FactionRegistry();

    // 1. Same-faction standing is friendly by default
    assert.equal(registry.getDisposition('citizens', 'citizens'), FACTION_DISPOSITION.FRIENDLY);
    assert.equal(registry.isFriendly('citizens', 'citizens'), true);
    assert.equal(registry.isHostile('citizens', 'citizens'), false);

    // 2. Unconfigured factions are neutral by default
    assert.equal(registry.getDisposition('guards', 'citizens'), FACTION_DISPOSITION.NEUTRAL);
    assert.equal(registry.isNeutral('guards', 'citizens'), true);

    // 3. Asymmetric standing: wolves are hostile to sheep, but sheep are neutral to wolves
    registry.setReputation('wolves', 'sheep', -50);
    assert.equal(registry.isHostile('wolves', 'sheep'), true);
    assert.equal(registry.getDisposition('wolves', 'sheep'), FACTION_DISPOSITION.HOSTILE);
    assert.equal(registry.getReputation('wolves', 'sheep'), -50);

    // Opposite direction remains unchanged (neutral)
    assert.equal(registry.isHostile('sheep', 'wolves'), false);
    assert.equal(registry.getDisposition('sheep', 'wolves'), FACTION_DISPOSITION.NEUTRAL);
    assert.equal(registry.getReputation('sheep', 'wolves'), 0);

    // 4. Bidirectional standing: guards and kingdom are friendly to each other
    registry.setReputation('guards', 'kingdom', 75, { bidirectional: true });
    assert.equal(registry.isFriendly('guards', 'kingdom'), true);
    assert.equal(registry.isFriendly('kingdom', 'guards'), true);
    assert.equal(registry.getReputation('guards', 'kingdom'), 75);
    assert.equal(registry.getReputation('kingdom', 'guards'), 75);
});

test('FactionRegistry: reputation changes and threshold queries', () => {
    const registry = new FactionRegistry({
        hostileThreshold: -20,
        friendlyThreshold: 20
    });

    // Initial state
    assert.equal(registry.getReputation('player', 'syndicate'), 0);
    assert.equal(registry.getDisposition('player', 'syndicate'), FACTION_DISPOSITION.NEUTRAL);

    // Minor positive action: +15 reputation (still neutral, below threshold 20)
    registry.modifyReputation('player', 'syndicate', 15);
    assert.equal(registry.getReputation('player', 'syndicate'), 15);
    assert.equal(registry.getDisposition('player', 'syndicate'), FACTION_DISPOSITION.NEUTRAL);
    assert.equal(registry.isFriendly('player', 'syndicate'), false);

    // Another positive action: +10 reputation -> total 25 (>= 20, becomes friendly)
    registry.modifyReputation('player', 'syndicate', 10);
    assert.equal(registry.getReputation('player', 'syndicate'), 25);
    assert.equal(registry.getDisposition('player', 'syndicate'), FACTION_DISPOSITION.FRIENDLY);
    assert.equal(registry.isFriendly('player', 'syndicate'), true);

    // Betrayal: -60 reputation -> total -35 (<= -20, becomes hostile)
    registry.modifyReputation('player', 'syndicate', -60);
    assert.equal(registry.getReputation('player', 'syndicate'), -35);
    assert.equal(registry.getDisposition('player', 'syndicate'), FACTION_DISPOSITION.HOSTILE);
    assert.equal(registry.isHostile('player', 'syndicate'), true);

    // Explicit disposition override
    registry.setDisposition('syndicate', 'player', FACTION_DISPOSITION.HOSTILE, { bidirectional: true });
    assert.equal(registry.isHostile('player', 'syndicate'), true);
    assert.equal(registry.isHostile('syndicate', 'player'), true);
});

test('FactionRegistry: resolves entity and combatant objects', () => {
    const registry = new FactionRegistry();
    registry.setDisposition('outlaws', 'townsfolk', FACTION_DISPOSITION.HOSTILE);

    const outlawEntity = { faction: 'outlaws', id: 'bandit_1' };
    const citizenEntity = { faction: 'townsfolk', id: 'citizen_1' };

    assert.equal(registry.isHostile(outlawEntity, citizenEntity), true);
    assert.equal(registry.getDisposition(outlawEntity, citizenEntity), FACTION_DISPOSITION.HOSTILE);
    assert.equal(registry.isHostile(citizenEntity, outlawEntity), false);
});

test('FactionRegistry & ScheduleSystem integration: perceived hostile faction interrupts schedule', () => {
    const factions = new FactionRegistry();
    factions.setDisposition('guards', 'goblins', FACTION_DISPOSITION.HOSTILE, { bidirectional: true });

    const schedules = new ScheduleSystem();
    const guard = schedules.registerNPC('guard_marcus', {
        slots: [
            { start: 6, end: 18, activity: ROUTINE_ACTIVITIES.PATROL, destination: 'gate' },
            { start: 18, end: 6, activity: ROUTINE_ACTIVITIES.SLEEP, destination: 'bunk' }
        ],
        faction: 'guards',
        initialHour: 10
    });

    assert.equal(schedules.getActivity('guard_marcus'), ROUTINE_ACTIVITIES.PATROL);
    assert.equal(guard.isInDanger, false);

    // Friendly passes by: no interruption
    const merchant = { faction: 'merchants' };
    const reactedToMerchant = schedules.perceiveDanger('guard_marcus', merchant, factions);
    assert.equal(reactedToMerchant, false);
    assert.equal(guard.isInDanger, false);
    assert.equal(schedules.getActivity('guard_marcus'), ROUTINE_ACTIVITIES.PATROL);

    // Hostile goblin detected: triggers danger reaction and suspends patrol
    const goblin = { faction: 'goblins', id: 'goblin_raider_1' };
    const reactedToGoblin = schedules.perceiveDanger('guard_marcus', goblin, factions);
    assert.equal(reactedToGoblin, true);
    assert.equal(guard.isInDanger, true);
    assert.equal(schedules.getActivity('guard_marcus'), ROUTINE_ACTIVITIES.COMBAT);

    // Danger resolved: guard resumes patrol
    schedules.resolveDanger('guard_marcus');
    assert.equal(guard.isInDanger, false);
    assert.equal(schedules.getActivity('guard_marcus'), ROUTINE_ACTIVITIES.PATROL);
});

test('ScheduleSystem: integration with GameClock', () => {
    const clock = new GameClock({ minutesPerDay: 1440, minute: 480 }); // minute 480 = 08:00
    const system = new ScheduleSystem({ clock });

    system.registerNPC('worker', {
        slots: [
            { start: 8, end: 17, activity: ROUTINE_ACTIVITIES.WORK },
            { start: 17, end: 23, activity: ROUTINE_ACTIVITIES.REST },
            { start: 23, end: 8, activity: ROUTINE_ACTIVITIES.SLEEP }
        ]
    });

    // Initial update at 08:00
    system.update();
    assert.equal(system.getActivity('worker'), ROUTINE_ACTIVITIES.WORK);

    // Advance clock by 600 minutes (10 hours) -> 18:00 (REST)
    clock.advance(600);
    system.update();
    assert.equal(system.getActivity('worker'), ROUTINE_ACTIVITIES.REST);

    // Advance clock by 360 minutes (6 hours) -> 00:00 (SLEEP)
    clock.advance(360);
    system.update();
    assert.equal(system.getActivity('worker'), ROUTINE_ACTIVITIES.SLEEP);
});

test('Serialization: FactionRegistry serializes and restores faithfully', () => {
    const reg = new FactionRegistry();
    reg.setReputation('factionA', 'factionB', -80);
    reg.setReputation('factionC', 'factionD', 90, { bidirectional: true });

    const serialized = reg.serialize();
    const restored = FactionRegistry.deserialize(serialized);

    assert.equal(restored.isHostile('factionA', 'factionB'), true);
    assert.equal(restored.isFriendly('factionC', 'factionD'), true);
    assert.equal(restored.isFriendly('factionD', 'factionC'), true);
    assert.equal(restored.getReputation('factionA', 'factionB'), -80);
});
