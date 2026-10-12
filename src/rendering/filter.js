
/**
 * A class representing a filter.
 * @class Filter
 * @classdesc A class representing a filter.
 */
export class Filter {
    constructor() {
        this.filters = [];
    }

    /**
     * Add a new filter to the list.
     * @param {string} type - The type of the filter.
     * @param {...number} values - Filter values.
     */
    Add(type, ...values) {
        this.filters.push({
            type,
            values
        });
    }

    /**
     * Remove a filter from the list.
     * @param {string} type - The type of the filter.
     * @param {...number} values - Filter values.
     */
    Remove(type) {
        this.filters = this.filters.filter(filter => filter.type !== type);
    }


    /**
     * Apply the filters to a canvas context.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    toString(ctx) {
        const filterString = this.filters.map(filter => {
            const values = filter.values.join(', ');
            return `${filter.type}(${values})`;
        }).join(' ');

        return filterString;
    }
}


/**
 * @enum {string}
 * @readonly
 * @protected
 * @memberof Filter
 * @property {string} NONE - No filter.
 * @property {string} GRAYSCALE - Grayscale filter.
 * @property {string} SEPIA - Sepia filter.
 * @property {string} INVERT - Invert filter.
 * @property {string} BRIGHTNESS - Brightness filter.
 * @property {string} CONTRAST - Contrast filter.
 * @property {string} BLUR - Blur filter.
 * @property {string} HUE_ROTATE - Hue rotate filter.
 * @property {string} SATURATE - Saturate filter.
 * @property {string} OPACITY - Opacity filter.
 * @property {string} DROP_SHADOW - Drop shadow filter.
 */
Filter.TYPE = {
    NONE: "none",
    GRAYSCALE: "grayscale",
    SEPIA: "sepia",
    INVERT: "invert",
    BRIGHTNESS: "brightness",
    CONTRAST: "contrast",
    BLUR: "blur",
    HUE_ROTATE: "hue-rotate",
    SATURATE: "saturate",
    OPACITY: "opacity",
    DROP_SHADOW: "drop-shadow"
}
