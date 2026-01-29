import { useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'

export function Viewport() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const zoom = useStore((state) => state.editor.zoom)
    const panX = useStore((state) => state.editor.panX)
    const panY = useStore((state) => state.editor.panY)

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        // Resize canvas to fit container
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                canvas.width = entry.contentRect.width
                canvas.height = entry.contentRect.height
                draw()
            }
        })
        resizeObserver.observe(container)

        return () => resizeObserver.disconnect()
    }, [])

    useEffect(() => {
        draw()
    }, [zoom, panX, panY])

    const draw = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { width, height } = canvas

        // Clear
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, width, height)

        // Draw grid
        ctx.save()
        ctx.translate(width / 2 + panX, height / 2 + panY)
        ctx.scale(zoom, zoom)

        // Grid
        const gridSize = 32
        const gridExtent = 2000
        ctx.strokeStyle = '#2a2a4a'
        ctx.lineWidth = 1 / zoom

        for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
            ctx.beginPath()
            ctx.moveTo(x, -gridExtent)
            ctx.lineTo(x, gridExtent)
            ctx.stroke()
        }

        for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
            ctx.beginPath()
            ctx.moveTo(-gridExtent, y)
            ctx.lineTo(gridExtent, y)
            ctx.stroke()
        }

        // Origin lines
        ctx.strokeStyle = '#4a90e2'
        ctx.lineWidth = 2 / zoom
        ctx.beginPath()
        ctx.moveTo(-gridExtent, 0)
        ctx.lineTo(gridExtent, 0)
        ctx.stroke()

        ctx.strokeStyle = '#27ae60'
        ctx.beginPath()
        ctx.moveTo(0, -gridExtent)
        ctx.lineTo(0, gridExtent)
        ctx.stroke()

        // Demo entity (placeholder)
        ctx.fillStyle = '#4a90e2'
        ctx.fillRect(-32, -32, 64, 64)
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Player', 0, 0)

        ctx.restore()

        // Zoom indicator
        ctx.fillStyle = '#a1a1aa'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.round(zoom * 100)}%`, width - 8, height - 8)
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-[var(--bg-primary)] overflow-hidden"
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                onWheel={(e) => {
                    // Zoom with wheel
                    const delta = e.deltaY > 0 ? 0.9 : 1.1
                    useStore.getState().setEditor({
                        zoom: Math.max(0.1, Math.min(5, zoom * delta)),
                    })
                }}
            />
        </div>
    )
}
