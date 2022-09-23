import { Component } from "../components/component.js";

export class PhysicsTransform extends Component {
    constructor(x,y,angle){
        super();
        this._properties.positionX = x;
        this._properties.positionY = y;
        this._properties.sin = Math.sin(angle);
        this._properties.cos = Math.cos(angle);
    }

    get x(){
        return this._properties.positionX;
    }

    set x(x){
        this._properties.positionX = x;
    }

    get y(){
        return this._properties.positionY;
    }

    set y(y){
        this._properties.positionY = y;
    }

    get angle(){
        return Math.atan2(this._properties.sin,this._properties.cos);
    }

    set angle(angle){
        this._properties.sin = Math.sin(angle);
        this._properties.cos = Math.cos(angle);
    }

    get sin(){
        return this._properties.sin;
    }

    set sin(sin){
        this._properties.sin = sin;
    }

    get cos(){
        return this._properties.cos;
    }

    set cos(cos){
        this._properties.cos = cos;
    }

    static zero(){
        return new PhysicsTransform(0,0,0);
    }
}