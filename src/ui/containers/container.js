import { Component } from "../../components/component.js";


/**
 * Containers is a base class for all UI Containers.
 * This class should not be used directly.
 * Instead, use one of the derived classes. MarginContainer, GridContainer, etc.
 * @class Container
 * @extends Component
 * @interface
 */
export class Container extends Component {

    /**
     * Update all the children's UITransform components.
     * Every time there is a change in the children,or sizes of the container, this method should be called.
     * @method
     */
    Update() { }
}