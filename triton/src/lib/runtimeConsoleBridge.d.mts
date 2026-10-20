export type RuntimeConsoleMessage =
    | { kind: "log"; type: "info" | "warn" | "error"; message: string }
    | { kind: "diagnostic"; diagnostic: Record<string, unknown> };

export declare function readRuntimeConsoleMessage(
    event: { source: MessageEventSource | null; data: unknown } | null,
    frames: Iterable<{ contentWindow: Window | null }> | null | undefined
): RuntimeConsoleMessage | null;

export declare const runtimeConsoleBridgeScript: string;
