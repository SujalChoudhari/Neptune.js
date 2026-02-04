import { SceneLoader, SceneManager, ComponentRegistry } from "../src/neptune.js";
import { Rotator } from "./scripts/rotator.js";
import { Shape } from "../src/rendering/shape.js";
import { Text } from "../src/ui/text.js";
import { BoxCollider } from "../src/components/boxCollider.js";
import { Parallax } from "./scripts/parallax.js";
import { PlayerController } from "./scripts/playerController.js";

// Register Custom Components
ComponentRegistry.register("Rotator", Rotator);
ComponentRegistry.register("Shape", Shape);
ComponentRegistry.register("Text", Text);
ComponentRegistry.register("BoxCollider", BoxCollider);
ComponentRegistry.register("Parallax", Parallax);
ComponentRegistry.register("PlayerController", PlayerController);

async function init() {
    console.log("Initializing Debug Project...");
    try {
        const scene = await SceneLoader.load("./scenes/demo.scn");
        console.log("Scene loaded successfully:", scene);

        // Explicitly load the scene so it becomes active
        SceneManager.LoadScene(scene.id);

    } catch (error) {
        console.error("Failed to load scene:", error);
    }
}

init();
