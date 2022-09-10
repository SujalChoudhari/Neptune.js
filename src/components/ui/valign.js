import {Container} from './container.js';

export class VAlignContainer extends Container {
    constructor(x,y,width,height,rot,padX,padY,spacing){
        super(x,y,width,height,rot);
        this.properties.padX = padX;
        this.properties.padY = padY;
        this.properties.spacing = spacing;
        update();
    }

    getPadX(){
        return this.properties.padX;
    }

    setPadX(padX){
        this.properties.padX = padX;
    }

    getPadY(){
        return this.properties.padY;
    }

    setPadY(padY){
        this.properties.padY = padY;
    }

    getSpacing(){
        return this.properties.spacing;
    }

    setSpacing(spacing){
        this.properties.spacing = spacing;
    }

    update(){
        let y = this.properties.padY;
        let height = (this.properties.height - (this.properties.padY * 2)) / this.children.length;
        for(let i = 0; i < this.children.length; i++){
            let child = this.children[i];
            child.getComponent(UITransform).setPosition(new Vector2(this.properties.padX,y));
            child.getComponent(UITransform).setSize(new Vector2(this.properties.width - (this.properties.padX * 2),height));
            y += height + this.properties.spacing;
        }
    }
}