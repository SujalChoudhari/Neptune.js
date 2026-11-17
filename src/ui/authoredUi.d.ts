export const AUTHORED_UI_VERSION: 1;
export interface AuthoredUIElement {
    id: string;
    type: 'panel' | 'text' | 'button';
    x: number;
    y: number;
    width: number;
    height: number;
    anchor: { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom' };
    zIndex: number;
    visible: boolean;
    text: string;
    color: string;
    background: string;
    fontSize: number;
    fontFamily: string;
    align: 'left' | 'center' | 'right';
    action: string | null;
}
export interface AuthoredUI { version: 1; elements: AuthoredUIElement[] }
export function validateAuthoredUI(value: unknown): AuthoredUI;
export function mountAuthoredUI(host: HTMLElement, source: unknown, options?: {
    mode?: 'game' | 'scene-preview';
    captureInput?: boolean;
    onCaptureChange?: (captured: boolean) => void;
}): { element: HTMLDivElement; mode: string; captureInput: boolean; setCapture(next: boolean): boolean; dispose(): void };
