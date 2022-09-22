import * as npt from '../src/neptune.js'


export class Game extends npt.Application {
    constructor() {
        super();
        this.scene = new npt.Scene();
        this.physicsTimeStep = 40;
        npt.PhysicsEngine.iterations = 20;

        this.ground = new npt.Entity("Ground");
        this.ground.addComponent(npt.PhysicsBody.createBoxBody(
            new npt.Vector2(0, npt.Maths.pixelToMeter(this.height - 10)),
            1, 100, 10, 1, true));
        this.ground.addComponent(new npt.Shape(npt.Shape.RECTANGLE, npt.Color.random(), true, { width: 100, height: 10 }));
        this.scene.addChild(this.ground);


        this.text = new npt.Entity("Text");
        this.text.addComponent(new npt.UITransform(50, 20, 100, 100, 0));
        this.text.addComponent(new npt.Text("Gravity exists!", "20px Arial", "left", npt.Color.white));

        this.scene.addChild(this.text);

        this.polygon = new npt.Entity("Polygon");
        this.polygon.addComponent(npt.PhysicsBody.createPolygonBody(
            new npt.Vector2(5, 35),
            20,[
                new npt.Vector2(0,0),
                new npt.Vector2(0,10),
                new npt.Vector2(20,10),
                new npt.Vector2(5,0)
            ],
            1, true));

        this.polygon.addComponent(new npt.Shape(
            npt.Shape.POLYGON,
            npt.Color.random(),
            true,{points:[
                new npt.Vector2(0,0),
                new npt.Vector2(0,10),
                new npt.Vector2(20,10),
                new npt.Vector2(5,0)
            ],thickness:.3,outline:npt.Color.black}));
        this.scene.addChild(this.polygon);


    }

    Init() {
        super.Init();

    }

    Update(deltaTime) {
        super.Update(deltaTime);

        if (npt.Input.isLeftDown()) {
            let entity = new npt.Entity("Box");
            entity.addComponent(npt.PhysicsBody.createBoxBody(
                npt.Maths.pixelToMeterVector2(npt.Input.getPosition()), 2, 3, 3, .7, false
            ));
            entity.addComponent(new npt.Shape(
                npt.Shape.RECTANGLE, npt.Color.random(), true, {
                width: 3,
                height: 3,
                outline: npt.Color.black,
                thickness: .3
            }
            ));

            this.scene.addChild(entity);
            console.log(npt.Entity.getTree(this.scene));
        }
        if (npt.Input.isMiddleDown()) {
            let entity = new npt.Entity("Ball");
            entity.addComponent(npt.PhysicsBody.createCircleBody(
                npt.Maths.pixelToMeterVector2(npt.Input.getPosition()), 1, 3, .7, false
            ));
            entity.addComponent(new npt.Shape(
                npt.Shape.CIRCLE, npt.Color.random(), true, {
                radius: 3,
                outline: npt.Color.black,
                thickness: .3
            }
            ));

            this.scene.addChild(entity);
            // npt.DestroyQueue.add(entity);

            // console.log(npt.Entity.getTree(this.scene));
            let bodies = this.scene.getChildrenWithComponent(npt.PhysicsBody);
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i]
                let component = body.getComponent(npt.PhysicsBody);
                let aabb = component.getAABB();
                if (aabb.min.y > this.height * npt.Maths.PIXEL_TO_METER) {
                    npt.DestroyQueue.add(body);
                    //    console.log("destroyed");
                    // console.log(npt.Entity.getTree(this.scene));
                }
            }
        }






    }

    Draw(ctx) {
        super.Draw(ctx);
        this.scene.draw(ctx);
        npt.PhysicsEngine.contactPoints = [];

    }
}

new Game();