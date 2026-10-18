import { application, Color, Entity, Scene, Shape, Transform, Vector2 } from "../../src/neptune.js";

export const scene = new Scene("First Game");

const floor = new Entity("Floor");
floor.AddComponent(new Transform(new Vector2(8, 8)));
floor.AddComponent(new Shape(Shape.RECTANGLE, {
    width: 12,
    height: 1,
    color: Color.FromHex(0x477a49),
    outline: null
}));
scene.AddChild(floor);

export const player = new Entity("Player");
player.AddComponent(new Transform(new Vector2(8, 6)));
player.AddComponent(new Shape(Shape.CIRCLE, {
    radius: 0.5,
    color: Color.FromHex(0xf2c14e),
    outline: Color.FromHex(0x263238)
}));
scene.AddChild(player);

application.clearColor = Color.FromHex(0x17212b);
