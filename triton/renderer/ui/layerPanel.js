/**
 * Triton Editor - Layer Panel
 * Manages scene layers (background, parallax, tilemap, main, foreground)
 */

import { Panel } from './panelSystem.js';

/**
 * Layer types and their icons
 */
const LAYER_TYPES = {
    'background-image': { icon: '🖼️', name: 'Background' },
    'parallax': { icon: '🌄', name: 'Parallax' },
    'tilemap': { icon: '🧱', name: 'Tilemap' },
    'main': { icon: '🎮', name: 'Main Layer' }
};

/**
 * LayerPanel - Shows and manages scene layers
 */
export class LayerPanel extends Panel {
    constructor(editor) {
        super('layers', 'Layers');
        this.editor = editor;
        this.draggedLayer = null;
    }

    init() {
        super.init();

        // Subscribe to scene changes
        this.editor.state.subscribe('currentScene', () => this.update());
        this.editor.state.subscribe('activeLayer', () => this.update());

        // Setup event delegation
        this.setupEventListeners();
    }

    setupEventListeners() {
        const content = document.getElementById('layers-content');
        if (!content) return;

        // Layer item clicks
        content.addEventListener('click', (e) => {
            const item = e.target.closest('.layer-item');
            if (!item) return;

            const layerIndex = parseInt(item.dataset.index);

            // Visibility toggle
            if (e.target.classList.contains('layer-visibility')) {
                this.toggleVisibility(layerIndex);
                return;
            }

            // Lock toggle
            if (e.target.classList.contains('layer-lock')) {
                this.toggleLock(layerIndex);
                return;
            }

            // Select layer
            this.selectLayer(layerIndex);
        });

        // Add layer button
        document.getElementById('btn-add-layer')?.addEventListener('click', () => {
            this.showAddLayerMenu();
        });
    }

    /**
     * Render the layer panel
     */
    render() {
        const scene = this.editor.state.get('currentScene');
        if (!scene || !scene.layers) {
            return '<div class="empty-state">No scene loaded</div>';
        }

        const activeIndex = this.editor.state.get('activeLayer');

        // Render layers in reverse order (top layers first visually)
        const layersHtml = [...scene.layers].reverse().map((layer, reverseIndex) => {
            const index = scene.layers.length - 1 - reverseIndex;
            return this.renderLayerItem(layer, index, index === activeIndex);
        }).join('');

        return `
            <div class="layer-panel-toolbar">
                <button id="btn-add-layer" class="icon-btn" title="Add Layer">+</button>
            </div>
            <div class="layer-list">
                ${layersHtml}
            </div>
        `;
    }

    /**
     * Render a single layer item
     */
    renderLayerItem(layer, index, isActive) {
        const typeInfo = LAYER_TYPES[layer.type] || { icon: '📄', name: layer.type };
        const visIcon = layer.visible !== false ? '👁️' : '👁️‍🗨️';
        const lockIcon = layer.locked ? '🔒' : '🔓';

        return `
            <div class="layer-item ${isActive ? 'active' : ''}" 
                 data-index="${index}"
                 draggable="true">
                <span class="layer-visibility" title="Toggle Visibility">${visIcon}</span>
                <span class="layer-icon">${typeInfo.icon}</span>
                <span class="layer-name">${layer.name || typeInfo.name}</span>
                <span class="layer-lock" title="Toggle Lock">${lockIcon}</span>
            </div>
        `;
    }

    /**
     * Select a layer
     */
    selectLayer(index) {
        this.editor.state.set('activeLayer', index);
        this.editor.events.emit('layer:selected', { index });
    }

    /**
     * Toggle layer visibility
     */
    toggleVisibility(index) {
        const scene = this.editor.state.get('currentScene');
        if (!scene || !scene.layers[index]) return;

        const layer = scene.layers[index];
        layer.visible = layer.visible === false ? true : false;

        this.editor.state.set('currentScene', { ...scene });
        this.editor.events.emit('layer:visibility', { index, visible: layer.visible });
        this.update();
    }

    /**
     * Toggle layer lock
     */
    toggleLock(index) {
        const scene = this.editor.state.get('currentScene');
        if (!scene || !scene.layers[index]) return;

        const layer = scene.layers[index];
        layer.locked = !layer.locked;

        this.editor.state.set('currentScene', { ...scene });
        this.editor.events.emit('layer:lock', { index, locked: layer.locked });
        this.update();
    }

    /**
     * Show add layer menu
     */
    showAddLayerMenu() {
        // Create simple dropdown menu
        const menu = document.createElement('div');
        menu.className = 'layer-add-menu';
        menu.innerHTML = `
            <div class="menu-item" data-type="tilemap">🧱 Tilemap Layer</div>
            <div class="menu-item" data-type="parallax">🌄 Parallax Layer</div>
            <div class="menu-item" data-type="background-image">🖼️ Background Image</div>
        `;

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.menu-item');
            if (item) {
                this.addLayer(item.dataset.type);
                menu.remove();
            }
        });

        // Position near button
        const btn = document.getElementById('btn-add-layer');
        const rect = btn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 'px';

        document.body.appendChild(menu);

        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    /**
     * Add a new layer
     */
    addLayer(type) {
        const scene = this.editor.state.get('currentScene');
        if (!scene) return;

        let newLayer;
        switch (type) {
            case 'tilemap':
                newLayer = {
                    type: 'tilemap',
                    name: 'New Tilemap',
                    visible: true,
                    locked: false,
                    tileset: null,
                    width: 40,
                    height: 22,
                    data: [],
                    collision: false
                };
                break;
            case 'parallax':
                newLayer = {
                    type: 'parallax',
                    name: 'New Parallax',
                    visible: true,
                    locked: false,
                    depth: 'back',
                    blur: 0,
                    scrollSpeed: 0.5,
                    image: null
                };
                break;
            case 'background-image':
                newLayer = {
                    type: 'background-image',
                    name: 'Background',
                    visible: true,
                    locked: false,
                    src: null
                };
                break;
            default:
                return;
        }

        // Insert at appropriate position
        scene.layers.push(newLayer);
        this.editor.state.set('currentScene', { ...scene });
        this.editor.events.emit('layer:added', { layer: newLayer });
        this.update();

        this.editor.console.log('info', `Added ${type} layer`);
    }

    /**
     * Remove a layer
     */
    removeLayer(index) {
        const scene = this.editor.state.get('currentScene');
        if (!scene || !scene.layers[index]) return;

        // Don't allow removing main layer
        if (scene.layers[index].type === 'main') {
            this.editor.console.log('warn', 'Cannot remove main layer');
            return;
        }

        const removed = scene.layers.splice(index, 1)[0];
        this.editor.state.set('currentScene', { ...scene });
        this.editor.events.emit('layer:removed', { layer: removed, index });
        this.update();

        this.editor.console.log('info', `Removed layer: ${removed.name || removed.type}`);
    }
}
