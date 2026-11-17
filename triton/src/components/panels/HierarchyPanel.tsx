import type { IDockviewPanelProps } from "dockview"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
    ThemedScrollArea
} from "@/components/library"
import { useGameContext } from "@/context/GameContext"
import { HierarchyItem } from "./hierarchy/HierarchyItem"
import { HierarchyToolbar } from "./hierarchy/HierarchyToolbar"
import type { SceneEntity } from "@/types/engine"
import { EditorGameRunner } from "@/lib/editorGameRunner"
import { visibleHierarchyIds, hierarchySelectionForClick } from "../../lib/visibleHierarchyIds"
import { handleHierarchyShortcut } from "../../lib/hierarchyShortcuts"
import { SceneContextMenu, type SceneContextMenuRequest, type SceneContextAction } from "./SceneContextMenu"
import { sceneContextSelection } from "@/lib/sceneContextMenu.mjs"

export const HierarchyPanel = (_props: IDockviewPanelProps) => {
    const {
        entities,
        selectedIds,
        currentScenePath,
        selectEntity,
        selectEntities,
        setEntityExpansion,
        moveEntities,
        addEntityToHierarchy,
        setEntityActiveInHierarchy,
        setEntityLocked,
        renameEntityInHierarchy,
        removeEntityFromHierarchy,
        duplicateEntityInHierarchy,
        beginSceneEdit,
        deleteEntitiesInHierarchy
    } = useGameContext()

    const [searchQuery, setSearchQuery] = useState("")
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
    const [contextRequest, setContextRequest] = useState<SceneContextMenuRequest | null>(null)

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
        if (!ent) return;
        setEntityActiveInHierarchy(id, !ent.active);
    }

    const toggleLock = (id: string) => {
        const ent = entities[id];
        if (ent) setEntityLocked(id, !ent.locked);
    }

    const toggleExpanded = (id: string) => {
        const entity = entities[id];
        if (entity?.children.length) setEntityExpansion([id], !entity.expanded);
    }

    const renameEntity = (id: string, newName: string) => {
        renameEntityInHierarchy(id, newName);
        setRenamingId(null)
    }

    const removeEntity = useCallback((id: string) => {
        removeEntityFromHierarchy(id);
    }, [removeEntityFromHierarchy])

    const addEntity = (parentId: string, name: string, type: string) => {
        const id = globalThis.crypto?.randomUUID?.() || `entity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const components = type === 'enemy'
            ? [{ type: 'EnemyConfig', props: { maxHealth: 100, moveSpeed: 2, contactDamage: 10, behavior: 'patrol' } }]
            : type === 'quest'
            ? [{ type: 'QuestDefinition', props: { name: 'New Quest', description: 'Describe the quest...', objectiveId: 'objective-1', objective: 'Describe the objective...', required: 1 } }]
            : type === 'dialogue'
            ? [{ type: 'Dialogue', props: { speaker: 'Speaker', text: 'Enter dialogue...', next: '' } }]
            : type === 'spawn-point'
            ? [{ type: 'SpawnPoint', props: { spawnId: id, facing: 'right' } }]
            : type === 'scene-transition'
            ? [{ type: 'SceneTransition', props: { targetScene: '', spawnPoint: '', trigger: 'enter' } }, { type: 'TriggerCollider', props: { width: 1, height: 1, offsetX: 0, offsetY: 0 } }]
            : type === 'entity'
            ? [{ type: 'Transform', props: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } } }]
            : type === 'trigger-area'
            ? [{ type: 'TriggerCollider', props: { width: 1, height: 1, offsetX: 0, offsetY: 0 } }]
            : type === 'hitbox'
                ? [{ type: 'Hitbox', props: { width: 1, height: 1, offsetX: 0, offsetY: 0 } }]
                : type === 'hurtbox'
                    ? [{ type: 'Hurtbox', props: { width: 1, height: 1, offsetX: 0, offsetY: 0 } }]
            : undefined
        const entityComponents = components || [];
        const created = addEntityToHierarchy({
            id, parentId, name, type: type as SceneEntity['type'], children: [],
            active: true, locked: false, expanded: false
        }, entityComponents);
        if (!created) return
    }

    // Simple search filtering
    const filteredEntities = useMemo(() => {
        if (!searchQuery.trim()) return entities

        const results: Record<string, SceneEntity> = {}
        const query = searchQuery.toLowerCase()

        Object.values(entities).forEach(entity => {
            if (entity.name.toLowerCase().includes(query)) {
                results[entity.id] = entity
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
    const getVisibleFlatList = useMemo(() => visibleHierarchyIds(entities, searchQuery), [entities, searchQuery])
    const parentIds = useMemo(() => Object.fromEntries(Object.values(entities).map(entity => [entity.id, entity.parentId])), [entities])

    const handleSelect = (id: string, multi: boolean, shift?: boolean) => {
        if (shift && lastSelectedId) {
            const range = hierarchySelectionForClick(getVisibleFlatList, lastSelectedId, id);
            selectEntities(multi ? [...new Set([...selectedIds, ...range])] : range);
        } else {
            selectEntity(id, multi)
        }
        if (!shift || !lastSelectedId || !getVisibleFlatList.includes(lastSelectedId)) setLastSelectedId(id)
    }

    useEffect(() => {
        if (lastSelectedId && !entities[lastSelectedId]) setLastSelectedId(null)
    }, [entities, lastSelectedId])

    useEffect(() => {
        setLastSelectedId(null)
    }, [currentScenePath])

    useEffect(() => {
        const startRename = (event: Event) => {
            const id = (event as CustomEvent<{ id?: string }>).detail?.id
            if (typeof id === 'string' && entities[id] && !entities[id].locked) setRenamingId(id)
        }
        window.addEventListener('editor:rename-selection', startRename)
        return () => window.removeEventListener('editor:rename-selection', startRename)
    }, [entities])

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            handleHierarchyShortcut(e, document.activeElement, selectedIds, removeEntity, setRenamingId, parentIds)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIds, removeEntity, parentIds])

    const handleBackgroundClick = () => {
        selectEntity("", false) // clear
        setLastSelectedId(null)
        setRenamingId(null)
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

    const hierarchyContainers = Object.values(entities)
        .filter(entity => entity.id !== 'root' && entity.children.length > 0)
        .map(entity => entity.id);
    const handleExpandAll = () => setEntityExpansion(hierarchyContainers, true)
    const handleCollapseAll = () => setEntityExpansion(hierarchyContainers, false)

    const handleMove = (draggedIdsArg: string | string[], targetParentId: string, targetIndex?: number | 'before' | 'after', relativeToId?: string) => {
        const draggedIds = Array.isArray(draggedIdsArg) ? draggedIdsArg : [draggedIdsArg]
        if (typeof targetIndex === 'number' || targetIndex === undefined) {
            moveEntities(draggedIds, targetParentId, targetIndex as number | undefined)
            return
        }

        const parent = entities[targetParentId]
        if (!parent || !relativeToId) return

        const finalIndex = EditorGameRunner.resolveHierarchyDropIndex(parent.children, draggedIds, targetIndex, relativeToId)
        if (finalIndex === null) return
        moveEntities(draggedIds, targetParentId, finalIndex)
    }

    const openEntityContext = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        const entity = entities[id]
        if (!entity) return
        const nextSelection = entity.locked ? selectedIds : sceneContextSelection(id, selectedIds, entities)
        if (!entity.locked) selectEntities(nextSelection)
        setContextRequest({ x: event.clientX, y: event.clientY, targetId: id, selectedIds: nextSelection.length ? nextSelection : [id] })
    }

    const handleContextAction = (action: SceneContextAction, request: SceneContextMenuRequest) => {
        const id = request.targetId
        if (!id) {
            if (action === 'create-empty') addEntity('root', 'New Entity', 'empty')
            return
        }
        const ids = request.selectedIds.length ? request.selectedIds : [id]
        if (action === 'select') selectEntities(ids)
        else if (action === 'frame') window.dispatchEvent(new CustomEvent('editor:frame-selection', { detail: { ids } }))
        else if (action === 'rename') setRenamingId(id)
        else if (action === 'duplicate') {
            const roots = ids.filter(targetId => {
                const seen = new Set<string>()
                for (let parent = entities[targetId]?.parentId; parent && !seen.has(parent); parent = entities[parent]?.parentId) {
                    if (ids.includes(parent)) return false
                    seen.add(parent)
                }
                return true
            })
            const transaction = roots.length > 1 ? beginSceneEdit('Duplicate selection') : null
            try {
                for (const targetId of roots) {
                    if (!duplicateEntityInHierarchy(targetId)) { transaction?.cancel(); return }
                }
                transaction?.commit()
            } catch (error) { transaction?.cancel(); EditorGameRunner.report(error) }
        }
        else if (action === 'delete') deleteEntitiesInHierarchy(ids)
        else if (action === 'toggle-active') {
            const active = !entities[id]?.active
            const transaction = ids.length > 1 ? beginSceneEdit('Change selection activation') : null
            try { ids.forEach(targetId => setEntityActiveInHierarchy(targetId, active)); transaction?.commit() }
            catch (error) { transaction?.cancel(); EditorGameRunner.report(error) }
        } else if (action === 'toggle-lock') {
            const locked = !entities[id]?.locked
            const transaction = ids.length > 1 ? beginSceneEdit('Change selection lock') : null
            try { ids.forEach(targetId => setEntityLocked(targetId, locked)); transaction?.commit() }
            catch (error) { transaction?.cancel(); EditorGameRunner.report(error) }
        }
    }

    const renderTree = (id: string, depth: number = 0): React.ReactNode => {
        const entity = entities[id]
        if (!entity) return null

        if (searchQuery.trim() && !filteredEntities[id]) return null

        const children = getChildren(id)
        const isRoot = id === 'root';

        const isVirtual = entity.type === 'camera';

        return (
            <div key={id}>
                {!isRoot && (
                    <div data-hierarchy-item onContextMenu={event => openEntityContext(event, id)}>
                            <HierarchyItem
                                entity={entity}
                                depth={depth - 1}
                                isVirtual={isVirtual}
                                isSelected={selectedIds.includes(id)}
                                isAncestorSelected={selectedAncestorIds.has(id)}
                                isRenaming={renamingId === id}
                                selectedIds={selectedIds}
                                onSelect={handleSelect}
                                onToggleActive={toggleActive}
                                onToggleLock={toggleLock}
                                onToggleExpanded={toggleExpanded}
                                onRename={renameEntity}
                                onRenameCancel={() => setRenamingId(null)}
                                onRemove={removeEntity}
                                onMove={handleMove}
                            />
                    </div>
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
        <div data-hierarchy-panel className="h-full flex flex-col bg-background select-none">
            <HierarchyToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddEntity={(type) => addEntity('root', type === 'scene-transition' ? 'Scene Transition' : type === 'enemy' ? 'Enemy' : type === 'quest' ? 'Quest' : type === 'dialogue' ? 'Dialogue' : type === 'entity' ? 'New Entity' : type === 'spawn-point' ? 'Spawn Point' : type === 'trigger-area' ? 'Trigger Area' : type === 'hitbox' ? 'Hitbox' : type === 'hurtbox' ? 'Hurtbox' : `New ${type}`, type)}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
            />

            <ThemedScrollArea
                className="flex-1 min-h-0 bg-background"
                maxHeight="100%"
            >
                <div
                    className="py-1 min-h-full"
                    onContextMenu={event => {
                        if ((event.target as HTMLElement).closest('[data-hierarchy-item]')) return
                        event.preventDefault()
                        setContextRequest({ x: event.clientX, y: event.clientY, targetId: null, selectedIds: [] })
                    }}
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
            <SceneContextMenu
                request={contextRequest}
                targetName={contextRequest?.targetId ? entities[contextRequest.targetId]?.name : undefined}
                isActive={contextRequest?.targetId ? entities[contextRequest.targetId]?.active : true}
                isLocked={contextRequest?.targetId ? entities[contextRequest.targetId]?.locked : false}
                onAction={handleContextAction}
                onClose={() => setContextRequest(null)}
            />

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
