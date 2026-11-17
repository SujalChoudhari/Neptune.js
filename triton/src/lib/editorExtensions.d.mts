export const EDITOR_EXTENSION_API_VERSION: 1;
export const PROJECT_EDITOR_EXTENSIONS_VERSION: 1;
export type EditorExtension = {
    id: string;
    apiVersion: number;
    activate(api: any): void;
    deactivate?(api: any): void;
};
export type ExtensionHostOptions = {
    projectId?: string | null;
    sceneId?: string | null;
    getSelection?: () => string[];
    setSelection?: (ids: string[]) => void;
    queryEntity?: (id: string) => any;
    queryEntities?: (filter?: any) => any[];
    worldToScreen?: (point: { x: number; y: number }) => { x: number; y: number } | null;
    screenToWorld?: (point: { x: number; y: number }) => { x: number; y: number } | null;
    commands?: {
        updateComponent?: (entityId: string, component: string, patch: Record<string, unknown>) => unknown;
        runSceneEdit?: (label: string, apply: () => void, revert: () => void) => unknown;
        beginSceneEdit?: (label: string) => { commit(): void; cancel(): void };
    };
    onDiagnostic?: (diagnostic: { extensionId: string; phase: string; message: string; severity: "error" }) => void;
    onChange?: () => void;
};
export function createEditorExtensionHost(options?: ExtensionHostOptions): {
    apiVersion: 1;
    diagnostics: Array<{ extensionId: string; phase: string; message: string; severity: string }>;
    enable(extension: EditorExtension): () => void;
    disable(id: string): boolean;
    reload(id: string): boolean;
    switchScene(id: string | null): void;
    switchProject(id: string | null): void;
    registrations(kind: string): Array<{ extensionId: string; id: string; value: any }>;
    drawings(): any[];
    overlayObjects(): any[];
    dispose(): void;
};
export function loadProjectEditorExtensions(project: any, options: {
    readEntry: (path: string) => Promise<string>;
    importSource: (source: string, path: string) => Promise<any>;
    report?: (diagnostic: any) => void;
}): Promise<EditorExtension[]>;
