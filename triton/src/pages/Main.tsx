import { DockLayout } from "@/components/layout/DockLayout"
import { useState, useEffect, useRef } from "react"
import type { NeptuneDockApi } from "@/components/layout/DockLayout"
import { EditorToolbar } from "@/components/layout/EditorToolbar"

import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from "@tauri-apps/api/core";
import { WelcomeScreen } from "@/pages/WelcomeScreen";
import { useFileSystem } from "@/context/FileSystemContext";

export function Main() {
    const dockApiRef = useRef<NeptuneDockApi | null>(null)
    const [isProjectLoaded, setIsProjectLoaded] = useState(false);
    const { loadProject } = useFileSystem();

    const handleProjectLoaded = async (path: string) => {
        setIsProjectLoaded(true);
        try {
            await loadProject(path); // Load file system

            const projectPath = path.replaceAll('\\', '/');
            // Extract folder name or use a default
            const projectName = projectPath.split('/').pop() || "Project";
            const newTitle = `Neptune - ${projectName} - ${path}`;
            await getCurrentWindow().setTitle(newTitle);
        } catch (e) {
            console.error("Failed to set window title", e);
            // Fallback just in case
            document.title = `Neptune - ${path}`;
        }
    };

    useEffect(() => {
        // Check for startup config (debug mode autoload)
        invoke<string | null>("get_startup_config").then((path: string | null) => {
            if (path) {
                console.log("Autoloading Debug Project:", path);
                // Initialize just in case
                invoke("initialize_project", { path }).then(() => {
                    handleProjectLoaded(path);
                });
            }
        }).catch((err: unknown) => {
            console.error("Failed to check startup config", err);
        });
    }, []);

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
        return <WelcomeScreen onProjectLoaded={handleProjectLoaded} />;
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
