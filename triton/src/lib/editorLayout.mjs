export const EDITOR_LAYOUT_VERSION = 1;
export const REQUIRED_EDITOR_PANELS = ['scene', 'game', 'hierarchy', 'inspector', 'console', 'project', 'tilemap'];
const componentNames = new Set(['scene', 'game', 'hierarchy', 'inspector', 'console', 'project', 'tilemap']);

export function editorLayoutKey(projectPath) {
    if (typeof projectPath !== 'string' || !projectPath.trim()) return null;
    return `neptune.editor.layout.v${EDITOR_LAYOUT_VERSION}:${projectPath.replaceAll('\\', '/').replace(/\/+$/, '')}`;
}

/** Validate a docked workspace before handing it to Dockview. Popouts/floating
 * groups are deliberately not restored: stale screen coordinates can hide tools. */
export function readEditorLayout(serialized) {
    if (typeof serialized !== 'string' || serialized.length > 500_000) return null;
    try {
        const record = JSON.parse(serialized);
        const layout = record?.layout;
        if (record.version !== EDITOR_LAYOUT_VERSION || !layout?.grid || !layout.panels ||
            !Number.isFinite(layout.grid.width) || !Number.isFinite(layout.grid.height) ||
            layout.grid.width <= 0 || layout.grid.height <= 0 ||
            (layout.floatingGroups?.length || 0) || (layout.popoutGroups?.length || 0)) return null;
        const panels = Object.entries(layout.panels);
        if (panels.length !== REQUIRED_EDITOR_PANELS.length || panels.some(([id, panel]) =>
            !REQUIRED_EDITOR_PANELS.includes(id) || panel?.id !== id || !componentNames.has(panel.contentComponent) || panel.contentComponent !== id)) return null;
        const placed = new Set();
        const groups = new Set();
        const visit = (node, depth = 0) => {
            if (!node || depth > 16 || node.visible === false ||
                (node.size !== undefined && (!Number.isFinite(node.size) || node.size <= 0))) return false;
            if (node.type === 'branch') return Array.isArray(node.data) && node.data.length > 0 && node.data.every(child => visit(child, depth + 1));
            if (node.type !== 'leaf' || typeof node.data?.id !== 'string' || groups.has(node.data.id) ||
                !Array.isArray(node.data.views) || node.data.views.length === 0) return false;
            groups.add(node.data.id);
            for (const id of node.data.views) {
                if (!layout.panels[id] || placed.has(id)) return false;
                placed.add(id);
            }
            return !node.data.activeView || node.data.views.includes(node.data.activeView);
        };
        if (!visit(layout.grid.root) || !REQUIRED_EDITOR_PANELS.every(id => placed.has(id))) return null;
        return layout;
    } catch { return null; }
}

export function serializeEditorLayout(layout) {
    const serialized = JSON.stringify({ version: EDITOR_LAYOUT_VERSION, layout });
    return readEditorLayout(serialized) ? serialized : null;
}
