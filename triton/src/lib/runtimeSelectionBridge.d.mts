export declare const runtimeSelectionBridgeScript: string;
export declare function isRuntimeViewMessageSource(source: unknown, frames: Iterable<{ contentWindow: unknown }>): boolean;
export declare function readRuntimeMessage(data: unknown): { type: string; payload: any } | null;
export declare function readRuntimeSelection(payload: unknown): { ids: string[]; data: Record<string, unknown> } | null;
export declare function pickRuntimeEntityAt(scene: unknown, screenX: number, screenY: number, pixelsPerMeter?: number): string | null;
