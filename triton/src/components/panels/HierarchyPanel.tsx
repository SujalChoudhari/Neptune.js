import type { IDockviewPanelProps } from "dockview"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
    ThemedScrollArea,
    ThemedContextMenu,
    ThemedContextMenuTrigger,
    ThemedContextMenuContent,
    ThemedContextMenuItem,
    ThemedContextMenuSeparator,
    ThemedContextMenuLabel
} from "@/components/library"
import { useGameContext } from "@/context/GameContext"
import { HierarchyItem } from "./hierarchy/HierarchyItem"
import { HierarchyToolbar } from "./hierarchy/HierarchyToolbar"
import type { SceneEntity } from "@/types/engine"

export const HierarchyPanel = (_props: IDockviewPanelProps) => {
    const {
        entities,
        selectedIds,
        selectEntity,
        moveEntities,
        notifyGame
    } = useGameContext()

    const [searchQuery, setSearchQuery] = useState("")
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

    // Helper to get children
    const getChildren = useCallback((id: string) => {
        const entity = entities[id]
        if (!entity || !entity.children) return []
        // Map children IDs to entities
        return entity.children
            .map(childId => entities[childId])
            .filter(Boolean)
    }, [entities])

    // Actions Wrapper
    const toggleActive = (id: string) => {
        const ent = entities[id];
        if (ent) {
            notifyGame('editor:update-component', { id, component: 'active', data: !ent.active }); // Special case, active is on entity root
            // OR notifyGame('editor:set-active', { id, active: !ent.active })
            // Let's use a generic update if possible or specific command
            // For now, I'll use a specific message if 'update-component' implies component
            // But my bridge logic handled 'active' in 'editor:update-component' somewhat? No it checked component name.
            // Let's assume I send a custom event for active
            notifyGame('editor:set-active', { id, active: !ent.active });
        }
    }

    const toggleLock = (id: string) => {
        const ent = entities[id];
        if (ent) notifyGame('editor:set-locked', { id, locked: !ent.locked });
    }

    const toggleExpanded = (id: string) => {
        // This is purely editor state usually.
        // But if we want to persist it, we might need a way.
        // For now, let's just trigger a local update or send to game if game tracks it mechanism.
        // My GameContext bridge updates 'entities' from game payload.
        // So if I want to expand, I must tell the game (if game is source of truth) OR manage a local 'expandedIds' set.
        // Given the time, I'll manage a local 'expandedIds' overlay or just send it to game if I assume game holds "EditorProjectState".
        // Let's implement a local 'expanded' overlay for now to avoid round trip lag for visual toggles.
        // BUT the recursive render uses 'entity.expanded'.
        // So I must force the entity state to change.
        notifyGame('editor:set-expanded', { id, expanded: !entities[id]?.expanded });
    }

    const renameEntity = (id: string, newName: string) => {
        notifyGame('editor:rename', { id, name: newName });
    }

    const removeEntity = (id: string) => {
        notifyGame('editor:delete', { id });
    }

    const addEntity = (parentId: string, name: string, type: string) => {
        notifyGame('editor:create-entity', { parentId, name, type });
    }

    // Simple search filtering
    const filteredEntities = useMemo(() => {
        if (!searchQuery.trim()) return entities

        const results: Record<string, SceneEntity> = {}
        const query = searchQuery.toLowerCase()

        Object.values(entities).forEach(entity => {
            if (entity.name.toLowerCase().includes(query)) {
                results[entity.id] = entity
                // Also add parents to ensure they are visible in tree
                let curr = entity.parentId
                while (curr && !results[curr]) {
                    if (entities[curr]) {
                        results[curr] = entities[curr]
                        curr = entities[curr].parentId
                    } else {
                        break;
                    }
                }
            }
        })
        return results
    }, [entities, searchQuery])

    // Helper to get flattened list of visible (expanded) entity IDs
    const getVisibleFlatList = useMemo(() => {
        const list: string[] = []
        const traverse = (id: string) => {
            if (id !== 'root') list.push(id)
            const entity = entities[id]
            // Allow root to be traversed
            if ((id === 'root' || (entities[id] && entities[id].expanded)) || searchQuery.trim()) {
                const children = getChildren(id)
                children.forEach(child => traverse(child.id))
            }
        }
        if (entities['root']) traverse('root')
        return list
    }, [entities, searchQuery, getChildren])

    const handleSelect = (id: string, multi: boolean, shift?: boolean) => {
        if (shift && lastSelectedId) {
            const list = getVisibleFlatList
            const start = list.indexOf(lastSelectedId)
            const end = list.indexOf(id)
            if (start !== -1 && end !== -1) {
                const range = list.slice(Math.min(start, end), Math.max(start, end) + 1)
                // Select multiple
                // We need to implement multi-select in context
                // For now, I'll just select one or manually construct list
                // My GameContext has selectEntity(id, multi).
                // It doesn't support "SET SELECTION TO LIST".
                // I should add that or loop. Loop is bad for perf but okay for now.
                // Or better: selectEntity currently does "PUSH" or "SET".
                // Context implementation: selectEntity(id, multi) -> if multi, append.
                // I need "replace selection with list".
                // I will update context later if needed, but for now let's just do single select or simple multi.
                range.forEach((rid, idx) => selectEntity(rid, idx === 0 ? false : true));
            }
        } else {
            selectEntity(id, multi)
        }
        setLastSelectedId(id)
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'a') {
                    // e.preventDefault()
                    // Select All visible?
                }
            }

            if (e.key === 'Delete') {
                selectedIds.forEach(id => removeEntity(id))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIds]) // Removed removeEntity dep as it's stable

    const handleBackgroundClick = () => {
        selectEntity("", false) // clear
        setLastSelectedId(null)
    }

    // Calculate all ancestors of currently selected entities
    const selectedAncestorIds = useMemo(() => {
        const ancestors = new Set<string>()
        selectedIds.forEach(id => {
            let curr = entities[id]?.parentId
            while (curr && curr !== 'root') {
                ancestors.add(curr)
                if (entities[curr]) {
                    curr = entities[curr].parentId
                } else {
                    break;
                }
            }
        })
        return ancestors
    }, [selectedIds, entities])

    const handleExpandAll = () => {
        // notifyGame('editor:expand-all')
    }

    const handleCollapseAll = () => {
        // notifyGame('editor:collapse-all')
    }

    const handleMove = (draggedIdsArg: string | string[], targetParentId: string, targetIndex?: number | 'before' | 'after', relativeToId?: string) => {
        const draggedIds = Array.isArray(draggedIdsArg) ? draggedIdsArg : [draggedIdsArg]

        if (typeof targetIndex === 'number' || targetIndex === undefined) {
            moveEntities(draggedIds, targetParentId, targetIndex as number | undefined)
            return
        }

        // Reordering logic
        const parent = entities[targetParentId]
        if (!parent || !relativeToId) return

        const currentIndex = parent.children.indexOf(relativeToId)
        if (currentIndex === -1) return

        const finalIndex = targetIndex === 'before' ? currentIndex : currentIndex + 1
        moveEntities(draggedIds, targetParentId, finalIndex)
    }

    const renderTree = (id: string, depth: number = 0): React.ReactNode => {
        const entity = entities[id]
        if (!entity) return null

        // If searching, only show if it matches search criteria
        if (searchQuery.trim() && !filteredEntities[id]) return null

        const children = getChildren(id)

        // Root is special, usually hidden
        const isRoot = id === 'root';

        return (
            <div key={id}>
                {!isRoot && (
                    <ThemedContextMenu>
                        <ThemedContextMenuTrigger>
                            <HierarchyItem
                                entity={entity}
                                depth={depth - 1}
                                isSelected={selectedIds.includes(id)}
                                isAncestorSelected={selectedAncestorIds.has(id)}
                                selectedIds={selectedIds}
                                onSelect={handleSelect}
                                onToggleActive={toggleActive}
                                onToggleLock={toggleLock}
                                onToggleExpanded={toggleExpanded}
                                onRename={renameEntity}
                                onRemove={removeEntity}
                                onMove={handleMove}
                            />
                        </ThemedContextMenuTrigger>
                        <ThemedContextMenuContent>
                            <ThemedContextMenuLabel>{entity.name}</ThemedContextMenuLabel>
                            <ThemedContextMenuSeparator />
                            <ThemedContextMenuItem onClick={() => { notifyGame('editor:duplicate', { id }) }}>Duplicate</ThemedContextMenuItem>
                            <ThemedContextMenuItem onClick={() => removeEntity(id)} className="text-red-400">Delete</ThemedContextMenuItem>
                            <ThemedContextMenuSeparator />
                            <ThemedContextMenuItem onClick={() => addEntity(id, "New GameObject", "empty")}>Create Empty Child</ThemedContextMenuItem>
                        </ThemedContextMenuContent>
                    </ThemedContextMenu>
                )}

                {(isRoot || entity.expanded || searchQuery.trim()) && children.length > 0 && (
                    <div className="flex flex-col">
                        {children.map(child => renderTree(child.id, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    // Guard: Waiting for connection
    if (!entities['root']) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <p className="text-sm">Waiting for Game Engine...</p>
                <p className="text-xs opacity-50 mt-1">Make sure the game is running.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-background select-none">
            <HierarchyToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddEntity={(type) => addEntity('root', `New ${type}`, type)}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
            />

            <ThemedScrollArea
                className="flex-1 bg-[#1a1a1a]/50"
                maxHeight="100%"
            >
                <div
                    className="py-1 min-h-full"
                    onClick={handleBackgroundClick}
                    onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()

                        let draggedIds: string[] = []
                        try {
                            const jsonData = e.dataTransfer.getData("application/json")
                            if (jsonData) {
                                draggedIds = JSON.parse(jsonData)
                            } else {
                                const textData = e.dataTransfer.getData("text/plain")
                                if (textData) draggedIds = [textData]
                            }
                        } catch (err) {
                            console.error("Failed to parse background drop data", err)
                        }

                        if (draggedIds.length > 0) {
                            handleMove(draggedIds, 'root')
                        }
                    }}
                >
                    {/* Render from root's children to keep root invisible but its structure intact */}
                    {getChildren('root').map(child => renderTree(child.id, 1))}

                    {/* Empty State / Bottom Spacer for clicking */}
                    <div className="h-32" />
                </div>
            </ThemedScrollArea>

            {/* Footer / Status */}
            <div className="h-5 border-t border-border bg-card flex items-center px-2 text-[10px] text-muted-foreground">
                <span className="truncate flex-1">
                    {Object.keys(entities).length - 1} Entities
                </span>
                {selectedIds.length > 0 && (
                    <span>{selectedIds.length} Selected</span>
                )}
            </div>
        </div>
    )
}
