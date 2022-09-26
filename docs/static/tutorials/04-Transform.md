Transform is a most fundamental component of Neptune. 
It is used to position, rotate and scale an entity. 
It is a component that every Entity must have.
*UITransform* and *Body* are Inherited from Transform.
Thus either one of these three Components is a must for a Entity.

## Creating a Transform Component
```js   
import * as npt from "../src/neptune.js"; 


class MyNewGame extends npt.Application {
    constructor() {
        super();

        this.player = new npt.Entity();
        let transform = new npt.Transform( // new Transform Component
            new npt.Vector2(0, 0),  //position
            0,                      //rotation
            new npt.Vector2(1, 1)   //scale
        );

        this.player.addComponent(transform); // add the component to the Entity

        console.log(this.player);
        /**
         * Entity {
         * name: "Entity",
         * components: [Transform],
         * children: [],
         * parent: null
         * }
         */
    }

}

new MyNewGame();

```

In certain cases, If there is a need for a radius property.
Transform has a radius property defaults to 0, which can be used for circles.