/**
 * Triton Editor - Game Preview System
 * Run and test games directly in the editor
 */

/**
 * Preview modes
 */
const PREVIEW_MODE = {
    STOPPED: 'stopped',
    PLAYING: 'playing',
    PAUSED: 'paused'
};

/**
 * GamePreview - Manages in-editor game testing
 */
export class GamePreview {
    constructor(editor) {
        this.editor = editor;
        this.mode = PREVIEW_MODE.STOPPED;
        this.previewWindow = null;
        this.gameState = null;
        this.savedState = null;
        this.debugOverlay = true;
        this.showColliders = true;
        this.showFPS = true;
    }

    /**
     * Initialize the preview system
     */
    init() {
        // Setup keyboard shortcuts for preview
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'p')) {
                e.preventDefault();
                this.togglePlay();
            }
            if (e.key === 'F6') {
                e.preventDefault();
                this.pause();
            }
            if (e.key === 'F7') {
                e.preventDefault();
                this.stop();
            }
        });

        // Subscribe to toolbar buttons
        this.editor.events.on('preview:play', () => this.play());
        this.editor.events.on('preview:pause', () => this.pause());
        this.editor.events.on('preview:stop', () => this.stop());
    }

    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (this.mode === PREVIEW_MODE.PLAYING) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Start game preview
     */
    async play() {
        if (this.mode === PREVIEW_MODE.PLAYING) return;

        // Save current editor state
        if (this.mode === PREVIEW_MODE.STOPPED) {
            this.savedState = this.captureEditorState();
        }

        this.mode = PREVIEW_MODE.PLAYING;
        this.editor.events.emit('preview:state-changed', { mode: this.mode });

        try {
            // Get current scene
            const scene = this.editor.state.get('currentScene');
            if (!scene) {
                this.editor.console.log('error', 'No scene to preview');
                this.stop();
                return;
            }

            // Initialize game state
            this.gameState = this.createGameState(scene);

            // Start the game loop
            this.startGameLoop();

            this.editor.console.log('info', '▶️ Game preview started');
        } catch (error) {
            this.editor.console.log('error', `Preview failed: ${error.message}`);
            this.stop();
        }
    }

    /**
     * Pause game preview
     */
    pause() {
        if (this.mode !== PREVIEW_MODE.PLAYING) return;

        this.mode = PREVIEW_MODE.PAUSED;
        this.editor.events.emit('preview:state-changed', { mode: this.mode });
        this.editor.console.log('info', '⏸️ Game preview paused');
    }

    /**
     * Stop game preview
     */
    stop() {
        if (this.mode === PREVIEW_MODE.STOPPED) return;

        // Stop game loop
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        // Restore editor state
        if (this.savedState) {
            this.restoreEditorState(this.savedState);
            this.savedState = null;
        }

        this.gameState = null;
        this.mode = PREVIEW_MODE.STOPPED;
        this.editor.events.emit('preview:state-changed', { mode: this.mode });
        this.editor.console.log('info', '⏹️ Game preview stopped');
    }

    /**
     * Capture current editor state
     */
    captureEditorState() {
        return {
            scene: JSON.parse(JSON.stringify(this.editor.state.get('currentScene'))),
            camera: { ...this.editor.viewport.camera },
            selection: [...(this.editor.state.get('selectedEntities') || [])]
        };
    }

    /**
     * Restore editor state
     */
    restoreEditorState(state) {
        // Scene is restored automatically since we work on a copy
        if (state.camera) {
            this.editor.viewport.camera = { ...state.camera };
        }
    }

    /**
     * Create initial game state from scene
     */
    createGameState(scene) {
        return {
            scene: JSON.parse(JSON.stringify(scene)), // Deep copy
            entities: this.initializeEntities(scene),
            input: {
                keys: {},
                mouse: { x: 0, y: 0, buttons: [] }
            },
            time: {
                startTime: performance.now(),
                lastFrame: performance.now(),
                deltaTime: 0,
                elapsed: 0,
                frameCount: 0,
                fps: 0
            },
            variables: {}
        };
    }

    /**
     * Initialize entity runtime state
     */
    initializeEntities(scene) {
        const entities = {};

        for (const layer of scene.layers || []) {
            for (const entity of layer.entities || []) {
                entities[entity.id] = {
                    ...entity,
                    velocity: { x: 0, y: 0 },
                    grounded: false,
                    alive: true
                };

                // Initialize component runtime state
                for (const component of entity.components || []) {
                    this.initializeComponent(entities[entity.id], component);
                }
            }
        }

        return entities;
    }

    /**
     * Initialize component-specific runtime state
     */
    initializeComponent(entity, component) {
        switch (component.type) {
            case 'RigidBody':
                entity.physics = {
                    mass: component.mass || 1,
                    gravityScale: component.gravityScale || 1,
                    friction: component.friction || 0.5
                };
                break;
            case 'Animator':
                entity.animator = {
                    currentAnimation: component.defaultAnimation,
                    time: 0,
                    playing: true
                };
                break;
        }
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        const loop = (timestamp) => {
            if (this.mode !== PREVIEW_MODE.PLAYING) {
                if (this.mode === PREVIEW_MODE.PAUSED) {
                    this.gameLoopId = requestAnimationFrame(loop);
                }
                return;
            }

            // Calculate delta time
            const deltaTime = (timestamp - this.gameState.time.lastFrame) / 1000;
            this.gameState.time.lastFrame = timestamp;
            this.gameState.time.deltaTime = Math.min(deltaTime, 0.1); // Cap at 100ms
            this.gameState.time.elapsed = (timestamp - this.gameState.time.startTime) / 1000;
            this.gameState.time.frameCount++;

            // Update FPS every 30 frames
            if (this.gameState.time.frameCount % 30 === 0) {
                this.gameState.time.fps = Math.round(1 / deltaTime);
            }

            // Update game
            this.update();

            // Render
            this.render();

            this.gameLoopId = requestAnimationFrame(loop);
        };

        this.gameLoopId = requestAnimationFrame(loop);
    }

    /**
     * Update game logic
     */
    update() {
        const dt = this.gameState.time.deltaTime;
        const entities = Object.values(this.gameState.entities);

        for (const entity of entities) {
            if (!entity.alive) continue;

            // Apply physics
            if (entity.physics) {
                this.updatePhysics(entity, dt);
            }

            // Update animations
            if (entity.animator) {
                this.updateAnimator(entity, dt);
            }

            // Basic script update (placeholder)
            this.updateScripts(entity, dt);
        }
    }

    /**
     * Update entity physics
     */
    updatePhysics(entity, dt) {
        const gravity = 980; // pixels per second squared

        // Apply gravity
        if (!entity.grounded) {
            entity.velocity.y += gravity * entity.physics.gravityScale * dt;
        }

        // Apply velocity
        entity.transform.x += entity.velocity.x * dt;
        entity.transform.y += entity.velocity.y * dt;

        // Simple ground collision (placeholder)
        const groundY = 500;
        if (entity.transform.y >= groundY) {
            entity.transform.y = groundY;
            entity.velocity.y = 0;
            entity.grounded = true;
        } else {
            entity.grounded = false;
        }
    }

    /**
     * Update entity animator
     */
    updateAnimator(entity, dt) {
        if (!entity.animator.playing) return;
        entity.animator.time += dt;
    }

    /**
     * Update entity scripts (placeholder)
     */
    updateScripts(entity, dt) {
        // Will integrate with Neptune.js runtime scripts
    }

    /**
     * Render game state
     */
    render() {
        // Use editor viewport for rendering
        const viewport = this.editor.viewport;
        if (!viewport) return;

        // Render is handled by viewport, but we emit events for preview overlay
        this.editor.events.emit('preview:render', {
            state: this.gameState,
            showDebug: this.debugOverlay
        });
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        if (!this.gameState) return null;

        return {
            fps: this.gameState.time.fps,
            elapsed: this.gameState.time.elapsed.toFixed(1),
            entityCount: Object.keys(this.gameState.entities).length,
            mode: this.mode
        };
    }

    /**
     * Send input to game
     */
    sendInput(type, data) {
        if (!this.gameState) return;

        switch (type) {
            case 'keydown':
                this.gameState.input.keys[data.key] = true;
                break;
            case 'keyup':
                this.gameState.input.keys[data.key] = false;
                break;
            case 'mousemove':
                this.gameState.input.mouse.x = data.x;
                this.gameState.input.mouse.y = data.y;
                break;
        }
    }

    /**
     * Toggle debug overlay
     */
    toggleDebugOverlay() {
        this.debugOverlay = !this.debugOverlay;
    }

    /**
     * Toggle collider visualization
     */
    toggleColliders() {
        this.showColliders = !this.showColliders;
    }
}

export { PREVIEW_MODE };
