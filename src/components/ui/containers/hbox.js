import { Container } from "./container.js";

/**
 * Horizontal Box Container or HBoxContainer is a container that arranges its children horizontally.
 * @class HBoxContainer
 * @extends Container
 * 
 * @property {number} spacing=0 - The spacing between the children.
 */
export class HBoxContainer extends Container {
    constructor(spacing){
        super();
        this._properties.spacing = spacing;
    }

    /**
     * Space between the children.
     * @type {number}
     */
    get spacing(){
        return this._properties.spacing;
    }

    set spacing(spacing){
        this._properties.spacing = spacing;
    }

    getSpacing(){
        return this._properties.spacing;
    }

    setSpacing(spacing){
        this._properties.spacing = spacing;
    }

    /**@private */
    update(){
        let x = this.entity.getComponent(UITransform).getX();
        let y = this.entity.getComponent(UITransform).getY();
        let width = this.entity.getComponent(UITransform).getWidth();
        let height = this.entity.getComponent(UITransform).getHeight();

        let spacing = this.getSpacing();

        let children = this.entity.getChildren();
        let childWidth = width / children.length;

        for(let i = 0; i < children.length; i++){
            let child = children[i];
            child.getComponent(UITransform).setX(x + i * (childWidth + spacing));
            child.getComponent(UITransform).setY(y);
            child.getComponent(UITransform).setWidth(childWidth);
            child.getComponent(UITransform).setHeight(height);
        }
    }
}