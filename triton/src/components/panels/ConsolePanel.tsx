import type { IDockviewPanelProps } from "dockview"
import { useState } from "react"
import {
    ThemedInput,
    ThemedIconButton,
    ThemedToggle
} from "@/components/library"
import {
    Ban,
    Search,
    Info,
    AlertTriangle,
    XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LogEntry {
    id: string
    type: 'info' | 'warn' | 'error'
    message: string
    timestamp: string
    count: number
}

// Mock Data
const INITIAL_LOGS: LogEntry[] = [
    { id: '1', type: 'info', message: 'Triton Engine initialized successfully.', timestamp: '10:45:22', count: 1 },
    { id: '2', type: 'info', message: 'Loaded scene "Level_01"', timestamp: '10:45:23', count: 1 },
    { id: '3', type: 'warn', message: 'Texture "Rock_04" is missing mipmaps. Performance may be degraded.', timestamp: '10:45:24', count: 1 },
    { id: '4', type: 'info', message: 'Baking NavMesh...', timestamp: '10:45:25', count: 1 },
    { id: '5', type: 'error', message: 'NullReferenceException: Object reference not set to an instance of an object\n  at PlayerController.Update () [0x00023] in PlayerController.cs:45', timestamp: '10:45:26', count: 5 },
    { id: '6', type: 'info', message: 'Baking NavMesh completed in 245ms.', timestamp: '10:45:27', count: 1 },
]

export const ConsolePanel = (_props: IDockviewPanelProps) => {
    const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS)
    const [searchQuery, setSearchQuery] = useState("")
    const [showInfo, setShowInfo] = useState(true)
    const [showWarn, setShowWarn] = useState(true)
    const [showError, setShowError] = useState(true)
    const [clearOnPlay, setClearOnPlay] = useState(false)
    const [collapse, setCollapse] = useState(false)

    const filteredLogs = logs.filter(log => {
        if (!log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
        if (log.type === 'info' && !showInfo) return false
        if (log.type === 'warn' && !showWarn) return false
        if (log.type === 'error' && !showError) return false
        return true
    })

    const handleClear = () => setLogs([])

    return (
        <div className="h-full flex flex-col bg-background font-sans text-xs">
            {/* TOOLBAR */}
            <div className="h-9 border-b border-border flex items-center px-2 gap-2 bg-card shrink-0">
                <div className="flex items-center gap-1">
                    <ThemedIconButton
                        size="sm"
                        onClick={handleClear}
                        title="Clear Console"
                    >
                        <Ban className="w-3.5 h-3.5" />
                    </ThemedIconButton>
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                <div className="flex items-center gap-2">
                    <ThemedToggle
                        checked={clearOnPlay}
                        onChange={setClearOnPlay}
                        label="Clear on Play"
                    />
                    <ThemedToggle
                        checked={collapse}
                        onChange={setCollapse}
                        label="Collapse"
                    />
                </div>

                <div className="flex-1" />

                {/* Search */}
                <div className="w-48">
                    <ThemedInput
                        placeholder="Filter..."
                        startIcon={<Search />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        containerClassName="h-7"
                    />
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                {/* Type Filters */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                            // 3D Themed Button Base
                            "border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,28%)]",
                            "shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]",
                            showInfo
                                ? "bg-gradient-to-b from-[hsl(0,0%,30%)] to-[hsl(0,0%,24%)] text-foreground"
                                : "bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,18%)] text-muted-foreground hover:from-[hsl(0,0%,26%)] hover:to-[hsl(0,0%,22%)]"
                        )}
                    >
                        <Info className="w-3 h-3 text-blue-400" />
                        <span>{logs.filter(l => l.type === 'info').length}</span>
                    </button>
                    <button
                        onClick={() => setShowWarn(!showWarn)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                            "border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,28%)]",
                            "shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]",
                            showWarn
                                ? "bg-gradient-to-b from-[hsl(0,0%,30%)] to-[hsl(0,0%,24%)] text-foreground"
                                : "bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,18%)] text-muted-foreground hover:from-[hsl(0,0%,26%)] hover:to-[hsl(0,0%,22%)]"
                        )}
                    >
                        <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        <span>{logs.filter(l => l.type === 'warn').length}</span>
                    </button>
                    <button
                        onClick={() => setShowError(!showError)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                            "border border-[hsl(0,0%,14%)] border-t-[hsl(0,0%,28%)]",
                            "shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]",
                            showError
                                ? "bg-gradient-to-b from-[hsl(0,0%,30%)] to-[hsl(0,0%,24%)] text-foreground"
                                : "bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,18%)] text-muted-foreground hover:from-[hsl(0,0%,26%)] hover:to-[hsl(0,0%,22%)]"
                        )}
                    >
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span>{logs.filter(l => l.type === 'error').length}</span>
                    </button>
                </div>
            </div>

            {/* LOG LIST */}
            <div className="flex-1 bg-[#1a1a1a] overflow-auto">
                <div className="flex flex-col min-w-max min-h-full">
                    {filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className={cn(
                                "flex items-start gap-2 px-2 py-1.5 border-b border-white/5 font-mono text-[11px] hover:bg-white/5",
                                log.type === 'error' && "bg-red-500/5 hover:bg-red-500/10",
                                log.type === 'warn' && "bg-yellow-500/5 hover:bg-yellow-500/10",
                            )}
                        >
                            {/* Icon */}
                            <div className="mt-0.5 shrink-0">
                                {log.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-400" />}
                                {log.type === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                                {log.type === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                            </div>

                            {/* Timestamp */}
                            <div className="text-muted-foreground shrink-0 select-none">[{log.timestamp}]</div>

                            {/* Message */}
                            <div className={cn(
                                "flex-1 whitespace-pre-wrap break-all",
                                log.type === 'error' ? "text-red-200" : "text-foreground/90"
                            )}>
                                {log.message}
                            </div>

                            {/* Collapse Count */}
                            {collapse && log.count > 1 && (
                                <div className="shrink-0 bg-white/10 px-1.5 rounded-full text-[10px] min-w-[20px] text-center">
                                    {log.count}
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredLogs.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground italic">
                            No logs to display
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
