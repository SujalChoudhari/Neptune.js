import { Color} from "../../basic/color.js";
import { Vector2 } from "../../maths/vec2.js";
import { Wireframe } from "./wireFrame.js";
import { Text } from "../ui/text.js";
import { Input } from "../../events/input.js";

/**
 * @class InputVisualizer
 * @classdesc A class that visualizes the input.
 */
export class InputVisualizer{

    /**
     * @method
     * @description Draws the mouse/touch position.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     */
    static pointer(ctx){
        Wireframe.circle(ctx,Input.pos,10,Color.yellow);
        var text = new Text({
            pos: new Vector2(Input.pos.x+60,Input.pos.y),
            text: "(" + Input.pos.x + "," + Input.pos.y + ")",
            color: Color.black,
            font: "20px Arial",
            align: "center"
        });

        text.draw(ctx);
    }

    /**
     * @method
     * @description Show which keys are pressed.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     */
    static keyboard(ctx){
        var keys = Input.keyPressed;
        var text = new Text({
            pos: new Vector2(5,20),
            text: "",
            color: Color.black,
            font: "20px Arial",
            align: "start"
        });

        text.text = "Keyboard: ";
        for(var key in keys){
            if(keys[key]){
                text.text += key + " ";
            }
        }

        text.draw(ctx);
    }
}