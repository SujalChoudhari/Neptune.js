export interface EditableTilemap {
    width: number;
    height: number;
    data: number[];
    [key: string]: unknown;
}

export function setTileMetadata<T extends EditableTilemap>(map: T, tileId: number, updates: Record<string, unknown>): T;
export function setCellMetadata<T extends EditableTilemap>(map: T, x: number, y: number, updates: { collision?: boolean }): T;
export function paintTileCell<T extends EditableTilemap>(map: T, x: number, y: number, tileId: number): T;
