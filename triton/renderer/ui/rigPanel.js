/**
 * Triton Editor - Rig Panel
 * UI for managing rig slots and assigning images
 */

import { Panel } from './panelSystem.js';

/**
 * RigPanel - Shows rig slots and allows assignment/configuration
 */
export class RigPanel extends Panel {
    constructor(editor) {
        super('rig', 'Rig');
        this.editor = editor;
    }

    init() {
        super.init();

        // Subscribe to rig events
        this.editor.events.on('rig:loaded', () => this.update());
        this.editor.events.on('rig:slot-added', () => this.update());
        this.editor.events.on('rig:slot-removed', () => this.update());
        this.editor.events.on('rig:slot-selected', () => this.update());
        this.editor.events.on('rig:slot-image-changed', () => this.update());

        this.setupEventListeners();
    }

    setupEventListeners() {
        const content = document.getElementById('rig-content');
        if (!content) return;

        content.addEventListener('click', (e) => {
            // Slot selection
            const slotItem = e.target.closest('.slot-item');
            if (slotItem) {
                const slotId = slotItem.dataset.slotId;
                this.editor.state.set('selectedSlot', slotId);
                return;
            }

            // Create rig button
            if (e.target.id === 'btn-create-rig') {
                this.createRig();
                return;
            }

            // Add slot button
            if (e.target.id === 'btn-add-slot') {
                this.addSlot();
                return;
            }
        });

        // Handle drag and drop for images
        content.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        content.addEventListener('drop', (e) => {
            e.preventDefault();
            const slotItem = e.target.closest('.slot-item');
            if (slotItem) {
                const slotId = slotItem.dataset.slotId;
                this.handleImageDrop(slotId, e.dataTransfer);
            }
        });
    }

    render() {
        const rigEditor = this.editor.rigEditor;
        const rig = rigEditor?.currentRig;

        if (!rig) {
            return `
                <div class="rig-empty">
                    <p class="empty-state">No rigged entity selected</p>
                    <button id="btn-create-rig" class="primary-btn">Create Rig</button>
                </div>
            `;
        }

        const selectedSlot = this.editor.state.get('selectedSlot');
        const slots = rig.slots || [];

        return `
            <div class="rig-toolbar">
                <button id="btn-add-slot" class="icon-btn" title="Add Slot">+</button>
                <span class="rig-info">${slots.length} slots</span>
            </div>
            <div class="slot-list">
                ${slots.map(slot => this.renderSlotItem(slot, slot.id === selectedSlot)).join('')}
            </div>
            ${selectedSlot ? this.renderSlotInspector(slots.find(s => s.id === selectedSlot)) : ''}
        `;
    }

    renderSlotItem(slot, isSelected) {
        const hasImage = !!slot.image;
        const imagePreview = hasImage
            ? `<img src="${slot.image}" class="slot-preview"/>`
            : `<div class="slot-placeholder">?</div>`;

        return `
            <div class="slot-item ${isSelected ? 'selected' : ''}" 
                 data-slot-id="${slot.id}"
                 draggable="true">
                ${imagePreview}
                <div class="slot-info">
                    <span class="slot-name">${slot.name}</span>
                    <span class="slot-zorder">Z: ${slot.zOrder}</span>
                </div>
            </div>
        `;
    }

    renderSlotInspector(slot) {
        if (!slot) return '';

        return `
            <div class="slot-inspector">
                <div class="inspector-section">
                    <div class="inspector-section-header">
                        <span class="inspector-section-title">Slot: ${slot.name}</span>
                    </div>
                    <div class="inspector-field">
                        <label class="inspector-label">Pivot X</label>
                        <input type="range" min="0" max="1" step="0.1" 
                               value="${slot.pivot.x}" 
                               data-field="pivot.x"
                               class="inspector-slider"/>
                        <span class="slider-value">${slot.pivot.x}</span>
                    </div>
                    <div class="inspector-field">
                        <label class="inspector-label">Pivot Y</label>
                        <input type="range" min="0" max="1" step="0.1" 
                               value="${slot.pivot.y}" 
                               data-field="pivot.y"
                               class="inspector-slider"/>
                        <span class="slider-value">${slot.pivot.y}</span>
                    </div>
                    <div class="inspector-field">
                        <label class="inspector-label">Z-Order</label>
                        <input type="number" value="${slot.zOrder}" 
                               data-field="zOrder"
                               class="inspector-input"/>
                    </div>
                    <button class="remove-slot-btn" data-slot-id="${slot.id}">🗑️ Remove Slot</button>
                </div>
            </div>
        `;
    }

    createRig() {
        const entities = this.editor.state.get('selectedEntities');
        if (!entities || entities.length !== 1) {
            this.editor.console.log('warn', 'Select a single entity to create rig');
            return;
        }

        this.editor.rigEditor?.createRig(entities[0], 'humanoid');
        this.update();
    }

    addSlot() {
        const name = prompt('Slot name:', 'New Slot');
        if (!name) return;

        this.editor.rigEditor?.addSlot({ name });
        this.update();
    }

    handleImageDrop(slotId, dataTransfer) {
        // Get file path from drop
        const files = dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                // For Electron, we can use the path
                const path = file.path || URL.createObjectURL(file);
                this.editor.rigEditor?.setSlotImage(slotId, path);
            }
        }
    }
}
