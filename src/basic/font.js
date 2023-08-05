import { Maths } from "../maths/math.js"

export class Font {
    #family;
    #size;
    #style;
    #weight;
    constructor(family = "Arial", size = 30, style = Font.STYLE_NORMAL, weight = Font.WEIGHT_NORMAL) {
        this.#family = family;
        this.#size = size;
        this.#style = style;
        this.#weight = weight;
    }

    get family() {
        return this.#family;
    }

    set family(family) {
        this.#family = family;
    }

    get size() {
        return this.#size;
    }

    set size(size) {
        this.#size = size;
    }

    get style() {
        return this.#style;
    }

    set style(style) {
        this.#style = style;
    }

    get weight() {
        return this.#weight;
    }

    set weight(weight) {
        this.#weight = weight;
    }

    toString() {
        return `${this.#style} ${this.#weight} ${this.#size}px ${this.#family}`;
    }
}