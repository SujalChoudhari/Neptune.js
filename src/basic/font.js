import { Maths } from "../maths/math.js"

/**
 * A Font class to store font information.
 * @class Font
 * @property {string} family - The font family.
 * @property {number} size - The font size.
 * @property {Font.STYLE} style - The font style.
 * @property {Font.WEIGHT} weight - The font weight.
 * 
 */
export class Font {
    #family;
    #size;
    #style;
    #weight;
    constructor(family = "Arial", size = 2, style = Font.STYLE.NORMAL, weight = Font.WEIGHT.NORMAL) {
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

    /**
     * Returns the font as a string.
     * @returns {string} The font as a string.
     */
    toString() {
        return `${this.#style} ${this.#weight} ${this.#size}px ${this.#family}`;
    }
}

/**
 * Font style.
 * @readonly
 * @enum {string}
 */
Font.STYLE = {
    NORMAL: "normal",
    ITALIC: "italic",
    OBLIQUE: "oblique"
}

/**
 * Font weight.
 * @readonly
 * @enum {string}
 */
Font.WEIGHT = {
    NORMAL: "normal",
    BOLD: "bold",
    BOLDER: "bolder",
    LIGHTER: "lighter"
}