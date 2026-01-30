import { DockviewReact, type DockviewReadyEvent, type IDockviewPanelProps, type DockviewApi } from "dockview";
import "dockview/dist/styles/dockview.css";
import { themeDark } from "dockview";
import { Folder, Box, Settings } from "lucide-react";
import { AtlasPanel } from "@/components/panels/AtlasPanel";

// --- PLACEHOLDER COMPONENTS (We will extract these later) ---

const HierarchyPanel = (_props: IDockviewPanelProps) => (
    <div className="h-full w-full bg-card flex flex-col text-sm">
        <div className="p-2 border-b bg-muted/50 font-bold flex items-center gap-2">
            <Folder className="w-4 h-4 text-foreground/70" /> Hierarchy
        </div>
        <div className="p-2 space-y-1 overflow-auto flex-1">
            {/* Mock Tree */}
            <div className="pl-0 text-foreground">Main Scene</div>
            <div className="pl-4 text-muted-foreground">Main Camera</div>
            <div className="pl-4 text-muted-foreground">Directional Light</div>
            <div className="pl-4 text-foreground font-medium">Player_Character</div>
            <div className="pl-4 text-muted-foreground">Level_Geometry</div>
        </div>
    </div>
);

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

const InspectorPanel = (_props: IDockviewPanelProps) => (
    <div className="h-full w-full bg-card flex flex-col">
        <div className="p-2 border-b bg-muted/50 font-bold flex items-center gap-2">
            <Settings className="w-4 h-4 text-foreground/70" /> Inspector
        </div>
        <div className="p-4 space-y-4 overflow-auto flex-1 text-xs">
            <div className="flex items-center gap-2 mb-4">
                <Box className="w-8 h-8 text-foreground/50" />
                <div className="font-bold text-lg">Player_Character</div>
            </div>

            <div className="space-y-2">
                <div className="bg-muted/30 p-2 rounded border border-border">
                    <div className="font-bold mb-2 text-muted-foreground">Transform</div>
                    <div className="grid grid-cols-[60px_1fr] gap-2 items-center mb-1">
                        <span>Pos</span>
                        <div className="grid grid-cols-3 gap-1">
                            <input className="bg-input rounded px-1 text-center" value="0.0" readOnly />
                            <input className="bg-input rounded px-1 text-center" value="1.5" readOnly />
                            <input className="bg-input rounded px-1 text-center" value="-5.0" readOnly />
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 p-2 rounded border border-border border-l-2 border-l-orange-400">
                    <div className="font-bold mb-2 text-orange-400">PlayerController (Script)</div>
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                        <span>Speed</span> <input type="range" className="accent-foreground" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const ConsolePanel = (_props: IDockviewPanelProps) => (
    <div className="h-full w-full bg-card flex flex-col font-mono text-xs">
        <div className="p-1 border-b bg-muted/50 flex gap-2">
            <button className="px-2 py-0.5 hover:bg-muted rounded">Clear</button>
            <button className="px-2 py-0.5 hover:bg-muted rounded text-red-400">Errors (0)</button>
        </div>
        <div className="p-2 overflow-auto flex-1 text-muted-foreground">
            <div>[10:45:22] Triton Engine initialized successfully.</div>
            <div>[10:45:23] Loaded scene 'Level_01'.</div>
        </div>
    </div>
);

// --- MAIN LAYOUT ---

interface DockLayoutProps {
    onApiReady?: (api: DockviewApi) => void;
}

export const DockLayout = ({ onApiReady }: DockLayoutProps) => {
    const onReady = (event: DockviewReadyEvent) => {
        const api = event.api;

        // Expose API to parent
        if (onApiReady) {
            onApiReady(api);
        }

        // Create default layout
        api.clear();

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
            component: 'console',
            title: 'Project',
            position: { referencePanel: 'console', direction: 'within' }
        });
    };

    const components = {
        hierarchy: HierarchyPanel,
        viewport: ViewportPanel,
        inspector: InspectorPanel,
        console: ConsolePanel,
        atlas: AtlasPanel,
    };

    return (
        <div className="h-[calc(100vh-60px)] w-full">
            <DockviewReact
                components={components}
                onReady={onReady}
                theme={themeDark}
            />
        </div>
    );
};

// Re-export DockviewApi type for consumers
export type { DockviewApi };
