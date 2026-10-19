export declare const runtimeSelectionBridgeScript: string;
export declare function readRuntimeSelection(payload: unknown): { ids: string[]; data: Record<string, unknown> } | null;
export declare function pickRuntimeEntityAt(scene: unknown, screenX: number, screenY: number, pixelsPerMeter?: number): string | null;
