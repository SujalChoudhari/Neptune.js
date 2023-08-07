# User Inputs Management with KeyboardInput, MouseInput, and TouchInput

## Introduction

In your application, user input is crucial for interaction. The `KeyboardInput`, `MouseInput`, and `TouchInput` classes are designed to help you manage various input events. These classes provide static methods to check for input states and retrieve relevant information.

## KeyboardInput

The `KeyboardInput` class provides methods to handle keyboard input events.

### Methods:

- `static IsKeyDown(keyCode)`: Checks if a specific key is currently pressed.
- `static GetSpecialKeyPressed()`: Returns a keycode for a special key that is currently pressed.

```javascript
if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.SPACE)) {
    // Perform action while SPACE key is pressed.
}
```

## MouseInput

The `MouseInput` class allows you to manage mouse input events.

### Methods:

- `static IsButtonUp(button)`: Checks if a mouse button is up.
- `static IsButtonDown(button)`: Checks if a mouse button is down.
- `static IsClicked(button)`: Checks if a mouse button was clicked.
- `static GetPosition()`: Retrieves the current mouse position.

```javascript
if (MouseInput.IsButtonDown(MouseInput.BUTTON.LEFT)) {
    // Perform action while left mouse button is down.
}

if (MouseInput.IsClicked(MouseInput.BUTTON.RIGHT)) {
    // Perform action on right mouse button click.
}

const mousePosition = MouseInput.GetPosition();
console.log(`Mouse position: x=${mousePosition.x}, y=${mousePosition.y}`);
```

## TouchInput

The `TouchInput` class provides methods to handle touch input events.

### Methods:

- `static GetTouchCount()`: Returns the number of active touches.
- `static GetTouch(index)`: Retrieves information about a specific touch.
- `static IsTouchActive(index)`: Checks if a touch with a specific index is active.

```javascript
const touchCount = TouchInput.GetTouchCount();
for (let i = 0; i < touchCount; i++) {
    const touch = TouchInput.GetTouch(i);
    if (TouchInput.IsTouchActive(i)) {
        console.log(`Touch ${i}: x=${touch.x}, y=${touch.y}`);
    }
}
```

## Using Behaviours

For efficient event handling, consider using the **Behaviour** pattern. A **Behaviour** is a component that encapsulates certain functionality and can be attached to entities.

Example of a KeyboardInputBehaviour:

```javascript
class KeyboardInputBehaviour extends Behaviour {
    constructor(){
        super();
        this.Update = () =>{
        if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.ENTER)) {
            // Execute action on ENTER key press.
        }
    }
    }
}

const keyboardInputBehaviour = new KeyboardInputBehaviour();

// Add this Component to an Entity to handle keyboard input events for that Entity.

//          OR

const keyboardInputBehaviour = new Behaviour();
someEntityBehaviour.Update = function() {
    if (KeyboardInput.IsKeyDown(KeyboardInput.KEY_CODE.ENTER)) {
        // Execute action on ENTER key press.
    }
}

// Add this `someEntityBehaviour` to an Entity to handle keyboard input events for that Entity.

```

Attach the `KeyboardInputBehaviour` to an entity to handle keyboard input events. Similarly, you can create behaviours for your all types of logical needs.

Remember to add the appropriate behaviours to entities in your scenes to enable input handling.

## Conclusion

With the `KeyboardInput`, `MouseInput`, and `TouchInput` classes, you can easily manage user inputs in your application. Utilize the provided methods and consider using Behaviours for efficient event handling.