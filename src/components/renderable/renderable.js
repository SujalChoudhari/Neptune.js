import { Component } from "../component.js";

export class Renderable extends Component {
    constructor() {
        super();
    }

    draw(ctx) {
        throw new Error("Draw function not implemented");
    }
}