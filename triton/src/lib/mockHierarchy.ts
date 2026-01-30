import { useState, useCallback } from "react"

export type EntityType = 'cube' | 'sphere' | 'light' | 'camera' | 'empty' | 'group'

export interface SceneEntity {
    id: string
    parentId: string | null
    name: string
    type: EntityType
    children: string[]
    active: boolean
    locked: boolean
    expanded: boolean
}

// Initial Mock Data
const INITIAL_ENTITIES: Record<string, SceneEntity> = {
    "root": {
        id: "root",
        parentId: null,
        name: "Main Scene",
        type: "group",
        children: ["cam-01", "light-dir", "player-grp", "env-grp"],
        active: true,
        locked: false,
        expanded: true
    },
    "cam-01": {
        id: "cam-01",
        parentId: "root",
        name: "Main Camera",
        type: "camera",
        children: [],
        active: true,
        locked: true,
        expanded: false
    },
    "light-dir": {
        id: "light-dir",
        parentId: "root",
        name: "Directional Light",
        type: "light",
        children: [],
        active: true,
        locked: false,
        expanded: false
    },
    "player-grp": {
        id: "player-grp",
        parentId: "root",
        name: "Player_Character",
        type: "group",
        children: ["player-mesh", "player-shield"],
        active: true,
        locked: false,
        expanded: true
    },
    "player-mesh": {
        id: "player-mesh",
        parentId: "player-grp",
        name: "Character_Mesh",
        type: "cube",
        children: [],
        active: true,
        locked: false,
        expanded: false
    },
    "player-shield": {
        id: "player-shield",
        parentId: "player-grp",
        name: "Energy_Shield",
        type: "sphere",
        children: [],
        active: false,
        locked: false,
        expanded: false
    },
    "env-grp": {
        id: "env-grp",
        parentId: "root",
        name: "Level_Geometry",
        type: "group",
        children: ["env-floor", "env-wall-01"],
        active: true,
        locked: false,
        expanded: true
    },
    "env-floor": {
        id: "env-floor",
        parentId: "env-grp",
        name: "Floor_Grid",
        type: "cube",
        children: [],
        active: true,
        locked: true,
        expanded: false
    },
    "env-wall-01": {
        id: "env-wall-01",
        parentId: "env-grp",
        name: "Wall_Segment",
        type: "cube",
        children: [],
        active: true,
        locked: false,
        expanded: false
    }
}

export const useMockHierarchy = () => {
    const [entities, setEntities] = useState<Record<string, SceneEntity>>(INITIAL_ENTITIES)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const getChildren = useCallback((id: string) => {
        const entity = entities[id]
        if (!entity || !entity.children) return []
        return entity.children.map(childId => entities[childId]).filter(Boolean)
    }, [entities])

    const toggleActive = useCallback((id: string) => {
        setEntities(prev => ({
            ...prev,
            [id]: { ...prev[id], active: !prev[id].active }
        }))
    }, [])

    const toggleLock = useCallback((id: string) => {
        setEntities(prev => ({
            ...prev,
            [id]: { ...prev[id], locked: !prev[id].locked }
        }))
    }, [])

    const toggleExpanded = useCallback((id: string) => {
        setEntities(prev => ({
            ...prev,
            [id]: { ...prev[id], expanded: !prev[id].expanded }
        }))
    }, [])

    const renameEntity = useCallback((id: string, newName: string) => {
        setEntities(prev => ({
            ...prev,
            [id]: { ...prev[id], name: newName }
        }))
    }, [])

    const removeEntity = useCallback((id: string) => {
        setEntities(prev => {
            const entity = prev[id]
            if (!entity || !entity.parentId) return prev

            const newState = { ...prev }
            const parent = newState[entity.parentId]

            // Remove from parent
            newState[entity.parentId] = {
                ...parent,
                children: parent.children.filter(cid => cid !== id)
            }

            // Recursive delete
            const deleteRecursive = (targetId: string) => {
                const target = newState[targetId]
                if (target) {
                    target.children.forEach(deleteRecursive)
                    delete newState[targetId]
                }
            }
            deleteRecursive(id)

            return newState
        })
        setSelectedIds(prev => prev.filter(sid => sid !== id))
    }, [])

    const addEntity = useCallback((parentId: string, name: string, type: EntityType) => {
        const id = `${type}-${Date.now()}`
        const newEntity: SceneEntity = {
            id,
            parentId,
            name,
            type,
            children: [],
            active: true,
            locked: false,
            expanded: false
        }

        setEntities(prev => ({
            ...prev,
            [parentId]: {
                ...prev[parentId],
                children: [...prev[parentId].children, id],
                expanded: true
            },
            [id]: newEntity
        }))
        setSelectedIds([id])
        return id
    }, [])

    const moveEntity = useCallback((id: string, targetParentId: string, targetIndex?: number) => {
        setEntities(prev => {
            const entity = prev[id]
            const targetParent = prev[targetParentId]
            if (!entity || !targetParent || id === targetParentId) return prev

            // Prevent moving root or cycle
            if (id === 'root') return prev
            let curr: string | null = targetParentId
            while (curr) {
                if (curr === id) return prev
                curr = prev[curr].parentId
            }

            const newState = { ...prev }

            // Remove from old parent
            if (entity.parentId) {
                const oldParent = newState[entity.parentId]
                newState[entity.parentId] = {
                    ...oldParent,
                    children: oldParent.children.filter(cid => cid !== id)
                }
            }

            // Add to new parent at specific index or end
            const targetParentEntity = newState[targetParentId]
            const newChildren = [...targetParentEntity.children]

            if (typeof targetIndex === 'number') {
                newChildren.splice(targetIndex, 0, id)
            } else {
                newChildren.push(id)
            }

            newState[targetParentId] = {
                ...targetParentEntity,
                children: newChildren,
                expanded: true
            }

            // Update entity
            newState[id] = { ...entity, parentId: targetParentId }

            return newState
        })
    }, [])

    const moveEntities = useCallback((ids: string[], targetParentId: string, targetIndex?: number) => {
        setEntities(prev => {
            let newState = { ...prev }
            const targetParent = newState[targetParentId]
            if (!targetParent) return prev

            // 1. Clean up IDs: remove root, targetParent, and duplicates
            const uniqueIds = Array.from(new Set(ids)).filter(id => id !== 'root' && id !== targetParentId)

            // 2. Hierarchical Filter: If both a parent and its descendant are in the selection,
            // only the highest-level ancestor in the selection should be moved.
            const movingIds = uniqueIds.filter(id => {
                let curr = newState[id].parentId
                while (curr) {
                    if (uniqueIds.includes(curr)) return false
                    curr = newState[curr].parentId
                }
                return true
            })

            // 3. Cycle Detection: Prevent moving an item into its own descendant
            const validIds = movingIds.filter(id => {
                let curr: string | null = targetParentId
                while (curr) {
                    if (curr === id) return false
                    curr = newState[curr].parentId
                }
                return true
            })

            if (validIds.length === 0) return prev

            // 4. Sort validIds by current tree order
            const idToOrder = new Map<string, number>()
            let counter = 0
            const traverseTreeSort = (nodeId: string) => {
                idToOrder.set(nodeId, counter++)
                newState[nodeId].children.forEach(traverseTreeSort)
            }
            traverseTreeSort('root')
            const sortedIds = [...validIds].sort((a, b) => (idToOrder.get(a) || 0) - (idToOrder.get(b) || 0))

            // 5. Remove all from their current parents
            sortedIds.forEach(id => {
                const entity = newState[id]
                if (entity.parentId) {
                    const oldParent = newState[entity.parentId]
                    newState[entity.parentId] = {
                        ...oldParent,
                        children: oldParent.children.filter(cid => cid !== id)
                    }
                }
            })

            // 5. Add all to the new parent
            // Refresh targetParent as it might have been updated (if it was one of the old parents)
            const updatedTargetParent = newState[targetParentId]
            const newChildren = [...updatedTargetParent.children]

            if (typeof targetIndex === 'number') {
                newChildren.splice(targetIndex, 0, ...sortedIds)
            } else {
                newChildren.push(...sortedIds)
            }

            newState[targetParentId] = {
                ...updatedTargetParent,
                children: newChildren,
                expanded: true
            }

            // 7. Update parentId for all moved entities
            sortedIds.forEach(id => {
                newState[id] = { ...newState[id], parentId: targetParentId }
            })

            return newState
        })
    }, [])

    return {
        entities,
        selectedIds,
        setSelectedIds,
        getChildren,
        toggleActive,
        toggleLock,
        toggleExpanded,
        renameEntity,
        removeEntity,
        addEntity,
        moveEntity,
        moveEntities
    }
}
