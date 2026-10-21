import { Component } from "./component.js";
import { SceneManager } from "../core/sceneManager.js";
import { SpawnPoint } from "./spawnPoint.js";
import { Transform } from "./transform.js";
import { Vector2 } from "../math/vec2.js";

function findSpawnPoint(scene, spawnId) {
    const pending = [...scene.children];
    while (pending.length > 0) {
        const entity = pending.shift();
        const spawnPoint = entity.components.find(component => component instanceof SpawnPoint && component.properties.spawnId === spawnId);
        if (spawnPoint) return entity;
        pending.unshift(...entity.children);
    }
    return null;
}

/** Serializable destination and trigger settings for an authored scene transition. */
export class SceneTransition extends Component {
    constructor(entity = null) {
        super(entity);
        this._properties = { targetScene: "", spawnPoint: "", trigger: "enter" };
        this._pendingActor = null;
        this._pendingTransition = null;
        this._unbindTrigger = null;
        this.lastActivation = null;
        this.lastError = null;
    }

    /** Bind enter-mode activation to the authored TriggerCollider's overlap events. */
    bindTrigger(collider) {
        if (!collider || collider.role !== "trigger" || typeof collider.on !== "function") return false;
        this._unbindTrigger?.();
        this._unbindTrigger = collider.on("enter", payload => {
            this.lastActivation = this.OnTriggerEnter(payload.otherEntity).catch(error => {
                this.lastError = error;
                return false;
            });
        });
        return true;
    }

    /** Activate an enter-mode transition for the entity that entered its trigger. */
    OnTriggerEnter(actor) {
        if (this.properties.trigger !== "enter") return Promise.resolve(false);
        return this.#transitionActor(actor);
    }

    /** Activate an interact-mode transition from a gameplay interaction/input handler. */
    Interact(actor) {
        if (this.properties.trigger !== "interact") return Promise.resolve(false);
        return this.#transitionActor(actor);
    }

    #transitionActor(actor) {
        if (!actor || typeof actor.GetComponent !== "function" || !Array.isArray(actor.children)) return Promise.resolve(false);
        if (this._pendingTransition) {
            return this._pendingActor === actor ? this._pendingTransition : Promise.resolve(false);
        }

        this.lastError = null;
        const transition = this.#loadAndTransfer(actor).finally(() => {
            this._pendingActor = null;
            this._pendingTransition = null;
        });
        this._pendingActor = actor;
        this._pendingTransition = transition;
        return transition;
    }

    async #loadAndTransfer(actor) {
        const targetScene = this.properties.targetScene;
        if (typeof targetScene !== "string" || targetScene.trim() === "") return false;

        const { SceneLoader } = await import("../core/sceneLoader.js");
        const destination = await SceneLoader.load(targetScene);
        if (!destination) return false;

        const spawnId = this.properties.spawnPoint;
        let spawnTransform = null;
        if (typeof spawnId === "string" && spawnId !== "") {
            const spawnEntity = findSpawnPoint(destination, spawnId);
            spawnTransform = spawnEntity?.GetComponent(Transform) ?? null;
            if (!spawnTransform) return false;
        }

        const actorTransform = actor.GetComponent(Transform);
        if (spawnTransform && !actorTransform) return false;
        const previousPosition = actorTransform?.position;
        if (spawnTransform) actorTransform.position = new Vector2(spawnTransform.position.x, spawnTransform.position.y);

        if (!SceneManager.TransitionToScene(destination.id, [actor])) {
            if (actorTransform && previousPosition) actorTransform.position = previousPosition;
            return false;
        }
        return true;
    }
}