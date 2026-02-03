import { cn } from "@/lib/utils"
import {
    ChevronRight,
    Box,
    Lightbulb,
    Camera,
    Circle,
    Folder,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Layers,
    Trash2
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { SceneEntity, EntityType } from "@/types/engine"

interface HierarchyItemProps {
    entity: SceneEntity
    depth: number
    isSelected: boolean
    isAncestorSelected?: boolean
    isRenaming?: boolean
    selectedIds: string[]
    onSelect: (id: string, multi: boolean, shift: boolean) => void
    onToggleActive: (id: string) => void
    onToggleLock: (id: string) => void
    onToggleExpanded: (id: string) => void
    onRename: (id: string, newName: string) => void
    onRenameCancel?: () => void
    onRemove: (id: string) => void
    onMove: (ids: string[], targetParentId: string, targetIndex?: number | 'before' | 'after', relativeToId?: string) => void
}

const EntityIcon = ({ type, className }: { type: EntityType, className?: string }) => {
    switch (type) {
        case 'camera': return <Camera className={cn("w-3.5 h-3.5", className)} />
        case 'light': return <Lightbulb className={cn("w-3.5 h-3.5", className)} />
        case 'cube': return <Box className={cn("w-3.5 h-3.5", className)} />
        case 'sphere': return <Circle className={cn("w-3.5 h-3.5", className)} />
        case 'group': return <Folder className={cn("w-3.5 h-3.5", className)} />
        default: return <Layers className={cn("w-3.5 h-3.5", className)} />
    }
}

export const HierarchyItem = ({
    entity,
    depth,
    isSelected,
    isAncestorSelected,
    isRenaming = false,
    onSelect,
    onToggleActive,
    onToggleLock,
    onToggleExpanded,
    onRename,
    onRenameCancel,
    onRemove,
    onMove,
    selectedIds
}: HierarchyItemProps) => {
    const [editName, setEditName] = useState(entity.name)
    const [dropType, setDropType] = useState<'before' | 'after' | 'inside' | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isRenaming])

    const handleRenameSubmit = () => {
        if (editName.trim() && editName !== entity.name) {
            onRename(entity.id, editName)
        } else {
            onRenameCancel?.()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit()
        if (e.key === 'Escape') {
            setEditName(entity.name)
            onRenameCancel?.()
        }
    }

    const handleDragStart = (e: React.DragEvent) => {
        const idsToDrag = (isSelected && selectedIds && selectedIds.includes(entity.id))
            ? selectedIds
            : [entity.id]

        e.dataTransfer.setData("application/json", JSON.stringify(idsToDrag))
        e.dataTransfer.setData("text/plain", entity.id)
        e.dataTransfer.effectAllowed = "move"

        // Multi-Drag Ghost (matching Project Panel)
        if (idsToDrag.length > 1) {
            const ghost = document.createElement('div')
            ghost.style.position = 'absolute'
            ghost.style.top = '-1000px'
            ghost.style.left = '-1000px'
            ghost.style.backgroundColor = '#3b82f6'
            ghost.style.color = 'white'
            ghost.style.padding = '4px 10px'
            ghost.style.borderRadius = '4px'
            ghost.style.fontWeight = '500'
            ghost.style.fontSize = '12px'
            ghost.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
            ghost.style.zIndex = '9999'
            ghost.textContent = `${idsToDrag.length} Items Selected`

            document.body.appendChild(ghost)
            e.dataTransfer.setDragImage(ghost, 0, 0)

            // Cleanup ghost after drag starts
            setTimeout(() => {
                if (document.body.contains(ghost)) {
                    document.body.removeChild(ghost)
                }
            }, 0)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = e.currentTarget.getBoundingClientRect()
        const y = e.clientY - rect.top
        const h = rect.height

        // Detection zones: Top 25% (Before), Bottom 25% (After), Middle 50% (Inside)
        if (y < h * 0.25) {
            setDropType('before')
        } else if (y > h * 0.75) {
            setDropType('after')
        } else {
            setDropType('inside')
        }
    }

    const handleDragLeave = () => {
        setDropType(null)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        let draggedIds: string[] = []
        try {
            const jsonData = e.dataTransfer.getData("application/json")
            if (jsonData) {
                draggedIds = JSON.parse(jsonData)
            } else {
                const textData = e.dataTransfer.getData("text/plain")
                if (textData) draggedIds = [textData]
            }
        } catch (err) {
            console.error("Failed to parse drag data", err)
        }

        const currentDropType = dropType
        setDropType(null)

        if (draggedIds.length === 0 || draggedIds.includes(entity.id)) return

        if (currentDropType === 'inside') {
            onMove(draggedIds, entity.id)
        } else if (currentDropType === 'before') {
            onMove(draggedIds, entity.parentId || 'root', 'before', entity.id)
        } else if (currentDropType === 'after') {
            onMove(draggedIds, entity.parentId || 'root', 'after', entity.id)
        }
    }

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "group relative flex items-center h-[22px] px-2 gap-1 cursor-default select-none transition-all duration-75",
                "border border-transparent mx-0 rounded-sm",
                isSelected
                    ? "bg-primary/20 text-foreground"
                    : isAncestorSelected
                        ? "bg-primary/5 text-foreground/80"
                        : "text-foreground/70 hover:bg-white/5 hover:text-foreground",
                dropType === 'inside' && "bg-blue-500/20 ring-1 ring-inset ring-blue-500/50 rounded-sm",
                !entity.active && "opacity-50"
            )}
            onClick={(e) => {
                e.stopPropagation()
                onSelect(entity.id, e.ctrlKey || e.metaKey, e.shiftKey)
            }}
            onDoubleClick={(e) => {
                e.stopPropagation()
                // Renaming double click handled by parent state now? 
                // We need to trigger it. 
                // But onRename expects (id, name). We need a "onStartRename".
                // Since interface didn't have it, we'll assume the parent logic handles selection + F2, 
                // OR we can't double click to rename anymore unless we add that callback.
                // Godot style: Double click usually centers view or renames? 
                // In Godot: click -> wait -> click triggers rename. Double click focuses.
                // Let's rely on ContextMenu or F2 for rename to be sharp.
                // Double click can imply "Focus".
            }}
        >
            {/* Drop Indicators */}
            {dropType === 'before' && (
                <div className="absolute top-[-1px] left-0 right-0 h-[2px] bg-blue-400 z-[100] shadow-[0_0_4px_rgba(96,165,250,0.8)]" />
            )}
            {dropType === 'after' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-400 z-[100] shadow-[0_0_4px_rgba(96,165,250,0.8)]" />
            )}

            {/* Indentation Guides */}
            <div className="flex h-full shrink-0 items-center">
                {Array.from({ length: depth }).map((_, i) => (
                    <div
                        key={i}
                        className="h-full w-4 flex justify-center border-l border-white/[0.08]"
                        style={{ borderLeftStyle: 'solid' }}
                    />
                ))}
            </div>

            {/* Expand Toggle */}
            <div
                className="w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/10 rounded-sm"
                style={{ marginLeft: -4 }} // Offset for center-aligned line vs left-aligned chevron
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpanded(entity.id)
                }}
            >
                {entity.children.length > 0 && (
                    <ChevronRight
                        className={cn(
                            "w-3 h-3 transition-transform duration-150",
                            entity.expanded && "rotate-90"
                        )}
                    />
                )}
            </div>

            {/* Icon */}
            <EntityIcon type={entity.type} className={cn(isSelected ? "text-foreground" : "text-foreground/40")} />

            {/* Name */}
            <div className="flex-1 truncate ml-1">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-background border border-primary/50 text-foreground px-1 py-0 height-[18px] text-[11px] outline-none rounded-sm"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="text-[11px] font-medium tracking-tight truncate">
                        {entity.name}
                    </span>
                )}
            </div>

            {/* Status Toggles (Visible on hover or when selected) */}
            <div className={cn(
                "flex items-center gap-0.5 opacity-0 transition-opacity",
                isSelected ? "opacity-100" : "group-hover:opacity-100"
            )}>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove(entity.id)
                    }}
                    className="p-1 rounded-sm hover:bg-white/10 text-foreground/50 hover:text-foreground/90 transition-colors"
                    title="Delete entity"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleLock(entity.id)
                    }}
                    className={cn(
                        "p-1 rounded-sm hover:bg-white/10 transition-colors",
                        entity.locked ? "text-foreground/90" : "text-foreground/30 hover:text-foreground/60"
                    )}
                    title={entity.locked ? "Unlock entity" : "Lock entity"}
                >
                    {entity.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleActive(entity.id)
                    }}
                    className={cn(
                        "p-1 rounded-sm hover:bg-white/10 transition-colors",
                        !entity.active ? "text-foreground/50" : "text-foreground/30 hover:text-foreground/60"
                    )}
                    title={entity.active ? "Hide entity" : "Show entity"}
                >
                    {entity.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    )
}
