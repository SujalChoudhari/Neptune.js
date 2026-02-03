/**
 * Utility functions for color manipulation and conversion.
 */

export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * Converts an RGBA object to a Hex string.
 * Handles both 0-1 and 0-255 ranges gracefully (assumes 0-255 if any value > 1).
 */
export const rgbaToHex = (color: RGBA): string => {
    let { r, g, b, a } = color;

    // Detect if range is 0-1 or 0-255
    // If any component is > 1, assume 0-255.
    // However, if all are <= 1, it might be 0-1.
    // Standardizing on 0-255 for hex conversion.
    if (r <= 1 && g <= 1 && b <= 1 && a <= 1 && (r > 0 || g > 0 || b > 0)) {
        r *= 255;
        g *= 255;
        b *= 255;
        // a is usually kept as 0-1 for alpha, but hex expects 0-255 for alpha channel
    }

    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    const rHex = toHex(r);
    const gHex = toHex(g);
    const bHex = toHex(b);

    // Alpha is optional in some contexts, but let's include it if it's not 1
    if (a < 1) {
        const aHex = toHex(a * 255);
        return `#${rHex}${gHex}${bHex}${aHex}`;
    }

    return `#${rHex}${gHex}${bHex}`;
};

/**
 * Converts a Hex string to an RGBA object.
 */
export const hexToRgba = (hex: string): RGBA => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return {
            r: (c >> 16) & 255,
            g: (c >> 8) & 255,
            b: c & 255,
            a: 1
        };
    }
    // Handle specific 8-digit hex for alpha
    if (/^#([A-Fa-f0-9]{4}){1,2}$/.test(hex)) {
        // simplified for full length only
        if (hex.length === 9) {
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            const a = parseInt(hex.substring(7, 9), 16) / 255;
            return { r, g, b, a };
        }
    }
    return { r: 255, g: 255, b: 255, a: 1 };
};

export const isValidColor = (strColor: string): boolean => {
    const s = new Option().style;
    s.color = strColor;
    return s.color !== '';
};
