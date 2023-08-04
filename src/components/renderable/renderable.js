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
    constructor() {
        super();
    }

    /** @private */
    draw(ctx) {

    }
}