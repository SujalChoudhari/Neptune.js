/**
 * Triton Editor - Enhanced Inspector
 * Component-based property inspector with drag-and-drop
 */

import { ColorPicker } from './colorPicker.js';

/**
 * Component types and their field configurations
 */
const COMPONENT_CONFIGS = {
    Transform: {
        icon: '📍',
        fields: [
            { name: 'x', type: 'number', label: 'X', step: 1 },
            { name: 'y', type: 'number', label: 'Y', step: 1 },
            { name: 'rotation', type: 'number', label: 'Rotation', step: 1, min: -360, max: 360 },
            { name: 'scale.x', type: 'number', label: 'Scale X', step: 0.1 },
            { name: 'scale.y', type: 'number', label: 'Scale Y', step: 0.1 }
        ]
    },
    Sprite: {
        icon: '🖼️',
        fields: [
            { name: 'image', type: 'asset', label: 'Image', assetType: 'image' },
            { name: 'tint', type: 'color', label: 'Tint' },
            { name: 'opacity', type: 'slider', label: 'Opacity', min: 0, max: 1, step: 0.01 },
            { name: 'flipX', type: 'boolean', label: 'Flip X' },
            { name: 'flipY', type: 'boolean', label: 'Flip Y' }
        ]
    },
    RigidBody: {
        icon: '⚡',
        fields: [
            { name: 'mass', type: 'number', label: 'Mass', min: 0.1, step: 0.1 },
            { name: 'gravityScale', type: 'number', label: 'Gravity Scale', step: 0.1 },
            { name: 'friction', type: 'slider', label: 'Friction', min: 0, max: 1, step: 0.01 },
            { name: 'isStatic', type: 'boolean', label: 'Is Static' }
        ]
    },
    BoxCollider: {
        icon: '📦',
        fields: [
            { name: 'width', type: 'number', label: 'Width', min: 1 },
            { name: 'height', type: 'number', label: 'Height', min: 1 },
            { name: 'offset.x', type: 'number', label: 'Offset X' },
            { name: 'offset.y', type: 'number', label: 'Offset Y' },
            { name: 'isTrigger', type: 'boolean', label: 'Is Trigger' }
        ]
    },
    CircleCollider: {
        icon: '⭕',
        fields: [
            { name: 'radius', type: 'number', label: 'Radius', min: 1 },
            { name: 'offset.x', type: 'number', label: 'Offset X' },
            { name: 'offset.y', type: 'number', label: 'Offset Y' },
            { name: 'isTrigger', type: 'boolean', label: 'Is Trigger' }
        ]
    },
    PlayerController: {
        icon: '🎮',
        fields: [
            { name: 'moveSpeed', type: 'number', label: 'Move Speed', min: 0 },
            { name: 'jumpForce', type: 'number', label: 'Jump Force', min: 0 },
            { name: 'groundCheck', type: 'boolean', label: 'Ground Check' }
        ]
    },
    Animator: {
        icon: '🎬',
        fields: [
            { name: 'defaultAnimation', type: 'text', label: 'Default Animation' },
            { name: 'animations', type: 'animations', label: 'Animations' }
        ]
    },
    Text: {
        icon: '📝',
        fields: [
            { name: 'text', type: 'text', label: 'Text' },
            { name: 'font', type: 'text', label: 'Font' },
            { name: 'color', type: 'color', label: 'Color' },
            { name: 'align', type: 'select', label: 'Align', options: ['left', 'center', 'right'] }
        ]
    },
    Collectible: {
        icon: '💰',
        fields: [
            { name: 'value', type: 'number', label: 'Value', min: 0 },
            { name: 'sound', type: 'asset', label: 'Sound', assetType: 'audio' }
        ]
    },
    Tilemap: {
        icon: '🗺️',
        fields: [
            { name: 'tileset', type: 'asset', label: 'Tileset', assetType: 'image' },
            { name: 'tileWidth', type: 'number', label: 'Tile Width', min: 1 },
            { name: 'tileHeight', type: 'number', label: 'Tile Height', min: 1 },
            { name: 'width', type: 'number', label: 'Map Width', min: 1 },
            { name: 'height', type: 'number', label: 'Map Height', min: 1 }
        ]
    }
};

/**
 * EnhancedInspector - Advanced property editor
 */
export class EnhancedInspector {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.currentEntity = null;
        this.colorPickers = [];
    }

    /**
     * Initialize the inspector
     */
    init() {
        this.container = document.getElementById('entity-inspector');
        if (!this.container) return;

        // Subscribe to selection changes
        this.editor.events.on('entity:selected', (entity) => {
            this.inspect(entity);
        });

        this.editor.events.on('entity:deselected', () => {
            this.clear();
        });

        this.editor.events.on('entity:updated', (entity) => {
            if (entity.id === this.currentEntity?.id) {
                this.inspect(entity);
            }
        });
    }

    /**
     * Inspect an entity
     */
    inspect(entity) {
        if (!entity || !this.container) return;

        this.currentEntity = entity;
        this.container.innerHTML = this.render(entity);
        this.setupEventListeners();
    }

    /**
     * Clear the inspector
     */
    clear() {
        this.currentEntity = null;
        this.colorPickers.forEach(p => p.destroy());
        this.colorPickers = [];

        if (this.container) {
            this.container.innerHTML = '<div class="empty-state">Select an entity to inspect</div>';
        }
    }

    /**
     * Render entity inspector
     */
    render(entity) {
        return `
            <div class="inspector-entity">
                <div class="entity-header">
                    <input type="text" class="entity-name" value="${entity.name || 'Entity'}" data-field="name">
                    <span class="entity-id">${entity.id}</span>
                </div>

                <div class="component-list">
                    ${this.renderTransform(entity)}
                    ${(entity.components || []).map(c => this.renderComponent(c)).join('')}
                </div>

                <div class="add-component">
                    <select class="add-component-select">
                        <option value="">+ Add Component</option>
                        ${Object.keys(COMPONENT_CONFIGS).filter(t => t !== 'Transform').map(t =>
            `<option value="${t}">${COMPONENT_CONFIGS[t].icon} ${t}</option>`
        ).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Render transform (always present)
     */
    renderTransform(entity) {
        const t = entity.transform || { x: 0, y: 0, rotation: 0, scale: { x: 1, y: 1 } };
        return this.renderComponentSection('Transform', COMPONENT_CONFIGS.Transform, t, false);
    }

    /**
     * Render a component
     */
    renderComponent(component) {
        const config = COMPONENT_CONFIGS[component.type];
        if (!config) {
            return this.renderUnknownComponent(component);
        }
        return this.renderComponentSection(component.type, config, component, true);
    }

    /**
     * Render component section
     */
    renderComponentSection(type, config, data, removable) {
        const removeBtn = removable ?
            `<button class="remove-component-btn" data-component="${type}">×</button>` : '';

        return `
            <div class="component-section" data-component-type="${type}">
                <div class="component-header">
                    <span class="component-icon">${config.icon}</span>
                    <span class="component-name">${type}</span>
                    ${removeBtn}
                </div>
                <div class="component-fields">
                    ${config.fields.map(f => this.renderField(f, data, type)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render unknown component
     */
    renderUnknownComponent(component) {
        return `
            <div class="component-section unknown">
                <div class="component-header">
                    <span class="component-icon">❓</span>
                    <span class="component-name">${component.type}</span>
                </div>
                <div class="component-fields">
                    <pre class="component-json">${JSON.stringify(component, null, 2)}</pre>
                </div>
            </div>
        `;
    }

    /**
     * Render a field
     */
    renderField(field, data, componentType) {
        const value = this.getNestedValue(data, field.name);
        const fieldId = `${componentType}-${field.name}`.replace(/\./g, '-');

        switch (field.type) {
            case 'number':
                return `
                    <div class="field-row">
                        <label class="field-label">${field.label}</label>
                        <input type="number" class="field-input number" 
                            id="${fieldId}"
                            data-component="${componentType}" 
                            data-field="${field.name}"
                            value="${value ?? 0}"
                            step="${field.step || 1}"
                            ${field.min !== undefined ? `min="${field.min}"` : ''}
                            ${field.max !== undefined ? `max="${field.max}"` : ''}>
                    </div>
                `;

            case 'slider':
                return `
                    <div class="field-row">
                        <label class="field-label">${field.label}</label>
                        <div class="field-slider-wrapper">
                            <input type="range" class="field-slider"
                                id="${fieldId}"
                                data-component="${componentType}" 
                                data-field="${field.name}"
                                value="${(value ?? field.min) || 0}"
                                min="${field.min || 0}"
                                max="${field.max || 100}"
                                step="${field.step || 1}">
                            <span class="slider-value">${value ?? 0}</span>
                        </div>
                    </div>
                `;

            case 'text':
                return `
                    <div class="field-row">
                        <label class="field-label">${field.label}</label>
                        <input type="text" class="field-input text"
                            id="${fieldId}"
                            data-component="${componentType}" 
                            data-field="${field.name}"
                            value="${value || ''}">
                    </div>
                `;

            case 'boolean':
                return `
                    <div class="field-row">
                        <label class="field-label">${field.label}</label>
                        <input type="checkbox" class="field-checkbox"
                            id="${fieldId}"
                            data-component="${componentType}" 
                            data-field="${field.name}"
                            ${value ? 'checked' : ''}>
                    </div>
                `;

            case 'color':
                return `
                    <div class="field-row">
                        <label class="field-label">${field.label}</label>
                        <div class="field-color-wrapper">
                            <input type="color" class="field-color"
                                id="${fieldId}"
                                data-component="${componentType}" 
                                data-field="${field.name}"
                                value="${value || '#ffffff'}">
                            <input type="text" class="field-color-text"
                                value="${value || '#ffffff'}"
                                data-for="${fieldId}">
                        </div>
                    </div>
                `;

            case 'select':
                return `
                    <div class="field-row">
                        <label class="field-label">${field.label}</label>
                        <select class="field-select"
                            id="${fieldId}"
                            data-component="${componentType}" 
                            data-field="${field.name}">
                            ${(field.options || []).map(o =>
                    `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`
                ).join('')}
                        </select>
                    </div>
                `;

            case 'asset':
                return `
                    <div class="field-row">
                        <label class="field-label">${field.label}</label>
                        <div class="field-asset"
                            id="${fieldId}"
                            data-component="${componentType}" 
                            data-field="${field.name}"
                            data-asset-type="${field.assetType}">
                            <span class="asset-name">${value ? value.split('/').pop() : 'None'}</span>
                            <button class="asset-browse">📁</button>
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((o, p) => o?.[p], obj);
    }

    /**
     * Set nested value in object
     */
    setNestedValue(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        const target = parts.reduce((o, p) => o[p] = o[p] || {}, obj);
        target[last] = value;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        // Entity name
        this.container.querySelector('.entity-name')?.addEventListener('change', (e) => {
            this.updateEntity('name', e.target.value);
        });

        // Number inputs
        this.container.querySelectorAll('.field-input.number').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateField(e.target, parseFloat(e.target.value));
            });
        });

        // Text inputs
        this.container.querySelectorAll('.field-input.text').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateField(e.target, e.target.value);
            });
        });

        // Checkboxes
        this.container.querySelectorAll('.field-checkbox').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateField(e.target, e.target.checked);
            });
        });

        // Sliders
        this.container.querySelectorAll('.field-slider').forEach(input => {
            input.addEventListener('input', (e) => {
                const wrapper = e.target.closest('.field-slider-wrapper');
                wrapper.querySelector('.slider-value').textContent = e.target.value;
            });
            input.addEventListener('change', (e) => {
                this.updateField(e.target, parseFloat(e.target.value));
            });
        });

        // Colors
        this.container.querySelectorAll('.field-color').forEach(input => {
            input.addEventListener('input', (e) => {
                const textInput = this.container.querySelector(`[data-for="${e.target.id}"]`);
                if (textInput) textInput.value = e.target.value;
                this.updateField(e.target, e.target.value);
            });
        });

        // Selects
        this.container.querySelectorAll('.field-select').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateField(e.target, e.target.value);
            });
        });

        // Add component
        this.container.querySelector('.add-component-select')?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.addComponent(e.target.value);
                e.target.value = '';
            }
        });

        // Remove component
        this.container.querySelectorAll('.remove-component-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeComponent(e.target.dataset.component);
            });
        });
    }

    /**
     * Update entity property
     */
    updateEntity(field, value) {
        if (!this.currentEntity) return;

        this.editor.sceneEditor?.updateEntity(this.currentEntity.id, { [field]: value });
    }

    /**
     * Update component field
     */
    updateField(input, value) {
        if (!this.currentEntity) return;

        const componentType = input.dataset.component;
        const fieldPath = input.dataset.field;

        if (componentType === 'Transform') {
            // Update transform directly
            this.setNestedValue(this.currentEntity.transform, fieldPath, value);
        } else {
            // Find and update component
            const component = this.currentEntity.components?.find(c => c.type === componentType);
            if (component) {
                this.setNestedValue(component, fieldPath, value);
            }
        }

        this.editor.events.emit('entity:updated', this.currentEntity);
    }

    /**
     * Add component to entity
     */
    addComponent(type) {
        if (!this.currentEntity) return;

        const newComponent = { type };

        // Initialize with default values
        const config = COMPONENT_CONFIGS[type];
        if (config) {
            config.fields.forEach(f => {
                if (f.type === 'number') newComponent[f.name] = 0;
                if (f.type === 'boolean') newComponent[f.name] = false;
                if (f.type === 'text') newComponent[f.name] = '';
                if (f.type === 'color') newComponent[f.name] = '#ffffff';
            });
        }

        this.currentEntity.components = this.currentEntity.components || [];
        this.currentEntity.components.push(newComponent);

        this.editor.events.emit('entity:updated', this.currentEntity);
        this.inspect(this.currentEntity);
    }

    /**
     * Remove component from entity
     */
    removeComponent(type) {
        if (!this.currentEntity) return;

        this.currentEntity.components = this.currentEntity.components?.filter(c => c.type !== type);

        this.editor.events.emit('entity:updated', this.currentEntity);
        this.inspect(this.currentEntity);
    }
}
