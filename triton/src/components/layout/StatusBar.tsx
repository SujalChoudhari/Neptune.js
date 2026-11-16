import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Info, LoaderCircle } from "lucide-react";

export function StatusBar() {
    const [message, setMessage] = useState("Ready");
    const [type, setType] = useState<'info' | 'warn' | 'error' | 'ready' | 'pending'>('ready');

    useEffect(() => {
        const handleLog = (event: CustomEvent) => {
            const { type, message } = event.detail;
            // Routine game console messages must not bury edit/save feedback.
            if (!['warn', 'error'].includes(type) || typeof message !== 'string') return;
            // Only show the first line or limit char length for status bar
            const shortMessage = message.split('\n')[0].substring(0, 100) + (message.length > 100 ? "..." : "");
            setMessage(shortMessage);
            setType(type);
        };

        const handleActivity = (event: Event) => {
            const { message, type } = (event as CustomEvent<{ message: string; type: 'info' | 'warn' | 'error' | 'ready' | 'pending' }>).detail;
            setMessage(message);
            setType(type);
        };
        window.addEventListener('editor:log', handleLog as EventListener);
        window.addEventListener('editor:activity', handleActivity);

        return () => {
            window.removeEventListener('editor:log', handleLog as EventListener);
            window.removeEventListener('editor:activity', handleActivity);
        };
    }, []);

    return (
        <div role="status" aria-live="polite" aria-atomic="true" aria-busy={type === 'pending'} data-editor-activity className="h-5 shrink-0 bg-card border-t border-border flex items-center px-1.5 text-[11px] select-none text-muted-foreground overflow-hidden">
            {/* Left: Status Message */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden [&>svg]:shrink-0">
                {type === 'ready' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                {type === 'info' && <Info className="w-3 h-3 text-blue-400" />}
                {type === 'warn' && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                {type === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                {type === 'pending' && <LoaderCircle className="w-3 h-3 text-blue-400 animate-spin" />}

                <span className={cn(
                    "truncate",
                    type === 'error' && "text-red-300",
                    type === 'warn' && "text-yellow-200"
                )} title={message}>
                    {message}
                </span>
            </div>

        </div>
    )
}
