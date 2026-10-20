import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import vm from "node:vm"
import { buildSync } from "esbuild"
import { runRuntimeControl, runtimeControlBridgeScript } from "../src/lib/runtimeControlBridge.mjs"
import { runtimeSelectionBridgeScript } from "../src/lib/runtimeSelectionBridge.mjs"
import { runtimeConsoleBridgeScript } from "../src/lib/runtimeConsoleBridge.mjs"

const context = {
    clearRect() {},
    fillRect() {},
    save() {},
    restore() {}
}

function createElement(tag) {
    return {
        tagName: tag,
        style: {},
        attributes: {},
        listeners: [],
        setAttribute(name, value) { this.attributes[name] = value },
        addEventListener(name) { this.listeners.push(name) },
        removeEventListener() {},
        appendChild() {},
        focus() {},
        remove() {},
        getContext() { return context }
    }
}

test("Application playback controls pause, stop, and restart one frame loop", async () => {
    const previous = {
        document: globalThis.document,
        window: globalThis.window,
        requestAnimationFrame: globalThis.requestAnimationFrame
    }
    const elements = new Map()
    const document = {
        body: { appendChild(element) { elements.set(element.attributes.id, element) } },
        head: { appendChild() {} },
        getElementById(id) { return elements.get(id) || null },
        createElement
    }
    const frameQueue = []
    globalThis.document = document
    globalThis.window = {
        innerWidth: 640,
        innerHeight: 480,
        outerWidth: 640,
        outerHeight: 480,
        addEventListener() {},
        removeEventListener() {}
    }
    globalThis.requestAnimationFrame = callback => {
        frameQueue.push(callback)
        return frameQueue.length
    }

    try {
        const { Application } = await import("../../src/core/application.js")
        const app = new Application()
        const reportedStates = []
        const sendControl = (type, payload) => runRuntimeControl(app, type, payload, state => reportedStates.push(state))
        assert.equal(app.isRunning, false)
        assert.equal(sendControl("editor:play"), true)
        assert.equal(sendControl("editor:play"), true)
        assert.equal(app.isRunning, true)
        assert.equal(frameQueue.length, 1)
        assert.equal(sendControl("editor:pause", { paused: true }), true)
        assert.equal(app.isPaused, true)
        assert.equal(sendControl("editor:pause", { paused: false }), true)
        assert.equal(app.isPaused, false)

        assert.equal(sendControl("editor:stop"), true)
        assert.equal(app.isRunning, false)
        const staleFrame = frameQueue.shift()
        staleFrame(16)
        assert.equal(frameQueue.length, 0)

        assert.equal(sendControl("editor:play"), true)
        assert.equal(app.isRunning, true)
        assert.equal(frameQueue.length, 1)
        assert.equal(sendControl("editor:stop"), true)
        assert.deepEqual(reportedStates, [
            { isPlaying: true, isPaused: false },
            { isPlaying: true, isPaused: false },
            { isPlaying: true, isPaused: true },
            { isPlaying: true, isPaused: false },
            { isPlaying: false, isPaused: false },
            { isPlaying: true, isPaused: false },
            { isPlaying: false, isPaused: false }
        ])
    } finally {
        globalThis.document = previous.document
        globalThis.window = previous.window
        globalThis.requestAnimationFrame = previous.requestAnimationFrame
    }
})

test("Game View message bridge controls the real Application and forwards console/errors", async () => {
    const previous = {
        document: globalThis.document,
        window: globalThis.window,
        requestAnimationFrame: globalThis.requestAnimationFrame
    }
    const elements = new Map()
    const document = {
        body: { appendChild(element) { elements.set(element.attributes.id, element) } },
        head: { appendChild() {} },
        getElementById(id) { return elements.get(id) || null },
        createElement
    }
    const frameQueue = []
    const listeners = new Map()
    const parentMessages = []
    const parent = { postMessage(message) { parentMessages.push(message) } }
    const fakeWindow = {
        innerWidth: 640,
        innerHeight: 480,
        outerWidth: 640,
        outerHeight: 480,
        document,
        parent,
        addEventListener(type, handler) {
            const handlers = listeners.get(type) || []
            handlers.push(handler)
            listeners.set(type, handlers)
        },
        removeEventListener() {},
        dispatchEvent() {}
    }
    const runtimeConsole = { log() {}, info() {}, warn() {}, error() {} }
    globalThis.document = document
    globalThis.window = fakeWindow
    globalThis.requestAnimationFrame = callback => {
        frameQueue.push(callback)
        return frameQueue.length
    }

    try {
        const sourcefile = path.resolve("triton/src/components/panels/GameViewPanel.tsx")
        const external = [
            "react", "@tauri-apps/api/core", "../../../../src/neptune.js?url", "@/lib/projectResourceBridge.mjs?url",
            "@/lib/runtimeSelectionBridge.mjs", "@/lib/runtimeConsoleBridge.mjs", "@/lib/runtimeControlBridge.mjs"
        ]
        const bundle = buildSync({
            bundle: true,
            external,
            format: "cjs",
            platform: "node",
            write: false,
            stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "tsx", sourcefile, resolveDir: path.dirname(sourcefile) }
        }).outputFiles[0].text
        const react = {
            createElement: (type, props, ...children) => ({
                type,
                props: { ...(props || {}), ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) }
            }),
            useEffect() {},
            useRef: () => ({ current: null })
        }
        const modules = {
            react,
            "@tauri-apps/api/core": { invoke: async () => null },
            "../../../../src/neptune.js?url": "/assets/neptune.js",
            "@/lib/projectResourceBridge.mjs?url": "/assets/projectResourceBridge.mjs",
            "@/lib/runtimeSelectionBridge.mjs": { runtimeSelectionBridgeScript },
            "@/lib/runtimeConsoleBridge.mjs": { runtimeConsoleBridgeScript },
            "@/lib/runtimeControlBridge.mjs": { runtimeControlBridgeScript }
        }
        const componentModule = { exports: {} }
        vm.runInNewContext(bundle, {
            module: componentModule,
            exports: componentModule.exports,
            React: react,
            require: specifier => {
                if (!(specifier in modules)) throw new Error(`Unexpected GameViewPanel import: ${specifier}`)
                return modules[specifier]
            }
        })
        const tree = componentModule.exports.GameViewPanel()
        const find = node => {
            if (Array.isArray(node)) return node.map(find).find(Boolean) || null
            if (!node || typeof node !== "object") return null
            if (node.type === "iframe") return node
            return find(node.props?.children)
        }
        const iframe = find(tree)
        assert.ok(iframe)
        let script = iframe.props.srcDoc.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1]
        assert.ok(script)
        script = script.replace(/^\s*import\s+\{\s*installProjectResourceBridge\s*\}\s+from\s+["'][^"']+["'];/m,
            "const installProjectResourceBridge = () => {};")
        script = script.replace(/import\(["'][^"']+["']\)\.then\(wait\)\.catch\(\(error\) => \{[\s\S]*?\n\s*\}\);/, "wait();")
        assert.ok(!script.includes("import("), "test must exercise the embedded bridge without leaving dynamic imports")

        const { Application } = await import("../../src/core/application.js")
        const app = new Application()
        fakeWindow.game = app
        vm.runInNewContext(script, {
            window: fakeWindow,
            document,
            console: runtimeConsole,
            Event: class { constructor(type) { this.type = type } },
            CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail } },
            Promise,
            requestAnimationFrame: globalThis.requestAnimationFrame
        })
        const send = (type, payload) => {
            for (const handler of listeners.get("message") || []) handler({ source: parent, data: { type, payload } })
        }
        assert.equal(app.isRunning, false)
        send("editor:play")
        assert.equal(app.isRunning, true)
        assert.equal(frameQueue.length, 1)
        send("editor:pause", { paused: true })
        assert.equal(app.isPaused, true)
        send("editor:play")
        assert.equal(app.isPaused, false)
        assert.equal(frameQueue.length, 1)
        send("editor:pause", { paused: true })
        assert.equal(app.isPaused, true)
        send("editor:pause", { paused: false })
        assert.equal(app.isPaused, false)
        send("editor:stop")
        assert.equal(app.isRunning, false)
        frameQueue.shift()(16)
        assert.equal(frameQueue.length, 0)
        send("editor:play")
        assert.equal(app.isRunning, true)
        send("editor:stop")

        const states = parentMessages.filter(message => message.type === "game:state-update").map(message => ({
            isPlaying: message.payload.isPlaying,
            isPaused: message.payload.isPaused
        }))
        assert.deepEqual(states, [
            { isPlaying: true, isPaused: false },
            { isPlaying: true, isPaused: true },
            { isPlaying: true, isPaused: false },
            { isPlaying: true, isPaused: true },
            { isPlaying: true, isPaused: false },
            { isPlaying: false, isPaused: false },
            { isPlaying: true, isPaused: false },
            { isPlaying: false, isPaused: false }
        ])

        runtimeConsole.warn("runtime warning")
        runtimeConsole.error("runtime failure")
        for (const handler of listeners.get("error") || []) handler({ message: "uncaught", filename: "game.js", error: new Error("uncaught") })
        for (const handler of listeners.get("unhandledrejection") || []) handler({ reason: "rejected promise" })
        assert.ok(parentMessages.some(message => message.type === "editor:log" && message.detail.type === "warn" && message.detail.message === "runtime warning"))
        assert.ok(parentMessages.some(message => message.type === "editor:log" && message.detail.type === "error" && message.detail.message === "runtime failure"))
        assert.ok(parentMessages.some(message => message.type === "editor:diagnostic" && message.payload.code === "GAME_RUNTIME_ERROR"))
        assert.ok(parentMessages.some(message => message.type === "editor:diagnostic" && message.payload.code === "GAME_UNHANDLED_REJECTION"))
    } finally {
        globalThis.document = previous.document
        globalThis.window = previous.window
        globalThis.requestAnimationFrame = previous.requestAnimationFrame
    }
})
