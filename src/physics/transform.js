import { Component } from "../components/component.js";

export class PhysicsTransform extends Component {
    constructor(x,y,angle){
        super();
        this.properties.positionX = x;
        this.properties.positionY = y;
        this.properties.sin = Math.sin(angle);
        this.properties.cos = Math.cos(angle);
    }

    static zero(){
        return new PhysicsTransform(0,0,0);
    }
}