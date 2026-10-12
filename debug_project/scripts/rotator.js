import { Behaviour, Transform } from "../../src/neptune.js";

export class Rotator extends Behaviour {
    constructor() {
        super("Rotator");
        this.speed = 1.0;
    }

    Init() {
        console.log("Rotator Initialized on " + this.entity.name);
    }

    Update() {
        // Try getting Transform by class
        let transform = this.entity.GetComponent(Transform);

        // Fallback: Find any component with a 'rotation' property (Duck Typing)
        if (!transform) {
            const comps = this.entity.components; // Access internal array if getter unavailable or use GetComponents
            // Using the public getter
            if (this.entity.components) {
                transform = this.entity.components.find(c => c.rotation !== undefined || (c._properties && c._properties.rot !== undefined));
            }
        }

        if (transform) {
            transform.rotation += this.speed * 0.01;
        }
    }
}
