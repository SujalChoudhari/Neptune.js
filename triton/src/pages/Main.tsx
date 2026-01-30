import { DockLayout } from "@/components/layout/DockLayout"
import {
    ThemedContextMenu,
    ThemedContextMenuTrigger,
    ThemedContextMenuContent,
    ThemedContextMenuItem,
    ThemedContextMenuSeparator
} from "@/components/library"
import { useEffect, useRef } from "react"
import type { NeptuneDockApi } from "@/components/layout/DockLayout"
import { TitleBar } from "@/components/layout/TitleBar"

export function Main() {
    const dockApiRef = useRef<NeptuneDockApi | null>(null)

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.add("dark")

        const handleKeyDown = (e: KeyboardEvent) => {
            // Shift + Space: Maximize/Restore panel
            if (e.shiftKey && e.code === "Space") {
                const api = dockApiRef.current
                if (!api) return

                const activeGroup = api.activeGroup
                if (activeGroup) {
                    api.maximizeGroup(activeGroup as any)
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
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
        <ThemedContextMenu>
            <ThemedContextMenuTrigger className="h-screen flex flex-col bg-background text-foreground overflow-hidden select-none">
                {/* TOP BAR */}
                <TitleBar
                    onOpenPanel={openPanel}
                    dockApi={dockApiRef.current}
                />


                {/* DOCKING AREA */}
                <div className="flex-1 w-full bg-background relative overflow-hidden">
                    <DockLayout onApiReady={(api) => { dockApiRef.current = api as NeptuneDockApi }} />
                </div>

                {/* FOOTER */}
                <footer className="h-5 border-t border-border bg-card flex items-center px-2 text-[10px] justify-between text-muted-foreground z-50">
                    <span>Ready</span>
                    <span>Triton v0.0.1</span>
                </footer>
            </ThemedContextMenuTrigger>

            <ThemedContextMenuContent>
                <ThemedContextMenuItem onClick={() => window.location.reload()}>Reload Window</ThemedContextMenuItem>
                <ThemedContextMenuSeparator />
                <ThemedContextMenuItem disabled>About Triton...</ThemedContextMenuItem>
            </ThemedContextMenuContent>
        </ThemedContextMenu>
    )
}
