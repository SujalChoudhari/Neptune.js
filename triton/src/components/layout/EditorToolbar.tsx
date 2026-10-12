import {
    ThemedIconButton,
    useModal
} from "@/components/library"
import { Play, Pause, Square, Settings, Star, FileBox } from "lucide-react"
import { SettingsModalContent } from "@/components/dialogs/SettingsDialog"
import { useGameContext } from "@/context/GameContext"
import { cn } from "@/lib/utils"

export function EditorToolbar() {
    const { showModal } = useModal();

    const {
        play,
        pause,
        stop,
        isPlaying,
        isPaused,
        currentSceneName,
        markAsMainScene,
        mainScenePath,
        currentScenePath
    } = useGameContext();

    const isMainScene = currentScenePath && mainScenePath &&
        currentScenePath.replace(/\\/g, '/') === mainScenePath.replace(/\\/g, '/');

    const handleOpenSettings = () => {
        showModal({
            title: "Editor Settings",
            content: <SettingsModalContent />,
            showCancel: false,
            confirmText: "Close"
        });
    };

    return (
        <header className="h-9 border-b border-border flex items-center justify-between bg-card z-50 relative px-2 select-none">
            {/* LEFT: Scene Info */}
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
                <div className="flex items-center text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded border border-border/50">
                    <FileBox className="w-3 h-3 mr-1.5 opacity-70" />
                    <span className="font-medium text-foreground">{currentSceneName}</span>
                </div>

                <ThemedIconButton
                    size="sm"
                    title={isMainScene ? "This is the Main Scene" : "Mark as Main Scene"}
                    onClick={isMainScene ? undefined : markAsMainScene}
                    disabled={!!isMainScene}
                    className={cn(
                        "transition-all",
                        isMainScene ? "text-yellow-400 opacity-100 bg-yellow-400/10" : "opacity-40 hover:opacity-100 hover:text-yellow-400"
                    )}
                >
                    <Star className={cn("w-3.5 h-3.5", isMainScene && "fill-current")} />
                </ThemedIconButton>
            </div>

            {/* CENTER: Playback Controls */}
            <div className="flex items-center bg-background/30 border border-border/40 rounded p-0.5 shadow-sm">
                <ThemedIconButton
                    size="sm"
                    title="Play"
                    className={cn(
                        "border-none shadow-none transition-colors",
                        isPlaying && !isPaused ? "text-green-400 bg-white/10" : "hover:text-green-400 hover:bg-white/5"
                    )}
                    onClick={play}
                    disabled={isPlaying && !isPaused}
                >
                    <Play className="w-3 h-3 fill-current" />
                </ThemedIconButton>
                <ThemedIconButton
                    size="sm"
                    title="Pause"
                    className={cn(
                        "border-none shadow-none transition-colors",
                        isPaused ? "text-yellow-400 bg-white/10" : "hover:text-yellow-400 hover:bg-white/5"
                    )}
                    onClick={pause}
                    disabled={!isPlaying}
                >
                    <Pause className="w-3 h-3 fill-current" />
                </ThemedIconButton>
                <ThemedIconButton
                    size="sm"
                    title="Stop"
                    className="hover:text-red-400 border-none bg-transparent shadow-none hover:bg-white/5"
                    onClick={stop}
                    disabled={!isPlaying}
                >
                    <Square className="w-3 h-3 fill-current" />
                </ThemedIconButton>
            </div>

            <div className="flex-1 flex justify-end">
                <ThemedIconButton
                    size="sm"
                    title="Settings"
                    onClick={handleOpenSettings}
                >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                </ThemedIconButton>
            </div>
        </header>
    )
}
