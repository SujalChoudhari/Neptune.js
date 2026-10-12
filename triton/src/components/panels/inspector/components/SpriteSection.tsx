import { Image } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedReferenceInput, ThemedVectorInput, ThemedSelect } from "@/components/library"
import type { MockEntity, MockSprite } from "../shared/types"

interface SpriteSectionProps {
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: keyof MockSprite, value: string | number) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}

export const SpriteSection = ({
    entity,
    isActive,
    onToggleActive,
    onUpdate,
    onMoveUp,
    onMoveDown
}: SpriteSectionProps) => {
    if (!entity.sprite) return null

    return (
        <ComponentSection
            title="Sprite"
            icon={<Image className="w-3.5 h-3.5" />}
            iconColor="text-green-400"
            isActive={isActive}
            onToggleActive={onToggleActive}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        >
            <PropertyRow label="Path">
                <ThemedReferenceInput
                    value={entity.sprite.path}
                    onChange={(v) => onUpdate('path', v)}
                    type="image"
                />
            </PropertyRow>
            <PropertyRow label="Size">
                <ThemedVectorInput
                    dimensions={2}
                    value={{ x: entity.sprite.width, y: entity.sprite.height, z: 0 }}
                    onChange={(v: any) => {
                        onUpdate('width', v.x)
                        onUpdate('height', v.y)
                    }}
                    labels={['W', 'H']}
                    step={1}
                />
            </PropertyRow>
            <PropertyRow label="Blend">
                <ThemedSelect
                    value={entity.sprite.blendMode}
                    onChange={(v: any) => onUpdate('blendMode', v)}
                    options={[
                        { value: 'source-over', label: 'Normal' },
                        { value: 'multiply', label: 'Multiply' },
                        { value: 'screen', label: 'Screen' },
                        { value: 'overlay', label: 'Overlay' },
                    ]}
                />
            </PropertyRow>
        </ComponentSection>
    )
}
