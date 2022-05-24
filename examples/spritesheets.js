import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        this.spritesheet = new npt.SpriteSheet({
            src: "https://toppng.com/uploads/preview/spelunky-sprite-sheet-11562984861xfrhfytweq.png",
            pos: new npt.Vector2(0,0),
            size: new npt.Vector2(32,32)
        });

        // this.spritesheet.addSprite("test",0,0,840/12,859/12);
        this.spritesheet.addGrid("test",0,0,840/12,859/12,12,12);
    }

    init(){
        super.init();
        this.spritesheet.deleteSprite([
            "test_11", "test_12",
            "test_36",
            "test_60",
            "test_95","test_96",
            "test_105","test_106","test_107","test_108",
            "test_132" ,"test_131",
            "test_140","test_141", "test_142","test_143","test_144"
        ]);
        console.log(this.spritesheet.sprites);
    }
    
    draw(ctx){
        
        this.spritesheet.draw(ctx,"test_5");
        let a = 0;
        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 12; j++) {
                a++;
                this.spritesheet.draw(ctx,"test_" + a,i*40+i, j*40+j);
            }
        }

    }
}
// Create a new Game
new Game();