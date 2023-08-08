import { Color } from "../basic/color.js";
import { Entity } from '../basic/entity.js';
import { Scene } from '../basic/scene.js';

import { Transform } from "../components/transform.js";
import { Shape } from "../components/renderable/shape.js";
import { Sprite } from "../components/renderable/sprite.js";
import { Sound } from "../components/audio.js";

import * as UI from "../ui/ui.js"

import { MouseInput } from "../events/mouseinput.js";
import { KeyboardInput } from "../events/keyboardinput.js";
import { TouchInput } from "../events/touchinput.js";

import { Maths } from "../maths/math.js";
import { Vector2 } from "../maths/vec2.js";
import { Font } from "../basic/font.js";
import { Behaviour } from "../neptune.js";

function createEntity(name = "New Entity") {
    const entity = new Entity(name);
    entity.AddComponent(new Transform());
    return entity;
}

function createShape(name, type, param) {
    const entity = createEntity(name);
    entity.AddComponent(new Shape(type, param));
}

function createSprite(name, path, width, height) {
    const entity = createEntity(name);
    entity.AddComponent(new Sprite(path, width, height));
}

function createSound(name, path) {
    const entity = createEntity(name);
    entity.AddComponent(new Sound(path));
}

function createScene(name = "New Scene") {
    const scene = new Scene(name);
    return scene;
}

function createButton(name, params = {
    pos: Vector2.Zero,
    size: new Vector2(10, 4),
    color: Color.fuchsia,
    text: "Button",
    textColor: Color.black,
    font: new Font("Arial", 3.5, Font.STYLE.BOLD, Font.WEIGHT.LIGHTER),
    onClick: () => { },
}) {
    const entity = new Entity(name);
    entity.AddComponent(new UI.UITransform(params.pos.x, params.pos.y, params.size.x, params.size.y));
    entity.AddComponent(new UI.Panel(params.color));

    const textEntity = new Entity("Text");
    const textTransform = new UI.UITransform(0, 0, params.size.x, params.size.y);
    textEntity.AddComponent(textTransform);
    const text = new UI.Text(params.text, params.font, UI.Text.ALIGN.START, params.textColor);
    textEntity.AddComponent(text);
    entity.AddChild(textEntity);

    textEntity.AddBehaviour(new Behaviour("Text", () => { }, () => {
        textTransform.IsHovered() ? window.document.body.style.cursor = "pointer" : window.document.body.style.cursor = "default";
    }))


    return entity;
}


export {
    createEntity as Entity,
    createScene as Scene,
    createShape as Shape,
    createSprite as Sprite,
    createSound as Sound,
    createButton as Button,
}