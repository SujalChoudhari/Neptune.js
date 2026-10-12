import { useSettings } from "@/components/context/SettingsContext"
import { ThemedToggle } from "@/components/library"

export function SettingsModalContent() {
    const {
        focusGameOnPlay,
        toggleSetting,
        focusConsoleOnPlay,
        maximizeGameOnPlay
    } = useSettings();

    return (
        <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-xs mb-2">
                Configure your editor experience.
            </p>

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
                    <span className="text-xs text-muted-foreground/60">Hides all other panels when playing</span>
                </div>
                <ThemedToggle
                    checked={maximizeGameOnPlay}
                    onChange={() => toggleSetting('maximizeGameOnPlay')}
                />
            </div>
        </div>
    )
}
