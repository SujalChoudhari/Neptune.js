import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import vm from "node:vm"
import { buildSync } from "esbuild"
import { Entity } from "../../src/core/entity.js"
import { Scene } from "../../src/core/scene.js"
import { SceneManager } from "../../src/core/sceneManager.js"
import { Sprite } from "../../src/rendering/sprite.js"
import { Transform } from "../../src/components/transform.js"
import { Vector2 } from "../../src/math/vec2.js"
import { getPlayAction, runRuntimeControl, runtimeControlBridgeScript } from "../src/lib/runtimeControlBridge.mjs"
import { runtimeSelectionBridgeScript } from "../src/lib/runtimeSelectionBridge.mjs"
import { runtimeConsoleBridgeScript } from "../src/lib/runtimeConsoleBridge.mjs"

test("Play resumes paused playback without starting a new session", () => {
    assert.deepEqual(getPlayAction(false, false), {
        type: "editor:play", payload: null, startsNewSession: true
    })
    assert.deepEqual(getPlayAction(true, true), {
        type: "editor:pause", payload: { paused: false }, startsNewSession: false
    })
})

const context = {
    clearRect() {},
    fillRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage() {}
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

test("EditorToolbar Play, Pause, and Stop buttons control the runtime Application", async () => {
    const previous = {
        document: globalThis.document,
        window: globalThis.window,
        requestAnimationFrame: globalThis.requestAnimationFrame
    }
    const elements = new Map()
    globalThis.document = {
        body: { appendChild(element) { elements.set(element.attributes.id, element) } },
        head: { appendChild() {} },
        getElementById(id) { return elements.get(id) || null },
        createElement
    }
    globalThis.window = {
        innerWidth: 640,
        innerHeight: 480,
        outerWidth: 640,
        outerHeight: 480,
        addEventListener() {},
        removeEventListener() {}
    }
    globalThis.requestAnimationFrame = () => 1

    try {
        const { Application } = await import("../../src/core/application.js")
        const app = new Application()
        const runtimeState = { isPlaying: false, isPaused: false }
        const controlMessages = []
        const send = (type, payload) => {
            controlMessages.push({ type, payload: payload ?? null })
            return runRuntimeControl(app, type, payload, state => Object.assign(runtimeState, state))
        }
        const sourcefile = path.resolve("triton/src/components/layout/EditorToolbar.tsx")
        const bundle = buildSync({
            bundle: true,
            external: ["react", "react/jsx-runtime", "@/components/library", "lucide-react", "@/components/dialogs/SettingsDialog", "@/context/GameContext", "@/lib/utils"],
            format: "cjs",
            platform: "node",
            write: false,
            stdin: { contents: fs.readFileSync(sourcefile, "utf8"), loader: "tsx", sourcefile, resolveDir: path.dirname(sourcefile) }
        }).outputFiles[0].text
        const react = { createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children: children.length > 1 ? children : children[0] } }) }
        const modules = {
            react,
            "react/jsx-runtime": { jsx: react.createElement, jsxs: react.createElement },
            "@/components/library": { ThemedIconButton: "ThemedIconButton", useModal: () => ({ showModal() {} }) },
            "lucide-react": new Proxy({}, { get: (_target, name) => String(name) }),
            "@/components/dialogs/SettingsDialog": { SettingsModalContent: "SettingsModalContent" },
            "@/context/GameContext": { useGameContext: () => ({
                play: () => {
                    const action = getPlayAction(runtimeState.isPlaying, runtimeState.isPaused)
                    return send(action.type, action.payload)
                },
                pause: () => send("editor:pause", { paused: !runtimeState.isPaused }),
                stop: () => send("editor:stop"),
                ...runtimeState,
                currentSceneName: "Main",
                markAsMainScene() {},
                mainScenePath: "scenes/main.scene",
                currentScenePath: "scenes/main.scene"
            }) },
            "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") }
        }
        const componentModule = { exports: {} }
        vm.runInNewContext(bundle, {
            module: componentModule,
            exports: componentModule.exports,
            React: react,
            require: specifier => {
                if (!(specifier in modules)) throw new Error(`Unexpected EditorToolbar import: ${specifier}`)
                return modules[specifier]
            }
        })
        const render = () => componentModule.exports.EditorToolbar()
        const findButton = (tree, title) => {
            const visit = node => {
                if (Array.isArray(node)) return node.map(visit).find(Boolean) || null
                if (!node || typeof node !== "object") return null
                if (node.type === "ThemedIconButton" && node.props?.title === title) return node
                return visit(node.props?.children)
            }
            return visit(tree)
        }

        assert.equal(findButton(render(), "Pause").props.disabled, true)
        assert.equal(findButton(render(), "Stop").props.disabled, true)
        findButton(render(), "Play").props.onClick()
        assert.equal(app.isRunning, true)
        assert.equal(findButton(render(), "Play").props.disabled, true)
        assert.equal(findButton(render(), "Pause").props.disabled, false)

        findButton(render(), "Pause").props.onClick()
        assert.equal(app.isPaused, true)
        findButton(render(), "Play").props.onClick()
        assert.equal(app.isPaused, false)
        findButton(render(), "Stop").props.onClick()
        assert.equal(app.isRunning, false)
        assert.deepEqual(runtimeState, { isPlaying: false, isPaused: false })
        assert.deepEqual(controlMessages, [
            { type: "editor:play", payload: null },
            { type: "editor:pause", payload: { paused: true } },
            { type: "editor:pause", payload: { paused: false } },
            { type: "editor:stop", payload: null }
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
        requestAnimationFrame: globalThis.requestAnimationFrame,
        Image: globalThis.Image
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
        dispatchEvent(event) {
            for (const handler of listeners.get(event.type) || []) handler(event)
        }
    }
    const runtimeConsole = { log() {}, info() {}, warn() {}, error() {} }
    globalThis.document = document
    globalThis.window = fakeWindow
    globalThis.requestAnimationFrame = callback => {
        frameQueue.push(callback)
        return frameQueue.length
    }
    globalThis.Image = class {}

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
        elements.set("neptune-canvas", {
            width: 640,
            height: 480,
            getBoundingClientRect: () => ({ left: 10, top: 20, width: 640, height: 480 })
        })
        SceneManager.removeAllScenes()
        const scene = new Scene("Pointer selection smoke")
        scene.activeCamera = { screenToWorld: (x, y) => ({ x, y }), apply() {} }
        const hero = new Entity("Hero")
        hero.AddComponent(new Transform(new Vector2(1, 1)))
        hero.AddComponent(new Sprite("hero.png", 1, 1))
        scene.AddChild(hero)
        SceneManager.LoadScene(scene.id)
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
        const pointerDown = (clientX, clientY) => {
            for (const handler of listeners.get("pointerdown") || []) handler({
                target: elements.get("neptune-canvas"),
                button: 0,
                clientX,
                clientY
            })
        }
        pointerDown(74, 84)
        pointerDown(200, 200)
        const selections = parentMessages.filter(message => message.type === "game:selection-changed")
        assert.deepEqual(selections.map(message => Array.from(message.payload.ids)), [[hero.id], []])
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
        for (const handler of listeners.get("unhandledrejection") || []) handler({ reason: { message: "structured rejection failure" } })
        assert.ok(parentMessages.some(message => message.type === "editor:log" && message.detail.type === "warn" && message.detail.message === "runtime warning"))
        assert.ok(parentMessages.some(message => message.type === "editor:log" && message.detail.type === "error" && message.detail.message === "runtime failure"))
        assert.ok(parentMessages.some(message => message.type === "editor:diagnostic" && message.payload.code === "GAME_RUNTIME_ERROR"))
        assert.ok(parentMessages.some(message => message.type === "editor:diagnostic" && message.payload.code === "GAME_UNHANDLED_REJECTION"))
        assert.ok(parentMessages.some(message => message.type === "editor:diagnostic" && message.payload.code === "GAME_UNHANDLED_REJECTION" && message.payload.message === "structured rejection failure"))
    } finally {
        globalThis.document = previous.document
        globalThis.window = previous.window
        globalThis.requestAnimationFrame = previous.requestAnimationFrame
        globalThis.Image = previous.Image
    }
})
