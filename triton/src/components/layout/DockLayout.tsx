import { DockviewReact, type DockviewReadyEvent, type IDockviewPanelProps, type DockviewApi } from "dockview";
import "dockview/dist/styles/dockview.css";
import { themeDark } from "dockview";
import { useRef } from "react";
import { AtlasPanel } from "@/components/panels/AtlasPanel";
import { ProjectPanel } from "@/components/panels/ProjectPanel";
import { InspectorPanel } from "@/components/panels/InspectorPanel";
import { ConsolePanel } from "@/components/panels/ConsolePanel";
import { HierarchyPanel } from "@/components/panels/HierarchyPanel";

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
                initialHeight: 200
            });

            api.addPanel({
                id: 'project',
                component: 'project',
                title: 'Project',
                position: { referencePanel: 'console', direction: 'within' }
            });
        } else if (type === 'animation') {
            const viewport = api.addPanel({
                id: 'viewport',
                component: 'viewport',
                title: 'Scene View'
            });

            api.addPanel({
                id: 'animator',
                component: 'inspector', // Shared component for demo
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
    atlas: AtlasPanel,
};

// Re-export extended API type
export type NeptuneDockApi = DockviewApi & { applyLayout: (type: 'default' | 'animation' | 'debug') => void };
export type { DockviewApi };
