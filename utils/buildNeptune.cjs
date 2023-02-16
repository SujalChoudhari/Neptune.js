var fs = require("fs-extra");
var path = require("path");
var config = require("../package.json");


var SRC = path.join(path.dirname(__dirname),"src");
var DEST= path.join(path.dirname(__dirname),`build\\${config.version}\\neptune`);

fs.copy(SRC, DEST, function (err) {
    if (err){
        console.log('An error occured while copying the folder.');
        return console.error(err);
    }
    console.log('Build completed!');
});