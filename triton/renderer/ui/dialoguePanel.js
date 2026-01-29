/**
 * Triton Editor - Dialogue Panel
 * UI panel for dialogue node properties
 */

import { NODE_TYPES } from '../editors/dialogueEditor.js';

/**
 * DialoguePanel - Node property editor
 */
export class DialoguePanel {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
    }

    /**
     * Initialize the panel
     */
    init() {
        this.container = document.getElementById('dialogue-inspector');
        if (!this.container) return;

        // Subscribe to events
        this.editor.events.on('dialogue:node-selected', () => this.update());
        this.editor.events.on('dialogue:node-updated', () => this.update());
        this.editor.events.on('dialogue:loaded', () => this.update());

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        this.container.addEventListener('input', (e) => {
            const target = e.target;
            const field = target.dataset.field;
            if (!field) return;

            const node = this.editor.dialogueEditor?.selectedNode;
            if (!node) return;

            // Handle nested fields like choices[0].text
            if (field.includes('[')) {
                this.handleArrayField(node, field, target.value);
            } else {
                this.editor.dialogueEditor?.updateNodeProperty(node.id, field, target.value);
            }
        });

        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const node = this.editor.dialogueEditor?.selectedNode;
            if (!node) return;

            if (btn.dataset.action === 'add-choice') {
                this.editor.dialogueEditor?.addChoice(node.id);
            } else if (btn.dataset.action === 'remove-choice') {
                const index = parseInt(btn.dataset.index);
                this.editor.dialogueEditor?.removeChoice(node.id, index);
            } else if (btn.dataset.action === 'delete-node') {
                this.editor.dialogueEditor?.removeNode(node.id);
            }
        });
    }

    /**
     * Handle array field updates
     */
    handleArrayField(node, field, value) {
        // Parse field like "choices[0].text"
        const match = field.match(/(\w+)\[(\d+)\]\.(\w+)/);
        if (!match) return;

        const [, arrayName, index, prop] = match;
        if (node[arrayName] && node[arrayName][index]) {
            node[arrayName][index][prop] = value;
            this.editor.events.emit('dialogue:node-updated', { node });
        }
    }

    /**
     * Update the panel
     */
    update() {
        if (!this.container) return;
        this.container.innerHTML = this.render();
    }

    /**
     * Render the panel
     */
    render() {
        const node = this.editor.dialogueEditor?.selectedNode;

        if (!node) {
            return `<div class="empty-state">Select a node to edit</div>`;
        }

        return `
            <div class="node-inspector">
                <div class="inspector-header" style="background: ${this.getNodeColor(node.type)}">
                    ${node.type.toUpperCase()} NODE
                </div>
                ${this.renderNodeFields(node)}
                <div class="inspector-actions">
                    <button class="danger-btn" data-action="delete-node">🗑️ Delete Node</button>
                </div>
            </div>
        `;
    }

    /**
     * Get node color
     */
    getNodeColor(type) {
        const colors = {
            [NODE_TYPES.DIALOGUE]: '#4a90d9',
            [NODE_TYPES.CHOICE]: '#e8a336',
            [NODE_TYPES.CONDITION]: '#9b59b6',
            [NODE_TYPES.ACTION]: '#27ae60',
            [NODE_TYPES.JUMP]: '#e74c3c',
            [NODE_TYPES.END]: '#7f8c8d'
        };
        return colors[type] || '#666';
    }

    /**
     * Render fields for specific node type
     */
    renderNodeFields(node) {
        switch (node.type) {
            case NODE_TYPES.DIALOGUE:
                return this.renderDialogueFields(node);
            case NODE_TYPES.CHOICE:
                return this.renderChoiceFields(node);
            case NODE_TYPES.CONDITION:
                return this.renderConditionFields(node);
            case NODE_TYPES.ACTION:
                return this.renderActionFields(node);
            case NODE_TYPES.JUMP:
                return this.renderJumpFields(node);
            case NODE_TYPES.END:
                return this.renderEndFields(node);
            default:
                return '';
        }
    }

    /**
     * Render dialogue node fields
     */
    renderDialogueFields(node) {
        return `
            <div class="inspector-field">
                <label class="inspector-label">Speaker</label>
                <input type="text" class="inspector-input" data-field="speaker" 
                       value="${node.speaker || ''}" placeholder="Character name">
            </div>
            <div class="inspector-field">
                <label class="inspector-label">Text</label>
                <textarea class="inspector-textarea" data-field="text" 
                          placeholder="Dialogue text...">${node.text || ''}</textarea>
            </div>
            <div class="inspector-field">
                <label class="inspector-label">Portrait</label>
                <input type="text" class="inspector-input" data-field="portrait" 
                       value="${node.portrait || ''}" placeholder="Portrait asset path">
            </div>
        `;
    }

    /**
     * Render choice node fields
     */
    renderChoiceFields(node) {
        const choicesHtml = node.choices.map((choice, i) => `
            <div class="choice-item">
                <input type="text" class="inspector-input" data-field="choices[${i}].text" 
                       value="${choice.text}" placeholder="Choice ${i + 1}">
                <button class="icon-btn danger" data-action="remove-choice" data-index="${i}">×</button>
            </div>
        `).join('');

        return `
            <div class="inspector-field">
                <label class="inspector-label">Choices</label>
                <div class="choice-list">
                    ${choicesHtml}
                </div>
                <button class="secondary-btn" data-action="add-choice">+ Add Choice</button>
            </div>
        `;
    }

    /**
     * Render condition node fields
     */
    renderConditionFields(node) {
        return `
            <div class="inspector-field">
                <label class="inspector-label">Variable</label>
                <input type="text" class="inspector-input" data-field="variable" 
                       value="${node.variable || ''}" placeholder="variable_name">
            </div>
            <div class="inspector-field">
                <label class="inspector-label">Operator</label>
                <select class="inspector-select" data-field="operator">
                    <option value="==" ${node.operator === '==' ? 'selected' : ''}>== (equals)</option>
                    <option value="!=" ${node.operator === '!=' ? 'selected' : ''}>!= (not equals)</option>
                    <option value=">" ${node.operator === '>' ? 'selected' : ''}>> (greater)</option>
                    <option value="<" ${node.operator === '<' ? 'selected' : ''}>< (less)</option>
                    <option value=">=" ${node.operator === '>=' ? 'selected' : ''}>>=</option>
                    <option value="<=" ${node.operator === '<=' ? 'selected' : ''}><=</option>
                </select>
            </div>
            <div class="inspector-field">
                <label class="inspector-label">Value</label>
                <input type="text" class="inspector-input" data-field="value" 
                       value="${node.value || ''}" placeholder="comparison value">
            </div>
        `;
    }

    /**
     * Render action node fields
     */
    renderActionFields(node) {
        return `
            <div class="inspector-field">
                <label class="inspector-label">Action Type</label>
                <select class="inspector-select" data-field="actionType">
                    <option value="set_variable" ${node.actionType === 'set_variable' ? 'selected' : ''}>Set Variable</option>
                    <option value="increment" ${node.actionType === 'increment' ? 'selected' : ''}>Increment Variable</option>
                    <option value="give_item" ${node.actionType === 'give_item' ? 'selected' : ''}>Give Item</option>
                    <option value="trigger_event" ${node.actionType === 'trigger_event' ? 'selected' : ''}>Trigger Event</option>
                </select>
            </div>
            <div class="inspector-field">
                <label class="inspector-label">Variable/Target</label>
                <input type="text" class="inspector-input" data-field="variable" 
                       value="${node.variable || ''}" placeholder="target name">
            </div>
            <div class="inspector-field">
                <label class="inspector-label">Value</label>
                <input type="text" class="inspector-input" data-field="value" 
                       value="${node.value || ''}" placeholder="value">
            </div>
        `;
    }

    /**
     * Render jump node fields
     */
    renderJumpFields(node) {
        return `
            <div class="inspector-field">
                <label class="inspector-label">Target Dialogue</label>
                <input type="text" class="inspector-input" data-field="targetDialogue" 
                       value="${node.targetDialogue || ''}" placeholder="dialogue_id.dialogue">
            </div>
        `;
    }

    /**
     * Render end node fields
     */
    renderEndFields(node) {
        return `
            <div class="inspector-field">
                <label class="inspector-label">End Type</label>
                <select class="inspector-select" data-field="endType">
                    <option value="normal" ${node.endType === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="quest_complete" ${node.endType === 'quest_complete' ? 'selected' : ''}>Quest Complete</option>
                    <option value="shop_open" ${node.endType === 'shop_open' ? 'selected' : ''}>Open Shop</option>
                    <option value="battle_start" ${node.endType === 'battle_start' ? 'selected' : ''}>Start Battle</option>
                </select>
            </div>
        `;
    }
}
