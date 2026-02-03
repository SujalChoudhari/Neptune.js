import { cn } from "@/lib/utils"
import type { PropertyRowProps } from "./types"

/**
 * PropertyRow
 * 
 * A horizontal layout for a label and its corresponding input.
 * Brightened labels for better contrast as requested by user.
 */
export const PropertyRow = ({ label, children, labelWidth = "w-20" }: PropertyRowProps) => (
    <div className="flex items-center gap-1 group/row min-w-0 w-full px-1 py-0.5">
        <span
            className={cn(
                "text-[10px] font-medium shrink-0 truncate transition-colors",
                "text-foreground/80 group-hover/row:text-foreground",
                labelWidth
            )}
            title={label}
        >
            {label}
        </span>
        <div className="flex-1 min-w-0 flex items-center min-h-[22px]">
            {children}
        </div>
    </div>
)
