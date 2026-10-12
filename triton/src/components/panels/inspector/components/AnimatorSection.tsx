import { Film } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedSelect, ThemedSlider, ThemedToggle } from "@/components/library"
import type { MockEntity, MockAnimator } from "../shared/types"

interface AnimatorSectionProps {
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: keyof MockAnimator, value: string | number | boolean) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}

export const AnimatorSection = ({
    entity,
    isActive,
    onToggleActive,
    onUpdate,
    onMoveUp,
    onMoveDown
}: AnimatorSectionProps) => {
    if (!entity.animator) return null

    return (
        <ComponentSection
            title="Animator"
            icon={<Film className="w-3.5 h-3.5" />}
            iconColor="text-cyan-400"
            isActive={isActive}
            onToggleActive={onToggleActive}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        >
            <PropertyRow label="Animation">
                <ThemedSelect
                    value={entity.animator.currentAnimation}
                    onChange={(v: any) => onUpdate('currentAnimation', v)}
                    options={entity.animator.animations.map(a => ({ value: a, label: a }))}
                />
            </PropertyRow>
            <PropertyRow label="Speed">
                <ThemedSlider
                    value={entity.animator.speed * 100}
                    onChange={(v: any) => onUpdate('speed', v / 100)}
                    min={0}
                    max={200}
                />
            </PropertyRow>
            <PropertyRow label="Playing">
                <ThemedToggle
                    checked={entity.animator.playing}
                    onChange={(v: any) => onUpdate('playing', v)}
                />
            </PropertyRow>
        </ComponentSection>
    )
}
