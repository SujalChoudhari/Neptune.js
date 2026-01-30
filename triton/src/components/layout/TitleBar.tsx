import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ThemedMenuButton,
    ThemedIconButton,
} from "@/components/library"
import { Play, Pause, Square } from "lucide-react"
import { WindowControls } from "@/components/library/WindowControls"
import type { NeptuneDockApi } from "@/components/layout/DockLayout"

interface TitleBarProps {
    onOpenPanel: (panelId: string, title: string, component: string) => void
    dockApi: NeptuneDockApi | null
}

export function TitleBar({ onOpenPanel, dockApi }: TitleBarProps) {
    return (
        <header className="h-9 border-b border-border flex items-center pl-4 justify-between bg-card z-50 relative titlebar-drag">
            {/* LEFT: Logo + Menu */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-foreground rounded-sm flex items-center justify-center">
                        <span className="text-[10px] font-black text-background">N</span>
                    </div>
                    <span className="text-xs font-bold tracking-tight text-foreground/90 uppercase">Neptune</span>
                </div>

                <nav className="flex items-center gap-1 ml-4 no-drag">
                    <ThemedMenuButton variant="topbar">File</ThemedMenuButton>
                    <ThemedMenuButton variant="topbar">Edit</ThemedMenuButton>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <ThemedMenuButton variant="topbar" hasDropdown>Window</ThemedMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[180px] bg-popover border-border">
                            <DropdownMenuItem className="text-xs" onClick={() => onOpenPanel("hierarchy", "Hierarchy", "hierarchy")}>Hierarchy</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => onOpenPanel("inspector", "Inspector", "inspector")}>Inspector</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => onOpenPanel("viewport", "Scene View", "viewport")}>Scene View</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => onOpenPanel("console", "Console", "console")}>Console</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => onOpenPanel("project", "Project", "project")}>Project</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => onOpenPanel("atlas", "Atlas (Components)", "atlas")}>Atlas (Components)</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <ThemedMenuButton variant="topbar">Help</ThemedMenuButton>
                </nav>
            </div>

            {/* CENTER: Playback Controls */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-background/30 border border-border/40 rounded p-0.5 shadow-sm no-drag">
                <ThemedIconButton size="sm" title="Play" className="hover:text-green-400 border-none bg-transparent shadow-none hover:bg-white/5">
                    <Play className="w-3 h-3 fill-current" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" title="Pause" className="hover:text-yellow-400 border-none bg-transparent shadow-none hover:bg-white/5">
                    <Pause className="w-3 h-3 fill-current" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" title="Stop" className="hover:text-red-400 border-none bg-transparent shadow-none hover:bg-white/5">
                    <Square className="w-3 h-3 fill-current" />
                </ThemedIconButton>
            </div>

            {/* RIGHT: System Controls */}
            <div className="flex items-center gap-0 h-full no-drag">
                <div className="flex items-center gap-2 mr-3">
                    <ThemedMenuButton variant="topbar">BUILD</ThemedMenuButton>
                    <div className="w-px h-4 bg-border/40" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <ThemedMenuButton variant="topbar" hasDropdown>Layout</ThemedMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px] bg-popover border-border">
                            <DropdownMenuItem className="text-xs" onClick={() => dockApi?.applyLayout('default')}>Default Layout</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => dockApi?.applyLayout('animation')}>Animation Workspace</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs" onClick={() => dockApi?.applyLayout('debug')}>Debug Workspace</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-muted-foreground border-t border-border mt-1 pt-1 italic">Save current...</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Windows native icons */}
                <WindowControls
                    onMinimize={() => console.log("Minimize")}
                    onMaximize={() => console.log("Maximize")}
                    onClose={() => console.log("Close")}
                />
            </div>

        </header>
    )
}
