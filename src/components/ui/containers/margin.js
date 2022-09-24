import { Container } from "./container.js";
import { UITransform } from "../transform.js";

/**
 * MarginContainer is a container that arranges its children with margins.
 * Note: The margins are added to this container's UITransform component.
 * 
 * @class MarginContainer
 * @extends Container   
 * 
 * @property {number} top=0 - The top margin.
 * @property {number} bottom=0 - The bottom margin.
 * @property {number} left=0 - The left margin.
 * @property {number} right=0 - The right margin.
 */
export class MarginContainer extends Container {
    constructor(left,right,top,bottom){
        super();
        this._properties.left = left;
        this._properties.right = right;
        this._properties.top = top;
        this._properties.bottom = bottom;

    }
    
    /**
     * The left margin.
     * @type {number}
     */
    get left(){
        return this._properties.left;
    }

    set left(left){
        this._properties.left = left;
    }

    /**
     * The right margin.
     * @type {number}
     */
    get right(){
        return this._properties.right;
    }

    set right(right){
        this._properties.right = right;
    }

    /**
     * The bottom margin.
     * @type {number}
     */
    get top(){
        return this._properties.top;
    }

    set top(top){
        this._properties.top = top;
    }

    /**
     * The bottom margin.
     * @type {number}
     */
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