import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { clampSceneMenuPosition } from "@/lib/sceneContextMenu.mjs"
import { useEditorExtensionRegistrations } from '@/lib/editorExtensionStore'
import { queryDocumentEntity } from '@/lib/useEditorExtensions'
import { EditorGameRunner } from '@/lib/editorGameRunner'

export type SceneContextAction = "select" | "frame" | "rename" | "duplicate" | "delete" | "toggle-active" | "toggle-lock" | "create-empty"
export interface SceneContextMenuRequest {
    x: number
    y: number
    targetId: string | null
    selectedIds: string[]
}

export { clampSceneMenuPosition }

interface SceneContextMenuProps {
    request: SceneContextMenuRequest | null
    targetName?: string
    isActive?: boolean
    isLocked?: boolean
    onAction: (action: SceneContextAction, request: SceneContextMenuRequest) => void
    onClose: () => void
}

/** Shared compact context menu for the hierarchy and Scene View. */
export function SceneContextMenu({ request, targetName, isActive = true, isLocked = false, onAction, onClose }: SceneContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const { actions } = useEditorExtensionRegistrations()
    const [position, setPosition] = useState({ x: 0, y: 0 })

    useLayoutEffect(() => {
        if (!request || !menuRef.current) return
        const rect = menuRef.current.getBoundingClientRect()
        setPosition(clampSceneMenuPosition(request.x, request.y, rect.width, rect.height, window.innerWidth, window.innerHeight))
    }, [request])

    useEffect(() => {
        if (!request) return
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") { event.preventDefault(); onClose() }
        }
        const outside = (event: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose()
        }
        window.addEventListener("keydown", escape)
        window.addEventListener("pointerdown", outside)
        return () => { window.removeEventListener("keydown", escape); window.removeEventListener("pointerdown", outside) }
    }, [request, onClose])

    useEffect(() => { if (request) menuRef.current?.focus() }, [request])
    if (!request) return null
    const extensionEntity = request.targetId ? queryDocumentEntity(request.targetId) : null
    const extensionActions = actions.filter(action => {
        try { return extensionEntity && typeof action.value?.run === 'function' && (typeof action.value.when !== 'function' || action.value.when(extensionEntity)) }
        catch { return false }
    })

    const items: Array<{ action: SceneContextAction; label: string; disabled?: boolean; danger?: boolean }> = request.targetId
        ? [
            { action: "select", label: request.selectedIds.includes(request.targetId) && request.selectedIds.length > 1 ? `Select Group (${request.selectedIds.length})` : "Select", disabled: isLocked },
            { action: "frame", label: "Frame Selection", disabled: isLocked },
            { action: "rename", label: "Rename", disabled: isLocked || request.selectedIds.length > 1 },
            { action: "duplicate", label: "Duplicate", disabled: isLocked },
            { action: "delete", label: "Delete", danger: true, disabled: isLocked },
            { action: "toggle-active", label: isActive ? "Disable" : "Enable", disabled: isLocked },
            { action: "toggle-lock", label: isLocked ? "Unlock Selection" : "Lock Selection" }
        ]
        : [{ action: "create-empty", label: "Create Empty" }]

    return <div
        ref={menuRef}
        role="menu"
        aria-label={request.targetId ? `${targetName || "Object"} actions` : "Scene actions"}
        tabIndex={-1}
        className="fixed z-[1000] max-h-[calc(100vh-8px)] min-w-44 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-[5px_5px_12px_rgba(0,0,0,.45),-3px_-3px_8px_rgba(255,255,255,.04)] outline-none"
        style={{ left: position.x, top: position.y }}
        onContextMenu={event => event.preventDefault()}
        onKeyDown={event => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
            const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") || [])
            const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
            const direction = event.key === "ArrowDown" ? 1 : -1
            buttons[(index + direction + buttons.length) % buttons.length]?.focus()
            event.preventDefault()
        }}
    >
        {request.targetId && <div className="truncate px-2 py-1 text-[10px] font-semibold text-muted-foreground" title={targetName}>{targetName || "Object"}</div>}
        {items.map((item, index) => <div key={item.action}>
            {(index === 1 || index === 5) && <div className="my-1 h-px bg-border/70" />}
            <button type="button" role="menuitem" disabled={item.disabled} className={`flex h-7 w-full items-center rounded px-2 text-left text-xs hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none disabled:opacity-40 ${item.danger ? "text-red-400" : "text-foreground/90"}`} onClick={() => { onAction(item.action, request); onClose() }}>
                {item.label}
            </button>
        </div>)}
        {extensionActions.length > 0 && <div className="my-1 h-px bg-border/70" />}
        {extensionActions.map(action => <button key={`${action.extensionId}:${action.id}`} type="button" role="menuitem" disabled={isLocked} className="flex h-7 w-full items-center rounded px-2 text-left text-xs text-foreground/90 hover:bg-white/10 focus-visible:bg-white/10 disabled:opacity-40" onClick={() => {
            try { action.value.run(extensionEntity) } catch (failure) { EditorGameRunner.report(failure) }
            onClose()
        }}>{String(action.value.label || action.id)}</button>)}
    </div>
}
