
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { SceneEntity, EntityData } from "../types/engine";

interface GameContextType {
    isPlaying: boolean;
    isPaused: boolean;
    currentSceneName: string;
    entities: Record<string, SceneEntity>;
    selectedIds: string[];
    selectedEntityData: EntityData | null;

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

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedEntityData, setSelectedEntityData] = useState<EntityData | null>(null);

    // --- Bridge Communication ---

    const notifyGame = useCallback((type: string, payload?: any) => {
        // Find the iframe
        const iframe = document.querySelector('iframe[title="Game View"]') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type, payload }, '*');
        } else {
            console.warn("Game Iframe not found or not ready");
        }
    }, []);

    const loadScene = useCallback(async (path: string) => {
        console.log("GameContext: Loading scene from", path);
        setCurrentSceneName(path.split('/').pop() || "Scene");
        setCurrentScenePath(path);

        // 1. Notify Game (Visuals)
        notifyGame('editor:load-scene', { path });

        // 2. Read File directly (Data)
        try {
            const content = await readFile(path);
            if (content) {
                const data = JSON.parse(content);
                const newEntities: Record<string, SceneEntity> = {};

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

                        // Recurse children
                        if (entData.children && Array.isArray(entData.children)) {
                            parseEntityList(entData.children, id);
                        }
                    });
                };

                // Handle Layers (demo.scn style)
                if (data.layers && Array.isArray(data.layers)) {
                    data.layers.forEach((layer: any) => {
                        const layerId = generateId();
                        const layerEnt: SceneEntity = {
                            id: layerId,
                            parentId: 'root',
                            name: layer.name || 'Layer',
                            type: 'folder',
                            children: [],
                            active: true,
                            locked: false,
                            expanded: true
                        };
                        newEntities[layerId] = layerEnt;
                        newEntities['root'].children.push(layerId);

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
                setEntities(newEntities);
            }
        } catch (e) {
            console.error("Failed to read/parse scene file", e);
        }
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
                    if (payload.data) {
                        setSelectedEntityData(payload.data);
                    } else {
                        setSelectedEntityData(null);
                    }
                    break;
                case 'game:component-updated':
                    // If we are inspecting this entity, update our local copy to stay in sync
                    if (selectedEntityData && selectedEntityData.id === payload.id) {
                        setSelectedEntityData(prev => prev ? ({
                            ...prev,
                            [payload.component]: {
                                ...(prev[payload.component as keyof EntityData] as object || {}),
                                ...payload.data
                            }
                        } as EntityData) : null);
                    }
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [notifyGame, selectedEntityData]);


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
    };

    const moveEntities = (ids: string[], targetParentId: string, index?: number) => {
        // Optimistic update could happen here, but for now lets trust the game
        notifyGame('editor:move-entities', { ids, targetParentId, index });
    };

    const updateComponent = (id: string, component: string, data: any) => {
        // Optimistic update
        if (selectedEntityData && selectedEntityData.id === id) {
            setSelectedEntityData(prev => prev ? ({
                ...prev,
                [component]: { ...(prev[component as keyof EntityData] as object || {}), ...data }
            } as EntityData) : null);
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
