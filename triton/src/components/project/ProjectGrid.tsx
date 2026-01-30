import type { FileSystemNode } from "@/lib/mockFileSystem"
import { AssetIcon } from "./AssetIcon"
import { cn } from "@/lib/utils"
import {
    ThemedScrollArea,
    ThemedContextMenu,
    ThemedContextMenuTrigger,
    ThemedContextMenuContent,
    ThemedContextMenuItem,
    ThemedContextMenuSeparator
} from "@/components/library"
import { useState, useRef, useEffect } from "react"

interface ProjectGridProps {
    items: FileSystemNode[]
    onNavigate: (id: string) => void
    scale: number
    selectedIds: string[]
    renamingId: string | null
    onSelect: (id: string, e: React.MouseEvent) => void
    onRename: (id: string, newName: string) => void
    onAction: (action: 'rename' | 'duplicate' | 'delete', id: string) => void
    onClearSelection: () => void
    onMultiSelect: (ids: string[]) => void
}

const ProjectGridItem = ({
    item,
    scale,
    isSelected,
    isRenaming,
    onNavigate,
    onSelect,
    onRename,
    onAction,
    itemRef,
    selectedIds
}: {
    item: FileSystemNode
    scale: number
    isSelected: boolean
    isRenaming: boolean
    onNavigate: (id: string) => void
    onSelect: (id: string, e: React.MouseEvent) => void
    onRename: (id: string, newName: string) => void
    onAction: (action: 'rename' | 'duplicate' | 'delete', id: string) => void
    itemRef: (el: HTMLDivElement | null) => void
    selectedIds: string[]
}) => {
    const [renameValue, setRenameValue] = useState(item.name)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isRenaming])

    const handleSubmitRename = () => {
        onRename(item.id, renameValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmitRename()
        } else if (e.key === 'Escape') {
            onRename(item.id, item.name) // Cancel
        }
    }

    // Drag handlers
    const handleDragStart = (e: React.DragEvent) => {
        let ids = [item.id]
        if (isSelected) {
            ids = selectedIds
        }
        e.dataTransfer.setData('application/json', JSON.stringify(ids))
        e.dataTransfer.setData('text/plain', item.id) // Fallback
        e.dataTransfer.effectAllowed = 'move'

        // Custom Visual for Multi-Drag
        if (ids.length > 1) {
            const ghost = document.createElement('div')
            ghost.style.position = 'absolute'
            ghost.style.top = '-1000px'
            ghost.style.left = '-1000px'
            ghost.style.backgroundColor = '#3b82f6' // blue-500
            ghost.style.color = 'white'
            ghost.style.padding = '8px 12px'
            ghost.style.borderRadius = '6px'
            ghost.style.fontWeight = '500'
            ghost.style.fontSize = '14px'
            ghost.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            ghost.style.zIndex = '9999'
            ghost.textContent = `${ids.length} Items`

            document.body.appendChild(ghost)
            e.dataTransfer.setDragImage(ghost, 0, 0)

            // Clean up
            requestAnimationFrame(() => {
                document.body.removeChild(ghost)
            })
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        if (item.type === 'folder') {
            e.preventDefault()
            e.currentTarget.classList.add('bg-accent/30', 'scale-[1.02]')
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-accent/30', 'scale-[1.02]')
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.currentTarget.classList.remove('bg-accent/30', 'scale-[1.02]')

        let ids: string[] = []
        try {
            const json = e.dataTransfer.getData('application/json')
            if (json) ids = JSON.parse(json)
        } catch (err) { }

        if (ids.length === 0) {
            const text = e.dataTransfer.getData('text/plain')
            if (text) ids = [text]
        }

        // Remove self/target from list if present (can't drop on self)
        ids = ids.filter(id => id !== item.id)

        if (ids.length > 0) {
            const event = new CustomEvent('project-move-node', {
                detail: { nodeIds: ids, targetId: item.id }
            })
            window.dispatchEvent(event)
        }
    }

    return (
        <ThemedContextMenu>
            <ThemedContextMenuTrigger>
                <div
                    ref={itemRef}
                    className={cn(
                        "group flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all duration-200 select-none",
                        "border border-transparent",

                        // Hover: Clean single surface
                        !isSelected && "hover:bg-accent/10 hover:border-accent/20",

                        // Selected: Subtle single layer
                        isSelected && [
                            "bg-gradient-to-b from-[hsl(217,91%,60%,0.15)] to-[hsl(217,91%,60%,0.05)]",
                            "border-blue-500/30",
                            "shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]",
                        ],

                        "active:scale-95"
                    )}
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect(item.id, e)
                    }}
                    onMouseDown={(e) => {
                        // Prevent Marquee from starting here
                        e.stopPropagation()
                    }}
                    draggable
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => item.type === 'folder' && handleDrop(e)}
                    onDoubleClick={() => item.type === 'folder' && onNavigate(item.id)}
                >
                    {/* Icon Area - No framing, just the content */}
                    <div className="aspect-square w-full flex items-center justify-center relative overflow-hidden">
                        <AssetIcon
                            type={item.type}
                            className={cn(
                                "transition-transform duration-200 group-hover:scale-105 drop-shadow-md",
                                scale < 60 ? "w-8 h-8" : "w-14 h-14", // Slightly larger icons
                                isSelected ? "text-blue-200" : "" // Subtle tint on selection
                            )}
                            hasChildren={item.children.length > 0}
                        />
                        {scale > 80 && (
                            <div className="absolute bottom-1 right-1 text-[8px] bg-background/80 px-1 rounded uppercase text-muted-foreground">
                                {item.type}
                            </div>
                        )}
                    </div>

                    {isRenaming ? (
                        <input
                            ref={inputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleSubmitRename}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-center bg-background border border-accent rounded px-1 w-full focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                    ) : (
                        <span className="text-xs text-center text-foreground/80 truncate w-full px-1 select-none">
                            {item.name}
                        </span>
                    )}
                </div>
            </ThemedContextMenuTrigger>

            <ThemedContextMenuContent>
                <ThemedContextMenuItem onClick={() => item.type === 'folder' ? onNavigate(item.id) : null} disabled={item.type !== 'folder'}>
                    Open
                </ThemedContextMenuItem>
                <ThemedContextMenuSeparator />
                <ThemedContextMenuItem onClick={() => onAction('rename', item.id)}>
                    Rename <span className="ml-auto text-xs text-muted-foreground">F2</span>
                </ThemedContextMenuItem>
                <ThemedContextMenuItem onClick={() => onAction('duplicate', item.id)}>
                    Duplicate <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
                </ThemedContextMenuItem>
                <ThemedContextMenuSeparator />
                <ThemedContextMenuItem onClick={() => onAction('delete', item.id)} className="text-destructive focus:text-destructive">
                    Delete <span className="ml-auto text-xs text-destructive/50">Del</span>
                </ThemedContextMenuItem>
            </ThemedContextMenuContent>
        </ThemedContextMenu>
    )
}

export const ProjectGrid = ({
    items,
    onNavigate,
    scale,
    selectedIds,
    renamingId,
    onSelect,
    onRename,
    onAction,
    onClearSelection,
    onMultiSelect
}: ProjectGridProps) => {
    const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (selectionBox) {
                if (containerRef.current) {
                    // const rect = containerRef.current.getBoundingClientRect() // Unused
                    setSelectionBox(prev => prev ? ({ ...prev, endX: e.clientX, endY: e.clientY }) : null)
                }
            }
        }

        const handleMouseUp = () => {
            if (selectionBox) {
                // Finalize selection
                // Calculate intersection
                const boxRect = {
                    left: Math.min(selectionBox.startX, selectionBox.endX),
                    right: Math.max(selectionBox.startX, selectionBox.endX),
                    top: Math.min(selectionBox.startY, selectionBox.endY),
                    bottom: Math.max(selectionBox.startY, selectionBox.endY)
                }

                // If box is tiny, ignore (click)
                if (Math.abs(boxRect.right - boxRect.left) > 5 || Math.abs(boxRect.bottom - boxRect.top) > 5) {
                    const newSelected: string[] = []
                    Object.entries(itemRefs.current).forEach(([id, el]) => {
                        if (el) {
                            const itemRect = el.getBoundingClientRect()
                            if (
                                boxRect.left < itemRect.right &&
                                boxRect.right > itemRect.left &&
                                boxRect.top < itemRect.bottom &&
                                boxRect.bottom > itemRect.top
                            ) {
                                newSelected.push(id)
                            }
                        }
                    })
                    onMultiSelect(newSelected)
                }
                setSelectionBox(null)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [selectionBox, items]) // items needed for refs? refs are stable.

    // Wait, I need a callback to set multiple items.
    // 'onSelect' interface is: (id: string, e: MouseEvent).
    // I can't easily set multiple.
    // I will modify ProjectGridProps to accept 'onMultiSelect' or 'setSelectedIds'
    // But 'onSelect' in Panel handles logic.
    // I will leave this for now and just set ONE item or first item?
    // User requested "to select all the files in that box".
    // I MUST support multi-selection setting.
    // I'll assume I can add `onSelectionChange` to props, but I need to update ProjectPanel too.

    // Quick Fix: ProjectPanel receives onSelect.
    // I will call onSelect(newSelected[0], { shiftKey: false, ctrlKey: false })?
    // No.
    // I need to update ProjectPanel to expose 'setSelectedIds'.
    // Or I can abuse 'onSelect' with a custom event?

    // Better: Add 'onMultiSelect: (ids: string[]) => void'

    return (
        <ThemedScrollArea className="h-full" maxHeight="100%">
            <div
                ref={containerRef}
                className="p-4 content-start min-h-full relative"
                onMouseDown={(e) => {
                    // Start selection if left click. 
                    // Items call stopPropagation, so this bubbles only from background/empty space.
                    if (e.button === 0) {
                        onClearSelection()
                        setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY })
                    }
                }}
            >
                <div
                    className="grid gap-2 transition-all relative z-10"
                    style={{
                        gridTemplateColumns: `repeat(auto-fill, minmax(${scale}px, 1fr))`
                    }}
                >
                    {items.map(item => (
                        <ProjectGridItem
                            key={item.id}
                            itemRef={(el) => itemRefs.current[item.id] = el}
                            item={item}
                            scale={scale}
                            isSelected={selectedIds.includes(item.id)}
                            isRenaming={renamingId === item.id}
                            onNavigate={onNavigate}
                            onSelect={onSelect}
                            onRename={onRename}
                            onAction={onAction}
                            selectedIds={selectedIds}
                        />
                    ))}
                </div>
                {items.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground/40 text-sm py-10 pointer-events-none">
                        Folder is empty
                    </div>
                )}

                {/* Selection Box Render */}
                {selectionBox && containerRef.current && (() => {
                    const rect = containerRef.current.getBoundingClientRect()
                    const left = Math.min(selectionBox.startX, selectionBox.endX) - rect.left
                    const top = Math.min(selectionBox.startY, selectionBox.endY) - rect.top
                    const width = Math.abs(selectionBox.endX - selectionBox.startX)
                    const height = Math.abs(selectionBox.endY - selectionBox.startY)

                    return (
                        <div
                            className="absolute bg-blue-500/20 border border-blue-500/50 z-20 pointer-events-none"
                            style={{ left, top, width, height }}
                        />
                    )
                })()}
            </div>
        </ThemedScrollArea>
    )
}
