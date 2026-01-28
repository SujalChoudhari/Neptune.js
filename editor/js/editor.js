/**
 * Neptune Editor - Main Controller
 * Handles mode switching, panel management, and project state
 */

import { SceneEditor } from './modes/sceneEditor.js';
import { WorldMap } from './modes/worldMap.js';
import { CharacterEditor } from './modes/characterEditor.js';
import { EnemyEditor } from './modes/enemyEditor.js';
import { CutsceneEditor } from './modes/cutsceneEditor.js';
import { ProjectIO } from './io/project.js';

class Editor {
    constructor() {
        this.currentMode = 'scene';
        this.project = {
            name: 'Untitled',
            scenes: [],
            characters: [],
            enemies: [],
            cutscenes: [],
            settings: {}
        };

        // Mode instances
        this.modes = {
            scene: null,
            world: null,
            characters: null,
            enemies: null,
            cutscenes: null
        };

        this.projectIO = new ProjectIO(this);
        this.init();
    }

    init() {
        this.setupViewport();
        this.setupModeButtons();
        this.setupToolbarButtons();
        this.initModes();
        this.switchMode('scene');
    }

    setupViewport() {
        this.canvas = document.getElementById('viewport');
        this.ctx = this.canvas.getContext('2d');

        // Resize canvas to fit container
        const resizeCanvas = () => {
            const container = document.getElementById('viewport-container');
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight - 40; // minus toolbar
            this.render();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }

    setupModeButtons() {
        const tabs = document.querySelectorAll('.mode-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchMode(tab.dataset.mode);
            });
        });
    }

    setupToolbarButtons() {
        document.getElementById('btn-save').addEventListener('click', () => {
            this.projectIO.save();
        });

        document.getElementById('btn-load').addEventListener('click', () => {
            this.projectIO.load();
        });

        document.getElementById('btn-export').addEventListener('click', () => {
            this.projectIO.export();
        });

        document.getElementById('btn-test').addEventListener('click', () => {
            this.projectIO.runTests();
        });

        document.getElementById('btn-play').addEventListener('click', () => this.play());
        document.getElementById('btn-pause').addEventListener('click', () => this.pause());
        document.getElementById('btn-stop').addEventListener('click', () => this.stop());

        document.getElementById('btn-grid').addEventListener('click', (e) => {
            e.target.classList.toggle('active');
            this.render();
        });
    }

    initModes() {
        this.modes.scene = new SceneEditor(this);
        this.modes.world = new WorldMap(this);
        this.modes.characters = new CharacterEditor(this);
        this.modes.enemies = new EnemyEditor(this);
        this.modes.cutscenes = new CutsceneEditor(this);
    }

    switchMode(mode) {
        // Update tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Deactivate current mode
        if (this.modes[this.currentMode]) {
            this.modes[this.currentMode].deactivate();
        }

        this.currentMode = mode;

        // Activate new mode
        if (this.modes[mode]) {
            this.modes[mode].activate();
        }

        this.updatePanels();
        this.render();
    }

    updatePanels() {
        // Let current mode update panels
        if (this.modes[this.currentMode]) {
            this.modes[this.currentMode].updatePanels();
        }
    }

    render() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid if enabled
        if (document.getElementById('btn-grid').classList.contains('active')) {
            this.drawGrid();
        }

        // Let current mode render
        if (this.modes[this.currentMode]) {
            this.modes[this.currentMode].render(this.ctx);
        }
    }

    drawGrid() {
        const gridSize = 32;
        this.ctx.strokeStyle = '#3a3a3a';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 0.5, 0);
            this.ctx.lineTo(x + 0.5, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y + 0.5);
            this.ctx.lineTo(this.canvas.width, y + 0.5);
            this.ctx.stroke();
        }
    }

    play() {
        document.getElementById('btn-play').disabled = true;
        document.getElementById('btn-pause').disabled = false;
        document.getElementById('btn-stop').disabled = false;
        this.isPlaying = true;
    }

    pause() {
        document.getElementById('btn-pause').disabled = true;
        document.getElementById('btn-play').disabled = false;
        this.isPlaying = false;
    }

    stop() {
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-pause').disabled = true;
        document.getElementById('btn-stop').disabled = true;
        this.isPlaying = false;
        this.render();
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new Editor();
});

export { Editor };
