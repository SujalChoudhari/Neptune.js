import type { MockEntity } from "./types"

export const MOCK_ENTITY: MockEntity = {
    name: "Player_Character",
    active: true,
    transform: {
        position: { x: 128, y: 256 },
        rotation: 0,
        scale: { x: 1, y: 1 }
    },
    sprite: {
        path: "assets/sprites/player.png",
        width: 64,
        height: 64,
        blendMode: "source-over"
    },
    collider: {
        width: 48,
        height: 56,
        offsetX: 8,
        offsetY: 4,
        isTrigger: false
    },
    body: {
        velocityX: 0,
        velocityY: 0,
        gravity: 980,
        maxFallSpeed: 800,
        grounded: true,
        friction: 0.9,
        drag: 0.98
    },
    sound: {
        name: "Jump",
        src: "assets/sounds/jump.wav",
        volume: 0.8,
        loop: false,
        playing: false
    },
    stats: {
        maxHealth: 100,
        health: 85,
        maxStamina: 100,
        stamina: 60,
        attack: 15,
        defense: 8,
        speed: 120
    },
    animator: {
        currentAnimation: "idle",
        speed: 1.0,
        playing: true,
        animations: ["idle", "walk", "run", "jump", "attack"]
    },
    scripts: [
        { path: "assets/scripts/player_controller.js", enabled: true },
        { path: "assets/scripts/camera_follow.js", enabled: true }
    ]
}
