import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useGameContext } from '@/context/GameContext';
import { useFileSystem } from '@/context/FileSystemContext';
import { EditorGameRunner } from './editorGameRunner';
import { createEditorExtensionHost, loadProjectEditorExtensions } from './editorExtensions.mjs';
import { clearEditorExtensions, publishEditorExtensions, type ExtensionHost } from './editorExtensionStore';

type Point = { x: number; y: number };
type Coordinates = {
    worldToScreen: (point: Point) => Point;
    screenToWorld: (point: Point) => Point;
};

/** Detached authoring queries: extensions never receive mutable game entities. */
export function queryDocumentEntity(id: string, parentId?: string | null) {
    const branch = EditorGameRunner.getEntityBranch(id);
    if (!branch) return null;
    const components = Array.isArray(branch.components) ? branch.components : [];
    const transform = branch.transform || components.find(component => component.type === 'Transform')?.props || {};
    return {
        id: branch.id, name: branch.name, active: branch.active !== false, parentId,
        transform: {
            position: transform.position || transform.pos || { x: 0, y: 0 },
            rotation: transform.rotation ?? transform.rot ?? 0,
            scale: transform.scale || { x: 1, y: 1 }
        },
        components: Object.fromEntries(components.map(component => [component.type, component.props || {}]))
    };
}

/** Opt-in code host. Scene tools remain owned by the editor, never the game. */
export function useEditorExtensions(coordinates: Coordinates) {
    const game = useGameContext();
    const { rootPath, readProject } = useFileSystem();
    const latest = useRef({ game, coordinates });
    latest.current = { game, coordinates };
    const [host, setHost] = useState<ExtensionHost | null>(null);
    const [revision, setRevision] = useState(0);
    const refresh = useCallback(() => setRevision(value => value + 1), []);
    const sceneId = game.currentScenePath;

    useEffect(() => {
        if (!rootPath || !sceneId) return;
        let live = true;
        const report = (entry: { message?: string; extensionId?: string; phase?: string }) => {
            if (!live) return;
            EditorGameRunner.report(new Error(`Editor extension ${entry.extensionId || ''} (${entry.phase || 'load'}): ${entry.message || 'Unknown failure'}`));
        };
        const next = createEditorExtensionHost({
            projectId: rootPath, sceneId,
            getSelection: () => [...latest.current.game.selectedIds],
            setSelection: ids => latest.current.game.selectEntities(ids),
            queryEntity: id => queryDocumentEntity(id, latest.current.game.entities[id]?.parentId),
            queryEntities: filter => Object.keys(latest.current.game.entities)
                .map(id => queryDocumentEntity(id, latest.current.game.entities[id]?.parentId))
                .filter(entity => entity !== null && (typeof filter !== 'function' || filter(entity))),
            worldToScreen: point => latest.current.coordinates.worldToScreen(point),
            screenToWorld: point => latest.current.coordinates.screenToWorld(point),
            commands: {
                updateComponent: (id, component, patch) => {
                    if (latest.current.game.isPlaying || !queryDocumentEntity(id)) return false;
                    for (const [field, value] of Object.entries(patch)) latest.current.game.updateComponent(id, component, field, value);
                    refresh();
                    return true;
                },
                runSceneEdit: (label, apply, revert) => latest.current.game.runSceneEdit(label, apply, revert),
                beginSceneEdit: label => latest.current.game.beginSceneEdit(label)
            },
            onDiagnostic: report,
            onChange: () => { if (live) refresh(); }
        });
        setHost(next);
        publishEditorExtensions(next);
        void (async () => {
            try {
                const project = await readProject();
                if (!live) return;
                const definitions = await loadProjectEditorExtensions(project, {
                    readEntry: path => invoke<string>('read_file', { path }),
                    importSource: async source => {
                        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
                        try { return await import(/* @vite-ignore */ url); }
                        finally { URL.revokeObjectURL(url); }
                    },
                    report
                });
                if (!live) return;
                definitions.forEach(definition => next.enable(definition));
                publishEditorExtensions(next);
                refresh();
            } catch (error) {
                report({ message: error instanceof Error ? error.message : String(error) });
            }
        })();
        return () => {
            live = false;
            clearEditorExtensions(next);
            next.dispose();
        };
    }, [rootPath, sceneId, readProject, refresh]);

    useEffect(() => {
        if (host) publishEditorExtensions(host);
    }, [host, revision]);

    return {
        host,
        registrations: (kind: string) => host?.registrations(kind) || [],
        drawings: () => host?.drawings() || [],
        overlayObjects: () => host?.overlayObjects() || [],
        refresh,
        reload: () => {
            if (!host) return;
            const ids = new Set(['tool', 'inspector', 'context-action'].flatMap(kind => host.registrations(kind).map(item => item.extensionId)));
            ids.forEach(id => host.reload(id));
            publishEditorExtensions(host);
            refresh();
        }
    };
}
