import { Component } from "./component.js";

/** Serializable scene entry marker that transitions can target by spawnId. */
export class SpawnPoint extends Component {
    constructor(entity = null) {
        super(entity);
        this._properties = { spawnId: "start", facing: "right" };
    }
}
