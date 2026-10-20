export function translateOnAxis(
    position: { x: number; y: number },
    deltaX: number,
    deltaY: number,
    zoom: number,
    axis: 'x' | 'y'
): { x: number; y: number };
export function pickEntityAt(root: unknown, x: number, y: number, tolerance?: number): unknown;
export interface ColliderOverlayBounds {
    type: 'Hitbox' | 'Hurtbox' | 'TriggerCollider';
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export function getColliderOverlayBounds(entity: unknown): ColliderOverlayBounds[];
export function isSceneViewBridgeMessageSource(source: MessageEventSource | null, iframeWindow: Window | null | undefined): boolean;
