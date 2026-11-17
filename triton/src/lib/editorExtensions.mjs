export const EDITOR_EXTENSION_API_VERSION = 1;
export const PROJECT_EDITOR_EXTENSIONS_VERSION = 1;

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const asDisposer = value => typeof value === "function" ? value : () => {};
const cloneJson = value => {
    const visit = (item, seen = new WeakSet()) => {
        if (item === null || typeof item === "string" || typeof item === "boolean") return item;
        if (typeof item === "number" && Number.isFinite(item)) return item;
        if (typeof item !== "object" || seen.has(item) || (!Array.isArray(item) && !isRecord(item))) throw new TypeError("Editor extension data must be acyclic JSON values");
        seen.add(item);
        const result = Array.isArray(item)
            ? item.map(child => visit(child, seen))
            : Object.fromEntries(Object.entries(item).map(([key, child]) => [key, visit(child, seen)]));
        seen.delete(item);
        return result;
    };
    return visit(value);
};

/** Load only explicitly enabled, project-relative editor extension modules. */
export async function loadProjectEditorExtensions(project, { readEntry, importSource, report = () => {} } = {}) {
    const config = project?.editorExtensions;
    if (config === undefined) return [];
    if (!isRecord(config) || config.version !== PROJECT_EDITOR_EXTENSIONS_VERSION || !Array.isArray(config.entries)) {
        throw new TypeError(`project.editorExtensions must use version ${PROJECT_EDITOR_EXTENSIONS_VERSION} and an entries array`);
    }
    if (typeof readEntry !== "function" || typeof importSource !== "function") throw new TypeError("Project extension loading needs readEntry and importSource adapters");
    const loaded = [];
    for (const entry of config.entries) {
        if (!isRecord(entry) || entry.enabled !== true) continue;
        const path = entry.path;
        if (typeof path !== "string" || path.startsWith("/") || path.includes(":") || /[%?#]/.test(path) || path.split(/[\\/]/).some(part => !part || part === "." || part === "..") || !/\.mjs$/i.test(path)) {
            report({ extensionId: entry.id ?? "<unknown>", phase: "load", severity: "error", message: "Extension path must be a project-relative .mjs file without traversal." });
            continue;
        }
        try {
            const source = await readEntry(path);
            if (typeof source !== "string") throw new Error(`Could not read opt-in editor extension '${path}'`);
            const module = await importSource(source, path);
            const extension = module?.default ?? module?.extension;
            if (!isRecord(extension)) throw new TypeError(`'${path}' must export default { id, apiVersion, activate(api) }`);
            if (typeof entry.id === "string" && extension.id !== entry.id) throw new Error(`Configured extension ID '${entry.id}' does not match module ID '${String(extension.id)}'`);
            loaded.push(extension);
        } catch (error) {
            report({ extensionId: entry.id ?? path, phase: "load", severity: "error", message: error instanceof Error ? error.message : String(error) });
        }
    }
    return loaded;
}

/**
 * Create an opt-in, editor-only extension host. Extensions receive capability
 * functions rather than mutable scene/runtime objects. Nothing registered here
 * is part of project or game serialization.
 */
export function createEditorExtensionHost(options = {}) {
    const diagnostics = [];
    const definitions = new Map();
    const active = new Map();
    let projectId = options.projectId ?? null;
    let sceneId = options.sceneId ?? null;
    let disposed = false;
    const changed = () => { try { options.onChange?.(); } catch { /* UI invalidation must not break extension cleanup. */ } };

    const report = (extensionId, phase, error) => {
        const entry = { extensionId, phase, message: error instanceof Error ? error.message : String(error), severity: "error" };
        diagnostics.push(entry);
        try { options.onDiagnostic?.(entry); } catch { /* diagnostics must not cascade */ }
    };
    const safely = (id, phase, callback, fallback = undefined) => {
        try { return callback(); } catch (error) { report(id, phase, error); return fallback; }
    };
    const cleanupActive = (extensionId, phase = "dispose") => {
        const instance = active.get(extensionId);
        if (!instance) return;
        active.delete(extensionId);
        for (const dispose of [...instance.cleanups].reverse()) safely(extensionId, phase, dispose);
        safely(extensionId, phase, () => instance.extension.deactivate?.(instance.api));
        instance.registrations.clear();
        instance.drawings.clear();
        instance.overlayObjects.clear();
        changed();
    };
    const createInstance = extension => {
        const instance = { extension, cleanups: [], registrations: new Map(), drawings: new Map(), overlayObjects: new Map(), sequence: 0, api: null };
        const assertActive = () => {
            if (disposed || active.get(extension.id) !== instance) throw new Error(`Editor extension '${extension.id}' is no longer active`);
        };
        const track = cleanup => {
            let live = true;
            const dispose = () => { if (!live) return; live = false; asDisposer(cleanup)(); changed(); };
            instance.cleanups.push(dispose);
            changed();
            return dispose;
        };
        const register = (kind, id, value) => {
            assertActive();
            if (typeof id !== "string" || !id.trim() || instance.registrations.has(`${kind}:${id}`)) throw new TypeError(`${kind} registration needs a unique non-empty ID`);
            const key = `${kind}:${id}`;
            instance.registrations.set(key, value);
            return track(() => instance.registrations.delete(key));
        };
        const api = {
            apiVersion: EDITOR_EXTENSION_API_VERSION,
            projectId,
            sceneId,
            selection: {
                get: () => { assertActive(); return safely(extension.id, "selection", () => options.getSelection?.() ?? [], []); },
                set: ids => {
                    assertActive();
                    if (!Array.isArray(ids) || ids.some(id => typeof id !== "string")) throw new TypeError("selection.set expects entity IDs");
                    return safely(extension.id, "selection", () => options.setSelection?.([...ids]), false);
                }
            },
            query: {
                entity: id => { assertActive(); return safely(extension.id, "query", () => { const value = options.queryEntity?.(id); return value ? cloneJson(value) : null; }, null); },
                entities: filter => { assertActive(); return safely(extension.id, "query", () => cloneJson(options.queryEntities?.(filter) ?? []), []); }
            },
            coordinates: {
                worldToScreen: point => { assertActive(); return safely(extension.id, "coordinates", () => options.worldToScreen?.(point) ?? null, null); },
                screenToWorld: point => { assertActive(); return safely(extension.id, "coordinates", () => options.screenToWorld?.(point) ?? null, null); }
            },
            draw: {
                add: descriptor => {
                    assertActive();
                    if (!isRecord(descriptor) || !["rect", "line", "circle", "text"].includes(descriptor.type)) throw new TypeError("draw.add supports rect, line, circle, and text descriptors");
                    const id = `${extension.id}:draw:${instance.sequence++}`;
                    instance.drawings.set(id, cloneJson(descriptor));
                    return track(() => instance.drawings.delete(id));
                },
                list: () => { assertActive(); return [...instance.drawings.values()].map(value => cloneJson(value)); }
            },
            hitTest: {
                register: (id, test, onPointer) => {
                    if (typeof test !== "function" || typeof onPointer !== "function") throw new TypeError("hitTest.register requires test and pointer callbacks");
                    const unregister = register("hit-test", id, { test, onPointer });
                    return unregister;
                },
                hit: point => {
                    assertActive();
                    const hit = [...instance.registrations.entries()].reverse().find(([key, value]) => key.startsWith("hit-test:") && safely(extension.id, "hit-test", () => value.test(point), false));
                    return hit ? hit[0].slice("hit-test:".length) : null;
                },
                dispatch: (id, event) => {
                    assertActive();
                    const item = instance.registrations.get(`hit-test:${id}`);
                    return item ? safely(extension.id, "hit-test", () => item.onPointer(event), false) : false;
                }
            },
            commands: {
                updateComponent: (entityId, component, patch) => {
                    assertActive();
                    if (typeof entityId !== "string" || !entityId || typeof component !== "string" || !component || !isRecord(patch) || Object.keys(patch).length === 0) throw new TypeError("updateComponent needs an entity, component, and non-empty patch");
                    return options.commands?.updateComponent?.(entityId, component, cloneJson(patch)) ?? false;
                },
                run: (label, apply, revert) => {
                    assertActive();
                    if (typeof label !== "string" || !label.trim() || typeof apply !== "function" || typeof revert !== "function") throw new TypeError("commands.run requires a label, apply, and revert");
                    return options.commands?.runSceneEdit?.(label, apply, revert) ?? false;
                },
                begin: label => {
                    assertActive();
                    if (typeof label !== "string" || !label.trim()) throw new TypeError("commands.begin requires a label");
                    const transaction = options.commands?.beginSceneEdit?.(label);
                    if (!transaction || typeof transaction.commit !== "function" || typeof transaction.cancel !== "function") throw new Error("The editor has no scene edit transaction host");
                    return { commit: () => transaction.commit(), cancel: () => transaction.cancel() };
                }
            },
            registerInspector: (id, descriptor) => register("inspector", id, descriptor),
            registerContextAction: (id, descriptor) => register("context-action", id, descriptor),
            registerTool: (id, descriptor) => register("tool", id, descriptor),
            editorOverlay: {
                add: object => {
                    assertActive();
                    if (!isRecord(object) || typeof object.id !== "string" || !object.id) throw new TypeError("editorOverlay.add requires an object with an ID");
                    const ownedId = `${extension.id}:${object.id}`;
                    if (instance.overlayObjects.has(ownedId)) throw new Error(`Overlay object already exists: ${object.id}`);
                    instance.overlayObjects.set(ownedId, cloneJson(object));
                    return track(() => instance.overlayObjects.delete(ownedId));
                },
                list: () => { assertActive(); return [...instance.overlayObjects.values()].map(value => cloneJson(value)); }
            },
            onDispose: cleanup => track(cleanup)
        };
        instance.api = api;
        return instance;
    };
    const activate = extension => {
        const instance = createInstance(extension);
        active.set(extension.id, instance);
        try { extension.activate(instance.api); }
        catch (error) {
            report(extension.id, "activate", error);
            cleanupActive(extension.id, "activation-failed");
        }
    };
    const enable = extension => {
        if (disposed) throw new Error("Editor extension host is disposed");
        if (!isRecord(extension) || typeof extension.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/.test(extension.id)) throw new TypeError("Extension ID must be a stable short identifier");
        if (extension.apiVersion !== EDITOR_EXTENSION_API_VERSION) throw new Error(`Extension '${extension.id}' requires API ${String(extension.apiVersion)}; host supports ${EDITOR_EXTENSION_API_VERSION}`);
        if (typeof extension.activate !== "function") throw new TypeError(`Extension '${extension.id}' must provide activate(api)`);
        cleanupActive(extension.id, "reload");
        definitions.set(extension.id, extension);
        activate(extension);
        return () => { cleanupActive(extension.id); definitions.delete(extension.id); };
    };
    const activateAll = () => { for (const extension of definitions.values()) activate(extension); };
    return {
        apiVersion: EDITOR_EXTENSION_API_VERSION,
        diagnostics,
        enable,
        disable: id => { cleanupActive(id); return definitions.delete(id); },
        reload: id => {
            const extension = definitions.get(id);
            if (!extension) return false;
            cleanupActive(id, "reload");
            activate(extension);
            return true;
        },
        switchScene: id => {
            if (disposed || id === sceneId) return;
            for (const extensionId of [...active.keys()]) cleanupActive(extensionId, "scene-change");
            sceneId = id;
            activateAll();
        },
        switchProject: id => {
            if (disposed || id === projectId) return;
            for (const extensionId of [...active.keys()]) cleanupActive(extensionId, "project-change");
            definitions.clear();
            projectId = id;
            sceneId = null;
        },
        registrations: kind => [...active.entries()].flatMap(([extensionId, instance]) => [...instance.registrations.entries()]
            .filter(([key]) => key.startsWith(`${kind}:`))
            .map(([key, value]) => ({ extensionId, id: key.slice(kind.length + 1), value }))),
        drawings: () => [...active.values()].flatMap(instance => [...instance.drawings.values()].map(value => cloneJson(value))),
        overlayObjects: () => [...active.values()].flatMap(instance => [...instance.overlayObjects.values()].map(value => cloneJson(value))),
        dispose() {
            if (disposed) return;
            for (const id of [...active.keys()]) cleanupActive(id);
            definitions.clear();
            disposed = true;
        }
    };
}
