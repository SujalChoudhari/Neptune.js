import type { IDockviewPanelProps } from "dockview"
import { useState, useMemo, useEffect } from "react"
import {
    ThemedScrollArea,
    ThemedContextMenu,
    ThemedContextMenuTrigger,
    ThemedContextMenuContent,
    ThemedContextMenuItem,
    ThemedContextMenuSeparator,
    ThemedContextMenuLabel
} from "@/components/library"
import { useMockHierarchy, type SceneEntity } from "@/lib/mockHierarchy"
import { HierarchyItem } from "./hierarchy/HierarchyItem"
import { HierarchyToolbar } from "./hierarchy/HierarchyToolbar"

export const HierarchyPanel = (_props: IDockviewPanelProps) => {
    const {
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
        moveEntities
    } = useMockHierarchy()

    const [searchQuery, setSearchQuery] = useState("")
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

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
                    results[curr] = entities[curr]
                    curr = entities[curr].parentId
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
            if (entity && (id === 'root' || entity.expanded || searchQuery.trim())) {
                const children = getChildren(id)
                children.forEach(child => traverse(child.id))
            }
        }
        traverse('root')
        return list
    }, [entities, searchQuery, getChildren])

    const handleSelect = (id: string, multi: boolean, shift?: boolean) => {
        if (shift && lastSelectedId) {
            const list = getVisibleFlatList
            const start = list.indexOf(lastSelectedId)
            const end = list.indexOf(id)
            if (start !== -1 && end !== -1) {
                const range = list.slice(Math.min(start, end), Math.max(start, end) + 1)
                setSelectedIds(prev => {
                    const next = new Set(multi ? prev : [])
                    range.forEach(rid => next.add(rid))
                    return Array.from(next)
                })
            }
        } else if (multi) {
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
            )
        } else {
            setSelectedIds([id])
        }
        setLastSelectedId(id)
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if this panel or its children have focus or if we are the active panel
            // For now, simple check: if no input is focused
            if (document.activeElement?.tagName === 'INPUT') return

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'a') {
                    e.preventDefault()
                    setSelectedIds(getVisibleFlatList)
                }
            }

            if (e.key === 'Delete') {
                selectedIds.forEach(id => removeEntity(id))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [getVisibleFlatList, selectedIds, removeEntity])

    const handleBackgroundClick = () => {
        setSelectedIds([])
        setLastSelectedId(null)
    }

    // Calculate all ancestors of currently selected entities
    const selectedAncestorIds = useMemo(() => {
        const ancestors = new Set<string>()
        selectedIds.forEach(id => {
            let curr = entities[id]?.parentId
            while (curr && curr !== 'root') {
                ancestors.add(curr)
                curr = entities[curr].parentId
            }
        })
        return ancestors
    }, [selectedIds, entities])

    const handleExpandAll = () => {
        // Implementation for toggleExpanded on all (simplified: set all expanded to true)
        // In real app, we'd update state batch
    }

    const handleCollapseAll = () => {
        // Implementation for toggleExpanded on all
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

        return (
            <div key={id}>
                {id !== 'root' && (
                    <ThemedContextMenu>
                        <ThemedContextMenuTrigger>
                            <HierarchyItem
                                entity={entity}
                                depth={depth - 1} // -1 because root is hidden usually
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
                            <ThemedContextMenuItem onClick={() => { }}>Duplicate</ThemedContextMenuItem>
                            <ThemedContextMenuItem onClick={() => removeEntity(id)} className="text-red-400">Delete</ThemedContextMenuItem>
                            <ThemedContextMenuSeparator />
                            <ThemedContextMenuItem onClick={() => addEntity(id, "New GameObject", "empty")}>Create Empty Child</ThemedContextMenuItem>
                        </ThemedContextMenuContent>
                    </ThemedContextMenu>
                )}

                {(entity.expanded || searchQuery.trim()) && children.length > 0 && (
                    <div className="flex flex-col">
                        {children.map(child => renderTree(child.id, depth + 1))}
                    </div>
                )}
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
