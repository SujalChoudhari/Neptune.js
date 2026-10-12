import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react"
import { ThemedIconButton, ThemedInput } from "@/components/library"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { EntityType } from "@/lib/mockHierarchy"

interface HierarchyToolbarProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    onAddEntity: (type: EntityType) => void
    onExpandAll: () => void
    onCollapseAll: () => void
}

export const HierarchyToolbar = ({
    searchQuery,
    onSearchChange,
    onAddEntity,
    onExpandAll,
    onCollapseAll
}: HierarchyToolbarProps) => {
    return (
        <div className="h-9 border-b border-border flex items-center px-2 gap-1 bg-card shrink-0">
            {/* Search */}
            <div className="flex-1">
                <ThemedInput
                    placeholder="Search scene..."
                    startIcon={<Search className="w-3.5 h-3.5" />}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    containerClassName="h-7"
                />
            </div>

            <div className="flex items-center gap-0.5 ml-1">
                <ThemedIconButton
                    size="sm"
                    title="Expand All"
                    onClick={onExpandAll}
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </ThemedIconButton>
                <ThemedIconButton
                    size="sm"
                    title="Collapse All"
                    onClick={onCollapseAll}
                >
                    <ChevronUp className="w-3.5 h-3.5" />
                </ThemedIconButton>

                <div className="w-px h-4 bg-border/40 mx-0.5" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <ThemedIconButton size="sm" title="Add GameObject">
                            <Plus className="w-3.5 h-3.5" />
                        </ThemedIconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px] bg-popover border-border">
                        <DropdownMenuItem className="text-xs" onClick={() => onAddEntity('empty')}>Create Empty</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => onAddEntity('group')}>Create Group</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => onAddEntity('cube')}>3D Object &gt; Cube</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => onAddEntity('sphere')}>3D Object &gt; Sphere</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => onAddEntity('light')}>Light &gt; Directional</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => onAddEntity('camera')}>Camera</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
