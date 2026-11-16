import { DockviewReact, themeDark, type DockviewReadyEvent, type DockviewApi } from 'dockview';
import 'dockview/dist/styles/dockview.css';
import { useRef, useEffect, useCallback } from 'react';
import { ProjectPanel } from '@/components/panels/ProjectPanel';
import { InspectorPanel } from '@/components/panels/InspectorPanel';
import { ConsolePanel } from '@/components/panels/ConsolePanel';
import { HierarchyPanel } from '@/components/panels/HierarchyPanel';
import { GameViewPanel } from '@/components/panels/GameViewPanel';
import { SceneViewPanel } from '@/components/panels/SceneViewPanel';
import { TilemapPanel } from '@/components/panels/TilemapPanel';
import { useSettings } from '@/components/context/SettingsContext';
import { useFileSystem } from '@/context/FileSystemContext';
import { editorLayoutKey, readEditorLayout, serializeEditorLayout } from '@/lib/editorLayout.mjs';

interface DockLayoutProps { onApiReady?: (api: DockviewApi) => void }

function fitWorkspacePanels(api: DockviewApi, resetSizes = false) {
    // Constraints are runtime state and are not preserved by Dockview JSON.
    // Apply them after restoring as well as after creating the full split tree.
    const hierarchy = api.getPanel('hierarchy');
    const inspector = api.getPanel('inspector');
    hierarchy?.api.setConstraints({ minimumWidth: 208 });
    inspector?.api.setConstraints({ minimumWidth: 264 });
    api.getPanel('scene')?.api.setConstraints({ minimumWidth: 280, minimumHeight: 180 });
    api.getPanel('console')?.api.setConstraints({ minimumHeight: 100 });
    if (resetSizes) {
        // Adding later groups redistributes earlier initialWidth allocations.
        hierarchy?.api.setSize({ width: 224 });
        inspector?.api.setSize({ width: 288 });
        api.getPanel('console')?.api.setSize({ height: 144 });
    } else {
        // A constraint change alone does not resize a restored group that is
        // already smaller than its new minimum. Repair the current dimensions.
        if (hierarchy && hierarchy.api.width < 208) hierarchy.api.setSize({ width: 208 });
        if (inspector && inspector.api.width < 264) inspector.api.setSize({ width: 264 });
    }
}

function createWorkspace(api: DockviewApi, debug = false) {
    api.clear();
    const scene = api.addPanel({ id: 'scene', component: 'scene', title: 'Scene View' });
    const game = api.addPanel({ id: 'game', component: 'game', title: 'Game View', position: { referencePanel: scene, direction: 'within' } });
    api.addPanel({ id: 'hierarchy', component: 'hierarchy', title: 'Hierarchy', position: { referencePanel: scene, direction: 'left' }, initialWidth: 224 });
    api.addPanel({ id: 'inspector', component: 'inspector', title: 'Inspector', position: { referencePanel: scene, direction: 'right' }, initialWidth: 288 });
    const consolePanel = api.addPanel({ id: 'console', component: 'console', title: 'Console', position: { referencePanel: scene, direction: 'below' }, initialHeight: 180 });
    const project = api.addPanel({ id: 'project', component: 'project', title: 'Project', position: { referencePanel: consolePanel, direction: 'within' } });
    api.addPanel({ id: 'tilemap', component: 'tilemap', title: 'Tilemap', position: { referencePanel: consolePanel, direction: 'within' } });
    fitWorkspacePanels(api, true);
    (debug ? consolePanel : project).api.setActive();
    (debug ? game : scene).api.setActive();
}

export const DockLayout = ({ onApiReady }: DockLayoutProps) => {
    const apiRef = useRef<DockviewApi | null>(null);
    const storageKeyRef = useRef<string | null>(null);
    const restoringRef = useRef(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const subscriptionRef = useRef<{ dispose(): void } | null>(null);
    const { rootPath } = useFileSystem();
    const { focusGameOnPlay, focusConsoleOnPlay, maximizeGameOnPlay } = useSettings();

    const saveWorkspace = useCallback(() => {
        const api = apiRef.current, key = storageKeyRef.current;
        if (!api || !key || restoringRef.current) return;
        try {
            const record = serializeEditorLayout(api.toJSON());
            if (record) localStorage.setItem(key, record);
        } catch { /* A storage quota or unavailable storage must not break authoring. */ }
    }, []);

    const restoreWorkspace = useCallback((api: DockviewApi, path: string | null) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        restoringRef.current = true;
        storageKeyRef.current = editorLayoutKey(path);
        try {
            const record = storageKeyRef.current ? localStorage.getItem(storageKeyRef.current) : null;
            const layout = readEditorLayout(record);
            if (layout) {
                try { api.fromJSON(layout); fitWorkspacePanels(api); return; } catch { /* Default workspace repairs incompatible layouts. */ }
            }
            createWorkspace(api);
        } catch { createWorkspace(api); }
        finally { restoringRef.current = false; }
    }, []);

    const applyLayout = useCallback((type: 'default' | 'animation' | 'debug') => {
        const api = apiRef.current;
        if (!api) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        restoringRef.current = true;
        try {
            if (storageKeyRef.current) localStorage.removeItem(storageKeyRef.current);
        } catch { /* Reset remains usable when storage is unavailable. */ }
        try {
            // No fake Timeline/Atlas panels: legacy animation requests use the
            // real authoring workspace until animation authoring is implemented.
            createWorkspace(api, type === 'debug');
        } finally { restoringRef.current = false; }
        saveWorkspace();
    }, [saveWorkspace]);

    useEffect(() => {
        if (apiRef.current) {
            saveWorkspace();
            restoreWorkspace(apiRef.current, rootPath);
        }
    }, [rootPath, restoreWorkspace, saveWorkspace]);

    useEffect(() => {
        const onPlay = () => {
            const api = apiRef.current;
            if (!api) return;
            const game = api.getPanel('game');
            if (focusGameOnPlay) game?.api.setActive();
            if (focusConsoleOnPlay) api.getPanel('console')?.api.setActive();
            if (maximizeGameOnPlay && game) api.maximizeGroup(game);
        };
        const onStop = () => { if (maximizeGameOnPlay) apiRef.current?.exitMaximizedGroup(); };
        window.addEventListener('editor:play', onPlay);
        window.addEventListener('editor:stop', onStop);
        return () => { window.removeEventListener('editor:play', onPlay); window.removeEventListener('editor:stop', onStop); };
    }, [focusGameOnPlay, focusConsoleOnPlay, maximizeGameOnPlay]);

    useEffect(() => () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveWorkspace();
        subscriptionRef.current?.dispose();
    }, [saveWorkspace]);

    const onReady = (event: DockviewReadyEvent) => {
        apiRef.current = event.api;
        const api = event.api as NeptuneDockApi;
        api.applyLayout = applyLayout;
        restoreWorkspace(api, rootPath);
        subscriptionRef.current?.dispose();
        subscriptionRef.current = api.onDidLayoutChange(() => {
            if (restoringRef.current) return;
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(saveWorkspace, 200);
        });
        onApiReady?.(api);
    };

    return (
        <div className="h-full w-full min-w-0 min-h-0 relative flex flex-col border-t border-border" data-workspace-layout>
            <button type="button" className="absolute right-1 top-1 z-40 h-5 rounded-[3px] border border-border bg-card px-1 text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-primary" onClick={() => applyLayout('default')} title="Restore the default panel arrangement">Reset layout</button>
            <DockviewReact components={componentMap} onReady={onReady} theme={themeDark} className="dockview-theme-dark flex-1 min-w-0 min-h-0" />
        </div>
    );
};

const componentMap = { hierarchy: HierarchyPanel, inspector: InspectorPanel, console: ConsolePanel, project: ProjectPanel, game: GameViewPanel, scene: SceneViewPanel, tilemap: TilemapPanel };
export type NeptuneDockApi = DockviewApi & { applyLayout: (type: 'default' | 'animation' | 'debug') => void };
export type { DockviewApi };
