/**
 * Triton Editor - Rig Editor
 * Manages rig creation, slot assignment, and pivot configuration
 */

/**
 * Default rig template with common humanoid slots
 */
const DEFAULT_RIG_SLOTS = [
    { id: 'head', name: 'Head', zOrder: 10, pivot: { x: 0.5, y: 1.0 } },
    { id: 'torso', name: 'Torso', zOrder: 5, pivot: { x: 0.5, y: 0.5 } },
    { id: 'arm_l', name: 'Left Arm', zOrder: 6, pivot: { x: 1.0, y: 0.2 } },
    { id: 'arm_r', name: 'Right Arm', zOrder: 4, pivot: { x: 0.0, y: 0.2 } },
    { id: 'hand_l', name: 'Left Hand', zOrder: 7, pivot: { x: 1.0, y: 0.5 } },
    { id: 'hand_r', name: 'Right Hand', zOrder: 3, pivot: { x: 0.0, y: 0.5 } },
    { id: 'leg_l', name: 'Left Leg', zOrder: 2, pivot: { x: 0.5, y: 0.0 } },
    { id: 'leg_r', name: 'Right Leg', zOrder: 1, pivot: { x: 0.5, y: 0.0 } },
    { id: 'foot_l', name: 'Left Foot', zOrder: 2, pivot: { x: 0.5, y: 0.0 } },
    { id: 'foot_r', name: 'Right Foot', zOrder: 1, pivot: { x: 0.5, y: 0.0 } }
];

/**
 * RigEditor - Manages rig editing operations
 */
export class RigEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentRig = null;
        this.selectedSlot = null;
        this.previewPose = null;
    }

    /**
     * Initialize the rig editor
     */
    init() {
        // Subscribe to entity selection
        this.editor.events.on('inspector:update', ({ entities }) => {
            if (entities && entities.length === 1) {
                this.loadRigFromEntity(entities[0]);
            } else {
                this.currentRig = null;
                this.selectedSlot = null;
            }
        });

        this.editor.state.subscribe('selectedSlot', (slotId) => {
            this.selectedSlot = slotId;
            this.editor.events.emit('rig:slot-selected', { slotId });
        });
    }

    /**
     * Load rig from selected entity
     */
    loadRigFromEntity(entity) {
        if (!entity || !entity.components) {
            this.currentRig = null;
            return;
        }

        const rigComponent = entity.components.find(c => c.type === 'Rig');
        if (rigComponent) {
            this.currentRig = rigComponent;
            this.editor.events.emit('rig:loaded', { rig: rigComponent });
        } else {
            this.currentRig = null;
        }
    }

    /**
     * Create a new rig component for an entity
     */
    createRig(entity, template = 'humanoid') {
        if (!entity) return null;

        const slots = template === 'humanoid'
            ? JSON.parse(JSON.stringify(DEFAULT_RIG_SLOTS))
            : [];

        const rigComponent = {
            type: 'Rig',
            slots,
            poses: {
                default: this.createDefaultPose(slots)
            }
        };

        // Add to entity components
        if (!entity.components) {
            entity.components = [];
        }
        entity.components.push(rigComponent);

        this.currentRig = rigComponent;
        this.editor.events.emit('rig:created', { rig: rigComponent });
        this.editor.console.log('info', `Created ${template} rig with ${slots.length} slots`);

        return rigComponent;
    }

    /**
     * Create a default pose from slots
     */
    createDefaultPose(slots) {
        const pose = {};
        for (const slot of slots) {
            pose[slot.id] = {
                offset: { x: 0, y: 0 },
                rotation: 0,
                scale: { x: 1, y: 1 }
            };
        }
        return pose;
    }

    /**
     * Add a slot to the current rig
     */
    addSlot(slotData) {
        if (!this.currentRig) return null;

        const slot = {
            id: slotData.id || `slot_${Date.now()}`,
            name: slotData.name || 'New Slot',
            zOrder: slotData.zOrder ?? this.currentRig.slots.length,
            pivot: slotData.pivot || { x: 0.5, y: 0.5 },
            image: slotData.image || null
        };

        const command = {
            execute: () => {
                this.currentRig.slots.push(slot);
                // Add to all poses
                for (const poseName in this.currentRig.poses) {
                    this.currentRig.poses[poseName][slot.id] = {
                        offset: { x: 0, y: 0 },
                        rotation: 0,
                        scale: { x: 1, y: 1 }
                    };
                }
                this.editor.events.emit('rig:slot-added', { slot });
            },
            undo: () => {
                const index = this.currentRig.slots.indexOf(slot);
                if (index !== -1) {
                    this.currentRig.slots.splice(index, 1);
                }
                for (const poseName in this.currentRig.poses) {
                    delete this.currentRig.poses[poseName][slot.id];
                }
                this.editor.events.emit('rig:slot-removed', { slot });
            },
            description: `Add slot: ${slot.name}`
        };

        this.editor.history.execute(command);
        return slot;
    }

    /**
     * Remove a slot from the current rig
     */
    removeSlot(slotId) {
        if (!this.currentRig) return;

        const index = this.currentRig.slots.findIndex(s => s.id === slotId);
        if (index === -1) return;

        const slot = this.currentRig.slots[index];
        const poseData = {};

        // Save pose data for undo
        for (const poseName in this.currentRig.poses) {
            poseData[poseName] = { ...this.currentRig.poses[poseName][slotId] };
        }

        const command = {
            execute: () => {
                this.currentRig.slots.splice(index, 1);
                for (const poseName in this.currentRig.poses) {
                    delete this.currentRig.poses[poseName][slotId];
                }
                this.editor.events.emit('rig:slot-removed', { slot });
            },
            undo: () => {
                this.currentRig.slots.splice(index, 0, slot);
                for (const poseName in this.currentRig.poses) {
                    this.currentRig.poses[poseName][slotId] = { ...poseData[poseName] };
                }
                this.editor.events.emit('rig:slot-added', { slot });
            },
            description: `Remove slot: ${slot.name}`
        };

        this.editor.history.execute(command);
    }

    /**
     * Set image for a slot
     */
    setSlotImage(slotId, imagePath) {
        if (!this.currentRig) return;

        const slot = this.currentRig.slots.find(s => s.id === slotId);
        if (!slot) return;

        const oldImage = slot.image;

        const command = {
            execute: () => {
                slot.image = imagePath;
                this.editor.events.emit('rig:slot-image-changed', { slotId, imagePath });
            },
            undo: () => {
                slot.image = oldImage;
                this.editor.events.emit('rig:slot-image-changed', { slotId, imagePath: oldImage });
            },
            description: `Set image for ${slot.name}`
        };

        this.editor.history.execute(command);
    }

    /**
     * Update slot pivot point
     */
    setSlotPivot(slotId, pivot) {
        if (!this.currentRig) return;

        const slot = this.currentRig.slots.find(s => s.id === slotId);
        if (!slot) return;

        const oldPivot = { ...slot.pivot };

        const command = {
            execute: () => {
                slot.pivot = { ...pivot };
                this.editor.events.emit('rig:slot-pivot-changed', { slotId, pivot });
            },
            undo: () => {
                slot.pivot = { ...oldPivot };
                this.editor.events.emit('rig:slot-pivot-changed', { slotId, pivot: oldPivot });
            },
            description: `Set pivot for ${slot.name}`
        };

        this.editor.history.execute(command);
    }

    /**
     * Update slot z-order
     */
    setSlotZOrder(slotId, zOrder) {
        if (!this.currentRig) return;

        const slot = this.currentRig.slots.find(s => s.id === slotId);
        if (!slot) return;

        const oldZOrder = slot.zOrder;

        const command = {
            execute: () => {
                slot.zOrder = zOrder;
                this.sortSlotsByZOrder();
                this.editor.events.emit('rig:slot-zorder-changed', { slotId, zOrder });
            },
            undo: () => {
                slot.zOrder = oldZOrder;
                this.sortSlotsByZOrder();
                this.editor.events.emit('rig:slot-zorder-changed', { slotId, zOrder: oldZOrder });
            },
            description: `Set z-order for ${slot.name}`
        };

        this.editor.history.execute(command);
    }

    /**
     * Sort slots by z-order
     */
    sortSlotsByZOrder() {
        if (!this.currentRig) return;
        this.currentRig.slots.sort((a, b) => a.zOrder - b.zOrder);
    }

    /**
     * Create a new pose
     */
    createPose(poseName) {
        if (!this.currentRig) return null;
        if (this.currentRig.poses[poseName]) {
            this.editor.console.log('warn', `Pose "${poseName}" already exists`);
            return null;
        }

        const pose = this.createDefaultPose(this.currentRig.slots);

        const command = {
            execute: () => {
                this.currentRig.poses[poseName] = pose;
                this.editor.events.emit('rig:pose-created', { poseName });
            },
            undo: () => {
                delete this.currentRig.poses[poseName];
                this.editor.events.emit('rig:pose-removed', { poseName });
            },
            description: `Create pose: ${poseName}`
        };

        this.editor.history.execute(command);
        return pose;
    }

    /**
     * Update slot transform within a pose
     */
    setPoseSlotTransform(poseName, slotId, transform) {
        if (!this.currentRig) return;
        if (!this.currentRig.poses[poseName]) return;

        const pose = this.currentRig.poses[poseName];
        if (!pose[slotId]) return;

        const oldTransform = { ...pose[slotId] };
        const newTransform = { ...oldTransform, ...transform };

        const command = {
            execute: () => {
                pose[slotId] = { ...newTransform };
                this.editor.events.emit('rig:pose-updated', { poseName, slotId, transform: newTransform });
            },
            undo: () => {
                pose[slotId] = { ...oldTransform };
                this.editor.events.emit('rig:pose-updated', { poseName, slotId, transform: oldTransform });
            },
            description: `Update ${slotId} in pose ${poseName}`
        };

        this.editor.history.execute(command);
    }

    /**
     * Get slots sorted by z-order (for rendering)
     */
    getSortedSlots() {
        if (!this.currentRig) return [];
        return [...this.currentRig.slots].sort((a, b) => a.zOrder - b.zOrder);
    }
}

export { DEFAULT_RIG_SLOTS };
