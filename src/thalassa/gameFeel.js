/** Reusable camera flash, particle burst, and UI feedback primitives. */
export class GameFeel {
    constructor({ camera = null, onUIFeedback = null, random = Math.random } = {}) {
        if (camera !== null && typeof camera.shake !== "function") throw new TypeError("GameFeel camera must support shake(amount, duration)");
        if (onUIFeedback !== null && typeof onUIFeedback !== "function") throw new TypeError("onUIFeedback must be a function");
        if (typeof random !== "function") throw new TypeError("random must be a function");
        this.camera = camera;
        this.onUIFeedback = onUIFeedback;
        this.random = random;
        this.flashEffect = null;
        this.particles = [];
    }

    /** Trigger a full-viewport color flash that fades linearly over duration. */
    flash(color = "white", duration = 0.12) {
        if (typeof color !== "string" || !color) throw new TypeError("Flash color must be a non-empty CSS color");
        if (!Number.isFinite(duration) || duration <= 0) throw new TypeError("Flash duration must be positive and finite");
        this.flashEffect = { color, duration, elapsed: 0 };
        return this;
    }

    /** Shake the configured camera. */
    shake(amount, duration) {
        if (!this.camera) throw new Error("GameFeel requires a camera to shake");
        this.camera.shake(amount, duration);
        return this;
    }

    /** Spawn a deterministic, data-configured radial particle burst. */
    burst({ x, y, count = 8, color = "white", speed = 80, lifetime = 0.35, radius = 3 } = {}) {
        if (![x, y, speed, lifetime, radius].every(Number.isFinite) || !Number.isInteger(count) || count <= 0 || speed < 0 || lifetime <= 0 || radius <= 0) {
            throw new TypeError("Particle burst requires finite position, positive count/lifetime/radius, and non-negative speed");
        }
        if (typeof color !== "string" || !color) throw new TypeError("Particle color must be a non-empty CSS color");
        for (let index = 0; index < count; index++) {
            const angle = (index / count) * Math.PI * 2;
            const velocity = speed * (0.65 + this.random() * 0.35);
            this.particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity,
                color, radius, lifetime, remaining: lifetime });
        }
        return this;
    }

    /** Send a semantic feedback payload to game-owned UI without engine-specific UI coupling. */
    notifyUI(payload) {
        if (this.onUIFeedback) this.onUIFeedback(payload);
        return this;
    }

    update(deltaTime) {
        if (!Number.isFinite(deltaTime) || deltaTime < 0) throw new TypeError("GameFeel deltaTime must be finite and non-negative");
        if (this.flashEffect) {
            this.flashEffect.elapsed = Math.min(this.flashEffect.duration, this.flashEffect.elapsed + deltaTime);
            if (this.flashEffect.elapsed >= this.flashEffect.duration) this.flashEffect = null;
        }
        for (const particle of this.particles) {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.remaining -= deltaTime;
        }
        this.particles = this.particles.filter(particle => particle.remaining > 0);
        return this;
    }

    draw(ctx, viewWidth, viewHeight) {
        if (!ctx || typeof ctx.fillRect !== "function") throw new TypeError("GameFeel.draw requires a 2D canvas context");
        if (!Number.isFinite(viewWidth) || viewWidth < 0 || !Number.isFinite(viewHeight) || viewHeight < 0) {
            throw new TypeError("GameFeel viewport dimensions must be finite and non-negative");
        }
        if (this.flashEffect) {
            const previousAlpha = ctx.globalAlpha;
            const previousFillStyle = ctx.fillStyle;
            ctx.globalAlpha = 1 - this.flashEffect.elapsed / this.flashEffect.duration;
            ctx.fillStyle = this.flashEffect.color;
            ctx.fillRect(0, 0, viewWidth, viewHeight);
            ctx.globalAlpha = previousAlpha;
            ctx.fillStyle = previousFillStyle;
        }
        if (this.particles.length) {
            ctx.save?.();
            for (const particle of this.particles) {
                if (typeof ctx.beginPath !== "function" || typeof ctx.arc !== "function" || typeof ctx.fill !== "function") break;
                ctx.globalAlpha = Math.max(0, particle.remaining / particle.lifetime);
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore?.();
        }
    }
}
