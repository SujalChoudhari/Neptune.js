export class Entity {
    constructor(name="Entity",parent=null,app=null) {
        this.name = name
        this.parent = parent
        this.components = null;
        if (app != null) app.entities.push(this);
    }

    setParent(parent) {
        this.parent = parent;
    }

    addComponent(component){
        this.components.push(component);
    }

    Awake(){
        this.components.forEach(component => {
            component.Awake();
        });
    }

    Start(){
        this.components.forEach(component => {
            component.Start();
        });
    }

    Update(){
        this.components.forEach(component => {
            component.Update();
        });
    }

    FixedUpdate(){
        this.components.forEach(component => {
            component.FixedUpdate();
        });
    }

    LateUpdate(){
        this.components.forEach(component => {
            component.LateUpdate();
        });
    }

    Destroy(){
        this.components.forEach(component => {
            component.Destroy();
        });
    }
}