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
            22 , 1, false
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

    }

    Draw(ctx) {
        super.Draw(ctx);
        this.scene.draw(ctx);

        //draw polygon aabb
        let aabb = this.polygon.getComponent(npt.PolygonBody).aabb;
        ctx.strokeStyle = "red";
        ctx.strokeRect(aabb.x, aabb.y, aabb.width, aabb.height);
        ctx.stroke();
    }
}

new Game();