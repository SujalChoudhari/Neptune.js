import { Entity } from "./entity.js";
import { Component } from "../components/component.js";

/**
 * @class DestroyQueue
 * @classdesc A queue of entities to be destroyed. 
 * This is used to prevent entities from being destroyed while they are being iterated over.
 * 
 */
export class DestroyQueue{
    static #queue = [];

    /**
     * Adds an entity to the destroy queue.
     * Note: If a component is added to the destroy queue, The entire entity will be destroyed.
     * @param {Entity} object The entity to be destroyed. or the component of the entity to be destroyed.
     * @returns {void}
     */
    static Add(object){
        if (object instanceof Entity) {
            DestroyQueue.#queue.push(object);
        }
        if (object instanceof Component) {
            DestroyQueue.#queue.push(object.entity);
        }
    }

    /**@private */
    static destroy(){
        DestroyQueue.#queue.forEach(entity => {
            entity.destroy();
        });
        DestroyQueue.#queue = [];
    }
}