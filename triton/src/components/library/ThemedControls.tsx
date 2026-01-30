import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronRight } from "lucide-react"
import { forwardRef, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

/**
 * TRITON THEMED CONTROLS LIBRARY
 * 
 * A collection of 3D-style themed control components for the Triton Editor.
 */

// ============================================================================
// THEMED SLIDER
// ============================================================================

export interface ThemedSliderProps {
    value?: number
    onChange?: (value: number) => void
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    className?: string
    showValue?: boolean
}

/**
 * ThemedSlider
 * 
 * A range slider with themed track and thumb.
 */
export const ThemedSlider = ({
    value = 0,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    className,
    showValue = true
}: ThemedSliderProps) => {
    const percentage = ((value - min) / (max - min)) * 100

    return (
        <div className={cn("flex items-center gap-2 w-full", className)}>
            <div className="relative flex-1 h-4 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-gradient-to-b from-[hsl(0,0%,12%)] to-[hsl(0,0%,16%)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]" />

                {/* Filled portion */}
                <div
                    className="absolute left-0 h-1.5 rounded-full bg-gradient-to-b from-[hsl(0,0%,45%)] to-[hsl(0,0%,35%)]"
                    style={{ width: `${percentage}%` }}
                />

                {/* Input (invisible, for interaction) */}
                <input
                    type="range"
                    value={value}
                    onChange={(e) => onChange?.(parseFloat(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                {/* Thumb */}
                <div
                    className={cn(
                        "absolute w-3 h-3 -translate-x-1/2 rounded-full pointer-events-none",
                        "bg-gradient-to-b from-[hsl(0,0%,55%)] to-[hsl(0,0%,40%)]",
                        "border border-[hsl(0,0%,30%)] border-t-[hsl(0,0%,60%)]",
                        "shadow-[0_1px_3px_rgba(0,0,0,0.5)]",
                        disabled && "opacity-50"
                    )}
                    style={{ left: `${percentage}%` }}
                />
            </div>

            {showValue && (
                <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                    {value}
                </span>
            )}
        </div>
    )
}

// ============================================================================
// THEMED CHECKBOX
// ============================================================================

export interface ThemedCheckboxProps {
    checked?: boolean
    onChange?: (checked: boolean) => void
    disabled?: boolean
    className?: string
    label?: string
}

/**
 * ThemedCheckbox
 * 
 * A checkbox with 3D box styling.
 */
export const ThemedCheckbox = ({
    checked = false,
    onChange,
    disabled = false,
    className,
    label
}: ThemedCheckboxProps) => {
    return (
        <label className={cn(
            "flex items-center gap-2 cursor-pointer",
            disabled && "cursor-not-allowed opacity-50",
            className
        )}>
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange?.(!checked)}
                className={cn(
                    "w-4 h-4 rounded flex items-center justify-center transition-all duration-150",
                    "bg-gradient-to-b from-[hsl(0,0%,14%)] to-[hsl(0,0%,18%)]",
                    "border border-[hsl(0,0%,10%)] border-t-[hsl(0,0%,8%)]",
                    "shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.03)]",
                    checked && "from-[hsl(0,0%,35%)] to-[hsl(0,0%,28%)]",
                    "focus:outline-none focus:ring-1 focus:ring-[hsl(0,0%,40%)]"
                )}
            >
                {checked && <Check className="w-3 h-3 text-foreground" strokeWidth={3} />}
            </button>
            {label && <span className="text-xs text-foreground/80">{label}</span>}
        </label>
    )
}

// ============================================================================
// THEMED TOGGLE
// ============================================================================

export interface ThemedToggleProps {
    checked?: boolean
    onChange?: (checked: boolean) => void
    disabled?: boolean
    className?: string
    label?: string
}

/**
 * ThemedToggle
 * 
 * An on/off toggle switch with pill styling.
 */
export const ThemedToggle = ({
    checked = false,
    onChange,
    disabled = false,
    className,
    label
}: ThemedToggleProps) => {
    return (
        <label className={cn(
            "flex items-center gap-2 cursor-pointer",
            disabled && "cursor-not-allowed opacity-50",
            className
        )}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange?.(!checked)}
                className={cn(
                    "w-8 h-4 rounded-full relative transition-all duration-200",
                    "bg-gradient-to-b from-[hsl(0,0%,14%)] to-[hsl(0,0%,18%)]",
                    "border border-[hsl(0,0%,10%)]",
                    "shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]",
                    checked && "from-[hsl(0,0%,35%)] to-[hsl(0,0%,28%)]",
                    "focus:outline-none focus:ring-1 focus:ring-[hsl(0,0%,40%)]"
                )}
            >
                <div className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200",
                    "bg-gradient-to-b from-[hsl(0,0%,55%)] to-[hsl(0,0%,40%)]",
                    "border border-[hsl(0,0%,30%)] border-t-[hsl(0,0%,60%)]",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
                    checked ? "left-[calc(100%-14px)]" : "left-0.5"
                )} />
            </button>
            {label && <span className="text-xs text-foreground/80">{label}</span>}
        </label>
    )
}

// ============================================================================
// THEMED SELECT
// ============================================================================

export interface ThemedSelectOption {
    value: string
    label: string
}

export interface ThemedSelectProps {
    value?: string
    onChange?: (value: string) => void
    options: ThemedSelectOption[]
    placeholder?: string
    disabled?: boolean
    className?: string
}

/**
 * ThemedSelect
 * 
 * A dropdown select with themed trigger button.
 */
export const ThemedSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
    disabled = false,
    className
}: ThemedSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            })
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen) {
            const handleClickOutside = () => setIsOpen(false)
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div className={cn("relative w-full", className)}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
                className={cn(
                    "w-full h-7 px-2 text-xs rounded-md flex items-center justify-between gap-1",
                    "bg-gradient-to-b from-[hsl(0,0%,28%)] to-[hsl(0,0%,22%)]",
                    "border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,32%)]",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
                    "hover:from-[hsl(0,0%,32%)] hover:to-[hsl(0,0%,26%)]",
                    "text-foreground/80 hover:text-foreground",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-1 focus:ring-[hsl(0,0%,40%)]"
                )}
            >
                <span className="truncate">{selectedOption?.label ?? placeholder}</span>
                <ChevronDown className={cn("w-3 h-3 opacity-60 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && createPortal(
                <div
                    className="fixed z-[9999] py-1 rounded-md bg-popover border border-border shadow-lg"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        minWidth: 120
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => { onChange?.(option.value); setIsOpen(false) }}
                            className={cn(
                                "w-full px-2 py-1 text-xs text-left",
                                "hover:bg-accent/50 text-foreground/80 hover:text-foreground",
                                value === option.value && "bg-accent/30"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    )
}

// ============================================================================
// THEMED COLLAPSIBLE
// ============================================================================

export interface ThemedCollapsibleProps {
    title: string
    defaultOpen?: boolean
    children: React.ReactNode
    className?: string
}

/**
 * ThemedCollapsible
 * 
 * An expandable section with a header.
 */
export const ThemedCollapsible = ({
    title,
    defaultOpen = true,
    children,
    className
}: ThemedCollapsibleProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={cn("border border-border rounded-md overflow-hidden", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-7 px-2 text-xs font-medium flex items-center gap-1",
                    "bg-gradient-to-b from-[hsl(0,0%,24%)] to-[hsl(0,0%,20%)]",
                    "border-b border-border",
                    "text-foreground/80 hover:text-foreground",
                    "focus:outline-none"
                )}
            >
                <ChevronRight className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    isOpen && "rotate-90"
                )} />
                {title}
            </button>
            {isOpen && (
                <div className="p-2 bg-card/50">
                    {children}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// THEMED SCROLL AREA
// ============================================================================

export interface ThemedScrollAreaProps {
    children: React.ReactNode
    className?: string
    maxHeight?: string
}

/**
 * ThemedScrollArea
 * 
 * A scrollable container with themed scrollbars.
 */
export const ThemedScrollArea = forwardRef<HTMLDivElement, ThemedScrollAreaProps>(
    ({ children, className, maxHeight = "200px" }, ref) => (
        <div
            ref={ref}
            className={cn(
                "overflow-auto",
                // Themed scrollbar styles
                "[&::-webkit-scrollbar]:w-2",
                "[&::-webkit-scrollbar-track]:bg-[hsl(0,0%,14%)]",
                "[&::-webkit-scrollbar-track]:rounded-full",
                "[&::-webkit-scrollbar-thumb]:bg-gradient-to-b",
                "[&::-webkit-scrollbar-thumb]:from-[hsl(0,0%,35%)]",
                "[&::-webkit-scrollbar-thumb]:to-[hsl(0,0%,28%)]",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "[&::-webkit-scrollbar-thumb]:border",
                "[&::-webkit-scrollbar-thumb]:border-[hsl(0,0%,20%)]",
                "[&::-webkit-scrollbar-thumb:hover]:from-[hsl(0,0%,40%)]",
                "[&::-webkit-scrollbar-thumb:hover]:to-[hsl(0,0%,32%)]",
                className
            )}
            style={{ maxHeight }}
        >
            {children}
        </div>
    )
)
ThemedScrollArea.displayName = "ThemedScrollArea"

// ============================================================================
// THEMED COLOR PICKER
// ============================================================================

export interface ThemedColorPickerProps {
    value?: string
    onChange?: (value: string) => void
    disabled?: boolean
    className?: string
}

/**
 * ThemedColorPicker
 * 
 * A color swatch with hex input.
 */
export const ThemedColorPicker = ({
    value = "#808080",
    onChange,
    disabled = false,
    className
}: ThemedColorPickerProps) => {
    const [localValue, setLocalValue] = useState(value)

    const handleSwatchClick = () => {
        const input = document.createElement('input')
        input.type = 'color'
        input.value = localValue
        input.onchange = (e) => {
            const newValue = (e.target as HTMLInputElement).value
            setLocalValue(newValue)
            onChange?.(newValue)
        }
        input.click()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setLocalValue(newValue)
        if (/^#[0-9a-fA-F]{6}$/.test(newValue)) {
            onChange?.(newValue)
        }
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={handleSwatchClick}
                className={cn(
                    "w-7 h-7 rounded-md",
                    "border border-[hsl(0,0%,14%)]",
                    "shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]",
                    "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{ backgroundColor: localValue }}
            />
            <input
                type="text"
                value={localValue}
                onChange={handleInputChange}
                disabled={disabled}
                className={cn(
                    "h-7 w-20 px-2 text-xs rounded-md font-mono",
                    "text-foreground/90",
                    "bg-gradient-to-b from-[hsl(0,0%,14%)] to-[hsl(0,0%,18%)]",
                    "border border-[hsl(0,0%,10%)] border-t-[hsl(0,0%,8%)]",
                    "shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]",
                    "focus:outline-none focus:ring-1 focus:ring-[hsl(0,0%,40%)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            />
        </div>
    )
}
