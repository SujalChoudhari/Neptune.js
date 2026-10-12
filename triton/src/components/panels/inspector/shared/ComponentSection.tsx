import React, { useState } from "react"
import {
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff,
    MoreVertical,
    Copy,
    Clipboard,
    Plus,
    Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    ThemedContextMenu,
    ThemedContextMenuTrigger,
    ThemedContextMenuContent,
    ThemedContextMenuItem,
    ThemedContextMenuSeparator
} from "@/components/library"
import type { ComponentSectionProps } from "./types"

/**
 * ComponentSection
 * 
 * A collapsible section wrapper for Inspector components with:
 * - Active toggle (eye icon)
 * - Reordering buttons (hover only)
 * - Options menu (context menu)
 */
export const ComponentSection = ({
    title,
    icon,
    iconColor = "text-foreground/70",
    children,
    defaultOpen = true,
    isActive = true,
    onToggleActive,
    canReorder = true,
    onMoveUp,
    onMoveDown,
    onRemove,
    onDuplicate,
    onCopyValues,
    onPasteValues
}: ComponentSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={cn(
            "group flex flex-col border-b border-[hsl(0,0%,12%)] last:border-b-0",
            !isActive && "opacity-60 grayscale-[0.5]"
        )}>
            <div className={cn(
                "h-6 px-1 text-[11px] font-medium flex items-center gap-1",
                "bg-[hsl(0,0%,18%)] hover:bg-[hsl(0,0%,20%)]",
                "text-foreground transition-colors"
            )}>
                {/* Collapse/Expand Toggle */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 flex-1 min-w-0 hover:text-foreground transition-colors group/toggle"
                >
                    <ChevronRight className={cn(
                        "w-3.5 h-3.5 text-muted-foreground/70 transition-transform shrink-0",
                        isOpen && "rotate-90"
                    )} />
                    {icon && (
                        <div className={cn("w-4 h-4 flex items-center justify-center shrink-0", iconColor)}>
                            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-3.5 h-3.5" })}
                        </div>
                    )}
                    <span className="truncate text-[11px] select-none">{title}</span>
                </button>

                {/* Controls (Eye, Reordering, Options) */}
                <div className="flex items-center gap-0">
                    {/* Active Toggle (Eye) */}
                    <button
                        type="button"
                        onClick={() => onToggleActive?.(!isActive)}
                        className={cn(
                            "w-6 h-6 flex items-center justify-center rounded transition-colors",
                            isActive ? "text-blue-400/80 hover:text-blue-300" : "text-muted-foreground/30 hover:text-foreground"
                        )}
                        title={isActive ? "Disable component" : "Enable component"}
                    >
                        {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>

                    {/* Reordering & Options (Subtle visibility until hover) */}
                    <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-all duration-200">
                        {canReorder && (
                            <>
                                <button
                                    type="button"
                                    onClick={onMoveUp}
                                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronUp className="w-2.5 h-2.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={onMoveDown}
                                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronDown className="w-2.5 h-2.5" />
                                </button>
                            </>
                        )}

                        <ThemedContextMenu>
                            <ThemedContextMenuTrigger className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                                <MoreVertical className="w-3 h-3" />
                            </ThemedContextMenuTrigger>
                            <ThemedContextMenuContent>
                                <ThemedContextMenuItem onClick={onCopyValues}>
                                    <Copy className="w-3 h-3 mr-2" />
                                    Copy Values
                                </ThemedContextMenuItem>
                                <ThemedContextMenuItem onClick={onPasteValues}>
                                    <Clipboard className="w-3 h-3 mr-2" />
                                    Paste Values
                                </ThemedContextMenuItem>
                                <ThemedContextMenuSeparator />
                                <ThemedContextMenuItem onClick={onDuplicate}>
                                    <Plus className="w-3 h-3 mr-2" />
                                    Duplicate
                                </ThemedContextMenuItem>
                                <ThemedContextMenuItem onClick={onRemove} className="text-red-400 focus:text-red-400">
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Remove
                                </ThemedContextMenuItem>
                            </ThemedContextMenuContent>
                        </ThemedContextMenu>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="p-2 space-y-1.5 bg-[hsl(0,0%,16%)]">
                    {children}
                </div>
            )}
        </div>
    )
}
