import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useSettings } from "@/components/context/SettingsContext"
import { ThemedToggle } from "@/components/library"

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const {
        focusGameOnPlay,
        toggleSetting,
        focusConsoleOnPlay,
        maximizeGameOnPlay
    } = useSettings();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#2d2d2d] border-black text-white">
                <DialogHeader>
                    <DialogTitle>Editor Settings</DialogTitle>
                    <DialogDescription className="text-white/50">
                        Configure your editor experience.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm">Focus Game View on Play</label>
                        <ThemedToggle
                            checked={focusGameOnPlay}
                            onChange={() => toggleSetting('focusGameOnPlay')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm">Focus Console on Play</label>
                        <ThemedToggle
                            checked={focusConsoleOnPlay}
                            onChange={() => toggleSetting('focusConsoleOnPlay')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <label className="text-sm">Maximize Game on Play</label>
                            <span className="text-xs text-white/40">Hides all other panels when playing</span>
                        </div>
                        <ThemedToggle
                            checked={maximizeGameOnPlay}
                            onChange={() => toggleSetting('maximizeGameOnPlay')}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
