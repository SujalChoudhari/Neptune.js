import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import neptuneEntryUrl from "virtual:neptune-runtime-url";
import cameraUrl from "../../../../src/thalassa/camera.js?url";
import scenePickingUrl from "@/lib/scenePicking.mjs?url";
import projectResourceBridgeUrl from "@/lib/projectResourceBridge.mjs?url";
import authoredUiUrl from "../../../../src/ui/authoredUi.js?url";
import { runtimeEntityBridgeScript } from "../../lib/runtimeEntityBridge.mjs";
import { runtimeSelectionBridgeScript, pickRuntimeEntityAt, shapeContainsPoint } from "../../lib/runtimeSelectionBridge.mjs";
import { runtimeComponentBridgeScript } from "../../lib/runtimeComponentBridge.mjs";
import { resizeColliderBounds, zoomAtPoint, getFramingCamera, getColliderOverlayBounds, getEntityWorldMatrix, getEntityWorldSelectionGeometry, worldDeltaToEntityLocal, hasCompleteGroupTransformSelection, isSceneViewBridgeMessageSource } from "@/lib/scenePicking.mjs";
import { invoke } from "@tauri-apps/api/core";
import { ThemedIconButton } from "@/components/library";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { useGameContext } from '@/context/GameContext';
import { EditorGameRunner } from '@/lib/editorGameRunner';
import { SceneToolBar } from './SceneToolBar';
import { SceneContextMenu } from './SceneContextMenu';
import type { SceneContextAction, SceneContextMenuRequest } from './SceneContextMenu';
import { sceneContextSelection } from '@/lib/sceneContextMenu.mjs';
import { ProjectExtensionLayer } from '@/components/editor/ProjectExtensionLayer';
import { getSceneToolShortcut, getSceneDragDelta, moveScenePosition, resizeSceneScale, captureTransformSnapshot, isSceneShortcutTargetBlocked } from '@/lib/sceneTools.mjs';
import type { SceneTool, TransformSnapshot } from '@/lib/sceneTools.mjs';

type GizmoOperation = 'translate' | 'translate-x' | 'translate-y' | 'rotate' | 'scale' | 'rect';

type SpawnPointFacing = 'right' | 'down' | 'left' | 'up';

// Transform/geometry values use metres; Camera positions and pan use render pixels.
// Keep conversions at the viewport boundary, matching Maths.METER_TO_PIXEL.
const pixelsPerMeter = 64;

type SpawnPointOverlayEntity = {
    transform?: { position?: { x?: number; y?: number } };
    components?: Record<string, { facing?: unknown }>;
} | null | undefined;

export function getSpawnPointOverlay(entity: SpawnPointOverlayEntity) {
    const position = entity?.transform?.position;
    const facing = entity?.components?.SpawnPoint?.facing;
    const directions: Record<SpawnPointFacing, { x: number; y: number }> = {
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        up: { x: 0, y: -1 }
    };
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number'
        || !Number.isFinite(position.x) || !Number.isFinite(position.y)
        || typeof facing !== 'string' || !Object.hasOwn(directions, facing)) return null;
    const supportedFacing = facing as SpawnPointFacing;
    return { x: position.x, y: position.y, facing: supportedFacing, direction: directions[supportedFacing] };
}

export function SceneViewPanel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [tool, setTool] = useState<SceneTool>('move');
    const [snapEnabled, setSnapEnabled] = useState(false);
    const [snapStep, setSnapStep] = useState(0.25);
    const [isTransformDragging, setIsTransformDragging] = useState(false);
    const [contextMenu, setContextMenu] = useState<SceneContextMenuRequest | null>(null);
    const pendingContextRef = useRef<{ x: number; y: number } | null>(null);
    const { notifyGame, updateComponent, beginSceneEdit, selectEntities, addEntityToHierarchy,
        duplicateEntityInHierarchy, deleteEntitiesInHierarchy,
        setEntityActiveInHierarchy, setEntityLocked, selectedEntityData, selectedEntitiesData,
        selectedIds, entities, canUndo, canRedo, undoSceneEdit, redoSceneEdit } = useGameContext();
    const [uiCapture, setUiCapture] = useState(false);
    const [gizmoPosition, setGizmoPosition] = useState<{ x: number; y: number } | null>(null);
    const gizmoDragRef = useRef<{
        operation: GizmoOperation;
        snapshot: TransformSnapshot;
        transaction: { commit(): boolean; cancel(): boolean };
        size: { width: number; height: number };
        id: string;
        ids: string[];
        startPositions: Record<string, { x: number; y: number }>;
        startX: number;
        startY: number;
        position: { x: number; y: number };
        rotation: number;
        scale: { x: number; y: number };
    } | null>(null);
    const colliderResizeDragRef = useRef<{
        id: string;
        type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider';
        startX: number;
        startY: number;
        width: number;
        height: number;
        transaction: { commit(): boolean; cancel(): boolean };
    } | null>(null);
    const suppressClickRef = useRef(false);
    const selectionOverlays = useMemo(() => selectedIds
        .map(id => getEntityWorldSelectionGeometry(id, entities, selectedEntitiesData, pixelsPerMeter / 4))
        .filter((geometry): geometry is NonNullable<typeof geometry> => geometry !== null)
        .map(geometry => ({ ...geometry.bounds, id: geometry.id, name: geometry.name, corners: geometry.corners })),
    [selectedIds, selectedEntitiesData, entities]);
    const canFrameSelection = selectedIds.length > 0 && selectionOverlays.length === selectedIds.length;
    const groupGizmoPosition = useMemo(() => selectionOverlays.length > 0 ? {
        x: (Math.min(...selectionOverlays.map(bounds => bounds.x))
            + Math.max(...selectionOverlays.map(bounds => bounds.x + bounds.width))) / 2,
        y: (Math.min(...selectionOverlays.map(bounds => bounds.y))
            + Math.max(...selectionOverlays.map(bounds => bounds.y + bounds.height))) / 2
    } : null, [selectionOverlays]);
    const hasCompleteGroupTransform = hasCompleteGroupTransformSelection(selectedIds, selectedEntitiesData);
    const canTransformSelection = selectedIds.length > 0 && selectedIds.every(id => {
        const matrix = getEntityWorldMatrix(id, entities, selectedEntitiesData);
        return matrix !== null && Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) >= 1e-10;
    });

    useEffect(() => {
        const position = selectedIds.length > 1
            ? groupGizmoPosition
            : selectionOverlays.length === 1
                ? { x: selectionOverlays[0].x + selectionOverlays[0].width / 2, y: selectionOverlays[0].y + selectionOverlays[0].height / 2 }
                : selectedEntityData?.transform.position;
        setGizmoPosition(current => {
            if (!position) return current === null ? current : null;
            if (current?.x === position.x && current.y === position.y) return current;
            return { x: position.x, y: position.y };
        });
    }, [selectedEntityData, selectedIds, selectedEntitiesData, groupGizmoPosition, selectionOverlays]);

    useEffect(() => {
        const handleBridgeMessage = (event: MessageEvent) => {
            if (!isSceneViewBridgeMessageSource(event.source, iframeRef.current?.contentWindow)) return;
            const { type, payload } = event.data || {};
            if (type === 'game:viewport-picked' && pendingContextRef.current) {
                const point = pendingContextRef.current;
                pendingContextRef.current = null;
                const targetId = typeof payload?.id === 'string' ? payload.id : null;
                if (targetId && entities[targetId]?.locked) {
                    setContextMenu({ x: point.x, y: point.y, targetId, selectedIds: [targetId] });
                    return;
                }
                const picked = targetId ? sceneContextSelection(targetId, selectedIds, entities)
                    .filter(id => !entities[id]?.locked) : [];
                if (targetId && !picked.length) { setContextMenu(null); return; }
                if (targetId && !selectedIds.includes(targetId)) selectEntities(picked);
                setContextMenu({ x: point.x, y: point.y, targetId, selectedIds: targetId ? picked : selectedIds });
            } else if (type === 'editor:project-resource-request' && payload?.id) {
                const command = payload.kind === 'image' ? 'read_image_asset' : payload.kind === 'audio' ? 'read_audio_asset' : payload.kind === 'text' ? 'read_file' : null;
                const reply = (content: string | null, error: string | null) => {
                    (event.source as WindowProxy | null)?.postMessage({
                        type: 'editor:project-resource-response',
                        payload: { id: payload.id, content, error }
                    }, '*');
                };
                if (!command || typeof payload.path !== 'string') {
                    reply(null, 'Invalid project resource request');
                    return;
                }
                void invoke<string>(command, { path: payload.path })
                    .then(content => reply(content, null))
                    .catch(error => reply(null, String(error)));
            } else if (type === 'editor:scene-diagnostic' && payload) {
                EditorGameRunner.report(payload);
            }
        };

        window.addEventListener('message', handleBridgeMessage);
        return () => window.removeEventListener('message', handleBridgeMessage);
    }, [entities, selectedIds, selectEntities]);

    // Editor Camera State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const baseUrl = neptuneEntryUrl.substring(0, neptuneEntryUrl.lastIndexOf('/') + 1);

    useEffect(() => () => {
        const frameWindow = iframeRef.current?.contentWindow as (Window & { __NEPTUNE_EDITOR_DISPOSE__?: () => void }) | null;
        frameWindow?.__NEPTUNE_EDITOR_DISPOSE__?.();
    }, []);

    useEffect(() => {
        notifyGame('editor:camera-update', { zoom, x: pan.x, y: pan.y });
    }, [zoom, pan, notifyGame]);

    useEffect(() => {
        const handleFrameRequest = (event: Event) => {
            const ids = (event as CustomEvent<{ ids?: string[] }>).detail?.ids;
            if (Array.isArray(ids)) selectEntities(ids);
            requestAnimationFrame(frameSelection);
        };
        window.addEventListener('editor:frame-selection', handleFrameRequest);
        return () => window.removeEventListener('editor:frame-selection', handleFrameRequest);
    });

    const applyTransformEdit = useCallback((id: string, data: Record<string, unknown>) => {
        Object.entries(data).forEach(([field, value]) => updateComponent(id, 'transform', field, value));
    }, [updateComponent]);

    const applyColliderResizeEdit = useCallback((id: string, type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider', width: number, height: number) => {
        const data = type === 'BoxCollider' ? { size: { x: width, y: height } } : { width, height };
        Object.entries(data).forEach(([field, value]) => updateComponent(id, type, field, value));
    }, [updateComponent]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Zoom
        const zoomSpeed = 0.1;
        const delta = e.deltaY < 0 ? zoomSpeed : -zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta));

        // Calculate new Pan to keep (mx, my) at the same World Position
        const newPanX = pan.x + (mx / zoom) - (mx / newZoom);
        const newPanY = pan.y + (my / zoom) - (my / newZoom);

        const newPan = { x: newPanX, y: newPanY };

        setZoom(newZoom);
        setPan(newPan);
        notifyGame('editor:camera-update', { zoom: newZoom, x: newPanX, y: newPanY });
    }, [zoom, pan, notifyGame]);

    const beginGizmoDrag = (operation: GizmoOperation, event: React.MouseEvent<SVGCircleElement>) => {
        if (event.button !== 0 || selectedIds.length === 0 || !selectedEntityData) return;
        if (selectedIds.length > 1 && !hasCompleteGroupTransform) return;
        if (selectedIds.length > 1 && !operation.startsWith('translate')) return;
        const snapshot = captureTransformSnapshot(selectedIds, selectedEntitiesData);
        if (!snapshot) return;
        const matrices = selectedIds.map(id => getEntityWorldMatrix(id, entities, selectedEntitiesData));
        if (matrices.some(matrix => !matrix || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-10)) return;
        const startPositions: Record<string, { x: number; y: number }> = {};
        for (const id of selectedIds) {
            const start = selectedEntitiesData[id]?.transform.position;
            if (!start || !Number.isFinite(start.x) || !Number.isFinite(start.y)) return;
            startPositions[id] = { x: start.x, y: start.y };
        }
        const position = selectedIds.length > 1 ? groupGizmoPosition
            : selectionOverlays[0]
                ? { x: selectionOverlays[0].x + selectionOverlays[0].width / 2, y: selectionOverlays[0].y + selectionOverlays[0].height / 2 }
                : gizmoPosition || selectedEntityData.transform.position;
        if (!position) return;
        gizmoDragRef.current = {
            operation,
            snapshot,
            transaction: beginSceneEdit('Transform drag'),
            size: { width: selectionOverlays[0]?.width || 1, height: selectionOverlays[0]?.height || 1 },
            id: selectedIds[selectedIds.length - 1],
            ids: [...selectedIds],
            startPositions,
            startX: event.clientX,
            startY: event.clientY,
            position: { x: position.x, y: position.y },
            rotation: selectedEntityData.transform.rotation,
            scale: { ...selectedEntityData.transform.scale }
        };
        setIsTransformDragging(true);
        event.preventDefault();
        event.stopPropagation();
    };

    const beginColliderResize = (type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider', event: React.MouseEvent<SVGCircleElement>) => {
        if (event.button !== 0 || selectedIds.length !== 1 || !selectedEntityData) return;
        const component = selectedEntityData.components?.[type];
        const width = component?.width ?? component?.size?.x;
        const height = component?.height ?? component?.size?.y;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
        colliderResizeDragRef.current = {
            id: selectedIds[0],
            type,
            startX: event.clientX,
            startY: event.clientY,
            width,
            height,
            transaction: beginSceneEdit(`Resize ${type}`)
        };
        event.preventDefault();
        event.stopPropagation();
    };

    const resizeColliderWithKeyboard = (
        type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider',
        event: React.KeyboardEvent<SVGCircleElement>
    ) => {
        if (selectedIds.length !== 1 || !selectedEntityData) return;
        const component = selectedEntityData.components?.[type];
        const width = component?.width ?? component?.size?.x;
        const height = component?.height ?? component?.size?.y;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;

        const step = event.shiftKey ? 1 : 0.1;
        let deltaX = 0;
        let deltaY = 0;
        switch (event.key) {
            case 'ArrowLeft': deltaX = -step; break;
            case 'ArrowRight': deltaX = step; break;
            case 'ArrowUp': deltaY = -step; break;
            case 'ArrowDown': deltaY = step; break;
            default: return;
        }

        event.preventDefault();
        event.stopPropagation();
        const size = resizeColliderBounds({ width, height }, deltaX, deltaY, 1);
        const transaction = beginSceneEdit(`Resize ${type}`);
        applyColliderResizeEdit(selectedIds[0], type, size.width, size.height);
        transaction.commit();
    };

    const adjustGizmoWithKeyboard = (
        operation: 'translate-x' | 'translate-y' | 'rotate' | 'scale',
        event: React.KeyboardEvent<SVGCircleElement>
    ) => {
        if (selectedIds.length > 1) {
            if (!hasCompleteGroupTransform) return;
            if (operation !== 'translate-x' && operation !== 'translate-y') return;
            const isX = operation === 'translate-x';
            const validKeys = isX ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
            if (!validKeys.includes(event.key)) return;
            const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
            const delta = direction * (event.shiftKey ? 1 : 0.1);
            event.preventDefault();
            event.stopPropagation();
            const transaction = beginSceneEdit('Move selection');
            selectedIds.forEach(id => {
                const position = selectedEntitiesData[id]?.transform.position;
                if (!position) return;
                const localDelta = worldDeltaToEntityLocal(id, { x: isX ? delta : 0, y: isX ? 0 : delta }, entities, selectedEntitiesData);
                if (localDelta) applyTransformEdit(id, { position: { x: position.x + localDelta.x, y: position.y + localDelta.y } });
            });
            transaction.commit();
            if (groupGizmoPosition) {
                setGizmoPosition({
                    x: groupGizmoPosition.x + (isX ? delta : 0),
                    y: groupGizmoPosition.y + (isX ? 0 : delta)
                });
            }
            return;
        }
        if (selectedIds.length !== 1 || !selectedEntityData) return;

        const transform = selectedEntityData.transform;
        const step = event.shiftKey ? 1 : 0.1;
        let data: Record<string, unknown> = {};
        let worldMove: { x: number; y: number } | null = null;
        if (operation === 'translate-x') {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            worldMove = { x: direction * step, y: 0 };
        } else if (operation === 'translate-y') {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            worldMove = { x: 0, y: direction * step };
        } else if (operation === 'rotate') {
            const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp'
                ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
            if (!direction) return;
            data = { rotation: transform.rotation + direction * step };
        } else {
            const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp'
                ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
            if (!direction) return;
            const scaleFactor = Math.max(0.01, 1 + direction * (event.shiftKey ? 0.5 : 0.1));
            data = { scale: { x: transform.scale.x * scaleFactor, y: transform.scale.y * scaleFactor } };
        }

        event.preventDefault();
        event.stopPropagation();
        const transaction = beginSceneEdit(operation === 'rotate' ? 'Rotate entity' : operation === 'scale' ? 'Scale entity' : 'Move entity');
        if (worldMove) {
            const localDelta = worldDeltaToEntityLocal(selectedIds[0], worldMove, entities, selectedEntitiesData);
            if (!localDelta) { transaction.cancel(); return; }
            data = { position: { x: transform.position.x + localDelta.x, y: transform.position.y + localDelta.y } };
        }
        applyTransformEdit(selectedIds[0], data);
        transaction.commit();
    };

    const handleViewportClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }
        if (e.button !== 0 || e.altKey) return;
        const rect = e.currentTarget.getBoundingClientRect();
        iframeRef.current?.contentWindow?.postMessage({ type: 'editor:viewport-select', payload: {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            excludedIds: Object.values(entities || {}).filter(entity => entity.locked).map(entity => entity.id),
            multi: Boolean(e.shiftKey || e.ctrlKey || e.metaKey)
        } }, '*');
    }, [entities]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && (e.altKey || tool === 'hand'))) {
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    }, [tool]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const colliderDrag = colliderResizeDragRef.current;
        if (colliderDrag) {
            const size = resizeColliderBounds(
                { width: colliderDrag.width, height: colliderDrag.height },
                e.clientX - colliderDrag.startX,
                e.clientY - colliderDrag.startY,
                zoom * pixelsPerMeter
            );
            applyColliderResizeEdit(colliderDrag.id, colliderDrag.type, size.width, size.height);
            return;
        }
        const drag = gizmoDragRef.current;
        if (drag) {
            const deltaX = e.clientX - drag.startX;
            const deltaY = e.clientY - drag.startY;
            if (drag.operation === 'rotate') {
                applyTransformEdit(drag.id, { rotation: drag.rotation + deltaX * 0.01 });
                return;
            }
            if (drag.operation === 'scale') {
                const factor = Math.max(0.01, 1 + (deltaX - deltaY) / 100);
                applyTransformEdit(drag.id, { scale: { x: drag.scale.x * factor, y: drag.scale.y * factor } });
                return;
            }
            const delta = getSceneDragDelta(deltaX, deltaY, { zoom, pixelsPerUnit: pixelsPerMeter, fine: e.shiftKey });
            if (drag.operation === 'rect') {
                applyTransformEdit(drag.id, { scale: resizeSceneScale(drag.scale, drag.size, { x: delta.x * 2, y: delta.y * 2 }, { uniform: e.shiftKey }) });
                return;
            }
            const axis = drag.operation === 'translate-x' ? 'x' : drag.operation === 'translate-y' ? 'y' : 'both';
            const nextPosition = moveScenePosition(drag.position, delta, { axis, snapStep: snapEnabled || e.ctrlKey ? snapStep : null });
            setGizmoPosition(nextPosition);
            const worldDelta = { x: nextPosition.x - drag.position.x, y: nextPosition.y - drag.position.y };
            drag.ids.forEach(id => {
                const start = drag.startPositions[id];
                const localDelta = worldDeltaToEntityLocal(id, worldDelta, entities, selectedEntitiesData);
                if (!localDelta) return;
                applyTransformEdit(id, { position: { x: start.x + localDelta.x, y: start.y + localDelta.y } });
            });
            return;
        }
        if (isPanning) {
            suppressClickRef.current = true;
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;

            // Pan in World Space depends on Zoom
            const worldDx = dx / zoom;
            const worldDy = dy / zoom;

            const newPan = { x: pan.x - worldDx, y: pan.y - worldDy };
            setPan(newPan);
            setLastMousePos({ x: e.clientX, y: e.clientY });

            notifyGame('editor:camera-update', { zoom, x: newPan.x, y: newPan.y });
        }
    };

    const handleMouseUp = () => {
        if (gizmoDragRef.current || colliderResizeDragRef.current) {
            gizmoDragRef.current?.transaction.commit();
            colliderResizeDragRef.current?.transaction.commit();
            gizmoDragRef.current = null;
            colliderResizeDragRef.current = null;
            suppressClickRef.current = true;
        }
        setIsTransformDragging(false);
        setIsPanning(false);
    };

    const resetCamera = () => {
        setPan({ x: 0, y: 0 });
        setZoom(1);
        notifyGame('editor:camera-update', { zoom: 1, x: 0, y: 0 });
    };

    const zoomFromToolbar = (direction: 1 | -1) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nextZoom = Math.max(0.1, Math.min(5, zoom + direction * 0.1));
        const nextPan = zoomAtPoint(pan, zoom, nextZoom, rect.width / 2, rect.height / 2);
        setZoom(nextZoom);
        setPan(nextPan);
        notifyGame('editor:camera-update', { zoom: nextZoom, ...nextPan });
    };

    const panFromToolbar = (direction: 'up' | 'down' | 'left' | 'right') => {
        const step = 40 / zoom;
        const nextPan = {
            x: pan.x + (direction === 'left' ? -step : direction === 'right' ? step : 0),
            y: pan.y + (direction === 'up' ? -step : direction === 'down' ? step : 0)
        };
        setPan(nextPan);
        notifyGame('editor:camera-update', { zoom, ...nextPan });
    };

    const frameSelection = () => {
        if (!canFrameSelection) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const camera = getFramingCamera(selectionOverlays.map(bounds => ({
            ...bounds, x: bounds.x * pixelsPerMeter, y: bounds.y * pixelsPerMeter,
            width: bounds.width * pixelsPerMeter, height: bounds.height * pixelsPerMeter
        })), rect.width, rect.height);
        if (!camera) return;
        setZoom(camera.zoom);
        setPan({ x: camera.x, y: camera.y });
        notifyGame('editor:camera-update', camera);
    };

    const handleViewportContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (gizmoDragRef.current || colliderResizeDragRef.current || isTransformDragging) return;
        const rect = event.currentTarget.getBoundingClientRect();
        pendingContextRef.current = { x: event.clientX, y: event.clientY };
        iframeRef.current?.contentWindow?.postMessage({ type: 'editor:viewport-pick', payload: {
            x: event.clientX - rect.left, y: event.clientY - rect.top,
            clientX: event.clientX, clientY: event.clientY,
            excludedIds: Object.values(entities).filter(entity => entity.locked).map(entity => entity.id)
        } }, '*');
    };

    const handleContextAction = (action: SceneContextAction, request: SceneContextMenuRequest) => {
        const ids = request.selectedIds.length ? request.selectedIds : request.targetId ? [request.targetId] : [];
        if (action === 'select' && request.targetId) selectEntities(ids);
        else if (action === 'frame') window.dispatchEvent(new CustomEvent('editor:frame-selection', { detail: { ids } }));
        else if (action === 'rename' && request.targetId) window.dispatchEvent(new CustomEvent('editor:rename-selection', { detail: { id: request.targetId } }));
        else if (action === 'duplicate') {
            const transaction = beginSceneEdit('Duplicate selection');
            for (const id of ids) duplicateEntityInHierarchy(id);
            transaction.commit();
        } else if (action === 'delete') deleteEntitiesInHierarchy(ids);
        else if (action === 'toggle-active' && request.targetId) {
            const next = entities[request.targetId]?.active === false;
            const transaction = beginSceneEdit(next ? 'Activate selection' : 'Deactivate selection');
            ids.forEach(id => setEntityActiveInHierarchy(id, next));
            transaction.commit();
        } else if (action === 'toggle-lock') {
            const next = ids.some(id => entities[id]?.locked === false);
            const transaction = beginSceneEdit(next ? 'Lock selection' : 'Unlock selection');
            ids.forEach(id => setEntityLocked(id, next));
            transaction.commit();
        } else if (action === 'create-empty') {
            const id = globalThis.crypto?.randomUUID?.() || `entity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            if (addEntityToHierarchy({ id, parentId: 'root', name: 'Entity', type: 'entity', children: [], active: true, locked: false, expanded: false })) {
                selectEntities([id]);
            }
        }
    };

    const cancelDrag = () => {
        const drag = gizmoDragRef.current;
        if (drag) {
            drag.transaction.cancel();
            setGizmoPosition(drag.position);
        }
        const collider = colliderResizeDragRef.current;
        collider?.transaction.cancel();
        gizmoDragRef.current = null;
        colliderResizeDragRef.current = null;
        suppressClickRef.current = true;
        setIsTransformDragging(false);
        setIsPanning(false);
    };

    // Capture keeps one drag alive across dock/viewport boundaries. Mouse handlers
    // remain for keyboard-accessibility harnesses and older pointer implementations.
    const captureGizmo = (operation: GizmoOperation, event: React.PointerEvent<SVGCircleElement>) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        beginGizmoDrag(operation, event);
    };

    useEffect(() => {
        const move = (event: PointerEvent) => {
            if (gizmoDragRef.current || colliderResizeDragRef.current || isPanning) handleMouseMove(event as unknown as React.MouseEvent);
        };
        const up = () => handleMouseUp();
        const key = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && (gizmoDragRef.current || colliderResizeDragRef.current || isPanning)) {
                event.preventDefault(); cancelDrag(); return;
            }
            const panel = containerRef.current;
            if (!panel || panel.offsetParent === null) return;
            const modalOpen = Boolean(document.querySelector('[role="dialog"], dialog[open]'));
            const next = getSceneToolShortcut(event, { modalOpen, activeElement: document.activeElement });
            if (next) { event.preventDefault(); setTool(next); }
            else if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey && !modalOpen
                && !isSceneShortcutTargetBlocked(event.target) && !isSceneShortcutTargetBlocked(document.activeElement)) {
                event.preventDefault(); frameSelection();
            }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', cancelDrag);
        window.addEventListener('keydown', key);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', cancelDrag);
            window.removeEventListener('keydown', key);
        };
    });

    // --- Bridge Script ---
    // Inject Editor Camera logic
    const iframeContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="${baseUrl}" />
    <style>
        body { margin: 0; overflow: hidden; background-color: #000; width: 100vw; height: 100vh; }
        canvas { display: block; width: 100%; height: 100%; }
        .grid {
            position: absolute; inset:0; pointer-events:none; opacity:0.45; z-index:1;
            background-repeat: repeat; background-position: 0 0;
        }
        .axis-x,.axis-y { position:absolute; pointer-events:none; z-index:2; background:rgba(238,91,91,.45); }
        .axis-x { width:1px; top:0; bottom:0; }
        .axis-y { height:1px; left:0; right:0; background:rgba(91,197,126,.45); }
        #neptune-play, #neptune-gamepage { display: none !important; }
        #neptune-canvas { display: block !important; }
    </style>
</head>
<body>
    <div class="grid"></div>
    <div class="axis-x"></div><div class="axis-y"></div>
    <canvas id="neptune-canvas"></canvas>
    
    <script type="module">
        import { Camera } from "${cameraUrl}";
        import { pickEntityAt, updateSelection } from "${scenePickingUrl}";
        import { installProjectResourceBridge } from "${projectResourceBridgeUrl}";
        window.__NEPTUNE_EDITOR_PREVIEW__ = true;
        const { mountAuthoredUI } = await import("${authoredUiUrl}");
        let authoredUIHandle = null;
        let uiCaptureEnabled = false;
        const projectResourceBridge = installProjectResourceBridge();
        const engineModule = await import("${neptuneEntryUrl}");
        window.__neptuneEngineModule = engineModule;
        ${runtimeEntityBridgeScript}
        ${runtimeSelectionBridgeScript}
        const shapeContainsPoint = ${shapeContainsPoint.toString()};
        const pickSceneEntityAt = ${pickRuntimeEntityAt.toString()};
        ${runtimeComponentBridgeScript}
        
        const findEntity = (root, id) => {
             if (!root) return null;
             if (root.id === id) return root;
             if (root.children) {
                 for (const child of root.children) {
                     const found = findEntity(child, id);
                     if (found) return found;
                 }
             }
             return null;
        };
        
        const waitForEngine = () => new Promise(r => {
             const c = () => window.game ? r(window.game) : requestAnimationFrame(c);
             c();
        });

        waitForEngine().then(game => {
             console.log("[SceneView] Game Connected");
             game.clearColor = engineModule.Color.FromHex(0x20262d);
             window.parent.postMessage({ type: 'game:ready' }, '*');
             
             // Cleanup UI
             const cleanup = () => {
                 document.getElementById("neptune-play")?.remove();
                 document.getElementById("neptune-gamepage")?.remove();
                 const c = document.getElementById("neptune-canvas");
                 if(c) c.style.display = 'block';
                 if(document.getElementById("neptune-play")) requestAnimationFrame(cleanup);
             };
             cleanup();

             // Editor Camera
            const editorCamera = new Camera(window.innerWidth, window.innerHeight);
            editorCamera.zoom = 1;
            let editorSelection = [];
             const grid = document.querySelector('.grid');
             const axisX = document.querySelector('.axis-x');
             const axisY = document.querySelector('.axis-y');
             const updateGrid = () => {
                 const zoom = editorCamera.zoom || 1;
                 const major = 64 * zoom;
                 const subdivisions = zoom >= 2.5 ? 4 : zoom >= 1.25 ? 2 : 1;
                 const minor = major / subdivisions;
                 const majorColor = 'rgba(220,230,238,.16)';
                 const minorColor = 'rgba(220,230,238,.075)';
                 const layers = [
                     'linear-gradient(to right, ' + majorColor + ' 1px, transparent 1px)',
                     'linear-gradient(to bottom, ' + majorColor + ' 1px, transparent 1px)'
                 ];
                 const sizes = [major + 'px ' + major + 'px', major + 'px ' + major + 'px'];
                 if (subdivisions > 1) {
                     layers.push('linear-gradient(to right, ' + minorColor + ' 1px, transparent 1px)',
                         'linear-gradient(to bottom, ' + minorColor + ' 1px, transparent 1px)');
                     sizes.push(minor + 'px ' + minor + 'px', minor + 'px ' + minor + 'px');
                 }
                 grid.style.backgroundImage = layers.join(',');
                 grid.style.backgroundSize = sizes.join(',');
                 grid.style.backgroundPosition = new Array(layers.length).fill((-editorCamera.position.x * zoom) + 'px ' + (-editorCamera.position.y * zoom) + 'px').join(',');
                 axisX.style.left = (-editorCamera.position.x * zoom) + 'px';
                 axisY.style.top = (-editorCamera.position.y * zoom) + 'px';
             };
             const disposeAuthoredUI = () => { authoredUIHandle?.dispose(); authoredUIHandle = null; };
             window.__NEPTUNE_EDITOR_DISPOSE__ = () => { disposeAuthoredUI(); projectResourceBridge.dispose?.(); };
             
             // Camera Update Listener
             window.addEventListener('message', (e) => {
                 const { type, payload } = e.data;
                if (type === 'editor:reset-project') {
                    game.resetProject();
                    editorSelection = [];
                    projectResourceBridge.setScenePath('');
                    disposeAuthoredUI();
                }
                else if (type === 'editor:ui-capture') {
                    uiCaptureEnabled = Boolean(payload?.enabled);
                    authoredUIHandle?.setCapture(uiCaptureEnabled);
                    window.dispatchEvent(new CustomEvent('neptune:ui-capture', { detail: { enabled: uiCaptureEnabled } }));
                }
                else if (type === 'editor:viewport-pick') {
                    const selectedId = game.scene && pickSceneEntityAt(game.scene, payload.x, payload.y, ${pixelsPerMeter}, payload.excludedIds || []);
                    window.parent.postMessage({ type: 'game:viewport-picked', payload: { id: selectedId || null, x: payload.clientX, y: payload.clientY } }, '*');
                }
                else if (type === 'editor:select') {
                    editorSelection = updateSelection(payload?.ids, null, true);
                }
                else if (type === 'editor:camera-update') {
                     editorCamera.position.x = payload.x;
                     editorCamera.position.y = payload.y;
                     editorCamera.setZoom(payload.zoom);
                     updateGrid();
                 }
                 else if (type === 'editor:viewport-select') {
                     const selectedId = game.scene && pickSceneEntityAt(game.scene, payload.x, payload.y, ${pixelsPerMeter}, payload.excludedIds || []);
                     editorSelection = updateSelection(editorSelection, selectedId, Boolean(payload.multi));
                     window.parent.postMessage({
                         type: 'game:selection-changed',
                         payload: { ids: editorSelection }
                     }, '*');
                 }
                 else if (type === 'editor:load-scene' && game.loadScene) {
                     disposeAuthoredUI();
                     if (typeof payload.path === 'string') projectResourceBridge.setScenePath(payload.path);
                     game.loadScene(payload.data || payload.path)
                         .then(loaded => {
                             if (loaded === false) return;
                             if (!game.isRunning && game.start) {
                                 // Start only after a scene exists, and keep gameplay behaviors paused in the editor preview.
                                 if (game.pause) game.pause();
                                 game.start();
                             }
                             window.parent.postMessage({ type: 'editor:scene-loaded', payload }, '*');
                             if(game.scene) game.scene.activeCamera = editorCamera; 
                             try { authoredUIHandle = mountAuthoredUI(document.body, game.scene?.ui, { mode: 'scene-preview', captureInput: uiCaptureEnabled }); }
                             catch (error) { window.parent.postMessage({ type: 'editor:scene-diagnostic', payload: { severity: 'error', message: error?.message || String(error), action: 'Fix scene.ui and reopen the scene.' } }, '*'); }
                             updateGrid();
                             window.dispatchEvent(new Event('neptune:editor-selection-ready'));
                         })
                         .catch((error) => {
                             window.parent.postMessage({
                                 type: 'editor:scene-diagnostic',
                                 payload: {
                                     code: error?.code || 'EDITOR_DATA_INVALID',
                                     severity: 'error',
                                     message: error?.message || String(error),
                                     source: error?.sourceLocation,
                                     action: 'Fix the reported data and reopen the scene.'
                                 }
                             }, '*');
                         });
                 }
             });
             
             // Initial Hook
             const hook = () => {
                 if (game.scene) game.scene.activeCamera = editorCamera;
                 requestAnimationFrame(hook);
             };
            updateGrid();
             hook();
             
             // Resize
             window.addEventListener('resize', () => {
                 editorCamera.viewWidth = window.innerWidth;
                 editorCamera.viewHeight = window.innerHeight;
             });
        });
    </script>
</body>
</html>
    `;

    const colliderOverlays = getColliderOverlayBounds(selectedEntityData);
    const spawnFacingMarker = getSpawnPointOverlay(selectedEntityData);
    const activeGizmoPosition = gizmoPosition || (selectedIds.length > 1
        ? groupGizmoPosition
        : selectionOverlays[0]
            ? { x: selectionOverlays[0].x + selectionOverlays[0].width / 2, y: selectionOverlays[0].y + selectionOverlays[0].height / 2 }
            : selectedEntityData?.transform.position);
    const gizmoX = activeGizmoPosition ? (activeGizmoPosition.x * pixelsPerMeter - pan.x) * zoom : 0;
    const gizmoY = activeGizmoPosition ? (activeGizmoPosition.y * pixelsPerMeter - pan.y) * zoom : 0;
    const spawnMarkerX = spawnFacingMarker ? (spawnFacingMarker.x * pixelsPerMeter - pan.x) * zoom : 0;
    const spawnMarkerY = spawnFacingMarker ? (spawnFacingMarker.y * pixelsPerMeter - pan.y) * zoom : 0;
    const spawnMarkerTipX = spawnMarkerX + (spawnFacingMarker?.direction.x || 0) * 24 * zoom;
    const spawnMarkerTipY = spawnMarkerY + (spawnFacingMarker?.direction.y || 0) * 24 * zoom;
    const spawnArrowBaseX = spawnMarkerTipX - (spawnFacingMarker?.direction.x || 0) * 7 * zoom;
    const spawnArrowBaseY = spawnMarkerTipY - (spawnFacingMarker?.direction.y || 0) * 7 * zoom;
    const spawnArrowPerpendicularX = -(spawnFacingMarker?.direction.y || 0) * 5 * zoom;
    const spawnArrowPerpendicularY = (spawnFacingMarker?.direction.x || 0) * 5 * zoom;
    const spawnArrowPath = `M ${spawnMarkerTipX} ${spawnMarkerTipY} L ${spawnArrowBaseX + spawnArrowPerpendicularX} ${spawnArrowBaseY + spawnArrowPerpendicularY} L ${spawnArrowBaseX - spawnArrowPerpendicularX} ${spawnArrowBaseY - spawnArrowPerpendicularY} Z`;

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-w-0 min-h-0 bg-background relative overflow-hidden flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <SceneToolBar tool={tool} onToolChange={setTool} snapEnabled={snapEnabled} onSnapChange={setSnapEnabled} snapStep={snapStep} onSnapStepChange={setSnapStep}
                canUndo={canUndo} canRedo={canRedo} onUndo={undoSceneEdit} onRedo={redoSceneEdit} />
            {isTransformDragging && selectedEntityData && <div data-drag-feedback className="absolute bottom-3 left-3 z-30 rounded border border-border bg-card px-2 py-1 text-xs tabular-nums text-foreground">
                X {selectedEntityData.transform.position.x.toFixed(2)} · Y {selectedEntityData.transform.position.y.toFixed(2)} · {tool}
            </div>}
            {selectedIds.length > 0 && !canTransformSelection && <div role="status" className="absolute bottom-3 left-3 z-30 rounded border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground">
                Transform handles are disabled for a zero-scale parent.
            </div>}
            {/* Floating Controls */}
            <div className="absolute bottom-2 right-2 flex flex-row gap-1 z-20 pointer-events-auto items-center">
                <ThemedIconButton size="sm" aria-label="Capture game UI input" aria-pressed={uiCapture}
                    title={uiCapture ? 'UI input captured; click to return to scene editing' : 'Allow authored UI preview to receive input'}
                    onClick={() => {
                        const enabled = !uiCapture;
                        setUiCapture(enabled);
                        iframeRef.current?.contentWindow?.postMessage({ type: 'editor:ui-capture', payload: { enabled } }, '*');
                    }} className={uiCapture ? 'ring-1 ring-primary text-foreground' : ''}>UI</ThemedIconButton>
                <div className="bg-black/50 text-[11px] text-white px-1.5 py-0.5 rounded text-center select-none">
                    {Math.round(zoom * 100)}%
                </div>
                <ThemedIconButton size="sm" onClick={frameSelection} disabled={!canFrameSelection} title="Frame Selection" aria-label="Frame Selection">
                    <Maximize className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={() => panFromToolbar('left')} title="Pan Left" aria-label="Pan Left">
                    <ChevronLeft className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={() => panFromToolbar('right')} title="Pan Right" aria-label="Pan Right">
                    <ChevronRight className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={() => panFromToolbar('up')} title="Pan Up" aria-label="Pan Up">
                    <ChevronUp className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={() => panFromToolbar('down')} title="Pan Down" aria-label="Pan Down">
                    <ChevronDown className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={() => zoomFromToolbar(1)} title="Zoom In" aria-label="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={() => zoomFromToolbar(-1)} title="Zoom Out" aria-label="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" onClick={resetCamera} title="Reset View">
                    <Maximize className="w-4 h-4" />
                </ThemedIconButton>
            </div>

            <div
                data-scene-viewport
                className={`flex-1 min-h-0 relative ${tool === 'hand' ? 'cursor-grab' : 'cursor-crosshair'}`}
                onPointerDown={event => {
                    if (event.button === 1 || (event.button === 0 && (tool === 'hand' || event.altKey))) {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        handleMouseDown(event);
                    }
                }}
                onMouseDown={handleMouseDown}
                onClick={handleViewportClick}
                onContextMenu={handleViewportContextMenu}
                onWheel={handleWheel}
            >
                <iframe
                    ref={iframeRef}
                    className={`w-full h-full border-0 block select-none ${uiCapture ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    srcDoc={iframeContent}
                    title="Scene View"
                    sandbox="allow-scripts allow-same-origin allow-modals"
                />
                <ProjectExtensionLayer
                    worldToScreen={point => ({ x: (point.x * pixelsPerMeter - pan.x) * zoom, y: (point.y * pixelsPerMeter - pan.y) * zoom })}
                    screenToWorld={point => ({ x: (point.x / zoom + pan.x) / pixelsPerMeter, y: (point.y / zoom + pan.y) / pixelsPerMeter })}
                />
                {selectionOverlays.length > 0 && (
                    <svg
                        aria-label="Selected entities"
                        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                    >
                        {selectionOverlays.map(worldBounds => {
                            const points = worldBounds.corners.map(point => `${(point.x * pixelsPerMeter - pan.x) * zoom},${(point.y * pixelsPerMeter - pan.y) * zoom}`).join(' ');
                            return (
                            <polygon
                                key={worldBounds.id}
                                aria-label={`Selected ${worldBounds.name || worldBounds.id}`}
                                data-selection-outline={worldBounds.id}
                                points={points}
                                fill="none"
                                stroke="hsl(var(--selection, 199 89% 65%))"
                                strokeWidth={1}
                                strokeDasharray={selectedIds.length > 1 ? '5 3' : undefined}
                                vectorEffect="non-scaling-stroke"
                            />
                            );
                        })}
                    </svg>
                )}
                <SceneContextMenu
                    request={contextMenu}
                    targetName={contextMenu?.targetId ? entities[contextMenu.targetId]?.name : undefined}
                    isActive={contextMenu?.targetId ? entities[contextMenu.targetId]?.active : true}
                    isLocked={contextMenu?.targetId ? entities[contextMenu.targetId]?.locked : false}
                    onAction={handleContextAction}
                    onClose={() => setContextMenu(null)}
                />
                {selectedIds.length > 0 && canTransformSelection && activeGizmoPosition
                    && tool !== 'hand' && (selectedIds.length === 1 || hasCompleteGroupTransform) && (
                    <svg
                        aria-label={selectedIds.length > 1 ? 'Move selected entities' : 'Move selected entity'}
                        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                    >
                        {selectedIds.length === 1 && spawnFacingMarker && (
                            <g
                                role="img"
                                aria-label={`Selected Spawn Point facing ${spawnFacingMarker.facing}`}
                                data-spawn-facing={spawnFacingMarker.facing}
                                pointerEvents="none"
                            >
                                <circle
                                    cx={spawnMarkerX}
                                    cy={spawnMarkerY}
                                    r={7 * zoom}
                                    fill="#fbbf24"
                                    stroke="#111"
                                    strokeWidth={1.5 * zoom}
                                />
                                <line
                                    data-spawn-facing-arrow="shaft"
                                    x1={spawnMarkerX}
                                    y1={spawnMarkerY}
                                    x2={spawnMarkerTipX}
                                    y2={spawnMarkerTipY}
                                    stroke="#fbbf24"
                                    strokeWidth={3 * zoom}
                                />
                                <path d={spawnArrowPath} fill="#fbbf24" />
                            </g>
                        )}
                        {selectedIds.length === 1 && (tool === 'rect' || tool === 'transform') && colliderOverlays.map((bounds) => (
                            <g key={bounds.type}>
                                <rect
                                    aria-label={`Selected ${bounds.type} bounds`}
                                    data-collider-role={bounds.type}
                                    x={(bounds.x * pixelsPerMeter - pan.x) * zoom}
                                    y={(bounds.y * pixelsPerMeter - pan.y) * zoom}
                                    width={bounds.width * pixelsPerMeter * zoom}
                                    height={bounds.height * pixelsPerMeter * zoom}
                                    fill={bounds.color}
                                    fillOpacity={0.12}
                                    stroke={bounds.color}
                                    strokeWidth={1.5}
                                    strokeDasharray={bounds.type === 'TriggerCollider' ? '5 3' : undefined}
                                >
                                    <title>{bounds.type} bounds</title>
                                </rect>
                                <circle
                                    aria-label={`Resize ${bounds.type} bounds`}
                                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
                                    data-collider-resize-handle={bounds.type}
                                    cx={((bounds.x + bounds.width) * pixelsPerMeter - pan.x) * zoom}
                                    cy={((bounds.y + bounds.height) * pixelsPerMeter - pan.y) * zoom}
                                    r="5"
                                    fill={bounds.color}
                                    stroke="#111"
                                    strokeWidth="1.5"
                                    className="pointer-events-auto cursor-nwse-resize"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => beginColliderResize(bounds.type, event)}
                                    onKeyDown={(event) => resizeColliderWithKeyboard(bounds.type, event)}
                                />
                            </g>
                        ))}
                        <circle data-gizmo-origin cx={gizmoX} cy={gizmoY} r="3" fill="#e5edf5" />
                        {(tool === 'move' || tool === 'transform') && <>
                        <line x1={gizmoX} y1={gizmoY} x2={gizmoX + 56} y2={gizmoY} stroke="#ff5b5b" strokeWidth="3" />
                        <line x1={gizmoX} y1={gizmoY} x2={gizmoX} y2={gizmoY + 56} stroke="#55c878" strokeWidth="3" />
                        <circle
                            cx={gizmoX + 56}
                            cy={gizmoY}
                            r="7"
                            fill="#ff5b5b"
                            className="pointer-events-auto cursor-ew-resize focus-visible:stroke-white focus-visible:stroke-[5px]"
                            aria-label="Translate on X axis"
                            aria-description="Arrow Left/Right move 0.1 world units; hold Shift to move 1 world unit."
                            aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => beginGizmoDrag('translate-x', event)}
                            onPointerDown={(event) => captureGizmo('translate-x', event)}
                            onKeyDown={(event) => adjustGizmoWithKeyboard('translate-x', event)}
                        />
                        <circle
                            cx={gizmoX}
                            cy={gizmoY + 56}
                            r="7"
                            fill="#55c878"
                            className="pointer-events-auto cursor-ns-resize focus-visible:stroke-white focus-visible:stroke-[5px]"
                            aria-label="Translate on Y axis"
                            aria-description="Arrow Up/Down move 0.1 world units; hold Shift to move 1 world unit."
                            aria-keyshortcuts="ArrowUp ArrowDown Shift+ArrowUp Shift+ArrowDown"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => beginGizmoDrag('translate-y', event)}
                            onPointerDown={(event) => captureGizmo('translate-y', event)}
                            onKeyDown={(event) => adjustGizmoWithKeyboard('translate-y', event)}
                        />
                        <circle cx={gizmoX} cy={gizmoY} r="9" fill="#e2eaf0" stroke="#28333d" strokeWidth="2"
                            role="button" tabIndex={0} aria-label="Move selected entity freely" className="pointer-events-auto cursor-move"
                            onMouseDown={event => beginGizmoDrag('translate', event)} onPointerDown={event => captureGizmo('translate', event)} />
                        </>}
                        {selectedIds.length === 1 && (
                            <>
                                {(tool === 'rotate' || tool === 'transform') && <circle
                                    cx={gizmoX}
                                    cy={gizmoY}
                                    r="34"
                                    style={{ pointerEvents: 'all' }}
                                    fill="none"
                                    stroke="#6e8bff"
                                    strokeWidth="3"
                                    className="pointer-events-auto cursor-grab focus-visible:stroke-white focus-visible:stroke-[5px]"
                                    aria-label="Rotate selected entity"
                                    aria-description="Arrow keys rotate 0.1 radians; hold Shift to rotate 1 radian."
                                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => beginGizmoDrag('rotate', event)}
                            onPointerDown={(event) => captureGizmo('rotate', event)}
                                    onKeyDown={(event) => adjustGizmoWithKeyboard('rotate', event)}
                                />}
                                {(tool === 'scale' || tool === 'transform') && <circle
                                    cx={gizmoX + 48}
                                    cy={gizmoY + 48}
                                    r="7"
                                    fill="#6e8bff"
                                    className="pointer-events-auto cursor-nwse-resize focus-visible:stroke-white focus-visible:stroke-[5px]"
                                    aria-label="Scale selected entity"
                                    aria-description="Arrow keys change scale by 10%; hold Shift to change scale by 50%."
                                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => beginGizmoDrag('scale', event)}
                            onPointerDown={(event) => captureGizmo('scale', event)}
                                    onKeyDown={(event) => adjustGizmoWithKeyboard('scale', event)}
                                />}
                                {tool === 'rect' && selectionOverlays[0] && <circle
                                    cx={((selectionOverlays[0].x + selectionOverlays[0].width) * pixelsPerMeter - pan.x) * zoom}
                                    cy={((selectionOverlays[0].y + selectionOverlays[0].height) * pixelsPerMeter - pan.y) * zoom}
                                    r="8" fill="#63c6d2" stroke="#182027" strokeWidth="2" role="button" tabIndex={0}
                                    aria-label="Resize selected entity" className="pointer-events-auto cursor-nwse-resize"
                                    onMouseDown={event => beginGizmoDrag('rect', event)} onPointerDown={event => captureGizmo('rect', event)}
                                    onKeyDown={event => adjustGizmoWithKeyboard('scale', event)} />}
                            </>
                        )}
                    </svg>
                )}
            </div>
        </div>
    );
}
