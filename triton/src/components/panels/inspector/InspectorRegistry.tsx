import React from "react"
import type { ComponentId, MockEntity } from "./shared/types"
import { TransformSection } from "./components/TransformSection"
import { SpriteSection } from "./components/SpriteSection"
import { ColliderSection } from "./components/ColliderSection"
import { BodySection } from "./components/BodySection"
import { SoundSection } from "./components/SoundSection"
import { StatsSection } from "./components/StatsSection"
import { AnimatorSection } from "./components/AnimatorSection"
import { ScriptsGroup } from "./components/ScriptsSection"

/**
 * InspectorRegistry
 * 
 * Maps component IDs to their respective React components.
 * Centralizing rendering logic away from the main panel.
 */
export const InspectorRegistry: Record<ComponentId, React.FC<any>> = {
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
    compId: ComponentId
    index: number
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    updateHelpers: any // Passing all update helpers in a single object
    moveHelpers: any // Passing move up/down helpers
}

export const renderInspectorComponent = ({
    compId,
    entity,
    isActive,
    onToggleActive,
    updateHelpers,
    moveHelpers
}: RenderComponentProps) => {
    const Component = InspectorRegistry[compId]
    if (!Component) return null

    // Determine specific props based on component type
    const commonProps = {
        entity,
        isActive,
        onToggleActive
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
