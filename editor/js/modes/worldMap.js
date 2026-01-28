/**
 * World Map Mode
 * Scene connections and transition editing
 */

export class WorldMap {
    constructor(editor) {
        this.editor = editor;
        this.selectedScene = null;
        this.selectedTransition = null;
        this.isDragging = false;
        this.connectionStart = null;

        // Node positions for visualization
        this.nodePositions = {};
    }

    activate() {
        this.updateNodePositions();
    }

    deactivate() { }

    updateNodePositions() {
        // Auto-layout scene nodes if no positions saved
        const scenes = this.editor.project.scenes;
        const centerX = 400;
        const centerY = 300;
        const radius = 150;

        scenes.forEach((scene, i) => {
            if (!this.nodePositions[scene.id]) {
                const angle = (i / scenes.length) * Math.PI * 2;
                this.nodePositions[scene.id] = {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                };
            }
        });
    }

    updatePanels() {
        this.updateHierarchy();
        this.updateInspector();
    }

    updateHierarchy() {
        const container = document.getElementById('hierarchy-content');
        const scenes = this.editor.project.scenes;

        container.innerHTML = `
            <div style="margin-bottom: 10px;">
                <button id="btn-add-scene" class="btn-small">+ Add Scene</button>
            </div>
            ${scenes.map(scene => `
                <div class="layer-item ${this.selectedScene === scene ? 'active' : ''}"
                     data-scene-id="${scene.id}">
                    <span class="layer-name">${scene.name}</span>
                    <span class="layer-type">${scene.transitions?.length || 0} links</span>
                </div>
            `).join('')}
        `;

        // Add scene button
        document.getElementById('btn-add-scene')?.addEventListener('click', () => {
            this.addScene();
        });

        // Scene selection
        container.querySelectorAll('.layer-item').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedScene = this.editor.project.scenes.find(s => s.id === el.dataset.sceneId);
                this.updatePanels();
                this.editor.render();
            });
        });
    }

    updateInspector() {
        const container = document.getElementById('inspector-content');

        if (!this.selectedScene) {
            container.innerHTML = '<p class="placeholder">Select a scene</p>';
            return;
        }

        const scene = this.selectedScene;
        container.innerHTML = `
            <div class="inspector-field">
                <label>Scene Name</label>
                <input type="text" id="scene-name" value="${scene.name}">
            </div>
            <div class="inspector-field">
                <label>Size (tiles)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="scene-width" value="${scene.width}" style="width: 50%">
                    <input type="number" id="scene-height" value="${scene.height}" style="width: 50%">
                </div>
            </div>
            <div class="inspector-field">
                <label>Tile Size</label>
                <input type="number" id="scene-tilesize" value="${scene.tileSize}">
            </div>
            <hr style="border-color: #3a3a3a; margin: 15px 0;">
            <div class="inspector-field">
                <label>Transitions</label>
                ${scene.transitions?.map((t, i) => `
                    <div style="background: #333; padding: 5px; margin: 5px 0; border-radius: 3px;">
                        → ${this.getSceneName(t.targetSceneId)}
                        <span style="color: #888;">(${t.type})</span>
                    </div>
                `).join('') || '<p class="placeholder">No transitions</p>'}
                <button id="btn-add-transition" class="btn-small" style="margin-top: 8px;">+ Add Transition</button>
            </div>
        `;

        // Bind events
        document.getElementById('scene-name')?.addEventListener('change', (e) => {
            scene.name = e.target.value;
            this.updateHierarchy();
        });

        document.getElementById('btn-add-transition')?.addEventListener('click', () => {
            this.startAddingTransition();
        });
    }

    addScene() {
        const sceneName = `Scene ${this.editor.project.scenes.length + 1}`;

        // Use scene editor to create properly structured scene
        const sceneEditor = this.editor.modes.scene;
        const scene = sceneEditor.createScene(sceneName);

        // Position for world map
        this.nodePositions[scene.id] = {
            x: 200 + Math.random() * 400,
            y: 150 + Math.random() * 300
        };

        this.selectedScene = scene;
        this.updatePanels();
        this.editor.render();
    }

    startAddingTransition() {
        if (!this.selectedScene) return;
        this.connectionStart = this.selectedScene;
        // User needs to click another scene
    }

    addTransition(fromScene, toScene, type = 'walk') {
        if (!fromScene.transitions) fromScene.transitions = [];

        fromScene.transitions.push({
            id: 'trans_' + Date.now(),
            targetSceneId: toScene.id,
            type: type, // 'walk', 'door', 'cutscene'
            zone: { x: 0, y: 0, width: 64, height: 64 }
        });

        this.updatePanels();
        this.editor.render();
    }

    getSceneName(sceneId) {
        const scene = this.editor.project.scenes.find(s => s.id === sceneId);
        return scene?.name || 'Unknown';
    }

    render(ctx) {
        const scenes = this.editor.project.scenes;

        // Draw connections first (behind nodes)
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;

        for (const scene of scenes) {
            const fromPos = this.nodePositions[scene.id];
            if (!fromPos) continue;

            for (const transition of (scene.transitions || [])) {
                const toPos = this.nodePositions[transition.targetSceneId];
                if (!toPos) continue;

                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y);
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();

                // Arrow head
                const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
                const arrowX = toPos.x - Math.cos(angle) * 40;
                const arrowY = toPos.y - Math.sin(angle) * 40;

                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - 10 * Math.cos(angle - 0.5), arrowY - 10 * Math.sin(angle - 0.5));
                ctx.lineTo(arrowX - 10 * Math.cos(angle + 0.5), arrowY - 10 * Math.sin(angle + 0.5));
                ctx.closePath();
                ctx.fillStyle = '#4a9eff';
                ctx.fill();
            }
        }

        // Draw scene nodes
        for (const scene of scenes) {
            const pos = this.nodePositions[scene.id];
            if (!pos) continue;

            const isSelected = this.selectedScene === scene;

            // Node circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
            ctx.fillStyle = isSelected ? '#4a9eff' : '#444';
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#fff' : '#666';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Scene name
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(scene.name, pos.x, pos.y + 50);
        }

        // Instructions
        ctx.fillStyle = '#888';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Drag scenes to reposition. Click to select. Use Inspector to add transitions.', 10, 20);

        if (this.connectionStart) {
            ctx.fillText(`Click a scene to connect from "${this.connectionStart.name}"`, 10, 40);
        }
    }
}
