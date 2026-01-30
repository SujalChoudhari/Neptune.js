import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileSystemNode } from "@/lib/mockFileSystem"
import { useState } from "react"
import { ThemedScrollArea } from "@/components/library"
import { AssetIcon } from "./AssetIcon"

interface ProjectSidebarProps {
    nodes: Record<string, FileSystemNode>
    selectedId: string | null
    onSelect: (id: string) => void
}

const SidebarItem = ({
    node,
    nodes,
    level = 0,
    selectedId,
    onSelect
}: {
    node: FileSystemNode
    nodes: Record<string, FileSystemNode>
    level?: number
    selectedId: string | null
    onSelect: (id: string) => void
}) => {
    const [isOpen, setIsOpen] = useState(true)
    const hasChildren = node.children.some(childId => nodes[childId]?.type === 'folder')

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.currentTarget.classList.add('bg-accent/50')
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-accent/50')
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.currentTarget.classList.remove('bg-accent/50')

        let ids: string[] = []
        try {
            const json = e.dataTransfer.getData('application/json')
            if (json) ids = JSON.parse(json)
        } catch (err) { }

        if (ids.length === 0) {
            const draggedId = e.dataTransfer.getData('text/plain')
            if (draggedId) ids = [draggedId]
        }

        // Filter out self/target (simplified check, real logic handled by moveNodes)
        ids = ids.filter(id => id !== node.id)

        if (ids.length > 0) {
            const event = new CustomEvent('project-move-node', {
                detail: { nodeIds: ids, targetId: node.id }
            })
            window.dispatchEvent(event)
        }
    }

    return (
        <div>
            <div
                className={cn(
                    "flex items-center h-6 px-1 gap-1 cursor-pointer select-none transition-colors",
                    "hover:bg-accent/30 text-xs",
                    selectedId === node.id && "bg-accent text-accent-foreground",
                )}
                style={{ paddingLeft: `${level * 12 + 4}px` }}
                onClick={() => onSelect(node.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div
                    className="w-4 h-4 flex items-center justify-center shrink-0 hover:text-foreground/80 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsOpen(!isOpen)
                    }}
                >
                    {hasChildren && (
                        <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
                    )}
                </div>
                <AssetIcon type="folder" className="w-3.5 h-3.5" hasChildren={hasChildren} />
                <span className="truncate">{node.name}</span>
            </div>

            {isOpen && hasChildren && (
                <div>
                    {node.children
                        .map(id => nodes[id])
                        .filter(child => child.type === 'folder')
                        .map(child => (
                            <SidebarItem
                                key={child.id}
                                node={child}
                                nodes={nodes}
                                level={level + 1}
                                selectedId={selectedId}
                                onSelect={onSelect}
                            />
                        ))
                    }
                </div>
            )}
        </div>
    )
}

export const ProjectSidebar = ({ nodes, selectedId, onSelect }: ProjectSidebarProps) => {
    const rootNode = nodes["root"]
    if (!rootNode) return null

    return (
        <ThemedScrollArea className="h-full" maxHeight="100%">
            <div className="py-1">
                <SidebarItem
                    node={rootNode}
                    nodes={nodes}
                    level={0}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            </div>
        </ThemedScrollArea>
    )
}
