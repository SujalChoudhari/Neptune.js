// Mock Browser Environment
if (typeof global.document === 'undefined') {
    const listeners = {};

    global.window = {
        innerWidth: 1024,
        innerHeight: 768,
        outerWidth: 1024,
        outerHeight: 768,
        onresize: null,
        addEventListener: (event, callback) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },
        removeEventListener: (event, callback) => {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            }
        },
        dispatchEvent: (event) => {
            if (listeners[event.type]) {
                listeners[event.type].forEach(cb => cb(event));
            }
        }
    };

    const mockElement = {
        setAttribute: () => { },
        getAttribute: () => { },
        style: { display: 'none' },
        focus: () => { },
        getContext: () => ({
            clearRect: () => { },
            fillRect: () => { },
            save: () => { },
            restore: () => { },
            translate: () => { },
            fillStyle: '',
        }),
        addEventListener: global.window.addEventListener, // Share listeners for simplicity or separate if needed
        removeEventListener: global.window.removeEventListener,
        width: 1024,
        height: 768,
        remove: () => { },
    };

    global.document = {
        getElementById: (id) => {
            return mockElement;
        },
        createElement: (tag) => {
            return mockElement;
        },
        body: {
            appendChild: () => { }
        },
        head: {
            appendChild: () => { }
        }
    };
    global.KeyboardEvent = class {
        constructor(type, init) {
            this.type = type;
            this.keyCode = init.keyCode;
        }
    };
    global.performance = {
        now: () => Date.now()
    };

    global.Audio = class {
        constructor(src = "") {
            this.src = src;
            this.volume = 1;
            this.currentTime = 0;
            this.loop = false;
            this.autoplay = false;
            this.paused = true;
            this.playbackRate = 1;
        }

        play() {
            this.paused = false;
            return Promise.resolve();
        }

        pause() {
            this.paused = true;
        }

        load() {}

        addEventListener() {}

        removeEventListener() {}
    };
    global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

    const createStorage = () => {
        const store = new Map();
        return {
            getItem: (key) => (store.has(key) ? store.get(key) : null),
            setItem: (key, value) => store.set(String(key), String(value)),
            removeItem: (key) => store.delete(String(key)),
            clear: () => store.clear(),
        };
    };

    global.localStorage = createStorage();
    global.sessionStorage = createStorage();

    global.Image = class {
        constructor() {
            this._src = "";
            this.onload = null;
            this.onerror = null;
            this.width = 64;
            this.height = 64;
        }

        set src(value) {
            this._src = value;
            if (typeof this.onload === "function") {
                this.onload();
            }
        }

        get src() {
            return this._src;
        }
    };
}
