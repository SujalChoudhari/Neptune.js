import "../tests/setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
    MaterialRegistry,
    MaterialInteraction,
    MaterialState,
    InteractionType,
    BUILTIN_MATERIALS,
    FALLBACK_MATERIAL,
} from "../src/sim/materialRegistry.js";

// =============================================================================
// 1. Built-in material queries (conductivity, viscosity, flammability, etc.)
// =============================================================================

test("MaterialRegistry contains all required built-in materials", () => {
    const registry = new MaterialRegistry();
    const expectedMaterials = ["wood", "stone", "water", "grass", "iron", "cloth", "dirt"];

    for (const id of expectedMaterials) {
        assert.equal(registry.has(id), true, `Built-in material "${id}" should exist in registry`);
        const mat = registry.get(id);
        assert.equal(mat.id, id);
        assert.equal(typeof mat.flammability, "number", `flammability of ${id} must be a number`);
        assert.ok(mat.flammability >= 0 && mat.flammability <= 1, `flammability of ${id} must be in [0, 1]`);

        assert.equal(typeof mat.conductivity, "number", `conductivity of ${id} must be a number`);
        assert.ok(mat.conductivity >= 0 && mat.conductivity <= 1, `conductivity of ${id} must be in [0, 1]`);

        assert.equal(typeof mat.viscosity, "number", `viscosity of ${id} must be a number`);
        assert.ok(mat.viscosity >= 0, `viscosity of ${id} must be >= 0`);

        assert.equal(typeof mat.traversalCost, "number", `traversalCost of ${id} must be a number`);
        assert.ok(mat.traversalCost >= 1, `traversalCost of ${id} must be >= 1`);

        assert.equal(typeof mat.isSolid, "boolean", `isSolid of ${id} must be boolean`);

        assert.equal(typeof mat.burnDuration, "number", `burnDuration of ${id} must be a number`);
        assert.ok(mat.burnDuration >= 0, `burnDuration of ${id} must be >= 0`);
    }
});

test("Built-in material properties reflect expected physical characteristics", () => {
    const registry = MaterialRegistry.getDefault();

    // Wood: flammable solid, low conductivity, burns over time
    const wood = registry.get("wood");
    assert.ok(wood.flammability > 0.4, "Wood should be flammable");
    assert.equal(wood.isSolid, true, "Wood should be solid");
    assert.ok(wood.burnDuration > 0, "Wood should have positive burn duration");

    // Stone: non-flammable solid, low conductivity
    const stone = registry.get("stone");
    assert.equal(stone.flammability, 0.0, "Stone must be non-flammable");
    assert.equal(stone.isSolid, true, "Stone should be solid");
    assert.equal(stone.burnDuration, 0, "Stone cannot burn");

    // Water: non-flammable, non-solid fluid, conductive, high traversal cost, positive viscosity
    const water = registry.get("water");
    assert.equal(water.flammability, 0.0, "Water must be non-flammable");
    assert.equal(water.isSolid, false, "Water is not solid");
    assert.ok(water.conductivity >= 0.7, "Water should have high conductivity");
    assert.ok(water.viscosity > 0, "Water should have viscosity");
    assert.ok(water.traversalCost > 1.0, "Water traversalCost should be higher than normal ground");

    // Grass: highly flammable, non-solid, short burn duration
    const grass = registry.get("grass");
    assert.ok(grass.flammability >= 0.7, "Grass should be highly flammable");
    assert.equal(grass.isSolid, false, "Grass is passable");
    assert.ok(grass.burnDuration > 0 && grass.burnDuration < wood.burnDuration, "Grass burns faster than wood");

    // Iron: non-flammable, highly conductive solid
    const iron = registry.get("iron");
    assert.equal(iron.flammability, 0.0, "Iron is non-flammable");
    assert.equal(iron.conductivity, 1.0, "Iron should have high conductivity");
    assert.equal(iron.isSolid, true, "Iron is solid");

    // Cloth: highly flammable, insulator
    const cloth = registry.get("cloth");
    assert.ok(cloth.flammability >= 0.8, "Cloth should be very flammable");
    assert.ok(cloth.conductivity <= 0.1, "Cloth is a poor conductor");

    // Dirt: non-flammable, non-solid ground
    const dirt = registry.get("dirt");
    assert.equal(dirt.flammability, 0.0, "Dirt is non-flammable");
    assert.equal(dirt.isSolid, false, "Dirt ground is passable");
    assert.equal(dirt.traversalCost, 1.0, "Dirt has standard traversal cost");
});

test("MaterialRegistry supports registering and validating custom materials", () => {
    const registry = new MaterialRegistry();

    const custom = registry.register("magma", {
        flammability: 0.0,
        conductivity: 0.5,
        viscosity: 5.0,
        traversalCost: 3.5,
        isSolid: false,
        burnDuration: 0,
    });

    assert.equal(registry.has("magma"), true);
    assert.equal(custom.viscosity, 5.0);
    assert.equal(custom.traversalCost, 3.5);

    // Validation errors
    assert.throws(() => {
        registry.register("invalid_flam", { flammability: 2.0 });
    }, RangeError);

    assert.throws(() => {
        registry.register("invalid_cost", { traversalCost: 0.5 });
    }, RangeError);

    assert.throws(() => {
        registry.register("", { flammability: 0.5 });
    }, TypeError);
});

// =============================================================================
// 2. Fallback handling with diagnostic warning
// =============================================================================

test("Querying missing material triggers diagnostic warning and returns fallback", () => {
    const registry = new MaterialRegistry();

    const capturedWarnings = [];
    const originalWarn = console.warn;
    console.warn = msg => capturedWarnings.push(msg);

    try {
        const fallbackResult = registry.get("unknown_super_material");

        assert.ok(fallbackResult, "Fallback material definition must be returned");
        assert.equal(fallbackResult.id, "dirt", "Default fallback ID should be dirt");
        assert.equal(fallbackResult.flammability, 0.0);
        assert.equal(fallbackResult.traversalCost, 1.0);

        // Verify diagnostic record
        assert.equal(registry.diagnostics.length, 1);
        assert.equal(registry.diagnostics[0].type, "MISSING_MATERIAL");
        assert.equal(registry.diagnostics[0].materialId, "unknown_super_material");

        // Verify console.warn was issued
        assert.equal(capturedWarnings.length, 1);
        assert.ok(capturedWarnings[0].includes("unknown_super_material"));
        assert.ok(capturedWarnings[0].includes("dirt"));
    } finally {
        console.warn = originalWarn;
    }
});

test("Custom diagnostic listener receives missing material events", () => {
    const registry = new MaterialRegistry();
    const events = [];
    registry.onDiagnostic = evt => events.push(evt);

    registry.get("spectral_plasma", { suppressWarning: true });

    assert.equal(events.length, 1);
    assert.equal(events[0].materialId, "spectral_plasma");
    assert.equal(events[0].fallbackId, "dirt");
});

// =============================================================================
// 3. State transitions
// =============================================================================

test("State transition: dry -> burning -> charred", () => {
    // Step 1: dry wood ignites to burning
    const igniteResult = MaterialInteraction.applyInteraction({
        state: MaterialState.DRY,
        interaction: InteractionType.IGNITE,
        materialId: "wood",
    });

    assert.equal(igniteResult.state, MaterialState.BURNING);
    assert.equal(igniteResult.applied, true);
    assert.equal(igniteResult.isHazard, true, "Burning material is a hazard");
    assert.ok(igniteResult.traversalCost > 1.0, "Burning material has higher traversal cost");

    // Step 2: burning wood transitions to charred when burn duration completes
    const charResult = MaterialInteraction.applyInteraction({
        state: igniteResult.state,
        interaction: InteractionType.BURNOUT,
        materialId: "wood",
    });

    assert.equal(charResult.state, MaterialState.CHARRED);
    assert.equal(charResult.applied, true);
    assert.equal(charResult.isHazard, false, "Charred material is no longer an active hazard");
    assert.ok(charResult.traversalCost < igniteResult.traversalCost, "Charred cost is less hazardous than burning");

    // Step 2b: advanceBurn also supports time-based charring
    const timedBurn = MaterialInteraction.advanceBurn({
        state: MaterialState.BURNING,
        materialId: "wood",
        elapsedTicks: 10, // wood burnDuration is 10
    });
    assert.equal(timedBurn.state, MaterialState.CHARRED);
});

test("State transition: dry -> wet", () => {
    const douseResult = MaterialInteraction.applyInteraction({
        state: MaterialState.DRY,
        interaction: InteractionType.DOUSE,
        materialId: "wood",
    });

    assert.equal(douseResult.state, MaterialState.WET);
    assert.equal(douseResult.applied, true);
    assert.equal(douseResult.isHazard, false);
    assert.ok(douseResult.traversalCost >= 1.0);
});

test("State transition: burning -> extinguished", () => {
    // Dousing burning material quenches fire and transitions to extinguished
    const douseBurning = MaterialInteraction.applyInteraction({
        state: MaterialState.BURNING,
        interaction: InteractionType.DOUSE,
        materialId: "wood",
    });

    assert.equal(douseBurning.state, MaterialState.EXTINGUISHED);
    assert.equal(douseBurning.applied, true);
    assert.equal(douseBurning.isHazard, false, "Extinguished fire is quenched and no longer a fire hazard");

    // Cooling also transitions burning to extinguished
    const coolBurning = MaterialInteraction.applyInteraction({
        state: MaterialState.BURNING,
        interaction: InteractionType.COOL,
        materialId: "grass",
    });

    assert.equal(coolBurning.state, MaterialState.EXTINGUISHED);
});

test("Drying wet or extinguished material transitions back to dry", () => {
    const dryWet = MaterialInteraction.applyInteraction({
        state: MaterialState.WET,
        interaction: InteractionType.DRY,
        materialId: "wood",
    });
    assert.equal(dryWet.state, MaterialState.DRY);

    const dryExtinguished = MaterialInteraction.applyInteraction({
        state: MaterialState.EXTINGUISHED,
        interaction: InteractionType.DRY,
        materialId: "wood",
    });
    assert.equal(dryExtinguished.state, MaterialState.DRY);
});

// =============================================================================
// 4. Edge cases
// =============================================================================

test("Edge case: Non-flammable materials (flammability === 0) cannot ignite", () => {
    const nonFlammable = ["stone", "water", "iron", "dirt"];

    for (const id of nonFlammable) {
        const result = MaterialInteraction.applyInteraction({
            state: MaterialState.DRY,
            interaction: InteractionType.IGNITE,
            materialId: id,
            intensity: 10, // Even with excessive heat
        });

        assert.equal(result.state, MaterialState.DRY, `Non-flammable material "${id}" must not ignite`);
        assert.equal(result.applied, false);
        assert.equal(result.isHazard, false);
    }
});

test("Edge case: Repeated ignition on charred material cannot re-ignite", () => {
    const reigniteAttempt = MaterialInteraction.applyInteraction({
        state: MaterialState.CHARRED,
        interaction: InteractionType.IGNITE,
        materialId: "wood",
        intensity: 5,
    });

    assert.equal(reigniteAttempt.state, MaterialState.CHARRED, "Charred material must remain charred");
    assert.equal(reigniteAttempt.applied, false, "No state change occurs");
    assert.equal(reigniteAttempt.isHazard, false);
});

test("Edge case: Wet materials resist ignition unless intensity exceeds moisture threshold", () => {
    // Normal intensity ignition (intensity = 1 <= threshold 1.0) is resisted
    const normalIgniteOnWet = MaterialInteraction.applyInteraction({
        state: MaterialState.WET,
        interaction: InteractionType.IGNITE,
        materialId: "wood",
        intensity: 1.0,
        moistureThreshold: 1.0,
    });

    assert.equal(normalIgniteOnWet.state, MaterialState.WET, "Wet material resists normal ignition");
    assert.equal(normalIgniteOnWet.applied, false);

    // High intensity ignition (intensity = 2 > threshold 1.0) overcomes moisture
    const highIntensityIgniteOnWet = MaterialInteraction.applyInteraction({
        state: MaterialState.WET,
        interaction: InteractionType.IGNITE,
        materialId: "wood",
        intensity: 2.0,
        moistureThreshold: 1.0,
    });

    assert.equal(highIntensityIgniteOnWet.state, MaterialState.BURNING, "High intensity ignition overcomes moisture resistance");
    assert.equal(highIntensityIgniteOnWet.applied, true);
    assert.equal(highIntensityIgniteOnWet.isHazard, true);
});

test("Edge case: Conflicting simultaneous ignite & douse gives precedence to extinguishing", () => {
    // Scenario 1: Burning wood receiving simultaneous ignite and douse
    const conflictingBurning = MaterialInteraction.applyInteraction({
        state: MaterialState.BURNING,
        interactions: [InteractionType.IGNITE, InteractionType.DOUSE],
        materialId: "wood",
    });

    assert.equal(conflictingBurning.state, MaterialState.EXTINGUISHED, "Extinguishing takes precedence on burning material");
    assert.equal(conflictingBurning.isHazard, false);

    // Scenario 2: Dry wood receiving simultaneous ignite and douse
    const conflictingDry = MaterialInteraction.applyInteraction({
        state: MaterialState.DRY,
        interaction: "IGNITE_AND_DOUSE",
        materialId: "wood",
    });

    assert.equal(conflictingDry.state, MaterialState.WET, "Extinguishing/dousing takes precedence on dry material");
    assert.equal(conflictingDry.isHazard, false);

    // Scenario 3: Array in interaction property
    const conflictingArray = MaterialInteraction.applyInteraction({
        state: MaterialState.DRY,
        interaction: [InteractionType.IGNITE, InteractionType.DOUSE],
        materialId: "grass",
    });
    assert.equal(conflictingArray.state, MaterialState.WET);
});

test("Edge case: Missing material interaction falls back gracefully with diagnostic warning", () => {
    const capturedWarnings = [];
    const originalWarn = console.warn;
    console.warn = msg => capturedWarnings.push(msg);

    try {
        const result = MaterialInteraction.applyInteraction({
            state: MaterialState.DRY,
            interaction: InteractionType.IGNITE,
            materialId: "non_existent_element",
        });

        // Fallback is dirt, which has flammability 0, so it safely fails to ignite
        assert.equal(result.state, MaterialState.DRY);
        assert.equal(result.materialId, "dirt");
        assert.equal(capturedWarnings.length, 1);
    } finally {
        console.warn = originalWarn;
    }
});

// =============================================================================
// 5. Traversal and hazard queries
// =============================================================================

test("Traversal and hazard queries report accurate values across states", () => {
    // Burning is always an active hazard
    const burningStatus = MaterialInteraction.getHazardStatus("wood", MaterialState.BURNING);
    assert.equal(burningStatus.isHazard, true);
    assert.equal(burningStatus.type, "fire");

    // Dry / wet / charred / extinguished are not active hazards
    assert.equal(MaterialInteraction.isHazard("wood", MaterialState.DRY), false);
    assert.equal(MaterialInteraction.isHazard("wood", MaterialState.WET), false);
    assert.equal(MaterialInteraction.isHazard("wood", MaterialState.CHARRED), false);
    assert.equal(MaterialInteraction.isHazard("wood", MaterialState.EXTINGUISHED), false);

    // Traversal cost queries
    const dryCost = MaterialInteraction.getEffectiveTraversalCost("wood", MaterialState.DRY);
    const wetCost = MaterialInteraction.getEffectiveTraversalCost("wood", MaterialState.WET);
    const burningCost = MaterialInteraction.getEffectiveTraversalCost("wood", MaterialState.BURNING);

    assert.equal(dryCost, 1.0);
    assert.ok(wetCost > dryCost, "Wet wood should be slower/slippery to traverse than dry");
    assert.ok(burningCost > wetCost, "Burning terrain should have high traversal cost penalty");

    // Unified query method
    const queryResult = MaterialInteraction.query({ materialId: "water", state: MaterialState.DRY });
    assert.equal(queryResult.materialId, "water");
    assert.equal(queryResult.traversalCost, 2.0);
    assert.equal(queryResult.isHazard, false);

    // transition() convenience helper returns raw string
    const nextState = MaterialInteraction.transition({
        state: MaterialState.DRY,
        interaction: InteractionType.IGNITE,
        materialId: "cloth",
    });
    assert.equal(nextState, MaterialState.BURNING);
    assert.equal(typeof nextState, "string");
});
