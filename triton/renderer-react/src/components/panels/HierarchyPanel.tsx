import { ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// Mock data for demo
const mockEntities = [
    { id: '1', name: 'Player', type: 'entity', children: [] },
    {
        id: '2', name: 'Coins', type: 'folder', children: [
            { id: '2-1', name: 'Coin 1', type: 'entity', children: [] },
            { id: '2-2', name: 'Coin 2', type: 'entity', children: [] },
        ]
    },
    { id: '3', name: 'Enemy Slime', type: 'entity', children: [] },
    { id: '4', name: 'Background', type: 'entity', children: [] },
]

interface TreeNode {
    id: string
    name: string
    type: string
    children: TreeNode[]
}

export function HierarchyPanel() {
    const selectedEntityId = useStore((state) => state.editor.selectedEntityId)
    const selectEntity = useStore((state) => state.selectEntity)
    const [expanded, setExpanded] = useState<Set<string>>(new Set(['2']))

    const toggleExpanded = (id: string) => {
        const next = new Set(expanded)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setExpanded(next)
    }

    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
            {/* Header */}
            <div className="h-8 px-3 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Hierarchy
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-auto p-1">
                {mockEntities.map((node) => (
                    <TreeItem
                        key={node.id}
                        node={node}
                        depth={0}
                        selectedId={selectedEntityId}
                        expanded={expanded}
                        onSelect={selectEntity}
                        onToggle={toggleExpanded}
                    />
                ))}
            </div>
        </div>
    )
}

interface TreeItemProps {
    node: TreeNode
    depth: number
    selectedId: string | null
    expanded: Set<string>
    onSelect: (id: string) => void
    onToggle: (id: string) => void
}

function TreeItem({ node, depth, selectedId, expanded, onSelect, onToggle }: TreeItemProps) {
    const isExpanded = expanded.has(node.id)
    const hasChildren = node.children.length > 0
    const isSelected = selectedId === node.id

    return (
        <>
            <div
                className={cn(
                    "flex items-center h-7 px-2 rounded cursor-pointer gap-1 text-sm",
                    isSelected ? "bg-[var(--accent-primary)] text-white" : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => onSelect(node.id)}
            >
                {/* Expand/Collapse */}
                <button
                    className={cn(
                        "w-4 h-4 flex items-center justify-center",
                        !hasChildren && "invisible"
                    )}
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggle(node.id)
                    }}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                </button>

                {/* Icon */}
                <span className="text-xs">
                    {node.type === 'folder' ? '📁' : '🎮'}
                </span>

                {/* Name */}
                <span className="truncate flex-1">{node.name}</span>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children.map((child) => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            expanded={expanded}
                            onSelect={onSelect}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </>
    )
}

export function LayersPanel() {
    const selectedLayerId = useStore((state) => state.editor.selectedLayerId)
    const selectLayer = useStore((state) => state.selectLayer)

    const mockLayers = [
        { id: 'ui', name: 'UI', visible: true, locked: false },
        { id: 'entities', name: 'Entities', visible: true, locked: false },
        { id: 'tilemap', name: 'Tilemap', visible: true, locked: false },
        { id: 'background', name: 'Background', visible: true, locked: true },
    ]

    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
            {/* Header */}
            <div className="h-8 px-3 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Layers
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            {/* Layers */}
            <div className="flex-1 overflow-auto p-1">
                {mockLayers.map((layer) => (
                    <div
                        key={layer.id}
                        className={cn(
                            "flex items-center h-8 px-2 rounded cursor-pointer gap-2 text-sm",
                            selectedLayerId === layer.id
                                ? "bg-[var(--accent-primary)] text-white"
                                : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                        )}
                        onClick={() => selectLayer(layer.id)}
                    >
                        {/* Visibility */}
                        <button
                            className="w-5 h-5 flex items-center justify-center opacity-60 hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>

                        {/* Lock */}
                        <button
                            className="w-5 h-5 flex items-center justify-center opacity-60 hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        </button>

                        {/* Name */}
                        <span className="truncate flex-1">{layer.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
