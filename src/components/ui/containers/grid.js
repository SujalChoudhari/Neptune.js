import { Container } from "./container.js";

/**
 * GridContainer is a container that arranges its children in a grid.
 * @class GridContainer
 * @extends Container
 * 
 * @property {number} columns=1 - The number of columns in the grid.
 * @property {number} rows=1 - The number of rows in the grid.
 * @property {number} spacing=0 - The spacing between the children.
 */
export class GridContainer extends Container {
    constructor(cols=1,rows=1,spacing=0){
        super();
        this._properties.cols = cols;
        this._properties.rows = rows;
        this._properties.spacing = spacing;
    }

    /**
     * Spacing between the children.
     * @type {number}
     * 
     */
    get spacing(){
        return this._properties.spacing;
    }

    set spacing(spacing){
        this._properties.spacing = spacing;
    }

    /**
     * The number of columns in the grid.
     * @type {number}
     * 
     */
    get columns(){
        return this._properties.cols;
    }

    set columns(cols){
        this._properties.cols = cols;
    }

    /**
     * The number of rows in the grid.
     * @type {number}
     */
    get rows(){
        return this._properties.rows;
    }

    set rows(rows){
        this._properties.rows = rows;
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
        let childWidth = width / this.cols;
        let childHeight = height / this.rows;

        for(let i = 0; i < children.length; i++){
            let child = children[i];
            child.getComponent(UITransform).setX(x + (i % this.cols) * (childWidth + spacing));
            child.getComponent(UITransform).setY(y + Math.floor(i / this.cols) * (childHeight + spacing));
            child.getComponent(UITransform).setWidth(childWidth);
            child.getComponent(UITransform).setHeight(childHeight);
        }
    }
}