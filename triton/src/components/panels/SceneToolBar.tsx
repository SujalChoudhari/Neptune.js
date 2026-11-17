import { SCENE_TOOLS } from '@/lib/sceneTools.mjs';
import type { SceneTool } from '@/lib/sceneTools.mjs';
import { Hand, Move, RotateCw, Maximize2, SquareDashed, Combine, Undo2, Redo2 } from 'lucide-react';
import { ThemedIconButton, themedButtonBase, themedInputBase } from '@/components/library';

const toolIcons = { hand: Hand, move: Move, rotate: RotateCw, scale: Maximize2, rect: SquareDashed, transform: Combine };

interface SceneToolBarProps {
    tool: SceneTool;
    onToolChange: (tool: SceneTool) => void;
    snapEnabled: boolean;
    onSnapChange: (enabled: boolean) => void;
    snapStep: number;
    onSnapStepChange: (step: number) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

/** Screen-space editor controls. This toolbar never participates in camera transforms. */
export function SceneToolBar({ tool, onToolChange, snapEnabled, onSnapChange, snapStep, onSnapStepChange, canUndo, canRedo, onUndo, onRedo }: SceneToolBarProps) {
    return (
        <div data-scene-toolbar className="absolute top-2 left-2 z-30 flex flex-wrap items-center gap-1 pointer-events-none">
            <div role="toolbar" aria-label="Scene tools" className="pointer-events-auto flex items-center gap-px rounded border border-border bg-card/95 p-px">
                {SCENE_TOOLS.map(item => {
                    const Icon = toolIcons[item.id];
                    return <ThemedIconButton
                        key={item.id}
                        size="sm"
                        type="button"
                        data-scene-tool={item.id}
                        aria-label={`${item.label} tool (${item.key})`}
                        aria-keyshortcuts={item.key.toLowerCase()}
                        aria-pressed={tool === item.id}
                        title={`${item.description} (${item.key})`}
                        onClick={() => onToolChange(item.id)}
                        className={`shrink-0 rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${tool === item.id ? 'ring-1 ring-primary text-foreground shadow-inner' : ''}`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </ThemedIconButton>;
                })}
            </div>
            <div role="group" aria-label="Scene snapping" className="pointer-events-auto flex h-7 items-center gap-1 rounded border border-border bg-card/95 px-1">
                <button type="button" aria-label="Snap to grid" aria-pressed={snapEnabled} title="Snap movement to the configured world-unit grid" onClick={() => onSnapChange(!snapEnabled)} className={`${themedButtonBase} h-6 rounded-[3px] px-1.5 text-[11px] focus-visible:outline-2 focus-visible:outline-primary ${snapEnabled ? 'ring-1 ring-primary text-foreground' : 'text-muted-foreground'}`}>Snap</button>
                <input
                    type="number"
                    aria-label="Snap increment in world units"
                    title="Grid increment in world units"
                    min="0.01"
                    step="0.05"
                    value={snapStep}
                    onChange={event => {
                        const next = event.currentTarget.valueAsNumber;
                        if (Number.isFinite(next) && next > 0) onSnapStepChange(next);
                    }}
                    className={`${themedInputBase} h-6 w-14 rounded-[3px] px-1 text-[11px] tabular-nums text-foreground`}
                />
            </div>
            <div role="group" aria-label="Scene edit history" className="pointer-events-auto flex items-center gap-px rounded border border-border bg-card/95 p-px">
                <ThemedIconButton size="sm" type="button" aria-label="Undo scene edit" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
                    <Undo2 className="h-3.5 w-3.5" />
                </ThemedIconButton>
                <ThemedIconButton size="sm" type="button" aria-label="Redo scene edit" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo}>
                    <Redo2 className="h-3.5 w-3.5" />
                </ThemedIconButton>
            </div>
        </div>
    );
}
