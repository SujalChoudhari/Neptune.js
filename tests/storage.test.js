
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

});