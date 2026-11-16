import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * TRITON THEMED BUTTON LIBRARY
 * 
 * A collection of 3D-style themed buttons used throughout the Triton Editor.
 * These buttons feature gradient backgrounds, subtle shadows, and smooth transitions
 * to create a polished, professional appearance.
 */

// Shared base styles for the 3D themed effect
const themedButtonBase = `
    triton-raised
    disabled:opacity-50 disabled:cursor-not-allowed
`

const themedButtonMinimal = `
    transition-all duration-150
    hover:bg-white/5 
    active:bg-white/10
    border border-transparent
    hover:border-white/5
    disabled:opacity-50 disabled:cursor-not-allowed
`

const themedButtonTopbar = `
    triton-raised
    disabled:opacity-50
`

export interface ThemedMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Show dropdown chevron indicator */
    hasDropdown?: boolean
    /** Visual variant */
    variant?: "default" | "minimal" | "topbar"
}

/**
 * ThemedMenuButton
 * 
 * A themed menu button for the top menu bar or panel toolbars.
 */
export const ThemedMenuButton = ({
    children,
    hasDropdown = false,
    variant = "default",
    className,
    ...props
}: ThemedMenuButtonProps) => {
    const variantClasses = {
        default: themedButtonBase,
        minimal: themedButtonMinimal,
        topbar: themedButtonTopbar
    }

    return (
        <button
            className={cn(
                "h-6 px-1.5 text-[11px] font-medium rounded flex items-center gap-1",
                "text-foreground/70 hover:text-foreground transition-colors",
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {children}
            {hasDropdown && <ChevronDown className="w-3 h-3 opacity-40 group-hover:opacity-80 transition-opacity" />}
        </button>
    )
}

export interface ThemedIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Size variant */
    size?: "sm" | "md" | "lg"
}

/**
 * ThemedIconButton
 * 
 * A 3D-style icon button for toolbars (Play, Pause, Stop, etc.)
 */
export const ThemedIconButton = ({
    children,
    size = "md",
    className,
    ...props
}: ThemedIconButtonProps) => {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-7 h-7",
        lg: "w-8 h-8"
    }

    return (
        <button
            className={cn(
                "flex shrink-0 items-center justify-center rounded p-0",
                "text-foreground/70 hover:text-foreground",
                sizeClasses[size],
                themedButtonBase,
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}

// Re-export for convenience
export { themedButtonBase }
