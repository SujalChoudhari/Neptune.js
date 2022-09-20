import { Component } from "./component.js";
import {Vector2} from "../maths/vec2.js";

export class Transform extends Component {
    constructor(pos = Vector2.zero(),rot = 0, scale = Vector2.one(),radius = 0){
        super();
        this.properties = {
            position : pos,
            rotation : rot,
            scale : scale,
            radius : radius,
        }
    }

    getPosition(){
        return this.properties.position.copy();
    }

    setPosition(position){
        this.properties.position = position;
    }

    getRotation(){
        return this.properties.rotation;
    }

    setRotation(rotation){
        this.properties.rotation = rotation;
    }

    getScale(){
        return this.properties.scale.copy();
    }

    setScale(scale){
        this.properties.scale = scale;
    }

    getRadius(){
        return this.properties.radius;
    }

    setRadius(radius){
        this.properties.radius = radius;
    }

    getForward(){
        return new Vector2(Math.cos(this.properties.rotation),Math.sin(this.properties.rotation));
    }

    translate(translation){
        this.properties.position.add(translation);
    }

    rotate(rotation){
        this.properties.rotation += rotation;
    }

    scale(scale){
        this.properties.scale.x *= scale.x;
        this.properties.scale.y *= scale.y;
    }
}