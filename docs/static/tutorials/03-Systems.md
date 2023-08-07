# Systems and Managers

In Neptune game development, Systems and Managers play a crucial role in managing various aspects of the game. They help organize and handle different functionalities, making the game development process more efficient and organized.

## Rendering System

The **Rendering System** is responsible for displaying the game visuals on the screen. It works closely with the Components that have renderable data (like sprites or shapes) attached to the Entities.

```
      +--------------------+
      |       Entity       |
      |   +------------+   |
      |   |Component   |   |
      |   |(Renderable)|   |
      |   +------------+   |
      +-------------------+
             |     ^
             |     |
             V     |
        Rendering  | (Every frame)
         System    | 
             |     |
             V     |
      +-----------------+
      |    CPU          |
      | (only cpu)      |
      +-----------------+
```

The Rendering System takes the renderable data from the Components of each Entity and processes it using the CPU to render the game scene. This happens every frame, right after the Update phase.

## Input System

The **Input System** manages user interactions with the game. It handles input events like keyboard presses, mouse clicks, or touch events, allowing the game to respond to player actions.

```
           +--------+
           |        |
           | Player |
           | Input  |
           |        |
           +--------+
                |
                | Polling
                V
          Input System
                |
                | Events
                V
          +-----------+
          |           |
          | Game      |
          | Logic     |
          |(Developer)|
          +-----------+
```

The Input System captures input events and translates them into meaningful actions for the game logic to process. For example, if the player presses a button, the Input System will detect the input and communicate it to the Game Logic, enabling the game to respond accordingly.

## SceneManager System

The **SceneManager System** oversees the management of different Scenes in the game. It allows the developer to switch between Scenes and control the flow of the game.

```
                +---------------------+
                |                     |
                |      SceneManager   |
                |                     |
                +---------------------+
                           |
                           V
      +------------------+------------------+
      |(Holds and Runs) |(Updates and Draws)|
      |    Main Menu    |    Game Level     |
      |  Scene Entity   |  Scene Entity     |
      +------------------+------------------+
```

The SceneManager System keeps track of all the Scenes present in the game. It decides when to Update and Draw the Entities in the active Scene. SceneManager is also responsible for scene switching, meaning it controls which Scene is active and visible. For example, when the player clicks "Start Game" on the Main Menu Scene, the SceneManager switches to the Game Level Scene to begin gameplay.

```
          +---------------------+
          |                     |
          |      SceneManager   |
          |                     |
          +---------------------+
                    |
                    V
  +---------------------------------+
  |                                 |
  | Scene1                          |
  |                                 |
  +---------------------------------+
  +---------------------------------+
  |                                 |
  | Scene2                          |
  |                                 |
  +---------------------------------+
  +---------------------------------+
  |                                 |
  | Scene3                          |
  |                                 |
  +---------------------------------+

```

## Scripting System - Behaviour Scripts

The **Scripting System** allows developers to create and run scripts in the game. Behaviour Scripts are attached to specific Entities and control their behaviors.
```
         +-------------------------+
         |                         |
         |        Entity           |
         |                         |
         +-------------------------+
                  |
                  V
            +------------+
            |            |
            | Behaviour  |
            |  Script    |
            |            |
            +------------+
                    |
                    V
      +-----------------------+
      |                       |
      | Player Movement Script|
      |                       |
      +-----------------------+
      +-----------------------+
      |                       |
      |   Enemy AI Script     |
      |                       |
      +-----------------------+
      +-----------------------+
      |                       |
      | Collision Detection   |
      |      Script           |
      +-----------------------+
```

Behaviour Scripts can be attached to Entities to give them specific functionalities. Here are a few examples of Behaviour Scripts:

1. **Player Movement Script**: This script controls the movement of the player character based on user input.

2. **Enemy AI Script**: This script implements artificial intelligence for enemy entities, determining their actions and behavior in the game.

3. **Collision Detection Script**: This script checks for collisions between Entities, handling interactions and reactions accordingly.

## Scripting System - Global Script

The **Global Script** acts as a singleton, providing functions that can be accessed from anywhere in the game.
```
             +----------------------+
             |                      |
             |    Global Script     |
             |                      |
             +----------------------+
                    |
                    V
    +----------------------------+
    |                            |
    | Utility Functions Script   |
    |                            |
    +----------------------------+
    +----------------------------+
    |                            |
    | Game Manager Script        |
    |                            |
    +----------------------------+
```

Global Scripts offer utility functions or common calculations needed throughout the game. For instance:

1. **Utility Functions**: Functions that handle common tasks like random number generation, time management, or math calculations.

2. **Game Manager Script**: This script manages overall game state, such as starting or ending the game, and handling game events.

In conclusion, Systems and Managers in Neptune game development help organize and manage various aspects of the game. They provide a structured approach to handle rendering, user input, scene management, and scripting functionalities. By working together, these systems streamline the game development process and make it easier for developers to create engaging and interactive games.