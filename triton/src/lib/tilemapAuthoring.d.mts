export interface EditableTilemap {
    width: number;
    height: number;
    data: number[];
    [key: string]: unknown;
}

export function paintTileCell<T extends EditableTilemap>(map: T, x: number, y: number, tileId: number): T;
