import { Crosshair } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedVectorInput, ThemedCheckbox } from "@/components/library"
import type { MockEntity, MockCollider } from "../shared/types"

interface ColliderSectionProps {
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: keyof MockCollider, value: number | boolean) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}

export const ColliderSection = ({
    entity,
    isActive,
    onToggleActive,
    onUpdate,
    onMoveUp,
    onMoveDown
}: ColliderSectionProps) => {
    if (!entity.collider) return null

    return (
        <ComponentSection
            key="collider"
            title="Collider"
            icon={<Crosshair className="w-3.5 h-3.5" />}
            iconColor="text-yellow-400"
            isActive={isActive}
            onToggleActive={onToggleActive}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        >
            <PropertyRow label="Size">
                <ThemedVectorInput
                    dimensions={2}
                    value={{ x: entity.collider.width, y: entity.collider.height, z: 0 }}
                    onChange={(v: any) => {
                        onUpdate('width', v.x)
                        onUpdate('height', v.y)
                    }}
                    labels={['W', 'H']}
                    step={1}
                />
            </PropertyRow>
            <PropertyRow label="Offset">
                <ThemedVectorInput
                    dimensions={2}
                    value={{ x: entity.collider.offsetX, y: entity.collider.offsetY, z: 0 }}
                    onChange={(v: any) => {
                        onUpdate('offsetX', v.x)
                        onUpdate('offsetY', v.y)
                    }}
                    step={1}
                />
            </PropertyRow>
            <PropertyRow label="Is Trigger">
                <ThemedCheckbox
                    checked={entity.collider.isTrigger}
                    onChange={(v: any) => onUpdate('isTrigger', v)}
                />
            </PropertyRow>
        </ComponentSection>
    )
}
