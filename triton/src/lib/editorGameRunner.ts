export const PROJECT_SCHEMA_VERSION = 1
export const PROJECT_DATA_VERSION = "1.0.0"
export const SCENE_SCHEMA_VERSION = 1
export const SCENE_DATA_VERSION = "1.0.0"
export const RESOURCE_REFERENCE_ERROR_CODE = "RESOURCE_REFERENCE_INVALID"

export interface EditorDiagnostic {
    code: string
    severity: "error" | "warning" | "info"
    message: string
    source?: string
    action: string
}

export interface ScenePayload {
    type: "scene"
    version: string
    schemaVersion: number
    [key: string]: unknown
}

export interface ProjectPayload {
    type: "project"
    version: string
    schemaVersion: number
    scenes: ScenePayload[]
    [key: string]: unknown
}

export type ProjectFileReader = (path: string) => Promise<string | null>
export type ProjectFileWriter = (path: string, content: string) => Promise<boolean>

export interface SceneEntityMutation {
    id: string
    name: string
    type: string
    components?: Array<Record<string, unknown>>
    transform?: Record<string, unknown>
    active?: boolean
}

interface ResourceValidationIssue {
    kind: string
    reference: unknown
    source: string
    reason: string
}

const isRecord = (value: unknown): value is Record<string, any> => (
    value !== null && typeof value === "object" && !Array.isArray(value)
)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const normalizeProjectMapPath = (source: unknown): string | null => {
    if (typeof source !== "string") return null
    const path = source.trim().replace(/\\/g, "/").replace(/^\.\//, "")
    if (!path || path.startsWith("/") || path.split("/").some(part => part === "..") || !/\.map$/i.test(path)) return null
    return path
}

const majorVersion = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isInteger(value) ? value : null
    if (typeof value !== "string") return null
    const parsed = Number.parseInt(value.split(".")[0], 10)
    return Number.isInteger(parsed) ? parsed : null
}

const displayReference = (value: unknown): string => {
    if (value === undefined || value === null) return "<missing>"
    if (typeof value === "string") return value.trim() || "<empty>"
    if (isRecord(value)) {
        for (const key of ["id", "path", "uri", "key", "ref"]) {
            if (typeof value[key] === "string" && value[key].trim()) return value[key]
        }
    }
    return "<malformed>"
}

const resourceIssue = (kind: string, reference: unknown, source: string, reason: string): ResourceValidationIssue => ({ kind, reference, source, reason })

const checkReference = (value: unknown, kind: string, source: string, issues: ResourceValidationIssue[]) => {
    if (typeof value === "string" && value.trim()) return
    if (isRecord(value)) {
        const target = ["path", "uri", "id", "key", "ref"].find(key => typeof value[key] === "string" && value[key].trim())
        if (target) return
    }
    issues.push(resourceIssue(kind, value, source, "reference is missing or empty"))
}

const validateComponent = (component: unknown, source: string, issues: ResourceValidationIssue[]) => {
    if (!isRecord(component) || typeof component.type !== "string") return
    const type = component.type.toLowerCase()
    const props = component.props
    if (!isRecord(props)) {
        if (["sprite", "sound", "soundpool", "audio", "tilemap", "animator", "animation"].includes(type)) {
            issues.push(resourceIssue(type, props, `${source}.props`, "component properties are missing"))
        }
        return
    }
    if (type === "sprite") checkReference(props.path ?? props.texture ?? props.asset ?? props.reference, "sprite", `${source}.props.path`, issues)
    if (["sound", "soundpool", "audio"].includes(type)) checkReference(props.src ?? props.path ?? props.audio ?? props.asset ?? props.reference, "audio", `${source}.props.src`, issues)
    if (type === "tilemap") checkReference(props.tileset ?? props.tilesetRef ?? props.asset, "tileset", `${source}.props.tileset`, issues)
    if (type === "animation") checkReference(props.path ?? props.animation ?? props.asset ?? props.reference, "animation", `${source}.props.animation`, issues)
    if (type === "animator") {
        const animations = props.animations
        if (Array.isArray(animations)) animations.forEach((animation, index) => checkReference(animation, "animation", `${source}.props.animations[${index}]`, issues))
        else if (animations !== undefined) checkReference(animations, "animation", `${source}.props.animations`, issues)
        if (props.currentAnimation !== undefined) checkReference(props.currentAnimation, "animation", `${source}.props.currentAnimation`, issues)
    }
}

const validateEntity = (entity: unknown, source: string, issues: ResourceValidationIssue[]) => {
    if (!isRecord(entity)) return
    if (entity.prefab !== undefined) checkReference(entity.prefab, "prefab", `${source}.prefab`, issues)
    if (entity.prefabRef !== undefined) checkReference(entity.prefabRef, "prefab", `${source}.prefabRef`, issues)
    if (Array.isArray(entity.components)) entity.components.forEach((component, index) => validateComponent(component, `${source}.components[${index}]`, issues))
    if (Array.isArray(entity.children)) entity.children.forEach((child, index) => validateEntity(child, `${source}.children[${index}]`, issues))
}

const collectResourceIssues = (scene: Record<string, any>): ResourceValidationIssue[] => {
    const issues: ResourceValidationIssue[] = []
    if (Array.isArray(scene.layers)) scene.layers.forEach((layer: unknown, index: number) => {
        if (!isRecord(layer)) return
        const source = `scene.layers[${index}]`
        if (layer.type === "tilemap") checkReference(layer.src, "tilemap", `${source}.src`, issues)
        if (layer.prefab !== undefined) checkReference(layer.prefab, "prefab", `${source}.prefab`, issues)
        if (Array.isArray(layer.entities)) layer.entities.forEach((entity, entityIndex) => validateEntity(entity, `${source}.entities[${entityIndex}]`, issues))
    })
    if (Array.isArray(scene.entities)) scene.entities.forEach((entity, index) => validateEntity(entity, `scene.entities[${index}]`, issues))
    if (scene.prefab !== undefined) checkReference(scene.prefab, "prefab", "scene.prefab", issues)
    if (Array.isArray(scene.prefabs)) scene.prefabs.forEach((prefab, index) => checkReference(prefab, "prefab", `scene.prefabs[${index}]`, issues))
    return issues
}

const assertVersion = (value: unknown, kind: "project" | "scene") => {
    if (!isRecord(value)) throw new Error(`${kind === "project" ? "Project" : "Scene"} data must be a JSON object.`)
    const sourceVersion = value.schemaVersion ?? value.version
    if (sourceVersion === undefined) return
    const expected = kind === "project" ? PROJECT_SCHEMA_VERSION : SCENE_SCHEMA_VERSION
    if (majorVersion(sourceVersion) !== expected) throw new Error(`Unsupported ${kind} schema version '${String(sourceVersion)}'. Supported version is ${expected}. Migrate the ${kind} before loading it.`)
}

const diagnosticFromError = (error: unknown): EditorDiagnostic => {
    const candidate = error as Partial<EditorDiagnostic> & { sourceLocation?: string }
    const source = candidate.source ?? candidate.sourceLocation
    return {
        code: candidate.code || "EDITOR_DATA_INVALID",
        severity: "error",
        message: error instanceof Error ? error.message : (typeof candidate.message === "string" ? candidate.message : String(error)),
        source,
        action: "Fix the reported data and reopen the scene."
    }
}

type EntityRecord = Record<string, any>

const ensureLayerIds = (scene: Record<string, any>) => {
    if (!Array.isArray(scene.layers)) return
    scene.layers.forEach((layer: unknown, index: number) => {
        if (!isRecord(layer)) return
        if (typeof layer.id !== "string" || !layer.id.trim()) layer.id = `layer-${index}`
    })
}

const sceneEntityLists = (scene: Record<string, any>): any[][] => {
    const lists: any[][] = []
    if (Array.isArray(scene.entities)) lists.push(scene.entities)
    if (Array.isArray(scene.layers)) {
        scene.layers.forEach((layer: Record<string, any>) => {
            if (Array.isArray(layer.entities)) lists.push(layer.entities)
        })
    }
    return lists
}

const ensureEntityIds = (scene: Record<string, any>) => {
    const lists = sceneEntityLists(scene)
    const usedIds = new Set<string>()
    const reserve = (entities: unknown[]) => entities.forEach(entity => {
        if (!isRecord(entity)) return
        if (typeof entity.id === "string" && entity.id.trim()) {
            if (usedIds.has(entity.id)) {
                throw new Error(`Duplicate scene entity ID '${entity.id}'. Entity IDs must be unique across the scene.`)
            }
            usedIds.add(entity.id)
        }
        if (Array.isArray(entity.children)) reserve(entity.children)
    })
    lists.forEach(reserve)

    let nextId = 0
    const assign = (entities: unknown[]) => entities.forEach(entity => {
        if (!isRecord(entity)) return
        if (typeof entity.id !== "string" || !entity.id.trim()) {
            let id = ""
            do {
                id = `entity-${nextId++}`
            } while (usedIds.has(id))
            entity.id = id
            usedIds.add(id)
        }
        if (Array.isArray(entity.children)) assign(entity.children)
    })
    lists.forEach(assign)
}

const collectSceneIds = (scene: Record<string, any>) => {
    const entityIds = new Set<string>()
    const componentIds = new Set<string>()
    const collect = (entities: unknown[]) => {
        entities.forEach(entity => {
            if (!isRecord(entity)) return
            if (typeof entity.id === "string") entityIds.add(entity.id)
            if (Array.isArray(entity.components)) {
                entity.components.forEach(component => {
                    if (isRecord(component) && typeof component.id === "string") componentIds.add(component.id)
                })
            }
            if (Array.isArray(entity.children)) collect(entity.children)
        })
    }
    sceneEntityLists(scene).forEach(entities => collect(entities))
    return { entityIds, componentIds }
}

const createStableId = (prefix: string, usedIds: Set<string>) => {
    let id = ""
    do {
        const randomId = globalThis.crypto?.randomUUID?.()
        id = `${prefix}-${randomId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`
    } while (usedIds.has(id))
    usedIds.add(id)
    return id
}

const cloneEntityWithFreshIds = (source: EntityRecord, entityIds: Set<string>, componentIds: Set<string>, parentId?: string): EntityRecord => {
    const duplicate = clone(source)
    duplicate.id = createStableId("entity", entityIds)
    if (parentId !== undefined && Object.prototype.hasOwnProperty.call(source, "parentId")) {
        duplicate.parentId = parentId === "root" ? null : parentId
    }
    if (Array.isArray(duplicate.components)) {
        duplicate.components = duplicate.components.map((component: unknown) => {
            if (!isRecord(component)) return component
            const duplicateComponent = clone(component)
            duplicateComponent.id = createStableId("component", componentIds)
            return duplicateComponent
        })
    }
    if (Array.isArray(duplicate.children)) {
        duplicate.children = duplicate.children.map((child: unknown) => (
            isRecord(child) ? cloneEntityWithFreshIds(child, entityIds, componentIds, duplicate.id) : child
        ))
    }
    return duplicate
}

const findEntityContainer = (entities: unknown[], id: string): { entity: EntityRecord, list: any[], index: number } | null => {
    for (let index = 0; index < entities.length; index += 1) {
        const entity = entities[index]
        if (!isRecord(entity)) continue
        if (entity.id === id) return { entity, list: entities as any[], index }
        if (Array.isArray(entity.children)) {
            const nested = findEntityContainer(entity.children, id)
            if (nested) return nested
        }
    }
    return null
}

const findEntity = (scene: Record<string, any>, id: string): EntityRecord | null => {
    for (const list of sceneEntityLists(scene)) {
        const match = findEntityContainer(list, id)
        if (match) return match.entity
    }
    return null
}

const findParentContainer = (scene: Record<string, any>, id: string): any[] | null => {
    if (id === "root") {
        if (!Array.isArray(scene.entities)) scene.entities = []
        return scene.entities
    }

    const entity = findEntity(scene, id)
    if (entity) {
        if (!Array.isArray(entity.children)) entity.children = []
        return entity.children
    }

    // Layer IDs are valid hierarchy parents even though layers are not entities.
    const layer = Array.isArray(scene.layers)
        ? scene.layers.find((candidate: unknown) => isRecord(candidate) && candidate.id === id)
        : null
    if (isRecord(layer)) {
        if (!Array.isArray(layer.entities)) layer.entities = []
        return layer.entities
    }
    return null
}

const containsEntity = (entity: EntityRecord, id: string): boolean => (
    entity.id === id || (Array.isArray(entity.children) && entity.children.some((child: unknown) => isRecord(child) && containsEntity(child, id)))
)

const emit = (name: string, detail: unknown) => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(name, { detail }))
}

/** M03 project/scene boundary used by Triton. Native file APIs remain the production I/O host. */
export class EditorGameRunner {
    static isPlaying = false
    static currentProject: ProjectPayload | null = null
    static currentScene: ScenePayload | null = null
    static currentScenePath: string | null = null
    static isDirty = false

    static async start() {
        if (this.isPlaying) return
        this.isPlaying = true
        emit("editor:play", undefined)
    }

    static stop() {
        if (!this.isPlaying) return
        this.isPlaying = false
        emit("editor:stop", undefined)
    }

    static toDiagnostic(error: unknown): EditorDiagnostic { return diagnosticFromError(error) }

    static validateScene(data: unknown): ScenePayload {
        assertVersion(data, "scene")
        if (!isRecord(data)) throw new Error("Scene data must be a JSON object.")
        if (data.entities !== undefined && !Array.isArray(data.entities)) {
            throw new Error("Scene entities must be an array supported by the runtime SceneLoader.")
        }
        const issue = collectResourceIssues(data)[0]
        if (issue) {
            const error = new Error(`[${RESOURCE_REFERENCE_ERROR_CODE}] Invalid ${issue.kind} resource reference '${displayReference(issue.reference)}' at ${issue.source}: ${issue.reason}. Expected a non-empty path, id, uri, or key.`)
            Object.assign(error, { code: RESOURCE_REFERENCE_ERROR_CODE, source: issue.source, sourceLocation: issue.source })
            throw error
        }
        const normalized = { ...clone(data), type: "scene" as const, version: SCENE_DATA_VERSION, schemaVersion: SCENE_SCHEMA_VERSION }
        ensureLayerIds(normalized)
        ensureEntityIds(normalized)
        return normalized
    }

    static normalizeProject(data: unknown): ProjectPayload {
        assertVersion(data, "project")
        if (!isRecord(data)) throw new Error("Project data must be a JSON object.")
        const scenes = Array.isArray(data.scenes) ? data.scenes.map(scene => this.validateScene(scene)) : []
        return { ...clone(data), type: "project", version: PROJECT_DATA_VERSION, schemaVersion: PROJECT_SCHEMA_VERSION, scenes }
    }

    static openProject(data: unknown, path?: string): ProjectPayload {
        try {
            const project = this.normalizeProject(data)
            this.currentProject = project
            emit("editor:project-opened", { path, project })
            return project
        } catch (error) {
            this.report(error)
            throw error
        }
    }

    static async loadProject(readFile: ProjectFileReader, path = "project.npt") {
        const content = await readFile(path)
        if (!content) throw new Error(`Project file '${path}' is empty or unavailable.`)
        return this.openProject(JSON.parse(content), path)
    }

    static openScene(data: unknown, path?: string): ScenePayload {
        try {
            const scene = this.validateScene(data)
            this.currentScene = scene
            this.currentScenePath = path ?? this.currentScenePath
            this.isDirty = false
            emit("editor:scene-opened", { path: this.currentScenePath, scene })
            return scene
        } catch (error) {
            this.report(error)
            throw error
        }
    }

    static async reopenScene(readFile: ProjectFileReader, path: string) {
        const content = await readFile(path)
        if (!content) throw new Error(`Scene file '${path}' is empty or unavailable.`)
        return this.openScene(JSON.parse(content), path)
    }

    /**
     * Resolve a hierarchy ID from Triton's projected entity map to the ID used
     * by the canonical scene. GameContext projects layers with generated UI
     * IDs, so layer order is the stable bridge until that projection is moved
     * to the persisted ID.
     */
    static resolveHierarchyParentId(parentId: string, hierarchy: Record<string, any> = {}) {
        if (!this.currentScene) return null
        const scene = this.currentScene as Record<string, any>
        if (parentId === "root" || findEntity(scene, parentId) || (Array.isArray(scene.layers) && scene.layers.some((layer: unknown) => isRecord(layer) && layer.id === parentId))) {
            return parentId
        }

        if (!Array.isArray(scene.layers)) return null
        const rootChildren = Array.isArray(hierarchy.root?.children) ? hierarchy.root.children : []
        const projectedLayerIds = rootChildren.filter((id: unknown) => {
            const entity = typeof id === "string" ? hierarchy[id] : null
            return entity && entity.type !== "camera"
        })
        const projectedIndex = projectedLayerIds.indexOf(parentId)
        if (projectedIndex === -1) return null

        const layer = scene.layers[projectedIndex]
        return isRecord(layer) && typeof layer.id === "string" && layer.id.trim() ? layer.id : null
    }

    /** Attach an existing project map to the scene as a runtime tilemap layer. */
    static createTilemapLayer(source: string) {
        if (!this.currentScene) return null
        const path = normalizeProjectMapPath(source)
        if (!path) return null

        const scene = this.currentScene as Record<string, any>
        if (!Array.isArray(scene.layers)) scene.layers = []
        const layerIds = new Set(scene.layers.map((layer: unknown) => isRecord(layer) ? layer.id : null))
        const entityIds = new Set(sceneEntityLists(scene).flatMap(entities => entities.map((entity: unknown) => isRecord(entity) ? entity.id : null)))
        let id = ""
        do {
            id = `tilemap-${Math.random().toString(36).slice(2, 11)}`
        } while (layerIds.has(id) || entityIds.has(id))

        const name = path.split("/").pop()!.replace(/\.map$/i, "") || "Tilemap"
        const layer = { id, name, type: "tilemap" as const, src: path }
        scene.layers.push(layer)
        this.isDirty = true
        return clone(layer)
    }

    /** Mutate the canonical scene document before the game iframe is notified. */
    static createEntity(parentId: string, mutation: SceneEntityMutation) {
        if (!this.currentScene || !mutation.id) return false
        const scene = this.currentScene as Record<string, any>
        const parentChildren = findParentContainer(scene, parentId)
        if (!parentChildren || findEntity(scene, mutation.id)) return false

        parentChildren.push({
            id: mutation.id,
            name: mutation.name,
            type: mutation.type,
            active: mutation.active ?? true,
            transform: mutation.transform ?? { pos: { x: 0, y: 0 }, rot: 0, scale: { x: 1, y: 1 } },
            components: mutation.components ? clone(mutation.components) : [],
            children: []
        })
        this.isDirty = true
        return true
    }

    /** Duplicate an entity as a sibling in the canonical scene document. */
    static duplicateEntity(id: string) {
        if (!this.currentScene || typeof id !== "string" || !id.trim()) return null
        const scene = this.currentScene as Record<string, any>
        const source = sceneEntityLists(scene)
            .map(entities => findEntityContainer(entities, id))
            .find((match): match is { entity: EntityRecord, list: any[], index: number } => match !== null)
        if (!source) return null

        const { entityIds, componentIds } = collectSceneIds(scene)
        const duplicate = cloneEntityWithFreshIds(source.entity, entityIds, componentIds, source.entity.parentId)
        source.list.splice(source.index + 1, 0, duplicate)
        this.isDirty = true
        return duplicate
    }

    /** Reparent hierarchy entities in the canonical nested scene document. */
    static resolveHierarchyDropIndex(children: string[], draggedIds: string[], position: 'before' | 'after', relativeToId: string) {
        const index = children.indexOf(relativeToId)
        if (index < 0 || draggedIds.includes(relativeToId)) return null
        const insertionPoint = position === 'before' ? index : index + 1
        return insertionPoint - children.slice(0, insertionPoint).filter(id => draggedIds.includes(id)).length
    }

    static moveEntities(ids: string[], targetParentId: string, targetIndex?: number) {
        if (!this.currentScene) return false
        if (!Array.isArray(ids) || ids.length === 0 || ids.some(id => typeof id !== "string" || !id.trim()) || new Set(ids).size !== ids.length) return false
        const scene = this.currentScene as Record<string, any>
        const targetChildren = findParentContainer(scene, targetParentId)
        if (!targetChildren) return false

        const records = ids
            .map(id => {
                for (const list of sceneEntityLists(scene)) {
                    const match = findEntityContainer(list, id)
                    if (match) return match
                }
                return null
            })
            .filter((record): record is { entity: EntityRecord, list: any[], index: number } => record !== null)
        if (records.length !== ids.length) return false

        const moving = records.filter(record => !records.some(other => other !== record && containsEntity(other.entity, record.entity.id)))
        if (moving.length === 0 || moving.some(record => containsEntity(record.entity, targetParentId))) return false

        // Remove from old parents first. Sort descending per list so indexes remain valid.
        const byList = new Map<any[], typeof moving>()
        moving.forEach(record => {
            const group = byList.get(record.list) || []
            group.push(record)
            byList.set(record.list, group)
        })
        byList.forEach((group, list) => {
            group.sort((a, b) => b.index - a.index).forEach(record => list.splice(record.index, 1))
        })

        const movedEntities = moving.map(record => record.entity)
        const insertionIndex = typeof targetIndex === "number"
            ? Math.max(0, Math.min(targetIndex, targetChildren.length))
            : targetChildren.length
        movedEntities.forEach(entity => { entity.parentId = targetParentId === "root" ? null : targetParentId })
        targetChildren.splice(insertionIndex, 0, ...movedEntities)
        this.isDirty = true
        return true
    }

    static deleteEntity(id: string) {
        if (!this.currentScene) return false
        const removeFrom = (entities: unknown[]): boolean => {
            const index = entities.findIndex(entity => isRecord(entity) && entity.id === id)
            if (index !== -1) {
                entities.splice(index, 1)
                return true
            }
            return entities.some(entity => isRecord(entity) && Array.isArray(entity.children) && removeFrom(entity.children))
        }
        const scene = this.currentScene as Record<string, any>
        const changed = sceneEntityLists(scene).some((entities: unknown[]) => removeFrom(entities))
        if (changed) this.isDirty = true
        return changed
    }

    static updateEntity(id: string, component: string, data: Record<string, unknown>) {
        if (!this.currentScene) return false
        const update = (entity: Record<string, any>): boolean => {
            if (entity.id === id) {
                if (component.toLowerCase() === "name") entity.name = data.value
                else if (component.toLowerCase() === "active") entity.active = data.value
                else if (component.toLowerCase() === "transform") {
                    const transformData = { ...data }
                    if ("position" in transformData) transformData.pos = transformData.position
                    if ("rotation" in transformData) transformData.rot = transformData.rotation
                    delete transformData.position
                    delete transformData.rotation
                    entity.transform = { ...(entity.transform || {}), ...transformData }
                }
                else {
                    const target = Array.isArray(entity.components) ? entity.components.find((item: any) => item?.type?.toLowerCase() === component.toLowerCase()) : undefined
                    if (!target) return false
                    target.props = { ...(target.props || {}), ...data }
                }
                return true
            }
            return Array.isArray(entity.children) && entity.children.some((child: unknown) => isRecord(child) && update(child))
        }
        const scene = this.currentScene as Record<string, any>
        let changed = sceneEntityLists(scene).some((entities: unknown[]) => entities.some((entity: unknown) => isRecord(entity) && update(entity)))
        if (!changed && Array.isArray(scene.layers)) {
            const layer = scene.layers.find((item: unknown) => isRecord(item) && item.id === id)
            if (isRecord(layer)) {
                const field = component.toLowerCase()
                if (field === "name" && typeof data.value === "string" && data.value.trim()) {
                    layer.name = data.value
                    changed = true
                } else if (field === "tilemap" && Object.prototype.hasOwnProperty.call(data, "src")) {
                    const path = normalizeProjectMapPath(data.src)
                    if (!path) return false
                    layer.src = path
                    changed = true
                }
            }
        }
        if (changed) this.isDirty = true
        return changed
    }

    static async saveScene(writeFile: ProjectFileWriter, path = this.currentScenePath) {
        if (!this.currentScene || !path) throw new Error("No scene is open. Open a scene before saving it.")
        const source = this.currentScene
        const original = JSON.stringify(source)
        const scene = this.validateScene(source)
        const content = JSON.stringify(scene, null, 2)
        // The native write may finish after another edit (or even another scene open).
        if (!await writeFile(path, content)) throw new Error(`The native file host could not save '${path}'.`)
        if (this.currentScene === source && this.currentScenePath === path &&
            JSON.stringify(source) === original) {
            this.currentScene = scene
            this.isDirty = false
        }
        emit("editor:scene-saved", { path, scene })
        return scene
    }

    static closeScene() {
        const closedPath = this.currentScenePath
        this.currentScene = null
        this.currentScenePath = null
        this.isDirty = false
        emit("editor:scene-closed", { path: closedPath })
    }

    static report(error: unknown) {
        const diagnostic = diagnosticFromError(error)
        emit("editor:diagnostic", diagnostic)
        return diagnostic
    }
}
