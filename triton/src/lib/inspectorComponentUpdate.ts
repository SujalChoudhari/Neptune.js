interface InspectorComponentUpdate {
    id: string
    component: string
    key: string
    value: unknown
    updateComponent: (id: string, component: string, key: string, value: unknown) => void
    editorGameRunner: {
        currentScene: unknown
        updateEntity: (id: string, component: string, data: Record<string, unknown>) => boolean
    }
    currentScenePath: string | null
    notifyGame: (type: string, payload?: unknown) => void
}

export const applyInspectorComponentUpdate = ({
    id,
    component,
    key,
    value,
    updateComponent,
    editorGameRunner,
    currentScenePath,
    notifyGame
}: InspectorComponentUpdate) => {
    updateComponent(id, component, key, value)
    const changed = editorGameRunner.updateEntity(id, component, { [key]: value })
    if (changed && component.toLowerCase() === 'tilemap' && currentScenePath) {
        notifyGame('editor:load-scene', {
            path: currentScenePath,
            data: editorGameRunner.currentScene
        })
    }
    return changed
}
