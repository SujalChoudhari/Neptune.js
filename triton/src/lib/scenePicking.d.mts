export function translateOnAxis(
    position: { x: number; y: number },
    deltaX: number,
    deltaY: number,
    zoom: number,
    axis: 'x' | 'y'
): { x: number; y: number };
export function zoomAtPoint(
    pan: { x: number; y: number },
    zoom: number,
    nextZoom: number,
    screenX: number,
    screenY: number
): { x: number; y: number };
export function getFramingCamera(
    bounds: Array<{ x: number; y: number; width: number; height: number }>,
    viewportWidth: number,
    viewportHeight: number,
    padding?: number,
    minZoom?: number,
    maxZoom?: number
): { zoom: number; x: number; y: number } | null;
export function resizeColliderBounds(
    size: { width: number; height: number },
    deltaX: number,
    deltaY: number,
    zoom: number,
    minSize?: number
): { width: number; height: number };
export function pickEntityAt(root: unknown, x: number, y: number, tolerance?: number): unknown;
export function updateSelection(currentIds: unknown, selectedId: unknown, additive?: boolean): string[];
export function hasCompleteGroupTransformSelection(ids: unknown, entitiesData: unknown): boolean;
export interface EntitySelectionBounds {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export function getEntitySelectionBounds(entity: unknown, fallbackSize?: number): EntitySelectionBounds | null;
export interface SceneAffineMatrix { a: number; b: number; c: number; d: number; e: number; f: number }
export interface EntityWorldSelectionGeometry { id: string; name: string; matrix: SceneAffineMatrix; corners: Array<{ x: number; y: number }>; bounds: EntitySelectionBounds }
export function getEntityWorldMatrix(id: string, hierarchy: Record<string, any>, data: Record<string, any>, includeSelf?: boolean): SceneAffineMatrix | null;
export function getEntityWorldSelectionGeometry(id: string, hierarchy: Record<string, any>, data: Record<string, any>, fallbackSize?: number): EntityWorldSelectionGeometry | null;
export function worldDeltaToEntityLocal(id: string, delta: { x: number; y: number }, hierarchy: Record<string, any>, data: Record<string, any>): { x: number; y: number } | null;
export interface ColliderOverlayBounds {
    type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider' | 'BoxCollider';
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export function getColliderOverlayBounds(entity: unknown): ColliderOverlayBounds[];
export function isSceneViewBridgeMessageSource(source: MessageEventSource | null, iframeWindow: Window | null | undefined): boolean;
