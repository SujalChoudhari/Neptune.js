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
    slowdown?: number;
    movementCost?: number;
    [key: string]: unknown;
}

interface TilemapDocument {
    width: number;
    height: number;
    data: number[];
    metadata?: Record<string, TileMetadata>;
    cellMetadata?: Record<string, { collision?: boolean; walkable?: boolean; terrain?: string; slowdown?: number; movementCost?: number }>;
    tileset?: string;
    columns?: number;
    tileCount?: number;
    tileSize?: number;
    [key: string]: unknown;
}

type TilemapBrushMode = 'tile' | 'collision' | 'walkability' | 'terrain' | 'slowdown' | 'movementCost';

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
    const [brushMode, setBrushMode] = useState<TilemapBrushMode>('tile');
    const [collisionBrush, setCollisionBrush] = useState('true');
    const [navigationBrush, setNavigationBrush] = useState('true');
    const [terrainBrush, setTerrainBrush] = useState('');
    const [slowdownBrush, setSlowdownBrush] = useState('');
    const [movementCostBrush, setMovementCostBrush] = useState('');
    const [paletteCount, setPaletteCount] = useState(25);
    const [availableTileCount, setAvailableTileCount] = useState<number | null>(null);
    const [availableAtlasColumns, setAvailableAtlasColumns] = useState<number | null>(null);
    const [atlasRows, setAtlasRows] = useState<number | null>(null);
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
            setAvailableAtlasColumns(null);
            setAtlasRows(null);
            return;
        }
        let cancelled = false;
        setTilesetPreview('');
        setAtlasSize(null);
        setAvailableTileCount(null);
        setAvailableAtlasColumns(null);
        setAtlasRows(null);
        invoke<string>('read_image_asset', { path: tilemap.tileset })
            .then((dataUrl) => { if (!cancelled) setTilesetPreview(dataUrl); })
            .catch((previewError) => {
                if (!cancelled) {
                    setAvailableTileCount(0);
                    setAvailableAtlasColumns(0);
                    setAtlasRows(0);
                    setError(previewError instanceof Error ? previewError.message : String(previewError));
                }
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
        if (tilemap.tileset?.trim() && (availableTileCount === null || availableTileCount === 0)) {
            setError(availableTileCount === null
                ? 'Wait for the tileset image to load before painting.'
                : 'The tileset image has no usable tiles; painting is disabled.');
            return;
        }
        try {
            setTilemap(paintTileCells(tilemap, [{ x, y }], tileId));
            setSelectedCell({ x, y });
            setIsDirty(true);
        } catch (paintError) {
            setError(paintError instanceof Error ? paintError.message : String(paintError));
        }
    };

    const handleGridCellKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, x: number, y: number) => {
        if (!tilemap) return;
        let nextX = x;
        let nextY = y;
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                applyBrush(x, y);
                return;
            case 'ArrowLeft': nextX--; break;
            case 'ArrowRight': nextX++; break;
            case 'ArrowUp': nextY--; break;
            case 'ArrowDown': nextY++; break;
            default: return;
        }
        if (nextX < 0 || nextX >= tilemap.width || nextY < 0 || nextY >= tilemap.height) return;

        event.preventDefault();
        setSelectedCell({ x: nextX, y: nextY });
        const grid = event.currentTarget.parentElement?.parentElement;
        const nextRow = grid?.children[nextY] as HTMLElement | undefined;
        const nextCell = nextRow?.children[nextX] as HTMLButtonElement | undefined;
        nextCell?.focus();
    };

    const updateMetadata = (field: 'walkable' | 'terrain' | 'collision' | 'movementCost', value: boolean | string | number | undefined) => {
        if (!tilemap) return;
        try {
            setTilemap(setTileMetadata(tilemap, tileId, { [field]: value }));
            setIsDirty(true);
        } catch (metadataError) {
            setError(metadataError instanceof Error ? metadataError.message : String(metadataError));
        }
    };

    const updateCellMetadata = (
        field: 'collision' | 'walkable' | 'terrain' | 'slowdown' | 'movementCost',
        value: boolean | string | number | undefined,
        cell = selectedCell
    ) => {
        if (!tilemap || !cell) return;
        try {
            setTilemap(setCellMetadata(tilemap, cell.x, cell.y, { [field]: value }));
            setIsDirty(true);
        } catch (metadataError) {
            setError(metadataError instanceof Error ? metadataError.message : String(metadataError));
        }
    };

    const applyBrush = (x: number, y: number) => {
        if (brushMode === 'tile') {
            paint(x, y);
            return;
        }
        if (brushMode === 'collision') {
            updateCellMetadata('collision', collisionBrush === 'inherit' ? undefined : collisionBrush === 'true', { x, y });
            return;
        }
        if (brushMode === 'walkability') {
            updateCellMetadata('walkable', navigationBrush === 'inherit' ? undefined : navigationBrush === 'true', { x, y });
            return;
        }
        if (brushMode === 'terrain') {
            updateCellMetadata('terrain', terrainBrush || undefined, { x, y });
            return;
        }
        if (brushMode === 'slowdown') {
            updateCellMetadata('slowdown', slowdownBrush === '' ? undefined : Number(slowdownBrush), { x, y });
            return;
        }
        updateCellMetadata('movementCost', movementCostBrush === '' ? undefined : Number(movementCostBrush), { x, y });
    };

    const activeMetadata = tilemap?.metadata?.[String(tileId)] || {};
    const atlasColumns = tilemap?.columns ?? 10;
    const atlasTileSize = tilemap?.tileSize ?? 64;
    const paletteTileCount = Math.min(paletteCount, availableTileCount ?? 4096);
    const paletteIds = paletteTileCount > 0 ? getTilesetPaletteIds(atlasColumns, paletteTileCount) : [];
    const paletteRowCount = Math.ceil(paletteIds.length / atlasColumns);
    const paintingBlocked = Boolean(tilemap?.tileset?.trim()) && !(availableTileCount && availableTileCount > 0);

    const handlePaletteKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, id: number) => {
        let nextId = id;
        switch (event.key) {
            case 'ArrowLeft':
                if (id % atlasColumns === 0) return;
                nextId--;
                break;
            case 'ArrowRight':
                if (id % atlasColumns === atlasColumns - 1 || id + 1 >= paletteTileCount) return;
                nextId++;
                break;
            case 'ArrowUp':
                nextId -= atlasColumns;
                break;
            case 'ArrowDown':
                nextId += atlasColumns;
                break;
            default:
                return;
        }
        if (nextId < 0 || nextId >= paletteTileCount) return;

        event.preventDefault();
        setTileId(nextId);
        const grid = event.currentTarget.parentElement?.parentElement;
        const nextRow = grid?.children[Math.floor(nextId / atlasColumns)] as HTMLElement | undefined;
        const nextButton = nextRow?.children[nextId % atlasColumns] as HTMLButtonElement | undefined;
        nextButton?.focus();
    };

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
                            setAvailableTileCount(null);
                            setAvailableAtlasColumns(null);
                            setAtlasRows(null);
                            setAtlasSize(null);
                            setTilesetPreview('');
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
                            max={availableAtlasColumns ?? 64}
                            disabled={availableAtlasColumns === 0}
                            value={tilemap.columns ?? 10}
                            onChange={(event) => {
                                const columns = Number(event.target.value);
                                const maximumColumns = availableAtlasColumns ?? 64;
                                if (!Number.isInteger(columns) || columns < 1 || columns > maximumColumns) return;
                                let updatedMap = { ...tilemap, columns };
                                if (atlasRows !== null && atlasRows > 0) {
                                    const capacity = Math.min(columns * atlasRows, 4096);
                                    const tileCount = Math.min(tilemap.tileCount ?? capacity, capacity);
                                    setAvailableTileCount(capacity);
                                    setPaletteCount(tileCount);
                                    setTileId((current) => Math.min(current, tileCount - 1));
                                    updatedMap = { ...updatedMap, tileCount };
                                }
                                setTilemap(updatedMap);
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
                                        setAvailableAtlasColumns(atlas.columns);
                                        setAtlasRows(atlas.rows);
                                        setPaletteCount(tileCount);
                                        setTileId((current) => Math.min(current, tileCount - 1));
                                        updatedMap = { ...updatedMap, columns: atlas.columns, tileCount };
                                    } catch (atlasError) {
                                        setAvailableTileCount(0);
                                        setAvailableAtlasColumns(0);
                                        setAtlasRows(0);
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
                    disabled={paintingBlocked}
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
                    {tilemap.tileset?.trim() && availableTileCount === null && (
                        <p className="text-xs text-muted-foreground" role="status">Loading tileset dimensions; painting is paused.</p>
                    )}
                    {tilesetPreview && <img src={tilesetPreview} alt="Tileset atlas" className="hidden" onLoad={(event) => {
                        const width = event.currentTarget.naturalWidth;
                        const height = event.currentTarget.naturalHeight;
                        setAtlasSize({ width, height });
                        try {
                            const atlas = getTilesetGridSize(width, height, atlasTileSize);
                            const tileCount = Math.min(tilemap.tileCount ?? atlas.tileCount, atlas.tileCount);
                            setAvailableTileCount(atlas.tileCount);
                            setAvailableAtlasColumns(atlas.columns);
                            setAtlasRows(atlas.rows);
                            setPaletteCount(tileCount);
                            setTileId((current) => Math.min(current, tileCount - 1));
                            setError('');
                            if (tilemap.columns !== atlas.columns || tilemap.tileCount !== tileCount) {
                                setTilemap({ ...tilemap, columns: atlas.columns, tileCount });
                                setIsDirty(true);
                            }
                        } catch (atlasError) {
                            setAvailableTileCount(0);
                            setAvailableAtlasColumns(0);
                            setAtlasRows(0);
                            setError(atlasError instanceof Error ? atlasError.message : String(atlasError));
                        }
                    }} onError={() => {
                        setAvailableTileCount(0);
                        setAvailableAtlasColumns(0);
                        setAtlasRows(0);
                        setError('Could not decode the tileset image; painting is disabled.');
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
                    {paletteIds.length > 0 ? (
                        <div
                            className="flex w-max flex-col gap-1"
                            role="grid"
                            aria-label="Tileset keyboard palette"
                            aria-rowcount={paletteRowCount}
                            aria-colcount={Math.min(atlasColumns, paletteTileCount)}
                        >
                            {Array.from({ length: paletteRowCount }, (_, rowIndex) => (
                                <div key={rowIndex} className="flex gap-1" role="row">
                                    {paletteIds.slice(rowIndex * atlasColumns, (rowIndex + 1) * atlasColumns).map((id) => (
                                        <button
                                            key={id}
                                            type="button"
                                            role="gridcell"
                                            aria-label={`Select tileset tile ${id}`}
                                            aria-rowindex={rowIndex + 1}
                                            aria-colindex={id % atlasColumns + 1}
                                            aria-selected={tileId === id}
                                            tabIndex={tileId === id ? 0 : -1}
                                            className={`h-7 w-7 rounded border text-[9px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary ${tileId === id ? 'border-primary ring-1 ring-primary' : 'border-border'} ${tilesetPreview && atlasSize ? 'text-transparent' : 'bg-card'}`}
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
                                            onFocus={() => setTileId(id)}
                                            onKeyDown={(event) => handlePaletteKeyDown(event, id)}
                                            onClick={() => setTileId(id)}
                                        >{id}</button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground" aria-label="Tileset palette unavailable" role="status">
                            Palette unavailable until a valid tileset image is loaded.
                        </p>
                    )}
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
                    <label className="text-xs" htmlFor="tilemap-movement-cost">Tile {tileId} movement cost</label>
                    <input
                        id="tilemap-movement-cost"
                        aria-label={`Tile ${tileId} movement cost`}
                        className="w-24 rounded border border-border bg-card px-2 py-1 text-xs"
                        type="number"
                        min="0"
                        step="0.1"
                        value={activeMetadata.movementCost ?? ''}
                        placeholder="Default 1"
                        onChange={(event) => updateMetadata('movementCost', event.target.value === '' ? undefined : Number(event.target.value))}
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
                    <label className="text-xs" htmlFor="cell-slowdown">Cell slowdown</label>
                    <input
                        id="cell-slowdown"
                        aria-label={`Cell ${selectedCell.x}, ${selectedCell.y} slowdown`}
                        className="w-24 rounded border border-border bg-card px-2 py-1 text-xs"
                        type="number"
                        min="0"
                        step="0.1"
                        value={tilemap.cellMetadata?.[String(selectedCell.y * tilemap.width + selectedCell.x)]?.slowdown ?? ''}
                        placeholder="Use tile default"
                        onChange={(event) => updateCellMetadata('slowdown', event.target.value === '' ? undefined : Number(event.target.value))}
                    />
                    <label className="text-xs" htmlFor="cell-movement-cost">Cell movement cost</label>
                    <input
                        id="cell-movement-cost"
                        aria-label={`Cell ${selectedCell.x}, ${selectedCell.y} movement cost`}
                        className="w-24 rounded border border-border bg-card px-2 py-1 text-xs"
                        type="number"
                        min="0"
                        step="0.1"
                        value={tilemap.cellMetadata?.[String(selectedCell.y * tilemap.width + selectedCell.x)]?.movementCost ?? ''}
                        placeholder="Use tile default"
                        onChange={(event) => updateCellMetadata('movementCost', event.target.value === '' ? undefined : Number(event.target.value))}
                    />
                </div>
            )}
            {tilemap && (
                <div role="group" aria-label="Tilemap brush controls" className="flex flex-wrap items-center gap-2 rounded border border-border bg-card/50 p-2">
                    <label className="text-xs" htmlFor="tilemap-brush-mode">Brush</label>
                    <select
                        id="tilemap-brush-mode"
                        aria-label="Tilemap brush mode"
                        className="rounded border border-border bg-card px-2 py-1 text-xs"
                        value={brushMode}
                        disabled={isPainting}
                        onChange={(event) => setBrushMode(event.target.value as TilemapBrushMode)}
                    >
                        <option value="tile">Tile</option>
                        <option value="collision">Collision</option>
                        <option value="walkability">Navigation</option>
                        <option value="terrain">Terrain</option>
                        <option value="slowdown">Slowdown</option>
                        <option value="movementCost">Movement cost</option>
                    </select>
                    {brushMode === 'collision' && (
                        <>
                            <label className="text-xs" htmlFor="collision-brush">Collision value</label>
                            <select
                                id="collision-brush"
                                aria-label="Collision brush"
                                className="rounded border border-border bg-card px-2 py-1 text-xs"
                                value={collisionBrush}
                                disabled={isPainting}
                                onChange={(event) => setCollisionBrush(event.target.value)}
                            >
                                <option value="inherit">Use tile default</option>
                                <option value="true">Solid</option>
                                <option value="false">Non-solid</option>
                            </select>
                        </>
                    )}
                    {brushMode === 'walkability' && (
                        <>
                            <label className="text-xs" htmlFor="navigation-brush">Navigation value</label>
                            <select
                                id="navigation-brush"
                                aria-label="Navigation brush"
                                className="rounded border border-border bg-card px-2 py-1 text-xs"
                                value={navigationBrush}
                                disabled={isPainting}
                                onChange={(event) => setNavigationBrush(event.target.value)}
                            >
                                <option value="inherit">Use tile default</option>
                                <option value="true">Walkable</option>
                                <option value="false">Blocked</option>
                            </select>
                        </>
                    )}
                    {brushMode === 'terrain' && (
                        <>
                            <label className="text-xs" htmlFor="terrain-brush">Terrain value</label>
                            <input
                                id="terrain-brush"
                                aria-label="Terrain brush"
                                className="min-w-0 rounded border border-border bg-card px-2 py-1 text-xs"
                                value={terrainBrush}
                                placeholder="Use tile default"
                                disabled={isPainting}
                                onChange={(event) => setTerrainBrush(event.target.value)}
                            />
                        </>
                    )}
                    {brushMode === 'slowdown' && (
                        <>
                            <label className="text-xs" htmlFor="slowdown-brush">Slowdown value</label>
                            <input
                                id="slowdown-brush"
                                aria-label="Slowdown brush"
                                className="w-24 rounded border border-border bg-card px-2 py-1 text-xs"
                                type="number"
                                min="0"
                                step="0.1"
                                value={slowdownBrush}
                                placeholder="Use tile default"
                                disabled={isPainting}
                                onChange={(event) => setSlowdownBrush(event.target.value)}
                            />
                            <span className="text-xs text-muted-foreground">Extra movement time per cell; blank inherits the tile value.</span>
                        </>
                    )}
                    {brushMode === 'movementCost' && (
                        <>
                            <label className="text-xs" htmlFor="movement-cost-brush">Movement cost value</label>
                            <input
                                id="movement-cost-brush"
                                aria-label="Movement cost brush"
                                className="w-24 rounded border border-border bg-card px-2 py-1 text-xs"
                                type="number"
                                min="0"
                                step="0.1"
                                value={movementCostBrush}
                                placeholder="Use tile default"
                                disabled={isPainting}
                                onChange={(event) => setMovementCostBrush(event.target.value)}
                            />
                            <span className="text-xs text-muted-foreground">Higher values make routes avoid this cell; blank inherits the tile value.</span>
                        </>
                    )}
                </div>
            )}
            {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
            {tilemap ? (
                <div
                    className="min-h-0 flex-1 overflow-auto rounded border border-border p-2"
                    onMouseUp={() => setIsPainting(false)}
                    onMouseLeave={() => setIsPainting(false)}
                >
                    <div
                        className="flex w-max flex-col gap-px bg-border"
                        role="grid"
                        aria-label="Tilemap paint grid"
                        aria-rowcount={tilemap.height}
                        aria-colcount={tilemap.width}
                    >
                        {Array.from({ length: tilemap.height }, (_, y) => (
                            <div
                                key={y}
                                className="grid gap-px bg-border"
                                role="row"
                                style={{ gridTemplateColumns: `repeat(${tilemap.width}, 24px)` }}
                            >
                                {tilemap.data.slice(y * tilemap.width, (y + 1) * tilemap.width).map((value, x) => {
                                    const cellIndex = y * tilemap.width + x;
                                    const cellMetadata = tilemap.cellMetadata?.[String(cellIndex)] ?? {};
                                    const tileMetadata = tilemap.metadata?.[String(value)] ?? {};
                                    const collision = cellMetadata.collision ?? tileMetadata.collision;
                                    const walkable = cellMetadata.walkable ?? tileMetadata.walkable;
                                    const terrain = cellMetadata.terrain ?? tileMetadata.terrain;
                                    const slowdown = cellMetadata.slowdown ?? tileMetadata.slowdown;
                                    const movementCost = cellMetadata.movementCost ?? tileMetadata.movementCost;
                                    const metadataDescriptions = [
                                        collision === undefined ? '' : `${collision ? 'solid' : 'non-solid'} collision (${cellMetadata.collision === undefined ? 'tile default' : 'cell override'})`,
                                        walkable === undefined ? '' : `${walkable ? 'walkable' : 'blocked'} (${cellMetadata.walkable === undefined ? 'tile default' : 'cell override'})`,
                                        terrain ? `terrain ${terrain} (${cellMetadata.terrain === undefined ? 'tile default' : 'cell override'})` : '',
                                        slowdown === undefined ? '' : `slowdown ${slowdown} (${cellMetadata.slowdown === undefined ? 'tile default' : 'cell override'})`,
                                        movementCost === undefined ? '' : `movement cost ${movementCost} (${cellMetadata.movementCost === undefined ? 'tile default' : 'cell override'})`
                                    ].filter(Boolean);
                                    const metadataMarkers = [
                                        ...(collision === undefined ? [] : [{
                                            kind: 'collision', value: String(collision), text: collision ? '■' : '□',
                                            title: `Collision: ${collision ? 'solid' : 'non-solid'}`,
                                            className: collision ? 'text-red-400' : 'text-slate-400'
                                        }]),
                                        ...(walkable === undefined ? [] : [{
                                            kind: 'walkability', value: String(walkable), text: walkable ? 'W' : '×',
                                            title: `Navigation: ${walkable ? 'walkable' : 'blocked'}`,
                                            className: walkable ? 'text-emerald-400' : 'text-amber-400'
                                        }]),
                                        ...(terrain ? [{
                                            kind: 'terrain', value: terrain, text: 'T', title: `Terrain: ${terrain}`,
                                            className: 'text-sky-400'
                                        }] : []),
                                        ...(slowdown === undefined ? [] : [{
                                            kind: 'slowdown', value: String(slowdown), text: 'S',
                                            title: `Movement delay: ${slowdown * 100}% extra`,
                                            className: 'text-orange-400'
                                        }]),
                                        ...(movementCost === undefined ? [] : [{
                                            kind: 'movementCost', value: String(movementCost), text: 'C',
                                            title: `Path movement cost: ${movementCost}`,
                                            className: 'text-violet-400'
                                        }])
                                    ];
                                    const metadataDescription = metadataDescriptions.length > 0
                                        ? `; ${metadataDescriptions.join('; ')}`
                                        : '';

                                    return (
                                        <button
                                            key={`${x}:${y}`}
                                            type="button"
                                            role="gridcell"
                                            aria-label={`Paint cell ${x}, ${y}; tile ${value}${metadataDescription}`}
                                            aria-rowindex={y + 1}
                                            aria-colindex={x + 1}
                                            aria-selected={selectedCell?.x === x && selectedCell?.y === y}
                                            title={`(${x}, ${y}) = ${value}${metadataDescription}`}
                                            tabIndex={selectedCell
                                                ? selectedCell.x === x && selectedCell.y === y ? 0 : -1
                                                : x === 0 && y === 0 ? 0 : -1}
                                            className="flex h-6 w-6 flex-col items-center justify-center bg-card text-[9px] leading-none hover:bg-primary/30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
                                            disabled={brushMode === 'tile' && paintingBlocked}
                                            onFocus={() => setSelectedCell({ x, y })}
                                            onKeyDown={(event) => handleGridCellKeyDown(event, x, y)}
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                setIsPainting(true);
                                                applyBrush(x, y);
                                            }}
                                            onMouseEnter={() => { if (isPainting) applyBrush(x, y); }}
                                            onClick={() => applyBrush(x, y)}
                                        >
                                            {metadataMarkers.length > 0 && (
                                                <span className="flex h-2 items-center justify-center gap-0.5 text-[6px] font-bold" aria-hidden="true">
                                                    {metadataMarkers.map(marker => (
                                                        <span
                                                            key={marker.kind}
                                                            data-metadata-indicator={marker.kind}
                                                            data-metadata-value={marker.value}
                                                            title={marker.title}
                                                            className={marker.className}
                                                        >
                                                            {marker.text}
                                                        </span>
                                                    ))}
                                                </span>
                                            )}
                                            <span>{value}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">Choose an existing .map asset to paint tile IDs.</p>
            )}
        </section>
    );
}
