
/**
 * @class Color
 * @classdsc Represents a color.
 * @param {number} r - Red value of the color.
 * @param {number} g - Green value of the color.
 * @param {number} b - Blue value of the color.
 * @param {number} a=1 - Alpha value of the color.
 */
export class Color {

    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * Generate Color from A Hexadecimal string.
     * @param {number} hex=0x000000 - The hex value of the color.
     * @returns  {Color} The color.
     */
    static FromHex(hex = 0x000000) {
        let r = hex >> 16 & 255;
        let g = hex >> 8 & 255;
        let b = hex & 255;
        return new Color(r, g, b, 1);
    }

    /**
     * Generate a color from RGB values.
     * @param {number} r - Red value of the color.
     * @param {number} g - Green value of the color.
     * @param {number} b - Blue value of the color.
     * @returns {Color} The color.
     */
    static FromRGB(r, g, b) {
        return new Color(r, g, b, 1);
    }

    /**
     * Generate a color from RGBA values.
     * @param {number} r - Red value of the color.
     * @param {number} g - Green value of the color.
     * @param {number} b - Blue value of the color.
     * @param {number} a - Blue value of the color.
     * @returns {Color} The color.
     */
    static FromRGBA(r, g, b, a) {
        return new Color(r, g, b, a);
    }

    /**
     * Generate a color from HSL values.
     * @param {number} h - Hue value of the color.
     * @param {number} s - Saturation value of the color.
     * @param {number} l - Lightness value of the color.
     * @returns {Color} The color.
     * @see https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
     */
    static FromHSL(h, s, l) {
        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs(h / 60 % 2 - 1));
        let m = l - c / 2;
        let r, g, b;
        if (h >= 0 && h < 60) {
            r = c;
            g = x;
            b = 0;
        }
        else if (h >= 60 && h < 120) {
            r = x;
            g = c;
            b = 0;
        }
        else if (h >= 120 && h < 180) {
            r = 0;
            g = c;
            b = x;
        }
        else if (h >= 180 && h < 240) {
            r = 0;
            g = x;
            b = c;
        }
        else if (h >= 240 && h < 300) {
            r = x;
            g = 0;
            b = c;
        }
        else if (h >= 300 && h < 360) {
            r = c;
            g = 0;
            b = x;
        }
        return new Color(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), 1);
    }

    /**
     * Generate a Random Color.
     * @returns {Color} The color.
     */
    static Random() {
        return new Color(Math.random() * 255, Math.random() * 255, Math.random() * 255, 1);
    }
    
    /**
     * Convert the color into RGB javascript string. 
     * `rgba(r,g,b,a)` or `rgb(r,g,b)`.
     * @returns {string} The color in RGB format.
     * 
     */
    toString() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
}


Color.aliceblue = Color.FromHex(0xf0f8ff);
Color.antiquewhite = Color.FromHex(0xfaebd7);
Color.aqua = Color.FromHex(0x00ffff);
Color.aquamarine = Color.FromHex(0x7fffd4);
Color.azure = Color.FromHex(0xf0ffff);
Color.beige = Color.FromHex(0xf5f5dc);
Color.bisque = Color.FromHex(0xffe4c4);
Color.black = Color.FromHex(0x000000);
Color.blanchedalmond = Color.FromHex(0xffebcd);
Color.blue = Color.FromHex(0x0000ff);
Color.blueviolet = Color.FromHex(0x8a2be2);
Color.brown = Color.FromHex(0xa52a2a);
Color.burlywood = Color.FromHex(0xdeb887);
Color.cadetblue = Color.FromHex(0x5f9ea0);
Color.chartreuse = Color.FromHex(0x7fff00);
Color.chocolate = Color.FromHex(0xd2691e);
Color.coral = Color.FromHex(0xff7f50);
Color.cornflowerblue = Color.FromHex(0x6495ed);
Color.cornsilk = Color.FromHex(0xfff8dc);
Color.crimson = Color.FromHex(0xdc143c);
Color.cyan = Color.FromHex(0x00ffff);
Color.darkblue = Color.FromHex(0x00008b);
Color.darkcyan = Color.FromHex(0x008b8b);
Color.darkgoldenrod = Color.FromHex(0xb8860b);
Color.darkgray = Color.FromHex(0xa9a9a9);
Color.darkgreen = Color.FromHex(0x006400);
Color.darkgrey = Color.FromHex(0xa9a9a9);
Color.darkkhaki = Color.FromHex(0xbdb76b);
Color.darkmagenta = Color.FromHex(0x8b008b);
Color.darkolivegreen = Color.FromHex(0x556b2f);
Color.darkorange = Color.FromHex(0xff8c00);
Color.darkorchid = Color.FromHex(0x9932cc);
Color.darkred = Color.FromHex(0x8b0000);
Color.darksalmon = Color.FromHex(0xe9967a);
Color.darkseagreen = Color.FromHex(0x8fbc8f);
Color.darkslateblue = Color.FromHex(0x483d8b);
Color.darkslategray = Color.FromHex(0x2f4f4f);
Color.darkslategrey = Color.FromHex(0x2f4f4f);
Color.darkturquoise = Color.FromHex(0x00ced1);
Color.darkviolet = Color.FromHex(0x9400d3);
Color.deeppink = Color.FromHex(0xff1493);
Color.deepskyblue = Color.FromHex(0x00bfff);
Color.dimgray = Color.FromHex(0x696969);
Color.dimgrey = Color.FromHex(0x696969);
Color.dodgerblue = Color.FromHex(0x1e90ff);
Color.firebrick = Color.FromHex(0xb22222);
Color.floralwhite = Color.FromHex(0xfffaf0);
Color.forestgreen = Color.FromHex(0x228b22);
Color.fuchsia = Color.FromHex(0xff00ff);
Color.gainsboro = Color.FromHex(0xdcdcdc);
Color.ghostwhite = Color.FromHex(0xf8f8ff);
Color.gold = Color.FromHex(0xffd700);
Color.goldenrod = Color.FromHex(0xdaa520);
Color.gray = Color.FromHex(0x808080);
Color.green = Color.FromHex(0x008000);
Color.greenyellow = Color.FromHex(0xadff2f);
Color.grey = Color.FromHex(0x808080);
Color.honeydew = Color.FromHex(0xf0fff0);
Color.hotpink = Color.FromHex(0xff69b4);
Color.indianred = Color.FromHex(0xcd5c5c);
Color.indigo = Color.FromHex(0x4b0082);
Color.ivory = Color.FromHex(0xfffff0);
Color.khaki = Color.FromHex(0xf0e68c);
Color.lavender = Color.FromHex(0xe6e6fa);
Color.lavenderblush = Color.FromHex(0xfff0f5);
Color.lawngreen = Color.FromHex(0x7cfc00);
Color.lemonchiffon = Color.FromHex(0xfffacd);
Color.lightblue = Color.FromHex(0xadd8e6);
Color.lightcoral = Color.FromHex(0xf08080);
Color.lightcyan = Color.FromHex(0xe0ffff);
Color.lightgoldenrodyellow = Color.FromHex(0xfafad2);
Color.lightgray = Color.FromHex(0xd3d3d3);
Color.lightgreen = Color.FromHex(0x90ee90);
Color.lightgrey = Color.FromHex(0xd3d3d3);
Color.lightpink = Color.FromHex(0xffb6c1);
Color.lightsalmon = Color.FromHex(0xffa07a);
Color.lightseagreen = Color.FromHex(0x20b2aa);
Color.lightskyblue = Color.FromHex(0x87cefa);
Color.lightslategray = Color.FromHex(0x778899);
Color.lightsteelblue = Color.FromHex(0xb0c4de);
Color.lightyellow = Color.FromHex(0xffffe0);
Color.lime = Color.FromHex(0x00ff00);
Color.limegreen = Color.FromHex(0x32cd32);
Color.linen = Color.FromHex(0xfaf0e6);
Color.magenta = Color.FromHex(0xff00ff);
Color.maroon = Color.FromHex(0x800000);
Color.mediumaquamarine = Color.FromHex(0x66cdaa);
Color.mediumblue = Color.FromHex(0x0000cd);
Color.mediumorchid = Color.FromHex(0xba55d3);
Color.mediumpurple = Color.FromHex(0x9370db);
Color.mediumseagreen = Color.FromHex(0x3cb371);
Color.mediumslateblue = Color.FromHex(0x7b68ee);
Color.mediumspringgreen = Color.FromHex(0x00fa9a);
Color.mediumturquoise = Color.FromHex(0x48d1cc);
Color.mediumvioletred = Color.FromHex(0xc71585);
Color.midnightblue = Color.FromHex(0x191970);
Color.mintcream = Color.FromHex(0xf5fffa);
Color.mistyrose = Color.FromHex(0xffe4e1);
Color.moccasin = Color.FromHex(0xffe4b5);
Color.navajowhite = Color.FromHex(0xffdead);
Color.navy = Color.FromHex(0x000080);
Color.oldlace = Color.FromHex(0xfdf5e6);
Color.olive = Color.FromHex(0x808000);
Color.olivedrab = Color.FromHex(0x6b8e23);
Color.orange = Color.FromHex(0xffa500);
Color.orangered = Color.FromHex(0xff4500);
Color.orchid = Color.FromHex(0xda70d6);
Color.palegoldenrod = Color.FromHex(0xeee8aa);
Color.palegreen = Color.FromHex(0x98fb98);
Color.paleturquoise = Color.FromHex(0xafeeee);
Color.palevioletred = Color.FromHex(0xdb7093);
Color.papayawhip = Color.FromHex(0xffefd5);
Color.peachpuff = Color.FromHex(0xffdab9);
Color.peru = Color.FromHex(0xcd853f);
Color.pink = Color.FromHex(0xffc0cb);
Color.plum = Color.FromHex(0xdda0dd);
Color.powderblue = Color.FromHex(0xb0e0e6);
Color.purple = Color.FromHex(0x800080);
Color.red = Color.FromHex(0xff0000);
Color.rosybrown = Color.FromHex(0xbc8f8f);
Color.royalblue = Color.FromHex(0x4169e1);
Color.saddlebrown = Color.FromHex(0x8b4513);
Color.salmon = Color.FromHex(0xfa8072);
Color.sandybrown = Color.FromHex(0xf4a460);
Color.seagreen = Color.FromHex(0x2e8b57);
Color.seashell = Color.FromHex(0xfff5ee);
Color.sienna = Color.FromHex(0xa0522d);
Color.silver = Color.FromHex(0xc0c0c0);
Color.skyblue = Color.FromHex(0x87ceeb);
Color.slateblue = Color.FromHex(0x6a5acd);
Color.slategray = Color.FromHex(0x708090);
Color.snow = Color.FromHex(0xfffafa);
Color.springgreen = Color.FromHex(0x00ff7f);
Color.steelblue = Color.FromHex(0x4682b4);
Color.tan = Color.FromHex(0xd2b48c);
Color.teal = Color.FromHex(0x008080);
Color.thistle = Color.FromHex(0xd8bfd8);
Color.tomato = Color.FromHex(0xff6347);
Color.turquoise = Color.FromHex(0x40e0d0);
Color.violet = Color.FromHex(0x8f00ff);
Color.wheat = Color.FromHex(0xf5deb3);
Color.white = Color.FromHex(0xffffff);
Color.whitesmoke = Color.FromHex(0xf5f5f5);
Color.yellow = Color.FromHex(0xffff00);
Color.yellowgreen = Color.FromHex(0x9acd32);