import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

export type AssetType = 'folder' | 'image' | 'script' | 'scene' | 'material' | 'audio' | 'prefab' | 'model' | 'file';

export interface FileSystemNode {
    id: string;
    parentId: string | null;
    name: string;
    type: AssetType;
    children: string[];
}

interface FileSystemContextType {
    nodes: Record<string, FileSystemNode>;
    rootPath: string | null;
    currentFolderId: string;
    currentPath: string[];
    isLoading: boolean;
    loadProject: (path: string) => Promise<void>;
    refresh: () => Promise<void>;
    navigateTo: (folderId: string) => void;
    navigateUp: () => void;
    // Mock-compatible wrappers (will implement real logic later)
    getChildren: (id: string) => FileSystemNode[];
    moveNodes: (nodeIds: string[], targetFolderId: string) => Promise<void>;
    moveNode: (nodeId: string, targetFolderId: string) => void;
    createFolder: (parentId: string, name: string) => Promise<string | null>;
    createAsset: (parentId: string, name: string, type: AssetType) => Promise<string | null>;
    deleteNode: (nodeId: string) => Promise<void>;
    renameNode: (nodeId: string, newName: string) => Promise<void>;
    duplicateNode: (nodeId: string) => Promise<void>;
}

const FileSystemContext = createContext<FileSystemContextType | null>(null);

export function FileSystemProvider({ children }: { children: ReactNode }) {
    const [nodes, setNodes] = useState<Record<string, FileSystemNode>>({});
    const [rootPath, setRootPath] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string[]>(["root"]);
    const [isLoading, setIsLoading] = useState(false);

    const currentFolderId = currentPath[currentPath.length - 1] || "root";

    const loadProject = useCallback(async (path: string) => {
        setIsLoading(true);
        try {
            console.log("Loading project fs from:", path);
            const data = await invoke<Record<string, FileSystemNode>>("scan_project", { path });
            console.log("Scanned nodes:", Object.keys(data).length);

            // Normalize data if needed, or just set it
            setNodes(data);
            setRootPath(path);
            setCurrentPath(["root"]);
        } catch (e) {
            console.error("Failed to load project file system:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (rootPath) {
            await loadProject(rootPath);
        }
    }, [rootPath, loadProject]);

    const navigateTo = useCallback((folderId: string) => {
        // Find path to root using parent pointers
        const path: string[] = [];
        let current: string | null = folderId;

        // Safety check loop
        let iterations = 0;
        while (current && iterations < 100) {
            path.unshift(current);
            // If we hit root, we are done
            if (current === "root") break;
            current = nodes[current]?.parentId;
            iterations++;
        }

        if (path.length > 0 && path[0] === "root") {
            setCurrentPath(path);
        } else {
            // Fallback if disconnected or something
            console.warn("Could not find path to root for:", folderId);
            setCurrentPath(["root"]);
        }
    }, [nodes]);

    const navigateUp = useCallback(() => {
        if (currentPath.length > 1) {
            setCurrentPath(prev => prev.slice(0, -1));
        }
    }, [currentPath]);

    const getChildren = useCallback((id: string) => {
        const node = nodes[id];
        if (!node || !node.children) return [];
        // Sort: Folders first, then files
        return node.children
            .map(childId => nodes[childId])
            .filter(Boolean)
            .sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
    }, [nodes]);

    // --- Placeholder / Mock-ish Implementations for Mutating Actions ---
    // These need backend implementations next. For now we just log or do nothing 
    // to prevent crashing, or maybe do local updates if we want to be fancy.
    // Ideally, we implement corresponding Tauri commands.

    const createFolder = useCallback(async (parentId: string, name: string) => {
        try {
            // parentId is a path in our system (except "root")
            if (parentId === "root") {
                if (!rootPath) return null;
                parentId = rootPath;
            }
            const path = `${parentId}/${name}`;
            const newPath = await invoke<string>("create_directory", { path });
            await refresh();
            return newPath;
        } catch (e) {
            console.error("Failed to create folder", e);
            return null;
        }
    }, [rootPath, refresh]);

    const createAsset = useCallback(async (parentId: string, name: string, type: AssetType) => {
        try {
            if (parentId === "root") {
                if (!rootPath) return null;
                parentId = rootPath;
            }
            const path = `${parentId}/${name}`;

            // Default content based on type
            let content = "";
            if (type === 'script') content = "export class NewScript {}";
            if (type === 'scene') content = "{}";

            const newPath = await invoke<string>("create_asset", { path, content });
            await refresh();
            return newPath;
        } catch (e) {
            console.error("Failed to create asset", e);
            return null;
        }
    }, [rootPath, refresh]);

    const deleteNode = useCallback(async (nodeId: string) => {
        try {
            await invoke("delete_fs_node", { path: nodeId });
            await refresh();
        } catch (e) {
            console.error("Failed to delete node", e);
        }
    }, [refresh]);

    const renameNode = useCallback(async (nodeId: string, newName: string) => {
        try {
            await invoke("rename_fs_node", { path: nodeId, newName });
            await refresh();
        } catch (e) {
            console.error("Failed to rename node", e);
        }
    }, [refresh]);

    const duplicateNode = useCallback(async (nodeId: string) => {
        try {
            await invoke("duplicate_fs_node", { path: nodeId });
            await refresh();
        } catch (e) {
            console.error("Failed to duplicate node", e);
        }
    }, [refresh]);

    const moveNodes = useCallback(async (nodeIds: string[], targetFolderId: string) => {
        // Optimistic functionality or just refresh after?
        // Let's loop and move.
        // targetFolderId is the Path of the destination folder (e.g. "C:/Project/Assets/Scripts")

        setIsLoading(true); // Maybe not full reload spinner?

        try {
            for (const sourceId of nodeIds) {
                // sourceId is full path (e.g. "C:/Project/Assets/Old/script.ts")
                const fileName = sourceId.split('/').pop();
                if (!fileName) continue;

                const targetPath = `${targetFolderId}/${fileName}`;

                if (sourceId === targetPath) continue; // Same location

                console.log(`Moving ${sourceId} -> ${targetPath}`);
                await invoke("move_fs_node", { source: sourceId, target: targetPath });
            }
            // Refresh state
            await refresh();
        } catch (e) {
            console.error("Failed to move nodes", e);
        } finally {
            setIsLoading(false);
        }
    }, [refresh]);

    const moveNode = useCallback((nodeId: string, targetFolderId: string) => {
        moveNodes([nodeId], targetFolderId);
    }, [moveNodes]);


    return (
        <FileSystemContext.Provider value={{
            nodes,
            rootPath,
            currentFolderId,
            currentPath,
            isLoading,
            loadProject,
            refresh,
            navigateTo,
            navigateUp,
            getChildren,
            moveNodes,
            moveNode,
            createFolder,
            createAsset,
            deleteNode,
            renameNode,
            duplicateNode
        }}>
            {children}
        </FileSystemContext.Provider>
    );
}

export const useFileSystem = () => {
    const context = useContext(FileSystemContext);
    if (!context) {
        throw new Error("useFileSystem must be used within a FileSystemProvider");
    }
    return context;
};
