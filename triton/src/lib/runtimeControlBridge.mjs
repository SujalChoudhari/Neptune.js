export function readRuntimeState(payload) {
    if (!payload || typeof payload !== "object"
        || typeof payload.isPlaying !== "boolean"
        || typeof payload.isPaused !== "boolean") return null;
    return { isPlaying: payload.isPlaying, isPaused: payload.isPaused };
}

export function runRuntimeControl(game, type, payload, reportState) {
    if (!game || typeof reportState !== "function") return false;

    if (type === "editor:play" && typeof game.start === "function") {
        if (game.isRunning) {
            if (game.isPaused && typeof game.resume === "function") game.resume();
        } else {
            game.start();
        }
    } else if (type === "editor:pause" && typeof game.pause === "function" && typeof game.resume === "function") {
        if (payload?.paused) game.pause();
        else game.resume();
    } else if (type === "editor:stop" && typeof game.stop === "function") {
        game.stop();
    } else {
        return false;
    }

    reportState({ isPlaying: Boolean(game.isRunning), isPaused: Boolean(game.isPaused) });
    return true;
}

export const runtimeControlBridgeScript = `
const runRuntimeControl = ${runRuntimeControl.toString()};
`;
