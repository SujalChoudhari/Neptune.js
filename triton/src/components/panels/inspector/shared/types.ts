import type { ReactNode } from "react"
import type { EntityData, Vector2, TransformComponent, SpriteComponent, ColliderComponent, BodyComponent, SoundComponent, StatsComponent, AnimatorComponent, ScriptComponent } from "@/types/engine"

export type InspectorVector2 = Vector2
export type InspectorTransform = TransformComponent
export type InspectorSprite = SpriteComponent
export type InspectorCollider = ColliderComponent
export type InspectorBody = BodyComponent
export type InspectorSound = SoundComponent
export type InspectorStats = StatsComponent
export type InspectorAnimator = AnimatorComponent
export type InspectorScript = ScriptComponent
export type InspectorEntity = EntityData

export type ComponentId = keyof Omit<InspectorEntity, 'name' | 'active' | 'transform' | 'id' | 'components'> | 'transform'

export interface ComponentSectionProps {
    title: string
    icon?: ReactNode
    iconColor?: string
    children: ReactNode
    defaultOpen?: boolean
    isActive?: boolean
    onToggleActive?: (active: boolean) => void
    canReorder?: boolean
    onMoveUp?: () => void
    onMoveDown?: () => void
    onRemove?: () => void
    onDuplicate?: () => void
    onCopyValues?: () => void
    onPasteValues?: () => void
}

export interface PropertyRowProps {
    label: string
    children: ReactNode
    labelWidth?: string
}
