import { DockviewReact, type DockviewReadyEvent, type IDockviewPanelProps, type DockviewApi } from "dockview";
import "dockview/dist/styles/dockview.css";
import { themeDark } from "dockview";
import { useRef, useEffect } from "react";
import { StoryBook } from "@/components/panels/StoryBook";
import { ProjectPanel } from "@/components/panels/ProjectPanel";
import { InspectorPanel } from "@/components/panels/InspectorPanel";
import { ConsolePanel } from "@/components/panels/ConsolePanel";
import { HierarchyPanel } from "@/components/panels/HierarchyPanel";
import { GameViewPanel } from "@/components/panels/GameViewPanel";
import { useSettings } from "@/components/context/SettingsContext";

const ViewportPanel = (_props: IDockviewPanelProps) => (
    <div className="h-full w-full bg-[#1a1a1a] relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-2 left-2 flex gap-1 z-10">
            <span className="bg-black/50 text-white px-2 py-0.5 rounded text-xs backdrop-blur-sm">Perspective</span>
            <span className="bg-black/50 text-white px-2 py-0.5 rounded text-xs backdrop-blur-sm">Lit</span>
        </div>
        {/* Grid Background Mock */}
        <div className="text-white/20 select-none pointer-events-none">
            (Viewport Canvas Area)
        </div>
    </div>
);


// --- MAIN LAYOUT ---

interface DockLayoutProps {
    onApiReady?: (api: DockviewApi) => void;
}

export const DockLayout = ({ onApiReady }: DockLayoutProps) => {
    const dockApiRef = useRef<DockviewApi | null>(null);
    const { focusGameOnPlay, focusConsoleOnPlay, maximizeGameOnPlay } = useSettings();

    // Store layout state before maximizing to restore it later
    const layoutStateRef = useRef<any>(null);

    useEffect(() => {
        const onPlay = () => {
            const api = dockApiRef.current;
            if (!api) return;

            // 1. Focus Game Panel
            if (focusGameOnPlay) {
                const gamePanel = api.getPanel('game');
                if (gamePanel) {
                    gamePanel.api.setActive();
                }
            }

            // 2. Focus Console Panel
            if (focusConsoleOnPlay) {
                const consolePanel = api.getPanel('console');
                if (consolePanel) {
                    consolePanel.api.setActive();
                }
            }

            // 3. Maximize Game View
            if (maximizeGameOnPlay) {
                const gamePanel = api.getPanel('game');
                if (gamePanel) {
                    // There isn't a direct "maximize" API that hides others easily without extensive layout manipulation.
                    // However, we can use `api.maximizeGroup(gamePanel.group)` if it exists, or simulated via CSS/Layout.
                    // Dockview has `panel.api.maximize()` (if supported by the version) or we can just try to expand it.

                    // Note: As of typical dockview versions, maximize is often a user interaction.
                    // We can try: `gamePanel.group.api.maximize()`

                    // Let's safe check
                    const group = gamePanel.group;
                    // @ts-ignore - API capability check
                    if (group && group.api.maximize) {
                        // @ts-ignore
                        group.api.maximize();
                    }
                }
            }
        };

        const onStop = () => {
            const api = dockApiRef.current;
            if (!api) return;

            // Restore if maximized (Dockview usually handles toggle)
            if (maximizeGameOnPlay) {
                const gamePanel = api.getPanel('game');
                if (gamePanel) {
                    const group = gamePanel.group;
                    // @ts-ignore
                    if (group && group.api.isMaximized && group.api.exitMaximized) {
                        // @ts-ignore
                        group.api.exitMaximized();
                    }
                }
            }
        };

        window.addEventListener('editor:play', onPlay);
        window.addEventListener('editor:stop', onStop);

        return () => {
            window.removeEventListener('editor:play', onPlay);
            window.removeEventListener('editor:stop', onStop);
        };
    }, [focusGameOnPlay, focusConsoleOnPlay, maximizeGameOnPlay]);

    const applyLayout = (type: 'default' | 'animation' | 'debug') => {
        const api = dockApiRef.current;
        if (!api) return;

        api.clear();

        if (type === 'default') {
            const mainPanel = api.addPanel({
                id: 'viewport',
                component: 'viewport',
                title: 'Scene View'
            });

            api.addPanel({
                id: 'game',
                component: 'game',
                title: 'Game View',
                position: { referencePanel: mainPanel, direction: 'within' }
            });

            api.addPanel({
                id: 'hierarchy',
                component: 'hierarchy',
                title: 'Hierarchy',
                position: { referencePanel: mainPanel, direction: 'left' },
                initialWidth: 250
            });

            api.addPanel({
                id: 'inspector',
                component: 'inspector',
                title: 'Inspector',
                position: { referencePanel: mainPanel, direction: 'right' },
                initialWidth: 300
            });

            api.addPanel({
                id: 'console',
                component: 'console',
                title: 'Console',
                position: { referencePanel: mainPanel, direction: 'below' },
                initialHeight: 300
            });

            api.addPanel({
                id: 'project',
                component: 'project',
                title: 'Project',
                position: { referencePanel: 'console', direction: 'within' }
            });

            // Activate Scene View by default
            mainPanel.api.setActive();

        } else if (type === 'animation') {
            // ... (Keep existing layouts)
            const viewport = api.addPanel({
                id: 'viewport',
                component: 'viewport',
                title: 'Scene View'
            });

            api.addPanel({
                id: 'animator',
                component: 'inspector',
                title: 'Timeline',
                position: { referencePanel: viewport, direction: 'below' },
                initialHeight: 300
            });

            api.addPanel({
                id: 'inspector',
                component: 'inspector',
                title: 'Inspector',
                position: { referencePanel: viewport, direction: 'right' },
                initialWidth: 300
            });

        } else if (type === 'debug') {
            api.addPanel({
                id: 'atlas',
                component: 'atlas',
                title: 'Atlas'
            });
        }
    };

    const onReady = (event: DockviewReadyEvent) => {
        dockApiRef.current = event.api;

        // Expose API to parent with Layout Switcher
        if (onApiReady) {
            const extendedApi = event.api as any;
            extendedApi.applyLayout = applyLayout;
            onApiReady(extendedApi);
        }

        applyLayout('default');
    };

    return (
        <div className="h-full w-full border-t border-border">
            <DockviewReact
                components={componentMap}
                onReady={onReady}
                theme={themeDark}
                className="dockview-theme-dark h-full w-full"
            />
        </div>
    );
};

const componentMap = {
    hierarchy: HierarchyPanel,
    viewport: ViewportPanel,
    inspector: InspectorPanel,
    console: ConsolePanel,
    project: ProjectPanel,
    atlas: StoryBook,
    game: GameViewPanel,
};

export type NeptuneDockApi = DockviewApi & { applyLayout: (type: 'default' | 'animation' | 'debug') => void };
export type { DockviewApi };
