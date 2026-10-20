export type ConsoleLogEntry = {
    id: string;
    type: "info" | "warn" | "error";
    message: string;
    timestamp: string;
    count: number;
};

export declare function collapseConsoleLogs(logs: ConsoleLogEntry[]): ConsoleLogEntry[];
export declare function isConsoleNearBottom(
    scrollHeight: number,
    scrollTop: number,
    clientHeight: number,
    threshold?: number
): boolean;
