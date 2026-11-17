import { useState } from 'react';
import type { EntityData } from '@/types/engine';
import { useEditorExtensionRegistrations } from '@/lib/editorExtensionStore';
import { EditorGameRunner } from '@/lib/editorGameRunner';
import { themedInputBase } from '@/components/library/ThemedInput';
import { useGameContext } from '@/context/GameContext';

/** Version-one drawers expose named numeric values through read/edit methods. */
export function ExtensionInspector({ entity, disabled = false }: { entity: EntityData; disabled?: boolean }) {
    const { inspectors } = useEditorExtensionRegistrations();
    const { isPlaying } = useGameContext();
    const [error, setError] = useState('');
    return <>{inspectors.map(registration => {
        const drawer = registration.value;
        if (typeof drawer?.component !== 'string' || !Object.keys(entity.components || {}).some(key => key.toLowerCase() === drawer.component.toLowerCase())
            || typeof drawer.read !== 'function' || typeof drawer.edit !== 'function') return null;
        let values: Record<string, unknown>;
        try { values = drawer.read(entity); }
        catch { return <p key={`${registration.extensionId}:${registration.id}`} className="px-2 text-xs text-red-400">Extension Inspector unavailable.</p>; }
        if (!values || typeof values !== 'object' || Array.isArray(values)) return null;
        const label = String(drawer.label || drawer.component);
        return <section key={`${registration.extensionId}:${registration.id}`} data-extension-inspector={registration.id} className="border-b border-border px-2 py-1.5">
            <div className="mb-1 text-[11px] font-medium text-foreground">{label}</div>
            <div className="flex gap-2">{Object.entries(values).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)).map(([field, value]) =>
                <label key={field} className="flex min-w-0 flex-1 items-center gap-1 text-[10px] text-muted-foreground">
                    <span>{field.toUpperCase()}</span>
                    <input type="number" step="0.1" value={value as number} disabled={disabled || isPlaying} aria-label={`${label} ${field.toUpperCase()}`} className={`${themedInputBase} h-6 min-w-0 w-full px-1 text-xs`} onChange={event => {
                        const number = event.target.valueAsNumber;
                        if (!Number.isFinite(number)) return;
                        try {
                            const changed = drawer.edit(entity.id, { ...values, [field]: number });
                            setError(changed === false ? 'The extension rejected this value.' : '');
                        } catch (failure) {
                            setError('The extension could not apply this value.');
                            EditorGameRunner.report(failure);
                        }
                    }} />
                </label>
            )}</div>
        </section>;
    })}{error && <p role="alert" className="px-2 py-1 text-[10px] text-red-400">{error}</p>}</>;
}
