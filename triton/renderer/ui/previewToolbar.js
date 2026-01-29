/**
 * Triton Editor - Preview Toolbar
 * Play/pause/stop controls for game preview
 */

import { PREVIEW_MODE } from '../preview/gamePreview.js';

/**
 * PreviewToolbar - Game preview controls
 */
export class PreviewToolbar {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
    }

    /**
     * Initialize the toolbar
     */
    init() {
        this.container = document.getElementById('preview-toolbar');
        if (!this.container) {
            this.createToolbar();
        }

        this.setupEventListeners();

        // Subscribe to state changes
        this.editor.events.on('preview:state-changed', ({ mode }) => {
            this.updateState(mode);
        });
    }

    /**
     * Create toolbar if it doesn't exist
     */
    createToolbar() {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;

        const previewSection = document.createElement('div');
        previewSection.id = 'preview-toolbar';
        previewSection.className = 'toolbar-section preview-toolbar';
        previewSection.innerHTML = this.render();

        // Insert before spacer or at end
        const spacer = toolbar.querySelector('.toolbar-spacer');
        if (spacer) {
            toolbar.insertBefore(previewSection, spacer);
        } else {
            toolbar.appendChild(previewSection);
        }

        this.container = previewSection;
    }

    /**
     * Render toolbar HTML
     */
    render() {
        return `
            <button id="btn-preview-play" class="toolbar-btn preview-btn" title="Play (F5)">
                <span class="preview-icon">▶️</span>
            </button>
            <button id="btn-preview-pause" class="toolbar-btn preview-btn" title="Pause (F6)" disabled>
                <span class="preview-icon">⏸️</span>
            </button>
            <button id="btn-preview-stop" class="toolbar-btn preview-btn" title="Stop (F7)" disabled>
                <span class="preview-icon">⏹️</span>
            </button>
            <span class="preview-status" id="preview-status">Ready</span>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            switch (btn.id) {
                case 'btn-preview-play':
                    this.editor.events.emit('preview:play');
                    break;
                case 'btn-preview-pause':
                    this.editor.events.emit('preview:pause');
                    break;
                case 'btn-preview-stop':
                    this.editor.events.emit('preview:stop');
                    break;
            }
        });
    }

    /**
     * Update toolbar state
     */
    updateState(mode) {
        if (!this.container) return;

        const playBtn = this.container.querySelector('#btn-preview-play');
        const pauseBtn = this.container.querySelector('#btn-preview-pause');
        const stopBtn = this.container.querySelector('#btn-preview-stop');
        const status = this.container.querySelector('#preview-status');

        switch (mode) {
            case PREVIEW_MODE.STOPPED:
                playBtn.disabled = false;
                playBtn.innerHTML = '<span class="preview-icon">▶️</span>';
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                status.textContent = 'Ready';
                status.className = 'preview-status';
                break;

            case PREVIEW_MODE.PLAYING:
                playBtn.disabled = false;
                playBtn.innerHTML = '<span class="preview-icon">▶️</span>';
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                status.textContent = 'Playing';
                status.className = 'preview-status playing';
                break;

            case PREVIEW_MODE.PAUSED:
                playBtn.disabled = false;
                playBtn.innerHTML = '<span class="preview-icon">▶️</span>';
                pauseBtn.disabled = true;
                stopBtn.disabled = false;
                status.textContent = 'Paused';
                status.className = 'preview-status paused';
                break;
        }
    }
}
