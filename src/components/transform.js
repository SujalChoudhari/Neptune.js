import { Component } from "./component.js";
import {Vector2} from "../maths/vec2.js";

export class Transform extends Component {
    constructor(pos = Vector2.zero(),rot = 0, scale = Vector2.one(),radius = 0){
        super();
        this._properties = {
            position : pos,
            rotation : rot,
            scale : scale,
            radius : radius,
        }
    }

    get position(){
        return this._properties.position.copy();
    }

    set position(position){
        this._properties.position = position;
    }

    get rotation(){
        return this._properties.rotation;
    }

    set rotation(rotation){
        this._properties.rotation = rotation;
    }

    get scale(){
        return this._properties.scale.copy();
    }

    set scale(scale){
        this._properties.scale = scale;
    }

    get radius(){
        return this._properties.radius;
    }

    set radius(radius){
        this._properties.radius = radius;
    }


    getPosition(){
        return this._properties.position.copy();
    }

    setPosition(position){
        this._properties.position = position;
    }

    getRotation(){
        return this._properties.rotation;
    }

    setRotation(rotation){
        this._properties.rotation = rotation;
    }

    getScale(){
        return this._properties.scale.copy();
    }

    setScale(scale){
        this._properties.scale = scale;
    }

    getRadius(){
        return this._properties.radius;
    }

    setRadius(radius){
        this._properties.radius = radius;
    }

    getForward(){
        return new Vector2(Math.cos(this._properties.rotation),Math.sin(this._properties.rotation));
    }

    translate(translation){
        this._properties.position.add(translation);
    }

    rotate(rotation){
        this._properties.rotation += rotation;
    }

    scale(scale){
        this._properties.scale.x *= scale.x;
        this._properties.scale.y *= scale.y;
    }
}