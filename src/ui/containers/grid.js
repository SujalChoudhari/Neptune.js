import { Container } from "./container.js";
import { Transform } from "../transform.js";
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
    constructor(cols = 1, rows = 1, spacing = 0) {
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
    get spacing() {
        return this._properties.spacing;
    }

    set spacing(spacing) {
        this._properties.spacing = spacing;
    }

    /**
     * The number of columns in the grid.
     * @type {number}
     * 
     */
    get columns() {
        return this._properties.cols;
    }

    set columns(cols) {
        this._properties.cols = cols;
    }

    /**
     * The number of rows in the grid.
     * @type {number}
     */
    get rows() {
        return this._properties.rows;
    }

    set rows(rows) {
        this._properties.rows = rows;
    }


    Update() {
        let x = this.entity.GetComponent(Transform).x;
        let y = this.entity.GetComponent(Transform).y;
        let width = this.entity.GetComponent(Transform).width;
        let height = this.entity.GetComponent(Transform).height;
    
        let spacing = this.spacing;
    
        let children = this.entity.GetChildren();
        let childWidth = width / this.columns;
        let childHeight = height / this.rows;

        
    
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            child.GetComponent(Transform).x = x + (i % this.columns) * (childWidth + spacing);
            child.GetComponent(Transform).y = y + Math.floor(i / this.columns) * (childHeight + spacing);
            child.GetComponent(Transform).width = childWidth;
            child.GetComponent(Transform).height = childHeight;
        }
    }    
}