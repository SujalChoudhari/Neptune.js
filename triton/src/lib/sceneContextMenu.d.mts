export function clampSceneMenuPosition(x: number, y: number, menuWidth: number, menuHeight: number, viewportWidth: number, viewportHeight: number): { x: number; y: number };
export function sceneContextSelection(clickedId: string | null, selectedIds: string[], entities: Record<string, { locked?: boolean }> | undefined): string[];
