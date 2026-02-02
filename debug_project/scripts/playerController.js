import { Behaviour, Transform, BoxCollider, SceneManager, KeyboardInput, Vector2, Maths } from "../../src/neptune.js";

export class PlayerController extends Behaviour {
    constructor() {
        super("PlayerController");
        this.speed = 5.0; // Units per second
        this.jumpForce = 15.0; // Reduced jump force to be more manageable with correct DT
        this.gravity = 30.0;
        this.velocity = new Vector2(0, 0);
        this.grounded = false;
        this.size = new Vector2(0.8, 0.8); // Slightly smaller than 1 tile
    }

    Init() {
        const collider = this.entity.GetComponent(BoxCollider);
        if (collider) {
            this.size = collider.size;
        }
    }

    Update(deltaTime) {
        // Log basic heartbeat to confirm script is running
        // console.log("PlayerController Update Heartbeat");

        const t = this.entity.GetComponent(Transform);
        if (!t) {
            console.error("PlayerController: No Transform found!");
            return;
        }

        // Input
        let inputX = 0;
        // Use global window input check if possible, or standard KeyboardInput
        if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.A) || KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.LEFTARROW)) {
            inputX -= 1;
        }
        if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.D) || KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.RIGHTARROW)) {
            inputX += 1;
        }

        if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.SPACE) && this.grounded) {
            this.velocity.y = -this.jumpForce;
            this.grounded = false;
        }

        // Apply Gravity
        this.velocity.y += this.gravity * deltaTime;

        // Apply Horizontal Velocity
        this.velocity.x = inputX * this.speed;

        // Move X
        t.position.x += this.velocity.x * deltaTime;
        this.#resolveCollision(t, true);

        // Move Y
        t.position.y += this.velocity.y * deltaTime;
        this.grounded = false;
        this.#resolveCollision(t, false);

        // Debug Physics State (Log if moving or inputs active)
        if (Math.abs(inputX) > 0 || Math.abs(this.velocity.y) > 0.1 || !this.grounded) {
        }
    }

    #resolveCollision(transform, isX) {
        // Use GetActiveScene() instead of hardcoding index 0
        const scene = SceneManager.GetActiveScene();
        if (!scene) {
            console.warn("PlayerController: No active scene found!");
            return;
        }

        const colliders = scene.GetComponentsInChildren(BoxCollider);
        const myBounds = {
            x: transform.position.x,
            y: transform.position.y,
            w: this.size.x,
            h: this.size.y
        };

        // console.log(`PlayerController: Checking collision against ${colliders.length} colliders`);

        for (const col of colliders) {
            if (col.entity === this.entity) continue;

            const colT = col.entity.GetComponent(Transform);
            if (!colT) continue;

            const otherBounds = {
                x: colT.position.x,
                y: colT.position.y,
                w: col.size.x,
                h: col.size.y
            };

            if (Math.abs(myBounds.x - otherBounds.x) < (myBounds.w + otherBounds.w) / 2 &&
                Math.abs(myBounds.y - otherBounds.y) < (myBounds.h + otherBounds.h) / 2) {

                // console.log("PlayerController: Collision Detected!");

                if (isX) {
                    if (this.velocity.x > 0) {
                        transform.position.x = otherBounds.x - (otherBounds.w / 2 + myBounds.w / 2) - 0.001;
                    } else if (this.velocity.x < 0) {
                        transform.position.x = otherBounds.x + (otherBounds.w / 2 + myBounds.w / 2) + 0.001;
                    }
                    this.velocity.x = 0;
                } else {
                    if (this.velocity.y > 0) {
                        transform.position.y = otherBounds.y - (otherBounds.h / 2 + myBounds.h / 2) - 0.001;
                        this.grounded = true;
                        this.velocity.y = 0;
                    } else if (this.velocity.y < 0) {
                        transform.position.y = otherBounds.y + (otherBounds.h / 2 + myBounds.h / 2) + 0.001;
                        this.velocity.y = 0;
                    }
                }
            }
        }
    }
}
