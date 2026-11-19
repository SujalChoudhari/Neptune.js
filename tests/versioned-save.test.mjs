import "./setup_mocks.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
    VersionedSaveEngine,
    SchemaMigrationRegistry,
    ReferenceValidator,
    FutureVersionError,
    ReferenceValidationError,
    MigrationError,
    CorruptSaveError,
    MapStorage
} from "../src/core/versionedSave.js";

import * as Neptune from "../src/neptune.js";

test("SAVE-01 Re-exports: VersionedSaveEngine and related classes are exported from neptune.js", () => {
    assert.equal(typeof VersionedSaveEngine, "function", "VersionedSaveEngine is a constructor");
    assert.equal(typeof SchemaMigrationRegistry, "function", "SchemaMigrationRegistry is a constructor");
    assert.equal(typeof ReferenceValidator, "function", "ReferenceValidator is a constructor");
    assert.equal(typeof FutureVersionError, "function", "FutureVersionError is a constructor");
    assert.equal(typeof ReferenceValidationError, "function", "ReferenceValidationError is a constructor");
    assert.equal(typeof MigrationError, "function", "MigrationError is a constructor");
    assert.equal(typeof CorruptSaveError, "function", "CorruptSaveError is a constructor");
    assert.equal(typeof MapStorage, "function", "MapStorage is a constructor");

    assert.equal(Neptune.VersionedSaveEngine, VersionedSaveEngine, "Neptune re-exports VersionedSaveEngine");
    assert.equal(Neptune.SchemaMigrationRegistry, SchemaMigrationRegistry, "Neptune re-exports SchemaMigrationRegistry");
    assert.equal(Neptune.ReferenceValidator, ReferenceValidator, "Neptune re-exports ReferenceValidator");
    assert.equal(Neptune.FutureVersionError, FutureVersionError, "Neptune re-exports FutureVersionError");
    assert.equal(Neptune.ReferenceValidationError, ReferenceValidationError, "Neptune re-exports ReferenceValidationError");
    assert.equal(Neptune.MigrationError, MigrationError, "Neptune re-exports MigrationError");
    assert.equal(Neptune.CorruptSaveError, CorruptSaveError, "Neptune re-exports CorruptSaveError");
    assert.equal(Neptune.MapStorage, MapStorage, "Neptune re-exports MapStorage");
});

test("SAVE-01 Sequential schema migrations: advances sequentially across multiple versions (v1 -> v2 -> v3)", () => {
    const executedSteps = [];
    const engine = new VersionedSaveEngine({
        currentVersion: 3,
        storage: new MapStorage()
    });

    // v1 -> v2: rename hp -> health, add maxHealth
    engine.registerMigration(1, 2, (v1Data) => {
        executedSteps.push("1->2");
        return {
            ...v1Data,
            schemaVersion: 2,
            player: {
                health: v1Data.player.hp,
                maxHealth: v1Data.player.hp
            }
        };
    });

    // v2 -> v3: add stamina and quest log
    engine.registerMigration(2, 3, (v2Data) => {
        executedSteps.push("2->3");
        return {
            ...v2Data,
            schemaVersion: 3,
            player: {
                ...v2Data.player,
                stamina: 100
            },
            quests: ["intro_completed"]
        };
    });

    const v1Input = {
        schemaVersion: 1,
        savedAt: 1000,
        player: { hp: 85 }
    };

    const migrated = engine.migrate(v1Input, 3);

    assert.deepEqual(executedSteps, ["1->2", "2->3"], "Executed migrations in strict sequential order");
    assert.equal(migrated.schemaVersion, 3, "Final schema version is 3");
    assert.equal(migrated.player.health, 85, "Migrated player health correctly");
    assert.equal(migrated.player.maxHealth, 85, "Added maxHealth in v2");
    assert.equal(migrated.player.stamina, 100, "Added stamina in v3");
    assert.deepEqual(migrated.quests, ["intro_completed"], "Added quests in v3");
});

test("SAVE-01 Sequential migrations via save() and load(): saves at v1, loads into v3 engine", () => {
    const storage = new MapStorage();
    const v1Engine = new VersionedSaveEngine({ currentVersion: 1, storage });

    // Save initial state in v1
    v1Engine.save("slot_campaign", {
        player: { gold: 150, hp: 40 }
    });

    // Open save with v3 engine
    const v3Engine = new VersionedSaveEngine({ currentVersion: 3, storage });
    v3Engine.registerMigration(1, (data) => ({
        ...data,
        schemaVersion: 2,
        currency: { gold: data.player.gold },
        player: { health: data.player.hp }
    }));
    v3Engine.registerMigration(2, (data) => ({
        ...data,
        schemaVersion: 3,
        currency: { ...data.currency, gems: 0 }
    }));

    const loaded = v3Engine.load("slot_campaign");
    assert.equal(loaded.schemaVersion, 3);
    assert.equal(loaded.currency.gold, 150);
    assert.equal(loaded.currency.gems, 0);
    assert.equal(loaded.player.health, 40);
});

test("SAVE-01 Partial path migration: only executes needed steps when starting from intermediate version", () => {
    const steps = [];
    const engine = new VersionedSaveEngine({ currentVersion: 3, storage: new MapStorage() });

    engine.registerMigration(1, (data) => {
        steps.push(1);
        return { ...data, schemaVersion: 2 };
    });
    engine.registerMigration(2, (data) => {
        steps.push(2);
        return { ...data, schemaVersion: 3 };
    });

    const v2Save = { schemaVersion: 2, inventory: ["potion"] };
    const result = engine.migrate(v2Save, 3);

    assert.deepEqual(steps, [2], "Only step 2 was executed");
    assert.equal(result.schemaVersion, 3);
    assert.deepEqual(result.inventory, ["potion"]);
});

test("SAVE-01 Missing migration path: throws clear actionable error when sequence has gaps", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 3, storage: new MapStorage() });
    // Register v1 -> v2, but no v2 -> v3
    engine.registerMigration(1, 2, (data) => ({ ...data, schemaVersion: 2 }));

    assert.throws(
        () => engine.migrate({ schemaVersion: 1, data: "test" }, 3),
        /No migration registered from schema version 2 to reach supported version 3/
    );
});

test("SAVE-01 Future version rejection: throws clear actionable FutureVersionError with diagnostic properties", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 2, storage: new MapStorage() });

    // Save with schemaVersion 4 (newer than currentVersion 2)
    const futureSave = {
        schemaVersion: 4,
        savedAt: Date.now(),
        player: { name: "Time Traveler" }
    };

    // 1. Throws on migrate()
    assert.throws(
        () => engine.migrate(futureSave),
        (err) => {
            assert.ok(err instanceof FutureVersionError, "Error is instance of FutureVersionError");
            assert.equal(err.code, "ERR_FUTURE_SCHEMA_VERSION");
            assert.equal(err.saveVersion, 4);
            assert.equal(err.supportedVersion, 2);
            assert.match(err.message, /Save schema version \(4\) is newer than supported version \(2\)/);
            assert.match(err.message, /Please update the application to load this save/);
            return true;
        }
    );

    // 2. Throws on load() from raw or storage
    assert.throws(
        () => engine.load(JSON.stringify(futureSave)),
        (err) => {
            assert.ok(err instanceof FutureVersionError);
            assert.equal(err.saveVersion, 4);
            assert.equal(err.supportedVersion, 2);
            return true;
        }
    );
});

test("SAVE-01 Reference validation: detects duplicate entity IDs in flat lists and trees", () => {
    const validator = new ReferenceValidator();

    // Duplicate entity IDs in flat entities list
    const flatDuplicates = {
        entities: [
            { id: "ent_hero", name: "Hero" },
            { id: "ent_npc_1", name: "Guard" },
            { id: "ent_hero", name: "Clone" }
        ]
    };

    const flatResult = validator.validate(flatDuplicates);
    assert.equal(flatResult.valid, false, "Validation fails on duplicate entity IDs");
    assert.deepEqual(flatResult.duplicates.entities, ["ent_hero"]);
    assert.match(flatResult.errors[0], /Duplicate entity ID detected: 'ent_hero'/);

    // Duplicate entity IDs in hierarchical children
    const treeDuplicates = {
        entities: [
            {
                id: "parent_ent",
                children: [
                    { id: "child_a" },
                    { id: "child_a" } // duplicate child ID
                ]
            }
        ]
    };

    const treeResult = validator.validate(treeDuplicates);
    assert.equal(treeResult.valid, false);
    assert.deepEqual(treeResult.duplicates.entities, ["child_a"]);

    // Throws ReferenceValidationError when throwOnError is true
    assert.throws(
        () => validator.validate(flatDuplicates, { throwOnError: true }),
        (err) => {
            assert.ok(err instanceof ReferenceValidationError);
            assert.equal(err.code, "ERR_REFERENCE_VALIDATION");
            assert.deepEqual(err.duplicates.entities, ["ent_hero"]);
            assert.match(err.message, /Duplicate entity ID detected: 'ent_hero'/);
            return true;
        }
    );
});

test("SAVE-01 Reference validation: detects duplicate component IDs", () => {
    const validator = new ReferenceValidator();

    const data = {
        entities: [
            {
                id: "e1",
                components: [
                    { id: "comp_trans_1", type: "Transform" },
                    { id: "comp_collider", type: "BoxCollider" }
                ]
            },
            {
                id: "e2",
                components: [
                    { id: "comp_trans_1", type: "Transform" } // duplicate component ID
                ]
            }
        ]
    };

    const result = validator.validate(data);
    assert.equal(result.valid, false);
    assert.deepEqual(result.duplicates.components, ["comp_trans_1"]);
    assert.match(result.errors[0], /Duplicate component ID detected: 'comp_trans_1'/);
});

test("SAVE-01 Reference validation: detects dangling references (non-existent parentId, self-referencing parent)", () => {
    const validator = new ReferenceValidator();

    // Dangling parentId pointing to non-existent entity
    const danglingParent = {
        entities: [
            { id: "e1", name: "Root" },
            { id: "e2", parentId: "non_existent_entity", name: "Orphan" }
        ]
    };

    const res1 = validator.validate(danglingParent);
    assert.equal(res1.valid, false);
    assert.equal(res1.dangling.length, 1);
    assert.equal(res1.dangling[0].field, "parentId");
    assert.equal(res1.dangling[0].sourceId, "e2");
    assert.equal(res1.dangling[0].targetId, "non_existent_entity");
    assert.match(res1.dangling[0].message, /references non-existent parentId 'non_existent_entity'/);

    // Self-referencing parent
    const selfParent = {
        entities: [
            { id: "cycle_ent", parentId: "cycle_ent" }
        ]
    };

    const res2 = validator.validate(selfParent);
    assert.equal(res2.valid, false);
    assert.match(res2.dangling[0].message, /cyclic self-referencing parentId 'cycle_ent'/);

    // Dangling component reference
    const danglingComponentRef = {
        entities: [
            {
                id: "actor",
                components: [
                    { id: "c1", type: "FollowAI", targetEntityId: "missing_target_entity" }
                ]
            }
        ]
    };

    const res3 = validator.validate(danglingComponentRef);
    assert.equal(res3.valid, false);
    assert.equal(res3.dangling[0].field, "targetEntityId");
    assert.equal(res3.dangling[0].targetId, "missing_target_entity");

    // Valid references pass cleanly
    const validHierarchy = {
        entities: [
            { id: "root_ent", parentId: null },
            { id: "child_ent", parentId: "root_ent" }
        ]
    };
    const validRes = validator.validate(validHierarchy);
    assert.equal(validRes.valid, true);
    assert.equal(validRes.errors.length, 0);
});

test("SAVE-01 Reference validation on save and load: rejects invalid data when validateReferences is enabled", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 1, storage: new MapStorage() });

    // Save with dangling reference should throw
    assert.throws(
        () => engine.save("slot_bad", {
            entities: [{ id: "e1", parentId: "missing_parent" }]
        }),
        ReferenceValidationError
    );

    // Save with duplicates should throw
    assert.throws(
        () => engine.save("slot_dup", {
            entities: [{ id: "e1" }, { id: "e1" }]
        }),
        ReferenceValidationError
    );
});

test("SAVE-01 Partial migration error handling: atomic abort preserves original data without corruption", () => {
    const storage = new MapStorage();
    const engine = new VersionedSaveEngine({ currentVersion: 3, storage });

    // v1 -> v2: succeeds and adds property
    engine.registerMigration(1, 2, (data) => {
        return {
            ...data,
            schemaVersion: 2,
            v2_applied: true
        };
    });

    // v2 -> v3: fails with an unexpected runtime exception
    engine.registerMigration(2, 3, () => {
        throw new Error("Critical failure during step 2->3 database transform");
    });

    // Save valid v1 state
    const originalV1 = {
        schemaVersion: 1,
        savedAt: 123456,
        gold: 100,
        inventory: ["sword"]
    };
    engine.save("slot_atomic", originalV1);

    // In-memory test: input record is not mutated on failure
    const memorySnapshot = structuredClone(originalV1);
    assert.throws(
        () => engine.migrate(memorySnapshot, 3),
        (err) => {
            assert.ok(err instanceof MigrationError, "Thrown error is MigrationError");
            assert.equal(err.code, "ERR_SCHEMA_MIGRATION");
            assert.equal(err.fromVersion, 2);
            assert.equal(err.toVersion, 3);
            assert.equal(err.aborted, true);
            assert.equal(err.originalStatePreserved, true);
            assert.match(err.message, /Critical failure during step 2->3/);
            return true;
        }
    );
    // Verify memorySnapshot is strictly untouched
    assert.equal(memorySnapshot.schemaVersion, 1, "Original schemaVersion was not mutated");
    assert.equal(memorySnapshot.v2_applied, undefined, "Partial migration change was not written to input object");

    // Storage test: slot in storage remains strictly untouched at v1
    assert.throws(
        () => engine.load("slot_atomic"),
        MigrationError
    );

    const rawInStorage = JSON.parse(storage.getItem(engine.key("slot_atomic")));
    assert.equal(rawInStorage.schemaVersion, 1, "Storage slot remains at schemaVersion 1");
    assert.equal(rawInStorage.gold, 100, "Storage gold remains 100");
    assert.equal(rawInStorage.v2_applied, undefined, "Storage was not corrupted with partial v2 state");
});

test("SAVE-01 Step verification: fails and aborts atomically if a step produces invalid schemaVersion", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 2, storage: new MapStorage() });

    // Migration function returns wrong schemaVersion
    engine.registerMigration(1, 2, (data) => {
        return {
            ...data,
            schemaVersion: 99 // Should have been 2
        };
    });

    const v1Input = { schemaVersion: 1, data: "test" };

    assert.throws(
        () => engine.migrate(v1Input, 2),
        (err) => {
            assert.ok(err instanceof MigrationError);
            assert.match(err.message, /Step verification failed at step v1 -> v2: expected schemaVersion 2, got 99/);
            return true;
        }
    );

    // Verify v1Input was not modified
    assert.equal(v1Input.schemaVersion, 1);
});

test("SAVE-01 Step custom verification: fails and aborts atomically if step custom verify fails", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 2, storage: new MapStorage() });

    engine.registerMigration(1, 2, (data) => {
        return {
            ...data,
            schemaVersion: 2
            // forgot required player field
        };
    }, {
        verify: (record) => Boolean(record.player && record.player.id)
    });

    assert.throws(
        () => engine.migrate({ schemaVersion: 1 }, 2),
        (err) => {
            assert.ok(err instanceof MigrationError);
            assert.match(err.message, /Step verification failed custom check/);
            return true;
        }
    );
});

test("SAVE-01 Corrupt JSON diagnostics: provides line, column, snippet with pointer, and diagnostic reason", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 1 });

    const corruptJson = `{\n  "schemaVersion": 1,\n  "gold": 100,,\n  "level": 3\n}`;
    let syntaxErr;
    try {
        JSON.parse(corruptJson);
    } catch (e) {
        syntaxErr = e;
    }

    const diag = engine.diagnoseCorruptJson(corruptJson, syntaxErr);
    assert.equal(diag.line, 3, "Identified line 3 as error location");
    assert.ok(diag.column > 1, "Identified column of syntax error");
    assert.ok(diag.snippet.includes("Line 3:"), "Snippet includes line number");
    assert.ok(diag.snippet.includes("^"), "Snippet contains pointer to error column");
    assert.match(diag.message, /Corrupt JSON at line 3/);
});

test("SAVE-01 Corrupt JSON recovery: safely recovers from trailing commas", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 1 });

    const corruptTrailingCommas = `{\n  "schemaVersion": 1,\n  "state": {\n    "score": 4200,\n  },\n  "tags": ["alpha", "beta",],\n}`;

    const recovery = engine.recoverCorruptJson(corruptTrailingCommas);
    assert.equal(recovery.recovered, true, "Successfully recovered trailing commas");
    assert.equal(recovery.strategy, "trailing_comma_cleanup");
    assert.equal(recovery.data.schemaVersion, 1);
    assert.equal(recovery.data.state.score, 4200);
    assert.deepEqual(recovery.data.tags, ["alpha", "beta"]);

    // Loading through engine.load() succeeds transparently
    const loaded = engine.load(corruptTrailingCommas);
    assert.equal(loaded.state.score, 4200);
});

test("SAVE-01 Corrupt JSON recovery: safely recovers truncated JSON from crash/interrupted write", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 1 });

    // Truncated during write: open string and unclosed objects
    const truncatedWrite = `{"schemaVersion": 1, "player": {"name": "Hero", "inventory": ["shield", "pot`;

    const recovery = engine.recoverCorruptJson(truncatedWrite);
    assert.equal(recovery.recovered, true, "Successfully recovered truncated JSON");
    assert.equal(recovery.strategy, "truncated_json_repair");
    assert.equal(recovery.data.schemaVersion, 1);
    assert.equal(recovery.data.player.name, "Hero");
    assert.ok(Array.isArray(recovery.data.player.inventory));

    const loaded = engine.load(truncatedWrite);
    assert.equal(loaded.player.name, "Hero");
});

test("SAVE-01 Corrupt JSON recovery: fallback to backup slot when primary slot is unrecoverable", () => {
    const storage = new MapStorage();
    const engine = new VersionedSaveEngine({ currentVersion: 1, storage });

    const slot = "slot_disaster";
    const key = engine.key(slot);

    // Primary slot has unrecoverable garbage (e.g. byte corruption)
    storage.setItem(key, "!!!FATAL_CORRUPT_BYTES_XYZ!!!");

    // Backup slot has valid last-known-good save
    const backupData = {
        schemaVersion: 1,
        savedAt: Date.now() - 5000,
        player: { level: 10, restored: true }
    };
    storage.setItem(`${key}.bak`, JSON.stringify(backupData));

    // load() automatically detects corrupt primary and recovers from backup slot
    const loaded = engine.load(slot);
    assert.ok(loaded !== null, "Loaded recovered backup");
    assert.equal(loaded.player.level, 10);
    assert.equal(loaded.player.restored, true);
});

test("SAVE-01 Corrupt JSON unrecoverable: throws CorruptSaveError with diagnostic metadata when recovery is impossible or disabled", () => {
    const engine = new VersionedSaveEngine({ currentVersion: 1 });

    const totalGarbage = "random non-json content 12345";

    assert.throws(
        () => engine.load(totalGarbage, { autoRecoverCorrupt: false }),
        (err) => {
            assert.ok(err instanceof CorruptSaveError, "Thrown error is CorruptSaveError");
            assert.equal(err.code, "ERR_CORRUPT_SAVE_JSON");
            assert.equal(typeof err.line, "number");
            assert.equal(typeof err.column, "number");
            assert.ok(err.snippet.length > 0);
            assert.match(err.message, /Corrupt JSON at line/);
            return true;
        }
    );
});
