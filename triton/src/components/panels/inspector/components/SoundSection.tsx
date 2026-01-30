import { Volume2 } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedInput, ThemedReferenceInput, ThemedSlider, ThemedToggle } from "@/components/library"
import type { MockEntity, MockSound } from "../shared/types"

interface SoundSectionProps {
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: keyof MockSound, value: string | number | boolean) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}

export const SoundSection = ({
    entity,
    isActive,
    onToggleActive,
    onUpdate,
    onMoveUp,
    onMoveDown
}: SoundSectionProps) => {
    if (!entity.sound) return null

    return (
        <ComponentSection
            title="Sound"
            icon={<Volume2 className="w-3.5 h-3.5" />}
            iconColor="text-purple-400"
            isActive={isActive}
            onToggleActive={onToggleActive}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        >
            <PropertyRow label="Name">
                <ThemedInput
                    value={entity.sound.name}
                    onChange={(e: any) => onUpdate('name', e.target.value)}
                />
            </PropertyRow>
            <PropertyRow label="Source">
                <ThemedReferenceInput
                    value={entity.sound.src}
                    onChange={(v) => onUpdate('src', v)}
                    type="audio"
                />
            </PropertyRow>
            <PropertyRow label="Volume">
                <ThemedSlider
                    value={entity.sound.volume * 100}
                    onChange={(v: any) => onUpdate('volume', v / 100)}
                    min={0}
                    max={100}
                />
            </PropertyRow>
            <PropertyRow label="Loop">
                <ThemedToggle
                    checked={entity.sound.loop}
                    onChange={(v: any) => onUpdate('loop', v)}
                />
            </PropertyRow>
        </ComponentSection>
    )
}
