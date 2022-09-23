
export class Entity {
    constructor(name="Entity") {
        this._name = name;
        this._children = [];
        this._parent = null;
        this._components = [];
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get parent(){
        return this._parent;
    }

    set parent(parent){
        this._parent = parent;
    }

    get children(){
        return this._children;
    }

    get components(){
        return this._components;
    }


    getComponent(type){
        return this._components.find(component => component instanceof type);
    }

    hasComponent(type){
        return this._components.some(component => component instanceof type);
    }

    getChildren(){
        return this._children;
    }

    getParent(){
        return this._parent;
    }

    removeComponent(type){
        let index = this._components.findIndex(component => component instanceof type);
        if(index > -1){
            this._components.splice(index,1);
        }
    }

    addComponent(component){
        if (!this.hasComponent(component.constructor)) {
            component.entity = this;
            this._components.push(component);
        }
    }

    addChild(child){
        if (this._children == null) {
            this._children = [];
        }
        this._children.push(child);
        child.parent = this;
    }

    removeChild(child){
        let index = this._children.findIndex(c => c == child);
        this._children[index].parent = null;
        if(index > -1){
            this._children.splice(index,1);
        }
    }

    getComponentinChildren(type){
        let component = null;
        this._children.forEach(child => {
            if(child.hasComponent(type)){
                component = child.getComponent(type);
            }
        });
        return component;
    }

    getComponentsInChildren(type){
        let components = [];
        this._children.forEach(child => {
            if(child.hasComponent(type)){
                components.push(child.getComponent(type));
            }
        });
        return components;
    }

    getChildWithComponent(type){
        return this._children.filter(child => child.hasComponent(type));
    }

    getChildrenWithComponent(type){
        let children = [];
        this._children.forEach(child => {
            if(child.hasComponent(type)){
                children.push(child);
            }
        });
        return children;
    }


    getTree(){
        let tree = {};
        tree.name = this.name;
        tree.children = [];
        this._children.forEach(child => {
            tree.children.push(child.getTree());
        });
        return tree;
    }

    destroy(){
        this._components.forEach(component => {
            component.destroy();
        });

        this._children.forEach(child => {    
            child.destroy();
        });

        this._parent.removeChild(this);

        
    }
}