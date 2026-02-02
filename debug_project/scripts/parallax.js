import { Behaviour, Transform } from "../../src/neptune.js";
import { SceneManager } from "../../src/core/sceneManager.js"; // Direct import if needed, or via neptune.js

export class Parallax extends Behaviour {
    constructor() {
        super("Parallax");
        this.factorX = 0.5; // 0.0 = static, 1.0 = moves with camera (foreground)
        this.factorY = 0.5;
        this.originX = 0;
        this.originY = 0;
        this._initialized = false;
    }

    Init() {
        // Store initial position
        const t = this.entity.GetComponent(Transform);
        if (t) {
            this.originX = t.position.x;
            this.originY = t.position.y;
        }
        this._initialized = true;
    }

    Update() {
        // console.log("Parallax Update");
        if (!this._initialized) this.Init();

        // Find Camera Position
        // Hack: traverse up to find Scene? Or use SceneManager.
        // Let's assume SceneManager has only 1 active scene for now.
        const scene = SceneManager.GetScene(0); // Assuming ID 0 is active
        if (scene && scene.cameraSettings && scene.cameraSettings.bounds) {
            const camX = scene.cameraSettings.bounds.x;
            const camY = scene.cameraSettings.bounds.y;

            const t = this.entity.GetComponent(Transform);
            if (t) {
                // Parallax Logic:
                // New Pos = Origin + CameraPos * Factor
                t.position.x = this.originX + camX * this.factorX;
                // t.position.y = this.originY + camY * this.factorY; 
                // Often Y parallax is disabled or different. Let's enable it.
            }
        }
    }

    deserialize(props) {
        if (props.factorX !== undefined) this.factorX = props.factorX;
        if (props.factorY !== undefined) this.factorY = props.factorY;
    }
}
