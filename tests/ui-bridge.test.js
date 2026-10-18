import { describe, it, expect } from './tester.js';
import { createHTMLUIClient, createUIBridge, installHTMLUI, installUINavigation } from '../src/ui/bridge.js';

function makeWindow(origin = 'https://game.example') {
    const listeners = new Set();
    const sent = [];
    const parent = { postMessage: (data, targetOrigin) => sent.push({ data, targetOrigin }) };
    return {
        location: { origin },
        parent,
        addEventListener(type, callback) { if (type === 'message') listeners.add(callback); },
        removeEventListener(type, callback) { if (type === 'message') listeners.delete(callback); },
        postMessage(data, targetOrigin) { sent.push({ data, targetOrigin }); },
        dispatch(event) { for (const callback of [...listeners]) callback(event); },
        sent,
        get listenerCount() { return listeners.size; }
    };
}

describe('HTML UI bridge', () => {
    it('sends allowlisted typed actions to the exact origin and dispatches them to the engine', () => {
        const target = makeWindow();
        const actions = ['dialogue:choose'];
        const game = createUIBridge({ window: target, origin: 'https://editor.example', targetOrigin: 'https://game.example', actions });
        const ui = createHTMLUIClient({ window: target, actions });
        const received = [];
        game.onAction('dialogue:choose', payload => received.push(payload));
        ui.emit('dialogue:choose', { choice: 2 });
        expect(target.sent[0].targetOrigin).toBe('https://game.example');
        expect(target.sent[0].data.version).toBe(1);
        expect(target.sent[0].data.direction).toBe('ui-to-engine');
        target.dispatch({ source: target.parent, origin: 'https://editor.example', data: target.sent[0].data });
        expect(received).toEqual([{ choice: 2 }]);
        expect(() => ui.emit('settings:save', {})).toThrow();
        game.destroy();
        ui.destroy();
        expect(target.listenerCount).toBe(0);
    });

    it('rejects messages from wrong source/origin, unknown action, and malformed payloads', () => {
        const target = makeWindow();
        const game = createUIBridge({ window: target, origin: 'https://editor.example', targetOrigin: 'https://game.example', actions: ['pause'] });
        const received = [];
        game.onAction('pause', payload => received.push(payload));
        const message = { __neptuneUiBridge__: true, version: 1, direction: 'ui-to-engine', name: 'pause', payload: { paused: true } };
        target.dispatch({ source: {}, origin: 'https://editor.example', data: message });
        target.dispatch({ source: target.parent, origin: 'https://evil.example', data: message });
        target.dispatch({ source: target.parent, origin: 'https://editor.example', data: { ...message, name: 'delete-everything' } });
        target.dispatch({ source: target.parent, origin: 'https://editor.example', data: { ...message, payload: { bad: Infinity } } });
        expect(received).toEqual([]);
        expect(() => createUIBridge({ window: target, origin: 'null', targetOrigin: '*' })).toThrow();
        game.destroy();
    });

    it('provides keyboard and controller navigation hooks over accessible focusable controls', () => {
        const callbacks = new Map();
        const controls = [
            { hidden: false, getAttribute: () => null, focus() { document.activeElement = this; } },
            { hidden: false, getAttribute: () => null, focus() { document.activeElement = this; } }
        ];
        const document = { activeElement: null };
        const root = {
            ownerDocument: document,
            addEventListener(type, callback) { callbacks.set(type, callback); },
            removeEventListener(type) { callbacks.delete(type); },
            querySelectorAll() { return controls; }
        };
        const commands = [];
        let controller;
        const cleanup = installUINavigation(root, { onNavigate: value => commands.push(value.index), gamepad: callback => { controller = callback; return () => { controller = null; }; } });
        const event = { key: 'ArrowDown', preventDefault() {} };
        callbacks.get('keydown')(event);
        expect(document.activeElement).toBe(controls[0]);
        controller('down');
        expect(document.activeElement).toBe(controls[1]);
        expect(commands).toEqual([0, 1]);
        cleanup();
        expect(callbacks.size).toBe(0);
        expect(controller).toBe(null);
    });

    it('receives engine state events in HTML and provides an install helper', () => {
        const target = makeWindow();
        const ui = createHTMLUIClient({ window: target, events: ['hud:update'] });
        const states = [];
        ui.on('hud:update', payload => states.push(payload));
        const message = { __neptuneUiBridge__: true, version: 1, direction: 'engine-to-ui', name: 'hud:update', payload: { health: 8 } };
        target.dispatch({ source: target.parent, origin: 'https://game.example', data: message });
        target.dispatch({ source: {}, origin: 'https://game.example', data: message });
        expect(states).toEqual([{ health: 8 }]);
        ui.destroy();

        const embedded = makeWindow();
        const installed = installHTMLUI({ window: embedded, actions: ['pause'] });
        expect(embedded.neptuneUI).toBe(installed);
        expect(() => installHTMLUI({ window: embedded })).toThrow();
        installed.destroy();
    });
});
