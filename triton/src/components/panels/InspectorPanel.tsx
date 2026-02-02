import type { IDockviewPanelProps } from "dockview"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Box, Eye, EyeOff, Plus } from "lucide-react"
import { ThemedInput } from "@/components/library"
import { useGameContext } from "@/context/GameContext"
import { renderInspectorComponent } from "./inspector/InspectorRegistry"
import type { MockEntity } from "./inspector/shared/types"  // Still needed for shared types in registry?

/**
 * InspectorPanel
 * 
 * Refactored to use GameContext for real data.
 */
export const InspectorPanel = (_props: IDockviewPanelProps) => {
    const { selectedEntityData, updateComponent, notifyGame } = useGameContext()

    // Local state for UI ordering/visibility (could be persisted later)
    const [activeStates, setActiveStates] = useState<Record<string, boolean>>({
        transform: true,
        sprite: true,
        collider: true,
        body: true,
        sound: true,
        stats: true,
        animator: true,
        scripts: true
    })

    const toggleActive = (key: string) => {
        setActiveStates(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // We derive component list from the actual data + standard order
    const componentOrder = useMemo(() => {
        if (!selectedEntityData) return [];
        const order = ['sprite', 'collider', 'body', 'sound', 'stats', 'animator', 'scripts'];
        return order.filter(key => selectedEntityData[key]);
    }, [selectedEntityData]);

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
    const entity = selectedEntityData as unknown as MockEntity;

    // HELPERS
    // We map specifics to generic updateComponent(id, comp, field, value)

    // Transform is special, it's a sub-object usually, but updateComponent handles it via 'transform' component key
    // The previous updateTransform took (key, value).
    const updateTransform = (key: string, value: any) => {
        updateComponent((entity as any).id, 'transform', key, value); // id is in entity
    }

    // Generic updater generator
    const makeUpdater = (compName: string) => (key: string, value: any) => {
        updateComponent((entity as any).id, compName, key, value);
    }

    const updateHelpers = {
        updateTransform,
        updateSprite: makeUpdater('sprite'),
        updateCollider: makeUpdater('collider'),
        updateBody: makeUpdater('body'),
        updateSound: makeUpdater('sound'),
        updateStats: makeUpdater('stats'),
        updateAnimator: makeUpdater('animator'),
        updateScript: (index: number, key: string, value: any) => {
            console.log("Update script:", index, key, value);
        }
    }

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden overflow-x-hidden select-none">
            {/* Entity Header */}
            <div className={cn(
                "shrink-0 p-3 border-b border-border",
                "bg-gradient-to-b from-[hsl(0,0%,20%)] to-[hsl(0,0%,16%)]"
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
                            onChange={(e: any) => notifyGame('editor:rename', { id: (entity as any).id, name: e.target.value })}
                            className="font-bold text-[13px] h-8"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => notifyGame('editor:update-component', { id: (entity as any).id, component: 'active', data: !entity.active })}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded transition-colors",
                            entity.active ? "text-blue-400 hover:text-blue-300" : "text-muted-foreground/70 hover:text-foreground"
                        )}
                        title={entity.active ? "Disable entity" : "Enable entity"}
                    >
                        {entity.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
                    isActive: activeStates.transform,
                    onToggleActive: () => toggleActive('transform'),
                    updateHelpers,
                    moveHelpers: {}
                })}

                {/* DYNAMIC COMPONENTS */}
                {componentOrder.map((compId, index) => renderInspectorComponent({
                    compId: compId as any,
                    index,
                    entity,
                    isActive: activeStates[compId],
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
