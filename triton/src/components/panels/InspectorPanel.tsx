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
import { applyInspectorComponentUpdate } from "@/lib/inspectorComponentUpdate"

/** Inspector backed by the selected runtime entity and canonical scene. */
export const InspectorPanel = (_props: IDockviewPanelProps) => {
    const {
        selectedEntityData, selectedIds, updateComponent, notifyGame, currentScenePath,
        renameEntityInHierarchy, setEntityActiveInHierarchy
    } = useGameContext()
    const { writeScene } = useFileSystem()
    const [isSaving, setIsSaving] = useState(false)

    const componentOrder = useMemo(() => selectedEntityData
        ? Object.keys(selectedEntityData.components || {}).filter(key => key !== "transform")
        : [], [selectedEntityData])

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
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                event.preventDefault()
                void handleSave()
            }
        }
        window.addEventListener("keydown", handleShortcut)
        return () => window.removeEventListener("keydown", handleShortcut)
    }, [handleSave])

    if (!selectedEntityData) {
        return <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-background select-none">
            <p className="text-sm font-medium">No Selection</p>
            <p className="text-xs opacity-50 mt-1">Select an entity in the Hierarchy to view properties.</p>
        </div>
    }

    const entity: EntityData = selectedEntityData
    const updateTransform = (key: string, value: any) => selectedIds.forEach(id => {
        updateComponent(id, "transform", key, value)
        EditorGameRunner.updateEntity(id, "transform", { [key]: value })
    })
    const applyComponentUpdate = (id: string, component: string, key: string, value: any) =>
        applyInspectorComponentUpdate({ id, component, key, value, updateComponent, editorGameRunner: EditorGameRunner, currentScenePath, notifyGame })
    const makeUpdater = (component: string) => (key: string, value: any) =>
        selectedIds.forEach(id => applyComponentUpdate(id, component, key, value))
    const updateHelpers = {
        updateTransform,
        updateSprite: makeUpdater("sprite"),
        updateCollider: makeUpdater("collider"),
        updateBody: makeUpdater("body"),
        updateStats: makeUpdater("stats"),
        updateAnimator: makeUpdater("animator"),
        updateScript: (index: number, key: string, value: any) => selectedIds.forEach(id =>
            applyComponentUpdate(id, "scripts", String(index), { [key]: value })),
        updateGeneric: (component: string, key: string, value: any) =>
            selectedIds.forEach(id => applyComponentUpdate(id, component, key, value))
    }
    const componentEnabled = (component: string) => {
        const data = entity.components?.[component]
        return data && typeof data === "object" && "enabled" in data
            ? (data as { enabled?: boolean }).enabled !== false
            : true
    }
    const toggleActive = (component: string) => {
        const enabled = !componentEnabled(component)
        selectedIds.forEach(id => {
            updateComponent(id, component, "enabled", enabled)
            EditorGameRunner.updateEntity(id, component, { enabled })
            notifyGame("editor:update-component", { id, component, data: { enabled } })
        })
    }
    const handleRename = (name: string) => {
        if (!name.trim() || !EditorGameRunner.updateEntity(entity.id, "name", { value: name })) return
        renameEntityInHierarchy(entity.id, name)
        notifyGame("editor:rename", { id: entity.id, name })
    }
    const handleToggleActive = () => {
        const active = !entity.active
        selectedIds.forEach(id => {
            if (!EditorGameRunner.updateEntity(id, "active", { value: active })) return
            setEntityActiveInHierarchy(id, active)
            notifyGame("editor:update-component", { id, component: "active", data: active })
        })
    }

    return <div className="h-full flex flex-col bg-background overflow-hidden overflow-x-hidden select-none">
        <div className={cn("shrink-0 p-2 border-b border-border", "bg-card/30")}>
            <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", "bg-gradient-to-b from-[hsl(0,0%,28%)] to-[hsl(0,0%,22%)]", "border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,32%)]", "shadow-[0_2px_4px_rgba(0,0,0,0.3)] shrink-0")}>
                    <Box className="w-4.5 h-4.5 text-foreground/90" />
                </div>
                <div className="flex-1 min-w-0">
                    <ThemedInput value={entity.name} onChange={(event: any) => handleRename(event.target.value)} className="font-bold text-[13px] h-8" disabled={selectedIds.length > 1} placeholder={selectedIds.length > 1 ? `${selectedIds.length} Entities Selected` : undefined} />
                </div>
                <button type="button" onClick={handleToggleActive} className={cn("w-8 h-8 flex items-center justify-center rounded transition-colors", entity.active ? "text-blue-400 hover:text-blue-300" : "text-muted-foreground/70 hover:text-foreground")} title={entity.active ? "Disable entity" : "Enable entity"}>
                    {entity.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => void handleSave()} disabled={!currentScenePath || isSaving} className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40" title={currentScenePath ? "Save scene (Ctrl+S)" : "Open a scene before saving"} aria-label={currentScenePath ? "Save scene" : "Save scene unavailable"}>
                    <Save className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-auto bg-[hsl(0,0%,14%)]">
            {renderInspectorComponent({ compId: "transform", index: -1, entity, isActive: componentEnabled("transform"), onToggleActive: () => toggleActive("transform"), updateHelpers, moveHelpers: {} })}
            {componentOrder.map((compId, index) => renderInspectorComponent({ compId, index, entity, isActive: componentEnabled(compId), onToggleActive: () => toggleActive(compId), updateHelpers, moveHelpers: { onMoveUp: () => {}, onMoveDown: () => {} } }))}
            <div className="p-4 mt-2">
                <button type="button" className={cn("w-full h-8 flex items-center justify-center gap-2 rounded-md", "bg-gradient-to-b from-[hsl(0,0%,25%)] to-[hsl(0,0%,20%)]", "border border-[hsl(0,0%,18%)] border-t-[hsl(0,0%,30%)]", "text-foreground/90 hover:text-foreground hover:from-[hsl(0,0%,28%)]", "shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all active:translate-y-0.5")}>
                    <Plus className="w-3.5 h-3.5" /><span className="text-xs font-medium">Add Component</span>
                </button>
            </div>
        </div>
    </div>
}
