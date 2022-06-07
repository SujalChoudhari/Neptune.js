import * as npt from '../src/neptune.js';

class Application extends npt.Application {
    constructor() {
        super();
        npt.Atomic.init({
            app: this,
            gravity: 1,
            friction: 1,
            simInteraction: 1
        });
    }
    
    init() {

        for (let i = 0; i < 10; i++) {
            npt.Atomic.Poly.box( 200+ 30* i,30* i, 30, 30, {
                render: { fillStyle: npt.Color.random() }
            });
        }

        npt.Atomic.Poly.triangle(100, 300, 100, 100, {
            static: true,
            render: {
                fillStyle: npt.Color.random(),
            }
        });
        npt.Atomic.Poly.triangle(250, 300, 100, 100, {
            static: true,
            render: {
                fillStyle: npt.Color.random()
            }
        });

        npt.Atomic.Poly.box(300, 600, 200, 20, {
            static: true,
            render: { fillStyle: npt.Color.random()}
        });
    }

    update() {
        npt.Atomic.update();
    }

    draw() {
        npt.Atomic.render();
        npt.Details.information(npt.Atomic);
        npt.Details.dots(npt.Atomic, 1, 'black');
        npt.Details.pointIndex(npt.Atomic, '10px Arial', 'black');
        npt.Details.lines(npt.Atomic, 1, 'black', true);
        npt.Details.indexOfBodies(npt.Atomic, '10px Arial', 'black');
        npt.Details.centerOfMass(npt.Atomic, 'black');
        npt.Details.boundingBox(npt.Atomic,new npt.Color(0,0,0,0.5));
       npt.Atomic.showFps({x:0});
    }
}

new Application();