import { Component } from "./component.js";

/** Serializable destination and trigger settings for an authored scene transition. */
export class SceneTransition extends Component {
    constructor(entity = null) {
        super(entity);
        this._properties = { targetScene: "", spawnPoint: "", trigger: "enter" };
    }
}