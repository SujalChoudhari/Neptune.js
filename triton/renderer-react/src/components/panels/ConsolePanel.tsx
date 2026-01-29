import { useState } from 'react'
import { Trash2, Filter, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LogEntry {
    id: number
    type: 'log' | 'warn' | 'error' | 'info'
    message: string
    timestamp: Date
    count?: number
}

// Mock console logs
const mockLogs: LogEntry[] = [
    { id: 1, type: 'info', message: 'Triton Editor initialized', timestamp: new Date() },
    { id: 2, type: 'log', message: 'Project opened: Platform Adventure Demo', timestamp: new Date() },
    { id: 3, type: 'log', message: 'Scene loaded: main.scene', timestamp: new Date() },
    { id: 4, type: 'warn', message: 'Asset "missing_sprite.png" not found, using placeholder', timestamp: new Date() },
    { id: 5, type: 'error', message: 'Failed to parse script: Unexpected token at line 42', timestamp: new Date() },
]

const LOG_ICONS = {
    log: null,
    info: <Info className="h-3 w-3 text-blue-400" />,
    warn: <AlertTriangle className="h-3 w-3 text-yellow-400" />,
    error: <AlertCircle className="h-3 w-3 text-red-400" />,
}

const LOG_COLORS = {
    log: 'text-[var(--text-primary)]',
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
}

export function ConsolePanel() {
    const [logs] = useState<LogEntry[]>(mockLogs)
    const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all')

    const filteredLogs = logs.filter((log) => {
        if (filter === 'all') return true
        return log.type === filter || (filter === 'log' && log.type === 'info')
    })

    const errorCount = logs.filter((l) => l.type === 'error').length
    const warnCount = logs.filter((l) => l.type === 'warn').length

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="h-8 px-2 flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Clear Console">
                    <Trash2 className="h-3 w-3" />
                </Button>

                <div className="flex-1" />

                {/* Filter buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        variant={filter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'error' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn('h-6 px-2 text-xs gap-1', errorCount > 0 && 'text-red-400')}
                        onClick={() => setFilter('error')}
                    >
                        <AlertCircle className="h-3 w-3" />
                        {errorCount}
                    </Button>
                    <Button
                        variant={filter === 'warn' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn('h-6 px-2 text-xs gap-1', warnCount > 0 && 'text-yellow-400')}
                        onClick={() => setFilter('warn')}
                    >
                        <AlertTriangle className="h-3 w-3" />
                        {warnCount}
                    </Button>
                </div>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-auto font-mono text-xs">
                {filteredLogs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                        No logs to display
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className={cn(
                                'flex items-start gap-2 px-3 py-1 border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-tertiary)]',
                                LOG_COLORS[log.type]
                            )}
                        >
                            <span className="w-4 flex-shrink-0 pt-0.5">{LOG_ICONS[log.type]}</span>
                            <span className="flex-1">{log.message}</span>
                            <span className="text-[var(--text-secondary)] opacity-50">
                                {log.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="h-8 px-2 flex items-center border-t border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] mr-2">&gt;</span>
                <input
                    type="text"
                    placeholder="Enter command..."
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none font-mono"
                />
            </div>
        </div>
    )
}
