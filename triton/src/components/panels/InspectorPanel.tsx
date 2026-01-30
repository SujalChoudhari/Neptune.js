import type { IDockviewPanelProps } from "dockview"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Box, Eye, EyeOff, Plus } from "lucide-react"
import { ThemedInput } from "@/components/library"

// Modular Imports
import type {
    MockEntity,
    MockTransform,
    MockVector2,
    MockSprite,
    MockCollider,
    MockBody,
    MockSound,
    MockStats,
    MockAnimator,
    MockScript
} from "./inspector/shared/types"
import { MOCK_ENTITY } from "./inspector/shared/mockData"
import { renderInspectorComponent } from "./inspector/InspectorRegistry"

/**
 * InspectorPanel
 * 
 * Refactored to a thin container that manages state and uses
 * InspectorRegistry for dynamic, modular component rendering.
 */
export const InspectorPanel = (_props: IDockviewPanelProps) => {
    const [entity, setEntity] = useState<MockEntity>(MOCK_ENTITY)

    // ============================================================================
    // STATE UPDATE HELPERS
    // ============================================================================

    const updateTransform = (key: keyof MockTransform, value: MockVector2 | number) => {
        setEntity(prev => ({ ...prev, transform: { ...prev.transform, [key]: value } }))
    }

    const updateSprite = (key: keyof MockSprite, value: string | number) => {
        if (!entity.sprite) return
        setEntity(prev => ({
            ...prev,
            sprite: prev.sprite ? { ...prev.sprite, [key]: value } : undefined
        }))
    }

    const updateCollider = (key: keyof MockCollider, value: number | boolean) => {
        if (!entity.collider) return
        setEntity(prev => ({
            ...prev,
            collider: prev.collider ? { ...prev.collider, [key]: value } : undefined
        }))
    }

    const updateBody = (key: keyof MockBody, value: number | boolean) => {
        if (!entity.body) return
        setEntity(prev => ({
            ...prev,
            body: prev.body ? { ...prev.body, [key]: value } : undefined
        }))
    }

    const updateSound = (key: keyof MockSound, value: string | number | boolean) => {
        if (!entity.sound) return
        setEntity(prev => ({
            ...prev,
            sound: prev.sound ? { ...prev.sound, [key]: value } : undefined
        }))
    }

    const updateStats = (key: keyof MockStats, value: number) => {
        if (!entity.stats) return
        setEntity(prev => ({
            ...prev,
            stats: prev.stats ? { ...prev.stats, [key]: value } : undefined
        }))
    }

    const updateAnimator = (key: keyof MockAnimator, value: string | number | boolean) => {
        if (!entity.animator) return
        setEntity(prev => ({
            ...prev,
            animator: prev.animator ? { ...prev.animator, [key]: value } : undefined
        }))
    }

    const updateScript = (index: number, key: keyof MockScript, value: string | boolean) => {
        if (!entity.scripts) return
        setEntity(prev => ({
            ...prev,
            scripts: prev.scripts?.map((s, i) => i === index ? { ...s, [key]: value } : s)
        }))
    }

    const updateHelpers = {
        updateTransform, updateSprite, updateCollider, updateBody,
        updateSound, updateStats, updateAnimator, updateScript
    }

    // ============================================================================
    // LIFECYCLE & REORDERING
    // ============================================================================

    const [componentOrder, setComponentOrder] = useState<(keyof Omit<MockEntity, 'name' | 'active' | 'transform'>)[]>(
        ['sprite', 'collider', 'body', 'sound', 'stats', 'animator', 'scripts']
    )

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

    const moveComponentUp = (index: number) => {
        if (index <= 0) return
        setComponentOrder(prev => {
            const next = [...prev]
            const temp = next[index]
            next[index] = next[index - 1]
            next[index - 1] = temp
            return next
        })
    }

    const moveComponentDown = (index: number) => {
        if (index >= componentOrder.length - 1) return
        setComponentOrder(prev => {
            const next = [...prev]
            const temp = next[index]
            next[index] = next[index + 1]
            next[index + 1] = temp
            return next
        })
    }

    // ============================================================================
    // RENDER
    // ============================================================================

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
                            onChange={(e: any) => setEntity(prev => ({ ...prev, name: e.target.value }))}
                            className="font-bold text-[13px] h-8"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setEntity(prev => ({ ...prev, active: !prev.active }))}
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
                    compId,
                    index,
                    entity,
                    isActive: activeStates[compId],
                    onToggleActive: () => toggleActive(compId),
                    updateHelpers,
                    moveHelpers: {
                        onMoveUp: () => moveComponentUp(index),
                        onMoveDown: () => moveComponentDown(index)
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
