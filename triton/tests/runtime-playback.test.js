import assert from "node:assert/strict"
import { test } from "node:test"
import { runRuntimeControl } from "../src/lib/runtimeControlBridge.mjs"

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
