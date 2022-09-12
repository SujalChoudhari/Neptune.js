import { Container } from "./container.js";
import { UITransform } from "../transform.js";

export class MarginContainer extends Container {
    constructor(left,right,top,bottom){
        super();
        this.properties.left = left;
        this.properties.right = right;
        this.properties.top = top;
        this.properties.bottom = bottom;

    }

    getLeft(){
        return this.properties.left;
    }

    setLeft(left){
        this.properties.left = left;
    }

    getRight(){
        return this.properties.right;
    }

    setRight(right){
        this.properties.right = right;
    }

    getTop(){
        return this.properties.top;
    }

    setTop(top){
        this.properties.top = top;
    }

    getBottom(){
        return this.properties.bottom;
    }

    setBottom(bottom){
        this.properties.bottom = bottom;
    }

    update(){
        let x = this.entity.getComponent(UITransform).getX();
        let y = this.entity.getComponent(UITransform).getY();
        let width = this.entity.getComponent(UITransform).getWidth();
        let height = this.entity.getComponent(UITransform).getHeight();

        let left = this.getLeft();
        let right = this.getRight();
        let top = this.getTop();
        let bottom = this.getBottom();

        let children = this.entity.getChildren();
        let childWidth = width / children.length;

        for(let i = 0; i < children.length; i++){
            let child = children[i];
            child.getComponent(UITransform).setX(x + i * (childWidth + left + right));
            child.getComponent(UITransform).setY(y + top);
            child.getComponent(UITransform).setWidth(childWidth);
            child.getComponent(UITransform).setHeight(height - top - bottom);
        }
    }
}