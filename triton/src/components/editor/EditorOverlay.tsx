import type { CSSProperties, PointerEvent } from "react";

export type EditorOverlayDrawing =
    | { type: "rect"; x: number; y: number; width: number; height: number; color?: string; fill?: string; strokeWidth?: number }
    | { type: "circle"; x: number; y: number; radius: number; color?: string; fill?: string; strokeWidth?: number }
    | { type: "line"; x1: number; y1: number; x2: number; y2: number; color?: string; strokeWidth?: number }
    | { type: "text"; x: number; y: number; text: string; color?: string };

export type EditorOverlayObject = { id: string; x: number; y: number; width?: number; height?: number; label?: string };

interface EditorOverlayProps {
    drawings?: EditorOverlayDrawing[];
    objects?: EditorOverlayObject[];
    worldToScreen?: (point: { x: number; y: number }) => { x: number; y: number };
    onPointerDown?: (point: { x: number; y: number }, event: PointerEvent<SVGSVGElement>) => void;
    className?: string;
}

const identity = (point: { x: number; y: number }) => point;
const safeColor = (value: string | undefined, fallback: string) => value && /^#[\da-f]{3}(?:[\da-f]{3})?$|^(?:red|green|blue|orange|yellow|white|black|cyan|magenta|transparent)$/i.test(value) ? value : fallback;

/** Editor-only SVG layer. Its data is owned by the extension host, not a scene. */
export function EditorOverlay({ drawings = [], objects = [], worldToScreen = identity, onPointerDown, className }: EditorOverlayProps) {
    const toScreen = (x: number, y: number) => worldToScreen({ x, y });
    const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
        if (!onPointerDown) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        onPointerDown({ x: event.clientX - bounds.left, y: event.clientY - bounds.top }, event);
    };
    return <svg
        className={className}
        data-editor-overlay="true"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: onPointerDown ? "auto" : "none", zIndex: 30 } as CSSProperties}
    >
        {drawings.map((drawing, index) => {
            const color = safeColor(drawing.color, "#70d8c0");
            if (drawing.type === "rect") {
                const p = toScreen(drawing.x, drawing.y);
                const edge = toScreen(drawing.x + drawing.width, drawing.y + drawing.height);
                return <rect key={`draw-${index}`} x={p.x} y={p.y} width={edge.x - p.x} height={edge.y - p.y} fill={safeColor(drawing.fill, "transparent")} stroke={color} strokeWidth={drawing.strokeWidth || 1.5} />;
            }
            if (drawing.type === "circle") {
                const p = toScreen(drawing.x, drawing.y);
                const radius = toScreen(drawing.x + drawing.radius, drawing.y);
                return <circle key={`draw-${index}`} cx={p.x} cy={p.y} r={Math.abs(radius.x - p.x)} fill={safeColor(drawing.fill, "transparent")} stroke={color} strokeWidth={drawing.strokeWidth || 1.5} />;
            }
            if (drawing.type === "line") {
                const a = toScreen(drawing.x1, drawing.y1);
                const b = toScreen(drawing.x2, drawing.y2);
                return <line key={`draw-${index}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={drawing.strokeWidth || 1.5} />;
            }
            const p = toScreen(drawing.x, drawing.y);
            return <text key={`draw-${index}`} x={p.x} y={p.y} fill={color} fontSize="12">{drawing.text}</text>;
        })}
        {objects.map(object => {
            const p = toScreen(object.x, object.y);
            const edge = toScreen(object.x + (object.width || 12), object.y + (object.height || 12));
            return <g key={object.id} data-editor-only-object={object.id}>
                <rect x={p.x} y={p.y} width={edge.x - p.x} height={edge.y - p.y} fill="rgba(64,196,170,.12)" stroke="#40c4aa" strokeDasharray="4 3" />
                {object.label && <text x={p.x + 4} y={p.y - 4} fill="#b6f3e7" fontSize="11">{object.label}</text>}
            </g>;
        })}
    </svg>;
}
