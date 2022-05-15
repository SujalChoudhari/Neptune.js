//Main
import Application from "./core/main.js";

//Basic
import Entity from "./core/src/basic/entity.js";
import { Sound } from "./core/src/basic/audio.js";
import Color from "./core/src/basic/color.js";

//Events
import Mouse from "./core/src/events/mouse.js";
import Keyboard from "./core/src/events/keyboard.js";
import EventHandler from "./core/src/events/userevents.js";
import { Event } from "./core/src/events/userevents.js";

//maths
import Vector2 from "./core/src/maths/vec2.js";
import Transform from "./core/src/maths/transform.js";

//physics
import CollidableTransform from "./core/src/physics/collidable_transform.js";
import Kinematic from "./core/src/physics/kinematic.js";

//renderable
import Circle from "./core/src/renderable/circle.js";
import Image from "./core/src/renderable/image.js";
import Polygon from "./core/src/renderable/polygon.js";
import Rect from "./core/src/renderable/rect.js";
import Triangle from "./core/src/renderable/triangle.js";

//ui
import Button from "./core/src/ui/button.js";
import Text from "./core/src/ui/text.js";

// export all the modules to the global scope
export {
    Application,
    Entity,
    Sound,
    Color,
    Mouse,
    Keyboard,
    EventHandler,
    Event,
    Vector2,
    Transform,
    CollidableTransform,
    Kinematic,
    Circle,
    Image,
    Polygon,
    Rect,
    Triangle,
    Button,
    Text
};