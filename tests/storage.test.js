
import "./setup_mocks.js";
import { Storage } from "../src/neptune.js";
import { describe, expect, it } from "./tester.js";

describe("Storage", () => {
    it("should set and get item", () => {
        Storage.Set("test", "test");
        let item = Storage.Get("test");
        expect(item).toBe("test"); 
    });

    it("should remove item", () => {
        Storage.Set("test", "test");
        Storage.Remove("test");
        let item = Storage.Get("test");
        expect(item).toBe(null);
    });


    it("should clear storage", () => {
        Storage.Set("test", "test");
        Storage.Clear();
        let item = Storage.Get("test");
        expect(item).toBe(null);
    });

    it("should store temp in session storage", () => {
        Storage.Set("test", "test",false);
        Storage.Set("test2", "test2",true);
        sessionStorage.clear();
        expect(Storage.Get("test")).toBe(null);
        expect(Storage.Get("test2")).toBe("test2");

    });

    it("saves and restores a versioned project payload", () => {
        const project = {
            name: "Temporary Project",
            entryScene: "scene-main",
            scenes: [{ id: "scene-main", type: "scene", schemaVersion: 1, version: "1.0.0", name: "Main", layers: [] }]
        };

        Storage.SaveProject("temporary-project", project);
        const restored = Storage.LoadProject("temporary-project");

        expect(restored.schemaVersion).toBe(1);
        expect(restored.version).toBe("1.0.0");
        expect(restored.scenes[0].id).toBe("scene-main");
        expect(restored.scenes[0].name).toBe("Main");
    });

    it("rejects unsupported project schema versions with an actionable error", () => {
        Storage.Set("bad-project", JSON.stringify({ type: "project", schemaVersion: 99 }), false);

        expect(() => Storage.LoadProject("bad-project")).toThrow(/Unsupported project schema version/);
        expect(() => Storage.LoadProject("bad-project")).toThrow(/Migrate the project/);
    });

    it("rejects unsupported nested scene schema versions before normalizing the project", () => {
        Storage.Set("bad-nested-scene", JSON.stringify({
            type: "project",
            schemaVersion: 1,
            scenes: [{ type: "scene", schemaVersion: 99, name: "Future Scene" }]
        }), false);

        expect(() => Storage.LoadProject("bad-nested-scene")).toThrow(/Unsupported scene schema version '99'/);
        expect(() => Storage.LoadProject("bad-nested-scene")).toThrow(/Migrate the scene/);
    });

});
