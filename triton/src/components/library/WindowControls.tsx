import { Minus, Square, X, Copy } from "lucide-react"

interface WindowControlsProps {
    isMaximized?: boolean
    onMinimize?: () => void
    onMaximize?: () => void
    onClose?: () => void
}

export function WindowControls({ isMaximized, onMinimize, onMaximize, onClose }: WindowControlsProps) {
    return (
        <div className="flex h-full no-drag">
            <button
                onClick={onMinimize}
                className="flex items-center justify-center w-11 h-full hover:bg-foreground/10 transition-colors"
                title="Minimize"
            >
                <Minus className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={onMaximize}
                className="flex items-center justify-center w-11 h-full hover:bg-foreground/10 transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
            >
                {isMaximized ? (
                    <Copy className="w-3 h-3" />
                ) : (
                    <Square className="w-3 h-3" />
                )}
            </button>
            <button
                onClick={onClose}
                className="flex items-center justify-center w-11 h-full hover:bg-red-500 hover:text-white transition-colors"
                title="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
