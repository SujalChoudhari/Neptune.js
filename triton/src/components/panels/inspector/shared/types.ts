import type { ReactNode } from "react"
import type { EntityData } from "@/types/engine"

export type ComponentId = keyof Omit<EntityData, 'name' | 'active' | 'transform' | 'id' | 'components'> | 'transform'

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
