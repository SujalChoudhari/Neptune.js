import {
    ThemedIconButton,
} from "@/components/library"
import { Play, Pause, Square } from "lucide-react"

export function EditorToolbar() {
    return (
        <header className="h-9 border-b border-border flex items-center justify-center bg-card z-50 relative px-2">
            {/* CENTER: Playback Controls */}
            <div className="flex items-center bg-background/30 border border-border/40 rounded p-0.5 shadow-sm">
                <ThemedIconButton
                    size="sm"
                    title="Play"
                    className="hover:text-green-400 border-none bg-transparent shadow-none hover:bg-white/5"
                    onClick={() => window.dispatchEvent(new CustomEvent('editor:play'))}
                >
                    <Play className="w-3 h-3 fill-current" />
                </ThemedIconButton>
                <ThemedIconButton
                    size="sm"
                    title="Pause"
                    className="hover:text-yellow-400 border-none bg-transparent shadow-none hover:bg-white/5"
                    onClick={() => window.dispatchEvent(new CustomEvent('editor:pause'))}
                >
                    <Pause className="w-3 h-3 fill-current" />
                </ThemedIconButton>
                <ThemedIconButton
                    size="sm"
                    title="Stop"
                    className="hover:text-red-400 border-none bg-transparent shadow-none hover:bg-white/5"
                    onClick={() => window.dispatchEvent(new CustomEvent('editor:stop'))}
                >
                    <Square className="w-3 h-3 fill-current" />
                </ThemedIconButton>
            </div>
        </header>
    )
}
