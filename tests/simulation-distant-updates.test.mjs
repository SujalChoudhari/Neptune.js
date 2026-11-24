import '../tests/setup_mocks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { CellGridSimulation } from '../src/sim/cellSimulation.js';
import { MaterialState } from '../src/sim/materialRegistry.js';

test('SIM-03: stepDistant advances simulation within catch-up budget ceiling', () => {
    const sim = new CellGridSimulation(10, 10);
    sim.setCell(2, 2, 'wood');
    sim.ignite(2, 2);

    assert.equal(sim.getCell(2, 2).state, MaterialState.BURNING);

    // Request huge catch-up (e.g. player was away for 10000 ticks)
    // catchUpBudget = 20 should cap execution and not freeze the process
    const executed = sim.stepDistant(10000, { catchUpBudget: 20, updateStride: 1 });
    assert.equal(executed, 20);

    // Wood should have progressed through burning
    assert.ok(sim.getCell(2, 2).burnTicks > 0);
});

test('SIM-03: serialize and deserialize preserve entire cellular simulation state', () => {
    const sim = new CellGridSimulation(8, 8);
    sim.setCell(1, 1, 'wood');
    sim.setCell(3, 3, 'water');
    sim.ignite(1, 1);

    const snapshot = sim.serialize();
    assert.equal(snapshot.version, 1);
    assert.equal(snapshot.cells.length, 64);

    const restoredSim = new CellGridSimulation(8, 8);
    restoredSim.deserialize(snapshot);

    assert.equal(restoredSim.getCell(1, 1).state, MaterialState.BURNING);
    assert.equal(restoredSim.getCell(3, 3).materialId, 'water');
    assert.equal(restoredSim.getCell(3, 3).state, MaterialState.WET);
});
