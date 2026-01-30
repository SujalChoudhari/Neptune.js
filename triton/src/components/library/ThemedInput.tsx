import { cn } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import { forwardRef, useState, useCallback, useRef } from "react"

/**
 * TRITON THEMED INPUT LIBRARY
 * 
 * A collection of 3D-style themed input components for the Triton Editor.
 * Features inset styling to create a "pressed in" appearance.
 */

// Shared base styles for inset inputs (opposite of buttons - looks recessed)
const themedInputBase = `
    transition-all duration-150
    bg-gradient-to-b from-[hsl(0,0%,14%)] to-[hsl(0,0%,18%)]
    border border-[hsl(0,0%,10%)] border-t-[hsl(0,0%,8%)]
    shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.03)]
    focus:outline-none focus:ring-1 focus:ring-[hsl(0,0%,40%)] focus:border-[hsl(0,0%,30%)]
    placeholder:text-muted-foreground/50
    disabled:opacity-50 disabled:cursor-not-allowed
`

// ============================================================================
// THEMED INPUT
// ============================================================================

export interface ThemedInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

/**
 * ThemedInput
 * 
 * A 3D-style text input with an inset appearance.
 */
export const ThemedInput = forwardRef<HTMLInputElement, ThemedInputProps>(
    ({ className, type = "text", ...props }, ref) => (
        <input
            type={type}
            ref={ref}
            className={cn(
                "h-7 px-2 text-xs rounded-md w-full",
                "text-foreground/90",
                themedInputBase,
                className
            )}
            {...props}
        />
    )
)
ThemedInput.displayName = "ThemedInput"

// ============================================================================
// THEMED NUMBER INPUT
// ============================================================================

export interface ThemedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    value?: number
    onChange?: (value: number) => void
    step?: number
    min?: number
    max?: number
}

/**
 * ThemedNumberInput
 * 
 * A number input with +/- spinner buttons.
 */
export const ThemedNumberInput = forwardRef<HTMLInputElement, ThemedNumberInputProps>(
    ({ className, value = 0, onChange, step = 1, min, max, disabled, ...props }, ref) => {
        const [internalValue, setInternalValue] = useState(value)
        const currentValue = value ?? internalValue

        const updateValue = useCallback((newValue: number) => {
            let clamped = newValue
            if (min !== undefined) clamped = Math.max(min, clamped)
            if (max !== undefined) clamped = Math.min(max, clamped)
            setInternalValue(clamped)
            onChange?.(clamped)
        }, [min, max, onChange])

        const increment = () => updateValue(currentValue + step)
        const decrement = () => updateValue(currentValue - step)

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const parsed = parseFloat(e.target.value)
            if (!isNaN(parsed)) {
                updateValue(parsed)
            }
        }

        const spinnerButton = `
            w-5 h-full flex items-center justify-center
            bg-gradient-to-b from-[hsl(0,0%,28%)] to-[hsl(0,0%,22%)]
            border-l border-[hsl(0,0%,14%)]
            hover:from-[hsl(0,0%,32%)] hover:to-[hsl(0,0%,26%)]
            active:from-[hsl(0,0%,20%)] active:to-[hsl(0,0%,18%)]
            text-foreground/60 hover:text-foreground
            disabled:opacity-50 disabled:cursor-not-allowed
        `

        return (
            <div className={cn("flex h-7 rounded-md overflow-hidden", className)}>
                <input
                    type="number"
                    ref={ref}
                    value={currentValue}
                    onChange={handleChange}
                    disabled={disabled}
                    className={cn(
                        "flex-1 min-w-0 px-2 text-xs text-right",
                        "text-foreground/90 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        themedInputBase,
                        "rounded-none rounded-l-md"
                    )}
                    {...props}
                />
                <button
                    type="button"
                    onClick={decrement}
                    disabled={disabled || (min !== undefined && currentValue <= min)}
                    className={spinnerButton}
                >
                    <Minus className="w-3 h-3" />
                </button>
                <button
                    type="button"
                    onClick={increment}
                    disabled={disabled || (max !== undefined && currentValue >= max)}
                    className={cn(spinnerButton, "rounded-r-md")}
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>
        )
    }
)
ThemedNumberInput.displayName = "ThemedNumberInput"

// ============================================================================
// THEMED LABELED INPUT
// ============================================================================

export interface ThemedLabeledInputProps extends ThemedInputProps {
    label: string
    labelWidth?: string
}

/**
 * ThemedLabeledInput
 * 
 * A labeled input pair commonly used in inspector panels.
 */
export const ThemedLabeledInput = forwardRef<HTMLInputElement, ThemedLabeledInputProps>(
    ({ label, labelWidth = "80px", className, ...props }, ref) => (
        <div className={cn("flex items-center gap-2", className)}>
            <label
                className="text-xs text-muted-foreground shrink-0 truncate"
                style={{ width: labelWidth }}
            >
                {label}
            </label>
            <ThemedInput ref={ref} {...props} />
        </div>
    )
)
ThemedLabeledInput.displayName = "ThemedLabeledInput"

// ============================================================================
// THEMED VECTOR INPUT
// ============================================================================

export interface ThemedVectorInputProps {
    /** Number of dimensions: 1 (x), 2 (x,y), or 3 (x,y,z) */
    dimensions?: 1 | 2 | 3
    value?: { x: number; y: number; z: number }
    onChange?: (value: { x: number; y: number; z: number }) => void
    disabled?: boolean
    /** Step for value changes (default: 0.1) */
    step?: number
    /** Sensitivity for drag (pixels per step, default: 5) */
    dragSensitivity?: number
    /** Optional label to display before the inputs */
    label?: string
    className?: string
}

/**
 * ThemedVectorInput
 * 
 * A grouped X/Y/Z input for transform values with:
 * - Support for 1D, 2D, or 3D vectors
 * - Draggable labels (click and drag left/right to change values)
 * - Link toggle to sync all values together
 */
export const ThemedVectorInput = ({
    dimensions = 3,
    value = { x: 0, y: 0, z: 0 },
    onChange,
    disabled,
    step = 0.1,
    dragSensitivity = 5,
    label,
    className
}: ThemedVectorInputProps) => {
    const [isLinked, setIsLinked] = useState(false)
    const [isDragging, setIsDragging] = useState<'x' | 'y' | 'z' | null>(null)
    const dragStartRef = useRef<{ x: number; startValue: number } | null>(null)

    const axes = (['x', 'y', 'z'] as const).slice(0, dimensions)

    const handleChange = useCallback((axis: 'x' | 'y' | 'z', newValue: number) => {
        if (isLinked) {
            // When linked, set all visible axes to the same value
            const newVector = { ...value }
            axes.forEach(a => { newVector[a] = newValue })
            onChange?.(newVector)
        } else {
            onChange?.({ ...value, [axis]: newValue })
        }
    }, [isLinked, value, onChange, axes])

    const handleLabelMouseDown = useCallback((axis: 'x' | 'y' | 'z', e: React.MouseEvent) => {
        if (disabled) return
        e.preventDefault()
        setIsDragging(axis)
        dragStartRef.current = { x: e.clientX, startValue: value[axis] }

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragStartRef.current) return
            const deltaX = moveEvent.clientX - dragStartRef.current.x
            const steps = Math.floor(deltaX / dragSensitivity)
            const newValue = Math.round((dragStartRef.current.startValue + steps * step) * 1000) / 1000
            handleChange(axis, newValue)
        }

        const handleMouseUp = () => {
            setIsDragging(null)
            dragStartRef.current = null
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [disabled, value, step, dragSensitivity, handleChange])

    const axisColors = {
        x: "text-red-400",
        y: "text-green-400",
        z: "text-blue-400"
    }

    return (
        <div className={cn("w-full flex items-center gap-2", className)}>
            {/* Optional Label */}
            {label && (
                <span className="text-xs text-muted-foreground shrink-0 w-16 truncate">
                    {label}
                </span>
            )}

            {/* Link Toggle */}
            <button
                type="button"
                onClick={() => setIsLinked(!isLinked)}
                disabled={disabled}
                title={isLinked ? "Unlink values" : "Link values (sync all)"}
                className={cn(
                    "w-5 h-5 flex items-center justify-center rounded transition-all duration-150",
                    "hover:bg-accent/30",
                    isLinked
                        ? "text-foreground"
                        : "text-muted-foreground/50 hover:text-muted-foreground",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                {isLinked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
                        <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.72-1.71" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                )}
            </button>

            {/* Axis Inputs */}
            <div className="flex gap-1 flex-1">
                {axes.map((axis) => (
                    <div key={axis} className="flex items-center gap-0.5 flex-1 min-w-0">
                        {/* Draggable Label */}
                        <span
                            onMouseDown={(e) => handleLabelMouseDown(axis, e)}
                            className={cn(
                                "text-xs font-bold uppercase w-4 shrink-0 text-center select-none",
                                "cursor-ew-resize hover:bg-accent/20 rounded px-0.5 transition-colors",
                                axisColors[axis],
                                isDragging === axis && "bg-accent/30",
                                disabled && "cursor-not-allowed opacity-50"
                            )}
                            title={`Drag left/right to adjust ${axis.toUpperCase()}`}
                        >
                            {axis}
                        </span>

                        {/* Number Input (simplified - no spinners for cleaner look) */}
                        <input
                            type="number"
                            value={value[axis]}
                            onChange={(e) => {
                                const parsed = parseFloat(e.target.value)
                                if (!isNaN(parsed)) handleChange(axis, parsed)
                            }}
                            step={step}
                            disabled={disabled}
                            className={cn(
                                "w-full flex-1 min-w-0 h-6 px-1.5 text-xs text-center rounded",
                                "text-foreground/90",
                                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                themedInputBase
                            )}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}


// ============================================================================
// THEMED TEXT AREA
// ============================================================================

export interface ThemedTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

/**
 * ThemedTextArea
 * 
 * A multi-line text editor with 3D inset styling.
 */
export const ThemedTextArea = forwardRef<HTMLTextAreaElement, ThemedTextAreaProps>(
    ({ className, ...props }, ref) => (
        <textarea
            ref={ref}
            className={cn(
                "min-h-[80px] px-2 py-1.5 text-xs rounded-md w-full resize-y",
                "text-foreground/90",
                themedInputBase,
                className
            )}
            {...props}
        />
    )
)
ThemedTextArea.displayName = "ThemedTextArea"

// Re-export base styles for extensions
export { themedInputBase }
