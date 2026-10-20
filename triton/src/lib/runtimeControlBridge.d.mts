export declare const runtimeControlBridgeScript: string;
export declare function getPlayAction(isPlaying: boolean, isPaused: boolean):
    | { type: "editor:pause"; payload: { paused: false }; startsNewSession: false }
    | { type: "editor:play"; payload: null; startsNewSession: true };
export declare function readRuntimeState(payload: unknown): { isPlaying: boolean; isPaused: boolean } | null;
export declare function runRuntimeControl(
    game: { start?: () => void; pause?: () => void; resume?: () => void; stop?: () => void; isRunning?: boolean; isPaused?: boolean } | null | undefined,
    type: string,
    payload: { paused?: boolean } | null | undefined,
    reportState: (state: { isPlaying: boolean; isPaused: boolean }) => void
): boolean;
