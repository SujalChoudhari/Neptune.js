# Creating Scripts with Behaviour and Global

## Introduction

In your application, scripts play a vital role in defining behaviors, interactions, and global functionalities.
Neptune provides two classes, `Behaviour` and `Global`, to help you create and manage scripts.

## Behaviour

A `Behaviour` is a type of script that is attached to an entity and can be used to define specific behaviors or actions. 
It extends the `Script` class and offers an `Init` function that is called when the behavior is created and an `Update` function that is called every frame.

### Example:

```javascript

// Create a new Behaviour
class MyBehaviour extends Behaviour {
    constructor() {
        super("My Behaviour", () => {
            console.log("Behaviour Created");
        }, () => {
            console.log("Behaviour Updated");
        });
    }
}

// Instantiate the Behaviour
new MyBehaviour();
// Now MyBehaviour is a reuesable component that can be attached to any entity.

// You can also create unique/lambda behaviours for convenience.
const myBehaviour = new Behaviour("My Behaviour", () => {
    console.log("Behaviour Created");
}, () => {
    console.log("Behaviour Updated");
});

// Attach the behaviour to an entity. Note cannot attach the same behaviour to multiple entities.

```

## Global

A `Global` script is attached to the global scope (window) and allows you to create and access global variables or functionalities. 
It extends the `Script` class.

### Example:

```javascript
// Import the necessary classes

// Create a new Global
class MyGlobal extends Global {
    constructor() {
        super();
        this.myVariable = 0;
    }
}

// Instantiate the Global
new MyGlobal();

// Access the global variable
console.log(window.MyGlobal.myVariable);
```

## Using Behaviour and Global

To effectively use `Behaviour` and `Global` in your application, follow these steps:

1. **Create Your Script Class**: Create a new class that extends `Behaviour` or `Global`. Define the necessary functions and properties for your script.

2. **Instantiate Your Script**: Instantiate your script class to create instances of the behavior or global functionality.

3. **Access Behavior (Optional)**: If using a `Behaviour`, you can attach it to an entity in your scene to define specific behaviors for that entity.

4. **Access Global (Optional)**: If using a `Global`, you can access the global variables or functionalities from the window object.

## Conclusion

With the `Behaviour` and `Global` classes, you can easily create scripts to define behaviors, interactions, and global functionalities in your application.
 Utilize the provided examples to create and manage your own scripts effectively.
