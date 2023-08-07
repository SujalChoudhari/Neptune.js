## Using Scene and SceneManager

### Scene Creation and Management

1. **Creating Scenes and Entities:**

   You're already creating scenes and entities in your previous tutorials. 
   Each scene can contain one or more entities, each of which has components like `Transform` and `Sprite`.

2. **Loading Scenes:**

   To load a scene using the `SceneManager`, you use the `LoadScene` method and pass the scene's ID as an argument.
   First scene gets loaded by default.
   ```js
    const mainMenu = new Scene("MainMenu");
    const game = new Scene("Game");
    const gameOver = new Scene("GameOver");

    SceneManager.LoadScene(mainMenu.id);

    // or

    SceneManager.LoadScene(SceneManager.GetSceneByName("MainMenu").id);
   ```
   Once a scene is loaded, the previous scene is unloaded automatically. *There can be only one scene loaded at a time*



3. **Loading Scenes Additively:**

   You can load scenes additively using `LoadSceneAdditive` method. This allows you to have multiple scenes active at once.

    ```js
     const mainMenu = new Scene("MainMenu");
     const game = new Scene("Game");
     const gameOver = new Scene("GameOver");
    
     SceneManager.LoadSceneAdditive(mainMenu.id);
     SceneManager.LoadSceneAdditive(game.id);
     SceneManager.LoadSceneAdditive(gameOver.id);
     // All the three scenes are loaded at a time. 
     // Note: mainMenu is the active scene, as it was loaded first.
    ``` 


4. **Unloading Scenes:**

   To unload scenes, you can use `UnloadScene` or `UnloadAllAdditiveScenes` method. The former unloads a specific scene, and the latter unloads all additive scenes except the currently active scene.

### Scene Callbacks

The `Scene` class has callback methods that you can override:

- `OnSceneLoad`: Called when the scene is loaded.
- `OnSceneUnload`: Called when the scene is unloaded.
- `OnSceneLoadAdditive`: Called when the scene is loaded additively.
- `OnSceneUnloadAdditive`: Called when the scene is unloaded additively.

## Directory Structure and Control Flow

Here's an ASCII art diagram representing a simplified directory structure and the control flow for your code:

```bash
.
├── src/    # Neptune.js source code
└── your-app-folder/
    ├── index.js
    ├── index.html
    ├── style.css
    ├── components/  
    └── scenes/
        ├── Scene1.js
        └── Scene2.js

```

- `src/` is where the Neptune.js source code is located.
- `your-app-folder` contains your application code.
- `main.js` initializes and runs your application.
- `scenes/` directory contains scene scripts, e.g., `Scene1.js` and `Scene2.js`.
- `components/` directory (similar to React) can be used to define reusable components. i.e. overriding existing components or creating new ones.


Control Flow:
1. `index.js` initializes your app and sets up initial scenes and entities.
2. Scenes and entities interact with each other using `Scene` and `Entity` classes.

Please note that this is a simplified representation, and in a real-world application, you might have a more complex structure and additional components.

Feel free to adjust the directory structure and control flow according to your application's needs.