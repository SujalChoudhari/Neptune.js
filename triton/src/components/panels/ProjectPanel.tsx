import type { IDockviewPanelProps } from "dockview"
import { useFileSystem } from "@/context/FileSystemContext"
import { useGameContext } from "@/context/GameContext"
import { ProjectSidebar } from "../project/ProjectSidebar"
import { ProjectGrid } from "../project/ProjectGrid"
import { useState, useEffect } from "react"
import {
    ThemedSlider,
    ThemedContextMenu,
    ThemedContextMenuTrigger,
    ThemedContextMenuContent,
    ThemedContextMenuItem,
    ThemedContextMenuSeparator,
    ThemedContextMenuLabel,
    ThemedInput,
    ThemedIconButton
} from "@/components/library"
import { Search, ChevronRight, Home } from "lucide-react"

export const ProjectPanel = (_props: IDockviewPanelProps) => {
    const {
        nodes,
        currentPath,
        currentFolderId,
        getChildren,
        navigateTo,
        moveNode,
        moveNodes,
        createFolder,
        createAsset,
        deleteNode,
        renameNode,
        duplicateNode
    } = useFileSystem()

    const { notifyGame, loadScene } = useGameContext()

    const [scale, setScale] = useState(90)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

    const currentFolderItems = getChildren(currentFolderId)
        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Clear selection when navigating
    useEffect(() => {
        setSelectedIds([])
        setRenamingId(null)
        setLastSelectedId(null)
    }, [currentFolderId])

    // Smart Navigation (Double Click)
    const handleSmartNavigate = (id: string) => {
        const node = nodes[id]
        if (!node) return

        if (node.type === 'folder') {
            navigateTo(id)
        } else {
            // It's a file
            if (node.name.endsWith('.scene') || node.name.endsWith('.npt') || node.name.endsWith('.scn')) {
                // Get full path logic if needed, but if creating asset puts name, we hopefully have path or construct it.
                // context nodes might not have full path. useFileSystem might need helper or we construct from ancestry.
                // Assuming simple file opening for now using name/id.
                // NOTE: 'scan_project' usually returns paths as IDs or has path property. 
                // Let's assume ID is path or we have path property. 
                // Checking previous view_file of FileSystemContext: `loadProject` calls `scan_project`.
                // `FileNode` usually has path.
                // Let's use `node.path` if it exists, or `id` (often path in Tauri apps).
                const path = (node as any).path || id;
                console.log("Opening scene:", path);
                loadScene(path);
            }
        }
    }

    // Selection Logic
    const handleItemClick = (id: string, e: React.MouseEvent) => {
        if (e.shiftKey && lastSelectedId) {
            // Range Selection
            const items = currentFolderItems
            const startIdx = items.findIndex(item => item.id === lastSelectedId)
            const endIdx = items.findIndex(item => item.id === id)

            if (startIdx !== -1 && endIdx !== -1) {
                const min = Math.min(startIdx, endIdx)
                const max = Math.max(startIdx, endIdx)
                const rangeIds = items.slice(min, max + 1).map(item => item.id)

                if (e.ctrlKey || e.metaKey) {
                    // Add range to existing
                    setSelectedIds(prev => [...new Set([...prev, ...rangeIds])])
                } else {
                    // Replace with range
                    setSelectedIds(rangeIds)
                }
            } else {
                setSelectedIds([id])
                setLastSelectedId(id)
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Toggle
            setLastSelectedId(id)
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            )
        } else {
            // Single select
            setLastSelectedId(id)
            setSelectedIds([id])
        }
    }

    const handleBackgroundClick = (e: React.MouseEvent) => {
        // Only clear if clicking strictly on background, not bubbling from item
        // But since items handle their own click stopPropagation might be needed?
        // Or check target.
        if (e.target === e.currentTarget) {
            setSelectedIds([])
            setRenamingId(null)
        }
    }

    // Keyboard Shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Rename (F2)
        if (e.key === 'F2') {
            if (selectedIds.length === 1) {
                setRenamingId(selectedIds[0])
                e.preventDefault()
            }
        }

        // Delete
        if (e.key === 'Delete') {
            if (selectedIds.length > 0) {
                selectedIds.forEach(id => deleteNode(id))
                setSelectedIds([])
            }
        }

        // Duplicate (Ctrl+D)
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault()
            if (selectedIds.length > 0) {
                selectedIds.forEach(id => duplicateNode(id))
            }
        }

        // Select All (Ctrl+A)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault()
            const allIds = getChildren(currentFolderId).map(n => n.id)
            setSelectedIds(allIds)
        }

        // Enter to Open
        if (e.key === 'Enter') {
            if (selectedIds.length === 1) {
                handleSmartNavigate(selectedIds[0])
            }
        }
    }

    const handleRename = (id: string, newName: string) => {
        if (newName.trim()) {
            renameNode(id, newName)
        }
        setRenamingId(null)
    }

    const handleContextMenuAction = (action: 'rename' | 'duplicate' | 'delete', id: string) => {
        if (action === 'rename') {
            setRenamingId(id)
        } else if (action === 'duplicate') {
            duplicateNode(id)
        } else if (action === 'delete') {
            deleteNode(id)
        }
    }

    // Listen for custom move event from children
    useEffect(() => {
        const handleMove = (e: Event) => {
            const detail = (e as CustomEvent).detail
            if (detail) {
                if (detail.nodeIds && Array.isArray(detail.nodeIds)) {
                    moveNodes(detail.nodeIds, detail.targetId)
                } else if (detail.nodeId) {
                    moveNode(detail.nodeId, detail.targetId)
                }
            }
        }
        window.addEventListener('project-move-node', handleMove)
        return () => window.removeEventListener('project-move-node', handleMove)
    }, [moveNode, moveNodes])

    const handleCreateFolder = async () => {
        const id = await createFolder(currentFolderId, "New Folder")
        if (id) {
            setSelectedIds([id])
            setRenamingId(id)
        }
    }

    const handleCreateAsset = async (name: string, type: 'script' | 'material' | 'scene') => {
        const id = await createAsset(currentFolderId, name, type)
        if (id) {
            setSelectedIds([id])
            setRenamingId(id)
        }
    }

    const handleClearSelection = () => {
        setSelectedIds([])
        setRenamingId(null)
    }

    return (
        <div
            className="h-full flex flex-col bg-background outline-none"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
        >
            {/* TOOLBAR */}
            <div className="h-9 border-b border-border flex items-center px-2 gap-2 bg-card shrink-0">
                {/* Navigation Controls */}
                <div className="flex items-center gap-1 text-muted-foreground mr-2">
                    <ThemedIconButton
                        onClick={() => navigateTo("root")}
                        size="sm"
                        disabled={currentFolderId === "root"}
                        title="Home"
                    >
                        <Home className="w-3.5 h-3.5" />
                    </ThemedIconButton>

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-0.5 text-xs overflow-hidden px-1">
                        {currentPath.map((id, i) => (
                            <div key={id} className="flex items-center">
                                {i > 0 && <ChevronRight className="w-3 h-3 opacity-50 mx-0.5" />}
                                <button
                                    onClick={() => navigateTo(id)}
                                    // Drop target for nav?
                                    className={`hover:underline cursor-pointer ${id === currentFolderId ? 'text-foreground font-medium' : 'hover:text-foreground'}`}
                                >
                                    {nodes[id]?.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1" />

                {/* Search */}
                <div className="w-48">
                    <ThemedInput
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startIcon={<Search />}
                        containerClassName="h-7"
                    />
                </div>

                {/* Scale Slider */}
                <div className="w-20 hidden md:block">
                    <ThemedSlider
                        min={50}
                        max={150}
                        value={scale}
                        onChange={setScale}
                        showValue={false}
                    />
                </div>
            </div>

            {/* CONTENT SPLIT */}
            <ThemedContextMenu>
                <div className="flex-1 flex overflow-hidden">
                    <ThemedContextMenuTrigger className="flex-1 flex overflow-hidden">
                        {/* Sidebar (Tree) */}
                        <div className="w-48 border-r border-border bg-card/30 shrink-0 hidden sm:block">
                            <ProjectSidebar
                                nodes={nodes}
                                selectedId={currentFolderId}
                                onSelect={navigateTo}
                            />
                        </div>

                        {/* Main Grid */}
                        <div className="flex-1 bg-background" onClick={handleBackgroundClick}>
                            <ProjectGrid
                                items={currentFolderItems}
                                onNavigate={handleSmartNavigate}
                                scale={scale}
                                selectedIds={selectedIds}
                                renamingId={renamingId}
                                onSelect={handleItemClick}
                                onRename={handleRename}
                                onAction={handleContextMenuAction}
                                onClearSelection={handleClearSelection}
                                onMultiSelect={setSelectedIds}
                            />
                        </div>
                    </ThemedContextMenuTrigger>

                    <ThemedContextMenuContent>
                        <ThemedContextMenuLabel inset>Create</ThemedContextMenuLabel>
                        <ThemedContextMenuItem inset onClick={handleCreateFolder}>
                            Folder
                        </ThemedContextMenuItem>
                        <ThemedContextMenuSeparator />
                        <ThemedContextMenuItem inset onClick={() => handleCreateAsset("New Script.ts", "script")}>
                            C# Script
                        </ThemedContextMenuItem>
                        <ThemedContextMenuItem inset onClick={() => handleCreateAsset("New Material.mat", "material")}>
                            Material
                        </ThemedContextMenuItem>
                        <ThemedContextMenuItem inset onClick={() => handleCreateAsset("New Scene.scene", "scene")}>
                            Scene
                        </ThemedContextMenuItem>
                        <ThemedContextMenuSeparator />
                        <ThemedContextMenuItem inset disabled>
                            Import New Asset...
                        </ThemedContextMenuItem>
                    </ThemedContextMenuContent>
                </div>
            </ThemedContextMenu>

            {/* FOOTER STATUS */}
            <div className="h-5 border-t border-border bg-card flex items-center px-2 text-[10px] text-muted-foreground">
                <span className="truncate flex-1">
                    {currentFolderItems.length} items
                </span>
                <span>{nodes[currentFolderId]?.name}</span>
            </div>
        </div>
    )
}
