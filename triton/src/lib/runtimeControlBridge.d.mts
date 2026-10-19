export declare const runtimeControlBridgeScript: string;
export declare function readRuntimeState(payload: unknown): { isPlaying: boolean; isPaused: boolean } | null;
export declare function runRuntimeControl(
    game: { start?: () => void; pause?: () => void; resume?: () => void; stop?: () => void; isRunning?: boolean; isPaused?: boolean } | null | undefined,
    type: string,
    payload: { paused?: boolean } | null | undefined,
    reportState: (state: { isPlaying: boolean; isPaused: boolean }) => void
): boolean;
