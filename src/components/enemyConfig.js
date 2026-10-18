import { Component } from "./component.js";

/** Serializable tuning data for editor-authored enemies. */
export class EnemyConfig extends Component {
    constructor(entity = null) {
        super(entity);
        this._properties = {
            maxHealth: 100,
            moveSpeed: 2,
            contactDamage: 10,
            behavior: "patrol"
        };
    }
}
