
// Basic Vector2 Type
export interface Vector2 {
    x: number
    y: number
}

// Scene Entity Structure (Heirarchy)
export type EntityType = 'cube' | 'sphere' | 'light' | 'camera' | 'empty' | 'group' | 'folder' | 'entity'

export interface SceneEntity {
    id: string
    parentId: string | null
    name: string
    type: EntityType
    children: string[]
    active: boolean
    locked: boolean
    expanded: boolean
}

// Component Interfaces
export interface TransformComponent {
    position: Vector2
    rotation: number
    scale: Vector2
    z: number
}

export interface SpriteComponent {
    path: string
    width: number
    height: number
    blendMode: string
    color: string
}

export interface ColliderComponent {
    width: number
    height: number
    offsetX: number
    offsetY: number
    isTrigger: boolean
}

export interface BodyComponent {
    velocityX: number
    velocityY: number
    gravity: number
    maxFallSpeed: number
    grounded: boolean
    friction: number
    drag: number
}

export interface SoundComponent {
    name: string
    src: string
    volume: number
    loop: boolean
    playing: boolean
}

export interface StatsComponent {
    maxHealth: number
    health: number
    maxStamina: number
    stamina: number
    attack: number
    defense: number
    speed: number
}

export interface AnimatorComponent {
    currentAnimation: string
    speed: number
    playing: boolean
    animations: string[]
}

export interface ScriptComponent {
    path: string
    enabled: boolean
}

// Full Entity Data (Inspector)
// Full Entity Data (Inspector)
export interface EntityData {
    id: string
    name: string
    active: boolean
    transform: TransformComponent
    // Hybrid approach: Specific typed fields for easy access, 
    // PLUS a comprehensive map for the Inspector loop
    components: Record<string, any> // Keyed by Type Name e.g. "Sprite", "BoxCollider"

    // Legacy / Convenience accessors (optional)
    sprite?: SpriteComponent
    collider?: ColliderComponent
    body?: BodyComponent
    sound?: SoundComponent
    stats?: StatsComponent
    animator?: AnimatorComponent
    scripts?: ScriptComponent[]
}
