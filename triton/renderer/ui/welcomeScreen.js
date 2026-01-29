/**
 * Triton Editor - Welcome Screen
 * First-run experience and project selection
 */

/**
 * WelcomeScreen - Shown when no project is open
 */
export class WelcomeScreen {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.recentProjects = [];
    }

    /**
     * Initialize welcome screen
     */
    init() {
        this.loadRecentProjects();

        // Subscribe to project events
        this.editor.events.on('project:opened', () => this.hide());
        this.editor.events.on('project:closed', () => this.show());

        // Show welcome if no project is open
        const hasProject = this.editor.state.get('projectPath');
        if (!hasProject) {
            this.show();
        }
    }

    /**
     * Load recent projects from localStorage
     */
    loadRecentProjects() {
        try {
            const saved = localStorage.getItem('triton-recent-projects');
            this.recentProjects = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.recentProjects = [];
        }
    }

    /**
     * Save recent projects
     */
    saveRecentProjects() {
        try {
            localStorage.setItem('triton-recent-projects', JSON.stringify(this.recentProjects));
        } catch (e) {
            console.warn('Could not save recent projects');
        }
    }

    /**
     * Add project to recent list
     */
    addToRecent(projectPath, projectName) {
        // Remove if already exists
        this.recentProjects = this.recentProjects.filter(p => p.path !== projectPath);

        // Add to front
        this.recentProjects.unshift({
            path: projectPath,
            name: projectName,
            lastOpened: new Date().toISOString()
        });

        // Keep only last 10
        this.recentProjects = this.recentProjects.slice(0, 10);
        this.saveRecentProjects();
    }

    /**
     * Show the welcome screen
     */
    show() {
        // Create overlay if doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'welcome-screen';
            this.container.className = 'welcome-screen';
            document.body.appendChild(this.container);
        }

        this.container.innerHTML = this.render();
        this.container.style.display = 'flex';
        this.setupEventListeners();
    }

    /**
     * Hide the welcome screen
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Render welcome screen
     */
    render() {
        const recentHtml = this.recentProjects.length > 0 ? `
            <div class="welcome-recent">
                <h3>Recent Projects</h3>
                <ul class="recent-list">
                    ${this.recentProjects.map(p => `
                        <li class="recent-item" data-path="${this.escapeHtml(p.path)}">
                            <span class="recent-icon">📁</span>
                            <div class="recent-info">
                                <span class="recent-name">${this.escapeHtml(p.name)}</span>
                                <span class="recent-path">${this.escapeHtml(p.path)}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : '';

        return `
            <div class="welcome-content">
                <div class="welcome-header">
                    <div class="welcome-logo">
                        <span class="logo-icon">🔱</span>
                        <h1>Triton Editor</h1>
                    </div>
                    <p class="welcome-tagline">Visual Game Editor for Neptune.js</p>
                </div>

                <div class="welcome-actions">
                    <button class="welcome-btn primary" id="btn-new-project">
                        <span class="btn-icon">✨</span>
                        <div class="btn-text">
                            <span class="btn-title">New Project</span>
                            <span class="btn-desc">Create a new game project</span>
                        </div>
                    </button>

                    <button class="welcome-btn" id="btn-open-project">
                        <span class="btn-icon">📂</span>
                        <div class="btn-text">
                            <span class="btn-title">Open Project</span>
                            <span class="btn-desc">Open an existing project folder</span>
                        </div>
                    </button>

                    <button class="welcome-btn" id="btn-open-demo">
                        <span class="btn-icon">🎮</span>
                        <div class="btn-text">
                            <span class="btn-title">Open Demo Project</span>
                            <span class="btn-desc">Explore a sample platformer game</span>
                        </div>
                    </button>
                </div>

                ${recentHtml}

                <div class="welcome-footer">
                    <a href="#" class="welcome-link" id="link-docs">📖 Documentation</a>
                    <a href="#" class="welcome-link" id="link-github">⭐ GitHub</a>
                    <span class="welcome-version">v0.1.0</span>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // New project
        this.container.querySelector('#btn-new-project')?.addEventListener('click', () => {
            this.showNewProjectDialog();
        });

        // Open project
        this.container.querySelector('#btn-open-project')?.addEventListener('click', () => {
            this.editor.events.emit('menu:open-project');
        });

        // Open demo
        this.container.querySelector('#btn-open-demo')?.addEventListener('click', () => {
            this.openDemoProject();
        });

        // Recent projects
        this.container.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.editor.events.emit('project:open', path);
            });
        });

        // Links
        this.container.querySelector('#link-docs')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.editor.events.emit('app:open-url', 'https://github.com/SujalChoudhari/Neptune.js');
        });

        this.container.querySelector('#link-github')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.editor.events.emit('app:open-url', 'https://github.com/SujalChoudhari/Neptune.js');
        });
    }

    /**
     * Show new project dialog
     */
    showNewProjectDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog new-project-dialog">
                <div class="dialog-header">
                    <h2>Create New Project</h2>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="form-group">
                        <label for="project-name">Project Name</label>
                        <input type="text" id="project-name" placeholder="My Awesome Game" value="New Project">
                    </div>
                    <div class="form-group">
                        <label for="project-location">Location</label>
                        <div class="input-browse">
                            <input type="text" id="project-location" placeholder="Select folder..." readonly>
                            <button id="btn-browse-location">Browse...</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Template</label>
                        <div class="template-grid">
                            <div class="template-option selected" data-template="blank">
                                <span class="template-icon">📄</span>
                                <span class="template-name">Blank</span>
                            </div>
                            <div class="template-option" data-template="platformer">
                                <span class="template-icon">🏃</span>
                                <span class="template-name">Platformer</span>
                            </div>
                            <div class="template-option" data-template="topdown">
                                <span class="template-icon">🎯</span>
                                <span class="template-name">Top-Down</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-secondary" id="btn-dialog-cancel">Cancel</button>
                    <button class="btn-primary" id="btn-dialog-create">Create Project</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Template selection
        dialog.querySelectorAll('.template-option').forEach(opt => {
            opt.addEventListener('click', () => {
                dialog.querySelectorAll('.template-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // Browse location
        dialog.querySelector('#btn-browse-location')?.addEventListener('click', () => {
            this.editor.events.emit('dialog:select-folder', (path) => {
                const input = dialog.querySelector('#project-location');
                if (input) input.value = path;
            });
        });

        // Cancel
        dialog.querySelector('#btn-dialog-cancel')?.addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.dialog-close')?.addEventListener('click', () => {
            dialog.remove();
        });

        // Create
        dialog.querySelector('#btn-dialog-create')?.addEventListener('click', () => {
            const name = dialog.querySelector('#project-name')?.value || 'New Project';
            const location = dialog.querySelector('#project-location')?.value;
            const template = dialog.querySelector('.template-option.selected')?.dataset.template || 'blank';

            if (!location) {
                alert('Please select a project location');
                return;
            }

            this.editor.events.emit('project:create', { name, location, template });
            dialog.remove();
        });

        // Click outside to close
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    /**
     * Open the demo project
     */
    openDemoProject() {
        // The demo folder is relative to the app
        this.editor.events.emit('project:open-demo');
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
