import {Entity} from "../basic/entity.js";
import {Vector2} from "./vec2.js";

export class Transform extends Entity {
    constructor(kwargs){
        super(kwargs);
        this.pos = kwargs["pos"] || new Vector2(kwargs["x"] || 0, kwargs["y"] || 0);
        this.size = kwargs["size"] || new Vector2(kwargs["w"] || 1, kwargs["h"] || 1);
        this.rot = kwargs["rot"] || 0;
    }
}