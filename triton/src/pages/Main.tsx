import { DockLayout } from "@/components/layout/DockLayout"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Play, Pause, Square, Cuboid, ChevronDown } from "lucide-react"
import { useEffect, useRef } from "react"
import type { DockviewApi } from "dockview"

// Mac OS 3D-style menu button
const MenuButton = ({ children, hasDropdown = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { hasDropdown?: boolean }) => (
    <button
        className="px-3 py-1 text-xs font-medium text-foreground/80 hover:text-foreground rounded-md transition-all duration-150 flex items-center gap-1
               bg-gradient-to-b from-[hsl(0,0%,28%)] to-[hsl(0,0%,22%)]
               border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,32%)]
               shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
               hover:from-[hsl(0,0%,32%)] hover:to-[hsl(0,0%,26%)]
               active:from-[hsl(0,0%,20%)] active:to-[hsl(0,0%,18%)] active:shadow-inner"
        {...props}
    >
        {children}
        {hasDropdown && <ChevronDown className="w-3 h-3 opacity-60" />}
    </button>
)

// Mac OS 3D-style icon button (same style as MenuButton, for toolbar icons)
const ToolbarIconButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150
               bg-gradient-to-b from-[hsl(0,0%,28%)] to-[hsl(0,0%,22%)]
               border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,32%)]
               shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
               hover:from-[hsl(0,0%,32%)] hover:to-[hsl(0,0%,26%)]
               active:from-[hsl(0,0%,20%)] active:to-[hsl(0,0%,18%)] active:shadow-inner
               text-foreground/70 hover:text-foreground"
        {...props}
    >
        {children}
    </button>
)

export function Main() {
    const dockApiRef = useRef<DockviewApi | null>(null)

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.add("dark")
    }, [])

    // Add a panel via Dockview API
    const openPanel = (panelId: string, title: string, component: string) => {
        const api = dockApiRef.current
        if (!api) {
            console.warn("Dockview API not ready")
            return
        }

        // Check if panel already exists
        const existing = api.getPanel(panelId)
        if (existing) {
            // Focus on existing panel
            existing.api.setActive()
            return
        }

        // Add the panel
        api.addPanel({
            id: panelId,
            component: component,
            title: title,
        })
    }

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden select-none">
            {/* TOP BAR */}
            <header className="h-10 border-b border-border flex items-center px-2 justify-between bg-card z-50 relative">
                {/* LEFT: Logo + Menu */}
                <div className="flex items-center gap-1">
                    <div className="font-bold text-foreground flex items-center gap-1.5 px-2">
                        <Cuboid className="w-4 h-4" />
                        <span className="text-sm">Triton</span>
                    </div>
                    <div className="w-px h-5 bg-border mx-1" />
                    <nav className="flex items-center gap-0.5">
                        <MenuButton>File</MenuButton>
                        <MenuButton>Edit</MenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <MenuButton hasDropdown>Window</MenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[160px]">
                                <DropdownMenuItem onClick={() => openPanel("hierarchy", "Hierarchy", "hierarchy")}>Hierarchy</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPanel("inspector", "Inspector", "inspector")}>Inspector</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPanel("viewport", "Scene View", "viewport")}>Scene View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPanel("console", "Console", "console")}>Console</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPanel("project", "Project", "console")}>Project</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPanel("atlas", "Atlas (Components)", "atlas")}>Atlas (Components)</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <MenuButton>Help</MenuButton>
                    </nav>
                </div>

                {/* CENTER: Play/Pause/Stop */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                    <ToolbarIconButton title="Play"><Play className="w-3 h-3 fill-current" /></ToolbarIconButton>
                    <ToolbarIconButton title="Pause"><Pause className="w-3 h-3 fill-current" /></ToolbarIconButton>
                    <ToolbarIconButton title="Stop"><Square className="w-3 h-3 fill-current" /></ToolbarIconButton>
                </div>

                {/* RIGHT: (empty for now) */}
                <div />
            </header>

            {/* DOCKING AREA */}
            <div className="flex-1 w-full bg-background relative overflow-hidden">
                <DockLayout onApiReady={(api) => { dockApiRef.current = api }} />
            </div>

            {/* FOOTER */}
            <footer className="h-5 border-t border-border bg-card flex items-center px-2 text-[10px] justify-between text-muted-foreground z-50">
                <span>Ready</span>
                <span>Triton v0.0.1</span>
            </footer>
        </div>
    )
}
