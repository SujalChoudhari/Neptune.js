import { Code } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import { ThemedReferenceInput } from "@/components/library"
import type { EntityData, ScriptComponent } from "@/types/engine"

interface ScriptsGroupProps {
    entity: EntityData
    isActive: boolean // Group active state
    onToggleActive: () => void // Group toggle
    onUpdate: (index: number, key: keyof ScriptComponent, value: string | boolean) => void
    onMoveUp?: (index: number) => void
    onMoveDown?: (index: number) => void
}

/**
 * ScriptsGroup
 * 
 * Renders multiple individual Script segments under the 'scripts' ID.
 */
export const ScriptsGroup = ({
    entity,
    onUpdate,
    onMoveUp,
    onMoveDown
}: ScriptsGroupProps) => {
    if (!entity.scripts) return null

    return (
        <>
            {entity.scripts.map((script, sIndex) => (
                <ComponentSection
                    key={`script-${sIndex}`}
                    title={script.path.split('/').pop() || "Script"}
                    icon={<Code className="w-3.5 h-3.5" />}
                    iconColor="text-indigo-400"
                    isActive={script.enabled}
                    onToggleActive={(v) => onUpdate(sIndex, 'enabled', v)}
                    onMoveUp={() => onMoveUp?.(sIndex)}
                    onMoveDown={() => onMoveDown?.(sIndex)}
                >
                    <PropertyRow label="Script">
                        <ThemedReferenceInput
                            value={script.path}
                            onChange={(v) => onUpdate(sIndex, 'path', v)}
                            type="script"
                        />
                    </PropertyRow>
                </ComponentSection>
            ))}
        </>
    )
}
