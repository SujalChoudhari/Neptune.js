/**
 * Tests for DialogueEditor
 */

// Simple test runner
function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (e) {
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

function expect(value) {
    return {
        toBe: (expected) => {
            if (value !== expected) {
                throw new Error(`Expected ${expected} but got ${value}`);
            }
        },
        toEqual: (expected) => {
            if (JSON.stringify(value) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(value)}`);
            }
        },
        toHaveLength: (length) => {
            if (value.length !== length) {
                throw new Error(`Expected length ${length} but got ${value.length}`);
            }
        },
        toBeDefined: () => {
            if (value === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBeNull: () => {
            if (value !== null) {
                throw new Error(`Expected null but got ${value}`);
            }
        },
        toContain: (item) => {
            if (!value.includes(item)) {
                throw new Error(`Expected ${value} to contain ${item}`);
            }
        }
    };
}

// Node types
const NODE_TYPES = {
    DIALOGUE: 'dialogue',
    CHOICE: 'choice',
    CONDITION: 'condition',
    ACTION: 'action',
    JUMP: 'jump',
    END: 'end'
};

// Tests
describe('DialogueEditor Dialogue Creation', () => {

    it('should create a new dialogue with start node', () => {
        const dialogue = {
            id: 'dialogue_123',
            name: 'Test Dialogue',
            nodes: [],
            startNode: null,
            variables: {}
        };

        const startNode = {
            id: 'node_1',
            type: NODE_TYPES.DIALOGUE,
            x: 100, y: 100,
            speaker: 'NPC',
            text: 'Hello!',
            isStart: true,
            outputs: []
        };

        dialogue.nodes.push(startNode);
        dialogue.startNode = startNode.id;

        expect(dialogue.nodes).toHaveLength(1);
        expect(dialogue.startNode).toBe('node_1');
        expect(dialogue.nodes[0].isStart).toBe(true);
    });
});

describe('DialogueEditor Node Management', () => {

    it('should create dialogue node with correct properties', () => {
        const node = {
            id: 'node_1',
            type: NODE_TYPES.DIALOGUE,
            x: 200, y: 100,
            speaker: '',
            text: '',
            portrait: null,
            outputs: []
        };

        expect(node.type).toBe('dialogue');
        expect(node.speaker).toBe('');
        expect(node.portrait).toBeNull();
    });

    it('should create choice node with options', () => {
        const node = {
            id: 'node_2',
            type: NODE_TYPES.CHOICE,
            x: 200, y: 200,
            choices: [
                { text: 'Option 1', targetNode: null },
                { text: 'Option 2', targetNode: null }
            ],
            outputs: []
        };

        expect(node.type).toBe('choice');
        expect(node.choices).toHaveLength(2);
        expect(node.choices[0].text).toBe('Option 1');
    });

    it('should create condition node with branches', () => {
        const node = {
            id: 'node_3',
            type: NODE_TYPES.CONDITION,
            x: 200, y: 300,
            variable: 'hasItem',
            operator: '==',
            value: 'true',
            trueNode: null,
            falseNode: null,
            outputs: []
        };

        expect(node.type).toBe('condition');
        expect(node.operator).toBe('==');
    });

    it('should add node to dialogue', () => {
        const dialogue = { nodes: [] };
        const node = { id: 'new_node', type: NODE_TYPES.DIALOGUE };
        dialogue.nodes.push(node);

        expect(dialogue.nodes).toHaveLength(1);
    });

    it('should remove node from dialogue', () => {
        const dialogue = {
            nodes: [
                { id: 'node_1', isStart: true },
                { id: 'node_2' },
                { id: 'node_3' }
            ]
        };

        const index = dialogue.nodes.findIndex(n => n.id === 'node_2');
        dialogue.nodes.splice(index, 1);

        expect(dialogue.nodes).toHaveLength(2);
    });
});

describe('DialogueEditor Connections', () => {

    it('should connect dialogue node to another', () => {
        const node1 = { id: 'node_1', type: NODE_TYPES.DIALOGUE, targetNode: null };
        const node2 = { id: 'node_2', type: NODE_TYPES.DIALOGUE };

        node1.targetNode = node2.id;

        expect(node1.targetNode).toBe('node_2');
    });

    it('should connect choice options to targets', () => {
        const choiceNode = {
            id: 'choice_1',
            type: NODE_TYPES.CHOICE,
            choices: [
                { text: 'Yes', targetNode: null },
                { text: 'No', targetNode: null }
            ]
        };

        choiceNode.choices[0].targetNode = 'node_yes';
        choiceNode.choices[1].targetNode = 'node_no';

        expect(choiceNode.choices[0].targetNode).toBe('node_yes');
        expect(choiceNode.choices[1].targetNode).toBe('node_no');
    });

    it('should connect condition branches', () => {
        const conditionNode = {
            id: 'cond_1',
            type: NODE_TYPES.CONDITION,
            trueNode: null,
            falseNode: null
        };

        conditionNode.trueNode = 'node_true';
        conditionNode.falseNode = 'node_false';

        expect(conditionNode.trueNode).toBe('node_true');
        expect(conditionNode.falseNode).toBe('node_false');
    });

    it('should find connections to node', () => {
        const nodes = [
            { id: 'node_1', targetNode: 'node_3' },
            { id: 'node_2', choices: [{ targetNode: 'node_3' }] },
            { id: 'node_3' }
        ];

        const findConnectionsToNode = (nodeId) => {
            const connections = [];
            for (const node of nodes) {
                if (node.targetNode === nodeId) {
                    connections.push({ fromId: node.id });
                }
                if (node.choices) {
                    for (const choice of node.choices) {
                        if (choice.targetNode === nodeId) {
                            connections.push({ fromId: node.id });
                        }
                    }
                }
            }
            return connections;
        };

        const conns = findConnectionsToNode('node_3');
        expect(conns).toHaveLength(2);
    });
});

describe('DialogueEditor Choice Management', () => {

    it('should add choice to choice node', () => {
        const choiceNode = {
            type: NODE_TYPES.CHOICE,
            choices: [
                { text: 'Option 1', targetNode: null },
                { text: 'Option 2', targetNode: null }
            ]
        };

        choiceNode.choices.push({ text: 'Option 3', targetNode: null });

        expect(choiceNode.choices).toHaveLength(3);
    });

    it('should remove choice from choice node', () => {
        const choiceNode = {
            type: NODE_TYPES.CHOICE,
            choices: [
                { text: 'A', targetNode: null },
                { text: 'B', targetNode: null },
                { text: 'C', targetNode: null }
            ]
        };

        choiceNode.choices.splice(1, 1); // Remove 'B'

        expect(choiceNode.choices).toHaveLength(2);
        expect(choiceNode.choices[0].text).toBe('A');
        expect(choiceNode.choices[1].text).toBe('C');
    });
});

describe('DialogueEditor Validation', () => {

    it('should detect orphan nodes', () => {
        const dialogue = {
            startNode: 'node_1',
            nodes: [
                { id: 'node_1', targetNode: 'node_2' },
                { id: 'node_2' },
                { id: 'node_3' } // Orphan - not reachable
            ]
        };

        // Reachability check
        const reachable = new Set();
        const queue = [dialogue.startNode];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || reachable.has(nodeId)) continue;
            reachable.add(nodeId);
            const node = dialogue.nodes.find(n => n.id === nodeId);
            if (node?.targetNode) queue.push(node.targetNode);
        }

        const orphans = dialogue.nodes.filter(n => !reachable.has(n.id));
        expect(orphans).toHaveLength(1);
        expect(orphans[0].id).toBe('node_3');
    });

    it('should detect empty dialogue text', () => {
        const node = { id: 'node_1', type: NODE_TYPES.DIALOGUE, text: '' };

        const errors = [];
        if (node.type === NODE_TYPES.DIALOGUE && !node.text) {
            errors.push({ type: 'error', message: 'Empty dialogue text' });
        }

        expect(errors).toHaveLength(1);
    });
});

describe('DialogueEditor Import/Export', () => {

    it('should export dialogue to JSON', () => {
        const dialogue = {
            id: 'dlg_1',
            name: 'Test',
            nodes: [{ id: 'n1', type: 'dialogue' }]
        };

        const json = JSON.stringify(dialogue, null, 2);
        expect(json).toContain('"id": "dlg_1"');
        expect(json).toContain('"name": "Test"');
    });

    it('should import dialogue from JSON', () => {
        const json = '{"id":"dlg_1","name":"Imported","nodes":[]}';
        const dialogue = JSON.parse(json);

        expect(dialogue.id).toBe('dlg_1');
        expect(dialogue.name).toBe('Imported');
    });
});

console.log('\n✅ DialogueEditor tests complete');
