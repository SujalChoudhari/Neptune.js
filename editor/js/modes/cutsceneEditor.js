/**
 * Cutscene Editor Mode - Timeline-based cutscene editing
 */

export class CutsceneEditor {
    constructor(editor) {
        this.editor = editor;
        this.selectedCutscene = null;
        this.selectedAction = null;
        this.timelineZoom = 50;
        this.playheadPosition = 0;
    }

    activate() { }
    deactivate() { }

    updatePanels() {
        this.updateHierarchy();
        this.updateInspector();
    }

    updateHierarchy() {
        const container = document.getElementById('hierarchy-content');
        const cutscenes = this.editor.project.cutscenes;

        container.innerHTML = `
            <div style="margin-bottom: 10px;">
                <button id="btn-add-cutscene" class="btn-small">+ Add Cutscene</button>
            </div>
            ${cutscenes.map(cs => `
                <div class="layer-item ${this.selectedCutscene === cs ? 'active' : ''}" data-cs-id="${cs.id}">
                    <span class="layer-name">${cs.name}</span>
                    <span class="layer-type">${cs.duration}s</span>
                </div>
            `).join('') || '<p class="placeholder">No cutscenes</p>'}
        `;

        document.getElementById('btn-add-cutscene')?.addEventListener('click', () => this.addCutscene());

        container.querySelectorAll('.layer-item').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedCutscene = this.editor.project.cutscenes.find(c => c.id === el.dataset.csId);
                this.updatePanels();
                this.editor.render();
            });
        });
    }

    updateInspector() {
        const container = document.getElementById('inspector-content');
        if (!this.selectedCutscene) {
            container.innerHTML = '<p class="placeholder">Select a cutscene</p>';
            return;
        }

        const cs = this.selectedCutscene;
        container.innerHTML = `
            <div class="inspector-field">
                <label>Name</label>
                <input type="text" id="cs-name" value="${cs.name}">
            </div>
            <div class="inspector-field">
                <label>Duration (s)</label>
                <input type="number" id="cs-duration" value="${cs.duration}" step="0.5">
            </div>
            <hr style="border-color: #3a3a3a; margin: 15px 0;">
            <button id="btn-add-action" class="btn-small">+ Add Action</button>
        `;

        document.getElementById('cs-name')?.addEventListener('change', e => {
            cs.name = e.target.value;
            this.updateHierarchy();
        });

        document.getElementById('cs-duration')?.addEventListener('change', e => {
            cs.duration = parseFloat(e.target.value);
            this.editor.render();
        });

        document.getElementById('btn-add-action')?.addEventListener('click', () => this.addAction());
    }

    addCutscene() {
        const cs = {
            id: 'cutscene_' + Date.now(),
            name: 'New Cutscene',
            duration: 5,
            actions: []
        };
        this.editor.project.cutscenes.push(cs);
        this.selectedCutscene = cs;
        this.updatePanels();
    }

    addAction() {
        if (!this.selectedCutscene) return;
        this.selectedCutscene.actions.push({
            type: 'dialogue',
            startTime: 0,
            duration: 2,
            text: ''
        });
        this.editor.render();
    }

    getActionColor(type) {
        const colors = { dialogue: '#4a9eff', camera_pan: '#9eff4a', fade: '#9e4aff', wait: '#666' };
        return colors[type] || '#888';
    }

    render(ctx) {
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.fillText('Cutscene Editor - Select from Hierarchy', 10, 30);

        if (!this.selectedCutscene) return;

        const cs = this.selectedCutscene;
        const timelineY = 100;
        const timelineWidth = ctx.canvas.width - 40;

        // Timeline background
        ctx.fillStyle = '#222';
        ctx.fillRect(20, timelineY, timelineWidth, 150);

        // Time markers
        for (let t = 0; t <= cs.duration; t++) {
            const x = 20 + (t / cs.duration) * timelineWidth;
            ctx.strokeStyle = '#444';
            ctx.beginPath();
            ctx.moveTo(x, timelineY);
            ctx.lineTo(x, timelineY + 150);
            ctx.stroke();
            ctx.fillStyle = '#666';
            ctx.fillText(`${t}s`, x + 2, timelineY + 12);
        }

        // Draw actions
        let trackY = timelineY + 30;
        for (const action of cs.actions) {
            const x = 20 + (action.startTime / cs.duration) * timelineWidth;
            const w = Math.max((action.duration / cs.duration) * timelineWidth, 20);

            ctx.fillStyle = this.getActionColor(action.type);
            ctx.fillRect(x, trackY, w, 25);
            ctx.fillStyle = '#fff';
            ctx.fillText(action.type, x + 4, trackY + 16);
            trackY += 30;
        }
    }
}
