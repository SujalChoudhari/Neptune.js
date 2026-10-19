export function resolveProjectResourcePath(reference, scenePath = "") {
    if (typeof reference !== "string" || !reference.trim()) {
        throw new TypeError("Project resource path must be a non-empty string");
    }
    const normalize = (value, initial = []) => {
        const parts = [...initial];
        for (const part of value.replaceAll("\\", "/").split("/")) {
            if (!part || part === ".") continue;
            if (part === "..") {
                if (parts.length === 0) throw new TypeError("Project resource path must stay inside the selected project");
                parts.pop();
            } else {
                parts.push(part);
            }
        }
        if (parts.length === 0) throw new TypeError("Project resource path must be a non-empty project path");
        return parts.join("/");
    };
    const sceneDirectory = scenePath
        ? normalize(scenePath).split("/").slice(0, -1)
        : [];
    const initial = reference.trim().startsWith("/") ? [] : sceneDirectory;
    try {
        return normalize(reference.trim(), initial);
    } catch (error) {
        if (error instanceof TypeError) throw error;
        throw new TypeError("Project resource path must stay inside the selected project");
    }
}

export function installProjectResourceBridge(frameWindow = window) {
    const pending = new Map();
    let nextId = 0;
    const originalFetch = frameWindow.fetch?.bind(frameWindow);
    const imagePrototype = frameWindow.HTMLImageElement?.prototype;
    const imageSrcDescriptor = imagePrototype && Object.getOwnPropertyDescriptor(imagePrototype, "src");
    const mediaPrototype = frameWindow.HTMLMediaElement?.prototype;
    const mediaSrcDescriptor = mediaPrototype && Object.getOwnPropertyDescriptor(mediaPrototype, "src");
    const originalAudio = frameWindow.Audio;
    let currentScenePath = "";

    const request = (reference, kind) => new Promise((resolve, reject) => {
        let path;
        try {
            path = resolveProjectResourcePath(reference, currentScenePath);
        } catch (error) {
            reject(error);
            return;
        }
        const id = `project-resource-${++nextId}`;
        pending.set(id, { resolve, reject, path, kind });
        frameWindow.parent.postMessage({
            type: "editor:project-resource-request",
            payload: { id, path, kind }
        }, "*");
    });

    const handleResponse = event => {
        const message = event.data;
        if (message?.type !== "editor:project-resource-response") return;
        const { id, content, error } = message.payload || {};
        const task = pending.get(id);
        if (!task) return;
        pending.delete(id);
        if (error) {
            const message = `Could not load project ${task.kind} resource "${task.path}": ${error}`;
            frameWindow.parent.postMessage({
                type: "editor:scene-diagnostic",
                payload: { code: "EDITOR_PROJECT_RESOURCE_LOAD_FAILED", severity: "error", message }
            }, "*");
            task.reject(new Error(message));
        } else task.resolve(content);
    };
    frameWindow.addEventListener("message", handleResponse);

    if (originalFetch) {
        frameWindow.fetch = (input, init) => {
            const reference = typeof input === "string" ? input : input?.url;
            if (typeof reference !== "string" || /^[a-z][a-z\d+.-]*:/i.test(reference)) {
                return originalFetch(input, init);
            }
            return request(reference, "text").then(content => new frameWindow.Response(content, {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }));
        };
    }

    const bridgeSource = (prototype, descriptor, kind) => {
        if (prototype && descriptor?.set && descriptor.get) {
            Object.defineProperty(prototype, "src", {
                ...descriptor,
                set(reference) {
                if (typeof reference !== "string" || /^(data:|blob:|https?:)/i.test(reference)) {
                    descriptor.set.call(this, reference);
                    return;
                }
                    request(reference, kind)
                        .then(dataUri => descriptor.set.call(this, dataUri))
                        .catch(error => frameWindow.console.error(`Could not load selected-project ${kind}:`, reference, error));
                }
            });
        }
    };
    bridgeSource(imagePrototype, imageSrcDescriptor, "image");
    bridgeSource(mediaPrototype, mediaSrcDescriptor, "audio");
    if (originalAudio) {
        const ProjectAudio = function (source) {
            const audio = new originalAudio();
            if (source !== undefined) audio.src = source;
            return audio;
        };
        Object.setPrototypeOf(ProjectAudio, originalAudio);
        ProjectAudio.prototype = originalAudio.prototype;
        frameWindow.Audio = ProjectAudio;
    }

    const dispose = () => {
        frameWindow.removeEventListener("message", handleResponse);
        if (originalFetch) frameWindow.fetch = originalFetch;
        if (imagePrototype && imageSrcDescriptor) Object.defineProperty(imagePrototype, "src", imageSrcDescriptor);
        if (mediaPrototype && mediaSrcDescriptor) Object.defineProperty(mediaPrototype, "src", mediaSrcDescriptor);
        if (originalAudio) frameWindow.Audio = originalAudio;
        for (const task of pending.values()) task.reject(new Error("Project resource bridge closed"));
        pending.clear();
    };
    dispose.setScenePath = path => { currentScenePath = resolveProjectResourcePath(path); };
    return dispose;
}
