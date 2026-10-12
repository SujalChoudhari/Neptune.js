/**
 * Font class for Text rendering configuration.
 * @class Font
 * @property {number} size - Font size in pixels.
 * @property {string} family - Font family name.
 * @property {string} style - Font style (normal, bold, italic).
 */
export class Font {
    constructor(size = 20, family = "Arial", style = "bold") {
        this.size = size;
        this.family = family;
        this.style = style;
    }

    /**
     * Convert font to CSS font string.
     * @returns {string} CSS font string.
     */
    toString() {
        return `${this.style} ${this.size}px ${this.family}`;
    }
}
