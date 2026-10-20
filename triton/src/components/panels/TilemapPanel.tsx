import type { IDockviewPanelProps } from 'dockview';
import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFileSystem } from '@/context/FileSystemContext';
import { useGameContext } from '@/context/GameContext';
import { setTileMetadata, setCellMetadata, paintTileCells, getTilesetPaletteIds, getTilesetTileOffset, getTilesetGridSize, createEmptyTilemap, getTilemapAttachError } from '@/lib/tilemapAuthoring.mjs';

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
    cellMetadata?: Record<string, { collision?: boolean; walkable?: boolean; terrain?: string }>;
    tileset?: string;
    columns?: number;
    tileCount?: number;
    tileSize?: number;
    [key: string]: unknown;
}

export function TilemapPanel(_props: IDockviewPanelProps) {
    const { nodes, readFile, writeFile, rootPath, refresh } = useFileSystem();
    const { currentScenePath, loadScene, addTilemapLayer } = useGameContext();
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
    const [availableTileCount, setAvailableTileCount] = useState<number | null>(null);
    const [tilesetPreview, setTilesetPreview] = useState('');
    const [atlasSize, setAtlasSize] = useState<{ width: number; height: number } | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
    const [isPainting, setIsPainting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [showNewMap, setShowNewMap] = useState(false);
    const [newMapName, setNewMapName] = useState('new-map.map');
    const [newMapWidth, setNewMapWidth] = useState(16);
    const [newMapHeight, setNewMapHeight] = useState(16);
    const [newMapColumns, setNewMapColumns] = useState(8);
    const [newMapTileSize, setNewMapTileSize] = useState(32);
    const [newMapTileset, setNewMapTileset] = useState('');
    const [isCreatingMap, setIsCreatingMap] = useState(false);

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
                    : Math.min(Math.max(1, parsed.columns || 10) ** 2, 4096));
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

    useEffect(() => {
        if (!tilemap?.tileset) {
            setTilesetPreview('');
            setAtlasSize(null);
            setAvailableTileCount(null);
            return;
        }
        let cancelled = false;
        setTilesetPreview('');
        setAtlasSize(null);
        setAvailableTileCount(null);
        invoke<string>('read_image_asset', { path: tilemap.tileset })
            .then((dataUrl) => { if (!cancelled) setTilesetPreview(dataUrl); })
            .catch((previewError) => {
                if (!cancelled) setError(previewError instanceof Error ? previewError.message : String(previewError));
            });
        return () => { cancelled = true; };
    }, [tilemap?.tileset]);

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

    const handleCreateMap = async () => {
        const filename = newMapName.trim();
        setError('');
        if (!rootPath) {
            setError('Open a project before creating a tilemap.');
            return;
        }
        if (mapFiles.some((file) => file.id.toLowerCase() === filename.toLowerCase())) {
            setError(`A tilemap named ${filename} already exists.`);
            return;
        }

        setIsCreatingMap(true);
        try {
            const createdMap = createEmptyTilemap({
                name: filename,
                width: newMapWidth,
                height: newMapHeight,
                columns: newMapColumns,
                tileSize: newMapTileSize,
                tileset: newMapTileset || undefined
            });
            if (!await writeFile(filename, JSON.stringify(createdMap, null, 2))) {
                throw new Error(`Could not create ${filename}.`);
            }
            await refresh();
            setMapPath(filename);
            setTilemap(createdMap);
            setPaletteCount(createdMap.tileCount || 64);
            setSelectedCell(null);
            setIsDirty(false);
            setShowNewMap(false);
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : String(createError));
        } finally {
            setIsCreatingMap(false);
        }
    };

    const handleAddToScene = () => {
        setError('');
        const attachError = getTilemapAttachError({ tilemap, mapPath, currentScenePath, isDirty });
        if (attachError) {
            setError(attachError);
            return;
        }
        if (!addTilemapLayer(mapPath)) {
            setError('Could not add this map to the active scene. Open a scene and select a saved .map file.');
        }
    };

    const paint = (x: number, y: number) => {
        if (!tilemap) return;
        try {
            setTilemap(paintTileCells(tilemap, [{ x, y }], tileId));
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

    const updateCellMetadata = (field: 'collision' | 'walkable' | 'terrain', value: boolean | string | undefined) => {
        if (!tilemap || !selectedCell) return;
        try {
            setTilemap(setCellMetadata(tilemap, selectedCell.x, selectedCell.y, { [field]: value }));
            setIsDirty(true);
        } catch (metadataError) {
            setError(metadataError instanceof Error ? metadataError.message : String(metadataError));
        }
    };

    const activeMetadata = tilemap?.metadata?.[String(tileId)] || {};
    const atlasColumns = tilemap?.columns ?? 10;
    const atlasTileSize = tilemap?.tileSize ?? 64;

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
                <button
                    type="button"
                    aria-label="Create new tilemap"
                    className="rounded border border-border px-2 py-1 text-xs disabled:opacity-50"
                    disabled={!rootPath}
                    onClick={() => setShowNewMap((visible) => !visible)}
                >
                    New Map
                </button>
            </div>
            {showNewMap && (
                <div className="flex flex-wrap items-end gap-2 rounded border border-border bg-card/50 p-2" aria-label="New tilemap settings">
                    <label className="flex flex-col gap-1 text-xs">
                        Map filename
                        <input
                            aria-label="New tilemap filename"
                            className="w-36 rounded border border-border bg-card px-2 py-1"
                            value={newMapName}
                            onChange={(event) => setNewMapName(event.target.value)}
                            placeholder="level.map"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        Width
                        <input aria-label="New tilemap width" className="w-16 rounded border border-border bg-card px-2 py-1" type="number" min="1" max="256" value={newMapWidth} onChange={(event) => setNewMapWidth(Number(event.target.value))} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        Height
                        <input aria-label="New tilemap height" className="w-16 rounded border border-border bg-card px-2 py-1" type="number" min="1" max="256" value={newMapHeight} onChange={(event) => setNewMapHeight(Number(event.target.value))} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        Atlas columns
                        <input aria-label="New tilemap atlas columns" className="w-16 rounded border border-border bg-card px-2 py-1" type="number" min="1" max="64" value={newMapColumns} onChange={(event) => setNewMapColumns(Number(event.target.value))} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        Tile size (px)
                        <input aria-label="New tilemap tile size" className="w-16 rounded border border-border bg-card px-2 py-1" type="number" min="1" max="256" value={newMapTileSize} onChange={(event) => setNewMapTileSize(Number(event.target.value))} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                        Tileset
                        <select aria-label="New tilemap tileset" className="max-w-40 rounded border border-border bg-card px-2 py-1" value={newMapTileset} onChange={(event) => setNewMapTileset(event.target.value)}>
                            <option value="">No tileset yet</option>
                            {tilesetFiles.map((file) => <option key={file.id} value={file.id}>{file.id}</option>)}
                        </select>
                    </label>
                    <button type="button" className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50" disabled={isCreatingMap} onClick={() => void handleCreateMap()}>
                        {isCreatingMap ? 'Creating…' : 'Create Map'}
                    </button>
                    <button type="button" className="rounded border border-border px-3 py-1 text-xs" onClick={() => setShowNewMap(false)}>
                        Cancel
                    </button>
                </div>
            )}
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
            {tilemap && (
                <div className="flex flex-wrap items-center gap-3 rounded border border-border bg-card/50 px-2 py-1">
                    <label className="flex items-center gap-2 text-xs" htmlFor="tilemap-atlas-columns">
                        Atlas columns
                        <input
                            id="tilemap-atlas-columns"
                            aria-label="Atlas columns"
                            className="w-16 rounded border border-border bg-card px-2 py-1"
                            type="number"
                            min="1"
                            max="64"
                            value={tilemap.columns ?? 10}
                            onChange={(event) => {
                                const columns = Number(event.target.value);
                                if (!Number.isInteger(columns) || columns < 1 || columns > 64) return;
                                setTilemap({ ...tilemap, columns });
                                setIsDirty(true);
                            }}
                        />
                    </label>
                    <label className="flex items-center gap-2 text-xs" htmlFor="tilemap-tile-size">
                        Tile size (px)
                        <input
                            id="tilemap-tile-size"
                            aria-label="Tile size in pixels"
                            className="w-16 rounded border border-border bg-card px-2 py-1"
                            type="number"
                            min="1"
                            max="256"
                            value={tilemap.tileSize ?? 64}
                            onChange={(event) => {
                                const tileSize = Number(event.target.value);
                                if (!Number.isInteger(tileSize) || tileSize < 1 || tileSize > 256) return;
                                let updatedMap = { ...tilemap, tileSize };
                                if (atlasSize) {
                                    try {
                                        const atlas = getTilesetGridSize(atlasSize.width, atlasSize.height, tileSize);
                                        const tileCount = Math.min(tilemap.tileCount ?? atlas.tileCount, atlas.tileCount);
                                        setAvailableTileCount(atlas.tileCount);
                                        setPaletteCount(tileCount);
                                        setTileId((current) => Math.min(current, tileCount - 1));
                                        updatedMap = { ...updatedMap, columns: atlas.columns, tileCount };
                                    } catch (atlasError) {
                                        setAvailableTileCount(0);
                                        setError(atlasError instanceof Error ? atlasError.message : String(atlasError));
                                    }
                                }
                                setTilemap(updatedMap);
                                setIsDirty(true);
                            }}
                        />
                    </label>
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
                    max={Math.max(0, Math.min(paletteCount, availableTileCount ?? 4096) - 1)}
                    step="1"
                    value={tileId}
                    onChange={(event) => setTileId(Math.max(
                        0,
                        Math.min(Math.max(0, Math.min(paletteCount, availableTileCount ?? 4096) - 1),
                            Math.floor(Number(event.target.value) || 0))
                    ))}
                />
                <button
                    type="button"
                    className="ml-auto rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
                    disabled={!tilemap || !isDirty || isSaving}
                    onClick={() => void handleSave()}
                >
                    {isSaving ? 'Saving…' : isDirty ? 'Save Map' : 'Saved'}
                </button>
                <button
                    type="button"
                    className="rounded border border-border px-3 py-1 text-xs disabled:opacity-50"
                    aria-label="Add tilemap to active scene"
                    title={!currentScenePath
                        ? 'Open a scene before adding a tilemap'
                        : !tilemap?.tileset?.trim()
                            ? 'Choose a tileset before adding this map to a scene'
                            : isDirty ? 'Save the map before adding it to the scene' : undefined}
                    disabled={!tilemap || !mapPath || !tilemap.tileset?.trim() || isDirty || !currentScenePath}
                    onClick={handleAddToScene}
                >
                    Add to Scene
                </button>
            </div>
            {tilemap && !tilemap.tileset?.trim() && (
                <p className="text-xs text-muted-foreground" role="status">
                    Choose a tileset asset before adding this map to a scene; the runtime needs it to render painted cells.
                </p>
            )}
            {tilemap && (
                <div className="flex min-h-0 max-h-40 flex-col gap-1 overflow-auto rounded border border-border bg-card/50 p-2" aria-label="Tileset tile palette">
                    {tilesetPreview && <img src={tilesetPreview} alt="Tileset atlas" className="hidden" onLoad={(event) => {
                        const width = event.currentTarget.naturalWidth;
                        const height = event.currentTarget.naturalHeight;
                        setAtlasSize({ width, height });
                        try {
                            const atlas = getTilesetGridSize(width, height, atlasTileSize);
                            const tileCount = Math.min(tilemap.tileCount ?? atlas.tileCount, atlas.tileCount);
                            setAvailableTileCount(atlas.tileCount);
                            setPaletteCount(tileCount);
                            setTileId((current) => Math.min(current, tileCount - 1));
                            if (tilemap.columns !== atlas.columns || tilemap.tileCount !== tileCount) {
                                setTilemap({ ...tilemap, columns: atlas.columns, tileCount });
                                setIsDirty(true);
                            }
                        } catch (atlasError) {
                            setAvailableTileCount(0);
                            setError(atlasError instanceof Error ? atlasError.message : String(atlasError));
                        }
                    }} />}
                    <div className="flex items-center gap-2">
                        <span className="text-xs">Tileset tile palette</span>
                        <label className="ml-auto text-xs" htmlFor="tileset-tile-count">Tiles</label>
                        <input
                            id="tileset-tile-count"
                            aria-label="Tileset palette tile count"
                            className="w-16 rounded border border-border bg-card px-2 py-1 text-xs"
                            type="number"
                            min="1"
                            max={availableTileCount ?? 4096}
                            disabled={availableTileCount === 0}
                            value={paletteCount}
                            onChange={(event) => {
                                const count = Math.max(1, Math.min(availableTileCount ?? 4096, 4096, Math.floor(Number(event.target.value) || 1)));
                                setPaletteCount(count);
                                setTileId((current) => Math.min(current, count - 1));
                                setTilemap({ ...tilemap, tileCount: count });
                                setIsDirty(true);
                            }}
                        />
                    </div>
                    <div className="grid w-max gap-1" style={{ gridTemplateColumns: `repeat(${atlasColumns}, 28px)` }}>
                        {getTilesetPaletteIds(atlasColumns, paletteCount).map((id) => (
                            <button
                                key={id}
                                type="button"
                                aria-label={`Select tileset tile ${id}`}
                                aria-pressed={tileId === id}
                                className={`h-7 w-7 rounded border text-[9px] ${tileId === id ? 'border-primary ring-1 ring-primary' : 'border-border'} ${tilesetPreview && atlasSize ? 'text-transparent' : 'bg-card'}`}
                                style={tilesetPreview && atlasSize ? (() => {
                                    const tileSize = atlasTileSize;
                                    const offset = getTilesetTileOffset(id, atlasColumns, tileSize);
                                    const scale = 28 / tileSize;
                                    return {
                                        backgroundImage: `url("${tilesetPreview}")`,
                                        backgroundSize: `${atlasSize.width * scale}px ${atlasSize.height * scale}px`,
                                        backgroundPosition: `-${offset.x * scale}px -${offset.y * scale}px`
                                    };
                                })() : undefined}
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
                        onChange={(event) => updateCellMetadata('collision',
                            event.target.value === 'inherit' ? undefined : event.target.value === 'true'
                        )}
                    >
                        <option value="inherit">Use tile default</option>
                        <option value="true">Solid</option>
                        <option value="false">Non-solid</option>
                    </select>
                    <label className="text-xs" htmlFor="cell-walkable">Navigation</label>
                    <select
                        id="cell-walkable"
                        aria-label={`Cell ${selectedCell.x}, ${selectedCell.y} walkability`}
                        className="rounded border border-border bg-card px-2 py-1 text-xs"
                        value={tilemap.cellMetadata?.[String(selectedCell.y * tilemap.width + selectedCell.x)]?.walkable === undefined
                            ? 'inherit' : String(tilemap.cellMetadata[String(selectedCell.y * tilemap.width + selectedCell.x)].walkable)}
                        onChange={(event) => updateCellMetadata('walkable',
                            event.target.value === 'inherit' ? undefined : event.target.value === 'true')}
                    >
                        <option value="inherit">Use tile default</option>
                        <option value="true">Walkable</option>
                        <option value="false">Blocked</option>
                    </select>
                    <label className="text-xs" htmlFor="cell-terrain">Cell terrain</label>
                    <input
                        id="cell-terrain"
                        aria-label={`Cell ${selectedCell.x}, ${selectedCell.y} terrain`}
                        className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 text-xs"
                        value={tilemap.cellMetadata?.[String(selectedCell.y * tilemap.width + selectedCell.x)]?.terrain || ''}
                        onChange={(event) => updateCellMetadata('terrain', event.target.value || undefined)}
                    />
                </div>
            )}
            {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
            {tilemap ? (
                <div
                    className="min-h-0 flex-1 overflow-auto rounded border border-border p-2"
                    aria-label="Tilemap paint grid"
                    onMouseUp={() => setIsPainting(false)}
                    onMouseLeave={() => setIsPainting(false)}
                >
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
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        setIsPainting(true);
                                        paint(x, y);
                                    }}
                                    onMouseEnter={() => { if (isPainting) paint(x, y); }}
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
