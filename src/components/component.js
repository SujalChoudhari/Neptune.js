export class Component{
    constructor(entity=null){
        this.entity = entity;
        this.properties = {};
    }

    destroy(){
        this.properties = null;
        this.entity = null;

    }
}