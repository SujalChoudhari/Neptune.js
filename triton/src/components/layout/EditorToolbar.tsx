import {
    ThemedIconButton,
} from "@/components/library"
import { Play, Pause, Square, Settings } from "lucide-react"
import { useState } from "react"
import { SettingsDialog } from "@/components/dialogs/SettingsDialog"

export function EditorToolbar() {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <header className="h-9 border-b border-border flex items-center justify-between bg-card z-50 relative px-2">
            <div className="flex-1" />

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

            <div className="flex-1 flex justify-end">
                <ThemedIconButton
                    size="sm"
                    title="Settings"
                    onClick={() => setSettingsOpen(true)}
                >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                </ThemedIconButton>
            </div>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </header>
    )
}
