/**
 * @class Color
 * @classdesc A class for handling colors.
 * 
 * @property {Number} r The red component of the color.
 * @property {Number} g The green component of the color.
 * @property {Number} b The blue component of the color.
 * @property {Number} a The alpha component of the color.
 * 
 * 
 * @since 1.0.0
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class Color {

    /**
     * @method
     * @param {Number} r The red component of the color.
     * @param {Number} g The green component of the color.
     * @param {Number} b The blue component of the color.
     * @param {Number} [a=1] The alpha component of the color
     * 
     * @example
     * let color = new Color(255, 0, 0, 1);
     * 
     */
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * @method
     * @static
     * @description Crafts a color from a hexadecimal number.
     * @param {Number} hex - The hexadecimal value of the color (0x000000).
     * @returns {Color} The random color.
     * 
     * @example
     * let color = Color.fromHex(0xFF0000);
     * 
     */
    static fromHex(hex) {
        let r = hex >> 16 & 255;
        let g = hex >> 8 & 255;
        let b = hex & 255;
        return new Color(r, g, b, 1);
    }

    /**
     * @method
     * @static
     * @description Creates a new color from RGB 
     * @param {Number} r -The red component of the color.
     * @param {Number} g -The green component of the color.
     * @param {Number} b -The blue component of the color.
     * @returns  {Color} The new color.
     * 
     * @example
     * let color = Color.fromRGB(255, 0, 0);
     */
    static fromRGB(r, g, b) {
        return new Color(r, g, b, 1);
    }

    /**
     * @method
     * @static
     * @description Creates a new color from RGBA values.
     * @param {Number} r -The red component of the color.
     * @param {Number} g -The green component of the color.
     * @param {Number} b -The blue component of the color.
     * @param {Number} a -The alpha component of the color.
     * @returns  {Color} The new color.
     * 
     * @example
     * let color = Color.fromRGBA(255, 0, 0, 1);
     */
    static fromRGBA(r, g, b, a) {
        return new Color(r, g, b, a);
    }


    /**
     * @method
     * @static
     * @description Creates a new color from HSL values.
     * @param {Number} h - The hue of the color.
     * @param {Number} s - The saturation of the color.
     * @param {Number} l - The lightness of the color.
     * @returns {Color} The new color.
     * 
     * @example
     * let color = Color.fromHSL(0, 0, 0);
     */

    static fromHSL(h, s, l) {
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
     * @method
     * @static
     * @description Creates a random color.
     * @returns {Color} A random color.
     * 
     * @example
     * let color = Color.random();
     */
    static random() {
        return new Color(Math.random() * 255, Math.random() * 255, Math.random() * 255, 1);
    }

    /**
     * @method
     * @description Returns a string representation of the color.
     * @returns {String} The string representation of the color.
     * 
     * @example
     * let color = new Color(255, 0, 0, 255);
     * console.log(color.toString());
     * // => "rgb(255, 0, 0)"
     * 
     */
    toString() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
}


Color.aliceblue = Color.fromHex(0xf0f8ff);
Color.antiquewhite = Color.fromHex(0xfaebd7);
Color.aqua = Color.fromHex(0x00ffff);
Color.aquamarine = Color.fromHex(0x7fffd4);
Color.azure = Color.fromHex(0xf0ffff);
Color.beige = Color.fromHex(0xf5f5dc);
Color.bisque = Color.fromHex(0xffe4c4);
Color.black = Color.fromHex(0x000000);
Color.blanchedalmond = Color.fromHex(0xffebcd);
Color.blue = Color.fromHex(0x0000ff);
Color.blueviolet = Color.fromHex(0x8a2be2);
Color.brown = Color.fromHex(0xa52a2a);
Color.burlywood = Color.fromHex(0xdeb887);
Color.cadetblue = Color.fromHex(0x5f9ea0);
Color.chartreuse = Color.fromHex(0x7fff00);
Color.chocolate = Color.fromHex(0xd2691e);
Color.coral = Color.fromHex(0xff7f50);
Color.cornflowerblue = Color.fromHex(0x6495ed);
Color.cornsilk = Color.fromHex(0xfff8dc);
Color.crimson = Color.fromHex(0xdc143c);
Color.cyan = Color.fromHex(0x00ffff);
Color.darkblue = Color.fromHex(0x00008b);
Color.darkcyan = Color.fromHex(0x008b8b);
Color.darkgoldenrod = Color.fromHex(0xb8860b);
Color.darkgray = Color.fromHex(0xa9a9a9);
Color.darkgreen = Color.fromHex(0x006400);
Color.darkgrey = Color.fromHex(0xa9a9a9);
Color.darkkhaki = Color.fromHex(0xbdb76b);
Color.darkmagenta = Color.fromHex(0x8b008b);
Color.darkolivegreen = Color.fromHex(0x556b2f);
Color.darkorange = Color.fromHex(0xff8c00);
Color.darkorchid = Color.fromHex(0x9932cc);
Color.darkred = Color.fromHex(0x8b0000);
Color.darksalmon = Color.fromHex(0xe9967a);
Color.darkseagreen = Color.fromHex(0x8fbc8f);
Color.darkslateblue = Color.fromHex(0x483d8b);
Color.darkslategray = Color.fromHex(0x2f4f4f);
Color.darkslategrey = Color.fromHex(0x2f4f4f);
Color.darkturquoise = Color.fromHex(0x00ced1);
Color.darkviolet = Color.fromHex(0x9400d3);
Color.deeppink = Color.fromHex(0xff1493);
Color.deepskyblue = Color.fromHex(0x00bfff);
Color.dimgray = Color.fromHex(0x696969);
Color.dimgrey = Color.fromHex(0x696969);
Color.dodgerblue = Color.fromHex(0x1e90ff);
Color.firebrick = Color.fromHex(0xb22222);
Color.floralwhite = Color.fromHex(0xfffaf0);
Color.forestgreen = Color.fromHex(0x228b22);
Color.fuchsia = Color.fromHex(0xff00ff);
Color.gainsboro = Color.fromHex(0xdcdcdc);
Color.ghostwhite = Color.fromHex(0xf8f8ff);
Color.gold = Color.fromHex(0xffd700);
Color.goldenrod = Color.fromHex(0xdaa520);
Color.gray = Color.fromHex(0x808080);
Color.green = Color.fromHex(0x008000);
Color.greenyellow = Color.fromHex(0xadff2f);
Color.grey = Color.fromHex(0x808080);
Color.honeydew = Color.fromHex(0xf0fff0);
Color.hotpink = Color.fromHex(0xff69b4);
Color.indianred = Color.fromHex(0xcd5c5c);
Color.indigo = Color.fromHex(0x4b0082);
Color.ivory = Color.fromHex(0xfffff0);
Color.khaki = Color.fromHex(0xf0e68c);
Color.lavender = Color.fromHex(0xe6e6fa);
Color.lavenderblush = Color.fromHex(0xfff0f5);
Color.lawngreen = Color.fromHex(0x7cfc00);
Color.lemonchiffon = Color.fromHex(0xfffacd);
Color.lightblue = Color.fromHex(0xadd8e6);
Color.lightcoral = Color.fromHex(0xf08080);
Color.lightcyan = Color.fromHex(0xe0ffff);
Color.lightgoldenrodyellow = Color.fromHex(0xfafad2);
Color.lightgray = Color.fromHex(0xd3d3d3);
Color.lightgreen = Color.fromHex(0x90ee90);
Color.lightgrey = Color.fromHex(0xd3d3d3);
Color.lightpink = Color.fromHex(0xffb6c1);
Color.lightsalmon = Color.fromHex(0xffa07a);
Color.lightseagreen = Color.fromHex(0x20b2aa);
Color.lightskyblue = Color.fromHex(0x87cefa);
Color.lightslategray = Color.fromHex(0x778899);
Color.lightsteelblue = Color.fromHex(0xb0c4de);
Color.lightyellow = Color.fromHex(0xffffe0);
Color.lime = Color.fromHex(0x00ff00);
Color.limegreen = Color.fromHex(0x32cd32);
Color.linen = Color.fromHex(0xfaf0e6);
Color.magenta = Color.fromHex(0xff00ff);
Color.maroon = Color.fromHex(0x800000);
Color.mediumaquamarine = Color.fromHex(0x66cdaa);
Color.mediumblue = Color.fromHex(0x0000cd);
Color.mediumorchid = Color.fromHex(0xba55d3);
Color.mediumpurple = Color.fromHex(0x9370db);
Color.mediumseagreen = Color.fromHex(0x3cb371);
Color.mediumslateblue = Color.fromHex(0x7b68ee);
Color.mediumspringgreen = Color.fromHex(0x00fa9a);
Color.mediumturquoise = Color.fromHex(0x48d1cc);
Color.mediumvioletred = Color.fromHex(0xc71585);
Color.midnightblue = Color.fromHex(0x191970);
Color.mintcream = Color.fromHex(0xf5fffa);
Color.mistyrose = Color.fromHex(0xffe4e1);
Color.moccasin = Color.fromHex(0xffe4b5);
Color.navajowhite = Color.fromHex(0xffdead);
Color.navy = Color.fromHex(0x000080);
Color.oldlace = Color.fromHex(0xfdf5e6);
Color.olive = Color.fromHex(0x808000);
Color.olivedrab = Color.fromHex(0x6b8e23);
Color.orange = Color.fromHex(0xffa500);
Color.orangered = Color.fromHex(0xff4500);
Color.orchid = Color.fromHex(0xda70d6);
Color.palegoldenrod = Color.fromHex(0xeee8aa);
Color.palegreen = Color.fromHex(0x98fb98);
Color.paleturquoise = Color.fromHex(0xafeeee);
Color.palevioletred = Color.fromHex(0xdb7093);
Color.papayawhip = Color.fromHex(0xffefd5);
Color.peachpuff = Color.fromHex(0xffdab9);
Color.peru = Color.fromHex(0xcd853f);
Color.pink = Color.fromHex(0xffc0cb);
Color.plum = Color.fromHex(0xdda0dd);
Color.powderblue = Color.fromHex(0xb0e0e6);
Color.purple = Color.fromHex(0x800080);
Color.red = Color.fromHex(0xff0000);
Color.rosybrown = Color.fromHex(0xbc8f8f);
Color.royalblue = Color.fromHex(0x4169e1);
Color.saddlebrown = Color.fromHex(0x8b4513);
Color.salmon = Color.fromHex(0xfa8072);
Color.sandybrown = Color.fromHex(0xf4a460);
Color.seagreen = Color.fromHex(0x2e8b57);
Color.seashell = Color.fromHex(0xfff5ee);
Color.sienna = Color.fromHex(0xa0522d);
Color.silver = Color.fromHex(0xc0c0c0);
Color.skyblue = Color.fromHex(0x87ceeb);
Color.slateblue = Color.fromHex(0x6a5acd);
Color.slategray = Color.fromHex(0x708090);
Color.snow = Color.fromHex(0xfffafa);
Color.springgreen = Color.fromHex(0x00ff7f);
Color.steelblue = Color.fromHex(0x4682b4);
Color.tan = Color.fromHex(0xd2b48c);
Color.teal = Color.fromHex(0x008080);
Color.thistle = Color.fromHex(0xd8bfd8);
Color.tomato = Color.fromHex(0xff6347);
Color.turquoise = Color.fromHex(0x40e0d0);
Color.violet = Color.fromHex(0x8f00ff);
Color.wheat = Color.fromHex(0xf5deb3);
Color.white = Color.fromHex(0xffffff);
Color.whitesmoke = Color.fromHex(0xf5f5f5);
Color.yellow = Color.fromHex(0xffff00);
Color.yellowgreen = Color.fromHex(0x9acd32);