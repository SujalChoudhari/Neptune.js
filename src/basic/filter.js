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
