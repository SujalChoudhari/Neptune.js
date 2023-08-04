import { Component } from "../../component.js";


/**
 * Containers is a base class for all UI Containers.
 * This class should not be used directly.
 * Instead, use one of the derived classes. MarginContainer, GridContainer, etc.
 * @class Container
 * @extends Component
 * @interface
 */
export class Container extends Component {

    /**@private */
    update() { }
}