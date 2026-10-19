import assert from "node:assert/strict"
import { test } from "node:test"

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
        assert.equal(app.isRunning, false)
        app.start()
        app.start()
        assert.equal(app.isRunning, true)
        assert.equal(frameQueue.length, 1)
        app.pause()
        assert.equal(app.isPaused, true)
        app.resume()
        assert.equal(app.isPaused, false)

        app.stop()
        assert.equal(app.isRunning, false)
        const staleFrame = frameQueue.shift()
        staleFrame(16)
        assert.equal(frameQueue.length, 0)

        app.start()
        assert.equal(app.isRunning, true)
        assert.equal(frameQueue.length, 1)
        app.stop()
    } finally {
        globalThis.document = previous.document
        globalThis.window = previous.window
        globalThis.requestAnimationFrame = previous.requestAnimationFrame
    }
})
