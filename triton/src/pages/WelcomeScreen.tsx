import { useState, useEffect } from "react"
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import { Search, Plus, FileCode, Play, Edit, Scan, HardDrive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/utils/dateUtils";
import { ThemedScrollArea, ThemedInput, themedButtonBase } from "@/components/library";

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
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("triton_recent_projects");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
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
        ].slice(0, 50);

        setRecents(newRecents);
        localStorage.setItem("triton_recent_projects", JSON.stringify(newRecents));
    };

    const removeFromRecents = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const newRecents = recents.filter(p => p.path !== path);
        setRecents(newRecents);
        if (selectedPath === path) setSelectedPath(null);
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

    const filteredRecents = recents.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLaunch = () => {
        if (selectedPath) {
            addToRecents(selectedPath);
            onProjectLoaded(selectedPath);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground select-none font-sans text-sm">

            {/* TOP BAR */}
            <div className="h-10 flex items-center justify-between px-2 bg-muted/30 border-b border-border">
                <div className="flex gap-1 h-full pt-1.5 px-2">
                    <div className="px-4 h-full bg-background border-t border-x border-border text-foreground text-xs font-bold rounded-t-sm flex items-center">
                        Projects
                    </div>
                    <div className="px-4 h-full text-muted-foreground text-xs font-medium flex items-center hover:text-foreground cursor-pointer transition-colors">
                        Asset Library
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground mr-1">Sort: Name</span>
                    <div className="w-64">
                        <ThemedInput
                            startIcon={<Search className="w-3.5 h-3.5" />}
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background"
                        />
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden">

                {/* PROJECT LIST */}
                <div className="flex-1 flex flex-col bg-card/50 p-2 overflow-hidden border-r border-border">
                    <ThemedScrollArea className="flex-1 pr-2">
                        <div className="space-y-[1px]">
                            {filteredRecents.map((project) => (
                                <div
                                    key={project.path}
                                    onClick={() => setSelectedPath(project.path)}
                                    onDoubleClick={() => {
                                        addToRecents(project.path);
                                        onProjectLoaded(project.path);
                                    }}
                                    className={cn(
                                        "group flex items-center p-2 cursor-pointer border border-transparent rounded-sm select-none transition-all duration-100",
                                        selectedPath === project.path
                                            ? "bg-accent text-accent-foreground border-accent-foreground/10"
                                            : "hover:bg-accent/50 hover:border-border/50 text-foreground/80"
                                    )}
                                >
                                    {/* Favicon / Icon */}
                                    <div className="w-9 h-9 bg-background rounded-sm flex items-center justify-center mr-3 border border-border shadow-sm">
                                        <div className="w-7 h-7 bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center shadow-inner rounded-sm">
                                            <FileCode className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "font-bold text-sm truncate",
                                                selectedPath === project.path ? "text-accent-foreground" : "text-foreground"
                                            )}>
                                                {project.name}
                                            </span>
                                            <span className="text-[10px] opacity-60 font-mono">
                                                Neptune 0.1.0
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className={cn(
                                                "text-xs truncate font-mono opacity-60 mr-4",
                                                selectedPath === project.path ? "opacity-80" : "opacity-50"
                                            )}>
                                                {project.path}
                                            </span>
                                            <span className="text-[10px] opacity-50 whitespace-nowrap">
                                                {timeAgo(project.lastOpened)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredRecents.length === 0 && (
                                <div className="text-center py-20 opacity-30 text-xs text-muted-foreground">
                                    No projects found.
                                </div>
                            )}
                        </div>
                    </ThemedScrollArea>
                </div>

                {/* SIDEBAR ACTIONS */}
                <div className="w-48 bg-muted/10 p-2 flex flex-col gap-1.5 border-l border-border shadow-inner">
                    <SidebarButton
                        icon={<Edit className="w-3.5 h-3.5" />}
                        label="Edit"
                        disabled={!selectedPath}
                        onClick={handleLaunch}
                    />
                    <SidebarButton
                        icon={<Play className="w-3.5 h-3.5" />}
                        label="Run"
                        disabled={!selectedPath}
                    />

                    <div className="h-2" /> {/* Spacer */}

                    <SidebarButton
                        icon={<Scan className="w-3.5 h-3.5" />}
                        label="Scan"
                        onClick={handleOpenProject}
                    />

                    <div className="h-px bg-border/50 my-1" /> {/* Separator */}

                    <SidebarButton
                        icon={<Plus className="w-3.5 h-3.5 text-primary" />}
                        label="New Project"
                        highlight
                        onClick={handleNewProject}
                    />
                    <SidebarButton
                        icon={<HardDrive className="w-3.5 h-3.5" />}
                        label="Import"
                        onClick={handleOpenProject}
                    />
                    <SidebarButton
                        icon={<Edit className="w-3.5 h-3.5" />}
                        label="Rename"
                        disabled={!selectedPath}
                    />
                    <SidebarButton
                        icon={<Trash2 className="w-3.5 h-3.5 text-destructive" />}
                        label="Remove"
                        disabled={!selectedPath}
                        onClick={(e) => selectedPath && removeFromRecents(e as any, selectedPath)}
                    />
                </div>
            </div>

            {/* STATUS BAR */}
            <div className="h-6 bg-muted/50 border-t border-border flex items-center px-2 justify-between text-[10px] text-muted-foreground font-mono">
                <span>Neptune Engine v0.1.0-stable (win64)</span>
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                    Ready
                </span>
            </div>
        </div>
    )
}

// Helper Component for Sidebar Buttons
function SidebarButton({
    icon,
    label,
    onClick,
    disabled,
    highlight
}: {
    icon: React.ReactNode,
    label: string,
    onClick?: React.MouseEventHandler,
    disabled?: boolean,
    highlight?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                themedButtonBase,
                "h-8 w-full flex items-center px-3 gap-2 rounded-sm text-xs font-medium transition-all justify-start",
                highlight && "ring-1 ring-primary/30",
                disabled && "opacity-50 cursor-not-allowed contrast-50"
            )}
        >
            <span className="opacity-80">{icon}</span>
            <span>{label}</span>
        </button>
    )
}
