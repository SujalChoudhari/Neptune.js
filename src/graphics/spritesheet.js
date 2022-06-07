import { Vector2 } from "../neptune.js";
import { Sprite } from "./image.js";

/**
 * @class SpriteSheet
 * @classdesc A SpriteSheet is a class that represents a spritesheet.
 * 
 * @property {Object} sprites - The co-ordinates of the sprites.
 * @property {Sprite} spritesheet - The spritesheet. The complete image.
 * 
 * @example
 * // Create a new spritesheet.
 * let spritesheet = new SpriteSheet({
 *      src: "path/to/image/file.png",
 *      pos: new Vector2(0,0),
 *      size: new Vector2(32,32) // Size of each sprite.
 *   });
 * 
 * 
 * @since 1.1.1
 * @author Sujal Choudhari <sjlchoudhari@gmail.com>
 * @license MIT
 */
export class SpriteSheet {
    /**
     * @method
     * @description Initializes the Entity.
     * @param {Object} kwargs - The keyword arguments.
     * @param {String} [kwargs.src=""] - The image source.
     * @param {Vector2} [kwargs.pos=Vector2(0,0)] - The position of the image. Not used if the image is a spritesheet.
     * @param {Vector2} [kwargs.size=Vector2(100,100)] - The size of the image.
     * @param {String} [kwargs.name="SpriteSheet"] - The name of the sprite.
     * 
     * @example
     * // Create a new spritesheet.
     */
    constructor(kwargs) {
        this.spritesheet = new Sprite({
            src: kwargs["src"] || "",
            pos: kwargs["pos"] || new Vector2(0, 0),
            size: kwargs["size"] || new Vector2(100, 100),
        });
        
        this.name = kwargs["name"] || "SpriteSheet"
        this.sprites = {}
    }   

    /**
     * @method
     * @description Add a Single Sprite.
     * @param {String} name - The name of the sprite.
     * @param {Number} x - The x position of the sprite.
     * @param {Number} y - The y position of the sprite.
     * @param {Number} w - The width of the sprite.
     * @param {Number} h - The height of the sprite.
     * 
     * @example
     * // Add a sprite.
     * spritesheet.addSprite("name",0,0,32,32);
     * 
     */
    addSprite(name,x,y,w,h) {
        let newSprite = {
            x: x,
            y: y,
            w: w,
            h: h
        }
        this.sprites = {...this.sprites, [name]: newSprite};
        
    }


    /**
     * @method
     * @description Add an entire Row of Sprites.
     * @param {Number} x - The x position of the sprite.
     * @param {Number} y - The y position of the sprite.
     * @param {Number} w - The width of the sprite.
     * @param {Number} h - The height of the sprite.
     * @param {Number} num - The number of sprites to add in that row.
     * 
     * @example
     * // Add a row of sprites.
     * spritesheet.addRow("name",0,0,32,32,5);
     * 
     */
    addRow(x,y,w,h,num) {
        for(let i = 0; i < num; i++) {
            this.addSprite(this.name + `_${i}`,x+i*w,y,w,h);
        }
    }

    /**
     * @method
     * @description Add an entire Column of Sprites.
     * @param {Number} x - The x position of the sprite.
     * @param {Number} y - The y position of the sprite.
     * @param {Number} w - The width of the sprite.
     * @param {Number} h - The height of the sprite.
     * @param {Number} num - The number of sprites to add in that column.
     * 
     * @example
     * // Add a column of sprites.
     * spritesheet.addColumn("name",0,0,32,32,5);
     */
    addColumn(x,y,w,h,num) {
        for(let i = 0; i < num; i++) {
            this.addSprite(this.name + `_${i}`,x,y+i*h,w,h);
        }
    }

    /**
     * @method
     * @description Add an entire Grid of Sprites.
     * @param {Number} x - The x position of the sprite.
     * @param {Number} y - The y position of the sprite.
     * @param {Number} w - The width of the sprite.
     * @param {Number} h - The height of the sprite.
     * @param {Number} numX - The number of sprites to add in that row.
     * @param {Number} numY - The number of sprites to add in that column.
     * 
     * @example
     * // Add a grid of sprites.
     * spritesheet.addGrid("name",0,0,32,32,5,5);
     */
    addGrid(x,y,w,h,numX,numY) {
        let a = 0;
        for(let j = 0; j < numY; j++) {
            for(let i = 0; i < numX; i++) {
                a++;
                this.addSprite(this.name + `_${a}`,x+i*w,y+j*h,w,h);
            }
        }
    }

    /**
     * @method
     * @description Delete the sprites
     * @param {List} names - The names of the sprites to delete. [name_1, name_2, ...]
     * 
     * @example
     * // Delete a sprite.
     * spritesheet.deleteSprite(["name_1","name_2"]);
     */
    deleteSprite(names) {
        console.log(typeof (names));
        for(let name of names) {
            delete this.sprites[name];
        }
    }

    /**
     * @method
     * @description Draw the sprites
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {String} name - The name of the sprite.
     * @param {Number} x - The x position of the sprite.
     * @param {Number} y - The y position of the sprite.
     * 
     * @example
     * // Draw a sprite.
     * spritesheet.draw(ctx,"name_23",0,100);
     */
    draw(ctx,name,x,y) {
        let sprite = this.sprites[name];
        if(!sprite) {
            return;
        }

        ctx.drawImage(this.spritesheet.image,
            sprite.x,sprite.y,sprite.w,sprite.h,
            x,y,this.spritesheet.size.x,this.spritesheet.size.y);
    }
}