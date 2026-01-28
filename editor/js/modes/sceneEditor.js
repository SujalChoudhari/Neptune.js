/**
 * Scene Editor Mode
 * Multi-layer tilemap and parallax editing
 */

export class SceneEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentScene = null;
        this.selectedLayer = null;
        this.selectedTile = 0;
        this.tool = 'paint'; // paint, erase, select

        // Camera/pan
        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = 1;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = document.getElementById('viewport');

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Add layer button
        document.getElementById('btn-add-layer').addEventListener('click', () => {
            this.addLayer();
        });
    }

    activate() {
        // Create default scene if none exists
        if (this.editor.project.scenes.length === 0) {
            this.createScene('Main Scene');
        }
        this.currentScene = this.editor.project.scenes[0];
    }

    deactivate() {
        // Cleanup if needed
    }

    createScene(name) {
        const scene = {
            id: 'scene_' + Date.now(),
            name: name,
            layers: [
                { id: 'atmosphere', name: 'Atmosphere', type: 'image', visible: true, scrollFactor: 0, blur: 5, data: null },
                { id: 'parallax_bg', name: 'Parallax BG', type: 'image', visible: true, scrollFactor: 0.3, data: null },
                { id: 'bg_tiles', name: 'Background', type: 'tilemap', visible: true, scrollFactor: 0.8, data: [] },
                { id: 'main', name: '★ Main', type: 'tilemap', visible: true, scrollFactor: 1, data: [], collision: true },
                { id: 'fg_tiles', name: 'Foreground', type: 'tilemap', visible: true, scrollFactor: 1, data: [] },
                { id: 'parallax_fg', name: 'Parallax FG', type: 'image', visible: true, scrollFactor: 1.5, data: null }
            ],
            width: 50,
            height: 30,
            tileSize: 32,
            tileset: null,
            entities: [],
            transitions: []
        };

        this.editor.project.scenes.push(scene);
        this.currentScene = scene;
        this.selectedLayer = scene.layers[3]; // Main layer
        return scene;
    }

    addLayer(type = 'tilemap') {
        if (!this.currentScene) return;

        const layer = {
            id: 'layer_' + Date.now(),
            name: 'New Layer',
            type: type,
            visible: true,
            scrollFactor: 1,
            data: type === 'tilemap' ? [] : null
        };

        this.currentScene.layers.push(layer);
        this.updatePanels();
    }

    updatePanels() {
        this.updateLayersPanel();
        this.updateInspector();
    }

    updateLayersPanel() {
        const container = document.getElementById('layers-content');
        if (!this.currentScene) {
            container.innerHTML = '<p class="placeholder">No scene selected</p>';
            return;
        }

        container.innerHTML = this.currentScene.layers.map(layer => `
            <div class="layer-item ${this.selectedLayer === layer ? 'active' : ''}" 
                 data-layer-id="${layer.id}">
                <span class="layer-visibility" data-layer-id="${layer.id}">
                    ${layer.visible ? '👁' : '○'}
                </span>
                <span class="layer-name">${layer.name}</span>
                <span class="layer-type">${layer.type}</span>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.layer-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('layer-visibility')) {
                    const layer = this.getLayerById(e.target.dataset.layerId);
                    if (layer) layer.visible = !layer.visible;
                } else {
                    this.selectedLayer = this.getLayerById(el.dataset.layerId);
                }
                this.updatePanels();
                this.editor.render();
            });
        });
    }

    updateInspector() {
        const container = document.getElementById('inspector-content');

        if (!this.selectedLayer) {
            container.innerHTML = '<p class="placeholder">Select a layer</p>';
            return;
        }

        const layer = this.selectedLayer;
        container.innerHTML = `
            <div class="inspector-field">
                <label>Name</label>
                <input type="text" id="layer-name" value="${layer.name}">
            </div>
            <div class="inspector-field">
                <label>Type</label>
                <select id="layer-type">
                    <option value="tilemap" ${layer.type === 'tilemap' ? 'selected' : ''}>Tilemap</option>
                    <option value="image" ${layer.type === 'image' ? 'selected' : ''}>Image</option>
                </select>
            </div>
            <div class="inspector-field">
                <label>Scroll Factor</label>
                <input type="number" id="layer-scroll" value="${layer.scrollFactor}" step="0.1">
            </div>
            ${layer.type === 'image' ? `
                <div class="inspector-field">
                    <label>Blur</label>
                    <input type="number" id="layer-blur" value="${layer.blur || 0}" step="1">
                </div>
                <div class="inspector-field">
                    <label>Image</label>
                    <button id="btn-set-image">Set Image</button>
                </div>
            ` : ''}
            ${layer.collision !== undefined ? `
                <div class="inspector-field">
                    <label>
                        <input type="checkbox" id="layer-collision" ${layer.collision ? 'checked' : ''}>
                        Collision Layer
                    </label>
                </div>
            ` : ''}
        `;

        // Bind events
        document.getElementById('layer-name')?.addEventListener('change', (e) => {
            layer.name = e.target.value;
            this.updateLayersPanel();
        });

        document.getElementById('layer-scroll')?.addEventListener('change', (e) => {
            layer.scrollFactor = parseFloat(e.target.value);
        });

        document.getElementById('layer-blur')?.addEventListener('change', (e) => {
            layer.blur = parseInt(e.target.value);
        });
    }

    getLayerById(id) {
        return this.currentScene?.layers.find(l => l.id === id);
    }

    onMouseDown(e) {
        if (this.editor.currentMode !== 'scene') return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Middle click or Alt+click = pan
            this.isPanning = true;
            this.panStartX = x;
            this.panStartY = y;
        } else if (e.button === 0) {
            // Left click = paint
            this.isPainting = true;
            this.paintTile(x, y);
        }
    }

    onMouseMove(e) {
        if (this.editor.currentMode !== 'scene') return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isPanning) {
            this.cameraX -= (x - this.panStartX);
            this.cameraY -= (y - this.panStartY);
            this.panStartX = x;
            this.panStartY = y;
            this.editor.render();
        } else if (this.isPainting) {
            this.paintTile(x, y);
        }
    }

    onMouseUp(e) {
        this.isPanning = false;
        this.isPainting = false;
    }

    onWheel(e) {
        if (this.editor.currentMode !== 'scene') return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.25, Math.min(4, this.zoom * delta));
        this.editor.render();
    }

    paintTile(x, y) {
        if (!this.selectedLayer || this.selectedLayer.type !== 'tilemap') return;
        if (!this.currentScene) return;

        const tileX = Math.floor((x + this.cameraX) / (this.currentScene.tileSize * this.zoom));
        const tileY = Math.floor((y + this.cameraY) / (this.currentScene.tileSize * this.zoom));

        // Ensure data array exists and is large enough
        if (!this.selectedLayer.data) {
            this.selectedLayer.data = [];
        }

        const key = `${tileX},${tileY}`;

        if (this.tool === 'erase') {
            delete this.selectedLayer.data[key];
        } else {
            this.selectedLayer.data[key] = this.selectedTile;
        }

        this.editor.render();
    }

    render(ctx) {
        if (!this.currentScene) return;

        const scene = this.currentScene;
        const tileSize = scene.tileSize * this.zoom;

        // Render each visible layer
        for (const layer of scene.layers) {
            if (!layer.visible) continue;

            ctx.save();

            // Apply parallax scrolling
            const offsetX = this.cameraX * layer.scrollFactor;
            const offsetY = this.cameraY * layer.scrollFactor;

            if (layer.type === 'image' && layer.imageData) {
                // Draw image layer
                if (layer.blur) {
                    ctx.filter = `blur(${layer.blur}px)`;
                }
                ctx.drawImage(layer.imageData, -offsetX, -offsetY);
            } else if (layer.type === 'tilemap' && layer.data) {
                // Draw tilemap
                ctx.translate(-this.cameraX, -this.cameraY);

                for (const [key, tileId] of Object.entries(layer.data)) {
                    const [tx, ty] = key.split(',').map(Number);
                    const x = tx * tileSize;
                    const y = ty * tileSize;

                    // Simple colored tiles for now (will be replaced with actual tiles)
                    ctx.fillStyle = this.getTileColor(tileId, layer);
                    ctx.fillRect(x, y, tileSize - 1, tileSize - 1);
                }
            }

            ctx.restore();
        }

        // Draw layer indicator
        if (this.selectedLayer) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText(`Layer: ${this.selectedLayer.name}`, 10, 20);
        }
    }

    getTileColor(tileId, layer) {
        // Temporary color coding for different layers
        const colors = {
            'bg_tiles': '#3a5a3a',
            'main': '#5a5a8a',
            'fg_tiles': '#8a5a5a'
        };
        return colors[layer.id] || '#666';
    }
}
