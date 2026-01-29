/**
 * Triton Editor - Panel System
 * Manages editor panels (hierarchy, inspector, assets)
 */

/**
 * Base Panel class
 */
export class Panel {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.element = null;
        this.contentElement = null;
        this.isVisible = true;
    }

    /**
     * Initialize the panel
     */
    init() {
        this.element = document.getElementById(`panel-${this.id}`) ||
            document.getElementById(`${this.id}-panel`);
        this.contentElement = document.getElementById(`${this.id}-content`);
    }

    /**
     * Render panel content
     * @returns {string} HTML content
     */
    render() {
        return '<div class="empty-state">No content</div>';
    }

    /**
     * Update panel with new content
     */
    update() {
        if (this.contentElement) {
            this.contentElement.innerHTML = this.render();
        }
    }

    /**
     * Show the panel
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
            this.isVisible = true;
        }
    }

    /**
     * Hide the panel
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

/**
 * PanelSystem - Manages all editor panels
 */
export class PanelSystem {
    constructor(editor) {
        this.editor = editor;
        this.panels = new Map();
    }

    /**
     * Initialize all panels
     */
    async init() {
        // Create hierarchy panel
        this.hierarchy = new HierarchyPanel(this.editor);
        this.panels.set('hierarchy', this.hierarchy);

        // Create inspector panel
        this.inspector = new InspectorPanel(this.editor);
        this.panels.set('inspector', this.inspector);

        // Initialize all panels
        for (const panel of this.panels.values()) {
            panel.init();
        }

        // Subscribe to state changes
        this.editor.state.subscribe('selectedEntities', () => {
            this.inspector.update();
        });

        this.editor.state.subscribe('currentScene', () => {
            this.hierarchy.update();
        });
    }

    /**
     * Get a panel by ID
     * @param {string} id - Panel ID
     * @returns {Panel}
     */
    get(id) {
        return this.panels.get(id);
    }
}

/**
 * Hierarchy Panel - Shows entity tree
 */
export class HierarchyPanel extends Panel {
    constructor(editor) {
        super('hierarchy', 'Hierarchy');
        this.editor = editor;
    }

    render() {
        const scene = this.editor.state.get('currentScene');
        if (!scene) {
            return '<div class="empty-state">Open a project to see entities</div>';
        }

        const entities = scene.entities || [];
        if (entities.length === 0) {
            return '<div class="empty-state">No entities in scene</div>';
        }

        return entities.map(entity => this.renderEntity(entity, 0)).join('');
    }

    renderEntity(entity, depth) {
        const selected = this.editor.state.get('selectedEntities').includes(entity);
        const indent = depth * 16;

        let html = `
            <div class="hierarchy-item ${selected ? 'selected' : ''}" 
                 style="padding-left: ${indent + 8}px"
                 data-entity-id="${entity.id || entity.name}">
                <span class="hierarchy-icon">📦</span>
                <span class="hierarchy-name">${entity.name || 'Entity'}</span>
            </div>
        `;

        // Render children
        if (entity.children && entity.children.length > 0) {
            for (const child of entity.children) {
                html += this.renderEntity(child, depth + 1);
            }
        }

        return html;
    }

    init() {
        super.init();

        // Add click handler for entity selection
        if (this.contentElement) {
            this.contentElement.addEventListener('click', (e) => {
                const item = e.target.closest('.hierarchy-item');
                if (item) {
                    const entityId = item.dataset.entityId;
                    // TODO: Implement entity selection
                    console.log('Selected entity:', entityId);
                }
            });
        }
    }
}

/**
 * Inspector Panel - Shows selected entity properties
 */
export class InspectorPanel extends Panel {
    constructor(editor) {
        super('inspector', 'Inspector');
        this.editor = editor;
    }

    render() {
        const selected = this.editor.state.get('selectedEntities');
        if (!selected || selected.length === 0) {
            return '<div class="empty-state">Select an entity to inspect</div>';
        }

        if (selected.length > 1) {
            return `<div class="empty-state">${selected.length} entities selected</div>`;
        }

        const entity = selected[0];
        return this.renderEntity(entity);
    }

    renderEntity(entity) {
        let html = `
            <div class="inspector-section">
                <div class="inspector-section-header">
                    <span class="inspector-section-title">Entity</span>
                </div>
                <div class="inspector-field">
                    <label class="inspector-label">Name</label>
                    <input class="inspector-input" type="text" value="${entity.name || ''}" data-prop="name">
                </div>
            </div>
        `;

        // Render Transform
        if (entity.transform) {
            html += this.renderTransform(entity.transform);
        }

        // Render components
        if (entity.components) {
            for (const component of entity.components) {
                html += this.renderComponent(component);
            }
        }

        return html;
    }

    renderTransform(transform) {
        return `
            <div class="inspector-section">
                <div class="inspector-section-header">
                    <span class="inspector-section-title">Transform</span>
                </div>
                <div class="inspector-field">
                    <label class="inspector-label">Position</label>
                    <input class="inspector-input" type="number" value="${transform.position?.x || 0}" data-prop="transform.position.x" style="width: 60px">
                    <input class="inspector-input" type="number" value="${transform.position?.y || 0}" data-prop="transform.position.y" style="width: 60px">
                </div>
                <div class="inspector-field">
                    <label class="inspector-label">Scale</label>
                    <input class="inspector-input" type="number" value="${transform.scale?.x || 1}" data-prop="transform.scale.x" style="width: 60px">
                    <input class="inspector-input" type="number" value="${transform.scale?.y || 1}" data-prop="transform.scale.y" style="width: 60px">
                </div>
                <div class="inspector-field">
                    <label class="inspector-label">Rotation</label>
                    <input class="inspector-input" type="number" value="${transform.rotation || 0}" data-prop="transform.rotation">
                </div>
            </div>
        `;
    }

    renderComponent(component) {
        return `
            <div class="inspector-section">
                <div class="inspector-section-header">
                    <span class="inspector-section-title">${component.type || 'Component'}</span>
                </div>
                <div class="empty-state">Component editor coming soon</div>
            </div>
        `;
    }
}
