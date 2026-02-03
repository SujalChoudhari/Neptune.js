import React, { useState } from "react"
import { ChevronDown, ChevronRight, Settings } from "lucide-react"
import { ComponentSection } from "../shared/ComponentSection"
import { PropertyRow } from "../shared/PropertyRow"
import {
    ThemedInput,
    ThemedCheckbox,
    ThemedSlider,
    ThemedColorPicker,
    ThemedNumberInput,
    ThemedVectorInput,
    ThemedTextArea
} from "@/components/library"
import { rgbaToHex, hexToRgba, type RGBA } from "@/utils/colorUtils"

// Recursive Property Renderer
const PropertyField: React.FC<{
    label: string
    value: any
    onChange: (value: any) => void
    depth?: number
}> = ({ label, value, onChange, depth = 0 }) => {
    const valueType = typeof value
    const [isExpanded, setIsExpanded] = useState(true)

    // Helper for indentation style
    // We only indent the CONTAINER, but for PropertyRow we want the label to align if depth=0
    // If depth > 0, we can add a left margin or padding.
    const indentStyle = { paddingLeft: `${depth * 8}px` }

    // Handle null/undefined
    if (value === null || value === undefined) {
        return (
            <div style={indentStyle}>
                <PropertyRow label={label}>
                    <div className="text-[10px] text-muted-foreground italic">null</div>
                </PropertyRow>
            </div>
        );
    }

    // --- Heuristics ---

    // 1. Vector2 Detection (Object with x,y or width,height)
    if (valueType === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        const isVec2 = (keys.includes('x') && keys.includes('y')) && keys.length === 2;
        const isDim2 = (keys.includes('width') && keys.includes('height')) && keys.length === 2;

        if (isVec2) {
            return (
                <div style={indentStyle}>
                    <PropertyRow label={label}>
                        <ThemedVectorInput
                            dimensions={2}
                            value={{ x: value.x, y: value.y, z: 0 }}
                            onChange={(v) => onChange({ x: v.x, y: v.y })}
                        />
                    </PropertyRow>
                </div>
            );
        }

        if (isDim2) {
            return (
                <div style={indentStyle}>
                    <PropertyRow label={label}>
                        <ThemedVectorInput
                            dimensions={2}
                            labels={['W', 'H']}
                            value={{ x: value.width, y: value.height, z: 0 }}
                            onChange={(v) => onChange({ width: v.x, height: v.y })}
                        />
                    </PropertyRow>
                </div>
            );
        }

        // 2. Color Object Detection
        const isColor = keys.includes('r') && keys.includes('g') && keys.includes('b') && keys.includes('a');
        if (isColor) {
            const hex = rgbaToHex(value as RGBA);
            return (
                <div style={indentStyle}>
                    <PropertyRow label={label}>
                        <ThemedColorPicker
                            value={hex}
                            onChange={(newHex) => onChange(hexToRgba(newHex))}
                            className="w-full"
                        />
                    </PropertyRow>
                </div>
            );
        }
    }

    // 3. Slider Detection
    if (valueType === 'number') {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('opacity') || lowerLabel.includes('alpha') || lowerLabel.includes('volume')) {
            return (
                <div style={indentStyle}>
                    <PropertyRow label={label}>
                        <ThemedSlider
                            value={value}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => onChange(v)}
                        />
                    </PropertyRow>
                </div>
            );
        }

        // Standard Number Input
        return (
            <div style={indentStyle}>
                <PropertyRow label={label}>
                    <ThemedNumberInput
                        value={value}
                        onChange={(v) => onChange(v)}
                    />
                </PropertyRow>
            </div>
        );
    }

    // 4. Text Area / Long String
    if (valueType === 'string') {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('text') || lowerLabel.includes('content') || (value as string).length > 50) {
            return (
                <div style={indentStyle}>
                    <div className="flex flex-col gap-1 py-1 px-1">
                        <span className="text-[10px] font-medium text-foreground/80">{label}</span>
                        <ThemedTextArea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    </div>
                </div>
            );
        }

        // 5. Color String Detection
        if (lowerLabel.includes('color')) {
            return (
                <div style={indentStyle}>
                    <PropertyRow label={label}>
                        <div className="flex-1 flex gap-2">
                            <ThemedColorPicker
                                value={value.startsWith('#') ? value : '#ffffff'}
                                onChange={(v) => onChange(v)}
                                className="w-8 shrink-0"
                            />
                            <ThemedInput
                                value={value}
                                onChange={(e: any) => onChange(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                    </PropertyRow>
                </div>
            );
        }

        // Standard Text Input
        return (
            <div style={indentStyle}>
                <PropertyRow label={label}>
                    <ThemedInput
                        value={value}
                        onChange={(e: any) => onChange(e.target.value)}
                    />
                </PropertyRow>
            </div>
        );
    }

    // Boolean
    if (valueType === 'boolean') {
        return (
            <div style={indentStyle}>
                <PropertyRow label={label}>
                    <ThemedCheckbox
                        checked={value as boolean}
                        onChange={(checked) => onChange(checked)}
                    />
                </PropertyRow>
            </div>
        );
    }


    // --- Fallback: Recursive Object Rendering ---

    if (valueType === 'object' && !Array.isArray(value)) {
        return (
            <div className="w-full">
                {/* Object Header - Custom style to match PropertyRow feel but clickable */}
                <div
                    className="flex items-center gap-1 py-1 hover:bg-white/5 cursor-pointer select-none px-1"
                    style={{ paddingLeft: `${depth * 8 + 4}px` }}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ?
                        <ChevronDown className="w-3 h-3 text-muted-foreground mr-1" /> :
                        <ChevronRight className="w-3 h-3 text-muted-foreground mr-1" />
                    }
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                </div>

                {/* Object Content */}
                {isExpanded && (
                    <div className="border-l border-white/5 ml-1">
                        {Object.entries(value).map(([key, subVal]) => (
                            <PropertyField
                                key={key}
                                label={key}
                                value={subVal}
                                depth={depth + 1} // Increase depth for recursive items
                                onChange={(newSubVal) => {
                                    onChange({ ...value, [key]: newSubVal })
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Last Resort
    return null;
}

interface GenericComponentSectionProps {
    type: string
    data: any
    entity: any
    isActive: boolean
    onToggleActive: () => void
    onUpdate: (key: string, value: any) => void
}

export const GenericComponentSection: React.FC<GenericComponentSectionProps> = ({
    type,
    data,
    isActive,
    onToggleActive,
    onUpdate
}) => {
    // If data is null or undefined, ensure it's an object to prevent crashes
    const safeData = data || {}

    // Logic: Extract 'param' to flatten it, keep others as is.
    const { param, ...rootProps } = safeData
    const hasParam = param && typeof param === 'object'
    const hasRoot = Object.keys(rootProps).length > 0
    const isEmpty = !hasParam && !hasRoot

    // --- GROUPING HEURISTICS ---
    // Helper to group flat x/y or width/height into objects for the Vector2 renderer
    const groupProperties = (props: any) => {
        const processed = { ...props }
        const virtualMap: Record<string, string[]> = {}

        // Group 1: Width + Height -> Size
        if (typeof processed.width === 'number' && typeof processed.height === 'number') {
            const key = 'size'
            processed[key] = { width: processed.width, height: processed.height }
            delete processed.width
            delete processed.height
            virtualMap[key] = ['width', 'height']
        }

        // Group 2: x + y -> Vector
        if (typeof processed.x === 'number' && typeof processed.y === 'number') {
            const key = 'vector'
            processed[key] = { x: processed.x, y: processed.y }
            delete processed.x
            delete processed.y
            virtualMap[key] = ['x', 'y']
        }

        return { processed, virtualMap }
    }

    // Process Root Props
    const { processed: processedRoot, virtualMap: rootVirtuals } = groupProperties(rootProps)

    // Process Param Props
    const { processed: processedParam, virtualMap: paramVirtuals } = hasParam ? groupProperties(param) : { processed: {}, virtualMap: {} }

    // Custom Update Handler for Virtual Groups
    const handleUpdate = (baseObj: any, key: string, value: any, virtuals: Record<string, string[]>, isParam: boolean) => {
        if (virtuals[key]) {
            // It's a virtual group (e.g. 'size' -> value is {width: 10, height: 20})
            Object.entries(value).forEach(([subKey, subVal]) => {
                if (isParam) {
                    // Update param indirectly via top-level update if possible, 
                    // but we need to coordinate multiple updates.
                    // Ideally we should just update the single param object once.
                    // But we can't easily access the valid 'param' object here without constructing it.
                    // Let's assume onUpdate works.
                } else {
                    onUpdate(subKey, subVal)
                }
            })

            if (isParam) {
                // For param, we merge and update once
                const newParam = { ...param, ...value }
                onUpdate('param', newParam)
            }

        } else {
            // Standard Update
            if (isParam) {
                const newParam = { ...param, [key]: value }
                onUpdate('param', newParam)
            } else {
                onUpdate(key, value)
            }
        }
    }

    return (
        <ComponentSection
            title={type}
            icon={<Settings className="w-3.5 h-3.5" />}
            isActive={isActive}
            onToggleActive={onToggleActive}
            canReorder={false}
        >
            {isEmpty && (
                <div className="text-[10px] text-muted-foreground italic px-2 py-1">
                    No public properties.
                </div>
            )}

            {/* Root Properties */}
            {Object.entries(processedRoot).map(([key, value]) => (
                <PropertyField
                    key={key}
                    label={key}
                    value={value}
                    onChange={(val) => handleUpdate(rootProps, key, val, rootVirtuals, false)}
                />
            ))}

            {/* Flattened 'param' Properties */}
            {hasParam && Object.entries(processedParam).map(([key, value]) => (
                <PropertyField
                    key={`param-${key}`}
                    label={key}
                    value={value}
                    onChange={(val) => handleUpdate(param, key, val, paramVirtuals, true)}
                />
            ))}
        </ComponentSection>
    )
}
