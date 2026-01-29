/**
 * Triton Editor - Application Bootstrap
 * Main entry point for the renderer process
 */

import { EventBus } from './core/eventBus.js';
import { StateManager } from './core/stateManager.js';
import { HistoryManager } from './core/historyManager.js';
import { PanelSystem } from './ui/panelSystem.js';
import { Viewport } from './viewport/viewport.js';
import { ConsoleManager } from './ui/consoleManager.js';
import { SceneEditor } from './editors/sceneEditor.js';
import { TilemapEditor } from './editors/tilemapEditor.js';
import { RigEditor } from './editors/rigEditor.js';
import { HierarchyPanel } from './ui/hierarchyPanel.js';
import { LayerPanel } from './ui/layerPanel.js';
import { TilesetPanel } from './ui/tilesetPanel.js';
import { RigPanel } from './ui/rigPanel.js';

/**
 * Main editor application class
 */
class TritonEditor {
    constructor() {
        this.events = new EventBus();
        this.state = new StateManager();
        this.history = new HistoryManager();
        this.panels = new PanelSystem(this);
        this.viewport = new Viewport(this);
        this.console = new ConsoleManager(this);
        this.sceneEditor = new SceneEditor(this);
        this.tilemapEditor = new TilemapEditor(this);
        this.rigEditor = new RigEditor(this);
        this.hierarchyPanel = new HierarchyPanel(this);
        this.layerPanel = new LayerPanel(this);
        this.tilesetPanel = new TilesetPanel(this);
        this.rigPanel = new RigPanel(this);

        this.initialized = false;
    }

    /**
     * Initialize the editor
     */
    async init() {
        try {
            // Initialize subsystems
            await this.panels.init();
            await this.viewport.init();
            this.console.init();

            // Initialize scene editor and panels
            this.sceneEditor.init();
            this.tilemapEditor.init();
            this.rigEditor.init();
            this.hierarchyPanel.init();
            this.layerPanel.init();
            this.tilesetPanel.init();
            this.rigPanel.init();

            // Setup IPC listeners
            this.setupIPC();

            // Setup keyboard shortcuts
            this.setupShortcuts();

            // Setup UI event listeners
            this.setupUI();

            // Show welcome dialog
            this.showWelcomeDialog();

            this.initialized = true;
            this.console.log('info', 'Triton Editor initialized');

        } catch (error) {
            console.error('Failed to initialize editor:', error);
            this.console.log('error', `Initialization failed: ${error.message}`);
        }
    }

    /**
     * Setup IPC event listeners
     */
    setupIPC() {
        // Project events
        window.electronAPI.onProjectLoaded(async (project) => {
            this.state.set('project', project);
            this.events.emit('project:loaded', project);
            document.getElementById('project-name').textContent = project.name;
            this.console.log('info', `Opened project: ${project.name}`);

            // Close welcome dialog if open
            this.closeWelcomeDialog();

            // Update hierarchy panel to show project is loaded
            const hierarchyContent = document.getElementById('hierarchy-content');
            if (hierarchyContent) {
                hierarchyContent.innerHTML = '<div class="empty-state">Scene: ' + (project.entryScene || 'none') + '</div>';
            }

            // Load entry scene if specified
            if (project.entryScene) {
                try {
                    const scene = await window.electronAPI.loadScene(project.entryScene);
                    if (scene) {
                        this.state.set('currentScene', scene);
                        this.events.emit('scene:loaded', scene);
                        this.console.log('info', `Loaded scene: ${scene.name || project.entryScene}`);

                        // Update viewport info
                        document.getElementById('viewport-info').textContent = scene.name || 'Scene loaded';

                        // Update hierarchy with scene entities
                        if (scene.layers) {
                            const mainLayer = scene.layers.find(l => l.type === 'main');
                            if (mainLayer && mainLayer.entities && mainLayer.entities.length > 0) {
                                hierarchyContent.innerHTML = mainLayer.entities.map(e =>
                                    `<div class="hierarchy-item">📦 ${e.name || e.id}</div>`
                                ).join('');
                            }
                        }
                    }
                } catch (err) {
                    this.console.log('warn', `Could not load entry scene: ${err.message}`);
                }
            }
        });

        window.electronAPI.onProjectError((error) => {
            this.console.log('error', `Project error: ${error}`);
        });

        // Asset events
        window.electronAPI.watchAssets((event, path) => {
            this.events.emit(`asset:${event}`, { path });
            this.console.log('info', `Asset ${event}: ${path}`);
        });

        // Menu events
        window.electronAPI.onMenuEvent('menu:undo', () => this.undo());
        window.electronAPI.onMenuEvent('menu:redo', () => this.redo());
        window.electronAPI.onMenuEvent('menu:save', () => this.save());
        window.electronAPI.onMenuEvent('menu:run-tests', () => this.runTests());
        window.electronAPI.onMenuEvent('menu:new-project', () => this.newProject());
        window.electronAPI.onMenuEvent('menu:open-project', () => this.openProject());
    }

    /**
     * Setup keyboard shortcuts
     */
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'v': this.setTool('select'); break;
                    case 'm': this.setTool('move'); break;
                    case 'b': this.setTool('brush'); break;
                    case 'e': this.setTool('eraser'); break;
                }
            }

            // Ctrl shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        e.preventDefault();
                        break;
                    case 'y':
                        this.redo();
                        e.preventDefault();
                        break;
                    case 's':
                        this.save();
                        e.preventDefault();
                        break;
                }
            }

            // Function keys
            switch (e.key) {
                case 'F5':
                    this.play();
                    e.preventDefault();
                    break;
                case 'F6':
                    this.runTests();
                    e.preventDefault();
                    break;
            }
        });
    }

    /**
     * Setup UI event listeners
     */
    setupUI() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.id.replace('tool-', '');
                this.setTool(tool);
            });
        });

        // Action buttons
        document.getElementById('btn-play')?.addEventListener('click', () => this.play());
        document.getElementById('btn-test')?.addEventListener('click', () => this.runTests());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Welcome dialog buttons
        document.getElementById('btn-new-project')?.addEventListener('click', () => {
            this.closeWelcomeDialog();
            this.newProject();
        });
        document.getElementById('btn-open-project')?.addEventListener('click', () => {
            this.closeWelcomeDialog();
            this.openProject();
        });
        document.getElementById('btn-open-demo')?.addEventListener('click', () => {
            this.closeWelcomeDialog();
            this.openDemo();
        });

        // Zoom controls
        document.getElementById('zoom-in')?.addEventListener('click', () => this.viewport.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.viewport.zoomOut());
    }

    /**
     * Set the active tool
     */
    setTool(tool) {
        this.state.set('tool', tool);
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === `tool-${tool}`);
        });
        this.events.emit('tool:changed', { tool });
    }

    /**
     * Switch bottom panel tab
     */
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tab}-panel`);
        });
    }

    /**
     * Undo last action
     */
    undo() {
        this.history.undo();
        this.events.emit('undo');
    }

    /**
     * Redo last undone action
     */
    redo() {
        this.history.redo();
        this.events.emit('redo');
    }

    /**
     * Save current scene
     */
    async save() {
        try {
            await window.electronAPI.saveProject();
            this.console.log('info', 'Project saved');
        } catch (error) {
            this.console.log('error', `Save failed: ${error.message}`);
        }
    }

    /**
     * Play the game
     */
    play() {
        this.console.log('info', 'Play mode not yet implemented');
        // TODO: Launch game preview
    }

    /**
     * Run tests
     */
    async runTests() {
        this.switchTab('console');
        this.console.log('info', 'Running tests...');
        await window.electronAPI.runTests();
    }

    /**
     * Create new project
     */
    async newProject() {
        await window.electronAPI.createProject({});
    }

    /**
     * Open existing project
     */
    async openProject() {
        await window.electronAPI.openProject();
    }

    /**
     * Open demo project
     */
    async openDemo() {
        this.console.log('info', 'Opening demo project...');
        await window.electronAPI.openDemo();
    }

    /**
     * Show welcome dialog
     */
    showWelcomeDialog() {
        const dialog = document.getElementById('welcome-dialog');
        if (dialog) {
            dialog.showModal();
        }
    }

    /**
     * Close welcome dialog
     */
    closeWelcomeDialog() {
        const dialog = document.getElementById('welcome-dialog');
        if (dialog) {
            dialog.close();
        }
    }
}

// Create and initialize editor
const editor = new TritonEditor();
editor.init();

// Export for debugging
window.triton = editor;
