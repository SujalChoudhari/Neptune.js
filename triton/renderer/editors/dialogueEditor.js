/**
 * Triton Editor - Dialogue Editor
 * Node-based dialogue editing system
 */

/**
 * Dialogue node types
 */
const NODE_TYPES = {
    DIALOGUE: 'dialogue',
    CHOICE: 'choice',
    CONDITION: 'condition',
    ACTION: 'action',
    JUMP: 'jump',
    END: 'end'
};

/**
 * DialogueEditor - Manages dialogue tree editing
 */
export class DialogueEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentDialogue = null;
        this.selectedNode = null;
        this.clipboard = null;
    }

    /**
     * Initialize the dialogue editor
     */
    init() {
        // Subscribe to state changes
        this.editor.state.subscribe('currentDialogue', (dialogue) => {
            this.currentDialogue = dialogue;
            this.selectedNode = null;
            this.editor.events.emit('dialogue:loaded', { dialogue });
        });

        this.editor.state.subscribe('selectedDialogueNode', (nodeId) => {
            this.selectedNode = this.findNode(nodeId);
            this.editor.events.emit('dialogue:node-selected', { node: this.selectedNode });
        });
    }

    /**
     * Create a new dialogue
     */
    createDialogue(name) {
        const dialogue = {
            id: `dialogue_${Date.now()}`,
            name: name || 'New Dialogue',
            nodes: [],
            startNode: null,
            variables: {}
        };

        // Add initial start node
        const startNode = this.createNode(NODE_TYPES.DIALOGUE, 100, 100);
        startNode.speaker = 'NPC';
        startNode.text = 'Hello there!';
        startNode.isStart = true;
        dialogue.nodes.push(startNode);
        dialogue.startNode = startNode.id;

        this.editor.state.set('currentDialogue', dialogue);
        this.editor.console.log('info', `Created dialogue: ${name}`);
        return dialogue;
    }

    /**
     * Load a dialogue for editing
     */
    loadDialogue(dialogue) {
        this.currentDialogue = dialogue;
        this.selectedNode = null;
        this.editor.state.set('currentDialogue', dialogue);
    }

    /**
     * Create a new node
     */
    createNode(type, x = 200, y = 200) {
        const node = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            x,
            y,
            outputs: []
        };

        // Type-specific properties
        switch (type) {
            case NODE_TYPES.DIALOGUE:
                node.speaker = '';
                node.text = '';
                node.portrait = null;
                break;
            case NODE_TYPES.CHOICE:
                node.choices = [
                    { text: 'Option 1', targetNode: null },
                    { text: 'Option 2', targetNode: null }
                ];
                break;
            case NODE_TYPES.CONDITION:
                node.variable = '';
                node.operator = '==';
                node.value = '';
                node.trueNode = null;
                node.falseNode = null;
                break;
            case NODE_TYPES.ACTION:
                node.actionType = 'set_variable';
                node.variable = '';
                node.value = '';
                node.targetNode = null;
                break;
            case NODE_TYPES.JUMP:
                node.targetDialogue = '';
                node.targetNode = null;
                break;
            case NODE_TYPES.END:
                node.endType = 'normal';
                break;
        }

        return node;
    }

    /**
     * Add node to current dialogue
     */
    addNode(type, x, y) {
        if (!this.currentDialogue) return null;

        const node = this.createNode(type, x, y);

        const command = {
            execute: () => {
                this.currentDialogue.nodes.push(node);
                this.editor.events.emit('dialogue:node-added', { node });
            },
            undo: () => {
                const index = this.currentDialogue.nodes.findIndex(n => n.id === node.id);
                if (index !== -1) {
                    this.currentDialogue.nodes.splice(index, 1);
                }
                this.editor.events.emit('dialogue:node-removed', { node });
            },
            description: `Add ${type} node`
        };

        this.editor.history.execute(command);
        return node;
    }

    /**
     * Remove node from dialogue
     */
    removeNode(nodeId) {
        if (!this.currentDialogue) return;

        const index = this.currentDialogue.nodes.findIndex(n => n.id === nodeId);
        if (index === -1) return;

        const node = this.currentDialogue.nodes[index];

        // Prevent removing start node
        if (node.isStart) {
            this.editor.console.log('warn', 'Cannot remove start node');
            return;
        }

        // Find all connections to this node
        const connections = this.findConnectionsToNode(nodeId);

        const command = {
            execute: () => {
                // Remove connections
                for (const conn of connections) {
                    this.disconnectNodes(conn.fromId, conn.outputIndex);
                }
                // Remove node
                this.currentDialogue.nodes.splice(index, 1);
                if (this.selectedNode?.id === nodeId) {
                    this.selectedNode = null;
                }
                this.editor.events.emit('dialogue:node-removed', { node });
            },
            undo: () => {
                this.currentDialogue.nodes.splice(index, 0, node);
                // Restore connections
                for (const conn of connections) {
                    this.connectNodes(conn.fromId, conn.outputIndex, nodeId);
                }
                this.editor.events.emit('dialogue:node-added', { node });
            },
            description: `Remove ${node.type} node`
        };

        this.editor.history.execute(command);
    }

    /**
     * Find a node by ID
     */
    findNode(nodeId) {
        if (!this.currentDialogue || !nodeId) return null;
        return this.currentDialogue.nodes.find(n => n.id === nodeId) || null;
    }

    /**
     * Find all connections pointing to a node
     */
    findConnectionsToNode(nodeId) {
        const connections = [];
        if (!this.currentDialogue) return connections;

        for (const node of this.currentDialogue.nodes) {
            // Check outputs array
            for (let i = 0; i < node.outputs.length; i++) {
                if (node.outputs[i] === nodeId) {
                    connections.push({ fromId: node.id, outputIndex: i });
                }
            }
            // Check choice targets
            if (node.choices) {
                for (let i = 0; i < node.choices.length; i++) {
                    if (node.choices[i].targetNode === nodeId) {
                        connections.push({ fromId: node.id, outputIndex: i, isChoice: true });
                    }
                }
            }
            // Check condition branches
            if (node.trueNode === nodeId) {
                connections.push({ fromId: node.id, outputIndex: 0, isCondition: true, branch: 'true' });
            }
            if (node.falseNode === nodeId) {
                connections.push({ fromId: node.id, outputIndex: 1, isCondition: true, branch: 'false' });
            }
            // Check simple target
            if (node.targetNode === nodeId) {
                connections.push({ fromId: node.id, outputIndex: 0, isTarget: true });
            }
        }

        return connections;
    }

    /**
     * Connect two nodes
     */
    connectNodes(fromNodeId, outputIndex, toNodeId) {
        const fromNode = this.findNode(fromNodeId);
        if (!fromNode) return;

        switch (fromNode.type) {
            case NODE_TYPES.DIALOGUE:
            case NODE_TYPES.ACTION:
            case NODE_TYPES.JUMP:
                fromNode.targetNode = toNodeId;
                break;
            case NODE_TYPES.CHOICE:
                if (fromNode.choices[outputIndex]) {
                    fromNode.choices[outputIndex].targetNode = toNodeId;
                }
                break;
            case NODE_TYPES.CONDITION:
                if (outputIndex === 0) {
                    fromNode.trueNode = toNodeId;
                } else {
                    fromNode.falseNode = toNodeId;
                }
                break;
        }

        this.editor.events.emit('dialogue:connection-added', { fromNodeId, toNodeId });
    }

    /**
     * Disconnect nodes
     */
    disconnectNodes(fromNodeId, outputIndex) {
        const fromNode = this.findNode(fromNodeId);
        if (!fromNode) return;

        switch (fromNode.type) {
            case NODE_TYPES.DIALOGUE:
            case NODE_TYPES.ACTION:
            case NODE_TYPES.JUMP:
                fromNode.targetNode = null;
                break;
            case NODE_TYPES.CHOICE:
                if (fromNode.choices[outputIndex]) {
                    fromNode.choices[outputIndex].targetNode = null;
                }
                break;
            case NODE_TYPES.CONDITION:
                if (outputIndex === 0) {
                    fromNode.trueNode = null;
                } else {
                    fromNode.falseNode = null;
                }
                break;
        }

        this.editor.events.emit('dialogue:connection-removed', { fromNodeId, outputIndex });
    }

    /**
     * Update node property
     */
    updateNodeProperty(nodeId, property, value) {
        const node = this.findNode(nodeId);
        if (!node) return;

        const oldValue = node[property];

        const command = {
            execute: () => {
                node[property] = value;
                this.editor.events.emit('dialogue:node-updated', { node, property, value });
            },
            undo: () => {
                node[property] = oldValue;
                this.editor.events.emit('dialogue:node-updated', { node, property, value: oldValue });
            },
            description: `Update ${property}`
        };

        this.editor.history.execute(command);
    }

    /**
     * Move node position
     */
    moveNode(nodeId, x, y) {
        const node = this.findNode(nodeId);
        if (!node) return;

        const oldX = node.x;
        const oldY = node.y;

        const command = {
            execute: () => {
                node.x = x;
                node.y = y;
                this.editor.events.emit('dialogue:node-moved', { node });
            },
            undo: () => {
                node.x = oldX;
                node.y = oldY;
                this.editor.events.emit('dialogue:node-moved', { node });
            },
            description: 'Move node'
        };

        this.editor.history.execute(command);
    }

    /**
     * Add choice to choice node
     */
    addChoice(nodeId) {
        const node = this.findNode(nodeId);
        if (!node || node.type !== NODE_TYPES.CHOICE) return;

        const newChoice = { text: `Option ${node.choices.length + 1}`, targetNode: null };

        const command = {
            execute: () => {
                node.choices.push(newChoice);
                this.editor.events.emit('dialogue:node-updated', { node });
            },
            undo: () => {
                node.choices.pop();
                this.editor.events.emit('dialogue:node-updated', { node });
            },
            description: 'Add choice'
        };

        this.editor.history.execute(command);
    }

    /**
     * Remove choice from choice node
     */
    removeChoice(nodeId, choiceIndex) {
        const node = this.findNode(nodeId);
        if (!node || node.type !== NODE_TYPES.CHOICE) return;
        if (node.choices.length <= 2) {
            this.editor.console.log('warn', 'Choice node must have at least 2 options');
            return;
        }

        const removed = node.choices[choiceIndex];

        const command = {
            execute: () => {
                node.choices.splice(choiceIndex, 1);
                this.editor.events.emit('dialogue:node-updated', { node });
            },
            undo: () => {
                node.choices.splice(choiceIndex, 0, removed);
                this.editor.events.emit('dialogue:node-updated', { node });
            },
            description: 'Remove choice'
        };

        this.editor.history.execute(command);
    }

    /**
     * Validate dialogue for errors
     */
    validateDialogue() {
        if (!this.currentDialogue) return [];

        const errors = [];
        const visited = new Set();

        // Check for orphan nodes (not reachable from start)
        const reachable = new Set();
        const queue = [this.currentDialogue.startNode];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || reachable.has(nodeId)) continue;

            reachable.add(nodeId);
            const node = this.findNode(nodeId);
            if (!node) continue;

            // Add connected nodes
            if (node.targetNode) queue.push(node.targetNode);
            if (node.trueNode) queue.push(node.trueNode);
            if (node.falseNode) queue.push(node.falseNode);
            if (node.choices) {
                for (const choice of node.choices) {
                    if (choice.targetNode) queue.push(choice.targetNode);
                }
            }
        }

        for (const node of this.currentDialogue.nodes) {
            if (!reachable.has(node.id)) {
                errors.push({ type: 'warning', message: `Orphan node: ${node.id}`, nodeId: node.id });
            }

            // Check for empty dialogue text
            if (node.type === NODE_TYPES.DIALOGUE && !node.text) {
                errors.push({ type: 'error', message: 'Empty dialogue text', nodeId: node.id });
            }

            // Check for unconnected outputs
            if (node.type === NODE_TYPES.DIALOGUE && !node.targetNode && !node.isEnd) {
                errors.push({ type: 'warning', message: 'Dialogue has no next node', nodeId: node.id });
            }
        }

        return errors;
    }

    /**
     * Export dialogue to JSON
     */
    exportDialogue() {
        if (!this.currentDialogue) return null;
        return JSON.stringify(this.currentDialogue, null, 2);
    }

    /**
     * Import dialogue from JSON
     */
    importDialogue(jsonString) {
        try {
            const dialogue = JSON.parse(jsonString);
            this.loadDialogue(dialogue);
            return true;
        } catch (e) {
            this.editor.console.log('error', `Failed to import dialogue: ${e.message}`);
            return false;
        }
    }
}

export { NODE_TYPES };
