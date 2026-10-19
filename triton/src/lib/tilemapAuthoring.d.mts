export interface EditableTilemap {
    width: number;
    height: number;
    data: number[];
    tileset?: string;
    columns?: number;
    tileCount?: number;
    tileSize?: number;
    [key: string]: unknown;
}

export function setTileMetadata<T extends EditableTilemap>(map: T, tileId: number, updates: Record<string, unknown>): T;
export function getTilesetPaletteIds(columns: number, tileCount: number): number[];
export function getTilesetTileOffset(tileId: number, columns: number, tileSize: number): { x: number; y: number };
export function setCellMetadata<T extends EditableTilemap>(map: T, x: number, y: number, updates: { collision?: boolean; walkable?: boolean; terrain?: string }): T;
export function paintTileCell<T extends EditableTilemap>(map: T, x: number, y: number, tileId: number): T;
export function paintTileCells<T extends EditableTilemap>(map: T, cells: Array<{ x: number; y: number }>, tileId: number): T;
export function createEmptyTilemap(options: {
    name: string;
    width: number;
    height: number;
    columns?: number;
    tileSize?: number;
    tileset?: string;
}): EditableTilemap & { columns: number; tileCount: number; tileSize: number };
