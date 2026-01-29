import {
    MousePointer2,
    Move,
    RotateCcw,
    Maximize2,
    Paintbrush,
    Play,
    Pause,
    Square,
    Undo2,
    Redo2,
    Save,
    FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export function Toolbar() {
    const projectName = useStore((state) => state.project.projectName)
    const activeTool = useStore((state) => state.editor.activeTool)
    const setActiveTool = useStore((state) => state.setActiveTool)
    const previewMode = useStore((state) => state.preview.mode)
    const setPreviewMode = useStore((state) => state.setPreviewMode)
    const canUndo = useStore((state) => state.canUndo)
    const canRedo = useStore((state) => state.canRedo)
    const undo = useStore((state) => state.undo)
    const redo = useStore((state) => state.redo)

    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select (V)' },
        { id: 'move', icon: Move, label: 'Move (G)' },
        { id: 'rotate', icon: RotateCcw, label: 'Rotate (R)' },
        { id: 'scale', icon: Maximize2, label: 'Scale (S)' },
        { id: 'brush', icon: Paintbrush, label: 'Brush (B)' },
    ]

    return (
        <div className="h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-2 gap-1">
            {/* Project Name */}
            <div className="flex items-center gap-2 px-3 border-r border-[var(--border-color)] mr-2">
                <span className="text-sm font-medium text-[var(--accent-primary)]">Triton</span>
                <span className="text-sm text-[var(--text-secondary)]">{projectName || 'Untitled'}</span>
            </div>

            {/* File Actions */}
            <div className="flex items-center gap-1 border-r border-[var(--border-color)] pr-2 mr-2">
                <Button variant="ghost" size="icon" title="Open Project">
                    <FolderOpen className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Save (Ctrl+S)">
                    <Save className="h-4 w-4" />
                </Button>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r border-[var(--border-color)] pr-2 mr-2">
                <Button
                    variant="ghost"
                    size="icon"
                    title="Undo (Ctrl+Z)"
                    disabled={!canUndo}
                    onClick={undo}
                >
                    <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Redo (Ctrl+Y)"
                    disabled={!canRedo}
                    onClick={redo}
                >
                    <Redo2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-1 border-r border-[var(--border-color)] pr-2 mr-2">
                {tools.map((tool) => (
                    <Button
                        key={tool.id}
                        variant={activeTool === tool.id ? 'secondary' : 'ghost'}
                        size="icon"
                        title={tool.label}
                        onClick={() => setActiveTool(tool.id)}
                        className={cn(
                            activeTool === tool.id && 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]'
                        )}
                    >
                        <tool.icon className="h-4 w-4" />
                    </Button>
                ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Preview Controls */}
            <div className="flex items-center gap-1">
                <Button
                    variant={previewMode === 'playing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode(previewMode === 'playing' ? 'stopped' : 'playing')}
                >
                    {previewMode === 'playing' ? (
                        <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4 mr-1" />
                            Play
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode('stopped')}
                    disabled={previewMode === 'stopped'}
                >
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                </Button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 ml-4 text-xs text-[var(--text-secondary)]">
                <span className={cn(
                    "px-2 py-0.5 rounded",
                    previewMode === 'playing' && "bg-green-500/20 text-green-400",
                    previewMode === 'paused' && "bg-yellow-500/20 text-yellow-400",
                    previewMode === 'stopped' && "bg-[var(--bg-tertiary)]"
                )}>
                    {previewMode === 'playing' ? 'Playing' : previewMode === 'paused' ? 'Paused' : 'Ready'}
                </span>
            </div>
        </div>
    )
}
