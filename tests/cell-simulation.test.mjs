import "../tests/setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
    CellGridSimulation,
    MaterialRegistry,
    MaterialInteraction,
    MaterialState,
    InteractionType,
} from "../src/sim/index.js";
import { TypedEventBus } from "../src/core/worldFacts.js";
import * as Neptune from "../src/neptune.js";

// =============================================================================
// 1. Module Exports & Grid Initialization
// =============================================================================

test("CellGridSimulation is exported from sim/index.js and src/neptune.js", () => {
    assert.equal(typeof CellGridSimulation, "function");
    assert.equal(typeof Neptune.CellGridSimulation, "function");
    assert.equal(typeof Neptune.Sim.CellGridSimulation, "function");
    assert.equal(Neptune.CellGridSimulation, CellGridSimulation);
});

test("CellGridSimulation initializes grid with correct default cell properties", () => {
    const sim = new CellGridSimulation(8, 6, {
        ambientTemperature: 22,
        defaultMaterial: "dirt",
    });

    assert.equal(sim.width, 8);
    assert.equal(sim.height, 6);

    const cell = sim.getCell(3, 4);
    assert.ok(cell, "Cell at (3, 4) should exist");
    assert.equal(cell.materialId, "dirt");
    assert.equal(cell.state, MaterialState.DRY);
    assert.equal(cell.moisture, 0.0);
    assert.equal(cell.burnTicks, 0);
    assert.equal(cell.temperature, 22);
});

test("CellGridSimulation accepts object constructor options", () => {
    const sim = new CellGridSimulation({
        width: 12,
        height: 10,
        defaultMaterial: "stone",
        ambientTemperature: 15,
        burningTemperature: 120,
    });

    assert.equal(sim.width, 12);
    assert.equal(sim.height, 10);
    const cell = sim.getCell(0, 0);
    assert.equal(cell.materialId, "stone");
    assert.equal(cell.temperature, 15);
});

// =============================================================================
// 2. Boundary Conditions and Out-of-Bounds Safety
// =============================================================================

test("Boundary conditions: out-of-bounds coordinates handled safely", () => {
    const sim = new CellGridSimulation(4, 4);

    // Queries outside boundary should return null, not throw
    assert.equal(sim.isInBounds(-1, 0), false);
    assert.equal(sim.isInBounds(0, -1), false);
    assert.equal(sim.isInBounds(4, 0), false);
    assert.equal(sim.isInBounds(0, 4), false);
    assert.equal(sim.isInBounds(100, 100), false);
    assert.equal(sim.isInBounds(0.5, 1), false);

    assert.equal(sim.getCell(-1, 2), null);
    assert.equal(sim.getCell(2, -1), null);
    assert.equal(sim.getCell(10, 10), null);

    // setCell, ignite, extinguish out-of-bounds safely return null or false
    assert.equal(sim.setCell(-1, 0, { materialId: "wood" }), null);
    assert.equal(sim.setCell(4, 4, "wood"), null);
    assert.equal(sim.ignite(-5, 0), false);
    assert.equal(sim.ignite(10, 2), false);
    assert.equal(sim.extinguish(-1, -1), false);
    assert.equal(sim.extinguish(99, 99), false);
});

test("Boundary conditions: edge and corner cells step without throwing", () => {
    const sim = new CellGridSimulation(3, 3);

    // Place burning cell in corner (0, 0)
    sim.setCell(0, 0, { materialId: "wood", state: MaterialState.BURNING });
    // Place burning cell in corner (2, 2)
    sim.setCell(2, 2, { materialId: "grass", state: MaterialState.BURNING });

    // Step should run safely with cardinal neighbors extending beyond boundary
    assert.doesNotThrow(() => {
        sim.step();
    });
});

// =============================================================================
// 3. Fire Spread Across Flammable Cells (Wood, Grass)
// =============================================================================

test("Fire spreads across adjacent flammable cells (wood, grass)", () => {
    const eventBus = new TypedEventBus();
    const ignited = [];
    eventBus.on("sim:ignited", (data) => ignited.push(data));

    const sim = new CellGridSimulation(5, 5, { eventBus });

    // (1, 1) is burning wood
    sim.setCell(1, 1, { materialId: "wood", state: MaterialState.BURNING });
    // (2, 1) is dry wood
    sim.setCell(2, 1, { materialId: "wood", state: MaterialState.DRY });
    // (1, 2) is dry grass
    sim.setCell(1, 2, { materialId: "grass", state: MaterialState.DRY });

    // Step simulation
    sim.step();

    // Wood at (2, 1) should now be burning
    const woodNeighbor = sim.getCell(2, 1);
    assert.equal(woodNeighbor.state, MaterialState.BURNING, "Adjacent wood should ignite");
    assert.ok(woodNeighbor.temperature >= 100, "Burning wood temperature should be >= burningTemperature");

    // Grass at (1, 2) should now be burning
    const grassNeighbor = sim.getCell(1, 2);
    assert.equal(grassNeighbor.state, MaterialState.BURNING, "Adjacent grass should ignite");

    // Events should have been emitted
    assert.ok(ignited.length >= 2, "Ignition events should be dispatched");
    const woodEvent = ignited.find((e) => e.x === 2 && e.y === 1);
    assert.ok(woodEvent);
    assert.equal(woodEvent.materialId, "wood");

    const grassEvent = ignited.find((e) => e.x === 1 && e.y === 2);
    assert.ok(grassEvent);
    assert.equal(grassEvent.materialId, "grass");
});

test("Fire propagates sequentially along a multi-cell flammable line", () => {
    const sim = new CellGridSimulation(5, 1);

    // Line: [Fire(wood), Dry(wood), Dry(wood), Dry(wood), Dry(wood)]
    sim.setCell(0, 0, { materialId: "wood", state: MaterialState.BURNING });
    sim.setCell(1, 0, { materialId: "wood", state: MaterialState.DRY });
    sim.setCell(2, 0, { materialId: "wood", state: MaterialState.DRY });
    sim.setCell(3, 0, { materialId: "wood", state: MaterialState.DRY });
    sim.setCell(4, 0, { materialId: "wood", state: MaterialState.DRY });

    // Tick 1: spreads to (1, 0)
    sim.step();
    assert.equal(sim.getCell(1, 0).state, MaterialState.BURNING);
    assert.equal(sim.getCell(2, 0).state, MaterialState.DRY);

    // Tick 2: spreads to (2, 0)
    sim.step();
    assert.equal(sim.getCell(2, 0).state, MaterialState.BURNING);
    assert.equal(sim.getCell(3, 0).state, MaterialState.DRY);

    // Tick 3: spreads to (3, 0)
    sim.step();
    assert.equal(sim.getCell(3, 0).state, MaterialState.BURNING);
    assert.equal(sim.getCell(4, 0).state, MaterialState.DRY);

    // Tick 4: spreads to (4, 0)
    sim.step();
    assert.equal(sim.getCell(4, 0).state, MaterialState.BURNING);
});

test("Burning cells burn for material burnDuration then transition to charred", () => {
    const eventBus = new TypedEventBus();
    const charred = [];
    eventBus.on("sim:charred", (data) => charred.push(data));

    const sim = new CellGridSimulation(3, 3, { eventBus });

    // grass has burnDuration: 4
    sim.setCell(0, 0, { materialId: "grass", state: MaterialState.BURNING });
    // wood has burnDuration: 10
    sim.setCell(2, 2, { materialId: "wood", state: MaterialState.BURNING });

    // Step 4 times
    for (let i = 0; i < 4; i++) {
        sim.step();
    }

    // Grass should have charred after 4 ticks
    const grassCell = sim.getCell(0, 0);
    assert.equal(grassCell.state, MaterialState.CHARRED, "Grass should transition to charred after burnDuration");
    assert.ok(charred.some((e) => e.x === 0 && e.y === 0 && e.materialId === "grass"));

    // Wood should still be burning (burnDuration: 10)
    const woodCell = sim.getCell(2, 2);
    assert.equal(woodCell.state, MaterialState.BURNING, "Wood should still be burning at tick 4");
    assert.equal(woodCell.burnTicks, 4);

    // Step 6 more times (total 10 ticks)
    for (let i = 0; i < 6; i++) {
        sim.step();
    }

    // Wood should now be charred
    assert.equal(woodCell.state, MaterialState.CHARRED, "Wood should char after 10 ticks");
    assert.ok(charred.some((e) => e.x === 2 && e.y === 2 && e.materialId === "wood"));
});

test("Charred cells cannot re-ignite", () => {
    const sim = new CellGridSimulation(3, 1);

    // (0, 0) is burning wood, (1, 0) is charred wood
    sim.setCell(0, 0, { materialId: "wood", state: MaterialState.BURNING });
    sim.setCell(1, 0, { materialId: "wood", state: MaterialState.CHARRED });

    // Step simulation
    for (let i = 0; i < 5; i++) {
        sim.step();
    }

    // Charred cell at (1, 0) should remain charred, not burning
    assert.equal(sim.getCell(1, 0).state, MaterialState.CHARRED);

    // Manual ignite should also fail on charred material
    const manualIgnite = sim.ignite(1, 0);
    assert.equal(manualIgnite, false);
    assert.equal(sim.getCell(1, 0).state, MaterialState.CHARRED);
});

// =============================================================================
// 4. Stone and Iron Walls Stop Fire Spread
// =============================================================================

test("Stone wall stops fire spread to flammable cells behind it", () => {
    const sim = new CellGridSimulation(3, 1);

    // Layout: [ Burning Wood (0, 0) | Stone Wall (1, 0) | Dry Wood (2, 0) ]
    sim.setCell(0, 0, { materialId: "wood", state: MaterialState.BURNING });
    sim.setCell(1, 0, { materialId: "stone", state: MaterialState.DRY });
    sim.setCell(2, 0, { materialId: "wood", state: MaterialState.DRY });

    // Step multiple times
    for (let i = 0; i < 12; i++) {
        sim.step();
    }

    // Stone wall must never catch fire
    const stoneCell = sim.getCell(1, 0);
    assert.equal(stoneCell.state, MaterialState.DRY);

    // Wood behind the stone wall must remain unburned
    const protectedWood = sim.getCell(2, 0);
    assert.equal(protectedWood.state, MaterialState.DRY);
    assert.equal(protectedWood.burnTicks, 0);
});

test("Iron wall stops fire spread to flammable cells behind it", () => {
    const sim = new CellGridSimulation(3, 1);

    // Layout: [ Burning Grass (0, 0) | Iron Wall (1, 0) | Dry Grass (2, 0) ]
    sim.setCell(0, 0, { materialId: "grass", state: MaterialState.BURNING });
    sim.setCell(1, 0, { materialId: "iron", state: MaterialState.DRY });
    sim.setCell(2, 0, { materialId: "grass", state: MaterialState.DRY });

    // Step multiple times
    for (let i = 0; i < 6; i++) {
        sim.step();
    }

    // Iron wall remains dry and unburned
    assert.equal(sim.getCell(1, 0).state, MaterialState.DRY);

    // Grass behind iron remains dry
    assert.equal(sim.getCell(2, 0).state, MaterialState.DRY);
});

test("Enclosed stone room contains fire completely", () => {
    const sim = new CellGridSimulation(5, 5);

    // Build a 5x5 area with dry grass outside and a 3x3 stone room in center:
    // (1,1) to (3,3) border is stone, inside (2, 2) is burning wood
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            sim.setCell(x, y, { materialId: "grass", state: MaterialState.DRY });
        }
    }

    // Stone enclosure around (2, 2)
    const stoneCoords = [
        [1, 1], [2, 1], [3, 1],
        [1, 2],         [3, 2],
        [1, 3], [2, 3], [3, 3],
    ];
    for (const [x, y] of stoneCoords) {
        sim.setCell(x, y, { materialId: "stone", state: MaterialState.DRY });
    }

    // Burning fire in the center of the room
    sim.setCell(2, 2, { materialId: "wood", state: MaterialState.BURNING });

    // Advance 12 steps so center fire completes its burnDuration
    for (let i = 0; i < 12; i++) {
        sim.step();
    }

    // Center wood charred
    assert.equal(sim.getCell(2, 2).state, MaterialState.CHARRED);

    // All stone walls remained intact
    for (const [x, y] of stoneCoords) {
        assert.equal(sim.getCell(x, y).state, MaterialState.DRY);
    }

    // Outside grass at (0, 2), (4, 2), (2, 0), (2, 4) remained unburnt
    assert.equal(sim.getCell(0, 2).state, MaterialState.DRY);
    assert.equal(sim.getCell(4, 2).state, MaterialState.DRY);
    assert.equal(sim.getCell(2, 0).state, MaterialState.DRY);
    assert.equal(sim.getCell(2, 4).state, MaterialState.DRY);
});

// =============================================================================
// 5. Water Extinguishes Adjacent Fire & Conflicting Interactions
// =============================================================================

test("Water cell extinguishes adjacent burning fire", () => {
    const eventBus = new TypedEventBus();
    const extinguished = [];
    eventBus.on("sim:extinguished", (data) => extinguished.push(data));

    const sim = new CellGridSimulation(3, 1, { eventBus });

    // (0, 0) is burning wood, (1, 0) is water
    sim.setCell(0, 0, { materialId: "wood", state: MaterialState.BURNING });
    sim.setCell(1, 0, { materialId: "water", state: MaterialState.WET });

    // Step simulation
    sim.step();

    const burningCell = sim.getCell(0, 0);
    assert.equal(
        burningCell.state,
        MaterialState.EXTINGUISHED,
        "Burning cell should be extinguished by adjacent water"
    );
    assert.ok(burningCell.moisture >= 1.0, "Extinguished cell should be wet");
    assert.equal(burningCell.burnTicks, 0, "Burn ticks should be reset");
    assert.equal(burningCell.temperature, sim.ambientTemperature, "Temperature should be cooled to ambient");

    // Event should have fired
    assert.equal(extinguished.length, 1);
    assert.equal(extinguished[0].x, 0);
    assert.equal(extinguished[0].y, 0);
    assert.equal(extinguished[0].materialId, "wood");
});

test("Conflicting interactions: extinguishing takes precedence over ignition", () => {
    const sim = new CellGridSimulation(3, 1);

    // Layout: [ Burning Wood (0, 0) | Dry Grass (1, 0) | Water (2, 0) ]
    // Cell (1, 0) has simultaneously a burning neighbor and a water neighbor
    sim.setCell(0, 0, { materialId: "wood", state: MaterialState.BURNING });
    sim.setCell(1, 0, { materialId: "grass", state: MaterialState.DRY });
    sim.setCell(2, 0, { materialId: "water", state: MaterialState.WET });

    // Step simulation
    sim.step();

    const target = sim.getCell(1, 0);
    assert.notEqual(target.state, MaterialState.BURNING, "Target should NOT ignite when adjacent to water");
    assert.equal(target.state, MaterialState.WET, "Target should transition to wet due to extinguishing precedence");
    assert.ok(target.moisture >= 1.0);
});

test("Removed water source allows adjacent wet ground to dry over time", () => {
    const sim = new CellGridSimulation(3, 1, { dryingRate: 0.5 });

    // Place water at (0, 0) and dirt at (1, 0)
    sim.setCell(0, 0, { materialId: "water", state: MaterialState.WET });
    sim.setCell(1, 0, { materialId: "dirt", state: MaterialState.DRY });

    // Step 1: dirt at (1, 0) becomes wet from adjacent water
    sim.step();
    assert.equal(sim.getCell(1, 0).state, MaterialState.WET);
    assert.equal(sim.getCell(1, 0).moisture, 1.0);

    // Now remove the water source (replace with dry stone)
    sim.setCell(0, 0, { materialId: "stone", state: MaterialState.DRY });

    // Step 2: moisture decreases by dryingRate (1.0 - 0.5 = 0.5)
    sim.step();
    assert.equal(sim.getCell(1, 0).moisture, 0.5);
    assert.equal(sim.getCell(1, 0).state, MaterialState.WET);

    // Step 3: moisture decreases to 0 (0.5 - 0.5 = 0.0) -> transitions back to DRY
    sim.step();
    assert.equal(sim.getCell(1, 0).moisture, 0.0);
    assert.equal(sim.getCell(1, 0).state, MaterialState.DRY);
});

// =============================================================================
// 6. Update Budgets Limit Work Per Step
// =============================================================================

test("Update budget: maxCellUpdatesPerTick caps per-step computation", () => {
    const totalCells = 20;
    const budget = 5;
    const sim = new CellGridSimulation(20, 1, { maxCellUpdatesPerTick: budget });

    // Fill line with burning wood
    for (let x = 0; x < totalCells; x++) {
        sim.setCell(x, 0, { materialId: "wood", state: MaterialState.BURNING });
    }

    // Step 1: only first 5 cells should be processed
    const res1 = sim.step();
    assert.equal(res1.updatesProcessed, budget, "Should process exactly budget cells in step 1");
    assert.equal(sim.getCell(0, 0).burnTicks, 1, "Cell 0 should have updated burnTicks");
    assert.equal(sim.getCell(4, 0).burnTicks, 1, "Cell 4 should have updated burnTicks");
    assert.equal(sim.getCell(5, 0).burnTicks, 0, "Cell 5 should not have updated yet");

    // Step 2: processes next 5 cells (5..9)
    const res2 = sim.step();
    assert.equal(res2.updatesProcessed, budget);
    assert.equal(sim.getCell(5, 0).burnTicks, 1);
    assert.equal(sim.getCell(9, 0).burnTicks, 1);
    assert.equal(sim.getCell(10, 0).burnTicks, 0);

    // Override budget in step call
    const res3 = sim.step(1, { maxCellUpdatesPerTick: 10 });
    assert.equal(res3.updatesProcessed, 10, "Step options should override maxCellUpdatesPerTick");
});

// =============================================================================
// 7. Event Integration with TypedEventBus
// =============================================================================

test("Event integration: emits sim:ignited, sim:extinguished, sim:charred via TypedEventBus", () => {
    const eventBus = new TypedEventBus();
    const events = [];

    eventBus.on("sim:ignited", (data) => events.push({ type: "ignited", ...data }));
    eventBus.on("sim:extinguished", (data) => events.push({ type: "extinguished", ...data }));
    eventBus.on("sim:charred", (data) => events.push({ type: "charred", ...data }));

    const sim = new CellGridSimulation(4, 4, { eventBus });

    // 1. Manual ignite
    sim.setCell(0, 0, { materialId: "wood", state: MaterialState.DRY });
    sim.ignite(0, 0);

    assert.equal(events.length, 1);
    assert.equal(events[0].type, "ignited");
    assert.equal(events[0].x, 0);
    assert.equal(events[0].y, 0);
    assert.equal(events[0].materialId, "wood");

    // 2. Manual extinguish
    sim.extinguish(0, 0);
    assert.equal(events.length, 2);
    assert.equal(events[1].type, "extinguished");
    assert.equal(events[1].x, 0);
    assert.equal(events[1].y, 0);

    // 3. Natural charring via step
    sim.setCell(1, 1, { materialId: "grass", state: MaterialState.BURNING });
    for (let i = 0; i < 4; i++) {
        sim.step();
    }

    const charEvent = events.find((e) => e.type === "charred" && e.x === 1 && e.y === 1);
    assert.ok(charEvent, "Should emit sim:charred event");
    assert.equal(charEvent.materialId, "grass");
});

// =============================================================================
// 8. Grid Serialization and Restore (Snapshot & Restore)
// =============================================================================

test("Grid snapshot and restore preserves complete simulation state", () => {
    const sim1 = new CellGridSimulation(4, 4, {
        ambientTemperature: 18,
        burningTemperature: 110,
    });

    // Author custom layout
    sim1.setCell(0, 0, { materialId: "wood", state: MaterialState.BURNING, burnTicks: 3, temperature: 110 });
    sim1.setCell(1, 0, { materialId: "stone", state: MaterialState.DRY, moisture: 0.0 });
    sim1.setCell(2, 0, { materialId: "water", state: MaterialState.WET, moisture: 1.0 });
    sim1.setCell(3, 0, { materialId: "grass", state: MaterialState.CHARRED, burnTicks: 4 });
    sim1.setCell(0, 1, { materialId: "dirt", state: MaterialState.EXTINGUISHED, moisture: 0.7 });

    // Serialize snapshot
    const snapshot = sim1.snapshot();
    const serializedJson = JSON.stringify(snapshot);
    const parsedSnapshot = JSON.parse(serializedJson);

    // Restore into a fresh simulation instance
    const sim2 = new CellGridSimulation(1, 1);
    sim2.restore(parsedSnapshot);

    assert.equal(sim2.width, 4);
    assert.equal(sim2.height, 4);
    assert.equal(sim2.ambientTemperature, 18);
    assert.equal(sim2.burningTemperature, 110);

    // Verify cell states match
    const c00 = sim2.getCell(0, 0);
    assert.equal(c00.materialId, "wood");
    assert.equal(c00.state, MaterialState.BURNING);
    assert.equal(c00.burnTicks, 3);
    assert.equal(c00.temperature, 110);

    const c10 = sim2.getCell(1, 0);
    assert.equal(c10.materialId, "stone");
    assert.equal(c10.state, MaterialState.DRY);

    const c20 = sim2.getCell(2, 0);
    assert.equal(c20.materialId, "water");
    assert.equal(c20.state, MaterialState.WET);
    assert.equal(c20.moisture, 1.0);

    const c30 = sim2.getCell(3, 0);
    assert.equal(c30.materialId, "grass");
    assert.equal(c30.state, MaterialState.CHARRED);

    const c01 = sim2.getCell(0, 1);
    assert.equal(c01.materialId, "dirt");
    assert.equal(c01.state, MaterialState.EXTINGUISHED);
    assert.equal(c01.moisture, 0.7);

    // Both sim1 and sim2 should step identically after restore
    sim1.step();
    sim2.step();

    assert.equal(sim1.getCell(0, 0).burnTicks, sim2.getCell(0, 0).burnTicks);
    assert.equal(sim1.getCell(0, 0).state, sim2.getCell(0, 0).state);
    assert.equal(sim1.getCell(0, 1).state, sim2.getCell(0, 1).state);
});

test("restore rejects invalid snapshots with TypeError", () => {
    const sim = new CellGridSimulation(4, 4);
    assert.throws(() => sim.restore(null), TypeError);
    assert.throws(() => sim.restore("invalid"), TypeError);
    assert.throws(() => sim.restore({}), TypeError);
});
