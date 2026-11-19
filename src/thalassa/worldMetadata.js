import { Component } from "../components/component.js";

/**
 * Validates finite number.
 * @param {number} value
 * @param {string} name
 * @param {number} [min=0]
 * @returns {number}
 */
function finiteNumber(value, name, min = 0) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
        throw new TypeError(`${name} must be a finite number >= ${min}`);
    }
    return value;
}

/**
 * Validates non-empty string.
 * @param {string} value
 * @param {string} name
 * @returns {string}
 */
function nonEmptyString(value, name) {
    if (typeof value !== "string" || !value.trim()) {
        throw new TypeError(`${name} must be a non-empty string`);
    }
    return value.trim();
}

/** Standard semantic tile types for world definitions */
export const SEMANTIC_LAYER_TYPES = Object.freeze(["visual", "collision", "elevation", "zones", "materials"]);

/**
 * Registry and validator for multi-layer world maps, semantic tiles, elevation, and zones.
 */
export class WorldMetadataRegistry extends Component {
    constructor() {
        super();
        this.tileDefinitions = new Map(); // tileId -> metadata
        this.layers = new Map();          // layerId -> layer object
        this.zones = new Map();           // zoneId -> zone object
    }

    /**
     * Register semantic metadata for a tile type.
     * @param {number|string} tileId
     * @param {Object} metadata
     * @param {string} [metadata.name]
     * @param {boolean} [metadata.walkable=true]
     * @param {string} [metadata.material="stone"] SIM-01 material name
     * @param {number} [metadata.traversalCost=1.0]
     * @param {number} [metadata.elevation=0]
     * @param {boolean} [metadata.climbable=false]
     * @param {Object} [metadata.hazard=null]
     * @param {Object} [metadata.interaction=null]
     * @returns {Object} Registered definition
     */
    registerTile(tileId, metadata = {}) {
        if (tileId === undefined || tileId === null) {
            throw new TypeError("tileId is required");
        }
        if (typeof metadata !== "object" || Array.isArray(metadata)) {
            throw new TypeError("Tile metadata must be an object");
        }

        const walkable = metadata.walkable !== false;
        const material = metadata.material ? nonEmptyString(metadata.material, "material") : "stone";
        let traversalCost = 1.0;
        if (metadata.traversalCost !== undefined) {
            if (metadata.traversalCost === Infinity) {
                traversalCost = Infinity;
            } else {
                traversalCost = finiteNumber(metadata.traversalCost, "traversalCost", 0);
            }
        }
        const elevation = metadata.elevation !== undefined ? finiteNumber(metadata.elevation, "elevation", 0) : 0;
        const climbable = Boolean(metadata.climbable);

        const def = {
            id: tileId,
            name: metadata.name ?? `Tile_${tileId}`,
            walkable,
            material,
            traversalCost,
            elevation,
            climbable,
            hazard: metadata.hazard ? { ...metadata.hazard } : null,
            interaction: metadata.interaction ? { ...metadata.interaction } : null
        };

        this.tileDefinitions.set(tileId, def);
        return def;
    }

    /**
     * Get tile metadata definition.
     * Throws an Error if tileId is unknown.
     * @param {number|string} tileId
     * @returns {Object}
     */
    getTile(tileId) {
        if (!this.tileDefinitions.has(tileId)) {
            throw new Error(`Unknown tile id: ${tileId}. No semantic metadata registered for this tile.`);
        }
        return this.tileDefinitions.get(tileId);
    }

    /**
     * Check if a tile ID is registered.
     * @param {number|string} tileId
     * @returns {boolean}
     */
    hasTile(tileId) {
        return this.tileDefinitions.has(tileId);
    }

    /**
     * Add a layer to the world metadata registry.
     * @param {Object} layer
     * @param {string} layer.id Unique layer ID
     * @param {string} [layer.name] Display name
     * @param {string} [layer.type="visual"] 'visual'|'collision'|'elevation'|'zones'|'materials'
     * @param {number} [layer.elevation=0] Base elevation for layer
     * @param {number} [layer.zIndex=0] Drawing / evaluation priority
     * @param {number} [layer.width=10]
     * @param {number} [layer.height=10]
     * @param {Array<Array<number>>} [layer.data] 2D grid of tile IDs
     * @returns {Object} Layer record
     */
    addLayer(layer) {
        if (!layer || typeof layer !== "object") throw new TypeError("Layer must be an object");
        const id = nonEmptyString(layer.id, "layer.id");
        const type = layer.type ?? "visual";
        if (!SEMANTIC_LAYER_TYPES.includes(type)) {
            throw new TypeError(`Invalid layer type: ${type}. Must be one of: ${SEMANTIC_LAYER_TYPES.join(", ")}`);
        }

        const elevation = layer.elevation !== undefined ? finiteNumber(layer.elevation, "layer.elevation", 0) : 0;
        const zIndex = layer.zIndex !== undefined ? Number(layer.zIndex) : 0;
        const width = layer.width !== undefined ? finiteNumber(layer.width, "layer.width", 1) : 10;
        const height = layer.height !== undefined ? finiteNumber(layer.height, "layer.height", 1) : 10;

        // Clone or create grid data
        let data;
        if (Array.isArray(layer.data)) {
            data = layer.data.map(row => Array.isArray(row) ? [...row] : new Array(width).fill(null));
        } else {
            data = Array.from({ length: height }, () => new Array(width).fill(null));
        }

        const layerRecord = {
            id,
            name: layer.name ?? id,
            type,
            elevation,
            zIndex,
            width,
            height,
            visible: layer.visible !== false,
            data
        };

        this.layers.set(id, layerRecord);
        return layerRecord;
    }

    /**
     * Get a layer by ID. Throws if layer does not exist.
     * @param {string} layerId
     * @returns {Object}
     */
    getLayer(layerId) {
        nonEmptyString(layerId, "layerId");
        if (!this.layers.has(layerId)) {
            throw new Error(`Missing layer: ${layerId}. Layer has not been added to WorldMetadataRegistry.`);
        }
        return this.layers.get(layerId);
    }

    /**
     * Set a tile in a layer at specific grid coordinate.
     * @param {string} layerId
     * @param {number} x Grid X
     * @param {number} y Grid Y
     * @param {number|string|null} tileId
     */
    setTileAt(layerId, x, y, tileId) {
        const layer = this.getLayer(layerId);
        if (x < 0 || x >= layer.width || y < 0 || y >= layer.height) {
            throw new RangeError(`Coordinates (${x}, ${y}) out of layer bounds [${layer.width}x${layer.height}]`);
        }
        if (tileId !== null && !this.tileDefinitions.has(tileId)) {
            throw new Error(`Cannot place unknown tile: ${tileId}`);
        }
        layer.data[y][x] = tileId;
    }

    /**
     * Register a semantic zone (e.g. safe area, dungeon entrance, hazard field).
     * @param {Object} zoneConfig
     * @param {string} zoneConfig.id Unique zone ID
     * @param {string} [zoneConfig.name]
     * @param {string} [zoneConfig.type="region"]
     * @param {Object} zoneConfig.bounds { left, right, top, bottom }
     * @param {number} [zoneConfig.elevation=0]
     * @param {number} [zoneConfig.height=2]
     * @param {Object} [zoneConfig.metadata={}]
     * @returns {Object} Registered zone
     */
    addZone(zoneConfig) {
        if (!zoneConfig || typeof zoneConfig !== "object") throw new TypeError("zoneConfig must be an object");
        const id = nonEmptyString(zoneConfig.id, "zoneConfig.id");
        if (!zoneConfig.bounds || !Number.isFinite(zoneConfig.bounds.left)) {
            throw new TypeError("Zone requires bounds { left, right, top, bottom }");
        }

        const elevation = zoneConfig.elevation !== undefined ? finiteNumber(zoneConfig.elevation, "zoneConfig.elevation", 0) : 0;
        const height = zoneConfig.height !== undefined ? finiteNumber(zoneConfig.height, "zoneConfig.height", 0.001) : 2;

        const zone = {
            id,
            name: zoneConfig.name ?? id,
            type: zoneConfig.type ?? "region",
            bounds: { ...zoneConfig.bounds },
            elevation,
            height,
            metadata: { ...(zoneConfig.metadata ?? {}) }
        };

        this.zones.set(id, zone);
        return zone;
    }

    /**
     * Get all zones containing world position (x, y) with matching elevation interval.
     * @param {number} x
     * @param {number} y
     * @param {number} [elevation=0]
     * @returns {Array<Object>}
     */
    getZonesAt(x, y, elevation = 0) {
        const matches = [];
        for (const zone of this.zones.values()) {
            if (x >= zone.bounds.left && x <= zone.bounds.right &&
                y >= zone.bounds.top && y <= zone.bounds.bottom) {
                // Check elevation overlap: [zone.elevation, zone.elevation + zone.height]
                if (elevation >= zone.elevation && elevation <= zone.elevation + zone.height) {
                    matches.push(zone);
                }
            }
        }
        return matches;
    }

    /**
     * Resolve composite metadata at coordinate (x, y) across all layers with override conflict resolution.
     * Higher zIndex layers override lower zIndex layers for collision/walkability and material.
     * Explicit collision layer takes precedence over visual layer.
     *
     * @param {number} x Grid X
     * @param {number} y Grid Y
     * @returns {Object} Composite tile metadata
     */
    getComposedMetadataAt(x, y) {
        finiteNumber(x, "x");
        finiteNumber(y, "y");

        // Sort layers by zIndex ascending
        const sortedLayers = [...this.layers.values()].sort((a, b) => a.zIndex - b.zIndex);

        let walkable = true;
        let material = "stone";
        let traversalCost = 1.0;
        let elevation = 0;
        let hazard = null;
        let interaction = null;
        let climbable = false;
        let hasTile = false;

        for (const layer of sortedLayers) {
            if (x < 0 || x >= layer.width || y < 0 || y >= layer.height) continue;
            const tileId = layer.data[y]?.[x];
            if (tileId === null || tileId === undefined) continue;

            const tileDef = this.tileDefinitions.get(tileId);
            if (!tileDef) continue;

            hasTile = true;

            // Handle override conflict: collision layer strictly determines walkability
            if (layer.type === "collision") {
                walkable = tileDef.walkable;
            } else if (layer.zIndex > 0 || !tileDef.walkable) {
                // Higher zIndex overrides walkable state if explicitly non-walkable
                if (!tileDef.walkable) walkable = false;
            }

            // Material override
            if (tileDef.material) {
                material = tileDef.material;
            }

            // Traversal cost
            if (tileDef.traversalCost !== undefined) {
                traversalCost = tileDef.traversalCost;
            }

            // Elevation composition: base layer elevation + tile elevation
            elevation = Math.max(elevation, layer.elevation + tileDef.elevation);

            if (tileDef.hazard) hazard = tileDef.hazard;
            if (tileDef.interaction) interaction = tileDef.interaction;
            if (tileDef.climbable) climbable = true;
        }

        return {
            hasTile,
            walkable,
            material,
            traversalCost,
            elevation,
            climbable,
            hazard,
            interaction
        };
    }

    toJSON() {
        return {
            tileDefinitions: Array.from(this.tileDefinitions.entries()),
            layers: Array.from(this.layers.values()).map(l => ({
                id: l.id,
                name: l.name,
                type: l.type,
                elevation: l.elevation,
                zIndex: l.zIndex,
                width: l.width,
                height: l.height,
                visible: l.visible,
                data: l.data
            })),
            zones: Array.from(this.zones.values())
        };
    }

    static fromJSON(json) {
        const registry = new WorldMetadataRegistry();
        if (json && Array.isArray(json.tileDefinitions)) {
            for (const [id, def] of json.tileDefinitions) {
                registry.registerTile(id, def);
            }
        }
        if (json && Array.isArray(json.layers)) {
            for (const layer of json.layers) {
                registry.addLayer(layer);
            }
        }
        if (json && Array.isArray(json.zones)) {
            for (const zone of json.zones) {
                registry.addZone(zone);
            }
        }
        return registry;
    }
}
