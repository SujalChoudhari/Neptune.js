import { SceneLoader, SceneManager, ComponentRegistry } from "../src/neptune.js";
import { Rotator } from "./scripts/rotator.js";
import { Text } from "../src/ui/text.js";
import { BoxCollider } from "../src/components/boxCollider.js";
import { Parallax } from "./scripts/parallax.js";
import { PlayerController } from "./scripts/playerController.js";

// Register Custom Components
ComponentRegistry.register("Rotator", Rotator);
ComponentRegistry.register("Text", Text);
ComponentRegistry.register("BoxCollider", BoxCollider);
ComponentRegistry.register("Parallax", Parallax);
ComponentRegistry.register("PlayerController", PlayerController);

export async function init() {
    console.log("Initializing Debug Project...");
    try {
        const scene = await SceneLoader.load("./scenes/demo.scn");
        console.log("Scene loaded successfully:", scene.name);

        // Explicitly load the scene so it becomes active
        SceneManager.LoadScene(scene.id);
        return scene;

    } catch (error) {
        console.error("Failed to load scene:", error);
        return null;
    }
}

export const ready = init();
