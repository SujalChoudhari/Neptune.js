import { useState, useEffect } from "react"
import { themedButtonBase, ThemedScrollArea } from "@/components/library";
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import { FolderOpen, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentProject {
    name: string;
    path: string;
    lastOpened: number;
}

interface WelcomeScreenProps {
    onProjectLoaded: (path: string) => void;
}
export function WelcomeScreen({ onProjectLoaded }: WelcomeScreenProps) {
    const [recents, setRecents] = useState<RecentProject[]>([]);

    useEffect(() => {
        // Load recents from localStorage
        const stored = localStorage.getItem("triton_recent_projects");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Sort by last opened desc
                setRecents(parsed.sort((a: RecentProject, b: RecentProject) => b.lastOpened - a.lastOpened));
            } catch (e) {
                console.error("Failed to parse recents", e);
            }
        }
    }, []);

    const addToRecents = (path: string) => {
        let name = path.split(/[\\/]/).pop() || "Untitled Project";
        const newRecents = [
            { name, path, lastOpened: Date.now() },
            ...recents.filter(p => p.path !== path)
        ].slice(0, 10); // Keep last 10

        setRecents(newRecents);
        localStorage.setItem("triton_recent_projects", JSON.stringify(newRecents));
    };

    const removeFromRecents = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const newRecents = recents.filter(p => p.path !== path);
        setRecents(newRecents);
        localStorage.setItem("triton_recent_projects", JSON.stringify(newRecents));
    };

    const handleNewProject = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Parent Folder for New Project"
            });

            if (selected) {
                // treat the selected folder as the new project location
                await invoke("initialize_project", { path: selected });
                addToRecents(selected as string);
                onProjectLoaded(selected as string);
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
                await invoke("initialize_project", { path: selected });
                addToRecents(selected as string);
                onProjectLoaded(selected as string);
            }
        } catch (e) {
            console.error("Failed to open project", e);
        }
    }

    const handleRecentClick = (path: string) => {
        addToRecents(path);
        onProjectLoaded(path);
    };

    return (
        <div className="h-screen w-full flex bg-background text-foreground select-none overflow-hidden font-sans">
            {/* LEFT SIDEBAR - RECENT PROJECTS */}
            <div className="w-80 flex flex-col border-r border-border bg-card/30">

                <ThemedScrollArea className="flex-1 px-4 pb-4">
                    <div className="space-y-1">
                        {recents.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic px-2 py-4 text-center opacity-50">
                                No recent projects
                            </div>
                        ) : (
                            recents.map((project) => (
                                <div
                                    key={project.path}
                                    onClick={() => handleRecentClick(project.path)}
                                    className={cn(
                                        "group flex flex-col p-2.5 rounded-md cursor-pointer transition-all duration-200",
                                        "hover:bg-accent/50 hover:shadow-sm border border-transparent hover:border-border/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm text-foreground/90 group-hover:text-primary transition-colors">
                                            {project.name}
                                        </span>
                                        <button
                                            onClick={(e) => removeFromRecents(e, project.path)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground truncate font-mono opacity-70">
                                        {project.path}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </ThemedScrollArea>
            </div>

            {/* MAIN CONTENT - ACTIONS */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-background/50 relative">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px]" />
                    <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
                </div>

                <div className="w-full max-w-2xl z-10">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 mb-2">
                            Welcome to Triton
                        </h1>
                        <p className="text-muted-foreground">
                            Create a new project or continue where you left off.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* New Project Card */}
                        <button
                            onClick={handleNewProject}
                            className={cn(
                                themedButtonBase,
                                "flex flex-col items-start p-6 h-48 rounded-xl gap-4 hover:scale-[1.02] transition-all group"
                            )}
                        >
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
                                <Plus className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">New Project</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Initialize a new game project in a directory of your choice.
                                </p>
                            </div>
                        </button>

                        {/* Open Project Card */}
                        <button
                            onClick={handleOpenProject}
                            className={cn(
                                themedButtonBase,
                                "flex flex-col items-start p-6 h-48 rounded-xl gap-4 hover:scale-[1.02] transition-all group"
                            )}
                        >
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                <FolderOpen className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-400 transition-colors">Open Project</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Locate and open an existing Triton project folder.
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
