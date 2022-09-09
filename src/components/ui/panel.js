import { UITransform } from "./transform.js";
import { Color } from "../../basic/color.js";

export class Panel extends Component {
    constructor(x = 0, y = 0, width = 0, height = 0, color = Color.white) {
        super(x, y, width, height);
        this.properties = {
            color: color
        }
    }

    getColor() {
        return this.properties.color;
    }

    setColor(color) {
        this.properties.color = color;
    }

    draw(ctx) {
        let transform = this.entity.getComponent(UITransform);
        let x = transform.getX();
        let y = transform.getY();
        let width = transform.getWidth();
        let height = transform.getHeight();
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(width, height);

        ctx.fillStyle = this.properties.color.toString();
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }
}