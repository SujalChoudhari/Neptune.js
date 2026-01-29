/**
 * Triton Editor - Resizable Panel System
 * Dockable, resizable panels for professional editor layout
 */

/**
 * PanelManager - Manages resizable panel layout
 */
export class PanelManager {
    constructor(editor) {
        this.editor = editor;
        this.panels = new Map();
        this.splitters = [];
        this.activeResizer = null;
        this.minPanelSize = 150;
    }

    /**
     * Initialize the panel system
     */
    init() {
        this.setupSplitters();
        this.setupResizeHandlers();
        this.loadLayout();
    }

    /**
     * Setup splitter elements between panels
     */
    setupSplitters() {
        // Left panel splitter (between hierarchy and viewport)
        this.createSplitter('left-splitter', 'vertical', 'left-panel', 'center-panel');

        // Right panel splitter (between viewport and inspector)
        this.createSplitter('right-splitter', 'vertical', 'center-panel', 'right-panel');

        // Bottom panel splitter (between main area and bottom panel)
        this.createSplitter('bottom-splitter', 'horizontal', 'main-area', 'bottom-panel');

        // Layer panel splitter (between hierarchy and layers)
        this.createSplitter('layer-splitter', 'horizontal', 'hierarchy-section', 'layers-section');
    }

    /**
     * Create a splitter element
     */
    createSplitter(id, direction, beforeId, afterId) {
        const existingSplitter = document.getElementById(id);
        if (existingSplitter) {
            this.splitters.push({
                element: existingSplitter,
                direction,
                beforeId,
                afterId
            });
            return;
        }

        const beforeEl = document.getElementById(beforeId);
        const afterEl = document.getElementById(afterId);

        if (!beforeEl || !afterEl) return;

        const splitter = document.createElement('div');
        splitter.id = id;
        splitter.className = `splitter splitter-${direction}`;
        splitter.dataset.direction = direction;
        splitter.dataset.before = beforeId;
        splitter.dataset.after = afterId;

        // Insert splitter after the 'before' element
        beforeEl.parentNode.insertBefore(splitter, afterEl);

        this.splitters.push({
            element: splitter,
            direction,
            beforeId,
            afterId
        });
    }

    /**
     * Setup resize handlers for all splitters
     */
    setupResizeHandlers() {
        this.splitters.forEach(splitter => {
            splitter.element.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.startResize(e, splitter);
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (this.activeResizer) {
                this.doResize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.endResize();
        });
    }

    /**
     * Start resizing
     */
    startResize(e, splitter) {
        this.activeResizer = {
            splitter,
            startX: e.clientX,
            startY: e.clientY,
            beforeEl: document.getElementById(splitter.beforeId),
            afterEl: document.getElementById(splitter.afterId)
        };

        if (this.activeResizer.beforeEl && this.activeResizer.afterEl) {
            const beforeRect = this.activeResizer.beforeEl.getBoundingClientRect();
            const afterRect = this.activeResizer.afterEl.getBoundingClientRect();

            this.activeResizer.beforeStart = splitter.direction === 'vertical' ?
                beforeRect.width : beforeRect.height;
            this.activeResizer.afterStart = splitter.direction === 'vertical' ?
                afterRect.width : afterRect.height;
        }

        document.body.style.cursor = splitter.direction === 'vertical' ?
            'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        splitter.element.classList.add('active');
    }

    /**
     * Perform resize
     */
    doResize(e) {
        if (!this.activeResizer) return;

        const { splitter, startX, startY, beforeEl, afterEl, beforeStart, afterStart } = this.activeResizer;

        if (!beforeEl || !afterEl) return;

        let delta;
        if (splitter.direction === 'vertical') {
            delta = e.clientX - startX;
        } else {
            delta = e.clientY - startY;
        }

        const newBeforeSize = Math.max(this.minPanelSize, beforeStart + delta);
        const newAfterSize = Math.max(this.minPanelSize, afterStart - delta);

        // Apply sizes
        if (splitter.direction === 'vertical') {
            beforeEl.style.width = `${newBeforeSize}px`;
            beforeEl.style.flexBasis = `${newBeforeSize}px`;
            beforeEl.style.flexGrow = '0';
            beforeEl.style.flexShrink = '0';
        } else {
            beforeEl.style.height = `${newBeforeSize}px`;
            beforeEl.style.flexBasis = `${newBeforeSize}px`;
            beforeEl.style.flexGrow = '0';
            beforeEl.style.flexShrink = '0';
        }

        // Emit resize event
        this.editor.events.emit('panel:resized', {
            panel: splitter.beforeId,
            size: newBeforeSize
        });
    }

    /**
     * End resizing
     */
    endResize() {
        if (this.activeResizer) {
            this.activeResizer.splitter.element.classList.remove('active');
            this.saveLayout();
        }

        this.activeResizer = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    /**
     * Save panel layout to localStorage
     */
    saveLayout() {
        const layout = {};

        const panels = ['left-panel', 'right-panel', 'bottom-panel', 'hierarchy-section', 'layers-section'];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                layout[id] = {
                    width: el.offsetWidth,
                    height: el.offsetHeight
                };
            }
        });

        try {
            localStorage.setItem('triton-panel-layout', JSON.stringify(layout));
        } catch (e) {
            console.warn('Could not save panel layout:', e);
        }
    }

    /**
     * Load panel layout from localStorage
     */
    loadLayout() {
        try {
            const saved = localStorage.getItem('triton-panel-layout');
            if (!saved) return;

            const layout = JSON.parse(saved);

            Object.entries(layout).forEach(([id, sizes]) => {
                const el = document.getElementById(id);
                if (!el) return;

                // Restore width for horizontal panels
                if (sizes.width && (id === 'left-panel' || id === 'right-panel')) {
                    el.style.width = `${sizes.width}px`;
                    el.style.flexBasis = `${sizes.width}px`;
                    el.style.flexGrow = '0';
                    el.style.flexShrink = '0';
                }

                // Restore height for vertical panels  
                if (sizes.height && (id === 'bottom-panel' || id === 'layers-section')) {
                    el.style.height = `${sizes.height}px`;
                    el.style.flexBasis = `${sizes.height}px`;
                    el.style.flexGrow = '0';
                    el.style.flexShrink = '0';
                }
            });
        } catch (e) {
            console.warn('Could not load panel layout:', e);
        }
    }

    /**
     * Reset layout to defaults
     */
    resetLayout() {
        localStorage.removeItem('triton-panel-layout');

        const panels = ['left-panel', 'right-panel', 'bottom-panel', 'hierarchy-section', 'layers-section'];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.width = '';
                el.style.height = '';
                el.style.flexBasis = '';
                el.style.flexGrow = '';
                el.style.flexShrink = '';
            }
        });

        this.editor.events.emit('panel:layout-reset');
    }

    /**
     * Toggle panel visibility
     */
    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const isHidden = panel.classList.contains('panel-hidden');
        panel.classList.toggle('panel-hidden', !isHidden);

        this.editor.events.emit('panel:toggled', {
            panel: panelId,
            visible: isHidden
        });
    }

    /**
     * Collapse panel to minimum
     */
    collapsePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.classList.add('panel-collapsed');
        panel.dataset.expandedSize = panel.style.width || panel.style.height;

        if (panelId === 'left-panel' || panelId === 'right-panel') {
            panel.style.width = '32px';
            panel.style.flexBasis = '32px';
        } else {
            panel.style.height = '32px';
            panel.style.flexBasis = '32px';
        }
    }

    /**
     * Expand collapsed panel
     */
    expandPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const expandedSize = panel.dataset.expandedSize || '200px';
        panel.classList.remove('panel-collapsed');

        if (panelId === 'left-panel' || panelId === 'right-panel') {
            panel.style.width = expandedSize;
            panel.style.flexBasis = expandedSize;
        } else {
            panel.style.height = expandedSize;
            panel.style.flexBasis = expandedSize;
        }
    }
}

/**
 * CSS for the panel system (inject if not present)
 */
export function injectPanelStyles() {
    if (document.getElementById('panel-system-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'panel-system-styles';
    styles.textContent = `
        /* Splitter styles */
        .splitter {
            background: transparent;
            flex-shrink: 0;
            transition: background 0.15s ease;
        }

        .splitter-vertical {
            width: 4px;
            cursor: col-resize;
        }

        .splitter-horizontal {
            height: 4px;
            cursor: row-resize;
        }

        .splitter:hover,
        .splitter.active {
            background: var(--accent-primary);
        }

        /* Panel states */
        .panel-hidden {
            display: none !important;
        }

        .panel-collapsed {
            overflow: hidden;
        }

        .panel-collapsed > *:not(.panel-collapse-btn) {
            display: none;
        }

        .panel-collapse-btn {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            padding: 8px 4px;
            cursor: pointer;
        }

        /* Resize feedback */
        body.resizing {
            cursor: col-resize;
            user-select: none;
        }

        body.resizing-vertical {
            cursor: row-resize;
        }
    `;
    document.head.appendChild(styles);
}
