import { Heart } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedNumberInput } from "@/components/library"
import type { MockEntity, MockStats } from "../shared/types"

interface StatsSectionProps {
    entity: MockEntity
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: keyof MockStats, value: number) => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}

export const StatsSection = ({
    entity,
    isActive,
    onToggleActive,
    onUpdate,
    onMoveUp,
    onMoveDown
}: StatsSectionProps) => {
    if (!entity.stats) return null

    return (
        <ComponentSection
            title="Stats"
            icon={<Heart className="w-3.5 h-3.5" />}
            iconColor="text-red-400"
            isActive={isActive}
            onToggleActive={onToggleActive}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        >
            <PropertyRow label="Health">
                <ThemedNumberInput
                    value={entity.stats.health}
                    onChange={(v: any) => onUpdate('health', v)}
                    min={0}
                    max={entity.stats.maxHealth}
                />
            </PropertyRow>
            <PropertyRow label="Max HP">
                <ThemedNumberInput
                    value={entity.stats.maxHealth}
                    onChange={(v: any) => onUpdate('maxHealth', v)}
                    min={1}
                />
            </PropertyRow>
            <PropertyRow label="Stamina">
                <ThemedNumberInput
                    value={entity.stats.stamina}
                    onChange={(v: any) => onUpdate('stamina', v)}
                    min={0}
                    max={entity.stats.maxStamina}
                />
            </PropertyRow>
            <PropertyRow label="Max SP">
                <ThemedNumberInput
                    value={entity.stats.maxStamina}
                    onChange={(v: any) => onUpdate('maxStamina', v)}
                    min={1}
                />
            </PropertyRow>
            <PropertyRow label="Attack">
                <ThemedNumberInput
                    value={entity.stats.attack}
                    onChange={(v: any) => onUpdate('attack', v)}
                    min={0}
                />
            </PropertyRow>
            <PropertyRow label="Defense">
                <ThemedNumberInput
                    value={entity.stats.defense}
                    onChange={(v: any) => onUpdate('defense', v)}
                    min={0}
                />
            </PropertyRow>
            <PropertyRow label="Speed">
                <ThemedNumberInput
                    value={entity.stats.speed}
                    onChange={(v: any) => onUpdate('speed', v)}
                    min={0}
                />
            </PropertyRow>
        </ComponentSection>
    )
}
