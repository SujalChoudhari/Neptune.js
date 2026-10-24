import React from "react"
import type { EntityData } from "@/types/engine"
import { TransformSection } from "./components/TransformSection"
import { SpriteSection } from "./components/SpriteSection"
import { ColliderSection } from "./components/ColliderSection"
import { BodySection } from "./components/BodySection"
import { SoundSection } from "./components/SoundSection"
import { StatsSection } from "./components/StatsSection"
import { AnimatorSection } from "./components/AnimatorSection"
import { ScriptsGroup } from "./components/ScriptsSection"
import { GenericComponentSection } from "./components/GenericComponentSection"

/**
 * InspectorRegistry
 * 
 * Maps component IDs to their respective React components.
 * Centralizing rendering logic away from the main panel.
 */
export const InspectorRegistry: Record<string, React.FC<any>> = {
    transform: TransformSection,
    sprite: SpriteSection,
    collider: ColliderSection,
    body: BodySection,
    sound: SoundSection,
    stats: StatsSection,
    animator: AnimatorSection,
    scripts: ScriptsGroup
}

interface RenderComponentProps {
    compId: string
    index: number
    entity: EntityData
    isActive: boolean
    onToggleActive: () => void
    updateHelpers: any // Passing all update helpers in a single object
    moveHelpers: any // Passing move up/down helpers
}

export const renderInspectorComponent = ({
    compId,
    index,
    entity,
    isActive,
    onToggleActive,
    updateHelpers,
    moveHelpers
}: RenderComponentProps) => {
    void index
    const Component = InspectorRegistry[compId]

    // Determine specific props based on component type
    const commonProps = {
        entity,
        isActive,
        onToggleActive
    }

    if (!Component) {
        // Fallback to Generic Renderer for any components
        // We need to fetch the raw data from the new 'components' dictionary
        return <GenericComponentSection
            key={compId}
            type={compId}
            data={entity.components[compId]}
            {...commonProps}
            onUpdate={(key, value) => updateHelpers.updateGeneric(compId, key, value)}
        />
    }

    switch (compId) {
        case "transform":
            return <TransformSection key={compId} {...commonProps} onUpdate={updateHelpers.updateTransform} />
        case "sprite":

            return <SpriteSection key={compId} {...commonProps} onUpdate={updateHelpers.updateSprite} {...moveHelpers} />
        case "collider":
            return <ColliderSection key={compId} {...commonProps} onUpdate={updateHelpers.updateCollider} {...moveHelpers} />
        case "body":
            return <BodySection key={compId} {...commonProps} onUpdate={updateHelpers.updateBody} {...moveHelpers} />
        case "sound":
            return <SoundSection key={compId} {...commonProps} onUpdate={updateHelpers.updateSound} {...moveHelpers} />
        case "stats":
            return <StatsSection key={compId} {...commonProps} onUpdate={updateHelpers.updateStats} {...moveHelpers} />
        case "animator":
            return <AnimatorSection key={compId} {...commonProps} onUpdate={updateHelpers.updateAnimator} {...moveHelpers} />
        case "scripts":
            return <ScriptsGroup key={compId} {...commonProps} onUpdate={updateHelpers.updateScript} {...moveHelpers} />
        default:
            return null
    }
}
