import { Collision } from '../src/physics/collision.js';
import * as npt from '../src/neptune.js'


export class Game extends npt.Application {
    constructor() {
        super();
        this.scene = new npt.Scene();
        this.physicsTimeStep = 10
        this.entities = [];
        for (let i = 0; i < 10; i++) {
            let entity = new npt.Entity(`Circle${i}`);
            entity.addComponent(npt.PhysicsBody.createBoxBody(
                npt.Maths.randomVector2(5, 50),
                1, 3, 3, 1, false));
            entity.addComponent(new npt.Shape(npt.Shape.RECTANGLE, npt.Color.random(), true, { width: 3, height: 3}));
            this.scene.addChild(entity);
            this.entities.push(entity);

        }
        for (let i = 0; i < 10; i++) {
            let entity = new npt.Entity(`Circle${i}`);
            entity.addComponent(npt.PhysicsBody.createCircleBody(
                npt.Maths.randomVector2(5, 50),
                1, 2, 1, false));
            entity.addComponent(new npt.Shape(npt.Shape.CIRCLE, npt.Color.random(), true, { radius: 2}));
            this.scene.addChild(entity);
            this.entities.push(entity);

        }

        this.player = this.entities[19];
        this.player.getComponent(npt.Shape).properties.color = npt.Color.red;


        this.text = new npt.Entity("Text");
        this.text.addComponent(new npt.UITransform(50, 20, 100, 100, 0));
        this.text.addComponent(new npt.Text("Now With Box and Circle Collisions!", "20px Arial", "left", npt.Color.white));

        this.scene.addChild(this.text);

    }

    Init() {
        super.Init();
        
        console.log(npt.Entity.getTree(this.scene));

    }

    Update(deltaTime) {
        super.Update(deltaTime);

        let direction = new npt.Vector2(0, 0)
        if (npt.Input.isKeyDown(npt.Input.keyCode.A)) {
            direction.x -= 1;
        }
        else if (npt.Input.isKeyDown(npt.Input.keyCode.D)) {
            direction.x += 1;
        }
        if (npt.Input.isKeyDown(npt.Input.keyCode.W)) {
            direction.y -= 1;
        }
        else if (npt.Input.isKeyDown(npt.Input.keyCode.S)) {
            direction.y += 1;
        }

        direction = npt.Maths.normalize(direction);
        let force = direction.multiply(.2)
        this.player.getComponent(npt.PhysicsBody).addForce(force);
        
    }

        Draw(ctx) {
            super.Draw(ctx);
            this.scene.draw(ctx);
        }
    }

new Game();