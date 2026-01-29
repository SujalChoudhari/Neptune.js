/**
 * Triton Editor - Timeline Component
 * Visual timeline for animation keyframe editing
 */

/**
 * Timeline - Animation timeline with tracks and keyframes
 */
export class Timeline {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.canvas = null;
        this.ctx = null;

        this.zoom = 100; // pixels per second
        this.scrollX = 0;
        this.trackHeight = 32;
        this.headerHeight = 30;
        this.isDragging = false;
        this.selectedKeyframe = null;
    }

    /**
     * Initialize the timeline
     */
    init() {
        this.container = document.getElementById('timeline-container');
        if (!this.container) return;

        this.createCanvas();
        this.setupEventListeners();

        // Subscribe to animation events
        this.editor.events.on('animation:loaded', () => this.render());
        this.editor.events.on('animation:keyframe-added', () => this.render());
        this.editor.events.on('animation:keyframe-removed', () => this.render());
        this.editor.events.on('animation:timeupdate', () => this.render());
    }

    /**
     * Create canvas for timeline rendering
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'timeline-canvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        new ResizeObserver(() => this.resize()).observe(this.container);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    }

    /**
     * Resize canvas
     */
    resize() {
        if (!this.container) return;

        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        this.render();
    }

    /**
     * Convert time to x position
     */
    timeToX(time) {
        return time * this.zoom - this.scrollX;
    }

    /**
     * Convert x position to time
     */
    xToTime(x) {
        return (x + this.scrollX) / this.zoom;
    }

    /**
     * Render the timeline
     */
    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        const animation = this.editor.animationEditor?.currentAnimation;
        const rig = this.editor.rigEditor?.currentRig;

        if (!animation || !rig) {
            this.renderEmpty();
            return;
        }

        this.renderTimeRuler(animation.duration);
        this.renderTracks(animation, rig);
        this.renderPlayhead();
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        const ctx = this.ctx;
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No animation loaded', this.width / 2, this.height / 2);
    }

    /**
     * Render time ruler
     */
    renderTimeRuler(duration) {
        const ctx = this.ctx;

        // Header background
        ctx.fillStyle = '#252525';
        ctx.fillRect(0, 0, this.width, this.headerHeight);

        // Time markers
        ctx.strokeStyle = '#444';
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        const step = 0.1; // 100ms intervals
        for (let t = 0; t <= duration; t += step) {
            const x = this.timeToX(t);
            if (x < 0 || x > this.width) continue;

            const isMajor = Math.abs(t % 1) < 0.01;

            ctx.beginPath();
            ctx.moveTo(x, this.headerHeight - (isMajor ? 15 : 8));
            ctx.lineTo(x, this.headerHeight);
            ctx.stroke();

            if (isMajor) {
                ctx.fillText(t.toFixed(1) + 's', x, 12);
            }
        }

        // Header border
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(0, this.headerHeight);
        ctx.lineTo(this.width, this.headerHeight);
        ctx.stroke();
    }

    /**
     * Render animation tracks
     */
    renderTracks(animation, rig) {
        const ctx = this.ctx;
        let y = this.headerHeight;

        for (const slot of rig.slots) {
            const track = animation.tracks[slot.id];

            // Track background
            ctx.fillStyle = y % (this.trackHeight * 2) === this.headerHeight ? '#222' : '#1e1e1e';
            ctx.fillRect(0, y, this.width, this.trackHeight);

            // Track label
            ctx.fillStyle = '#888';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(slot.name, 8, y + this.trackHeight / 2 + 4);

            // Keyframes
            if (track && track.keyframes) {
                for (const kf of track.keyframes) {
                    this.renderKeyframe(kf, y, slot.id);
                }
            }

            y += this.trackHeight;
        }
    }

    /**
     * Render a keyframe diamond
     */
    renderKeyframe(keyframe, trackY, slotId) {
        const ctx = this.ctx;
        const x = this.timeToX(keyframe.time);
        const y = trackY + this.trackHeight / 2;
        const size = 6;

        if (x < 0 || x > this.width) return;

        const isSelected = this.selectedKeyframe &&
            this.selectedKeyframe.slotId === slotId &&
            this.selectedKeyframe.time === keyframe.time;

        ctx.fillStyle = isSelected ? '#4a90d9' : '#e8a336';
        ctx.strokeStyle = isSelected ? '#6ab0ff' : '#ffc966';
        ctx.lineWidth = 1;

        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Render playhead
     */
    renderPlayhead() {
        const ctx = this.ctx;
        const animEditor = this.editor.animationEditor;
        if (!animEditor) return;

        const x = this.timeToX(animEditor.currentTime);

        // Playhead line
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();

        // Playhead handle
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.moveTo(x - 6, 0);
        ctx.lineTo(x + 6, 0);
        ctx.lineTo(x, 10);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Mouse down handler
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on header (seek)
        if (y < this.headerHeight) {
            const time = this.xToTime(x);
            this.editor.animationEditor?.seek(time);
            this.isDragging = true;
            return;
        }

        // Check for keyframe click
        // TODO: Implement keyframe selection
    }

    /**
     * Mouse move handler
     */
    onMouseMove(e) {
        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = this.xToTime(x);
            this.editor.animationEditor?.seek(time);
        }
    }

    /**
     * Mouse up handler
     */
    onMouseUp(e) {
        this.isDragging = false;
    }

    /**
     * Wheel handler (zoom/scroll)
     */
    onWheel(e) {
        e.preventDefault();

        if (e.ctrlKey) {
            // Zoom
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(20, Math.min(500, this.zoom * delta));
        } else {
            // Scroll
            this.scrollX += e.deltaX || e.deltaY;
            this.scrollX = Math.max(0, this.scrollX);
        }

        this.render();
    }
}
