import { useState, useCallback } from "react"

export type AssetType = 'folder' | 'image' | 'script' | 'scene' | 'material' | 'audio' | 'prefab' | 'model'

export interface FileSystemNode {
    id: string
    parentId: string | null
    name: string
    type: AssetType
    children: string[]
}

// Initial Mock Data
const INITIAL_DATA: Record<string, FileSystemNode> = {
    "root": { id: "root", parentId: null, name: "Assets", type: "folder", children: ["folder-scripts", "folder-scenes", "folder-materials", "folder-prefabs", "folder-models"] },

    "folder-scripts": { id: "folder-scripts", parentId: "root", name: "Scripts", type: "folder", children: ["script-player", "script-game-manager", "script-enemy"] },
    "script-player": { id: "script-player", parentId: "folder-scripts", name: "PlayerController.ts", type: "script", children: [] },
    "script-game-manager": { id: "script-game-manager", parentId: "folder-scripts", name: "GameManager.ts", type: "script", children: [] },
    "script-enemy": { id: "script-enemy", parentId: "folder-scripts", name: "EnemyAI.ts", type: "script", children: [] },

    "folder-scenes": { id: "folder-scenes", parentId: "root", name: "Scenes", type: "folder", children: ["scene-main", "scene-menu"] },
    "scene-main": { id: "scene-main", parentId: "folder-scenes", name: "MainLevel.scene", type: "scene", children: [] },
    "scene-menu": { id: "scene-menu", parentId: "folder-scenes", name: "MainMenu.scene", type: "scene", children: [] },

    "folder-materials": { id: "folder-materials", parentId: "root", name: "Materials", type: "folder", children: ["mat-player", "mat-ground"] },
    "mat-player": { id: "mat-player", parentId: "folder-materials", name: "PlayerMat.mat", type: "material", children: [] },
    "mat-ground": { id: "mat-ground", parentId: "folder-materials", name: "GroundMat.mat", type: "material", children: [] },

    "folder-prefabs": { id: "folder-prefabs", parentId: "root", name: "Prefabs", type: "folder", children: ["prefab-player", "prefab-enemy"] },
    "prefab-player": { id: "prefab-player", parentId: "folder-prefabs", name: "Player.prefab", type: "prefab", children: [] },
    "prefab-enemy": { id: "prefab-enemy", parentId: "folder-prefabs", name: "Enemy.prefab", type: "prefab", children: [] },

    "folder-models": { id: "folder-models", parentId: "root", name: "Models", type: "folder", children: ["model-tree", "model-rock"] },
    "model-tree": { id: "model-tree", parentId: "folder-models", name: "Tree.glb", type: "model", children: [] },
    "model-rock": { id: "model-rock", parentId: "folder-models", name: "Rock.glb", type: "model", children: [] },
}

export const useMockFileSystem = () => {
    const [nodes, setNodes] = useState<Record<string, FileSystemNode>>(INITIAL_DATA)
    const [currentPath, setCurrentPath] = useState<string[]>(["root"])

    const currentFolderId = currentPath[currentPath.length - 1]

    const getChildren = useCallback((id: string) => {
        const node = nodes[id]
        if (!node || !node.children) return []
        return node.children.map(childId => nodes[childId])
    }, [nodes])

    const navigateTo = useCallback((folderId: string) => {
        // Find path to root
        const path: string[] = []
        let current: string | null = folderId
        while (current) {
            path.unshift(current)
            current = nodes[current]?.parentId
        }
        setCurrentPath(path)
    }, [nodes])

    const navigateUp = useCallback(() => {
        if (currentPath.length > 1) {
            setCurrentPath(prev => prev.slice(0, -1))
        }
    }, [currentPath])

    const moveNodes = useCallback((nodeIds: string[], targetFolderId: string) => {
        setNodes(prev => {
            const nextState = { ...prev }
            const targetFolderBase = nextState[targetFolderId]

            if (!targetFolderBase || targetFolderBase.type !== 'folder') {
                return prev
            }

            let hasChanges = false

            nodeIds.forEach(nodeId => {
                const node = nextState[nodeId]
                if (!node) return

                const oldParentId = node.parentId
                if (!oldParentId || oldParentId === targetFolderId) return

                // Check for cycles: prevent moving into self or descendant
                let current = targetFolderId
                let isCycle = false
                while (current) {
                    if (current === nodeId) {
                        isCycle = true
                        break
                    }
                    current = nextState[current]?.parentId || ''
                }
                if (isCycle) return

                // Refresh parent and target from state as they might have changed in previous iteration
                const oldParent = nextState[oldParentId]
                const targetFolder = nextState[targetFolderId] // Always get fresh target

                // Remove from old parent
                nextState[oldParentId] = {
                    ...oldParent,
                    children: oldParent.children.filter(id => id !== nodeId)
                }

                // Add to new parent
                nextState[targetFolderId] = {
                    ...targetFolder,
                    children: [...targetFolder.children, nodeId]
                }

                // Update node
                nextState[nodeId] = {
                    ...node,
                    parentId: targetFolderId
                }
                hasChanges = true
            })

            return hasChanges ? nextState : prev
        })
    }, [])

    const moveNode = useCallback((nodeId: string, targetFolderId: string) => {
        moveNodes([nodeId], targetFolderId)
    }, [moveNodes])

    const createFolder = useCallback((parentId: string, name: string) => {
        const newId = `folder-${Date.now()}`
        const newNode: FileSystemNode = {
            id: newId,
            name: name,
            type: 'folder',
            children: [],
            parentId
        }

        setNodes(prev => ({
            ...prev,
            [parentId]: {
                ...prev[parentId],
                children: [...prev[parentId].children, newId]
            },
            [newId]: newNode
        }))
        return newId
    }, [])

    const createAsset = useCallback((parentId: string, name: string, type: AssetType) => {
        const newId = `asset-${Date.now()}`
        const newNode: FileSystemNode = {
            id: newId,
            name: name,
            type,
            children: [],
            parentId
        }

        setNodes(prev => ({
            ...prev,
            [parentId]: {
                ...prev[parentId],
                children: [...prev[parentId].children, newId]
            },
            [newId]: newNode
        }))
        return newId
    }, [])

    const renameNode = useCallback((nodeId: string, newName: string) => {
        setNodes(prev => {
            const node = prev[nodeId]
            if (!node) return prev

            return {
                ...prev,
                [nodeId]: { ...node, name: newName }
            }
        })
    }, [])

    const duplicateNode = useCallback((nodeId: string) => {
        setNodes(prev => {
            const node = prev[nodeId]
            if (!node || !node.parentId) return prev

            const parent = prev[node.parentId]
            const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

            // Generate unique name: "Name (1)"
            let newName = `${node.name} (1)`
            // Simple check (in real app, check all siblings loop)
            // For now just appending (1) is sufficient for mock

            const newNode: FileSystemNode = {
                ...node,
                id: newId,
                name: newName,
                children: [] // If folder, simplistic duplicate is empty. Deep copy is harder in mock but acceptable for MVP.
            }

            return {
                ...prev,
                [node.parentId]: {
                    ...parent,
                    children: [...parent.children, newId]
                },
                [newId]: newNode
            }
        })
    }, [])

    const deleteNode = useCallback((nodeId: string) => {
        setNodes(prev => {
            const node = prev[nodeId]
            if (!node || !node.parentId) return prev

            const parent = prev[node.parentId]
            // Recursively delete children (simplified: just remove references, GC handles rest usually but here we strictly rely on nodes map)
            // Ideally we should delete children from map too but for mock this is okay-ish. 
            // Better to remove from parent's children list.

            // Create a new state object without the deleted node and its children
            const newState = { ...prev };

            // Helper function to recursively delete a node and its children from the state
            const deleteNodeAndChildren = (idToDelete: string) => {
                const nodeToDelete = newState[idToDelete];
                if (nodeToDelete) {
                    // Recursively delete children
                    nodeToDelete.children.forEach(childId => deleteNodeAndChildren(childId));
                    // Delete the node itself
                    delete newState[idToDelete];
                }
            };

            // Remove the node from its parent's children list
            if (parent) {
                newState[node.parentId] = {
                    ...parent,
                    children: parent.children.filter(id => id !== nodeId)
                };
            }

            // Delete the node and its children from the state map
            deleteNodeAndChildren(nodeId);

            return newState;
        })
    }, [])

    return {
        nodes,
        currentPath,
        currentFolderId,
        getChildren,
        navigateTo,
        navigateUp,
        moveNode,
        moveNodes,
        createFolder,
        createAsset,
        deleteNode,
        renameNode,
        duplicateNode
    }
}
