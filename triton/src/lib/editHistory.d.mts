export interface EditHistory {
    run(label: string, apply: () => void | boolean, revert: () => void | boolean): boolean;
    begin(label: string): { commit(): boolean; cancel(): boolean };
    undo(): boolean;
    redo(): boolean;
    clear(): void;
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly active: boolean;
    readonly undoLabel: string | null;
    readonly redoLabel: string | null;
}
export function createEditHistory(options?: { limit?: number; onChange?: (state: { canUndo: boolean; canRedo: boolean }) => void }): EditHistory;
