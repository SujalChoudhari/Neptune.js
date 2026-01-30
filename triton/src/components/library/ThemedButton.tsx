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
    transition-all duration-150
    bg-gradient-to-b from-[hsl(0,0%,28%)] to-[hsl(0,0%,22%)]
    border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,32%)]
    shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
    hover:from-[hsl(0,0%,32%)] hover:to-[hsl(0,0%,26%)]
    active:from-[hsl(0,0%,20%)] active:to-[hsl(0,0%,18%)] active:shadow-inner
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[hsl(0,0%,28%)] disabled:hover:to-[hsl(0,0%,22%)]
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
    transition-all duration-150
    bg-gradient-to-b from-[hsl(0,0%,24%)] to-[hsl(0,0%,18%)]
    border border-[hsl(0,0%,10%)] border-t-[hsl(0,0%,28%)]
    hover:from-[hsl(0,0%,28%)] hover:to-[hsl(0,0%,22%)]
    active:from-[hsl(0,0%,16%)] active:to-[hsl(0,0%,14%)]
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
                "px-2.5 py-1 text-[11px] font-medium rounded flex items-center gap-1.5",
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
                "flex items-center justify-center rounded-md",
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
