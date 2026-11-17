/**
 * Components that the engine registers in src/neptune.js and Triton can author.
 * Defaults use valid serialized properties and scene world units (one unit is
 * roughly 64 screen pixels). Transform is built in and is never offered again.
 * Transform is built in and is never offered as an additional component.
 */
export interface ComponentMetadata {
    id: string
    label: string
    group: string
    defaults: Record<string, unknown>
    incompatibleWith?: string[]
}

export const registeredAuthoringComponents: ComponentMetadata[] = [
    { id: "ProjectBehaviour", label: "Project Behaviour", group: "Scripting", defaults: { module: "", settings: {} } },
    { id: "Sprite", label: "Sprite", group: "Rendering", defaults: { path: "", width: 1, height: 1, blendMode: "source-over", filter: "none" } },
    { id: "BoxCollider", label: "Box Collider", group: "Physics", defaults: { size: { x: 1, y: 1 }, offset: { x: 0, y: 0 } } },
    { id: "Shape", label: "Shape", group: "Rendering", defaults: { geometry: 1, param: { radius: 1, color: { r: 255, g: 0, b: 255, a: 1 }, fill: true, width: 1, height: 1, outline: { r: 0, g: 0, b: 0, a: 1 }, thickness: 1, points: [] } } },
    { id: "TriggerCollider", label: "Trigger Collider", group: "Physics", defaults: { width: 1, height: 1, offsetX: 0, offsetY: 0, role: "trigger", mask: 4294967295, layer: 1, isTrigger: true, enabled: true, oneWay: null, hazard: null, climbable: false } },
    { id: "Hitbox", label: "Hitbox", group: "Combat", defaults: { width: 1, height: 1, offsetX: 0, offsetY: 0, role: "hitbox", mask: 4294967295, layer: 1, isTrigger: true, enabled: true, oneWay: null, hazard: null, climbable: false } },
    { id: "Hurtbox", label: "Hurtbox", group: "Combat", defaults: { width: 1, height: 1, offsetX: 0, offsetY: 0, role: "hurtbox", mask: 4294967295, layer: 1, isTrigger: true, enabled: true, oneWay: null, hazard: null, climbable: false } },
    { id: "Dialogue", label: "Dialogue", group: "Gameplay", defaults: { speaker: "", text: "", next: "" } },
    { id: "QuestDefinition", label: "Quest Definition", group: "Gameplay", defaults: { name: "New Quest", description: "Describe the quest...", objectiveId: "objective-1", objective: "Describe the objective...", required: 1 } },
    { id: "EnemyConfig", label: "Enemy Config", group: "Gameplay", defaults: { maxHealth: 100, moveSpeed: 2, contactDamage: 10, behavior: "patrol" } },
    { id: "SceneTransition", label: "Scene Transition", group: "Gameplay", defaults: { targetScene: "", spawnPoint: "", trigger: "enter" } },
    { id: "SpawnPoint", label: "Spawn Point", group: "Gameplay", defaults: { spawnId: "start", facing: "right" } }
]

const normalized = (id: string) => id.toLowerCase()

export function componentCompatibilityError(componentId: string, existingIds: string[]): string | null {
    const candidate = registeredAuthoringComponents.find(item => normalized(item.id) === normalized(componentId))
    if (!candidate) return "This component is not registered for authoring."
    const existing = new Set(existingIds.map(normalized))
    if (existing.has(normalized(candidate.id))) return `${candidate.label} is already attached.`
    return null
}

export function getComponentDefaults(componentId: string): Record<string, unknown> | null {
    const metadata = registeredAuthoringComponents.find(item => normalized(item.id) === normalized(componentId))
    return metadata ? structuredClone(metadata.defaults) : null
}
