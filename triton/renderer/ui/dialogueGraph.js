/**
 * Triton Editor - Dialogue Graph
 * Visual node-based graph editor for dialogues
 */

import { NODE_TYPES } from '../editors/dialogueEditor.js';

/**
 * Node colors by type
 */
const NODE_COLORS = {
    [NODE_TYPES.DIALOGUE]: '#4a90d9',
    [NODE_TYPES.CHOICE]: '#e8a336',
    [NODE_TYPES.CONDITION]: '#9b59b6',
    [NODE_TYPES.ACTION]: '#27ae60',
    [NODE_TYPES.JUMP]: '#e74c3c',
    [NODE_TYPES.END]: '#7f8c8d'
};

/**
 * DialogueGraph - Canvas-based node graph editor
 */
export class DialogueGraph {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.canvas = null;
        this.ctx = null;

        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.nodeWidth = 200;
        this.nodeHeight = 80;
        this.headerHeight = 24;

        this.isDragging = false;
        this.dragNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isPanning = false;
        this.lastMouse = { x: 0, y: 0 };

        this.isConnecting = false;
        this.connectFrom = null;
        this.connectOutput = 0;
        this.connectMousePos = { x: 0, y: 0 };
    }

    /**
     * Initialize the graph
     */
    init() {
        this.container = document.getElementById('dialogue-graph');
        if (!this.container) return;

        this.createCanvas();
        this.setupEventListeners();

        // Subscribe to dialogue events
        this.editor.events.on('dialogue:loaded', () => this.render());
        this.editor.events.on('dialogue:node-added', () => this.render());
        this.editor.events.on('dialogue:node-removed', () => this.render());
        this.editor.events.on('dialogue:node-moved', () => this.render());
        this.editor.events.on('dialogue:node-updated', () => this.render());
        this.editor.events.on('dialogue:connection-added', () => this.render());
        this.editor.events.on('dialogue:connection-removed', () => this.render());
    }

    /**
     * Create canvas
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'dialogue-canvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        new ResizeObserver(() => this.resize()).observe(this.container);
    }

    /**
     * Resize canvas
     */
    resize() {
        if (!this.container) return;

        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        this.render();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    }

    /**
     * Screen to world coordinates
     */
    screenToWorld(x, y) {
        return {
            x: (x - this.pan.x) / this.zoom,
            y: (y - this.pan.y) / this.zoom
        };
    }

    /**
     * World to screen coordinates
     */
    worldToScreen(x, y) {
        return {
            x: x * this.zoom + this.pan.x,
            y: y * this.zoom + this.pan.y
        };
    }

    /**
     * Hit test a node
     */
    hitTestNode(worldX, worldY) {
        const dialogue = this.editor.dialogueEditor?.currentDialogue;
        if (!dialogue) return null;

        // Check in reverse order (top nodes first)
        for (let i = dialogue.nodes.length - 1; i >= 0; i--) {
            const node = dialogue.nodes[i];
            const height = this.getNodeHeight(node);

            if (worldX >= node.x && worldX <= node.x + this.nodeWidth &&
                worldY >= node.y && worldY <= node.y + height) {
                return node;
            }
        }
        return null;
    }

    /**
     * Hit test output connector
     */
    hitTestOutput(node, worldX, worldY) {
        const outputs = this.getNodeOutputs(node);
        const height = this.getNodeHeight(node);
        const connectorSize = 10;

        for (let i = 0; i < outputs.length; i++) {
            const connY = node.y + this.headerHeight + 20 + i * 24;
            const connX = node.x + this.nodeWidth;

            if (worldX >= connX - connectorSize && worldX <= connX + connectorSize &&
                worldY >= connY - connectorSize && worldY <= connY + connectorSize) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Hit test input connector
     */
    hitTestInput(node, worldX, worldY) {
        const connectorSize = 10;
        const connX = node.x;
        const connY = node.y + this.headerHeight + 20;

        if (worldX >= connX - connectorSize && worldX <= connX + connectorSize &&
            worldY >= connY - connectorSize && worldY <= connY + connectorSize) {
            return true;
        }
        return false;
    }

    /**
     * Get dynamic height for node
     */
    getNodeHeight(node) {
        let height = this.nodeHeight;
        if (node.type === NODE_TYPES.CHOICE) {
            height = this.headerHeight + 30 + node.choices.length * 24;
        } else if (node.type === NODE_TYPES.CONDITION) {
            height = this.headerHeight + 70;
        }
        return height;
    }

    /**
     * Get output labels for node
     */
    getNodeOutputs(node) {
        switch (node.type) {
            case NODE_TYPES.DIALOGUE:
                return ['→'];
            case NODE_TYPES.CHOICE:
                return node.choices.map((c, i) => c.text.substring(0, 20));
            case NODE_TYPES.CONDITION:
                return ['True', 'False'];
            case NODE_TYPES.ACTION:
                return ['→'];
            case NODE_TYPES.JUMP:
                return ['→'];
            case NODE_TYPES.END:
                return [];
            default:
                return [];
        }
    }

    /**
     * Render the graph
     */
    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        // Grid
        this.renderGrid();

        const dialogue = this.editor.dialogueEditor?.currentDialogue;
        if (!dialogue) {
            this.renderEmpty();
            return;
        }

        ctx.save();
        ctx.translate(this.pan.x, this.pan.y);
        ctx.scale(this.zoom, this.zoom);

        // Render connections first
        this.renderConnections(dialogue);

        // Render nodes
        for (const node of dialogue.nodes) {
            this.renderNode(node);
        }

        // Render active connection line
        if (this.isConnecting) {
            this.renderConnectionLine();
        }

        ctx.restore();
    }

    /**
     * Render grid
     */
    renderGrid() {
        const ctx = this.ctx;
        const gridSize = 32 * this.zoom;
        const offsetX = this.pan.x % gridSize;
        const offsetY = this.pan.y % gridSize;

        ctx.strokeStyle = '#252525';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = offsetX; x < this.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
        }
        for (let y = offsetY; y < this.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
        }

        ctx.stroke();
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        const ctx = this.ctx;
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No dialogue loaded', this.width / 2, this.height / 2);
        ctx.fillText('Right-click to create a new dialogue', this.width / 2, this.height / 2 + 20);
    }

    /**
     * Render all connections
     */
    renderConnections(dialogue) {
        const ctx = this.ctx;

        for (const node of dialogue.nodes) {
            const startX = node.x + this.nodeWidth;

            // Simple target connection
            if (node.targetNode) {
                const targetNode = this.editor.dialogueEditor.findNode(node.targetNode);
                if (targetNode) {
                    const startY = node.y + this.headerHeight + 20;
                    const endX = targetNode.x;
                    const endY = targetNode.y + this.headerHeight + 20;
                    this.renderConnection(startX, startY, endX, endY, NODE_COLORS[node.type]);
                }
            }

            // Choice connections
            if (node.choices) {
                for (let i = 0; i < node.choices.length; i++) {
                    const choice = node.choices[i];
                    if (choice.targetNode) {
                        const targetNode = this.editor.dialogueEditor.findNode(choice.targetNode);
                        if (targetNode) {
                            const startY = node.y + this.headerHeight + 20 + i * 24;
                            const endX = targetNode.x;
                            const endY = targetNode.y + this.headerHeight + 20;
                            this.renderConnection(startX, startY, endX, endY, NODE_COLORS[node.type]);
                        }
                    }
                }
            }

            // Condition connections
            if (node.trueNode) {
                const targetNode = this.editor.dialogueEditor.findNode(node.trueNode);
                if (targetNode) {
                    const startY = node.y + this.headerHeight + 20;
                    const endX = targetNode.x;
                    const endY = targetNode.y + this.headerHeight + 20;
                    this.renderConnection(startX, startY, endX, endY, '#27ae60');
                }
            }
            if (node.falseNode) {
                const targetNode = this.editor.dialogueEditor.findNode(node.falseNode);
                if (targetNode) {
                    const startY = node.y + this.headerHeight + 44;
                    const endX = targetNode.x;
                    const endY = targetNode.y + this.headerHeight + 20;
                    this.renderConnection(startX, startY, endX, endY, '#e74c3c');
                }
            }
        }
    }

    /**
     * Render a bezier connection
     */
    renderConnection(x1, y1, x2, y2, color) {
        const ctx = this.ctx;
        const cp = Math.abs(x2 - x1) * 0.5;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2);
        ctx.stroke();
    }

    /**
     * Render active connection line
     */
    renderConnectionLine() {
        if (!this.connectFrom) return;

        const node = this.connectFrom;
        const startX = node.x + this.nodeWidth;
        const startY = node.y + this.headerHeight + 20 + this.connectOutput * 24;
        const end = this.screenToWorld(this.connectMousePos.x, this.connectMousePos.y);

        this.renderConnection(startX, startY, end.x, end.y, '#fff');
    }

    /**
     * Render a node
     */
    renderNode(node) {
        const ctx = this.ctx;
        const height = this.getNodeHeight(node);
        const selected = this.editor.dialogueEditor?.selectedNode?.id === node.id;

        // Node shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(node.x + 3, node.y + 3, this.nodeWidth, height);

        // Node body
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(node.x, node.y, this.nodeWidth, height);

        // Header
        ctx.fillStyle = NODE_COLORS[node.type] || '#666';
        ctx.fillRect(node.x, node.y, this.nodeWidth, this.headerHeight);

        // Selection border
        if (selected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(node.x, node.y, this.nodeWidth, height);
        }

        // Start indicator
        if (node.isStart) {
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(node.x + 10, node.y + this.headerHeight / 2, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Node title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(node.type.toUpperCase(), node.x + (node.isStart ? 20 : 8), node.y + 16);

        // Node content based on type
        this.renderNodeContent(node);

        // Input connector
        if (!node.isStart) {
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(node.x, node.y + this.headerHeight + 20, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Output connectors
        const outputs = this.getNodeOutputs(node);
        for (let i = 0; i < outputs.length; i++) {
            const connY = node.y + this.headerHeight + 20 + i * 24;
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(node.x + this.nodeWidth, connY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Output label
            ctx.fillStyle = '#aaa';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(outputs[i], node.x + this.nodeWidth - 12, connY + 4);
        }
    }

    /**
     * Render node-specific content
     */
    renderNodeContent(node) {
        const ctx = this.ctx;
        ctx.fillStyle = '#ccc';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';

        switch (node.type) {
            case NODE_TYPES.DIALOGUE:
                if (node.speaker) {
                    ctx.fillStyle = '#4a90d9';
                    ctx.fillText(node.speaker, node.x + 8, node.y + this.headerHeight + 16);
                }
                ctx.fillStyle = '#888';
                const preview = (node.text || '(empty)').substring(0, 25);
                ctx.fillText(preview + (node.text?.length > 25 ? '...' : ''), node.x + 8, node.y + this.headerHeight + 32);
                break;

            case NODE_TYPES.CONDITION:
                ctx.fillText(`${node.variable} ${node.operator} ${node.value}`, node.x + 8, node.y + this.headerHeight + 16);
                break;

            case NODE_TYPES.ACTION:
                ctx.fillText(`${node.actionType}: ${node.variable}`, node.x + 8, node.y + this.headerHeight + 16);
                break;
        }
    }

    /**
     * Mouse down handler
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = this.screenToWorld(screenX, screenY);

        // Middle mouse or shift+left for panning
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            this.isPanning = true;
            this.lastMouse = { x: screenX, y: screenY };
            return;
        }

        // Left click
        if (e.button === 0) {
            const node = this.hitTestNode(world.x, world.y);

            if (node) {
                // Check for output connector
                const outputIndex = this.hitTestOutput(node, world.x, world.y);
                if (outputIndex >= 0) {
                    this.isConnecting = true;
                    this.connectFrom = node;
                    this.connectOutput = outputIndex;
                    this.connectMousePos = { x: screenX, y: screenY };
                    return;
                }

                // Start dragging node
                this.isDragging = true;
                this.dragNode = node;
                this.dragOffset = { x: world.x - node.x, y: world.y - node.y };

                // Select node
                this.editor.state.set('selectedDialogueNode', node.id);
            } else {
                // Deselect
                this.editor.state.set('selectedDialogueNode', null);
            }
        }
    }

    /**
     * Mouse move handler
     */
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (this.isPanning) {
            const dx = screenX - this.lastMouse.x;
            const dy = screenY - this.lastMouse.y;
            this.pan.x += dx;
            this.pan.y += dy;
            this.lastMouse = { x: screenX, y: screenY };
            this.render();
            return;
        }

        if (this.isDragging && this.dragNode) {
            const world = this.screenToWorld(screenX, screenY);
            this.dragNode.x = world.x - this.dragOffset.x;
            this.dragNode.y = world.y - this.dragOffset.y;
            this.render();
            return;
        }

        if (this.isConnecting) {
            this.connectMousePos = { x: screenX, y: screenY };
            this.render();
        }
    }

    /**
     * Mouse up handler
     */
    onMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = this.screenToWorld(screenX, screenY);

        if (this.isDragging && this.dragNode) {
            // Commit move with undo
            const node = this.dragNode;
            this.editor.dialogueEditor?.moveNode(node.id, node.x, node.y);
        }

        if (this.isConnecting) {
            // Check if dropped on another node's input
            const targetNode = this.hitTestNode(world.x, world.y);
            if (targetNode && targetNode.id !== this.connectFrom?.id) {
                if (this.hitTestInput(targetNode, world.x, world.y)) {
                    this.editor.dialogueEditor?.connectNodes(
                        this.connectFrom.id,
                        this.connectOutput,
                        targetNode.id
                    );
                }
            }
        }

        this.isDragging = false;
        this.dragNode = null;
        this.isPanning = false;
        this.isConnecting = false;
        this.connectFrom = null;
        this.render();
    }

    /**
     * Wheel handler
     */
    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.25, Math.min(2, this.zoom * delta));
        this.render();
    }

    /**
     * Double click handler
     */
    onDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = this.screenToWorld(screenX, screenY);

        const node = this.hitTestNode(world.x, world.y);
        if (node) {
            // Open node editor
            this.editor.events.emit('dialogue:node-edit', { node });
        }
    }

    /**
     * Context menu handler
     */
    onContextMenu(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = this.screenToWorld(screenX, screenY);

        // Show context menu
        this.showContextMenu(e.clientX, e.clientY, world.x, world.y);
    }

    /**
     * Show context menu
     */
    showContextMenu(screenX, screenY, worldX, worldY) {
        // Remove existing menu
        const existing = document.querySelector('.dialogue-context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'dialogue-context-menu context-menu';
        menu.style.left = screenX + 'px';
        menu.style.top = screenY + 'px';

        const menuItems = [
            { label: '📝 Dialogue Node', action: () => this.editor.dialogueEditor?.addNode(NODE_TYPES.DIALOGUE, worldX, worldY) },
            { label: '🔀 Choice Node', action: () => this.editor.dialogueEditor?.addNode(NODE_TYPES.CHOICE, worldX, worldY) },
            { label: '❓ Condition Node', action: () => this.editor.dialogueEditor?.addNode(NODE_TYPES.CONDITION, worldX, worldY) },
            { label: '⚡ Action Node', action: () => this.editor.dialogueEditor?.addNode(NODE_TYPES.ACTION, worldX, worldY) },
            { label: '↪️ Jump Node', action: () => this.editor.dialogueEditor?.addNode(NODE_TYPES.JUMP, worldX, worldY) },
            { label: '🛑 End Node', action: () => this.editor.dialogueEditor?.addNode(NODE_TYPES.END, worldX, worldY) }
        ];

        for (const item of menuItems) {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.label;
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            menu.appendChild(menuItem);
        }

        document.body.appendChild(menu);

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }
}
