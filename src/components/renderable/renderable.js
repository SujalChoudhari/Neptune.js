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
 */
export class Renderable extends Component {
    /** Blend mode of the object */
    blendMode = "source-over";
    constructor() {
        super();
    }

    /** @private */
    draw(ctx) {
        
    }
}

/**
 * Available blend modes for the renderable.
 */
Renderable.BLEND_MODES = {
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