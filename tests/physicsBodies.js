import * as npt from '../src/neptune.js'


export class Game extends npt.Application {
    constructor() {
        super();
        this.scene = new npt.Scene();
        this.physicsTimeStep = 40;
        npt.PhysicsEngine.iterations = 5;

        this.ground = new npt.Entity("Ground");
        this.ground.addComponent(new npt.BoxBody(
            new npt.Vector2(0, 60),
            100, 4, 4, 1, true
        ));
        this.ground.addComponent(new npt.Shape(npt.Shape.RECTANGLE, npt.Color.random(), true, { width: 100, height: 4 }));
        this.scene.addChild(this.ground);


        this.box = new npt.Entity("Box");
        this.box.addComponent(new npt.BoxBody(
            new npt.Vector2(30, 40),
            10, 10, 10, 1, false
        ));

        this.box.addComponent(new npt.Shape(npt.Shape.RECTANGLE, npt.Color.random(), true, { width: 10, height: 10 }));
        this.scene.addChild(this.box);


        // this.circle = new npt.Entity("Circle");
        // this.circle.addComponent(new npt.CircleBody(
        //     new npt.Vector2(20, 20),
        //     2, 10, 1, false
        // ));

        // this.circle.addComponent(new npt.Shape(npt.Shape.CIRCLE, npt.Color.random(), true, { radius: 2 }));
        // this.scene.addChild(this.circle);

        this.polygon = new npt.Entity("Polygon");
        this.polygon.addComponent(new npt.PolygonBody(
            new npt.Vector2(0, 30),
            [
                new npt.Vector2(0, 0),
                new npt.Vector2(0, 5),
                new npt.Vector2(30, 5),
                new npt.Vector2(5, 0)
            ],
            22, 1, false
        ));

        this.polygon.addComponent(new npt.Shape(npt.Shape.POLYGON, npt.Color.random(), true, {
            points: [
                new npt.Vector2(0, 0),
                new npt.Vector2(0, 5),
                new npt.Vector2(30, 5),
                new npt.Vector2(5, 0)
            ]
        }));
        this.scene.addChild(this.polygon);

    }

    Init() {
        super.Init();

    }

    Update(deltaTime) {
        super.Update(deltaTime);

        if (npt.Input.isLeftDown()) {
            let entity = new npt.Entity("Box");
            entity.addComponent(new npt.BoxBody(
                npt.Maths.pixelToMeterVector2(npt.Input.getPosition()),
                10, 10, 2, 1, false));

            entity.addComponent(new npt.Shape(npt.Shape.RECTANGLE, npt.Color.random(), true, { width: 10, height: 10 }));

            this.scene.addChild(entity);
            console.log(this.scene.getTree());
        }


        let bodies = this.scene.getChildrenWithComponent(npt.BoxBody);
        for (let i = 0; i < bodies.length; i++) {
            let body = bodies[i]
            let component = body.getComponent(npt.BoxBody);
            let aabb = component.getAABB();
            if (aabb.min.y > this.height * npt.Maths.PIXEL_TO_METER) {
                npt.DestroyQueue.add(body);
                //    console.log("destroyed");
                // console.log(npt.Entity.getTree(this.scene));
            }
        }

    }

    Draw(ctx) {
        super.Draw(ctx);
        this.scene.draw(ctx);
    }
}

new Game();