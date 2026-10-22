export function translateOnAxis(
    position: { x: number; y: number },
    deltaX: number,
    deltaY: number,
    zoom: number,
    axis: 'x' | 'y'
): { x: number; y: number };
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
