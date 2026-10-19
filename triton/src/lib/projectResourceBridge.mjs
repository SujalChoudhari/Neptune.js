export function resolveProjectResourcePath(reference) {
    if (typeof reference !== "string" || !reference.trim()) {
        throw new TypeError("Project resource path must be a non-empty string");
    }
    const path = reference.trim().replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
    if (path.split("/").some(part => part === "..") || !path) {
        throw new TypeError("Project resource path must stay inside the selected project");
    }
    return path;
}

export function installProjectResourceBridge(frameWindow = window) {
    const pending = new Map();
    let nextId = 0;
    const originalFetch = frameWindow.fetch?.bind(frameWindow);
    const imagePrototype = frameWindow.HTMLImageElement?.prototype;
    const imageSrcDescriptor = imagePrototype && Object.getOwnPropertyDescriptor(imagePrototype, "src");

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

    if (imagePrototype && imageSrcDescriptor?.set && imageSrcDescriptor.get) {
        Object.defineProperty(imagePrototype, "src", {
            ...imageSrcDescriptor,
            set(reference) {
                if (typeof reference !== "string" || /^(data:|blob:|https?:)/i.test(reference)) {
                    imageSrcDescriptor.set.call(this, reference);
                    return;
                }
                request(reference, "image")
                    .then(dataUri => imageSrcDescriptor.set.call(this, dataUri))
                    .catch(error => frameWindow.console.error("Could not load selected-project image:", reference, error));
            }
        });
    }

    return () => {
        frameWindow.removeEventListener("message", handleResponse);
        if (originalFetch) frameWindow.fetch = originalFetch;
        if (imagePrototype && imageSrcDescriptor) Object.defineProperty(imagePrototype, "src", imageSrcDescriptor);
        for (const task of pending.values()) task.reject(new Error("Project resource bridge closed"));
        pending.clear();
    };
}
