import { Component } from "./component.js";

/** Serializable single-objective quest definition for editor-authored entities. */
export class QuestDefinition extends Component {
    constructor(entity = null) {
        super(entity);
        this._properties = {
            name: "New Quest",
            description: "Describe the quest...",
            objectiveId: "objective-1",
            objective: "Describe the objective...",
            required: 1
        };
    }
}
