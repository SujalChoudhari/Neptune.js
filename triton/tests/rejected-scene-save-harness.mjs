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
    document: { querySelectorAll: () => [] },
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
