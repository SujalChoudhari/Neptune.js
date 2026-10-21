import fs from "fs";
import path from "path";
import vm from "node:vm";
import { buildSync } from "esbuild";

const root = path.resolve("triton");
const source = fs.readFileSync(path.join(root, "src", "context", "GameContext.tsx"), "utf8");
const bundle = buildSync({
    bundle: true,
    format: "cjs",
    platform: "node",
    write: false,
    stdin: {
        contents: source,
        loader: "tsx",
        sourcefile: "GameContext.tsx",
        resolveDir: path.join(root, "src", "context")
    },
    external: ["react", "react/jsx-runtime", "./FileSystemContext"]
});

const slots = [];
let hookIndex = 0;
let currentContext;
const writes = [];
const runtimeMessages = [];
const runtimeFrame = { contentWindow: { postMessage: message => runtimeMessages.push(message) } };
let scenePayload = null;
let sceneReadError = true;
const react = {
    createContext() {
        const Provider = Symbol("GameContext.Provider");
        return { Provider };
    },
    createElement(type, props) {
        if (typeof type === "symbol") currentContext = props.value;
        return null;
    },
    useContext() { return null; },
    useState(initialValue) {
        const index = hookIndex++;
        if (!slots[index]) slots[index] = { value: initialValue };
        return [slots[index].value, (value) => {
            slots[index].value = typeof value === "function" ? value(slots[index].value) : value;
        }];
    },
    useCallback(callback) { hookIndex++; return callback; },
    useMemo(callback) { hookIndex++; return callback(); },
    useEffect() { hookIndex++; }
};

const module = { exports: {} };
vm.runInNewContext(bundle.outputFiles[0].text, {
    console: { log() {}, error() {}, warn() {} },
    React: react,
    document: { querySelectorAll: () => [runtimeFrame] },
    window: { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} },
    Event,
    Math,
    Promise,
    module,
    exports: module.exports,
    require(specifier) {
        if (specifier === "react") return react;
        if (specifier === "./FileSystemContext") {
            return {
                useFileSystem: () => ({
                    rootPath: null,
                    readScene: async () => {
                        if (sceneReadError) throw new Error("Could not load scene 'scenes/bad.scene'. Invalid scene payload: invalid JSON");
                        return scenePayload;
                    },
                    readProject: async () => ({}),
                    writeProject: async () => true,
                    writeScene: async (path, scene) => { writes.push({ path, scene }); return true; }
                })
            };
        }
        throw new Error(`Unexpected external import: ${specifier}`);
    }
});

const render = () => {
    hookIndex = 0;
    module.exports.GameProvider({ children: null });
};

render();
await currentContext.loadScene("scenes/bad.scene");
render();

if (currentContext.currentScenePath !== null) {
    throw new Error("Rejected scene read must not set the current save target.");
}

let saveError;
try {
    await currentContext.saveScene();
} catch (error) {
    saveError = error;
}

if (!saveError?.message.includes("no scene is open")) {
    throw new Error("Save after a rejected scene read must report that no scene is open.");
}
if (writes.length !== 0) {
    throw new Error("Save after a rejected scene read must not write the rejected source.");
}

sceneReadError = false;
scenePayload = {
    type: "scene",
    version: "1.0.0",
    schemaVersion: 1,
    name: "Map-shaped entities",
    entities: { fake: { id: "fake", name: "Fake Runtime Entity", type: "entity" } }
};
await currentContext.loadScene("scenes/map-shaped.scene");
render();

if (currentContext.currentScenePath !== null) {
    throw new Error("A scene shape unsupported by SceneLoader must not become the current save target.");
}
if (Object.keys(currentContext.entities).length !== 0) {
    throw new Error("A scene shape unsupported by SceneLoader must not populate the editor hierarchy.");
}

scenePayload = {
    type: "scene",
    version: "1.0.0",
    schemaVersion: 1,
    name: "Component Update Contract",
    entities: [{
        id: "hero",
        name: "Hero",
        type: "entity",
        transform: { pos: { x: 0, y: 0 }, rot: 0, scale: { x: 1, y: 1 } },
        components: [{ id: "hero-hitbox", type: "Hitbox", props: { width: 2, height: 1, offsetX: 4, offsetY: 5 } }]
    }],
    layers: []
};
await currentContext.loadScene("scenes/component-update.scene");
render();
currentContext.selectEntity("hero", false);
render();
currentContext.updateComponent("hero", "Hitbox", "width", 7);
render();

const selectedAfterColliderUpdate = currentContext.selectedEntityData;
if (selectedAfterColliderUpdate?.components?.Hitbox?.width !== 7 || selectedAfterColliderUpdate.components.Hitbox.offsetX !== 4) {
    throw new Error("Collider field updates must merge into the selected entity's nested component data.");
}
if (Object.prototype.hasOwnProperty.call(selectedAfterColliderUpdate, "Hitbox")) {
    throw new Error("Collider updates must not create a top-level component alias in EntityData.");
}
const colliderUpdateMessage = runtimeMessages.at(-1);
if (colliderUpdateMessage?.type !== "editor:update-component" || colliderUpdateMessage.payload?.id !== "hero" || colliderUpdateMessage.payload?.component !== "Hitbox" || colliderUpdateMessage.payload?.data?.width !== 7) {
    throw new Error("Collider updates must send a one-field object to the live runtime bridge.");
}

currentContext.updateComponent("hero", "transform", "position", { x: 12, y: -3 });
render();
if (currentContext.selectedEntityData?.transform?.position?.x !== 12 || currentContext.selectedEntityData.transform.position.y !== -3) {
    throw new Error("Transform field updates must merge into EntityData.transform.");
}
const transformUpdateMessage = runtimeMessages.at(-1);
if (transformUpdateMessage?.type !== "editor:update-component" || transformUpdateMessage.payload?.data?.position?.x !== 12) {
    throw new Error("Transform updates must send a one-field object to the live runtime bridge.");
}

console.log(JSON.stringify({
    collider: selectedAfterColliderUpdate.components.Hitbox,
    transform: currentContext.selectedEntityData.transform,
    colliderUpdateMessage,
    transformUpdateMessage
}));
