import type { IDockviewPanelProps } from "dockview"
import { useState, useMemo, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Box, Eye, EyeOff, Plus, Save } from "lucide-react"
import { ThemedInput } from "@/components/library"
import { useGameContext } from "@/context/GameContext"
import { renderInspectorComponent } from "./inspector/InspectorRegistry"
import type { EntityData } from "@/types/engine"
import { useFileSystem } from "@/context/FileSystemContext"
import { EditorGameRunner } from "@/lib/editorGameRunner"

/**
 * InspectorPanel
 * 
 * Refactored to use GameContext for real data.
 */
export const InspectorPanel = (_props: IDockviewPanelProps) => {
    const { selectedEntityData, selectedIds, updateComponent, setEntityActiveInHierarchy, renameEntityInHierarchy, notifyGame, currentScenePath } = useGameContext()
    const { writeScene } = useFileSystem()
    const [isSaving, setIsSaving] = useState(false)

    // We derive component list from the actual data + standard order
    const componentOrder = useMemo(() => {
        if (!selectedEntityData) return [];

        // New Source of Truth: components map
        const keys = Object.keys(selectedEntityData.components || {});

        // Filter out 'transform' as it is rendered separately
        return keys.filter(k => k !== 'transform');
    }, [selectedEntityData]);

    const handleSave = useCallback(async () => {
        if (!currentScenePath) return
        setIsSaving(true)
        try {
            await EditorGameRunner.saveScene(async (path, content) => writeScene(path, JSON.parse(content)), currentScenePath)
        } catch (error) {
            EditorGameRunner.report(error)
        } finally {
            setIsSaving(false)
        }
    }, [currentScenePath, writeScene])

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault()
                void handleSave()
            }
        }
        window.addEventListener('keydown', handleShortcut)
        return () => window.removeEventListener('keydown', handleShortcut)
    }, [handleSave])

    if (!selectedEntityData) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-background select-none">
                <p className="text-sm font-medium">No Selection</p>
                <p className="text-xs opacity-50 mt-1">Select an entity in the Hierarchy to view properties.</p>
            </div>
        )
    }

    // Cast to MockEntity because our Inspector components are typed with it
    // EntityData and MockEntity should be compatible enough for now
    const entity: EntityData = selectedEntityData

    const isComponentActive = (key: string) => {
        const entry = Object.entries(entity.components || {}).find(([name]) => name.toLowerCase() === key.toLowerCase())
        return entry?.[1]?.enabled !== false
    }

    const toggleActive = (key: string) => {
        const enabled = !isComponentActive(key)
        selectedIds.forEach(id => {
            updateComponent(id, key, 'enabled', enabled)
            EditorGameRunner.updateEntity(id, key, { enabled })
        })
    }

    // HELPERS
    // We map specifics to generic updateComponent(id, comp, field, value)

    // Transform is special, it's a sub-object usually, but updateComponent handles it via 'transform' component key
    // The previous updateTransform took (key, value).
    const updateTransform = (key: string, value: any) => {
        selectedIds.forEach(id => {
            updateComponent(id, 'transform', key, value)
            EditorGameRunner.updateEntity(id, 'transform', { [key]: value })
        });
    }

    // Generic updater generator
    const makeUpdater = (compName: string) => (key: string, value: any) => {
        selectedIds.forEach(id => {
            updateComponent(id, compName, key, value)
            EditorGameRunner.updateEntity(id, compName, { [key]: value })
        });
    }

    const updateHelpers = {
        updateTransform,
        updateSprite: makeUpdater('sprite'),
        updateCollider: makeUpdater('collider'),
        updateBody: makeUpdater('body'),
        updateStats: makeUpdater('stats'),
        updateAnimator: makeUpdater('animator'),
        updateScript: (index: number, key: string, value: any) => {
            console.log("Update script:", index, key, value);
        },
        updateGeneric: (compName: string, key: string, value: any) => {
            selectedIds.forEach(id => {
                updateComponent(id, compName, key, value)
                EditorGameRunner.updateEntity(id, compName, { [key]: value })
            });
        }
    }

    // Header Actions
    const handleRename = (name: string) => {
        // Renaming multiple entities to the same name? 
        // Usually we only rename the primary one or append numbers. 
        // For simplicity, renaming only affects the PRIMARY selection for now 
        // UNLESS we explicitly want multi-rename.
        // Let's stick to Primary Rename to avoid accidents.
        EditorGameRunner.updateEntity(entity.id, 'name', { value: name })
        renameEntityInHierarchy(entity.id, name)
        notifyGame('editor:rename', { id: entity.id, name });
    };

    const handleToggleActive = () => {
        const nextState = !entity.active;
        selectedIds.forEach(id => {
            EditorGameRunner.updateEntity(id, 'active', { value: nextState })
            setEntityActiveInHierarchy(id, nextState)
            notifyGame('editor:set-active', { id, active: nextState })
        });
    };

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden overflow-x-hidden select-none">
            {/* Entity Header */}
            <div className={cn(
                "shrink-0 p-2 border-b border-border",
                "bg-card/30"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        "bg-gradient-to-b from-[hsl(0,0%,28%)] to-[hsl(0,0%,22%)]",
                        "border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,32%)]",
                        "shadow-[0_2px_4px_rgba(0,0,0,0.3)] shrink-0"
                    )}>
                        <Box className="w-4.5 h-4.5 text-foreground/90" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <ThemedInput
                            value={entity.name}
                            onChange={(e: any) => handleRename(e.target.value)}
                            className="font-bold text-[13px] h-8"
                            disabled={selectedIds.length > 1} // Disable rename on multi-select for clarity
                            placeholder={selectedIds.length > 1 ? `${selectedIds.length} Entities Selected` : undefined}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleActive}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded transition-colors",
                            entity.active ? "text-blue-400 hover:text-blue-300" : "text-muted-foreground/70 hover:text-foreground"
                        )}
                        title={entity.active ? "Disable entity" : "Enable entity"}
                    >
                        {entity.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={!currentScenePath || isSaving}
                        className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40"
                        title={currentScenePath ? "Save scene (Ctrl+S)" : "Open a scene before saving"}
                        aria-label={currentScenePath ? "Save scene" : "Save scene unavailable"}
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Component List */}
            <div className="flex-1 overflow-auto bg-[hsl(0,0%,14%)]">
                {/* TRANSFORM (Fixed at top) */}
                {renderInspectorComponent({
                    compId: 'transform',
                    index: -1,
                    entity,
                    isActive: isComponentActive('transform'),
                    onToggleActive: () => toggleActive('transform'),
                    updateHelpers,
                    moveHelpers: {}
                })}

                {/* DYNAMIC COMPONENTS */}
                {componentOrder.map((compId, index) => renderInspectorComponent({
                    compId: compId as any,
                    index,
                    entity,
                    isActive: isComponentActive(compId),
                    onToggleActive: () => toggleActive(compId),
                    updateHelpers,
                    moveHelpers: {
                        onMoveUp: () => { }, // Reordering not implemented in backend yet
                        onMoveDown: () => { }
                    }
                }))}

                {/* ADD COMPONENT BUTTON */}
                <div className="p-4 mt-2">
                    <button
                        type="button"
                        className={cn(
                            "w-full h-8 flex items-center justify-center gap-2 rounded-md",
                            "bg-gradient-to-b from-[hsl(0,0%,25%)] to-[hsl(0,0%,20%)]",
                            "border border-[hsl(0,0%,18%)] border-t-[hsl(0,0%,30%)]",
                            "text-foreground/90 hover:text-foreground hover:from-[hsl(0,0%,28%)]",
                            "shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all active:translate-y-0.5"
                        )}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Add Component</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
