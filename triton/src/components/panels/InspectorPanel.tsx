import type { IDockviewPanelProps } from "dockview"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { Box, Eye, EyeOff, Plus, Save, Search } from "lucide-react"
import { ThemedInput } from "@/components/library"
import { useGameContext } from "@/context/GameContext"
import { renderInspectorComponent } from "./inspector/InspectorRegistry"
import { ExtensionInspector } from '@/components/editor/ExtensionInspector'
import type { EntityData } from "@/types/engine"
import { useFileSystem } from "@/context/FileSystemContext"
import { EditorGameRunner } from "@/lib/editorGameRunner"
import { componentCompatibilityError, getComponentDefaults, registeredAuthoringComponents } from "./inspector/componentCatalog"

/** Resolve the scene's serialized type key without assuming registry casing. */
export const inspectorComponentEnabled = (entity: EntityData, component: string) => {
    const key = Object.keys(entity.components || {}).find(name => name.toLowerCase() === component.toLowerCase())
    const data = key ? entity.components[key] : undefined
    return data && typeof data === "object" && "enabled" in data
        ? (data as { enabled?: boolean }).enabled !== false
        : true
}

// Only expose toggles whose serialized enabled state is honored by the runtime.
const toggleableComponents = new Set(["sprite", "collider", "solidcollider", "triggercollider", "hitbox", "hurtbox", "interactionarea", "hazardarea", "behaviour"])

/** Inspector backed by the selected runtime entity and canonical scene. */
export const InspectorPanel = (_props: IDockviewPanelProps) => {
    const {
        selectedEntityData, selectedIds, updateComponent, currentScenePath,
        renameEntityInHierarchy, setEntityActiveInHierarchy, addComponent, removeComponent
    } = useGameContext()
    const { writeScene, nodes } = useFileSystem()
    const [isSaving, setIsSaving] = useState(false)
    const [isAddingComponent, setIsAddingComponent] = useState(false)
    const [componentSearch, setComponentSearch] = useState("")
    const [componentError, setComponentError] = useState("")
    const addSearchRef = useRef<HTMLInputElement>(null)

    const resources = useMemo(() => Object.values(nodes || {})
        .filter(node => node.type !== 'folder')
        .map(node => ({ value: node.id.replace(/\\/g, '/'), label: node.id.replace(/\\/g, '/') })), [nodes])

    const componentOrder = useMemo(() => selectedEntityData
        ? Object.keys(selectedEntityData.components || {}).filter(key => key.toLowerCase() !== "transform")
        : [], [selectedEntityData])
    const availableComponents = useMemo(() => registeredAuthoringComponents.filter(component => {
        if (componentCompatibilityError(component.id, componentOrder)) return false
        const query = componentSearch.trim().toLowerCase()
        return !query || `${component.label} ${component.id} ${component.group}`.toLowerCase().includes(query)
    }), [componentOrder, componentSearch])

    useEffect(() => {
        if (isAddingComponent) addSearchRef.current?.focus()
    }, [isAddingComponent])

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
    // This hierarchy row represents top-level scene settings, not a serialized
    // Entity. Entity update/rename/active commands cannot persist its values.
    if (entity.id === 'camera-main' && EditorGameRunner.currentScene?.camera) {
        return <div className="h-full overflow-auto p-4 bg-background">
            <h3 className="text-sm font-medium">Main Camera</h3>
            <p className="text-xs text-muted-foreground mt-2">Scene camera settings are read-only in this inspector.</p>
            <pre className="text-xs mt-3 whitespace-pre-wrap">{JSON.stringify(entity.components.Camera, null, 2)}</pre>
        </div>
    }
    const updateTransform = (key: string, value: any) => selectedIds.forEach(id => updateComponent(id, "transform", key, value))
    const applyComponentUpdate = (id: string, component: string, key: string, value: any) => updateComponent(id, component, key, value)
    const makeUpdater = (component: string) => (key: string, value: any) =>
        selectedIds.forEach(id => applyComponentUpdate(id, component, key, value))
    const updateHelpers = {
        updateTransform,
        updateSprite: makeUpdater("sprite"),
        updateCollider: makeUpdater("collider"),
        updateBody: makeUpdater("body"),
        updateStats: makeUpdater("stats"),
        updateAnimator: makeUpdater("animator"),
        updateGeneric: (component: string, key: string, value: any) =>
            selectedIds.forEach(id => applyComponentUpdate(id, component, key, value))
    }
    const componentEnabled = (component: string) => inspectorComponentEnabled(entity, component)
    const toggleActive = (component: string) => {
        const enabled = !componentEnabled(component)
        selectedIds.forEach(id => updateComponent(id, component, "enabled", enabled))
    }
    const handleRename = (name: string) => {
        if (!name.trim()) return
        renameEntityInHierarchy(entity.id, name)
    }
    const handleToggleActive = () => {
        const active = !entity.active
        selectedIds.forEach(id => {
            setEntityActiveInHierarchy(id, active)
        })
    }
    const handleAddComponent = (componentId: string) => {
        const error = componentCompatibilityError(componentId, componentOrder)
        if (error) { setComponentError(error); return }
        const defaults = getComponentDefaults(componentId)
        if (!defaults) { setComponentError("This component is not registered for authoring."); return }
        if (componentId === "Sprite") {
            const imagePaths = resources.filter(resource => /\.(png|jpe?g|webp|svg)$/i.test(resource.value))
            if (imagePaths.length === 0) { setComponentError("Add an image to the project before attaching a Sprite."); return }
            defaults.path = imagePaths[0].value
        }
        if (componentId === "ProjectBehaviour") {
            const modules = resources.filter(resource => /\.js$/i.test(resource.value))
            if (modules.length === 0) { setComponentError("Add a project JavaScript module before attaching ProjectBehaviour."); return }
            defaults.module = modules[0].value
        }
        const changed = selectedIds.map(id => addComponent(id, componentId, defaults))
        if (changed.some(Boolean)) {
            setComponentError("")
            setComponentSearch("")
            setIsAddingComponent(false)
        } else setComponentError(`Could not add ${componentId} to the current selection.`)
    }
    const handleRemoveComponent = (componentId: string) => {
        selectedIds.forEach(id => removeComponent(id, componentId))
    }

    return <div className="h-full flex flex-col bg-background overflow-hidden overflow-x-hidden select-none">
        <div className={cn("shrink-0 p-1.5 border-b border-border", "bg-card/30")}>
            <div className="flex items-center gap-1.5 min-w-0">
                <div className="triton-raised w-7 h-7 shrink-0 rounded-md flex items-center justify-center">
                    <Box className="w-4.5 h-4.5 text-foreground/90" />
                </div>
                <div className="flex-1 min-w-0">
                    <ThemedInput value={entity.name} onChange={(event: any) => handleRename(event.target.value)} className="font-bold text-[13px] h-7" disabled={selectedIds.length > 1} placeholder={selectedIds.length > 1 ? `${selectedIds.length} Entities Selected` : undefined} />
                </div>
                <button type="button" onClick={handleToggleActive} className={cn("w-6 h-6 flex shrink-0 items-center justify-center rounded transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary", entity.active ? "text-blue-400 hover:text-blue-300" : "text-muted-foreground/70 hover:text-foreground")} title={entity.active ? "Disable entity" : "Enable entity"} aria-label={entity.active ? "Disable entity" : "Enable entity"}>
                    {entity.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => void handleSave()} disabled={!currentScenePath || isSaving} className="w-6 h-6 flex shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary" title={currentScenePath ? "Save scene (Ctrl+S)" : "Open a scene before saving"} aria-label={currentScenePath ? "Save scene" : "Save scene unavailable"}>
                    <Save className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-auto bg-background">
            {renderInspectorComponent({ compId: "transform", index: -1, entity, isActive: true, onToggleActive: undefined, updateHelpers, moveHelpers: {} })}
            <ExtensionInspector entity={entity} />
            {componentOrder.map((compId, index) => {
                const canToggle = toggleableComponents.has(compId.toLowerCase()) || compId.toLowerCase().endsWith("behaviour")
                return renderInspectorComponent({ compId, index, entity, isActive: canToggle ? componentEnabled(compId) : true, onToggleActive: canToggle ? () => toggleActive(compId) : undefined, updateHelpers, moveHelpers: { onMoveUp: () => {}, onMoveDown: () => {} }, onRemove: () => handleRemoveComponent(compId), resources })
            })}
            <div className="p-2 mt-1">
                <button type="button" onClick={() => { setIsAddingComponent(value => !value); setComponentError("") }} aria-expanded={isAddingComponent} className={cn("triton-raised w-full h-7 flex items-center justify-center gap-2 rounded-md px-2", "text-foreground/90 transition-all")}>
                    <Plus className="w-3.5 h-3.5" /><span className="text-xs font-medium">Add Component</span>
                </button>
                {isAddingComponent && <div className="mt-1 rounded-md border border-border bg-card/70 p-1.5">
                    <ThemedInput ref={addSearchRef} value={componentSearch} onChange={(event: any) => { setComponentSearch(event.target.value); setComponentError("") }} startIcon={<Search className="h-3.5 w-3.5" />} placeholder="Search components…" aria-label="Search registered components" className="h-7 text-xs" />
                    {componentError && <div role="alert" className="px-1 py-1 text-[10px] text-red-400">{componentError}</div>}
                    <div role="listbox" aria-label="Registered components" className="mt-1 max-h-40 overflow-auto">
                        {availableComponents.length ? availableComponents.map(component => <button key={component.id} type="button" role="option" aria-selected="false" onClick={() => handleAddComponent(component.id)} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-foreground/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary">
                            <span>{component.label}</span><span className="text-[10px] text-muted-foreground">{component.group}</span>
                        </button>) : <div className="px-2 py-2 text-[10px] text-muted-foreground">No compatible registered components found.</div>}
                    </div>
                </div>}
            </div>
        </div>
    </div>
}
