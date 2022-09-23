export class Component{
    constructor(entity=null){
        this.entity = entity;
        this._properties = {};
    }


    destroy(){
        this._properties = null;
        this.entity = null;

    }
}