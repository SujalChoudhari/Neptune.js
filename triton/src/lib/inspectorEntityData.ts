import type { EntityData } from "../types/engine"

const LEGACY_COMPONENT_FIELDS: Record<string, keyof EntityData> = {
    sprite: "sprite",
    collider: "collider",
    body: "body",
    sound: "sound",
    stats: "stats",
    animator: "animator"
}

export function applyInspectorFieldUpdate(
    entity: EntityData,
    component: string,
    field: string,
    value: unknown
): EntityData {
    if (component.toLowerCase() === "transform") {
        return {
            ...entity,
            transform: { ...entity.transform, [field]: value }
        }
    }

    const componentKey = Object.keys(entity.components || {}).find(
        key => key.toLowerCase() === component.toLowerCase()
    )
    if (!componentKey) return entity

    const componentData = {
        ...entity.components[componentKey],
        [field]: value
    }
    const legacyField = LEGACY_COMPONENT_FIELDS[component.toLowerCase()]
    const legacyData = legacyField ? entity[legacyField] : undefined
    return {
        ...entity,
        components: { ...entity.components, [componentKey]: componentData },
        ...(legacyField && legacyData && typeof legacyData === "object"
            ? { [legacyField]: { ...legacyData, [field]: value } }
            : {})
    }
}
