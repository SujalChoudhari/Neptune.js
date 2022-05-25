Every program has a life cycle let it be a game or some other program.
In this complete lifecycle of a program, there are mainly three stages:
* [Initialization](#initialization)
* [Execution](#execution)
    * [Update](#update)
    * [Draw](#draw)
* [Termination](#termination)

## Initialization
---------------------------------

Before the initialization stage, the files needs to be loaded. While the files are being loaded, the Html Elements with `neptune-loading` and `neptune-gamepage` as their id are shown to the user.
After loading the files, the Html Elements with `neptune-loading` are removed.


### Ideal HTML Game Page with all the neptune-* ids

```html
<!DOCTYPE html>
<html>
  <head><title>My Neptune Game</title></head>
  <body>
    <div id="neptune-gamepage">
        <!-- Your entire gamepage goes here -->
        <div id="neptune-loading">
            <!-- The elements to display while the game is loading goes here -->
        </div>
        
        <!-- Your play button is also a part of the gamepage -->
        <button id="neptune-play">Play</button> 
    </div>

    <!-- Canvas is not a part of the game page, thus its out side -->
    <canvas id="neptune-canvas"></canvas>

    <!-- The script is also not a part of the game page, thus its out side, and should be placed at the bottom of the page compulsorily -->
    <script type="module" src="./spritesheets.js"></script>
  </body>
</html>
```

When a html Button with `neptune-play` as its id is clicked the `init()` functions of all component which are registered with the application are called. Init functions are just anothor way to setup objects other than constructor, so the initialization and setup can be seperated for cleaner code.

Finally when all the components are initialized, the elements with `neptune-gamepage` as their id are removed.
The canvas scale is set to the size of the window. 
And the game enteres into the execution stage(the game loop).

## Execution
--------------------------------------
The entire execution of the game is done in the game loop.
The game loop is called every frame.
The gameloop is responsible for updating the game state and rendering the game state.
`update(deltaTime)` and `draw(ctx)` are major methods that are called during the game loop. 

### Update
The update method of the application also calls the update method of all the components which are registered with the application while the Entities are generated.


### Draw
The draw method of the application also calls the draw method of all the components which are registered with the application while the Entities are generated.

**This same structure is followed for all the Entities.**

## Termination
-----------------------------------------------------

There is no special implementation for termination. The termination of the game is currently handled by the browser (when the user closes the browser).