import { Entity } from "./entity.js";
import { Component } from "../components/component.js";

export class DestroyQueue{
    static queue = [];

    static add(object){
        if (object instanceof Entity) {
            DestroyQueue.queue.push(object);
        }
        if (object instanceof Component) {
            DestroyQueue.queue.push(object.entity);
        }
    }

    static destroy(){
        DestroyQueue.queue.forEach(entity => {
            entity.destroy();
        });

        DestroyQueue.queue = [];
        
    }
}