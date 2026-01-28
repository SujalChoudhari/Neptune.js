/**
 * Enemy Editor Mode
 * Enemy types and AI behaviors
 */

export class EnemyEditor {
    constructor(editor) {
        this.editor = editor;
        this.selectedEnemy = null;
    }

    activate() { }
    deactivate() { }

    updatePanels() {
        this.updateHierarchy();
        this.updateInspector();
    }

    updateHierarchy() {
        const container = document.getElementById('hierarchy-content');
        const enemies = this.editor.project.enemies;

        container.innerHTML = `
            <div style="margin-bottom: 10px;">
                <button id="btn-add-enemy" class="btn-small">+ Add Enemy</button>
            </div>
            ${enemies.map(enemy => `
                <div class="layer-item ${this.selectedEnemy === enemy ? 'active' : ''}"
                     data-enemy-id="${enemy.id}">
                    <span class="layer-name">${enemy.name}</span>
                    <span class="layer-type">${enemy.type}</span>
                </div>
            `).join('') || '<p class="placeholder" style="margin-top: 10px;">No enemies yet</p>'}
        `;

        document.getElementById('btn-add-enemy')?.addEventListener('click', () => {
            this.addEnemy();
        });

        container.querySelectorAll('.layer-item').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedEnemy = this.editor.project.enemies.find(e => e.id === el.dataset.enemyId);
                this.updatePanels();
                this.editor.render();
            });
        });
    }

    updateInspector() {
        const container = document.getElementById('inspector-content');

        if (!this.selectedEnemy) {
            container.innerHTML = '<p class="placeholder">Select an enemy</p>';
            return;
        }

        const enemy = this.selectedEnemy;
        container.innerHTML = `
            <div class="inspector-field">
                <label>Name</label>
                <input type="text" id="enemy-name" value="${enemy.name}">
            </div>
            <div class="inspector-field">
                <label>Sprite</label>
                <button id="btn-set-sprite" class="btn-small">Set Sprite</button>
            </div>
            <div class="inspector-field">
                <label>Type</label>
                <select id="enemy-type">
                    <option value="aggressive" ${enemy.type === 'aggressive' ? 'selected' : ''}>Aggressive (Attack on Sight)</option>
                    <option value="passive" ${enemy.type === 'passive' ? 'selected' : ''}>Passive-Aggressive</option>
                    <option value="boss" ${enemy.type === 'boss' ? 'selected' : ''}>Boss</option>
                </select>
            </div>
            <hr style="border-color: #3a3a3a; margin: 15px 0;">
            <div class="inspector-field">
                <label>Stats</label>
            </div>
            <div class="inspector-field">
                <label>Health</label>
                <input type="number" id="enemy-health" value="${enemy.stats.health}">
            </div>
            <div class="inspector-field">
                <label>Attack</label>
                <input type="number" id="enemy-attack" value="${enemy.stats.attack}">
            </div>
            <div class="inspector-field">
                <label>Defense</label>
                <input type="number" id="enemy-defense" value="${enemy.stats.defense}">
            </div>
            <hr style="border-color: #3a3a3a; margin: 15px 0;">
            <div class="inspector-field">
                <label>Detection Range</label>
                <input type="number" id="enemy-range" value="${enemy.detectionRange}">
            </div>
            <div class="inspector-field">
                <label>Attack Pattern</label>
                <select id="enemy-pattern">
                    <option value="melee" ${enemy.attackPattern === 'melee' ? 'selected' : ''}>Melee</option>
                    <option value="ranged" ${enemy.attackPattern === 'ranged' ? 'selected' : ''}>Ranged</option>
                    <option value="boss" ${enemy.attackPattern === 'boss' ? 'selected' : ''}>Boss (Phases)</option>
                </select>
            </div>
            ${enemy.type === 'boss' ? `
                <hr style="border-color: #3a3a3a; margin: 15px 0;">
                <div class="inspector-field">
                    <label>Boss Phases</label>
                    ${enemy.phases?.map((phase, i) => `
                        <div style="background: #333; padding: 8px; margin: 5px 0; border-radius: 4px;">
                            <strong>Phase ${i + 1}</strong> (HP ≤ ${phase.threshold * 100}%)
                            <div style="color: #888; font-size: 11px;">Patterns: ${phase.patterns?.length || 0}</div>
                        </div>
                    `).join('') || '<span style="color: #888;">No phases defined</span>'}
                    <button id="btn-add-phase" class="btn-small" style="margin-top: 8px;">+ Add Phase</button>
                </div>
            ` : ''}
        `;

        // Bind events
        document.getElementById('enemy-name')?.addEventListener('change', (e) => {
            enemy.name = e.target.value;
            this.updateHierarchy();
        });

        document.getElementById('enemy-type')?.addEventListener('change', (e) => {
            enemy.type = e.target.value;
            if (e.target.value === 'boss' && !enemy.phases) {
                enemy.phases = [];
            }
            this.updateInspector();
        });

        document.getElementById('enemy-health')?.addEventListener('change', (e) => {
            enemy.stats.health = parseInt(e.target.value);
        });

        document.getElementById('enemy-attack')?.addEventListener('change', (e) => {
            enemy.stats.attack = parseInt(e.target.value);
        });

        document.getElementById('enemy-defense')?.addEventListener('change', (e) => {
            enemy.stats.defense = parseInt(e.target.value);
        });

        document.getElementById('enemy-range')?.addEventListener('change', (e) => {
            enemy.detectionRange = parseInt(e.target.value);
        });

        document.getElementById('enemy-pattern')?.addEventListener('change', (e) => {
            enemy.attackPattern = e.target.value;
        });

        document.getElementById('btn-add-phase')?.addEventListener('click', () => {
            if (!enemy.phases) enemy.phases = [];
            enemy.phases.push({
                threshold: 0.5,
                patterns: []
            });
            this.updateInspector();
        });
    }

    addEnemy() {
        const enemy = {
            id: 'enemy_' + Date.now(),
            name: 'New Enemy',
            sprite: null,
            type: 'aggressive',
            stats: {
                health: 50,
                attack: 10,
                defense: 5
            },
            detectionRange: 200,
            attackPattern: 'melee',
            phases: null
        };

        this.editor.project.enemies.push(enemy);
        this.selectedEnemy = enemy;
        this.updatePanels();
        this.editor.render();
    }

    render(ctx) {
        const enemies = this.editor.project.enemies;

        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.fillText('Enemy Editor - Select an enemy from the Hierarchy panel', 10, 30);

        // Draw enemy cards
        let y = 60;
        for (const enemy of enemies) {
            const isSelected = this.selectedEnemy === enemy;

            const colors = {
                aggressive: '#8a3a3a',
                passive: '#5a5a3a',
                boss: '#5a3a8a'
            };

            ctx.fillStyle = isSelected ? colors[enemy.type] : '#333';
            ctx.fillRect(10, y, 300, 70);
            ctx.strokeStyle = isSelected ? '#ff6666' : '#444';
            ctx.strokeRect(10, y, 300, 70);

            // Enemy icon placeholder
            ctx.fillStyle = colors[enemy.type] || '#555';
            ctx.fillRect(20, y + 10, 50, 50);
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.fillText('👾', 28, y + 45);

            // Name and info
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(enemy.name, 80, y + 25);
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.fillText(`Type: ${enemy.type}`, 80, y + 42);
            ctx.fillText(`HP: ${enemy.stats.health} | ATK: ${enemy.stats.attack} | DEF: ${enemy.stats.defense}`, 80, y + 58);

            y += 80;
        }
    }
}
