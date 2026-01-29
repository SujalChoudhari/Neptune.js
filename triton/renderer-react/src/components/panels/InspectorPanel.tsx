import { useStore } from '@/store/useStore'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Component type configurations
const COMPONENT_CONFIGS: Record<string, { icon: string; fields: Field[] }> = {
    Transform: {
        icon: '📍',
        fields: [
            { name: 'x', type: 'number', label: 'X' },
            { name: 'y', type: 'number', label: 'Y' },
            { name: 'rotation', type: 'number', label: 'Rotation' },
            { name: 'scaleX', type: 'number', label: 'Scale X', defaultValue: 1 },
            { name: 'scaleY', type: 'number', label: 'Scale Y', defaultValue: 1 },
        ],
    },
    Sprite: {
        icon: '🖼️',
        fields: [
            { name: 'image', type: 'asset', label: 'Image' },
            { name: 'tint', type: 'color', label: 'Tint', defaultValue: '#ffffff' },
            { name: 'opacity', type: 'slider', label: 'Opacity', min: 0, max: 1, defaultValue: 1 },
            { name: 'flipX', type: 'boolean', label: 'Flip X' },
            { name: 'flipY', type: 'boolean', label: 'Flip Y' },
        ],
    },
    RigidBody: {
        icon: '⚡',
        fields: [
            { name: 'mass', type: 'number', label: 'Mass', defaultValue: 1 },
            { name: 'gravityScale', type: 'number', label: 'Gravity Scale', defaultValue: 1 },
            { name: 'friction', type: 'slider', label: 'Friction', min: 0, max: 1, defaultValue: 0.5 },
            { name: 'isStatic', type: 'boolean', label: 'Is Static' },
        ],
    },
    BoxCollider: {
        icon: '📦',
        fields: [
            { name: 'width', type: 'number', label: 'Width', defaultValue: 32 },
            { name: 'height', type: 'number', label: 'Height', defaultValue: 32 },
            { name: 'offsetX', type: 'number', label: 'Offset X' },
            { name: 'offsetY', type: 'number', label: 'Offset Y' },
            { name: 'isTrigger', type: 'boolean', label: 'Is Trigger' },
        ],
    },
}

interface Field {
    name: string
    type: 'number' | 'text' | 'boolean' | 'color' | 'slider' | 'asset' | 'select'
    label: string
    defaultValue?: unknown
    min?: number
    max?: number
    options?: string[]
}

// Mock entity data
const mockEntity = {
    id: '1',
    name: 'Player',
    transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
    components: [
        { type: 'Sprite', image: 'player.png', tint: '#ffffff', opacity: 1, flipX: false, flipY: false },
        { type: 'RigidBody', mass: 1, gravityScale: 1, friction: 0.3, isStatic: false },
        { type: 'BoxCollider', width: 32, height: 48, offsetX: 0, offsetY: 0, isTrigger: false },
    ],
}

export function InspectorPanel() {
    const selectedEntityId = useStore((state) => state.editor.selectedEntityId)
    const entity = selectedEntityId ? mockEntity : null

    if (!entity) {
        return (
            <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
                <div className="h-8 px-3 flex items-center border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                    <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Inspector
                    </span>
                </div>
                <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm">
                    Select an entity to inspect
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
            {/* Header */}
            <div className="h-8 px-3 flex items-center border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Inspector
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2">
                {/* Entity Name */}
                <div className="mb-4">
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Name</label>
                    <input
                        type="text"
                        value={entity.name}
                        className="w-full px-2 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">ID: {entity.id}</span>
                </div>

                {/* Transform */}
                <ComponentSection
                    type="Transform"
                    config={COMPONENT_CONFIGS.Transform}
                    data={entity.transform}
                    removable={false}
                />

                {/* Other Components */}
                {entity.components.map((component, index) => (
                    <ComponentSection
                        key={index}
                        type={component.type}
                        config={COMPONENT_CONFIGS[component.type]}
                        data={component}
                        removable={true}
                    />
                ))}

                {/* Add Component */}
                <div className="mt-4">
                    <select className="w-full px-2 py-2 bg-[var(--bg-tertiary)] border border-dashed border-[var(--border-color)] rounded text-sm text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--accent-primary)]">
                        <option value="">+ Add Component</option>
                        {Object.keys(COMPONENT_CONFIGS)
                            .filter((t) => t !== 'Transform')
                            .map((type) => (
                                <option key={type} value={type}>
                                    {COMPONENT_CONFIGS[type].icon} {type}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

interface ComponentSectionProps {
    type: string
    config: { icon: string; fields: Field[] }
    data: Record<string, unknown>
    removable: boolean
}

function ComponentSection({ type, config, data, removable }: ComponentSectionProps) {
    if (!config) return null

    return (
        <div className="mb-3 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-3 py-2 bg-white/[0.03] border-b border-[var(--border-color)]">
                <span className="mr-2">{config.icon}</span>
                <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{type}</span>
                {removable && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Fields */}
            <div className="p-2">
                {config.fields.map((field) => (
                    <FieldRow key={field.name} field={field} value={data[field.name]} />
                ))}
            </div>
        </div>
    )
}

interface FieldRowProps {
    field: Field
    value: unknown
}

function FieldRow({ field, value }: FieldRowProps) {
    return (
        <div className="flex items-center mb-2 last:mb-0">
            <label className="w-20 text-xs text-[var(--text-secondary)] shrink-0">{field.label}</label>
            <div className="flex-1">
                {field.type === 'number' && (
                    <input
                        type="number"
                        value={(value as number) ?? field.defaultValue ?? 0}
                        className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                )}

                {field.type === 'text' && (
                    <input
                        type="text"
                        value={(value as string) ?? ''}
                        className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                )}

                {field.type === 'boolean' && (
                    <input
                        type="checkbox"
                        checked={(value as boolean) ?? false}
                        className="w-4 h-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"
                    />
                )}

                {field.type === 'color' && (
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={(value as string) ?? '#ffffff'}
                            className="w-8 h-6 p-0 border border-[var(--border-color)] rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={(value as string) ?? '#ffffff'}
                            className="flex-1 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-xs text-[var(--text-primary)] font-mono"
                        />
                    </div>
                )}

                {field.type === 'slider' && (
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min={field.min ?? 0}
                            max={field.max ?? 100}
                            step={0.01}
                            value={(value as number) ?? field.defaultValue ?? 0}
                            className="flex-1"
                        />
                        <span className="w-10 text-xs text-[var(--text-secondary)] text-right">
                            {((value as number) ?? 0).toFixed(2)}
                        </span>
                    </div>
                )}

                {field.type === 'asset' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded">
                        <span className="flex-1 text-xs text-[var(--text-secondary)] truncate">
                            {(value as string) || 'None'}
                        </span>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                            <span className="text-xs">📁</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
