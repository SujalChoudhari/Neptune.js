import { Container } from "./container.js";

export class VBoxContainer extends Container {
    constructor(spacing){
        super();
        this._properties.spacing = spacing;
    }

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

    update(){
        let x = this.entity.getComponent(UITransform).getX();
        let y = this.entity.getComponent(UITransform).getY();
        let width = this.entity.getComponent(UITransform).getWidth();
        let height = this.entity.getComponent(UITransform).getHeight();

        let spacing = this.getSpacing();

        let children = this.entity.getChildren();
        let childHeight = height / children.length;

        for(let i = 0; i < children.length; i++){
            let child = children[i];
            child.getComponent(UITransform).setX(x);
            child.getComponent(UITransform).setY(y + i * (childHeight + spacing));
            child.getComponent(UITransform).setWidth(width);
            child.getComponent(UITransform).setHeight(childHeight);
        }
    }
}