import { Zap } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedVectorInput, ThemedNumberInput, ThemedSlider, ThemedCheckbox } from "@/components/library"
import type { MockEntity, MockBody } from "../shared/types"

interface BodySectionProps {
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: keyof MockBody, value: number | boolean) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}

export const BodySection = ({
    entity,
    isActive,
    onToggleActive,
    onUpdate,
    onMoveUp,
    onMoveDown
}: BodySectionProps) => {
    if (!entity.body) return null

    return (
        <ComponentSection
            title="Body"
            icon={<Zap className="w-3.5 h-3.5" />}
            iconColor="text-orange-400"
            isActive={isActive}
            onToggleActive={onToggleActive}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        >
            <PropertyRow label="Velocity">
                <ThemedVectorInput
                    dimensions={2}
                    value={{ x: entity.body.velocityX, y: entity.body.velocityY, z: 0 }}
                    onChange={(v: any) => {
                        onUpdate('velocityX', v.x)
                        onUpdate('velocityY', v.y)
                    }}
                    step={1}
                />
            </PropertyRow>
            <PropertyRow label="Gravity">
                <ThemedNumberInput
                    value={entity.body.gravity}
                    onChange={(v: any) => onUpdate('gravity', v)}
                />
            </PropertyRow>
            <PropertyRow label="Max Fall">
                <ThemedNumberInput
                    value={entity.body.maxFallSpeed}
                    onChange={(v: any) => onUpdate('maxFallSpeed', v)}
                />
            </PropertyRow>
            <PropertyRow label="Friction">
                <ThemedSlider
                    value={entity.body.friction * 100}
                    onChange={(v: any) => onUpdate('friction', v / 100)}
                    min={0}
                    max={100}
                />
            </PropertyRow>
            <PropertyRow label="Drag">
                <ThemedSlider
                    value={entity.body.drag * 100}
                    onChange={(v: any) => onUpdate('drag', v / 100)}
                    min={0}
                    max={100}
                />
            </PropertyRow>
            <PropertyRow label="Grounded">
                <ThemedCheckbox
                    checked={entity.body.grounded}
                    onChange={(v: any) => onUpdate('grounded', v)}
                />
            </PropertyRow>
        </ComponentSection>
    )
}
