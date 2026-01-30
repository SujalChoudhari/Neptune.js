import { DockLayout } from "@/components/layout/DockLayout"
import { useState, useEffect, useRef } from "react"
import type { NeptuneDockApi } from "@/components/layout/DockLayout"
import { EditorToolbar } from "@/components/layout/EditorToolbar"

import { listen } from '@tauri-apps/api/event';
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';

function WelcomeScreen({ onProjectLoaded }: { onProjectLoaded: () => void }) {
    const handleNewProject = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Folder for New Project"
            });

            if (selected) {
                await invoke("initialize_project", { path: selected });
                onProjectLoaded();
            }
        } catch (e) {
            console.error("Failed to create project", e);
        }
    };

    const handleOpenProject = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Open Existing Project Folder"
            });

            if (selected) {
                // Here we might want to validate if it's a valid project
                // For now, just load it
                onProjectLoaded();
            }
        } catch (e) {
            console.error("Failed to open project", e);
        }
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-8 select-none">
            <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    <span className="text-4xl font-black text-primary-foreground">N</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Triton Editor</h1>
                <p className="text-muted-foreground">Version 0.0.1 (Alpha)</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <button
                    onClick={handleNewProject}
                    className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl hover:bg-accent/50 hover:border-primary/50 transition-all group cursor-pointer"
                >
                    <span className="text-xl font-semibold mb-2 group-hover:text-primary">New Project</span>
                    <span className="text-xs text-muted-foreground text-center">Create a new empty project in a folder</span>
                </button>

                <button
                    onClick={handleOpenProject}
                    className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl hover:bg-accent/50 hover:border-primary/50 transition-all group cursor-pointer"
                >
                    <span className="text-xl font-semibold mb-2 group-hover:text-primary">Open Project</span>
                    <span className="text-xs text-muted-foreground text-center">Open an existing Triton project</span>
                </button>
            </div>

            <div className="w-full max-w-md mt-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider text-xs">Recent Projects</h2>
                <div className="space-y-1">
                    {/* Mock Recents */}
                    <div className="p-3 bg-card/50 hover:bg-accent rounded border border-transparent hover:border-border cursor-pointer flex justify-between items-center text-sm">
                        <span>My RPG Game</span>
                        <span className="text-xs text-muted-foreground">D:/Games/MyRPG</span>
                    </div>
                    <div className="p-3 bg-card/50 hover:bg-accent rounded border border-transparent hover:border-border cursor-pointer flex justify-between items-center text-sm">
                        <span>Space Shooter</span>
                        <span className="text-xs text-muted-foreground">D:/Dev/SpaceShooter</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Main() {
    const dockApiRef = useRef<NeptuneDockApi | null>(null)
    const [isProjectLoaded, setIsProjectLoaded] = useState(true);

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.add("dark")

        // Listen for native menu events
        const unlistenPromise = listen<string>('menu_event', (event) => {
            const id = event.payload;
            const api = dockApiRef.current;

            console.log("Menu Event:", id);

            switch (id) {
                // File
                case 'new_project':
                    console.log("New Project triggered");
                    // If we were storing specific logic to reset state, we'd do it here
                    setIsProjectLoaded(false);
                    break;
                case 'open_project':
                    console.log("Open Project triggered");
                    setIsProjectLoaded(false);
                    break;
                case 'save':
                    console.log("Save triggered");
                    break;

                // Panels
                case 'panel_hierarchy':
                    openPanel('hierarchy', 'Hierarchy', 'hierarchy');
                    break;
                case 'panel_inspector':
                    openPanel('inspector', 'Inspector', 'inspector');
                    break;
                case 'panel_viewport':
                    openPanel('viewport', 'Scene View', 'viewport');
                    break;
                case 'panel_console':
                    openPanel('console', 'Console', 'console');
                    break;
                case 'panel_project':
                    openPanel('project', 'Project', 'project');
                    break;
                case 'panel_atlas':
                    openPanel('atlas', 'Atlas (Components)', 'atlas');
                    break;

                // Layouts
                case 'layout_default':
                    if (api) api.applyLayout('default');
                    break;
                case 'layout_animation':
                    if (api) api.applyLayout('animation');
                    break;
                case 'layout_debug':
                    if (api) api.applyLayout('debug');
                    break;

                // Build
                case 'build_game':
                    console.log("Build Game triggered");
                    break;
            }
        });

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
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            unlistenPromise.then(unlisten => unlisten());
        }
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

    if (!isProjectLoaded) {
        return <WelcomeScreen onProjectLoaded={() => setIsProjectLoaded(true)} />;
    }

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            {/* TOP BAR */}
            <EditorToolbar />


            {/* DOCKING AREA */}
            <div className="flex-1 w-full bg-background relative overflow-hidden">
                <DockLayout onApiReady={(api) => { dockApiRef.current = api as NeptuneDockApi }} />
            </div>

            {/* FOOTER */}
            <footer className="h-5 border-t border-border bg-card flex items-center px-2 text-[10px] justify-between text-muted-foreground z-50">
                <span>Ready</span>
                <span>Triton v0.0.1</span>
            </footer>
        </div>
    )
}
