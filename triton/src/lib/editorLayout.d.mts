import type { SerializedDockview } from 'dockview';
export const EDITOR_LAYOUT_VERSION: number;
export const REQUIRED_EDITOR_PANELS: string[];
export function editorLayoutKey(projectPath: unknown): string | null;
export function readEditorLayout(serialized: unknown): SerializedDockview | null;
export function serializeEditorLayout(layout: SerializedDockview): string | null;
