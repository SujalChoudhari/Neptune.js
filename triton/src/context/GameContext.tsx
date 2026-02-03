
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { SceneEntity, EntityData } from "../types/engine";

interface GameContextType {
    isPlaying: boolean;
    isPaused: boolean;
    currentSceneName: string;
    entities: Record<string, SceneEntity>;
    selectedIds: string[];
    selectedEntitiesData: Record<string, EntityData>;
    selectedEntityData: EntityData | null; // Computed helper for backward compat

    // Actions
    play: () => void;
    pause: () => void;
    stop: () => void;
    selectEntity: (id: string, multi: boolean) => void;
    moveEntities: (ids: string[], targetParentId: string, index?: number) => void;
    updateComponent: (id: string, component: string, field: string, value: any) => void;
    markAsMainScene: () => void;

    // Internal Bridge
    notifyGame: (type: string, payload?: any) => void;
    loadScene: (path: string) => Promise<void>;
    loadMainScene: () => Promise<void>;

    // State
    mainScenePath: string | null;
    currentScenePath: string | null;
}

const GameContext = createContext<GameContextType | null>(null);

import { useFileSystem } from "./FileSystemContext";

export function GameProvider({ children }: { children: ReactNode }) {
    const { readFile, writeFile, rootPath } = useFileSystem();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSceneName, setCurrentSceneName] = useState("Untitled");
    const [currentScenePath, setCurrentScenePath] = useState<string | null>(null);
    const [mainScenePath, setMainScenePath] = useState<string | null>(null);

    // Hierarchy State
    const [entities, setEntities] = useState<Record<string, SceneEntity>>({});
    const [entityDataCache, setEntityDataCache] = useState<Record<string, EntityData>>({});

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedEntitiesData, setSelectedEntitiesData] = useState<Record<string, EntityData>>({});

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

    const notifyGame = useCallback((type: string, payload?: any) => {
        // Find all game iframes (Game View and Scene View)
        const iframes = document.querySelectorAll('iframe[title="Game View"], iframe[title="Scene View"]');
        iframes.forEach((iframe) => {
            const frame = iframe as HTMLIFrameElement;
            if (frame.contentWindow) {
                frame.contentWindow.postMessage({ type, payload }, '*');
            }
        });
    }, []);

    const loadScene = useCallback(async (path: string) => {
        console.log("GameContext: Loading scene from", path);
        setCurrentSceneName(path.split('/').pop() || "Scene");
        setCurrentScenePath(path);

        // 1. Notify Game (Visuals) - Initial notification, might be redundant if data is sent later
        notifyGame('editor:load-scene', { path });

        // 2. Read File directly (Data)
        try {
            const content = await readFile(path);
            if (!content) throw new Error("Failed to read file");

            const data = JSON.parse(content as string);

            // Notify Game Engine
            // Send full data payload to avoid file:// access issues in iframe
            notifyGame('editor:load-scene', { path, data });

            // Clear previous entities
            setEntities({});
            setEntityDataCache({});
            setSelectedIds([]);

            const newEntities: Record<string, SceneEntity> = {};
            const newDataCache: Record<string, EntityData> = {};

            // Helper to generate IDs
            const generateId = () => Math.random().toString(36).substr(2, 9);

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
                    const id = entData.id || generateId();
                    const entity: SceneEntity = {
                        id: id,
                        parentId: parentId,
                        name: entData.name || 'Entity',
                        type: entData.type || 'entity',
                        children: [],
                        active: true,
                        locked: false,
                        expanded: false
                    };

                    newEntities[id] = entity;
                    if (newEntities[parentId]) {
                        newEntities[parentId].children.push(id);
                    }

                    // Parse Components & Transform for Data Cache
                    const transform = entData.transform || { pos: { x: 0, y: 0 }, rot: 0, scale: { x: 1, y: 1 } };
                    const componentsList = entData.components || [];

                    const fullData: EntityData = {
                        id: id,
                        name: entity.name,
                        active: entity.active,
                        transform: {
                            position: transform.pos || { x: 0, y: 0 },
                            rotation: transform.rot || 0,
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
                    const layerId = generateId();
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
            } else if (data.entities && Array.isArray(data.entities)) {
                // Flat or simple root entities
                parseEntityList(data.entities, 'root');
            } else if (data.entities && typeof data.entities === 'object') {
                // Already in map format
                Object.assign(newEntities, data.entities);
            }

            console.log("Parsed Entities:", newEntities);
            console.log("Parsed Data Cache:", newDataCache);
            setEntities(newEntities);
            setEntityDataCache(newDataCache);
        } catch (e) {
            console.error("Failed to read/parse scene file", e);
        } // HMR Trigger
    }, [readFile, notifyGame]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Validate origin if needed, but for local tool it's okay
            const { type, payload } = event.data;

            if (!type || !type.startsWith('game:')) return;

            // console.log("Bridge Message:", type, payload);

            switch (type) {
                case 'game:ready':
                    // Game is ready, request initial state
                    notifyGame('editor:request-state');
                    // Sync current scene
                    if (currentScenePath) {
                        notifyGame('editor:load-scene', { path: currentScenePath });
                    }
                    break;
                case 'game:state-update':
                    setIsPlaying(payload.isPlaying);
                    setIsPaused(payload.isPaused);
                    break;
                case 'game:hierarchy-update':
                    // Payload should be Record<string, SceneEntity>
                    setEntities(payload);
                    break;
                case 'game:selection-changed':
                    setSelectedIds(payload.ids);

                    console.log("Selection changed debug:", payload.ids, payload.data);

                    const newBinding: Record<string, EntityData> = {};
                    if (payload.data) {
                        if (Array.isArray(payload.data)) {
                            payload.data.forEach((d: EntityData) => newBinding[d.id] = d);
                        } else if (payload.data.id) {
                            newBinding[payload.data.id] = payload.data;
                        } else {
                            // Map
                            Object.assign(newBinding, payload.data);
                        }
                    }

                    // Merge with cache if game sent incomplete data (or nothing)
                    payload.ids.forEach((id: string) => {
                        if (!newBinding[id] && entityDataCache[id]) {
                            newBinding[id] = entityDataCache[id];
                        }
                    });

                    setSelectedEntitiesData(newBinding);
                    break;
                case 'game:component-updated':
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
    }, [notifyGame, selectedEntityData, currentScenePath, entityDataCache]); // Added entityDataCache dependency


    // --- Actions ---

    const play = () => {
        setIsPlaying(true);
        notifyGame('editor:play');
    };

    const pause = () => {
        // Toggle
        const next = !isPaused;
        setIsPaused(next);
        notifyGame('editor:pause', { paused: next });
    };

    const stop = () => {
        setIsPlaying(false);
        setIsPaused(false);
        notifyGame('editor:stop');
        // Reset selection on stop? 
        notifyGame('editor:request-state');
    };

    const selectEntity = (id: string, multi: boolean) => {
        const newSelection = multi ? [...selectedIds, id] : [id];
        setSelectedIds(newSelection);
        notifyGame('editor:select', { ids: newSelection });

        // Optimistic / Local Data Selection
        // If we have data in cache, select it immediately
        const newBinding: Record<string, EntityData> = {};
        newSelection.forEach(sid => {
            if (entityDataCache[sid]) {
                newBinding[sid] = entityDataCache[sid];
            }
        });

        // If we have previously selected data that's still selected, keep it? 
        // No, simplest is to reset to cache or current known state.
        // Merging with existing *might* be better but cache is safer source of truth if static.
        setSelectedEntitiesData(newBinding);
    };

    const moveEntities = (ids: string[], targetParentId: string, index?: number) => {
        // Optimistic update could happen here, but for now lets trust the game
        notifyGame('editor:move-entities', { ids, targetParentId, index });
    };

    const updateComponent = (id: string, component: string, data: any) => {
        // Optimistic update
        if (selectedEntitiesData[id]) {
            setSelectedEntitiesData(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    // We need to merge component data
                    [component]: { ...(prev[id][component as keyof EntityData] as object || {}), ...data }
                } as EntityData
            }));
        }
        notifyGame('editor:update-component', { id, component, data });
    };

    const markAsMainScene = useCallback(async () => {
        if (!rootPath || !currentScenePath) {
            console.warn("Cannot mark main scene: No root path or current scene");
            return;
        }

        const projectFile = `${rootPath}/project.npt`.replace(/\\/g, '/');
        console.log("Marking current scene as main:", currentSceneName, "->", projectFile);

        try {
            const content = await readFile(projectFile);
            const projectData = content ? JSON.parse(content) : {};

            const normPath = currentScenePath.replace(/\\/g, '/');
            projectData.mainScene = normPath;

            await writeFile(projectFile, JSON.stringify(projectData, null, 2));
            setMainScenePath(normPath);
            console.log("Main scene saved to project.npt");
        } catch (e) {
            console.error("Failed to mark main scene", e);
        }
    }, [rootPath, currentScenePath, currentSceneName, readFile, writeFile]);

    const loadMainScene = useCallback(async () => {
        if (!rootPath) return;
        const projectFile = `${rootPath}/project.npt`.replace(/\\/g, '/');
        try {
            console.log("Checking for main scene in:", projectFile);
            const content = await readFile(projectFile);
            if (content) {
                const projectData = JSON.parse(content);
                if (projectData.mainScene) {
                    console.log("Auto-loading main scene:", projectData.mainScene);
                    setMainScenePath(projectData.mainScene);
                    await loadScene(projectData.mainScene);
                } else {
                    console.log("No main scene defined in project.npt");
                }
            }
        } catch (e) {
            console.error("Failed to load main scene config", e);
        }
    }, [rootPath, readFile, loadScene]);

    // Auto-load main scene
    useEffect(() => {
        if (rootPath) {
            loadMainScene();
        }
    }, [rootPath, loadMainScene]);

    return (
        <GameContext.Provider value={{
            isPlaying,
            isPaused,
            currentSceneName,
            entities,
            selectedIds,
            selectedEntitiesData,
            selectedEntityData,
            play,
            pause,
            stop,
            selectEntity,
            moveEntities,
            updateComponent,
            markAsMainScene,
            notifyGame,
            loadScene,
            loadMainScene,
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
