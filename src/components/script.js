import { Component } from "./component.js";

export class Script extends Component{
    constructor(name="New Script",init=null,update=null){
        super();
        this.name = name;
        this.init = init;
        this.update = update;
    }

    Init(){
        if(this.init){
            this.init();
        }
    }

    Update(){
        if(this.update){
            this.update();
        }
    }
}