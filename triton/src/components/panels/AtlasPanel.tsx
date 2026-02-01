import { type IDockviewPanelProps } from "dockview"
import {
    ThemedMenuButton,
    ThemedIconButton,
    ThemedInput,
    ThemedNumberInput,
    ThemedLabeledInput,
    ThemedVectorInput,
    ThemedTextArea,
    ThemedSlider,
    ThemedCheckbox,
    ThemedToggle,
    ThemedSelect,
    ThemedCollapsible,
    ThemedScrollArea,
    ThemedColorPicker,
    ThemedContextMenu,
    ThemedContextMenuTrigger,
    ThemedContextMenuContent,
    ThemedContextMenuItem,
    ThemedContextMenuSeparator,
    ThemedContextMenuLabel,
    ThemedContextMenuShortcut,
    useModal
} from "@/components/library"
import { Play, Pause, Square, Plus, Minus, Search, Home, Save, Settings, Trash2 } from "lucide-react"
import { useState } from "react"

import { renderInspectorComponent } from "./inspector/InspectorRegistry"
import type { ComponentId, MockEntity } from "./inspector/shared/types"

/**
 * ATLAS PANEL
 * A Component Library panel that displays Triton's themed UI components.
 * Useful for testing and implementing components in other tools.
 */
export const AtlasPanel = (_props: IDockviewPanelProps) => {
    const { showModal } = useModal()

    // Demo state for interactive components
    const [sliderValue, setSliderValue] = useState(50)
    const [checkboxValue, setCheckboxValue] = useState(true)
    const [toggleValue, setToggleValue] = useState(false)
    const [selectValue, setSelectValue] = useState("option1")
    const [numberValue, setNumberValue] = useState(10)
    const [vectorValue, setVectorValue] = useState({ x: 0, y: 1.5, z: 0 })
    const [colorValue, setColorValue] = useState("#6b8cff")
    const [textAreaValue, setTextAreaValue] = useState("Multi-line text\neditor example")

    // PREVIEW ENTITY for Inspector Components
    const previewEntity: MockEntity = {
        name: "Preview_Entity",
        active: true,
        transform: {
            position: { x: 128, y: 256 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        },
        sprite: { path: "player.png", width: 64, height: 64, blendMode: "Normal" },
        collider: { width: 48, height: 56, offsetX: 8, offsetY: 4, isTrigger: false },
        body: { velocityX: 0, velocityY: 0, gravity: 980, maxFallSpeed: 800, friction: 90, drag: 98, grounded: true },
        sound: { name: "Jump", src: "jump.wav", volume: 80, loop: false, playing: false },
        stats: { health: 85, maxHealth: 100, stamina: 60, maxStamina: 100, attack: 15, defense: 8, speed: 120 },
        animator: { currentAnimation: "idle", speed: 100, playing: true, animations: ["idle", "walk", "run"] },
        scripts: [
            { path: "/scripts/player_controller.js", enabled: true },
            { path: "/scripts/camera_follow.js", enabled: true }
        ]
    }

    const componentList: (ComponentId)[] = ["transform", "sprite", "collider", "body", "sound", "stats", "animator", "scripts"]

    return (
        <ThemedScrollArea maxHeight="100%" className="h-full w-full bg-card p-4">
            <div className="space-y-6">
                <div className="border-b border-border pb-4">
                    <h1 className="text-xl font-bold text-foreground uppercase tracking-tight">Component Atlas</h1>
                    <p className="text-sm text-muted-foreground">Triton's localized themed component library</p>
                </div>

                {/* THEMED BUTTONS */}
                <ThemedCollapsible title="Global Buttons" defaultOpen>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Menu Buttons</p>
                            <div className="flex flex-wrap gap-2">
                                <ThemedMenuButton>Normal</ThemedMenuButton>
                                <ThemedMenuButton hasDropdown>Dropdown</ThemedMenuButton>
                                <ThemedMenuButton disabled>Disabled</ThemedMenuButton>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Icon Buttons (sm / md / lg)</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <ThemedIconButton size="sm"><Play className="w-2.5 h-2.5 fill-current" /></ThemedIconButton>
                                <ThemedIconButton size="md"><Pause className="w-3 h-3 fill-current" /></ThemedIconButton>
                                <ThemedIconButton size="lg"><Square className="w-3.5 h-3.5 fill-current" /></ThemedIconButton>
                                <div className="w-px h-4 bg-border mx-1" />
                                <ThemedIconButton><Home className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Plus className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Minus className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Search className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Save className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Settings className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Trash2 className="w-3 h-3" /></ThemedIconButton>
                            </div>
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* TEXT INPUTS */}
                <ThemedCollapsible title="Text Inputs" defaultOpen>
                    <div className="space-y-3 max-w-sm">
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Basic Input</p>
                            <ThemedInput placeholder="Enter text..." />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Labeled Inputs</p>
                            <div className="space-y-2">
                                <ThemedLabeledInput label="Name" placeholder="GameObject" />
                                <ThemedLabeledInput label="Tag" placeholder="Untagged" />
                                <ThemedLabeledInput label="Layer" placeholder="Default" disabled />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Text Area</p>
                            <ThemedTextArea
                                value={textAreaValue}
                                onChange={(e) => setTextAreaValue(e.target.value)}
                                placeholder="Enter multi-line text..."
                            />
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* NUMBER INPUTS */}
                <ThemedCollapsible title="Number & Vector Inputs" defaultOpen>
                    <div className="space-y-4">
                        <div className="max-w-xs">
                            <p className="text-xs text-muted-foreground mb-2">Number with Spinners</p>
                            <ThemedNumberInput
                                value={numberValue}
                                onChange={setNumberValue}
                                min={0}
                                max={100}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground mb-4">Vector Inputs (High-Contrast Labels)</p>

                            <div className="space-y-2">
                                <ThemedVectorInput
                                    dimensions={2}
                                    label="Position"
                                    value={vectorValue}
                                    onChange={setVectorValue}
                                    step={0.1}
                                />
                            </div>

                            <div className="space-y-2">
                                <ThemedVectorInput
                                    dimensions={2}
                                    label="Collider Size"
                                    labels={['W', 'H']}
                                    value={vectorValue}
                                    onChange={setVectorValue}
                                    step={0.1}
                                />
                            </div>
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* CONTROLS */}
                <ThemedCollapsible title="Controls" defaultOpen>
                    <div className="space-y-3 max-w-sm">
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Slider: {sliderValue}</p>
                            <ThemedSlider
                                value={sliderValue}
                                onChange={setSliderValue}
                                min={0}
                                max={100}
                            />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Checkbox</p>
                            <div className="flex gap-4">
                                <ThemedCheckbox
                                    checked={checkboxValue}
                                    onChange={setCheckboxValue}
                                    label="Is Active"
                                />
                                <ThemedCheckbox
                                    checked={false}
                                    label="Is Static"
                                    disabled
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Toggle</p>
                            <div className="flex gap-4">
                                <ThemedToggle
                                    checked={toggleValue}
                                    onChange={setToggleValue}
                                    label="Enable Physics"
                                />
                                <ThemedToggle
                                    checked={true}
                                    label="Visible"
                                    disabled
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Select</p>
                            <ThemedSelect
                                value={selectValue}
                                onChange={setSelectValue}
                                options={[
                                    { value: "option1", label: "Default Layer" },
                                    { value: "option2", label: "UI Layer" },
                                    { value: "option3", label: "Player Layer" },
                                    { value: "option4", label: "Enemy Layer" },
                                ]}
                            />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Color Picker</p>
                            <ThemedColorPicker
                                value={colorValue}
                                onChange={setColorValue}
                            />
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* CONTEXT MENU */}
                <ThemedCollapsible title="Context Menu" defaultOpen={false}>
                    <ThemedContextMenu>
                        <ThemedContextMenuTrigger className="w-full h-32 rounded-md border border-dashed border-border flex items-center justify-center bg-accent/5 hover:bg-accent/10 transition-colors cursor-context-menu">
                            <span className="text-sm text-muted-foreground">Right-click here to test context menu</span>
                        </ThemedContextMenuTrigger>
                        <ThemedContextMenuContent>
                            <ThemedContextMenuItem>Back</ThemedContextMenuItem>
                            <ThemedContextMenuItem disabled>Forward</ThemedContextMenuItem>
                            <ThemedContextMenuItem>Reload</ThemedContextMenuItem>
                            <ThemedContextMenuSeparator />
                            <ThemedContextMenuLabel inset>Options</ThemedContextMenuLabel>
                            <ThemedContextMenuItem inset>
                                Save As... <ThemedContextMenuShortcut>Ctrl+S</ThemedContextMenuShortcut>
                            </ThemedContextMenuItem>
                            <ThemedContextMenuItem inset>Print</ThemedContextMenuItem>
                        </ThemedContextMenuContent>
                    </ThemedContextMenu>
                </ThemedCollapsible>

                {/* MODALS */}
                <ThemedCollapsible title="Modals & Dialogs" defaultOpen>
                    <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">Global Modal System via useModal()</p>
                        <div className="flex flex-wrap gap-2">
                            <ThemedMenuButton onClick={() => showModal({
                                title: "Confirmation Modal",
                                content: "Are you sure you want to perform this action? This can be used for destructive operations like deleting an entity.",
                                confirmText: "Delete",
                                onConfirm: () => console.log("Confirmed delete")
                            })}>
                                Show Confirmation
                            </ThemedMenuButton>

                            <ThemedMenuButton onClick={() => showModal({
                                title: "Input Modal",
                                content: (
                                    <div className="space-y-4">
                                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">New Entity Name</p>
                                        <ThemedInput placeholder="Enter gameobject name..." className="w-full" autoFocus />
                                        <p className="text-[10px] text-muted-foreground italic">Try entering a unique name for your gameobject.</p>
                                    </div>
                                ),
                                confirmText: "Create Entity",
                                onConfirm: () => console.log("Created entity")
                            })}>
                                Show Input Modal
                            </ThemedMenuButton>
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* REAL INSPECTOR COMPONENTS */}
                <ThemedCollapsible title="Live Inspector Modules" defaultOpen>
                    <div className="flex flex-col border border-border rounded overflow-hidden">
                        {componentList.map((compId, index) => renderInspectorComponent({
                            compId,
                            index,
                            entity: previewEntity,
                            isActive: true,
                            onToggleActive: () => { },
                            updateHelpers: {
                                updateTransform: () => { },
                                updateSprite: () => { },
                                updateCollider: () => { },
                                updateBody: () => { },
                                updateSound: () => { },
                                updateStats: () => { },
                                updateAnimator: () => { },
                                updateScript: () => { }
                            },
                            moveHelpers: {
                                onMoveUp: () => { },
                                onMoveDown: () => { }
                            }
                        }))}
                    </div>
                </ThemedCollapsible>

                {/* COLOR PALETTE */}
                <ThemedCollapsible title="Theme Colors" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: "bg", class: "bg-background" },
                            { name: "card", class: "bg-card" },
                            { name: "muted", class: "bg-muted" },
                            { name: "accent", class: "bg-accent" },
                            { name: "border", class: "bg-border" },
                        ].map(({ name, class: cls }) => (
                            <div key={name} className="flex flex-col items-center gap-1">
                                <div className={`w-10 h-10 rounded border ${cls}`} />
                                <span className="text-[10px] text-muted-foreground">{name}</span>
                            </div>
                        ))}
                    </div>
                </ThemedCollapsible>
            </div>
        </ThemedScrollArea>
    )
}

