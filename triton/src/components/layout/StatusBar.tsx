import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

export function StatusBar() {
    const [message, setMessage] = useState("Ready");
    const [type, setType] = useState<'info' | 'warn' | 'error' | 'ready'>('ready');

    useEffect(() => {
        const handleLog = (event: CustomEvent) => {
            const { type, message } = event.detail;
            // Only show the first line or limit char length for status bar
            const shortMessage = message.split('\n')[0].substring(0, 100) + (message.length > 100 ? "..." : "");
            setMessage(shortMessage);
            setType(type);
        };

        const handleReady = () => {
            setMessage("Ready");
            setType('ready');
        }

        // Reset to ready after 5 seconds of an info log
        let timeout: NodeJS.Timeout;
        if (type === 'info') {
            timeout = setTimeout(() => {
                setMessage("Ready");
                setType('ready');
            }, 5000);
        }

        window.addEventListener('editor:log', handleLog as EventListener);
        // Custom event if we want to force reset
        // window.addEventListener('editor:ready', handleReady); 

        return () => {
            window.removeEventListener('editor:log', handleLog as EventListener);
            clearTimeout(timeout);
        };
    }, [type]); // Re-run to handle timeout reset

    return (
        <div className="h-6 bg-[#2d2d2d] border-t border-black flex items-center px-2 text-[11px] select-none text-white/70 overflow-hidden">
            {/* Left: Status Message */}
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                {type === 'ready' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                {type === 'info' && <Info className="w-3 h-3 text-blue-400" />}
                {type === 'warn' && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                {type === 'error' && <XCircle className="w-3 h-3 text-red-500" />}

                <span className={cn(
                    "truncate font-mono",
                    type === 'error' && "text-red-300",
                    type === 'warn' && "text-yellow-200"
                )}>
                    {message}
                </span>
            </div>

            {/* Right: Version Info */}
            <div className="flex items-center gap-4 shrink-0 opacity-50">
                <span>Triton v1.0.0</span>
                <span>Neptune v0.1</span>
            </div>
        </div>
    )
}
