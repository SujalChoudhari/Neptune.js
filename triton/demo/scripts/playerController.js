/**
 * PlayerController Script
 * Handles player movement, jumping, and animations
 */

export class PlayerController {
    constructor(entity, config = {}) {
        this.entity = entity;
        this.moveSpeed = config.moveSpeed || 200;
        this.jumpForce = config.jumpForce || 400;
        this.isGrounded = false;
        this.velocity = { x: 0, y: 0 };
        this.facing = 1; // 1 = right, -1 = left

        // State
        this.canJump = true;
        this.coyoteTime = 0.1; // seconds
        this.coyoteTimer = 0;
        this.jumpBufferTime = 0.1;
        this.jumpBuffer = 0;
    }

    update(deltaTime, input) {
        // Horizontal movement
        let moveX = 0;
        if (input.keys['ArrowLeft'] || input.keys['KeyA']) {
            moveX = -1;
            this.facing = -1;
        }
        if (input.keys['ArrowRight'] || input.keys['KeyD']) {
            moveX = 1;
            this.facing = 1;
        }

        this.velocity.x = moveX * this.moveSpeed;

        // Coyote time (allows jump shortly after leaving ground)
        if (this.isGrounded) {
            this.coyoteTimer = this.coyoteTime;
        } else {
            this.coyoteTimer -= deltaTime;
        }

        // Jump buffer (queue jump if pressed slightly before landing)
        if (input.keys['ArrowUp'] || input.keys['KeyW'] || input.keys['Space']) {
            this.jumpBuffer = this.jumpBufferTime;
        } else {
            this.jumpBuffer -= deltaTime;
        }

        // Jump
        if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
            this.velocity.y = -this.jumpForce;
            this.coyoteTimer = 0;
            this.jumpBuffer = 0;
            this.isGrounded = false;
            this.playSound('jump');
        }

        // Update animation
        this.updateAnimation();

        return this.velocity;
    }

    updateAnimation() {
        const animator = this.entity.getComponent('Animator');
        if (!animator) return;

        if (!this.isGrounded) {
            animator.play('jump');
        } else if (Math.abs(this.velocity.x) > 0) {
            animator.play('walk');
        } else {
            animator.play('idle');
        }

        // Flip sprite based on facing direction
        const sprite = this.entity.getComponent('Sprite');
        if (sprite) {
            sprite.scaleX = this.facing;
        }
    }

    onCollision(other) {
        if (other.type === 'ground' || other.type === 'platform') {
            if (this.velocity.y > 0) {
                this.isGrounded = true;
                this.velocity.y = 0;
            }
        }

        if (other.type === 'collectible') {
            this.collectItem(other);
        }

        if (other.type === 'enemy') {
            // Check if we're stomping
            if (this.velocity.y > 0 && this.entity.transform.y < other.transform.y) {
                // Stomp enemy
                other.destroy();
                this.velocity.y = -this.jumpForce * 0.6; // Bounce
                this.playSound('bump');
            } else {
                // Take damage
                this.takeDamage(1);
            }
        }
    }

    collectItem(item) {
        const collectible = item.getComponent('Collectible');
        if (collectible) {
            this.entity.game.score += collectible.value;
            this.playSound('coin');
            item.destroy();
        }
    }

    takeDamage(amount) {
        this.entity.health -= amount;
        this.playSound('hurt');

        if (this.entity.health <= 0) {
            this.die();
        }
    }

    die() {
        // Respawn logic
        this.entity.game.respawnPlayer();
    }

    playSound(name) {
        this.entity.game?.audio?.play(name);
    }
}
