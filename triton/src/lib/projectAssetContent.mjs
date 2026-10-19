import { SCENE_DATA_VERSION, SCENE_SCHEMA_VERSION } from "../../../src/core/scene.js";

export function createEmptySceneAssetContent(filename) {
    const baseName = typeof filename === "string" ? filename.split(/[\\/]/).pop() : "";
    const name = baseName?.replace(/\.(?:scene|scn)$/i, "").trim() || "Untitled Scene";

    return JSON.stringify({
        type: "scene",
        version: SCENE_DATA_VERSION,
        schemaVersion: SCENE_SCHEMA_VERSION,
        name,
        entities: []
    }, null, 2);
}
