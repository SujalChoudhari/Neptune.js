/**
 * Triton Editor - Animation Panel
 * UI for animation controls and management
 */

import { Panel } from './panelSystem.js';

/**
 * AnimationPanel - Animation controls and keyframe management
 */
export class AnimationPanel extends Panel {
    constructor(editor) {
        super('animation-controls', 'Animation');
        this.editor = editor;
    }

    init() {
        super.init();

        // Subscribe to animation events
        this.editor.events.on('animation:loaded', () => this.update());
        this.editor.events.on('animation:play', () => this.updatePlayState());
        this.editor.events.on('animation:pause', () => this.updatePlayState());
        this.editor.events.on('animation:stop', () => this.updatePlayState());
        this.editor.events.on('animation:timeupdate', () => this.updateTimeDisplay());

        this.setupEventListeners();
    }

    setupEventListeners() {
        const panel = document.getElementById('animation-panel');
        if (!panel) return;

        panel.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            switch (btn.id) {
                case 'btn-play':
                    this.editor.animationEditor?.play();
                    break;
                case 'btn-pause':
                    this.editor.animationEditor?.pause();
                    break;
                case 'btn-stop':
                    this.editor.animationEditor?.stop();
                    break;
                case 'btn-prev-frame':
                    this.stepFrame(-1);
                    break;
                case 'btn-next-frame':
                    this.stepFrame(1);
                    break;
                case 'btn-add-keyframe':
                    this.addKeyframeToSelected();
                    break;
                case 'btn-new-animation':
                    this.createAnimation();
                    break;
            }
        });
    }

    render() {
        const animEditor = this.editor.animationEditor;
        const animation = animEditor?.currentAnimation;

        if (!animation) {
            return `
                <div class="animation-empty">
                    <p class="empty-state">Select a rigged entity to animate</p>
                    <button id="btn-new-animation" class="primary-btn">Create Animation</button>
                </div>
            `;
        }

        const isPlaying = animEditor.isPlaying;

        return `
            <div class="animation-header">
                <span class="animation-name">${animation.name}</span>
                <span class="animation-duration">${animation.duration.toFixed(1)}s</span>
            </div>
            <div class="animation-controls">
                <button id="btn-stop" class="control-btn" title="Stop">⏹️</button>
                <button id="btn-prev-frame" class="control-btn" title="Previous Frame">⏮️</button>
                <button id="${isPlaying ? 'btn-pause' : 'btn-play'}" class="control-btn play-btn" title="${isPlaying ? 'Pause' : 'Play'}">
                    ${isPlaying ? '⏸️' : '▶️'}
                </button>
                <button id="btn-next-frame" class="control-btn" title="Next Frame">⏭️</button>
                <button id="btn-add-keyframe" class="control-btn" title="Add Keyframe">💎</button>
            </div>
            <div class="time-display">
                <span id="current-time">${animEditor.currentTime.toFixed(2)}s</span>
                <span class="time-separator">/</span>
                <span>${animation.duration.toFixed(2)}s</span>
            </div>
            <div id="timeline-container" class="timeline-container"></div>
        `;
    }

    updatePlayState() {
        const playBtn = document.querySelector('.play-btn');
        if (!playBtn) return;

        const isPlaying = this.editor.animationEditor?.isPlaying;
        playBtn.id = isPlaying ? 'btn-pause' : 'btn-play';
        playBtn.title = isPlaying ? 'Pause' : 'Play';
        playBtn.innerHTML = isPlaying ? '⏸️' : '▶️';
    }

    updateTimeDisplay() {
        const timeEl = document.getElementById('current-time');
        if (!timeEl) return;

        const time = this.editor.animationEditor?.currentTime || 0;
        timeEl.textContent = time.toFixed(2) + 's';
    }

    stepFrame(direction) {
        const animEditor = this.editor.animationEditor;
        if (!animEditor) return;

        const fps = 60;
        const frameTime = 1 / fps;
        const newTime = animEditor.currentTime + (direction * frameTime);
        animEditor.seek(newTime);
    }

    addKeyframeToSelected() {
        const animEditor = this.editor.animationEditor;
        const selectedSlot = this.editor.state.get('selectedSlot');

        if (!selectedSlot) {
            this.editor.console.log('warn', 'Select a slot to add keyframe');
            return;
        }

        animEditor?.addKeyframe(selectedSlot);
        this.editor.console.log('info', `Added keyframe at ${animEditor.currentTime.toFixed(2)}s`);
    }

    createAnimation() {
        const name = prompt('Animation name:', 'New Animation');
        if (!name) return;

        const duration = parseFloat(prompt('Duration (seconds):', '1')) || 1;
        this.editor.animationEditor?.createAnimation(name, duration);
        this.update();
    }
}
