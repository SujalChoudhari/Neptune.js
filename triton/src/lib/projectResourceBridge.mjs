export function resolveProjectResourcePath(reference) {
    if (typeof reference !== "string" || !reference.trim()) {
        throw new TypeError("Project resource path must be a non-empty string");
    }
    const normalized = reference.trim().replaceAll("\\", "/");
    if (normalized.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(normalized)) {
        throw new TypeError("Project resource path must be relative to the selected project");
    }
    const parts = [];
    for (const part of normalized.split("/")) {
        if (!part || part === ".") continue;
        if (part === "..") throw new TypeError("Project resource path must stay inside the selected project");
        parts.push(part);
    }
    if (parts.length === 0) throw new TypeError("Project resource path must be a non-empty project path");
    return parts.join("/");
}

export function installProjectResourceBridge(frameWindow = window) {
    const pending = new Map();
    let nextId = 0;
    const originalFetch = frameWindow.fetch?.bind(frameWindow);
    const imagePrototype = frameWindow.HTMLImageElement?.prototype;
    const imageDescriptor = imagePrototype && Object.getOwnPropertyDescriptor(imagePrototype, "src");
    const mediaPrototype = frameWindow.HTMLMediaElement?.prototype;
    const mediaDescriptor = mediaPrototype && Object.getOwnPropertyDescriptor(mediaPrototype, "src");
    const originalAudio = frameWindow.Audio;

    const request = (reference, kind) => new Promise((resolve, reject) => {
        let path;
        try {
            path = resolveProjectResourcePath(reference);
        } catch (error) {
            reject(error);
            return;
        }
        const id = `project-resource-${++nextId}`;
        pending.set(id, { resolve, reject, path, kind });
        frameWindow.parent.postMessage({ type: "editor:project-resource-request", payload: { id, path, kind } }, "*");
    });

    const handleResponse = event => {
        const message = event.data;
        if (message?.type !== "editor:project-resource-response") return;
        const { id, content, error } = message.payload || {};
        const task = pending.get(id);
        if (!task) return;
        pending.delete(id);
        if (error) task.reject(new Error(`Could not load project ${task.kind} resource "${task.path}": ${error}`));
        else task.resolve(content);
    };
    frameWindow.addEventListener("message", handleResponse);

    if (originalFetch) {
        frameWindow.fetch = (input, init) => {
            const reference = typeof input === "string" ? input : input?.url;
            if (typeof reference !== "string" || /^(data:|blob:|https?:|\/)/i.test(reference)) return originalFetch(input, init);
            return request(reference, "text").then(content => new frameWindow.Response(content, {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }));
        };
    }

    if (imagePrototype && imageDescriptor?.set && imageDescriptor.get) {
        Object.defineProperty(imagePrototype, "src", {
            ...imageDescriptor,
            set(reference) {
                if (typeof reference !== "string" || /^(data:|blob:|https?:|\/)/i.test(reference)) {
                    imageDescriptor.set.call(this, reference);
                    return;
                }
                request(reference, "image")
                    .then(dataUri => imageDescriptor.set.call(this, dataUri))
                    .catch(error => frameWindow.console.error(`Could not load selected-project image: ${reference}`, error));
            }
        });
    }

    if (mediaPrototype && mediaDescriptor?.set && mediaDescriptor.get) {
        Object.defineProperty(mediaPrototype, "src", {
            ...mediaDescriptor,
            set(reference) {
                if (typeof reference !== "string" || /^(data:|blob:|https?:|\/)/i.test(reference)) {
                    mediaDescriptor.set.call(this, reference);
                    return;
                }
                request(reference, "audio")
                    .then(dataUri => mediaDescriptor.set.call(this, dataUri))
                    .catch(error => frameWindow.console.error(`Could not load selected-project audio: ${reference}`, error));
            }
        });
    }

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

    return () => {
        frameWindow.removeEventListener("message", handleResponse);
        if (originalFetch) frameWindow.fetch = originalFetch;
        if (imagePrototype && imageDescriptor) Object.defineProperty(imagePrototype, "src", imageDescriptor);
        if (mediaPrototype && mediaDescriptor) Object.defineProperty(mediaPrototype, "src", mediaDescriptor);
        if (originalAudio) frameWindow.Audio = originalAudio;
        for (const task of pending.values()) task.reject(new Error("Project resource bridge closed"));
        pending.clear();
    };
}
