import * as npt from "../src/neptune.js"

class Game extends npt.Application{
    constructor(){
        super();
        npt.Cookies.save("test", "test");
        npt.Cookies.save("test2", "test2");
        npt.Cookies.save("test3", "test3");
        console.log(npt.Cookies.load("test"));
        console.log(npt.Cookies.load("test2"));
        console.log(npt.Cookies.load("test3"));

        // npt.Cookies.delete("test");
        // npt.Cookies.deleteAll();
    }
}
// Create a new Game
new Game();