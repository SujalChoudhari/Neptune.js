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
    global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
}
