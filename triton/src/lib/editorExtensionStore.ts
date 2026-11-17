import { useSyncExternalStore } from 'react';
import type { createEditorExtensionHost } from './editorExtensions.mjs';

export type ExtensionHost = ReturnType<typeof createEditorExtensionHost>;
export type ExtensionRegistration = { extensionId: string; id: string; value: any };
type Snapshot = { host: ExtensionHost | null; inspectors: ExtensionRegistration[]; actions: ExtensionRegistration[] };
const empty: Snapshot = { host: null, inspectors: [], actions: [] };
let snapshot = empty;
const listeners = new Set<() => void>();

export function publishEditorExtensions(host: ExtensionHost) {
    snapshot = { host, inspectors: host.registrations('inspector'), actions: host.registrations('context-action') };
    listeners.forEach(listener => listener());
}

export function clearEditorExtensions(host: ExtensionHost) {
    if (snapshot.host !== host) return;
    snapshot = empty;
    listeners.forEach(listener => listener());
}

export function useEditorExtensionRegistrations() {
    return useSyncExternalStore(listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }, () => snapshot, () => empty);
}
