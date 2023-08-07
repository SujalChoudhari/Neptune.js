import { Filter } from "../../basic/filter.js";
import { Component } from "../component.js";

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
 */
export class Renderable extends Component {
    /** Blend mode of the object */
    blendMode = Renderable.BLEND_MODE.NORMAL;
    /** The filter applied to the object */
    filter = new Filter();
    constructor() {
        super();
    }

    /** @private */
    draw(ctx) {
        
    }
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