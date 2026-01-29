import { create } from 'zustand'

// Project state
interface ProjectState {
    projectPath: string | null
    projectName: string | null
    isOpen: boolean
    isDirty: boolean
}

// Scene state
interface Entity {
    id: string
    name: string
    type: string
    transform: {
        x: number
        y: number
        rotation: number
        scale: { x: number; y: number }
    }
    components: Record<string, unknown>[]
}

interface Layer {
    id: string
    name: string
    visible: boolean
    locked: boolean
    entities: Entity[]
}

interface Scene {
    id: string
    name: string
    layers: Layer[]
}

// Editor state
interface EditorState {
    selectedEntityId: string | null
    selectedLayerId: string | null
    activeTool: string
    zoom: number
    panX: number
    panY: number
}

// Asset state
interface Asset {
    id: string
    name: string
    path: string
    type: 'image' | 'audio' | 'script' | 'data'
}

interface AssetState {
    assets: Asset[]
    selectedAssetId: string | null
}

// Preview state
type PreviewMode = 'stopped' | 'playing' | 'paused'

interface PreviewState {
    mode: PreviewMode
    fps: number
}

// Complete store state
interface StoreState {
    // Project
    project: ProjectState
    setProject: (project: Partial<ProjectState>) => void
    closeProject: () => void

    // Scene
    currentScene: Scene | null
    setCurrentScene: (scene: Scene | null) => void

    // Editor
    editor: EditorState
    setEditor: (editor: Partial<EditorState>) => void
    selectEntity: (id: string | null) => void
    selectLayer: (id: string | null) => void
    setActiveTool: (tool: string) => void

    // Assets
    assets: AssetState
    setAssets: (assets: Asset[]) => void
    selectAsset: (id: string | null) => void

    // Preview
    preview: PreviewState
    setPreviewMode: (mode: PreviewMode) => void

    // History
    canUndo: boolean
    canRedo: boolean
    undo: () => void
    redo: () => void
}

export const useStore = create<StoreState>((set) => ({
    // Project
    project: {
        projectPath: null,
        projectName: null,
        isOpen: false,
        isDirty: false,
    },
    setProject: (project) =>
        set((state) => ({
            project: { ...state.project, ...project, isOpen: true },
        })),
    closeProject: () =>
        set({
            project: {
                projectPath: null,
                projectName: null,
                isOpen: false,
                isDirty: false,
            },
            currentScene: null,
            assets: { assets: [], selectedAssetId: null },
        }),

    // Scene
    currentScene: null,
    setCurrentScene: (scene) => set({ currentScene: scene }),

    // Editor
    editor: {
        selectedEntityId: null,
        selectedLayerId: null,
        activeTool: 'select',
        zoom: 1,
        panX: 0,
        panY: 0,
    },
    setEditor: (editor) =>
        set((state) => ({
            editor: { ...state.editor, ...editor },
        })),
    selectEntity: (id) =>
        set((state) => ({
            editor: { ...state.editor, selectedEntityId: id },
        })),
    selectLayer: (id) =>
        set((state) => ({
            editor: { ...state.editor, selectedLayerId: id },
        })),
    setActiveTool: (tool) =>
        set((state) => ({
            editor: { ...state.editor, activeTool: tool },
        })),

    // Assets
    assets: {
        assets: [],
        selectedAssetId: null,
    },
    setAssets: (assets) =>
        set((state) => ({
            assets: { ...state.assets, assets },
        })),
    selectAsset: (id) =>
        set((state) => ({
            assets: { ...state.assets, selectedAssetId: id },
        })),

    // Preview
    preview: {
        mode: 'stopped',
        fps: 0,
    },
    setPreviewMode: (mode) =>
        set((state) => ({
            preview: { ...state.preview, mode },
        })),

    // History (placeholder - would integrate with actual history system)
    canUndo: false,
    canRedo: false,
    undo: () => console.log('Undo'),
    redo: () => console.log('Redo'),
}))
