import { 
    Application, 
    Rect,
    Polygon,
    Circle,
    SpriteSheetAnimation,
    SpriteSheet,
    Color,
    Vector2 }  from "../src/neptune.js";


class Game extends Application {
    constructor() {
        super();
        this.rect = new Rect({
            pos: new Vector2(10, 10),
            size: new Vector2(100, 100),
            color: Color.red,
            app: this
        });

        this.polygon = new Polygon({
            pos: new Vector2(300,0),
            points: [
                new Vector2(0, 0),
                new Vector2(100, 0),
                new Vector2(100, 100),
                new Vector2(0, 100)
            ],
            color: Color.violet,
            app: this
        });

        this.circle = new Circle({
            pos: new Vector2(200, 200),
            radius: 50,
            color: Color.green,
            app: this
        });


        this.spritesheet = new SpriteSheetAnimation({
            src: "https://toppng.com/uploads/preview/spelunky-sprite-sheet-11562984861xfrhfytweq.png",
            pos: new Vector2(0, 0),
            size: new Vector2(200, 200),
            name: "test",
        });

        this.spritesheetAll = new SpriteSheet({
            src: "https://toppng.com/uploads/preview/spelunky-sprite-sheet-11562984861xfrhfytweq.png",
            pos: new Vector2(0,0),
            size: new Vector2(16, 16),
            name: 'all'
        });

    }

    init() {
        super.init();
        // this.spritesheet.addSprite("test",0,0,840/12,859/12);
        this.spritesheet.addRow(0, 0, 840 / 12, 859 / 12, 9);
        this.spritesheet.startTimedAnimation(20);
        this.spritesheetAll.addGrid( 0, 0, 840 / 12, 859 / 12, 12, 12);
        this.spritesheetAll.deleteSprite([
            "all_11", "all_12",
            "all_36",
            "all_60",
            "all_95", "all_96",
            "all_105", "all_106", "all_107", "all_108",
            "all_132", "all_131",
            "all_140", "all_141", "all_142", "all_143", "all_144"
        ]);
    }

    draw(ctx){
        super.draw(ctx);
        this.spritesheet.draw(ctx,300,300);
            let a = 0;
            for (let i = 0; i < 12; i++) {
                for (let j = 0; j < 12; j++) {
                    a++;
                    this.spritesheetAll.draw(ctx, "all_" + a, i * 20, (j * 20)+ 200);
                }
            }
    }
}

new Game();