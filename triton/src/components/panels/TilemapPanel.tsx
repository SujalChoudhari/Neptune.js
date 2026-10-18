import type { IDockviewPanelProps } from 'dockview';
import { useEffect, useMemo, useState } from 'react';
import { useFileSystem } from '@/context/FileSystemContext';
import { useGameContext } from '@/context/GameContext';
import { setTileMetadata, setCellMetadata, paintTileCell, getTilesetPaletteIds } from '@/lib/tilemapAuthoring.mjs';

interface TileMetadata {
    walkable?: boolean;
    terrain?: string;
    collision?: boolean;
    [key: string]: unknown;
}

interface TilemapDocument {
    width: number;
    height: number;
    data: number[];
    metadata?: Record<string, TileMetadata>;
    cellMetadata?: Record<string, { collision?: boolean }>;
    tileset?: string;
    columns?: number;
    tileCount?: number;
    [key: string]: unknown;
}

export function TilemapPanel(_props: IDockviewPanelProps) {
    const { nodes, readFile, writeFile } = useFileSystem();
    const { currentScenePath, loadScene } = useGameContext();
    const mapFiles = useMemo(() => Object.values(nodes)
        .filter((node) => node.type === 'file' && node.name.toLowerCase().endsWith('.map'))
        .sort((a, b) => a.id.localeCompare(b.id)), [nodes]);
    const tilesetFiles = useMemo(() => Object.values(nodes)
        .filter((node) => node.type === 'image' || /\.(png|jpe?g|webp)$/i.test(node.name))
        .sort((a, b) => a.id.localeCompare(b.id)), [nodes]);
    const [mapPath, setMapPath] = useState('');
    const [tilemap, setTilemap] = useState<TilemapDocument | null>(null);
    const [tileId, setTileId] = useState(1);
    const [paletteCount, setPaletteCount] = useState(25);
    const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!mapPath && mapFiles.length > 0) setMapPath(mapFiles[0].id);
    }, [mapFiles, mapPath]);

    useEffect(() => {
        if (!mapPath) {
            setTilemap(null);
            return;
        }
        let cancelled = false;
        setError('');
        setIsDirty(false);
        readFile(mapPath).then((content) => {
            if (cancelled) return;
            if (content === null) {
                setTilemap(null);
                setError(`Could not read ${mapPath}`);
                return;
            }
            try {
                const parsed = JSON.parse(content) as TilemapDocument;
                if (!Number.isInteger(parsed.width) || parsed.width <= 0 ||
                    !Number.isInteger(parsed.height) || parsed.height <= 0 ||
                    !Array.isArray(parsed.data) || parsed.data.length !== parsed.width * parsed.height ||
                    parsed.data.some((value) => !Number.isInteger(value) || value < 0)) {
                    throw new Error('Map must have positive dimensions and one non-negative tile ID per cell.');
                }
                setTilemap(parsed);
                setPaletteCount(typeof parsed.tileCount === 'number' && Number.isInteger(parsed.tileCount) && parsed.tileCount > 0
                    ? Math.min(parsed.tileCount, 4096)
                    : Math.min(Math.max(1, parsed.columns || 5) ** 2, 4096));
            } catch (loadError) {
                setTilemap(null);
                setError(loadError instanceof Error ? loadError.message : String(loadError));
            }
        }).catch((loadError) => {
            if (!cancelled) {
                setTilemap(null);
                setError(loadError instanceof Error ? loadError.message : String(loadError));
            }
        });
        return () => { cancelled = true; };
    }, [mapPath, readFile]);

    const handleSave = async () => {
        if (!tilemap || !mapPath || isSaving) return;
        setIsSaving(true);
        setError('');
        try {
            const saved = await writeFile(mapPath, JSON.stringify(tilemap, null, 2));
            if (!saved) throw new Error(`Could not save ${mapPath}`);
            setIsDirty(false);
            if (currentScenePath) await loadScene(currentScenePath);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : String(saveError));
        } finally {
            setIsSaving(false);
        }
    };

    const paint = (x: number, y: number) => {
        if (!tilemap) return;
        try {
            setTilemap(paintTileCell(tilemap, x, y, tileId));
            setSelectedCell({ x, y });
            setIsDirty(true);
        } catch (paintError) {
            setError(paintError instanceof Error ? paintError.message : String(paintError));
        }
    };

    const updateMetadata = (field: 'walkable' | 'terrain' | 'collision', value: boolean | string | undefined) => {
        if (!tilemap) return;
        try {
            setTilemap(setTileMetadata(tilemap, tileId, { [field]: value }));
            setIsDirty(true);
        } catch (metadataError) {
            setError(metadataError instanceof Error ? metadataError.message : String(metadataError));
        }
    };

    const updateCellCollision = (value: boolean | undefined) => {
        if (!tilemap || !selectedCell) return;
        try {
            setTilemap(setCellMetadata(tilemap, selectedCell.x, selectedCell.y, { collision: value }));
            setIsDirty(true);
        } catch (metadataError) {
            setError(metadataError instanceof Error ? metadataError.message : String(metadataError));
        }
    };

    const activeMetadata = tilemap?.metadata?.[String(tileId)] || {};

    return (
        <section className="h-full flex flex-col gap-2 bg-background p-3 text-foreground">
            <div className="flex items-center gap-2">
                <label className="text-xs shrink-0" htmlFor="tilemap-file">Map</label>
                <select
                    id="tilemap-file"
                    aria-label="Tilemap file"
                    className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 text-xs"
                    value={mapPath}
                    onChange={(event) => setMapPath(event.target.value)}
                >
                    <option value="">Choose a .map file</option>
                    {mapFiles.map((file) => <option key={file.id} value={file.id}>{file.id}</option>)}
                </select>
            </div>
            {tilemap && (
                <div className="flex items-center gap-2">
                    <label className="text-xs shrink-0" htmlFor="tilemap-tileset">Tileset</label>
                    <select
                        id="tilemap-tileset"
                        aria-label="Tileset asset"
                        className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 text-xs"
                        value={tilemap.tileset || ''}
                        onChange={(event) => {
                            setTilemap({ ...tilemap, tileset: event.target.value });
                            setIsDirty(true);
                        }}
                    >
                        <option value="">Choose an image asset</option>
                        {tilesetFiles.map((file) => <option key={file.id} value={file.id}>{file.id}</option>)}
                    </select>
                </div>
            )}
            <div className="flex items-center gap-2">
                <label className="text-xs" htmlFor="tilemap-paint-id">Tile ID</label>
                <input
                    id="tilemap-paint-id"
                    aria-label="Tile ID to paint"
                    className="w-20 rounded border border-border bg-card px-2 py-1 text-xs"
                    type="number"
                    min="0"
                    step="1"
                    value={tileId}
                    onChange={(event) => setTileId(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
                />
                <button
                    type="button"
                    className="ml-auto rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
                    disabled={!tilemap || !isDirty || isSaving}
                    onClick={() => void handleSave()}
                >
                    {isSaving ? 'Saving…' : isDirty ? 'Save Map' : 'Saved'}
                </button>
            </div>
            {tilemap && (
                <div className="flex min-h-0 max-h-40 flex-col gap-1 overflow-auto rounded border border-border bg-card/50 p-2" aria-label="Tileset tile palette">
                    <div className="flex items-center gap-2">
                        <span className="text-xs">Tileset tile palette</span>
                        <label className="ml-auto text-xs" htmlFor="tileset-tile-count">Tiles</label>
                        <input
                            id="tileset-tile-count"
                            aria-label="Tileset palette tile count"
                            className="w-16 rounded border border-border bg-card px-2 py-1 text-xs"
                            type="number"
                            min="1"
                            max="4096"
                            value={paletteCount}
                            onChange={(event) => {
                                const count = Math.max(1, Math.min(4096, Math.floor(Number(event.target.value) || 1)));
                                setPaletteCount(count);
                                setTilemap({ ...tilemap, tileCount: count });
                                setIsDirty(true);
                            }}
                        />
                    </div>
                    <div className="grid w-max gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, tilemap.columns || 5)}, 28px)` }}>
                        {getTilesetPaletteIds(Math.max(1, tilemap.columns || 5), paletteCount).map((id) => (
                            <button
                                key={id}
                                type="button"
                                aria-label={`Select tileset tile ${id}`}
                                aria-pressed={tileId === id}
                                className={`h-7 w-7 rounded border text-[9px] ${tileId === id ? 'border-primary bg-primary/30' : 'border-border bg-card'}`}
                                onClick={() => setTileId(id)}
                            >{id}</button>
                        ))}
                    </div>
                </div>
            )}
            {tilemap && (
                <div className="flex items-center gap-2 rounded border border-border bg-card/50 p-2">
                    <label className="text-xs" htmlFor="tilemap-walkable">Tile {tileId} walkability</label>
                    <select
                        id="tilemap-walkable"
                        aria-label={`Tile ${tileId} walkability`}
                        className="rounded border border-border bg-card px-2 py-1 text-xs"
                        value={activeMetadata.walkable === undefined ? 'unset' : String(activeMetadata.walkable)}
                        onChange={(event) => updateMetadata(
                            'walkable',
                            event.target.value === 'unset' ? undefined : event.target.value === 'true'
                        )}
                    >
                        <option value="unset">Unspecified</option>
                        <option value="true">Walkable</option>
                        <option value="false">Blocked</option>
                    </select>
                    <label className="text-xs" htmlFor="tilemap-collision">Collision</label>
                    <select
                        id="tilemap-collision"
                        aria-label={`Tile ${tileId} collision`}
                        className="rounded border border-border bg-card px-2 py-1 text-xs"
                        value={activeMetadata.collision === undefined ? 'unset' : String(activeMetadata.collision)}
                        onChange={(event) => updateMetadata(
                            'collision',
                            event.target.value === 'unset' ? undefined : event.target.value === 'true'
                        )}
                    >
                        <option value="unset">Default</option>
                        <option value="true">Solid</option>
                        <option value="false">Non-solid</option>
                    </select>
                    <label className="text-xs" htmlFor="tilemap-terrain">Terrain</label>
                    <input
                        id="tilemap-terrain"
                        aria-label={`Tile ${tileId} terrain`}
                        className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 text-xs"
                        value={activeMetadata.terrain || ''}
                        placeholder="e.g. water, stone"
                        onChange={(event) => updateMetadata('terrain', event.target.value || undefined)}
                    />
                </div>
            )}
            {tilemap && selectedCell && (
                <div className="flex items-center gap-2 rounded border border-border bg-card/50 p-2">
                    <label className="text-xs" htmlFor="cell-collision">Cell ({selectedCell.x}, {selectedCell.y}) collision</label>
                    <select
                        id="cell-collision"
                        aria-label={`Cell ${selectedCell.x}, ${selectedCell.y} collision`}
                        className="rounded border border-border bg-card px-2 py-1 text-xs"
                        value={tilemap.cellMetadata?.[String(selectedCell.y * tilemap.width + selectedCell.x)]?.collision === undefined
                            ? 'inherit' : String(tilemap.cellMetadata[String(selectedCell.y * tilemap.width + selectedCell.x)].collision)}
                        onChange={(event) => updateCellCollision(
                            event.target.value === 'inherit' ? undefined : event.target.value === 'true'
                        )}
                    >
                        <option value="inherit">Use tile default</option>
                        <option value="true">Solid</option>
                        <option value="false">Non-solid</option>
                    </select>
                </div>
            )}
            {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
            {tilemap ? (
                <div className="min-h-0 flex-1 overflow-auto rounded border border-border p-2" aria-label="Tilemap paint grid">
                    <div
                        className="grid w-max gap-px bg-border"
                        style={{ gridTemplateColumns: `repeat(${tilemap.width}, 24px)` }}
                    >
                        {tilemap.data.map((value, index) => {
                            const x = index % tilemap.width;
                            const y = Math.floor(index / tilemap.width);
                            return (
                                <button
                                    key={`${x}:${y}`}
                                    type="button"
                                    aria-label={`Paint cell ${x}, ${y}; tile ${value}`}
                                    title={`(${x}, ${y}) = ${value}`}
                                    className="h-6 w-6 bg-card text-[9px] hover:bg-primary/30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
                                    onClick={() => paint(x, y)}
                                >
                                    {value}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">Choose an existing .map asset to paint tile IDs.</p>
            )}
        </section>
    );
}
