import type { ReactNode } from "react"

export interface MockVector2 {
    x: number
    y: number
}

export interface MockTransform {
    position: MockVector2
    rotation: number
    scale: MockVector2
}

export interface MockSprite {
    path: string
    width: number
    height: number
    blendMode: string
}

export interface MockCollider {
    width: number
    height: number
    offsetX: number
    offsetY: number
    isTrigger: boolean
}

export interface MockBody {
    velocityX: number
    velocityY: number
    gravity: number
    maxFallSpeed: number
    grounded: boolean
    friction: number
    drag: number
}

export interface MockSound {
    name: string
    src: string
    volume: number
    loop: boolean
    playing: boolean
}

export interface MockStats {
    maxHealth: number
    health: number
    maxStamina: number
    stamina: number
    attack: number
    defense: number
    speed: number
}

export interface MockAnimator {
    currentAnimation: string
    speed: number
    playing: boolean
    animations: string[]
}

export interface MockScript {
    path: string
    enabled: boolean
}

export interface MockEntity {
    name: string
    active: boolean
    transform: MockTransform
    sprite?: MockSprite
    collider?: MockCollider
    body?: MockBody
    sound?: MockSound
    stats?: MockStats
    animator?: MockAnimator
    scripts?: MockScript[]
}

export type ComponentId = keyof Omit<MockEntity, 'name' | 'active' | 'transform'> | 'transform'

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
