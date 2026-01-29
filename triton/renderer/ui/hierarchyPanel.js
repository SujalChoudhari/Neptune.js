/**
 * Triton Editor - Hierarchy Panel
 * Shows entity tree for the current scene
 */

import { Panel } from './panelSystem.js';

/**
 * HierarchyPanel - Entity tree view
 */
export class HierarchyPanel extends Panel {
    constructor(editor) {
        super('hierarchy', 'Hierarchy');
        this.editor = editor;
    }

    init() {
        super.init();

        // Subscribe to scene and selection changes
        this.editor.state.subscribe('currentScene', () => this.update());
        this.editor.state.subscribe('selectedEntities', () => this.update());

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const content = document.getElementById('hierarchy-content');
        if (!content) return;

        content.addEventListener('click', (e) => {
            const item = e.target.closest('.hierarchy-item');
            if (!item) return;

            const entityId = item.dataset.entityId;
            if (entityId) {
                this.editor.sceneEditor?.selectEntity(entityId, e.shiftKey || e.ctrlKey);
            }
        });

        content.addEventListener('dblclick', (e) => {
            const item = e.target.closest('.hierarchy-item');
            if (!item) return;

            // TODO: Focus entity in viewport
            const entityId = item.dataset.entityId;
            this.editor.console.log('info', `Focus entity: ${entityId}`);
        });

        // Context menu
        content.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const item = e.target.closest('.hierarchy-item');
            if (item) {
                this.showContextMenu(e.clientX, e.clientY, item.dataset.entityId);
            }
        });
    }

    render() {
        const scene = this.editor.state.get('currentScene');
        if (!scene) {
            return '<div class="empty-state">No scene loaded</div>';
        }

        const mainLayer = scene.layers?.find(l => l.type === 'main');
        if (!mainLayer || !mainLayer.entities || mainLayer.entities.length === 0) {
            return `
                <div class="hierarchy-header">
                    <span class="scene-name">📁 ${scene.name || 'Untitled Scene'}</span>
                </div>
                <div class="empty-state">No entities in scene</div>
            `;
        }

        const selected = this.editor.state.get('selectedEntities') || [];
        const selectedIds = new Set(selected.map(e => e.id));

        return `
            <div class="hierarchy-header">
                <span class="scene-name">📁 ${scene.name || 'Untitled Scene'}</span>
            </div>
            <div class="entity-tree">
                ${mainLayer.entities.map(entity =>
            this.renderEntity(entity, selectedIds.has(entity.id))
        ).join('')}
            </div>
        `;
    }

    renderEntity(entity, isSelected) {
        const icon = this.getEntityIcon(entity);
        return `
            <div class="hierarchy-item ${isSelected ? 'selected' : ''}" 
                 data-entity-id="${entity.id}">
                <span class="entity-icon">${icon}</span>
                <span class="entity-name">${entity.name || entity.id}</span>
            </div>
        `;
    }

    getEntityIcon(entity) {
        // Determine icon based on components
        if (entity.components) {
            if (entity.components.find(c => c.type === 'Rig')) return '🎭';
            if (entity.components.find(c => c.type === 'Sprite')) return '🖼️';
            if (entity.components.find(c => c.type === 'Collider')) return '📦';
        }
        return '🎮';
    }

    showContextMenu(x, y, entityId) {
        // Remove any existing menu
        document.querySelector('.context-menu')?.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="duplicate">📋 Duplicate</div>
            <div class="menu-item" data-action="delete">🗑️ Delete</div>
            <div class="menu-separator"></div>
            <div class="menu-item" data-action="rename">✏️ Rename</div>
        `;

        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.menu-item');
            if (!item) return;

            switch (item.dataset.action) {
                case 'delete':
                    this.editor.sceneEditor?.removeEntity(entityId);
                    break;
                case 'duplicate':
                    // TODO: Duplicate entity
                    this.editor.console.log('info', 'Duplicate not yet implemented');
                    break;
                case 'rename':
                    // TODO: Rename entity
                    this.editor.console.log('info', 'Rename not yet implemented');
                    break;
            }
            menu.remove();
        });

        document.body.appendChild(menu);

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }
}
