import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { cn } from '@/lib/utils'

// Toolbar
import { Toolbar } from './Toolbar'
// Left panel
import { HierarchyPanel } from './panels/HierarchyPanel'
import { LayersPanel } from './panels/LayersPanel'
// Center
import { Viewport } from './Viewport'
// Right panel
import { InspectorPanel } from './panels/InspectorPanel'
// Bottom panel
import { AssetsPanel } from './panels/AssetsPanel'
import { ConsolePanel } from './panels/ConsolePanel'
// Main
import { useStore } from '@/store/useStore'
import { WelcomeScreen } from './WelcomeScreen'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function EditorLayout() {
    const isProjectOpen = useStore((state) => state.project.isOpen)

    if (!isProjectOpen) {
        return <WelcomeScreen />
    }

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
            {/* Toolbar */}
            <Toolbar />

            {/* Main Content */}
            <PanelGroup direction="vertical" className="flex-1">
                {/* Top Area: Left + Center + Right */}
                <Panel defaultSize={75} minSize={40}>
                    <PanelGroup direction="horizontal">
                        {/* Left Panel: Hierarchy + Layers */}
                        <Panel defaultSize={15} minSize={10} maxSize={30}>
                            <PanelGroup direction="vertical">
                                <Panel defaultSize={50} minSize={20}>
                                    <HierarchyPanel />
                                </Panel>
                                <ResizeHandle direction="vertical" />
                                <Panel defaultSize={50} minSize={20}>
                                    <LayersPanel />
                                </Panel>
                            </PanelGroup>
                        </Panel>

                        <ResizeHandle direction="horizontal" />

                        {/* Center: Viewport */}
                        <Panel defaultSize={60} minSize={30}>
                            <Viewport />
                        </Panel>

                        <ResizeHandle direction="horizontal" />

                        {/* Right Panel: Inspector */}
                        <Panel defaultSize={25} minSize={15} maxSize={40}>
                            <InspectorPanel />
                        </Panel>
                    </PanelGroup>
                </Panel>

                <ResizeHandle direction="vertical" />

                {/* Bottom Panel: Assets, Console, etc. */}
                <Panel defaultSize={25} minSize={10} maxSize={50}>
                    <BottomPanel />
                </Panel>
            </PanelGroup>
        </div>
    )
}

// Resize Handle Component
function ResizeHandle({ direction }: { direction: 'horizontal' | 'vertical' }) {
    return (
        <PanelResizeHandle
            className={cn(
                'transition-colors hover:bg-[var(--accent-primary)]',
                direction === 'horizontal' ? 'w-1' : 'h-1',
                'bg-transparent data-[resize-handle-active]:bg-[var(--accent-primary)]'
            )}
        />
    )
}

// Bottom Panel with Tabs
function BottomPanel() {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
            <Tabs defaultValue="assets" className="flex-1 flex flex-col">
                <TabsList className="h-8 border-b border-[var(--border-color)] rounded-none">
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="console">Console</TabsTrigger>
                    <TabsTrigger value="animation">Animation</TabsTrigger>
                    <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
                </TabsList>
                <TabsContent value="assets" className="flex-1 p-0 m-0">
                    <AssetsPanel />
                </TabsContent>
                <TabsContent value="console" className="flex-1 p-0 m-0">
                    <ConsolePanel />
                </TabsContent>
                <TabsContent value="animation" className="flex-1 p-0 m-0">
                    <div className="p-4 text-[var(--text-secondary)]">Animation Timeline</div>
                </TabsContent>
                <TabsContent value="dialogue" className="flex-1 p-0 m-0">
                    <div className="p-4 text-[var(--text-secondary)]">Dialogue Editor</div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
