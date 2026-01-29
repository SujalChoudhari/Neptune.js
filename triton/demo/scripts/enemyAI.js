/**
 * PatrolAI Script
 * Simple enemy patrol behavior
 */

export class PatrolAI {
    constructor(entity, config = {}) {
        this.entity = entity;
        this.patrolDistance = config.patrolDistance || 100;
        this.speed = config.speed || 50;
        this.direction = config.direction || 1;

        this.startX = entity.transform.x;
        this.pauseTime = 0;
        this.isPaused = false;
    }

    update(deltaTime) {
        // Pause at patrol ends
        if (this.isPaused) {
            this.pauseTime -= deltaTime;
            if (this.pauseTime <= 0) {
                this.isPaused = false;
            }
            return { x: 0, y: 0 };
        }

        // Move in current direction
        const velocity = { x: this.direction * this.speed, y: 0 };

        // Check bounds
        const currentX = this.entity.transform.x;
        const minX = this.startX - this.patrolDistance / 2;
        const maxX = this.startX + this.patrolDistance / 2;

        if (currentX <= minX || currentX >= maxX) {
            this.direction *= -1;
            this.isPaused = true;
            this.pauseTime = 0.5; // Pause for half second
        }

        // Flip sprite
        const sprite = this.entity.getComponent('Sprite');
        if (sprite) {
            sprite.scaleX = this.direction;
        }

        return velocity;
    }

    onCollision(other) {
        // Turn around if hitting a wall
        if (other.type === 'wall' || other.type === 'obstacle') {
            this.direction *= -1;
        }
    }
}

/**
 * FlyingAI Script
 * Sinusoidal flying pattern
 */
export class FlyingAI {
    constructor(entity, config = {}) {
        this.entity = entity;
        this.amplitude = config.amplitude || 30;
        this.frequency = config.frequency || 2;
        this.speed = config.speed || 80;
        this.direction = config.direction || 1;

        this.startY = entity.transform.y;
        this.time = 0;
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Horizontal movement
        const velocityX = this.direction * this.speed;

        // Sinusoidal vertical movement
        const targetY = this.startY + Math.sin(this.time * this.frequency) * this.amplitude;
        const velocityY = (targetY - this.entity.transform.y) * 5;

        // Flip sprite
        const sprite = this.entity.getComponent('Sprite');
        if (sprite) {
            sprite.scaleX = this.direction;
        }

        return { x: velocityX, y: velocityY };
    }
}

/**
 * ChaseAI Script
 * Chases the player when in range
 */
export class ChaseAI {
    constructor(entity, config = {}) {
        this.entity = entity;
        this.detectionRange = config.detectionRange || 200;
        this.chaseSpeed = config.chaseSpeed || 100;
        this.patrolSpeed = config.patrolSpeed || 40;
        this.isChasing = false;
    }

    update(deltaTime, game) {
        const player = game.getPlayer();
        if (!player) return { x: 0, y: 0 };

        const dx = player.transform.x - this.entity.transform.x;
        const dy = player.transform.y - this.entity.transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.detectionRange) {
            // Chase player
            this.isChasing = true;
            const direction = dx > 0 ? 1 : -1;

            const sprite = this.entity.getComponent('Sprite');
            if (sprite) sprite.scaleX = direction;

            return { x: direction * this.chaseSpeed, y: 0 };
        } else {
            this.isChasing = false;
            return { x: 0, y: 0 };
        }
    }
}
