
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { SceneEntity, EntityData } from "../types/engine";
import type { VersionedScenePayload } from "./FileSystemContext";
import { EditorGameRunner } from "../lib/editorGameRunner";
import { getPlayAction, readRuntimeState } from "../lib/runtimeControlBridge.mjs";
import { moveHierarchyEntities } from "../lib/moveHierarchyEntities.mjs";
import { isRuntimeViewMessageSource, readRuntimeMessage, readRuntimeSelection } from "../lib/runtimeSelectionBridge.mjs";
import { createEditHistory } from "../lib/editHistory.mjs";
import { isSceneShortcutTargetBlocked } from "../lib/sceneTools.mjs";

interface GameContextType {
    isPlaying: boolean;
    isPaused: boolean;
    currentSceneName: string;
    entities: Record<string, SceneEntity>;
    selectedIds: string[];
    selectedEntitiesData: Record<string, EntityData>;
    entityDataCache: Record<string, EntityData>;
    selectedEntityData: EntityData | null; // Computed helper for backward compat

    // Actions
    play: () => void;
    pause: () => void;
    stop: () => void;
    selectEntity: (id: string, multi: boolean) => void;
    selectEntities: (ids: string[]) => void;
    setEntityExpansion: (ids: string[], expanded: boolean) => void;
    moveEntities: (ids: string[], targetParentId: string, index?: number) => void;
    addEntityToHierarchy: (entity: SceneEntity, components?: Array<{ type: string; props?: Record<string, any> }>) => boolean;
    addEntityBranchToHierarchy: (branch: Record<string, any>, parentId: string, afterId?: string) => boolean;
    renameEntityInHierarchy: (id: string, name: string) => void;
    removeEntityFromHierarchy: (id: string) => void;
    setEntityActiveInHierarchy: (id: string, active: boolean) => void;
    setEntityLocked: (id: string, locked: boolean) => void;
    updateComponent: (id: string, component: string, field: string, value: any) => void;
    addComponent: (id: string, type: string, props?: Record<string, unknown>) => boolean;
    removeComponent: (id: string, type: string) => boolean;
    runSceneEdit: (label: string, apply: () => void | boolean, revert: () => void | boolean) => boolean;
    beginSceneEdit: (label: string) => { commit(): boolean; cancel(): boolean };
    undoSceneEdit: () => boolean;
    redoSceneEdit: () => boolean;
    canUndo: boolean;
    canRedo: boolean;
    duplicateEntityInHierarchy: (id: string) => string | null;
    deleteEntitiesInHierarchy: (ids: string[]) => boolean;
    markAsMainScene: () => void;

    // Internal Bridge
    notifyGame: (type: string, payload?: any) => void;
    loadScene: (path: string) => Promise<void>;
    addTilemapLayer: (path: string) => boolean;
    loadMainScene: () => Promise<void>;
    saveScene: (scene?: VersionedScenePayload) => Promise<boolean>;

    // State
    mainScenePath: string | null;
    currentScenePath: string | null;
}

const GameContext = createContext<GameContextType | null>(null);

function reportActivity(message: string, type: 'info' | 'error' | 'pending' | 'ready' = 'info') {
    window.dispatchEvent(new CustomEvent('editor:activity', { detail: { message, type } }));
}

function cloneEditValue<T>(value: T): T {
    return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function normalizeComponentName(component: string) {
    return component.toLowerCase() === 'collider' ? 'BoxCollider' : component;
}

import { useFileSystem } from "./FileSystemContext";

function hierarchyEntityData(entity: { id: string; name: string; active?: boolean; transform?: Record<string, any>; components?: Array<{ type: string; props?: Record<string, any> }> }): EntityData {
    const components = entity.components || [];
    const transform = entity.transform || components.find(component => component.type.toLowerCase() === 'transform')?.props || {};
    const position = transform.position || transform.pos || { x: 0, y: 0 };
    const scale = transform.scale || { x: 1, y: 1 };
    return {
        id: entity.id, name: entity.name, active: entity.active !== false,
        transform: {
            position: { x: position.x ?? 0, y: position.y ?? 0 },
            rotation: transform.rotation ?? transform.rot ?? 0,
            scale: { x: scale.x ?? 1, y: scale.y ?? 1 }, z: transform.z ?? 0
        },
        components: Object.fromEntries(components.map(component => [component.type, component.props || {}]))
    };
}

export function GameProvider({ children }: { children: ReactNode }) {
    const { readScene, readProject, writeProject, writeScene, rootPath } = useFileSystem();

    const toProjectRelativePath = useCallback((path: string) => {
        if (!rootPath) return path;
        const normalizedPath = path.replace(/\\/g, '/');
        const normalizedRoot = rootPath.replace(/\\/g, '/').replace(/\/$/, '');
        if (normalizedPath === normalizedRoot) return ".";
        if (normalizedPath.startsWith(`${normalizedRoot}/`)) {
            return normalizedPath.slice(normalizedRoot.length + 1);
        }
        return path;
    }, [rootPath]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSceneName, setCurrentSceneName] = useState("Untitled");
    const [currentScenePath, setCurrentScenePath] = useState<string | null>(null);
    const [mainScenePath, setMainScenePath] = useState<string | null>(null);
    const sceneLoadSequence = useRef(0);
    const projectSequence = useRef(0);

    // Hierarchy State
    const [entities, setEntities] = useState<Record<string, SceneEntity>>({});
    const entitiesRef = useRef(entities);
    entitiesRef.current = entities;
    const [entityDataCache, setEntityDataCache] = useState<Record<string, EntityData>>({});
    const entityDataCacheRef = useRef(entityDataCache);
    entityDataCacheRef.current = entityDataCache;

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedEntitiesData, setSelectedEntitiesData] = useState<Record<string, EntityData>>({});
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const historyRef = useRef<ReturnType<typeof createEditHistory> | null>(null);
    if (!historyRef.current) historyRef.current = createEditHistory({ onChange: state => {
        setCanUndo(state.canUndo);
        setCanRedo(state.canRedo);
    } });
    const history = historyRef.current;

    const runSceneEdit = useCallback((label: string, apply: () => void | boolean, revert: () => void | boolean) =>
        isPlaying ? false : history.run(label, () => {
            const changed = apply();
            if (changed !== false) EditorGameRunner.refreshDirtyState();
            return changed;
        }, () => {
            const restored = revert();
            if (restored === false) return false;
            EditorGameRunner.refreshDirtyState();
            return true;
        }), [history, isPlaying]);
    const beginSceneEdit = useCallback((label: string) => isPlaying
        ? { commit: () => false, cancel: () => false }
        : history.begin(label), [history, isPlaying]);
    const undoSceneEdit = useCallback(() => isPlaying ? false : history.undo(), [history, isPlaying]);
    const redoSceneEdit = useCallback(() => isPlaying ? false : history.redo(), [history, isPlaying]);

    const notifyGame = useCallback((type: string, payload?: any) => {
        const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[title="Game View"], iframe[title="Scene View"]');
        iframes.forEach(frame => frame.contentWindow?.postMessage({ type, payload, projectSession: projectSequence.current }, '*'));
    }, []);

    useEffect(() => {
        const shortcut = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.altKey || isSceneShortcutTargetBlocked(event.target)
                || isSceneShortcutTargetBlocked(document.activeElement) || document.querySelector('[role="dialog"], dialog[open]')) return;
            const key = event.key.toLowerCase();
            if (key === 'z' && event.shiftKey || key === 'y') {
                event.preventDefault();
                redoSceneEdit();
            } else if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undoSceneEdit();
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, [redoSceneEdit, undoSceneEdit]);

    const projectEntityToHierarchy = useCallback((entity: SceneEntity, components: Array<{ type: string; props?: Record<string, any> }> = []) => {
        const previous = entitiesRef.current;
        if (previous[entity.id]) return;
        const parentId = entity.parentId && previous[entity.parentId] ? entity.parentId : 'root';
        const parent = previous[parentId];
        if (!parent) return;
        const next = {
            ...previous,
            [parentId]: { ...parent, children: [...parent.children, entity.id] },
            [entity.id]: { ...entity, parentId, children: [...(entity.children || [])] }
        };
        entitiesRef.current = next;
        setEntities(next);
        setEntityDataCache(previous => {
            if (previous[entity.id]) return previous;
            const data = hierarchyEntityData({ ...entity, components });
            return { ...previous, [entity.id]: data };
        });
    }, []);

    const projectDropBranch = useCallback((id: string) => {
        const before = entitiesRef.current;
        const removed = new Set<string>();
        const collect = (entityId: string) => { if (removed.has(entityId)) return; removed.add(entityId); before[entityId]?.children.forEach(collect); };
        collect(id);
        const next = { ...before };
        const parentId = before[id]?.parentId;
        if (parentId && next[parentId]) next[parentId] = { ...next[parentId], children: next[parentId].children.filter(child => child !== id) };
        removed.forEach(entityId => delete next[entityId]);
        entitiesRef.current = next;
        setEntities(next);
        const without = <T,>(previous: Record<string, T>) => Object.fromEntries(Object.entries(previous).filter(([key]) => !removed.has(key)));
        entityDataCacheRef.current = without(entityDataCacheRef.current);
        setEntityDataCache(entityDataCacheRef.current);
        setSelectedEntitiesData(without);
        setSelectedIds(previous => previous.filter(selected => !removed.has(selected)));
    }, []);

    const addEntityToHierarchy = useCallback((entity: SceneEntity, components: Array<{ type: string; props?: Record<string, any> }> = []) => {
        const parentId = entity.parentId && entities[entity.parentId] ? entity.parentId : 'root';
        const persistenceParentId = EditorGameRunner.resolveHierarchyParentId(parentId, entities);
        if (!persistenceParentId) return false;
        const mutation = {
            id: entity.id, name: entity.name, type: entity.type, active: entity.active,
            transform: { pos: { x: 0, y: 0 }, rot: 0, scale: { x: 1, y: 1 } }, components
        };
        return runSceneEdit(`Create ${entity.name}`, () => {
            if (!EditorGameRunner.createEntity(persistenceParentId, mutation)) return false;
            projectEntityToHierarchy({ ...entity, parentId }, components);
            notifyGame('editor:create-entity', { ...mutation, parentId: persistenceParentId });
            return true;
        }, () => {
            EditorGameRunner.deleteEntity(entity.id);
            projectDropBranch(entity.id);
            notifyGame('editor:delete', { id: entity.id });
        });
    }, [entities, notifyGame, projectDropBranch, projectEntityToHierarchy, runSceneEdit]);

    const projectRename = useCallback((id: string, name: string) => {
        const previous = entitiesRef.current;
        if (previous[id]) {
            entitiesRef.current = { ...previous, [id]: { ...previous[id], name } };
            setEntities(entitiesRef.current);
        }
        if (entityDataCacheRef.current[id]) {
            entityDataCacheRef.current = { ...entityDataCacheRef.current, [id]: { ...entityDataCacheRef.current[id], name } };
            setEntityDataCache(entityDataCacheRef.current);
        }
        setSelectedEntitiesData(previous => previous[id] ? { ...previous, [id]: { ...previous[id], name } } : previous);
    }, []);

    const renameEntityInHierarchy = useCallback((id: string, name: string) => {
        const oldName = entities[id]?.name;
        if (!oldName || !name.trim() || oldName === name) return;
        runSceneEdit(`Rename ${oldName}`, () => {
            if (!EditorGameRunner.updateEntity(id, 'name', { value: name })) return false;
            projectRename(id, name);
            notifyGame('editor:rename', { id, name });
            reportActivity(`${name}: renamed · unsaved`);
            return true;
        }, () => {
            EditorGameRunner.updateEntity(id, 'name', { value: oldName });
            projectRename(id, oldName);
            notifyGame('editor:rename', { id, name: oldName });
        });
    }, [entities, notifyGame, projectRename, runSceneEdit]);

    const projectActive = useCallback((id: string, active: boolean) => {
        const previous = entitiesRef.current;
        if (previous[id]) {
            entitiesRef.current = { ...previous, [id]: { ...previous[id], active } };
            setEntities(entitiesRef.current);
        }
        if (entityDataCacheRef.current[id]) {
            entityDataCacheRef.current = { ...entityDataCacheRef.current, [id]: { ...entityDataCacheRef.current[id], active } };
            setEntityDataCache(entityDataCacheRef.current);
        }
        setSelectedEntitiesData(previous => previous[id] ? { ...previous, [id]: { ...previous[id], active } } : previous);
    }, []);

    const setEntityActiveInHierarchy = useCallback((id: string, active: boolean) => {
        const before = entities[id]?.active;
        if (before === undefined || before === active) return;
        runSceneEdit(`${active ? 'Activate' : 'Deactivate'} ${entities[id]?.name || 'entity'}`, () => {
            if (!EditorGameRunner.updateEntity(id, 'active', { value: active })) return false;
            projectActive(id, active);
            notifyGame('editor:set-active', { id, active });
            reportActivity(`${entities[id]?.name || 'Entity'}: ${active ? 'active' : 'inactive'} · unsaved`);
            return true;
        }, () => {
            EditorGameRunner.updateEntity(id, 'active', { value: before });
            projectActive(id, before);
            notifyGame('editor:set-active', { id, active: before });
        });
    }, [entities, notifyGame, projectActive, runSceneEdit]);

    const setEntityLocked = useCallback((id: string, locked: boolean) => {
        const before = entities[id]?.locked;
        if (before === undefined || before === locked) return;
        const update = (value: boolean) => {
            const previous = entitiesRef.current;
            if (previous[id] && previous[id].locked !== value) {
                entitiesRef.current = { ...previous, [id]: { ...previous[id], locked: value } };
                setEntities(entitiesRef.current);
            }
        };
        runSceneEdit(`${locked ? 'Lock' : 'Unlock'} ${entities[id]?.name || 'entity'}`, () => { update(locked); return true; }, () => update(before));
    }, [entities, runSceneEdit]);

    const projectEntityBranch = useCallback((branch: Record<string, any>, parentId: string, afterId?: string) => {
        const additions: Record<string, SceneEntity> = {};
        const data: Record<string, EntityData> = {};
        const visit = (node: Record<string, any>, nodeParentId: string): boolean => {
            if (typeof node?.id !== 'string' || additions[node.id]) return false;
            const children = Array.isArray(node.children) ? node.children : [];
            additions[node.id] = {
                id: node.id, parentId: nodeParentId, name: node.name || 'Entity',
                type: node.type || 'entity', children: [], active: node.active !== false,
                locked: false, expanded: false
            };
            data[node.id] = hierarchyEntityData(node as Parameters<typeof hierarchyEntityData>[0]);
            for (const child of children) {
                if (!visit(child, node.id)) return false;
                additions[node.id].children.push(child.id);
            }
            return true;
        };
        if (!entitiesRef.current[parentId] || !visit(branch, parentId)) return;
        const previous = entitiesRef.current;
        if (Object.keys(additions).some(id => previous[id])) return;
        const parent = previous[parentId];
        if (!parent || previous[branch.id]) return;
        const children = [...parent.children];
        const sourceIndex = afterId ? children.indexOf(afterId) : -1;
        children.splice(sourceIndex === -1 ? children.length : sourceIndex + 1, 0, branch.id);
        const next = { ...previous, [parentId]: { ...parent, children }, ...additions };
        entitiesRef.current = next;
        setEntities(next);
        entityDataCacheRef.current = { ...entityDataCacheRef.current, ...data };
        setEntityDataCache(entityDataCacheRef.current);
    }, []);

    const projectRemoveEntityFromHierarchy = useCallback((id: string) => {
        if (id === 'root' || !entitiesRef.current[id]) return;
        projectDropBranch(id);
    }, [projectDropBranch]);

    const addEntityBranchToHierarchy = useCallback((branch: Record<string, any>, parentId: string, afterId?: string) => {
        const persistenceParent = EditorGameRunner.resolveHierarchyParentId(parentId, entities);
        if (!persistenceParent || !branch?.id) return false;
        const siblings = entities[parentId]?.children || [];
        const siblingIndex = afterId ? siblings.indexOf(afterId) + 1 : siblings.length;
        const persist = () => EditorGameRunner.insertEntityBranch(persistenceParent, branch, siblingIndex);
        return runSceneEdit(`Add ${branch.name || 'entity'} branch`, () => {
            if (!persist()) return false;
            projectEntityBranch(branch, parentId, afterId);
            notifyGame('editor:load-scene', { data: EditorGameRunner.currentScene });
            return true;
        }, () => {
            EditorGameRunner.deleteEntity(branch.id);
            projectRemoveEntityFromHierarchy(branch.id);
            notifyGame('editor:delete', { id: branch.id });
        });
    }, [entities, notifyGame, projectEntityBranch, projectRemoveEntityFromHierarchy, runSceneEdit]);

    const removeEntityFromHierarchy = useCallback((id: string) => {
        if (id === 'root' || !entities[id]) return;
        const parentId = entities[id].parentId || 'root';
        const persistenceParent = EditorGameRunner.resolveHierarchyParentId(parentId, entities);
        const siblings = entities[parentId]?.children || [];
        const index = siblings.indexOf(id);
        const branch = EditorGameRunner.getEntityBranch(id);
        if (!persistenceParent || !branch) return;
        return runSceneEdit(`Delete ${entities[id].name}`, () => {
            if (!EditorGameRunner.deleteEntity(id)) return false;
            projectRemoveEntityFromHierarchy(id);
            notifyGame('editor:delete', { id });
            return true;
        }, () => {
            EditorGameRunner.insertEntityBranch(persistenceParent, branch, index);
            projectEntityBranch(branch, parentId, siblings[index - 1]);
            notifyGame('editor:load-scene', { data: EditorGameRunner.currentScene });
        });
    }, [entities, notifyGame, projectEntityBranch, projectRemoveEntityFromHierarchy, runSceneEdit]);

    const duplicateEntityInHierarchy = useCallback((id: string) => {
        const source = entities[id];
        if (!source) return null;
        const parentId = source.parentId || 'root';
        const persistenceParent = EditorGameRunner.resolveHierarchyParentId(parentId, entities);
        if (!persistenceParent) return null;
        const branchRef: { current: Record<string, any> | null } = { current: null };
        const siblings = entities[parentId]?.children || [];
        const index = siblings.indexOf(id) + 1;
        const ok = runSceneEdit(`Duplicate ${source.name}`, () => {
            if (!branchRef.current) branchRef.current = EditorGameRunner.duplicateEntity(id);
            else if (!EditorGameRunner.insertEntityBranch(persistenceParent, branchRef.current, index)) return false;
            if (!branchRef.current) return false;
            projectEntityBranch(branchRef.current, parentId, id);
            notifyGame('editor:load-scene', { data: EditorGameRunner.currentScene });
            return true;
        }, () => {
            const branch = branchRef.current;
            if (!branch || !EditorGameRunner.deleteEntity(branch.id)) return false;
            projectDropBranch(branch.id);
            notifyGame('editor:delete', { id: branch.id });
            return true;
        });
        return ok ? branchRef.current?.id || null : null;
    }, [entities, notifyGame, projectDropBranch, projectEntityBranch, runSceneEdit]);

    const deleteEntitiesInHierarchy = useCallback((ids: string[]) => {
        const selected = [...new Set(ids)].filter(id => entities[id] && id !== 'root');
        const selectedSet = new Set(selected);
        const topLevel = selected.filter(id => {
            let parent = entities[id]?.parentId || null;
            while (parent) { if (selectedSet.has(parent)) return false; parent = entities[parent]?.parentId || null; }
            return true;
        });
        const items = topLevel.map(id => {
            const parentId = entities[id]?.parentId || 'root';
            return {
                id, parentId,
                parent: EditorGameRunner.resolveHierarchyParentId(parentId, entities),
                index: (entities[parentId]?.children || []).indexOf(id),
                branch: EditorGameRunner.getEntityBranch(id)
            };
        }).filter(item => item.parent && item.branch);
        if (!items.length) return false;
        const firstItem = items[0] as (typeof items)[number];
        return runSceneEdit(`Delete ${items.length === 1 ? entities[firstItem.id].name : `${items.length} entities`}`, () => {
            for (const item of items) if (!EditorGameRunner.deleteEntity(item.id)) return false;
            items.forEach(item => projectDropBranch(item.id));
            notifyGame('editor:load-scene', { data: EditorGameRunner.currentScene });
            return true;
        }, () => {
            for (const item of [...items].sort((a, b) => a.index - b.index)) {
                EditorGameRunner.insertEntityBranch(item.parent!, item.branch!, item.index);
                projectEntityBranch(item.branch!, item.parentId, (entities[item.parentId]?.children || [])[item.index - 1]);
            }
            notifyGame('editor:load-scene', { data: EditorGameRunner.currentScene });
        });
    }, [entities, notifyGame, projectDropBranch, projectEntityBranch, runSceneEdit]);

    const setEntityExpansion = useCallback((ids: string[], expanded: boolean) => {
        const targetIds = new Set(ids);
        if (targetIds.size === 0) return;
        setEntities(previous => {
            let changed = false;
            const next = { ...previous };
            targetIds.forEach(id => {
                const entity = previous[id];
                if (!entity || entity.expanded === expanded) return;
                next[id] = { ...entity, expanded };
                changed = true;
            });
            return changed ? next : previous;
        });
    }, []);

    // Computed for backward compatibility (primary selection)
    const selectedEntityData = useMemo(() => {
        // If we have ids, try to find the "last selected" (active) one if tracked, or just first in list
        if (selectedIds.length > 0) {
            // Ideally we want the one that was clicked last.
            // But map order is not guaranteed. 
            // For now, let's grab the one matching selectedIds[selectedIds.length-1] (Last selected usually)
            const lastId = selectedIds[selectedIds.length - 1];
            return selectedEntitiesData[lastId] || Object.values(selectedEntitiesData)[0] || null;
        }
        return null;
    }, [selectedEntitiesData, selectedIds]);

    // --- Bridge Communication ---

    const loadScene = useCallback(async (path: string) => {
        const sequence = ++sceneLoadSequence.current;
        reportActivity(`Loading scene: ${path}`, 'pending');
        console.log("GameContext: Loading scene from", path);

        // 1. Notify Game (Visuals) - Initial notification REMOVED to avoid double-load error with file:// path
        // notifyGame('editor:load-scene', { path });

        // 2. Read File directly (Data)
        try {
            const data = EditorGameRunner.validateScene(await readScene(path)) as unknown as VersionedScenePayload;
            if (sequence !== sceneLoadSequence.current) return;
            history.clear();
            EditorGameRunner.openScene(data, path);
            // A failed read must never turn an untrusted file path into the
            // current save target. Commit the scene identity only after the
            // versioned payload has been accepted by the native bridge.
            setCurrentSceneName(path.split('/').pop() || "Scene");
            setCurrentScenePath(path);
            reportActivity(`Scene loaded: ${path}`);

            // Notify Game Engine
            // Send full data payload to avoid file:// access issues in iframe
            notifyGame('editor:load-scene', { path, data });
            notifyGame('editor:select', { ids: [] });

            // Clear previous entities
            setEntities({});
            setEntityDataCache({});
            entityDataCacheRef.current = {};
            setSelectedIds([]);
            setSelectedEntitiesData({});

            const newEntities: Record<string, SceneEntity> = {};
            const newDataCache: Record<string, EntityData> = {};

            // Root
            newEntities['root'] = {
                id: 'root',
                parentId: null,
                name: data.name || 'Main Scene',
                type: 'group',
                children: [],
                active: true,
                locked: false,
                expanded: true
            };

            const parseEntityList = (list: any[], parentId: string) => {
                list.forEach((entData: any) => {
                    const id = entData.id;
                    const entity: SceneEntity = {
                        id: id,
                        parentId: parentId,
                        name: entData.name || 'Entity',
                        type: entData.type || 'entity',
                        children: [],
                        active: entData.active !== false,
                        locked: false,
                        expanded: false
                    };

                    newEntities[id] = entity;
                    if (newEntities[parentId]) {
                        newEntities[parentId].children.push(id);
                    }

                    // Parse Components & Transform for Data Cache
                    const componentsList = entData.components || [];
                    const transform = entData.transform || componentsList.find((component: any) => component.type === 'Transform')?.props || {};

                    const fullData: EntityData = {
                        id: id,
                        name: entity.name,
                        active: entity.active,
                        transform: {
                            position: transform.position || transform.pos || { x: 0, y: 0 },
                            rotation: transform.rotation ?? transform.rot ?? 0,
                            scale: transform.scale || { x: 1, y: 1 },
                            z: transform.z || 0
                        },
                        components: {}
                    };

                    componentsList.forEach((comp: any) => {
                        // 1. Add to generic map (Key = Component Type Name)
                        // We use the raw props as the data
                        fullData.components[comp.type] = comp.props || {};

                        // 2. Populate legacy typed fields for specific known types (for now)
                        if (comp.type === 'Sprite') {
                            fullData.sprite = {
                                path: comp.props.path || '',
                                width: comp.props.width || 1,
                                height: comp.props.height || 1,
                                blendMode: comp.props.blendMode || 'normal',
                                color: comp.props.color || '#ffffff'
                            };
                        } else if (comp.type === 'BoxCollider') {
                            fullData.collider = {
                                width: comp.props.width || 1,
                                height: comp.props.height || 1,
                                offsetX: comp.props.offsetX || 0,
                                offsetY: comp.props.offsetY || 0,
                                isTrigger: comp.props.isTrigger || false
                            };
                        } else if (comp.type === 'PlayerController' || comp.type === 'PlatformerBody') {
                            fullData.body = {
                                velocityX: 0,
                                velocityY: 0,
                                gravity: comp.props.gravity || 9.8,
                                maxFallSpeed: comp.props.maxFallSpeed || 10,
                                grounded: false,
                                friction: comp.props.friction || 0,
                                drag: comp.props.drag || 0
                            };
                        }
                    });

                    newDataCache[id] = fullData;

                    // Recurse children
                    if (entData.children && Array.isArray(entData.children)) {
                        parseEntityList(entData.children, id);
                    }
                });
            };

            // 1. Synthesize Main Camera
            if (data.camera) {
                const camId = 'camera-main';
                newEntities[camId] = {
                    id: camId,
                    parentId: 'root',
                    name: 'Main Camera',
                    type: 'camera', // identifying type for hierarchy styling
                    children: [],
                    active: true,
                    locked: false,
                    expanded: false
                };
                newEntities['root'].children.push(camId);

                newDataCache[camId] = {
                    id: camId,
                    name: 'Main Camera',
                    active: true,
                    transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
                    components: {
                        Camera: data.camera // { bounds, zoom }
                    }
                };
            }

            // Handle Layers (demo.scn style)
            if (data.layers && Array.isArray(data.layers)) {
                data.layers.forEach((layer: any) => {
                    const layerId = layer.id;
                    const layerType = layer.type || 'folder';

                    const layerEnt: SceneEntity = {
                        id: layerId,
                        parentId: 'root',
                        name: layer.name || 'Layer',
                        type: layerType,
                        children: [],
                        active: true,
                        locked: false,
                        expanded: true
                    };
                    newEntities[layerId] = layerEnt;
                    newEntities['root'].children.push(layerId);

                    // Synthesize Components for specific layer types to make them inspectable
                    const components: any = {};
                    if (layerType === 'tilemap') {
                        components['Tilemap'] = { src: layer.src || '' };
                    }

                    // Add to Data Cache (Generic container or specific synthesized entity)
                    newDataCache[layerId] = {
                        id: layerId,
                        name: layer.name || 'Layer',
                        active: true,
                        transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
                        components: components
                    };

                    if (layer.entities) {
                        parseEntityList(layer.entities, layerId);
                    }
                });
            }
            if (data.entities && Array.isArray(data.entities)) {
                // Flat or simple root entities
                parseEntityList(data.entities, 'root');
            }

            console.log("Parsed Entities:", newEntities);
            console.log("Parsed Data Cache:", newDataCache);
            setEntities(newEntities);
            setEntityDataCache(newDataCache);
            entityDataCacheRef.current = newDataCache;
        } catch (e) {
            if (sequence === sceneLoadSequence.current) reportActivity(`Scene load failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
            if (sequence !== sceneLoadSequence.current) return;
            console.error("Failed to read/parse scene file", e);
            EditorGameRunner.report(e);
            throw e;
        } // HMR Trigger
    }, [readScene, notifyGame, history]);

    const addTilemapLayer = useCallback((path: string) => {
        if (!currentScenePath) return false;
        const layer = EditorGameRunner.createTilemapLayer(path);
        if (!layer) return false;

        setEntities(previous => {
            const root = previous.root;
            if (!root) return previous;
            return {
                ...previous,
                root: { ...root, children: [...root.children, layer.id] },
                [layer.id]: {
                    id: layer.id,
                    parentId: "root",
                    name: layer.name,
                    type: "tilemap" as const,
                    children: [],
                    active: true,
                    locked: false,
                    expanded: false
                }
            };
        });
        setEntityDataCache(previous => ({
            ...previous,
            [layer.id]: {
                id: layer.id,
                name: layer.name,
                active: true,
                transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
                components: { Tilemap: { src: layer.src } }
            }
        }));

        const scene = EditorGameRunner.currentScene as VersionedScenePayload;
        notifyGame("editor:load-scene", { path: currentScenePath, data: scene });
        return true;
    }, [currentScenePath, notifyGame]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const frames = document.querySelectorAll<HTMLIFrameElement>('iframe[title="Game View"], iframe[title="Scene View"]');
            if (!isRuntimeViewMessageSource(event.source, frames)) return;
            const message = readRuntimeMessage(event.data);
            if (!message) return;
            const { type, payload } = message;

            // console.log("Bridge Message:", type, payload);

            switch (type) {
                case 'game:ready':
                    // Game is ready, request initial state
                    notifyGame('editor:request-state');
                    // A remounted iframe must receive the in-memory scene. Reading
                    // from disk here would discard unsaved inspector/hierarchy edits.
                    if (currentScenePath && EditorGameRunner.currentScenePath === currentScenePath && EditorGameRunner.currentScene) {
                        notifyGame('editor:load-scene', { path: currentScenePath, data: EditorGameRunner.currentScene });
                        notifyGame('editor:select', { ids: selectedIds });
                    }
                    // Dockview can remount Game View while Play is focusing it.
                    // Restore controls after its asynchronous scene load, not on
                    // the old iframe (which received the original Play command).
                    if (isPlaying && event.source === document.querySelector<HTMLIFrameElement>('iframe[title="Game View"]')?.contentWindow) {
                        (event.source as WindowProxy).postMessage({ type: 'editor:restore-playback', payload: { paused: isPaused }, projectSession: projectSequence.current }, '*');
                    }
                    break;
                case 'game:state-update':
                    const state = readRuntimeState(payload);
                    // Scene View has its own editing loop, not the play session.
                    if (state && event.data.projectSession === projectSequence.current
                        && event.source === Array.from(frames).find(frame => frame.title === 'Game View')?.contentWindow) {
                        setIsPlaying(state.isPlaying);
                        setIsPaused(state.isPaused);
                    }
                    break;
                case 'game:selection-changed':
                    const selection = readRuntimeSelection(payload);
                    if (!selection) break;
                    const selectionIds = selection.ids.filter(id => entities[id]);
                    setSelectedIds(selectionIds);
                    // An editor-origin selection does not emit a runtime-origin
                    // message, so relaying here synchronizes views without echo.
                    notifyGame('editor:select', { ids: selectionIds });

                    if (isPlaying) {
                        const authoredBinding: Record<string, EntityData> = {};
                        selectionIds.forEach(id => { if (entityDataCache[id]) authoredBinding[id] = entityDataCache[id]; });
                        setSelectedEntitiesData(authoredBinding);
                        break;
                    }

                    const newBinding: Record<string, EntityData> = {};
                    selectionIds.forEach(id => {
                        if (selection.data[id]) newBinding[id] = selection.data[id] as EntityData;
                    });

                    // Merge with cache if game sent incomplete data (or nothing)
                    selectionIds.forEach((id: string) => {
                        if (!newBinding[id] && entityDataCache[id]) {
                            newBinding[id] = entityDataCache[id];
                        }
                    });

                    setSelectedEntitiesData(newBinding);
                    break;
                case 'game:component-updated':
                    if (isPlaying) break;
                    // Update local cache for ANY entity we have selected
                    if (selectedEntitiesData[payload.id]) {
                        setSelectedEntitiesData(prev => ({
                            ...prev,
                            [payload.id]: {
                                ...prev[payload.id],
                                [payload.component]: {
                                    ...(prev[payload.id][payload.component as keyof EntityData] as object || {}),
                                    ...payload.data
                                }
                            } as EntityData
                        }));
                    }
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentScenePath, entities, entityDataCache, notifyGame, selectedEntitiesData, selectedIds, isPlaying, isPaused]);


    // --- Actions ---

    const play = () => {
        const action = getPlayAction(isPlaying, isPaused);
        if (action.startsNewSession) {
            reportActivity('Play mode started');
            setIsPlaying(true);
            window.dispatchEvent(new Event('editor:play'));
        } else {
            setIsPaused(false);
        }
        notifyGame(action.type, action.payload);
    };

    const pause = () => {
        // Toggle
        const next = !isPaused;
        setIsPaused(next);
        notifyGame('editor:pause', { paused: next });
    };

    const stop = () => {
        reportActivity('Play mode stopped');
        setIsPlaying(false);
        setIsPaused(false);
        notifyGame('editor:stop');
        // Reset selection on stop? 
        notifyGame('editor:request-state');
        window.dispatchEvent(new Event('editor:stop'));
    };

    const selectEntities = (ids: string[]) => {
        const newSelection = [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))];
        setSelectedIds(newSelection);
        notifyGame('editor:select', { ids: newSelection });

        const newBinding: Record<string, EntityData> = {};
        newSelection.forEach(sid => {
            if (entityDataCache[sid]) {
                newBinding[sid] = entityDataCache[sid];
            }
        });
        setSelectedEntitiesData(newBinding);
    };

    const selectEntity = (id: string, multi: boolean) => {
        selectEntities(multi && id
            ? selectedIds.includes(id) ? selectedIds.filter(selectedId => selectedId !== id) : [...selectedIds, id]
            : [id]);
    };

    const applyComponentField = useCallback((id: string, component: string, field: string, value: any) => {
        const canonicalComponent = normalizeComponentName(component);
        if (!EditorGameRunner.updateEntity(id, canonicalComponent, { [field]: value })) return false;
        const entityName = selectedEntitiesData[id]?.name || entityDataCache[id]?.name || entities[id]?.name || 'Entity';
        const displayValue = (item: unknown) => {
            let text: string;
            try { text = typeof item === 'string' ? item : JSON.stringify(item); }
            catch { text = String(item); }
            return (text || String(item)).slice(0, 48);
        };
        const property = canonicalComponent.toLowerCase() === 'transform'
            ? ({ position: 'position', rotation: 'rotation', scale: 'scale', z: 'depth' } as Record<string, string>)[field] || field
            : `${component} ${field}`;
        reportActivity(`${entityName}: ${property} = ${displayValue(value)} · unsaved`);
        const updateData = (previous: Record<string, EntityData>) => {
            const selectedEntity = previous[id];
            if (!selectedEntity) return previous;
            if (canonicalComponent.toLowerCase() === 'transform') return { ...previous, [id]: {
                ...selectedEntity, transform: { ...selectedEntity.transform, [field]: value }
            } };
            const components = selectedEntity.components || {};
            const componentKey = Object.keys(components).find(key => key.toLowerCase() === canonicalComponent.toLowerCase()) || canonicalComponent;
            return { ...previous, [id]: { ...selectedEntity, components: {
                ...components, [componentKey]: { ...(components[componentKey] || {}), [field]: value }
            } } };
        };
        entityDataCacheRef.current = updateData(entityDataCacheRef.current);
        setSelectedEntitiesData(updateData);
        setEntityDataCache(updateData);
        notifyGame('editor:update-component', { id, component: canonicalComponent, data: { [field]: value } });
        return true;
    }, [selectedEntitiesData, entityDataCache, entities, notifyGame]);

    const updateComponent = useCallback((id: string, component: string, field: string, value: any) => {
        const canonicalComponent = normalizeComponentName(component);
        const data = entityDataCacheRef.current[id] || selectedEntitiesData[id];
        if (!data) return;
        const previous = cloneEditValue(canonicalComponent.toLowerCase() === 'transform'
            ? (data.transform as unknown as Record<string, unknown>)[field]
            : data.components?.[Object.keys(data.components || {}).find(key => key.toLowerCase() === canonicalComponent.toLowerCase()) || canonicalComponent]?.[field]);
        if (JSON.stringify(previous) === JSON.stringify(value)) return;
        runSceneEdit(`${data.name}: ${canonicalComponent} ${field}`,
            () => applyComponentField(id, canonicalComponent, field, value),
            () => applyComponentField(id, canonicalComponent, field, previous));
    }, [selectedEntitiesData, runSceneEdit, applyComponentField]);

    const addComponent = useCallback((id: string, type: string, props: Record<string, unknown> = {}) => {
        const data = entityDataCache[id];
        if (!data || !type.trim() || Object.keys(data.components || {}).some(key => key.toLowerCase() === type.toLowerCase())) return false;
        let applied = false;
        const change = (add: boolean) => {
            applied = add ? EditorGameRunner.addComponent(id, type, props) : EditorGameRunner.removeComponent(id, type);
            if (!applied) return false;
            const update = (previous: Record<string, EntityData>) => {
                if (!previous[id]) return previous;
                const components = { ...(previous[id].components || {}) };
                if (add) components[type] = { ...props }; else delete components[type];
                return { ...previous, [id]: { ...previous[id], components } };
            };
            entityDataCacheRef.current = update(entityDataCacheRef.current);
            setEntityDataCache(update);
            setSelectedEntitiesData(update);
            notifyGame('editor:load-scene', { data: EditorGameRunner.currentScene });
            reportActivity(`${data.name}: ${add ? 'added' : 'removed'} ${type} · unsaved`);
            return true;
        };
        return runSceneEdit(`Add ${type} to ${data.name}`, () => change(true), () => { change(false); });
    }, [entityDataCache, notifyGame, runSceneEdit]);

    const removeComponent = useCallback((id: string, type: string) => {
        const data = entityDataCache[id];
        const key = Object.keys(data?.components || {}).find(name => name.toLowerCase() === type.toLowerCase());
        if (!data || !key || key.toLowerCase() === 'transform') return false;
        const props = data.components[key];
        const change = (add: boolean) => {
            const changed = add ? EditorGameRunner.addComponent(id, key, props) : EditorGameRunner.removeComponent(id, key);
            if (!changed) return false;
            const update = (previous: Record<string, EntityData>) => {
                if (!previous[id]) return previous;
                const components = { ...(previous[id].components || {}) };
                if (add) components[key] = props; else delete components[key];
                return { ...previous, [id]: { ...previous[id], components } };
            };
            entityDataCacheRef.current = update(entityDataCacheRef.current);
            setEntityDataCache(update);
            setSelectedEntitiesData(update);
            notifyGame('editor:load-scene', { data: EditorGameRunner.currentScene });
            reportActivity(`${data.name}: ${add ? 'added' : 'removed'} ${key} · unsaved`);
            return true;
        };
        return runSceneEdit(`Remove ${key} from ${data.name}`, () => change(false), () => { change(true); });
    }, [entityDataCache, notifyGame, runSceneEdit]);

    const moveEntities = useCallback((ids: string[], targetParentId: string, index?: number) => {
        const before = entitiesRef.current;
        const next = moveHierarchyEntities(before, ids, targetParentId, index);
        if (next === before || next === null) return;
        const sourceParents = [...new Set(ids.map(id => before[id]?.parentId).filter((id): id is string => Boolean(id)))];
        const sourceGroups = sourceParents.map(parentId => {
            const orderedIds = (before[parentId]?.children || []).filter(id => ids.includes(id));
            return { parentId, orderedIds, index: Math.min(...orderedIds.map(id => before[parentId].children.indexOf(id))),
                persistenceParent: EditorGameRunner.resolveHierarchyParentId(parentId, before) };
        }).filter(group => group.orderedIds.length > 0 && group.persistenceParent);
        const targetChildren = next[targetParentId]?.children || [];
        const actualIndex = Math.min(...ids.map(id => targetChildren.indexOf(id)).filter(value => value >= 0));
        const persistenceTarget = EditorGameRunner.resolveHierarchyParentId(targetParentId, before);
        if (!persistenceTarget || sourceGroups.length === 0) return;
        runSceneEdit('Reparent entities', () => {
            if (!EditorGameRunner.moveEntities(ids, persistenceTarget, Number.isFinite(actualIndex) ? actualIndex : index)) return false;
            entitiesRef.current = next;
            setEntities(next);
            notifyGame('editor:move-entities', { ids, targetParentId: persistenceTarget, index: actualIndex });
            return true;
        }, () => {
            let restored = entitiesRef.current;
            sourceGroups.forEach(group => {
                EditorGameRunner.moveEntities(group.orderedIds, group.persistenceParent!, group.index);
                restored = moveHierarchyEntities(restored, group.orderedIds, group.parentId, group.index);
                notifyGame('editor:move-entities', { ids: group.orderedIds, targetParentId: group.persistenceParent, index: group.index });
            });
            entitiesRef.current = restored;
            setEntities(restored);
        });
    }, [notifyGame, runSceneEdit]);

    const markAsMainScene = useCallback(async () => {
        if (!rootPath || !currentScenePath) {
            console.warn("Cannot mark main scene: No root path or current scene");
            return;
        }

        console.log("Marking current scene as main:", currentSceneName, "-> project.npt");

        try {
            const projectData = await readProject();

            const normPath = currentScenePath.replace(/\\/g, '/');
            projectData.mainScene = normPath;

            await writeProject(projectData);
            setMainScenePath(normPath);
            console.log("Main scene saved to project.npt");
        } catch (e) {
            console.error("Failed to mark main scene", e);
        }
    }, [rootPath, currentScenePath, currentSceneName, readProject, writeProject]);

    const saveScene = useCallback(async (scene?: VersionedScenePayload) => {
        if (!currentScenePath) {
            throw new Error("Cannot save scene: no scene is open.");
        }
        const path = currentScenePath;
        const projectSequenceAtStart = projectSequence.current;
        const sceneSequenceAtStart = sceneLoadSequence.current;
        const isCurrentSave = () => projectSequence.current === projectSequenceAtStart &&
            sceneLoadSequence.current === sceneSequenceAtStart && currentScenePath === path;
        reportActivity(`Saving scene: ${path}`, 'pending');
        try {
            const saved = scene
                ? await writeScene(path, scene)
                : await EditorGameRunner.saveScene(async (targetPath, content) =>
                    writeScene(targetPath, JSON.parse(content) as VersionedScenePayload), path);
            if (!saved) throw new Error(`Could not save scene: ${path}`);
            if (isCurrentSave()) reportActivity(`Scene saved: ${path}`, 'ready');
            return true;
        } catch (error) {
            if (isCurrentSave()) reportActivity(`Scene save failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
            throw error;
        }
    }, [currentScenePath, writeScene]);

    const loadMainScene = useCallback(async () => {
        if (!rootPath) return;
        const sequence = projectSequence.current;
        try {
            console.log("Checking for main scene in: project.npt");
            const projectData = await readProject();
            if (sequence !== projectSequence.current) return;
            if (projectData.mainScene) {
                    console.log("Auto-loading main scene:", projectData.mainScene);
                    const scenePath = toProjectRelativePath(projectData.mainScene);
                    setMainScenePath(scenePath);
                    await loadScene(scenePath);
            } else {
                console.log("No main scene defined in project.npt");
            }
        } catch (e) {
            console.error("Failed to load main scene config", e);
        }
    }, [rootPath, readProject, loadScene, toProjectRelativePath]);

    // Auto-load main scene
    useEffect(() => {
        // A project switch (including a failed scan) invalidates pending reads
        // and the previous project's save target before the new main scene loads.
        projectSequence.current++;
        sceneLoadSequence.current++;
        setIsPlaying(false);
        setIsPaused(false);
        notifyGame('editor:stop');
        notifyGame('editor:reset-project');
        history.clear();
        EditorGameRunner.closeScene();
        setCurrentSceneName("Untitled");
        reportActivity(rootPath ? 'Project opened' : 'Ready', 'ready');
        setCurrentScenePath(null);
        setMainScenePath(null);
        setEntities({});
        setEntityDataCache({});
        entityDataCacheRef.current = {};
        setSelectedIds([]);
        setSelectedEntitiesData({});
        notifyGame('editor:select', { ids: [] });
        if (rootPath) {
            void loadMainScene();
        }
    }, [rootPath, loadMainScene, notifyGame, history]);

    useEffect(() => {
        const warnOnClose = (event: BeforeUnloadEvent) => {
            if (!EditorGameRunner.isDirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnOnClose);
        return () => window.removeEventListener('beforeunload', warnOnClose);
    }, []);

    return (
        <GameContext.Provider value={{
            isPlaying,
            isPaused,
            currentSceneName,
            entities,
            selectedIds,
            selectedEntitiesData,
            entityDataCache,
            selectedEntityData,
            play,
            pause,
            stop,
            selectEntity,
            selectEntities,
            setEntityExpansion,
            moveEntities,
            addEntityToHierarchy,
            addEntityBranchToHierarchy,
            renameEntityInHierarchy,
            removeEntityFromHierarchy,
            setEntityActiveInHierarchy,
            setEntityLocked,
            updateComponent,
            addComponent,
            removeComponent,
            runSceneEdit,
            beginSceneEdit,
            undoSceneEdit,
            redoSceneEdit,
            canUndo,
            canRedo,
            duplicateEntityInHierarchy,
            deleteEntitiesInHierarchy,
            markAsMainScene,
            notifyGame,
            loadScene,
            addTilemapLayer,
            loadMainScene,
            saveScene,
            mainScenePath,
            currentScenePath
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGameContext() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGameContext must be used within a GameProvider");
    }
    return context;
}
