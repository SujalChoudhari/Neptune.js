import { Filter } from "./filter.js";
import { Component } from "../components/component.js";

const activeRenderablePasses = new WeakMap();

export function withRenderablePass(ctx, draw) {
    if (!ctx || (typeof ctx !== "object" && typeof ctx !== "function")) return draw();
    if (activeRenderablePasses.has(ctx)) return draw();

    activeRenderablePasses.set(ctx, { traversedEntities: new WeakSet() });
    try {
        return draw();
    } finally {
        activeRenderablePasses.delete(ctx);
    }
}

/**
 * Donot use this class directly. Use Inheritance instead.
 * This is a base class for all components that can be rendered, such as sprites, text, etc. 
 * These components are identified by the renderer and rendered accordingly.
 * Renderables are components that can be rendered to the screen.
 * Every renderable inherits from this class.
 * @class Renderable
 * @extends Component
 * @interface
 * 
 * @property {BLEND_MODE} blendMode=Renderable.BLEND_MODE.NORMAL - Blend mode of the object.
 * @property {Filter} filter - The filter applied to the object.
 * @property {number} renderOrder=0 - Lower values draw first within the current scene or renderable-parent pass;
 * a renderable draws before its descendants.
 */
export class Renderable extends Component {
    /** Blend mode of the object */
    blendMode = Renderable.BLEND_MODE.NORMAL;
    /** The filter applied to the object */
    filter = new Filter();
    constructor() {
        super();
        this._properties.renderOrder = 0;
    }

    get properties() {
        if (this._properties && !Number.isFinite(this._properties.renderOrder)) {
            this._properties.renderOrder = 0;
        }
        return this._properties;
    }

    get renderOrder() {
        return Number.isFinite(this._properties?.renderOrder) ? this._properties.renderOrder : 0;
    }

    set renderOrder(value) {
        this._properties.renderOrder = value;
    }

    /** Draw this entity's nested renderables in deterministic order. @protected */
    drawChildren(ctx) {
        const pass = ctx && activeRenderablePasses.get(ctx);
        if (pass && this.entity) {
            if (pass.traversedEntities.has(this.entity)) return;
            pass.traversedEntities.add(this.entity);
        }
        for (const renderable of sortRenderables(collectRenderableRoots(this.entity))) {
            renderable.draw(ctx);
        }
    }

    /** @private */
    draw(ctx) {

    }
}

/** Collect top-level renderables, descending through non-renderable layer entities. */
export function collectRenderableRoots(entity) {
    const renderables = [];
    if (!entity || entity.active === false) return renderables;
    const visited = new Set(entity ? [entity] : []);
    const stack = [...(entity?.children || [])].reverse();

    while (stack.length > 0) {
        const child = stack.pop();
        if (!child || visited.has(child)) continue;
        visited.add(child);
        if (child.active === false) continue;

        const childRenderables = (child.components || []).filter(component =>
            component instanceof Renderable && component.properties?.enabled !== false && component.enabled !== false);
        if (childRenderables.length > 0) {
            renderables.push(...childRenderables);
            continue;
        }

        for (const nestedChild of [...(child.children || [])].reverse()) {
            stack.push(nestedChild);
        }
    }

    return renderables;
}

/** Stable scene-local sort: finite renderOrder first, then original traversal order. */
export function sortRenderables(renderables) {
    return renderables
        .map((renderable, insertionOrder) => ({ renderable, insertionOrder }))
        .sort((a, b) => {
            const orderA = Number.isFinite(a.renderable.renderOrder) ? a.renderable.renderOrder : 0;
            const orderB = Number.isFinite(b.renderable.renderOrder) ? b.renderable.renderOrder : 0;
            return orderA - orderB || a.insertionOrder - b.insertionOrder;
        })
        .map(({ renderable }) => renderable);
}

/**
 * Available blend modes for the renderable.
 * @readonly
 * @enum {string}
 */
Renderable.BLEND_MODE = {
    NORMAL: 'source-over',
    MULTIPLY: 'multiply',
    SCREEN: 'screen',
    OVERLAY: 'overlay',
    DARKEN: 'darken',
    LIGHTEN: 'lighten',
    COLOR_DODGE: 'color-dodge',
    COLOR_BURN: 'color-burn',
    HARD_LIGHT: 'hard-light',
    SOFT_LIGHT: 'soft-light',
    DIFFERENCE: 'difference',
    EXCLUSION: 'exclusion',
    HUE: 'hue',
    SATURATION: 'saturation',
    COLOR: 'color',
    LUMINOSITY: 'luminosity',
};