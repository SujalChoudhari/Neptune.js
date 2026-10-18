import { Component } from "./component.js";

/** Serializable dialogue line data for editor-authored entities. */
export class Dialogue extends Component {
    constructor(entity = null) {
        super(entity);
        this._properties = {
            speaker: "",
            text: "",
            next: ""
        };
    }
}
