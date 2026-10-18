import { Behaviour, KeyboardInput, SceneLoader, SceneManager, Transform } from "../../src/neptune.js";
import { PlayerController } from "./playerController.js";

let interactionLatched = false;

function findPlayer(entity) {
    if (entity.components.some(component => component instanceof PlayerController)) return entity;
    for (const child of entity.children) {
        const player = findPlayer(child);
        if (player) return player;
    }
    return null;
}

export class ScenePortal extends Behaviour {
    constructor() {
        super("ScenePortal");
        this.targetScene = "";
        this.targetSceneName = "";
        this.destinationX = 0;
        this.destinationY = 0;
        this.transitioning = false;
    }

    Update() {
        if (!KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.E)) {
            interactionLatched = false;
            return;
        }
        if (interactionLatched || this.transitioning) return;

        const sourceScene = SceneManager.GetActiveScene();
        const player = sourceScene && findPlayer(sourceScene);
        const playerTransform = player?.GetComponent(Transform);
        const portalTransform = this.entity?.GetComponent(Transform);
        if (!playerTransform || !portalTransform) return;

        const distance = Math.hypot(
            playerTransform.position.x - portalTransform.position.x,
            playerTransform.position.y - portalTransform.position.y
        );
        if (distance > 1.5) return;

        interactionLatched = true;
        this.transitioning = true;
        this.transitionPromise = this.#transition(sourceScene, player);
        return this.transitionPromise;
    }

    async #transition(sourceScene, player) {
        try {
            if (typeof this.targetScene !== "string" || !this.targetScene.trim() ||
                typeof this.targetSceneName !== "string" || !this.targetSceneName.trim() ||
                !Number.isFinite(this.destinationX) || !Number.isFinite(this.destinationY)) {
                throw new Error("ScenePortal requires a target scene path, name, and finite destination coordinates.");
            }

            let destination = SceneManager.GetScenes().find(scene => scene.name === this.targetSceneName);
            if (!destination) destination = await SceneLoader.load(this.targetScene);
            if (SceneManager.GetActiveScene() !== sourceScene) return false;
            if (!SceneManager.TransitionToScene(destination.id, [player])) return false;

            const transform = player.GetComponent(Transform);
            transform.position.x = this.destinationX;
            transform.position.y = this.destinationY;
            player.paused = false;
            return true;
        } catch (error) {
            interactionLatched = false;
            throw error;
        } finally {
            this.transitioning = false;
        }
    }
}
