import { Container } from "./container.js";
import { UITransform } from "../transform.js";

export class MarginContainer extends Container {
    constructor(left,right,top,bottom){
        super();
        this._properties.left = left;
        this._properties.right = right;
        this._properties.top = top;
        this._properties.bottom = bottom;

    }

    get left(){
        return this._properties.left;
    }

    set left(left){
        this._properties.left = left;
    }

    get right(){
        return this._properties.right;
    }

    set right(right){
        this._properties.right = right;
    }

    get top(){
        return this._properties.top;
    }

    set top(top){
        this._properties.top = top;
    }

    get bottom(){
        return this._properties.bottom;
    }

    set bottom(bottom){
        this._properties.bottom = bottom;
    }


    getLeft(){
        return this._properties.left;
    }

    setLeft(left){
        this._properties.left = left;
    }

    getRight(){
        return this._properties.right;
    }

    setRight(right){
        this._properties.right = right;
    }

    getTop(){
        return this._properties.top;
    }

    setTop(top){
        this._properties.top = top;
    }

    getBottom(){
        return this._properties.bottom;
    }

    setBottom(bottom){
        this._properties.bottom = bottom;
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