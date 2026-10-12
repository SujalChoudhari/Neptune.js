import { Move } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedVectorInput, ThemedNumberInput } from "@/components/library"
import type { MockEntity, MockTransform, MockVector2 } from "../shared/types"

interface TransformSectionProps {
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: keyof MockTransform, value: MockVector2 | number) => void
}

export const TransformSection = ({ entity, isActive, onToggleActive, onUpdate }: TransformSectionProps) => {
    return (
        <ComponentSection
            title="Transform"
            icon={<Move className="w-3.5 h-3.5" />}
            iconColor="text-blue-400"
            isActive={isActive}
            onToggleActive={onToggleActive}
            canReorder={false}
        >
            <PropertyRow label="Position">
                <ThemedVectorInput
                    dimensions={2}
                    value={{ ...entity.transform.position, z: 0 }}
                    onChange={(v: any) => onUpdate('position', { x: v.x, y: v.y })}
                />
            </PropertyRow>
            <PropertyRow label="Rotation">
                <ThemedNumberInput
                    value={entity.transform.rotation}
                    onChange={(v: any) => onUpdate('rotation', v)}
                />
            </PropertyRow>
            <PropertyRow label="Scale">
                <ThemedVectorInput
                    dimensions={2}
                    value={{ ...entity.transform.scale, z: 0 }}
                    onChange={(v: any) => onUpdate('scale', { x: v.x, y: v.y })}
                    step={0.1}
                />
            </PropertyRow>
        </ComponentSection>
    )
}
