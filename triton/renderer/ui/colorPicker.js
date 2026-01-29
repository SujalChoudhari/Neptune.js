/**
 * Triton Editor - Color Picker Component
 * Advanced color picker with presets and history
 */

/**
 * ColorPicker - Component for color selection
 */
export class ColorPicker {
    constructor(options = {}) {
        this.container = null;
        this.currentColor = options.initialColor || '#ffffff';
        this.onChange = options.onChange || (() => { });
        this.showAlpha = options.showAlpha || false;
        this.presets = options.presets || this.defaultPresets();
        this.recentColors = [];
        this.maxRecent = 8;
    }

    /**
     * Default color presets
     */
    defaultPresets() {
        return [
            // Primary
            '#ff0000', '#ff7700', '#ffff00', '#00ff00',
            '#00ffff', '#0000ff', '#7700ff', '#ff00ff',
            // Pastels
            '#ffb3b3', '#ffd9b3', '#ffffb3', '#b3ffb3',
            '#b3ffff', '#b3b3ff', '#d9b3ff', '#ffb3ff',
            // Dark
            '#990000', '#994d00', '#999900', '#009900',
            '#009999', '#000099', '#4d0099', '#990099',
            // Grayscale
            '#ffffff', '#dddddd', '#999999', '#666666',
            '#333333', '#1a1a1a', '#0d0d0d', '#000000'
        ];
    }

    /**
     * Create the picker UI
     */
    create(parentElement) {
        this.container = document.createElement('div');
        this.container.className = 'color-picker';
        this.container.innerHTML = this.render();

        if (parentElement) {
            parentElement.appendChild(this.container);
        }

        this.setupEventListeners();
        return this.container;
    }

    /**
     * Render the picker HTML
     */
    render() {
        const alpha = this.showAlpha ? `
            <div class="picker-alpha">
                <label>Alpha</label>
                <input type="range" class="alpha-slider" min="0" max="100" value="100">
                <span class="alpha-value">100%</span>
            </div>
        ` : '';

        return `
            <div class="picker-current">
                <div class="current-color" style="background: ${this.currentColor}"></div>
                <input type="text" class="color-input" value="${this.currentColor}">
            </div>
            
            <div class="picker-sliders">
                <div class="slider-row">
                    <label>H</label>
                    <input type="range" class="hue-slider" min="0" max="360" value="0">
                </div>
                <div class="slider-row">
                    <label>S</label>
                    <input type="range" class="sat-slider" min="0" max="100" value="100">
                </div>
                <div class="slider-row">
                    <label>L</label>
                    <input type="range" class="light-slider" min="0" max="100" value="50">
                </div>
                ${alpha}
            </div>

            <div class="picker-presets">
                <div class="presets-label">Presets</div>
                <div class="preset-grid">
                    ${this.presets.map(c => `
                        <div class="preset-color" style="background: ${c}" data-color="${c}"></div>
                    `).join('')}
                </div>
            </div>

            <div class="picker-recent">
                <div class="recent-label">Recent</div>
                <div class="recent-grid"></div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        // Text input
        const input = this.container.querySelector('.color-input');
        input?.addEventListener('change', (e) => {
            this.setColor(e.target.value);
        });

        // Sliders
        const hueSlider = this.container.querySelector('.hue-slider');
        const satSlider = this.container.querySelector('.sat-slider');
        const lightSlider = this.container.querySelector('.light-slider');

        [hueSlider, satSlider, lightSlider].forEach(slider => {
            slider?.addEventListener('input', () => {
                const h = parseInt(hueSlider?.value || 0);
                const s = parseInt(satSlider?.value || 100);
                const l = parseInt(lightSlider?.value || 50);
                this.setColor(this.hslToHex(h, s, l));
            });
        });

        // Preset colors
        this.container.querySelectorAll('.preset-color').forEach(el => {
            el.addEventListener('click', () => {
                this.setColor(el.dataset.color);
            });
        });
    }

    /**
     * Set color value
     */
    setColor(color) {
        this.currentColor = color;
        this.addToRecent(color);
        this.updateUI();
        this.onChange(color);
    }

    /**
     * Add to recent colors
     */
    addToRecent(color) {
        if (this.recentColors.includes(color)) {
            this.recentColors = this.recentColors.filter(c => c !== color);
        }
        this.recentColors.unshift(color);
        if (this.recentColors.length > this.maxRecent) {
            this.recentColors.pop();
        }
        this.updateRecentUI();
    }

    /**
     * Update recent colors UI
     */
    updateRecentUI() {
        const grid = this.container?.querySelector('.recent-grid');
        if (!grid) return;

        grid.innerHTML = this.recentColors.map(c => `
            <div class="recent-color" style="background: ${c}" data-color="${c}"></div>
        `).join('');

        grid.querySelectorAll('.recent-color').forEach(el => {
            el.addEventListener('click', () => {
                this.setColor(el.dataset.color);
            });
        });
    }

    /**
     * Update UI
     */
    updateUI() {
        if (!this.container) return;

        const current = this.container.querySelector('.current-color');
        const input = this.container.querySelector('.color-input');

        if (current) current.style.background = this.currentColor;
        if (input) input.value = this.currentColor;

        // Update sliders
        const hsl = this.hexToHsl(this.currentColor);
        const hueSlider = this.container.querySelector('.hue-slider');
        const satSlider = this.container.querySelector('.sat-slider');
        const lightSlider = this.container.querySelector('.light-slider');

        if (hueSlider) hueSlider.value = hsl.h;
        if (satSlider) satSlider.value = hsl.s;
        if (lightSlider) lightSlider.value = hsl.l;
    }

    /**
     * HSL to Hex conversion
     */
    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    /**
     * Hex to HSL conversion
     */
    hexToHsl(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return { h: 0, s: 100, l: 50 };

        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    /**
     * Destroy the picker
     */
    destroy() {
        this.container?.remove();
        this.container = null;
    }
}
