/**
 * Character Editor Mode
 * NPC personas, dialogue trees, behaviors
 */

export class CharacterEditor {
    constructor(editor) {
        this.editor = editor;
        this.selectedCharacter = null;
        this.selectedDialogueNode = null;
    }

    activate() { }
    deactivate() { }

    updatePanels() {
        this.updateHierarchy();
        this.updateInspector();
    }

    updateHierarchy() {
        const container = document.getElementById('hierarchy-content');
        const characters = this.editor.project.characters;

        container.innerHTML = `
            <div style="margin-bottom: 10px;">
                <button id="btn-add-character" class="btn-small">+ Add NPC</button>
            </div>
            ${characters.map(char => `
                <div class="layer-item ${this.selectedCharacter === char ? 'active' : ''}"
                     data-char-id="${char.id}">
                    <span class="layer-name">${char.name}</span>
                    <span class="layer-type">${char.behavior}</span>
                </div>
            `).join('') || '<p class="placeholder" style="margin-top: 10px;">No characters yet</p>'}
        `;

        document.getElementById('btn-add-character')?.addEventListener('click', () => {
            this.addCharacter();
        });

        container.querySelectorAll('.layer-item').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedCharacter = this.editor.project.characters.find(c => c.id === el.dataset.charId);
                this.updatePanels();
                this.editor.render();
            });
        });
    }

    updateInspector() {
        const container = document.getElementById('inspector-content');

        if (!this.selectedCharacter) {
            container.innerHTML = '<p class="placeholder">Select a character</p>';
            return;
        }

        const char = this.selectedCharacter;
        container.innerHTML = `
            <div class="inspector-field">
                <label>Name</label>
                <input type="text" id="char-name" value="${char.name}">
            </div>
            <div class="inspector-field">
                <label>Avatar</label>
                <button id="btn-set-avatar" class="btn-small">Set Avatar</button>
            </div>
            <div class="inspector-field">
                <label>Behavior</label>
                <select id="char-behavior">
                    <option value="stationary" ${char.behavior === 'stationary' ? 'selected' : ''}>Stationary</option>
                    <option value="patrol" ${char.behavior === 'patrol' ? 'selected' : ''}>Patrol</option>
                    <option value="wander" ${char.behavior === 'wander' ? 'selected' : ''}>Wander</option>
                </select>
            </div>
            ${char.behavior === 'patrol' ? `
                <div class="inspector-field">
                    <label>Patrol Points</label>
                    <button id="btn-edit-patrol" class="btn-small">Edit Path</button>
                </div>
            ` : ''}
            <hr style="border-color: #3a3a3a; margin: 15px 0;">
            <div class="inspector-field">
                <label>Dialogue Tree</label>
                <button id="btn-edit-dialogue" class="btn-small">Edit Dialogue</button>
                <div id="dialogue-preview" style="margin-top: 10px; background: #333; padding: 8px; border-radius: 4px;">
                    ${this.renderDialoguePreview(char.dialogue)}
                </div>
            </div>
            <hr style="border-color: #3a3a3a; margin: 15px 0;">
            <div class="inspector-field">
                <label>Spawn Scene</label>
                <select id="char-scene">
                    <option value="">-- None --</option>
                    ${this.editor.project.scenes.map(s => `
                        <option value="${s.id}" ${char.sceneId === s.id ? 'selected' : ''}>${s.name}</option>
                    `).join('')}
                </select>
            </div>
        `;

        // Bind events
        document.getElementById('char-name')?.addEventListener('change', (e) => {
            char.name = e.target.value;
            this.updateHierarchy();
        });

        document.getElementById('char-behavior')?.addEventListener('change', (e) => {
            char.behavior = e.target.value;
            this.updateInspector();
        });

        document.getElementById('char-scene')?.addEventListener('change', (e) => {
            char.sceneId = e.target.value;
        });

        document.getElementById('btn-edit-dialogue')?.addEventListener('click', () => {
            this.openDialogueEditor(char);
        });
    }

    addCharacter() {
        const char = {
            id: 'char_' + Date.now(),
            name: 'New NPC',
            avatar: null,
            body: {},
            behavior: 'stationary',
            patrolPath: [],
            sceneId: null,
            position: { x: 0, y: 0 },
            dialogue: {
                nodes: [
                    {
                        id: 'start',
                        text: 'Hello, traveler!',
                        choices: []
                    }
                ]
            }
        };

        this.editor.project.characters.push(char);
        this.selectedCharacter = char;
        this.updatePanels();
        this.editor.render();
    }

    renderDialoguePreview(dialogue) {
        if (!dialogue || !dialogue.nodes || dialogue.nodes.length === 0) {
            return '<span style="color: #888;">No dialogue</span>';
        }

        const startNode = dialogue.nodes[0];
        return `
            <div style="color: #aaa; font-size: 11px;">
                "${startNode.text?.substring(0, 50)}${startNode.text?.length > 50 ? '...' : ''}"
                <br>
                <span style="color: #666;">${dialogue.nodes.length} nodes</span>
            </div>
        `;
    }

    openDialogueEditor(char) {
        // For now, show a simple modal-like interface in the inspector
        const container = document.getElementById('inspector-content');
        const dialogue = char.dialogue || { nodes: [] };

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>Dialogue Editor</strong>
                <button id="btn-close-dialogue" class="btn-small">Back</button>
            </div>
            <div id="dialogue-nodes">
                ${dialogue.nodes.map((node, i) => `
                    <div class="dialogue-node" style="background: #333; padding: 10px; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid ${i === 0 ? '#4a9eff' : '#555'};">
                        <input type="text" value="${node.id}" style="width: 80px; margin-bottom: 5px; background: #444; border: none; color: #fff; padding: 3px;" data-node-index="${i}" data-field="id">
                        <textarea style="width: 100%; height: 50px; background: #444; border: none; color: #fff; padding: 5px; resize: none;" data-node-index="${i}" data-field="text">${node.text}</textarea>
                        <div style="margin-top: 5px;">
                            ${(node.choices || []).map((choice, ci) => `
                                <div style="display: flex; gap: 5px; margin-top: 3px;">
                                    <input type="text" value="${choice.text}" placeholder="Choice text" style="flex: 1; background: #555; border: none; color: #fff; padding: 3px;">
                                    <input type="text" value="${choice.nextNodeId || ''}" placeholder="→ Node" style="width: 60px; background: #555; border: none; color: #fff; padding: 3px;">
                                </div>
                            `).join('') || '<span style="color: #666; font-size: 11px;">No choices (end node)</span>'}
                            <button class="btn-small" style="margin-top: 5px;" data-add-choice="${i}">+ Choice</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button id="btn-add-node" class="btn-small" style="margin-top: 10px;">+ Add Node</button>
        `;

        document.getElementById('btn-close-dialogue')?.addEventListener('click', () => {
            this.updateInspector();
        });

        document.getElementById('btn-add-node')?.addEventListener('click', () => {
            dialogue.nodes.push({
                id: 'node_' + dialogue.nodes.length,
                text: 'New dialogue...',
                choices: []
            });
            this.openDialogueEditor(char);
        });

        // Handle text changes
        container.querySelectorAll('textarea, input[data-field]').forEach(el => {
            el.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.nodeIndex);
                const field = e.target.dataset.field;
                if (field) {
                    dialogue.nodes[idx][field] = e.target.value;
                }
            });
        });

        // Handle add choice
        container.querySelectorAll('[data-add-choice]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.addChoice);
                if (!dialogue.nodes[idx].choices) dialogue.nodes[idx].choices = [];
                dialogue.nodes[idx].choices.push({ text: 'Option', nextNodeId: '' });
                this.openDialogueEditor(char);
            });
        });
    }

    render(ctx) {
        const characters = this.editor.project.characters;

        // Simple character list visualization
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.fillText('Character Editor - Select an NPC from the Hierarchy panel', 10, 30);

        // Draw character cards
        let y = 60;
        for (const char of characters) {
            const isSelected = this.selectedCharacter === char;

            ctx.fillStyle = isSelected ? '#3a4a5a' : '#333';
            ctx.fillRect(10, y, 300, 60);
            ctx.strokeStyle = isSelected ? '#4a9eff' : '#444';
            ctx.strokeRect(10, y, 300, 60);

            // Avatar placeholder
            ctx.fillStyle = '#555';
            ctx.fillRect(20, y + 10, 40, 40);
            ctx.fillStyle = '#888';
            ctx.fillText('👤', 30, y + 38);

            // Name and info
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(char.name, 70, y + 25);
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.fillText(`Behavior: ${char.behavior}`, 70, y + 45);

            y += 70;
        }
    }
}
