import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { useGameContext } from '@/context/GameContext';
import { useEditorExtensions } from '@/lib/useEditorExtensions';
import { queryDocumentEntity } from '@/lib/useEditorExtensions';
import { EditorGameRunner } from '@/lib/editorGameRunner';
import { EditorOverlay } from './EditorOverlay';

type Point = { x: number; y: number };
type Props = { worldToScreen: (point: Point) => Point; screenToWorld: (point: Point) => Point };
type Resize = { tool: any; drag: any; start: Point; size: Point; pointerId: number };

/** Runtime-independent extension overlays and the v1 area-tool interaction host. */
export function ProjectExtensionLayer({ worldToScreen, screenToWorld }: Props) {
    const layer = useRef<HTMLDivElement>(null);
    const resizing = useRef<Resize | null>(null);
    const { selectedIds, entities, selectedEntitiesData, isPlaying } = useGameContext();
    const extensions = useEditorExtensions({ worldToScreen, screenToWorld });
    const host = extensions.host;
    const cancel = () => {
        const current = resizing.current;
        resizing.current = null;
        if (current) {
            try { current.tool.cancel(current.drag); } catch (error) { EditorGameRunner.report(error); }
            extensions.refresh();
        }
    };
    const callbacks = useRef({ cancel, screenToWorld });
    callbacks.current = { cancel, screenToWorld };
    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && resizing.current) { event.preventDefault(); callbacks.current.cancel(); }
        };
        window.addEventListener('keydown', escape);
        return () => { window.removeEventListener('keydown', escape); callbacks.current.cancel(); };
    }, [host]);
    useEffect(() => { if (isPlaying) callbacks.current.cancel(); }, [isPlaying]);
    useEffect(() => {
        if (!host || isPlaying) return;
        const hitTest = (event: globalThis.PointerEvent) => {
            if (event.button !== 0 || !layer.current || !(event.target instanceof Node)
                || !layer.current.parentElement?.contains(event.target)) return;
            const bounds = layer.current.getBoundingClientRect();
            const screen = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
            if (screen.x < 0 || screen.y < 0 || screen.x > bounds.width || screen.y > bounds.height) return;
            const world = callbacks.current.screenToWorld(screen);
            for (const registration of host.registrations('hit-test').reverse()) {
                try {
                    if (!registration.value.test(world)) continue;
                    event.preventDefault(); event.stopPropagation();
                    registration.value.onPointer({ type: 'pointerdown', world, screen, originalEvent: event });
                    return;
                } catch (error) { EditorGameRunner.report(error); }
            }
        };
        window.addEventListener('pointerdown', hitTest, true);
        return () => window.removeEventListener('pointerdown', hitTest, true);
    }, [host, isPlaying]);

    const pointerPosition = (event: PointerEvent) => {
        const bounds = layer.current!.getBoundingClientRect();
        return screenToWorld({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    };
    const id = selectedIds.length === 1 ? selectedIds[0] : null;
    const entity = id ? queryDocumentEntity(id, entities[id]?.parentId) : null;
    // The v1 example defines an axis-aligned world area, so nested objects retain
    // the built-in composed-transform tools instead of getting a misleading handle.
    const tools = id && entity && entities[id]?.parentId === 'root' && !entities[id]?.locked && !isPlaying
        ? extensions.registrations('tool').filter(registration => typeof registration.value?.getArea === 'function'
            && typeof registration.value?.beginResize === 'function' && typeof registration.value?.resize === 'function') : [];
    // Read the selected data so live edits redraw even when only component size changes.
    void selectedEntitiesData;
    return <div ref={layer} data-project-extension-layer className="absolute inset-0 pointer-events-none z-30">
        <EditorOverlay drawings={extensions.drawings()} objects={extensions.overlayObjects()} worldToScreen={worldToScreen} />
        {tools.map(registration => {
            const tool = registration.value;
            let area: { x: number; y: number; width: number; height: number } | null;
            try { area = tool.getArea(id); } catch { return null; }
            if (!area || ![area.x, area.y, area.width, area.height].every(Number.isFinite) || area.width <= 0 || area.height <= 0) return null;
            const corner = worldToScreen({ x: area.x + area.width, y: area.y + area.height });
            const origin = worldToScreen(area);
            return <div key={`${registration.extensionId}:${registration.id}`}>
                <div aria-hidden className="absolute border border-dashed border-teal-300/80" style={{ left: origin.x, top: origin.y, width: corner.x - origin.x, height: corner.y - origin.y }} />
                <button type="button" aria-label={`Resize ${String(tool.component || 'component')} extension area`} title="Resize component area · Escape cancels" className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-teal-100 bg-teal-600 shadow cursor-nwse-resize pointer-events-auto" style={{ left: corner.x, top: corner.y }}
                    onPointerDown={event => {
                        if (event.button !== 0 || !area) return;
                        event.preventDefault(); event.stopPropagation();
                        try {
                            const drag = tool.beginResize(id);
                            if (!drag) return;
                            resizing.current = { tool, drag, start: pointerPosition(event), size: { x: area.width, y: area.height }, pointerId: event.pointerId };
                            event.currentTarget.setPointerCapture(event.pointerId);
                        } catch (error) { EditorGameRunner.report(error); }
                    }}
                    onPointerMove={event => {
                        const current = resizing.current;
                        if (!current || current.pointerId !== event.pointerId) return;
                        event.stopPropagation();
                        const next = pointerPosition(event);
                        try {
                            current.tool.resize(current.drag, { x: Math.max(0.05, current.size.x + 2 * (next.x - current.start.x)), y: Math.max(0.05, current.size.y + 2 * (next.y - current.start.y)) });
                            extensions.refresh();
                        } catch (error) { cancel(); EditorGameRunner.report(error); }
                    }}
                    onPointerUp={event => {
                        const current = resizing.current;
                        if (!current || current.pointerId !== event.pointerId) return;
                        event.preventDefault(); event.stopPropagation();
                        resizing.current = null;
                        try { current.tool.commit(current.drag); } catch (error) { EditorGameRunner.report(error); }
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                        extensions.refresh();
                    }}
                    onPointerCancel={cancel}
                    onLostPointerCapture={() => { if (resizing.current) cancel(); }}
                    onClick={event => { event.preventDefault(); event.stopPropagation(); }} />
            </div>;
        })}
        {host && extensions.registrations('tool').length > 0 && <button type="button" onClick={extensions.reload} className="absolute bottom-2 right-2 pointer-events-auto rounded border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground shadow" title="Reload enabled editor extensions">Reload tools</button>}
    </div>;
}
